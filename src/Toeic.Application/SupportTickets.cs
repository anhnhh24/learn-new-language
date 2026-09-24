namespace Toeic.Application;

public sealed record CreateSupportTicket(Guid ClientOperationId, string Category,
    string Title, string Description, Guid? LessonVersionId);
public sealed record SupportTicketView(Guid Id, string Category, string Title,
    string Description, Guid? LessonVersionId, string State, string? ResolutionReason,
    long Revision, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);
public sealed record SupportTicketPage(IReadOnlyList<SupportTicketView> Items,
    int Page, int PageSize, bool HasMore);

public interface ISupportTickets
{
    Task<SupportTicketView> CreateAsync(Guid learnerId, CreateSupportTicket request, CancellationToken ct);
    Task<SupportTicketView> GetAsync(Guid learnerId, Guid ticketId, CancellationToken ct);
    Task<SupportTicketPage> ListAsync(Guid learnerId, int page, int pageSize, CancellationToken ct);
}
