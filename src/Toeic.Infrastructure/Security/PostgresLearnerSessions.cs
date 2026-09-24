using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Toeic.Application;
using Toeic.Infrastructure.Persistence;

namespace Toeic.Infrastructure.Security;

public sealed class PostgresLearnerSessions(IDbConnectionFactory connections, TimeProvider clock)
    : ILearnerSessions
{
    private readonly PasswordHasher<string> hasher = new();
    // Verify a real hash even for unknown accounts; never disclose account status.
    private readonly string dummyHash = new PasswordHasher<string>()
        .HashPassword("dummy", Convert.ToHexString(RandomNumberGenerator.GetBytes(32)));

    public async Task<SessionToken?> LoginAsync(string email, string password, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(email) || email.Length > 254 ||
            string.IsNullOrEmpty(password) || password.Length > 1024) return null;
        var normalized = email.Trim().Normalize(NormalizationForm.FormKC).ToUpperInvariant();
        await using var connection = await connections.OpenAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);
        await using var find = connection.Query("""
            select id, password_hash, status, email_verified_at,
                   failed_login_count, login_locked_until
            from identity_data.users where email_normalized = @email for update;
            """, transaction, ("email", normalized));
        Guid userId;
        string storedHash;
        bool active;
        int failures;
        DateTimeOffset? lockedUntil;
        await using (var reader = await find.ExecuteReaderAsync(ct))
        {
            if (!await reader.ReadAsync(ct))
            {
                hasher.VerifyHashedPassword(normalized, dummyHash, password);
                return null;
            }
            userId = reader.GetGuid(0);
            storedHash = reader.GetString(1);
            active = reader.GetString(2) == "Active" && !reader.IsDBNull(3);
            failures = reader.GetInt32(4);
            lockedUntil = reader.IsDBNull(5) ? null : reader.GetFieldValue<DateTimeOffset>(5);
        }
        var now = clock.GetUtcNow();
        if (!active || lockedUntil > now)
        {
            hasher.VerifyHashedPassword(normalized, dummyHash, password);
            return null;
        }
        PasswordVerificationResult verified;
        try { verified = hasher.VerifyHashedPassword(normalized, storedHash, password); }
        catch (FormatException) { verified = PasswordVerificationResult.Failed; }
        if (verified == PasswordVerificationResult.Failed)
        {
            var count = lockedUntil.HasValue ? 1 : Math.Min(failures + 1, 5);
            await using var failure = connection.Query("""
                update identity_data.users set failed_login_count = @count,
                    login_locked_until = @until where id = @id;
                """, transaction, ("count", count), ("until", count >= 5 ? now.AddMinutes(15) : null),
                ("id", userId));
            await failure.ExecuteNonQueryAsync(ct);
            await transaction.CommitAsync(ct);
            return null;
        }

        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var expires = now.AddHours(8);
        await using var update = connection.Query("""
            update identity_data.users
            set failed_login_count = 0, login_locked_until = null, password_hash = @hash
            where id = @id;
            insert into identity_data.learner_sessions
                (id, user_id, token_hash, created_at, expires_at)
            values (@session, @id, @token, @now, @expires);
            """, transaction, ("id", userId), ("session", Guid.NewGuid()), ("token", Hash(token)),
            ("now", now), ("expires", expires),
            ("hash", verified == PasswordVerificationResult.SuccessRehashNeeded
                ? hasher.HashPassword(normalized, password) : storedHash));
        await update.ExecuteNonQueryAsync(ct);
        await transaction.CommitAsync(ct);
        return new SessionToken(token, expires);
    }

    public async Task<RegisterResult> RegisterAsync(
        string displayName, string email, string password, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(displayName) || displayName.Trim().Length < 2 || displayName.Length > 100)
            return new RegisterResult(false, "INVALID_DISPLAY_NAME", "Tên hiển thị phải có từ 2 đến 100 ký tự.");

        if (string.IsNullOrWhiteSpace(email) || email.Length > 254 || !email.Contains('@'))
            return new RegisterResult(false, "INVALID_EMAIL", "Địa chỉ email không hợp lệ.");

        if (string.IsNullOrEmpty(password) || password.Length < 12 || password.Length > 128)
            return new RegisterResult(false, "PASSWORD_REQUIREMENT", "Mật khẩu phải chứa ít nhất 12 ký tự.");

        var normalized = email.Trim().Normalize(NormalizationForm.FormKC).ToUpperInvariant();
        var trimmedName = displayName.Trim();

        await using var connection = await connections.OpenAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        await using var checkCmd = connection.Query("""
            select id from identity_data.users where email_normalized = @email;
            """, transaction, ("email", normalized));
        await using (var checkReader = await checkCmd.ExecuteReaderAsync(ct))
        {
            if (await checkReader.ReadAsync(ct))
            {
                return new RegisterResult(false, "EMAIL_EXISTS", "Địa chỉ email này đã được sử dụng trên hệ thống.");
            }
        }

        var userId = Guid.NewGuid();
        var now = clock.GetUtcNow();
        var passwordHash = hasher.HashPassword(normalized, password);

        await using var insertUser = connection.Query("""
            insert into identity_data.users
                (id, email_normalized, password_hash, display_name, timezone, status, email_verified_at, created_at, failed_login_count)
            values
                (@id, @email, @hash, @name, 'Asia/Ho_Chi_Minh', 'Active', @verifiedAt, @createdAt, 0);
            """, transaction,
            ("id", userId),
            ("email", normalized),
            ("hash", passwordHash),
            ("name", trimmedName),
            ("verifiedAt", now),
            ("createdAt", now));
        await insertUser.ExecuteNonQueryAsync(ct);

        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var expires = now.AddHours(8);
        var sessionId = Guid.NewGuid();

        await using var insertSession = connection.Query("""
            insert into identity_data.learner_sessions
                (id, user_id, token_hash, created_at, expires_at)
            values (@session, @id, @token, @now, @expires);
            """, transaction,
            ("session", sessionId),
            ("id", userId),
            ("token", Hash(token)),
            ("now", now),
            ("expires", expires));
        await insertSession.ExecuteNonQueryAsync(ct);

        await transaction.CommitAsync(ct);

        return new RegisterResult(true, null, null, new SessionToken(token, expires));
    }

    public async Task<LearnerSession?> AuthenticateAsync(string token, CancellationToken ct)
    {
        if (token.Length != 64 || token.Any(c => !char.IsAsciiHexDigit(c))) return null;
        await using var connection = await connections.OpenAsync(ct);
        await using var command = connection.Query("""
            select u.id, s.id, u.display_name
            from identity_data.learner_sessions s
            join identity_data.users u on u.id = s.user_id
            where s.token_hash = @hash and s.revoked_at is null and s.expires_at > @now
              and u.status = 'Active' and u.email_verified_at is not null;
            """, null, ("hash", Hash(token)), ("now", clock.GetUtcNow()));
        await using var reader = await command.ExecuteReaderAsync(ct);
        return await reader.ReadAsync(ct)
            ? new LearnerSession(reader.GetGuid(0), reader.GetGuid(1), reader.GetString(2)) : null;
    }

    public async Task RevokeAsync(Guid userId, Guid sessionId, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = connection.Query("""
            update identity_data.learner_sessions set revoked_at = coalesce(revoked_at, @now)
            where id = @session and user_id = @user;
            """, null, ("now", clock.GetUtcNow()), ("session", sessionId), ("user", userId));
        await command.ExecuteNonQueryAsync(ct);
    }

    private static string Hash(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
