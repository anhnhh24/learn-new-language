namespace Toeic.Application;

public sealed record AdminIdentity(Guid UserId, Guid SessionId, string DisplayName);
public sealed record AdminToken(string AccessToken, DateTimeOffset ExpiresAt, string TokenType = "Bearer");
public interface IAdminSessions
{
    Task<AdminToken?> LoginAsync(string email, string password, CancellationToken ct);
    Task<AdminIdentity?> AuthenticateAsync(string token, CancellationToken ct);
    Task LogoutAsync(Guid user, Guid session, CancellationToken ct);
}
public sealed record AdminOverview(int ActiveLearners, int PublishedCourses, int PublishedLessons,
    int OpenTickets, int ActiveForms, int QuarantinedSources);
public sealed record AdminUserView(Guid Id, string DisplayName, string Status, DateTimeOffset CreatedAt, bool EmailVerified);
public sealed record AdminAuditView(Guid Id, string ActorType, string Action, string TargetType, string TargetId, DateTimeOffset OccurredAt);
public sealed record AdminPage<T>(IReadOnlyList<T> Items, int Page, int PageSize, bool HasMore);
public sealed record AdminResourceView(Guid Id, string Title, string State, string Detail);
public interface IAdminConsole
{
    Task<AdminPage<AdminResourceView>> ResourcesAsync(string kind, int page, int pageSize, CancellationToken ct);
    Task<AdminOverview> OverviewAsync(CancellationToken ct);
    Task<AdminPage<AdminUserView>> UsersAsync(int page, int pageSize, CancellationToken ct);
    Task<AdminPage<SupportTicketView>> TicketsAsync(int page, int pageSize, string? state, CancellationToken ct);
    Task<AdminPage<AdminAuditView>> AuditAsync(int page, int pageSize, CancellationToken ct);
}
