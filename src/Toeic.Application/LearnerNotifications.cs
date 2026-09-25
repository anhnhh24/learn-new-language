namespace Toeic.Application;

public sealed record LearnerNotification(Guid Id, string Kind, string Title, string Body, string TargetPath,
    DateTimeOffset CreatedAt, DateTimeOffset? ReadAt);
public sealed record NotificationPage(IReadOnlyList<LearnerNotification> Items, int Page, int PageSize, bool HasMore);
public interface ILearnerNotifications
{
    Task<NotificationPage> ListAsync(Guid user, int page, int pageSize, bool unreadOnly, CancellationToken ct);
    Task<int> UnreadAsync(Guid user, CancellationToken ct);
    Task ReadAsync(Guid user, Guid id, CancellationToken ct);
}
