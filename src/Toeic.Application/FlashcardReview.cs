namespace Toeic.Application;

public sealed record CreateFlashcard(Guid ClientOperationId, string Term, string Meaning, string? Example);
public sealed record EditFlashcard(long ExpectedRevision, string Term, string Meaning, string? Example, bool Archived);
public sealed record FlashcardView(Guid Id, string Term, string Meaning, string Example, string State,
    int IntervalDays, DateTimeOffset DueAt, long Revision, bool Archived);
public sealed record FlashcardPage(IReadOnlyList<FlashcardView> Items, int Page, int PageSize, bool HasMore);
public sealed record FlashcardFront(Guid Id, string Term, long Revision, bool IsNew, DateTimeOffset DueAt);
public sealed record FlashcardQueue(IReadOnlyList<FlashcardFront> Items, int NewCardsRemaining);
public sealed record RevealFlashcard(long ExpectedRevision);
public sealed record FlashcardAnswer(Guid RevealId, Guid CardId, long Revision, string Meaning,
    string Example, DateTimeOffset ExpiresAt);
public sealed record RateFlashcard(Guid ClientOperationId, Guid RevealId, long ExpectedRevision, string Rating);
public sealed record FlashcardReviewReceipt(Guid EventId, Guid CardId, string Rating, int IntervalDays,
    DateTimeOffset ReviewedAt, DateTimeOffset DueAt, string State, long Revision, bool WasEarly);
public sealed record FlashcardSettings(int NewCardsPerDay, long Revision);
public sealed record ChangeFlashcardSettings(int NewCardsPerDay, long ExpectedRevision);

public interface IFlashcardReview
{
    Task<FlashcardView> CreateAsync(Guid user, CreateFlashcard request, CancellationToken ct);
    Task<FlashcardPage> ListAsync(Guid user, int page, int pageSize, bool archived, CancellationToken ct);
    Task<FlashcardView> EditAsync(Guid user, Guid card, EditFlashcard request, CancellationToken ct);
    Task<FlashcardQueue> QueueAsync(Guid user, int limit, CancellationToken ct);
    Task<FlashcardAnswer> RevealAsync(Guid user, Guid card, RevealFlashcard request, CancellationToken ct);
    Task<FlashcardReviewReceipt> RateAsync(Guid user, Guid card, RateFlashcard request, CancellationToken ct);
    Task<FlashcardSettings> SettingsAsync(Guid user, ChangeFlashcardSettings? request, CancellationToken ct);
}
