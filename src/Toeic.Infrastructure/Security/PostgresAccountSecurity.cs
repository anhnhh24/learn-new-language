using Microsoft.AspNetCore.Identity;
using Toeic.Application;
using Toeic.Domain.Content;
using Toeic.Infrastructure.Persistence;

namespace Toeic.Infrastructure.Security;

public sealed class PostgresAccountSecurity(IDbConnectionFactory connections, TimeProvider clock) : IAccountSecurity
{
    private readonly PasswordHasher<string> hasher = new();

    public async Task<IReadOnlyList<AccountSessionView>> SessionsAsync(Guid user, Guid currentSession, CancellationToken ct)
    {
        await using var db = await connections.OpenAsync(ct);
        await using var query = db.Query("""
            select id,created_at,expires_at from identity_data.learner_sessions
            where user_id=@user and revoked_at is null and expires_at>@now order by created_at desc,id
            """, null, ("user", user), ("now", clock.GetUtcNow()));
        var items = new List<AccountSessionView>();
        await using var reader = await query.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct)) items.Add(new(reader.GetGuid(0), reader.GetFieldValue<DateTimeOffset>(1), reader.GetFieldValue<DateTimeOffset>(2), reader.GetGuid(0) == currentSession));
        return items;
    }

    public Task RevokeAsync(Guid user, Guid session, CancellationToken ct) => Revoke(user, session, false, ct);
    public Task RevokeOthersAsync(Guid user, Guid currentSession, CancellationToken ct) => Revoke(user, currentSession, true, ct);
    private async Task Revoke(Guid user, Guid session, bool others, CancellationToken ct)
    {
        await using var db = await connections.OpenAsync(ct);
        await using var tx = await db.BeginTransactionAsync(ct);
        await using var owner = db.Query("select id from identity_data.users where id=@user and status='Active' for update", tx, ("user", user));
        if (await owner.ExecuteScalarAsync(ct) is null) throw new DomainException("FORBIDDEN");
        await using var query = db.Query("""
            update identity_data.learner_sessions set revoked_at=coalesce(revoked_at,@now)
            where user_id=@user and
            """ + (others ? " id<>@id" : " id=@id"), tx, ("user", user), ("id", session), ("now", clock.GetUtcNow()));
        var count = await query.ExecuteNonQueryAsync(ct);
        if (!others && count == 0) throw new DomainException("SESSION_NOT_FOUND");
        await tx.CommitAsync(ct);
    }

    public async Task ChangePasswordAsync(Guid user, Guid session, ChangeAccountPassword request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length is < 12 or > 128 ||
            string.IsNullOrEmpty(request.CurrentPassword) || request.CurrentPassword.Length > 1024)
            throw new DomainException("PASSWORD_REQUIREMENT");
        await using var db = await connections.OpenAsync(ct);
        await using var tx = await db.BeginTransactionAsync(ct);
        string email, hash;
        await using (var query = db.Query("""
            select email_normalized,password_hash from identity_data.users
            where id=@user and status='Active' and email_verified_at is not null for update
            """, tx, ("user", user)))
        {
            await using var reader = await query.ExecuteReaderAsync(ct);
            if (!await reader.ReadAsync(ct)) throw new DomainException("FORBIDDEN");
            email = reader.GetString(0); hash = reader.GetString(1);
        }
        var now = clock.GetUtcNow();
        await using var active = db.Query("""
            select id from identity_data.learner_sessions where id=@session and user_id=@user
                and revoked_at is null and expires_at>@now for update
            """, tx, ("session", session), ("user", user), ("now", now));
        if (await active.ExecuteScalarAsync(ct) is null) throw new DomainException("FORBIDDEN");
        PasswordVerificationResult verified;
        try { verified = hasher.VerifyHashedPassword(email, hash, request.CurrentPassword); }
        catch (FormatException) { verified = PasswordVerificationResult.Failed; }
        if (verified == PasswordVerificationResult.Failed) throw new DomainException("CURRENT_PASSWORD_INVALID");
        await using var update = db.Query("""
            update identity_data.users set password_hash=@hash,failed_login_count=0,login_locked_until=null where id=@user;
            update identity_data.learner_sessions set revoked_at=coalesce(revoked_at,@now) where user_id=@user;
            update identity_data.sessions set revoked_at=coalesce(revoked_at,@now) where user_id=@user;
            update identity_data.account_tokens set consumed_at=coalesce(consumed_at,@now) where user_id=@user and purpose='ResetPassword';
            """, tx, ("hash", hasher.HashPassword(email, request.NewPassword)), ("user", user), ("now", now));
        await update.ExecuteNonQueryAsync(ct);
        await tx.CommitAsync(ct);
    }
}
