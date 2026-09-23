using Toeic.Domain.Content;

namespace Toeic.Application;

public interface IApplicationTransaction
{
    Task<T> ExecuteAsync<T>(Func<CancellationToken, Task<T>> operation,
        CancellationToken cancellationToken);
}

public interface IContentBlueprintRepository
{
    Task<ContentBlueprintVersion?> FindAsync(Guid id, CancellationToken cancellationToken);
}

public sealed record GenerationJobInsertResult(GenerationJob Job, bool Inserted);

public interface IAtomicGenerationJobStore
{
    Task<GenerationJobInsertResult> GetOrAddAsync(GenerationJob proposed,
        CancellationToken cancellationToken);
    Task SaveAsync(GenerationJob job, CancellationToken cancellationToken);
}

public interface IOutboxWriter
{
    Task EnqueueAsync(IEnumerable<GenerationJobEvent> events,
        CancellationToken cancellationToken);
}

public interface IIdempotencyReceiptStore
{
    Task<IdempotencyReceipt?> FindAsync(string scope, Guid key, CancellationToken cancellationToken);
    Task StoreAsync(IdempotencyReceipt receipt, CancellationToken cancellationToken);
}

public sealed record IdempotencyReceipt(string Scope, Guid Key, string RequestHash,
    int StatusCode, string ResponseJson, DateTimeOffset ExpiresAt);

public interface IOutboxMessageHandler
{
    string EventType { get; }
    Task HandleAsync(string payloadJson, CancellationToken cancellationToken);
}

public sealed record PendingOutboxMessage(Guid EventId, string EventType, string PayloadJson,
    string PayloadHash, int Attempts);

public interface IOutboxStore
{
    Task<IReadOnlyList<PendingOutboxMessage>> ClaimBatchAsync(int batchSize,
        DateTimeOffset now, CancellationToken cancellationToken);
    Task MarkProcessedAsync(Guid eventId, DateTimeOffset processedAt,
        CancellationToken cancellationToken);
    Task ScheduleRetryAsync(Guid eventId, int attempts, DateTimeOffset nextRetryAt,
        string safeErrorCode, CancellationToken cancellationToken);
    Task DeadLetterAsync(Guid eventId, DateTimeOffset deadLetteredAt,
        string safeErrorCode, CancellationToken cancellationToken);
}
