namespace Toeic.Application;

public sealed record AccountSessionView(Guid Id, DateTimeOffset CreatedAt, DateTimeOffset ExpiresAt, bool Current);
public sealed record ChangeAccountPassword(string CurrentPassword, string NewPassword);
public interface IAccountSecurity
{
    Task<IReadOnlyList<AccountSessionView>> SessionsAsync(Guid user, Guid currentSession, CancellationToken ct);
    Task RevokeAsync(Guid user, Guid session, CancellationToken ct);
    Task RevokeOthersAsync(Guid user, Guid currentSession, CancellationToken ct);
    Task ChangePasswordAsync(Guid user, Guid session, ChangeAccountPassword request, CancellationToken ct);
}
