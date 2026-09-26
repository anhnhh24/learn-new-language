using System.Data.Common;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Toeic.Application;
using Toeic.Domain.Content;
using Toeic.Infrastructure.Persistence;

namespace Toeic.Infrastructure.Security;

public sealed class PostgresAccountLifecycle(
    IDbConnectionFactory connections, IDataProtectionProvider protection,
    AccountMailOptions options, TimeProvider clock) : IAccountLifecycle
{
    private readonly PasswordHasher<string> hasher = new();
    private readonly IDataProtector protector = protection.CreateProtector("Toeic.AccountMail.v1");

    public async Task RegisterAsync(AccountRegistration request, CancellationToken ct)
    {
        var email = NormalizeEmail(request.Email);
        ValidatePassword(request.Password);
        if (string.IsNullOrWhiteSpace(request.DisplayName) ||
            request.DisplayName.Trim().Length is < 2 or > 100)
            throw new DomainException("DISPLAY_NAME_INVALID");
        if (!request.TermsAccepted) throw new DomainException("TERMS_CONSENT_REQUIRED");
        RequireMail();
        // Hash even for duplicate accounts. Responses never disclose account existence.
        var passwordHash = hasher.HashPassword(email, request.Password);
        await using var db = await connections.OpenAsync(ct);
        await using var tx = await db.BeginTransactionAsync(ct);
        await using var insert = db.Query("""
            insert into identity_data.users
                (id,email_normalized,password_hash,display_name,status)
            values (@id,@email,@hash,@name,'PendingVerification')
            on conflict (email_normalized) do nothing;
            """, tx, ("id", Guid.NewGuid()), ("email", email),
            ("hash", passwordHash), ("name", request.DisplayName.Trim()));
        await insert.ExecuteNonQueryAsync(ct);
        var user = await FindUserAsync(db, tx, email, ct);
        if (user is { Status: "PendingVerification" } &&
            !await RecentlyRequestedAsync(db, tx, user.Id, "VerifyEmail", ct))
        {
            // The latest registration credentials belong to the latest verification link.
            await using var update = db.Query("""
                update identity_data.users set password_hash = @hash, display_name = @name
                where id = @id;
                insert into identity_data.terms_consents(user_id,version,accepted_at)
                values (@id,@version,@now) on conflict (user_id,version) do nothing;
                """, tx, ("id", user.Id), ("hash", passwordHash),
                ("name", request.DisplayName.Trim()), ("version", options.TermsVersion),
                ("now", clock.GetUtcNow()));
            await update.ExecuteNonQueryAsync(ct);
            await QueueAsync(db, tx, user.Id, email, "VerifyEmail", ct);
        }
        await tx.CommitAsync(ct);
    }

    public async Task RequestEmailAsync(string input, bool passwordReset, CancellationToken ct)
    {
        var email = NormalizeEmail(input);
        RequireMail();
        await using var db = await connections.OpenAsync(ct);
        await using var tx = await db.BeginTransactionAsync(ct);
        var user = await FindUserAsync(db, tx, email, ct);
        var purpose = passwordReset ? "ResetPassword" : "VerifyEmail";
        if (user is not null &&
            (passwordReset ? user.Status == "Active" : user.Status == "PendingVerification") &&
            !await RecentlyRequestedAsync(db, tx, user.Id, purpose, ct))
            await QueueAsync(db, tx, user.Id, email, purpose, ct);
        await tx.CommitAsync(ct);
    }

    public Task VerifyEmailAsync(string token, CancellationToken ct) =>
        ConsumeAsync(token, null, ct);

    public Task ResetPasswordAsync(string token, string password, CancellationToken ct)
    {
        ValidatePassword(password);
        return ConsumeAsync(token, password, ct);
    }

    private async Task ConsumeAsync(string token, string? password, CancellationToken ct)
    {
        if (token is null || token.Length != 64 || token.Any(c => !char.IsAsciiHexDigit(c)))
            throw new DomainException("ACCOUNT_TOKEN_INVALID");
        var purpose = password is null ? "VerifyEmail" : "ResetPassword";
        var now = clock.GetUtcNow();
        await using var db = await connections.OpenAsync(ct);
        await using var tx = await db.BeginTransactionAsync(ct);
        // Lock users before tokens, consistently with issuance and login.
        await using var lookup = db.Query("""
            select u.id,u.email_normalized,u.status
            from identity_data.users u join identity_data.account_tokens t on t.user_id = u.id
            where t.token_hash = @hash and t.purpose = @purpose for update of u;
            """, tx, ("hash", Hash(token)), ("purpose", purpose));
        Guid userId;
        string email, status;
        await using (var reader = await lookup.ExecuteReaderAsync(ct))
        {
            if (!await reader.ReadAsync(ct)) throw new DomainException("ACCOUNT_TOKEN_INVALID");
            userId = reader.GetGuid(0);
            email = reader.GetString(1);
            status = reader.GetString(2);
        }
        if (status != (password is null ? "PendingVerification" : "Active"))
            throw new DomainException("ACCOUNT_TOKEN_INVALID");
        await using var consume = db.Query("""
            update identity_data.account_tokens set consumed_at = @now
            where token_hash = @hash and purpose = @purpose and consumed_at is null and expires_at > @now;
            """, tx, ("hash", Hash(token)), ("purpose", purpose), ("now", now));
        if (await consume.ExecuteNonQueryAsync(ct) != 1) throw new DomainException("ACCOUNT_TOKEN_INVALID");
        await using var update = db.Query(password is null ? """
            update identity_data.users set status = 'Active', email_verified_at = @now where id = @user;
            """ : """
            update identity_data.users
            set password_hash = @password, failed_login_count = 0, login_locked_until = null where id = @user;
            """, tx, ("user", userId), ("now", now),
            ("password", password is null ? "" : hasher.HashPassword(email, password)));
        await update.ExecuteNonQueryAsync(ct);
        await using var revoke = db.Query("""
            update identity_data.account_tokens set consumed_at = coalesce(consumed_at,@now)
            where user_id = @user;
            update identity_data.learner_sessions set revoked_at = coalesce(revoked_at,@now)
            where user_id = @user;
            update identity_data.admin_sessions set revoked_at=coalesce(revoked_at,@now) where user_id=@user;
            update identity_data.sessions set revoked_at = coalesce(revoked_at,@now)
            where user_id = @user;
            update identity_data.account_mail_outbox m
            set protected_payload = null, failed_at = coalesce(failed_at,@now)
            from identity_data.account_tokens t
            where m.token_id = t.id and t.user_id = @user and m.delivered_at is null;
            """, tx, ("user", userId), ("now", now));
        await revoke.ExecuteNonQueryAsync(ct);
        await tx.CommitAsync(ct);
    }

    private async Task QueueAsync(DbConnection db, DbTransaction tx, Guid userId,
        string email, string purpose, CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        var expires = purpose == "VerifyEmail" ? now.AddHours(24) : now.AddMinutes(30);
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var tokenId = Guid.NewGuid();
        var payload = protector.Protect(JsonSerializer.Serialize(new AccountMail(email, purpose, token)));
        await using var command = db.Query("""
            update identity_data.account_tokens set consumed_at = @now
            where user_id = @user and purpose = @purpose and consumed_at is null;
            update identity_data.account_mail_outbox m set protected_payload = null, failed_at = @now
            from identity_data.account_tokens t where m.token_id = t.id and t.user_id = @user
              and t.purpose = @purpose and m.delivered_at is null;
            insert into identity_data.account_tokens
                (id,user_id,purpose,token_hash,created_at,expires_at)
            values (@tokenId,@user,@purpose,@hash,@now,@expires);
            insert into identity_data.account_mail_outbox
                (id,token_id,protected_payload,created_at,expires_at,next_attempt_at)
            values (@mailId,@tokenId,@payload,@now,@expires,@now);
            """, tx, ("user", userId), ("purpose", purpose), ("now", now),
            ("expires", expires), ("hash", Hash(token)), ("tokenId", tokenId),
            ("mailId", Guid.NewGuid()), ("payload", payload));
        await command.ExecuteNonQueryAsync(ct);
    }

    private async Task<bool> RecentlyRequestedAsync(DbConnection db, DbTransaction tx,
        Guid userId, string purpose, CancellationToken ct)
    {
        await using var command = db.Query("""
            select count(*) >= 3 or count(*) filter (where created_at > @recent) > 0 from identity_data.account_tokens
            where user_id = @id and purpose = @purpose and created_at > @since;
            """, tx, ("id", userId), ("purpose", purpose), ("since", clock.GetUtcNow().AddHours(-1)), ("recent", clock.GetUtcNow().AddMinutes(-1)));
        return (bool)(await command.ExecuteScalarAsync(ct))!;
    }

    private static async Task<AccountUser?> FindUserAsync(DbConnection db, DbTransaction tx,
        string email, CancellationToken ct)
    {
        await using var command = db.Query("""
            select id,status from identity_data.users where email_normalized = @email for update;
            """, tx, ("email", email));
        await using var reader = await command.ExecuteReaderAsync(ct);
        return await reader.ReadAsync(ct) ? new AccountUser(reader.GetGuid(0), reader.GetString(1)) : null;
    }

    private void RequireMail()
    {
        if (options.Mode == "Disabled") throw new DomainException("ACCOUNT_MAIL_UNAVAILABLE");
    }

    private static string NormalizeEmail(string input)
    {
        if (string.IsNullOrWhiteSpace(input) || input.Length > 254)
            throw new DomainException("EMAIL_INVALID");
        var normalized = input.Trim().Normalize(NormalizationForm.FormKC);
        if (!MailAddress.TryCreate(normalized, out var address) ||
            address.Address != normalized || !normalized.Contains('@'))
            throw new DomainException("EMAIL_INVALID");
        return normalized.ToUpperInvariant();
    }

    private static void ValidatePassword(string password)
    {
        if (password is null || password.Length is < 12 or > 128 || string.IsNullOrWhiteSpace(password))
            throw new DomainException("PASSWORD_REQUIREMENT");
    }

    private static string Hash(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    private sealed record AccountUser(Guid Id, string Status);
}
