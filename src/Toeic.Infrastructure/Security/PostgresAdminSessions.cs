using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Toeic.Application;
using Toeic.Infrastructure.Persistence;

namespace Toeic.Infrastructure.Security;

public sealed class PostgresAdminSessions(IDbConnectionFactory connections, TimeProvider clock) : IAdminSessions
{
    private readonly PasswordHasher<string> hasher = new();
    private readonly string dummyHash = new PasswordHasher<string>().HashPassword("dummy", Convert.ToHexString(RandomNumberGenerator.GetBytes(32)));
    public async Task<AdminToken?> LoginAsync(string email, string password, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(email) || email.Length>254 || string.IsNullOrEmpty(password) || password.Length>1024) return null;
        var normalized = email.Trim().Normalize(NormalizationForm.FormKC).ToUpperInvariant();
        await using var db = await connections.OpenAsync(ct);
        await using var tx = await db.BeginTransactionAsync(ct);
        Guid id = Guid.Empty;
        string hash = dummyHash;
        int failures = 0;
        DateTimeOffset? locked = null;
        await using (var query = db.Query("""
            select u.id,u.password_hash,m.failed_login_count,m.locked_until
            from identity_data.users u join identity_data.admin_accounts m on m.user_id=u.id
            where u.email_normalized=@email and u.status='Active' and u.email_verified_at is not null and m.enabled
            for update of u,m
            """, tx, ("email", normalized)))
        {
            await using var reader = await query.ExecuteReaderAsync(ct);
            if (await reader.ReadAsync(ct)) { id=reader.GetGuid(0); hash=reader.GetString(1); failures=reader.GetInt32(2); locked=reader.IsDBNull(3)?null:reader.GetFieldValue<DateTimeOffset>(3); }
        }
        var now = clock.GetUtcNow();
        PasswordVerificationResult result;
        try { result=hasher.VerifyHashedPassword(normalized, locked>now ? dummyHash : hash,password); }
        catch (FormatException) { result=PasswordVerificationResult.Failed; }
        if (id==Guid.Empty || locked>now) return null;
        if (result==PasswordVerificationResult.Failed)
        {
            var count=locked.HasValue ? 1 : Math.Min(5,failures+1);
            await using var failure=db.Query("update identity_data.admin_accounts set failed_login_count=@count,locked_until=@until where user_id=@id",tx,
                ("count",count),("until",count>=5 ? now.AddMinutes(15) : null),("id",id));
            await failure.ExecuteNonQueryAsync(ct); await tx.CommitAsync(ct); return null;
        }
        var session=Guid.NewGuid();
        var raw="adm_"+Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var expires=now.AddHours(2);
        await using var save=db.Query("""
            update identity_data.admin_accounts set failed_login_count=0,locked_until=null where user_id=@user;
            update identity_data.users set password_hash=@password where id=@user;
            insert into identity_data.admin_sessions(id,user_id,token_hash,created_at,expires_at) values(@id,@user,@hash,@now,@expires);
            insert into operations.audit_events(id,actor_id,actor_type,action,target_type,target_id,correlation_id,occurred_at)
            values(@audit,@actor,'Admin','AdminLogin','AdminSession',@target,@target,@now);
            """,tx,("user",id),("id",session),("hash",Hash(raw)),("now",now),("expires",expires),
            ("password",result==PasswordVerificationResult.SuccessRehashNeeded ? hasher.HashPassword(normalized,password) : hash),
            ("audit",Guid.NewGuid()),("actor",id.ToString()),("target",session.ToString()));
        await save.ExecuteNonQueryAsync(ct); await tx.CommitAsync(ct); return new(raw,expires);
    }
    public async Task<AdminIdentity?> AuthenticateAsync(string token, CancellationToken ct)
    {
        if (token.Length!=68 || !token.StartsWith("adm_",StringComparison.Ordinal) || !token.AsSpan(4).ToArray().All(char.IsAsciiHexDigit)) return null;
        await using var db=await connections.OpenAsync(ct);
        await using var query=db.Query("""
            select u.id,s.id,u.display_name from identity_data.admin_sessions s
            join identity_data.admin_accounts m on m.user_id=s.user_id and m.enabled
            join identity_data.users u on u.id=s.user_id and u.status='Active' and u.email_verified_at is not null
            where s.token_hash=@hash and s.revoked_at is null and s.expires_at>@now
            """,null,("hash",Hash(token)),("now",clock.GetUtcNow()));
        await using var reader=await query.ExecuteReaderAsync(ct);
        return await reader.ReadAsync(ct) ? new(reader.GetGuid(0),reader.GetGuid(1),reader.GetString(2)) : null;
    }
    public async Task LogoutAsync(Guid user, Guid session, CancellationToken ct)
    {
        await using var db=await connections.OpenAsync(ct);
        await using var command=db.Query("update identity_data.admin_sessions set revoked_at=coalesce(revoked_at,@now) where id=@id and user_id=@user",null,
            ("now",clock.GetUtcNow()),("id",session),("user",user));
        await command.ExecuteNonQueryAsync(ct);
    }
    private static string Hash(string value)=>Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
}
