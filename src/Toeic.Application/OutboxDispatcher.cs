using Toeic.Domain.Content;

namespace Toeic.Application;

public sealed class OutboxDispatcher(IApplicationTransaction transaction, IOutboxStore store,
    IEnumerable<IOutboxMessageHandler> handlers, TimeProvider clock)
{
    private const int MaximumAttempts = 8;
    private static readonly TimeSpan LeaseDuration = TimeSpan.FromMinutes(5);
    private readonly IReadOnlyDictionary<string, IOutboxMessageHandler> handlersByType =
        handlers.ToDictionary(handler => handler.EventType, StringComparer.Ordinal);

    public async Task<int> DispatchBatchAsync(int batchSize, CancellationToken cancellationToken)
    {
        if (batchSize is < 1 or > 100) throw new ArgumentOutOfRangeException(nameof(batchSize));
        var leaseId = Guid.NewGuid();
        var claimedAt = clock.GetUtcNow();
        var messages = await transaction.ExecuteAsync(ct =>
            store.ClaimBatchAsync(batchSize, claimedAt, leaseId,
                claimedAt.Add(LeaseDuration), ct), cancellationToken);

        foreach (var message in messages)
        {
            if (!string.Equals(ContentHash.Of(message.PayloadJson), message.PayloadHash,
                    StringComparison.Ordinal))
            {
                await transaction.ExecuteAsync(async ct => {
                    await store.DeadLetterAsync(message.EventId, leaseId, clock.GetUtcNow(),
                        "OUTBOX_PAYLOAD_HASH_INVALID", ct);
                    return true;
                }, cancellationToken);
                continue;
            }
            if (!handlersByType.TryGetValue(message.EventType, out var handler))
            {
                await transaction.ExecuteAsync(async ct => {
                    await store.DeadLetterAsync(message.EventId, leaseId, clock.GetUtcNow(),
                        "OUTBOX_HANDLER_NOT_FOUND", ct);
                    return true;
                }, cancellationToken);
                continue;
            }

            try
            {
                await handler.HandleAsync(message.PayloadJson, cancellationToken);
                await transaction.ExecuteAsync(async ct => {
                    await store.MarkProcessedAsync(message.EventId, leaseId, clock.GetUtcNow(), ct);
                    return true;
                }, cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch
            {
                var attempts = message.Attempts + 1;
                if (attempts >= MaximumAttempts)
                    await transaction.ExecuteAsync(async ct => {
                        await store.DeadLetterAsync(message.EventId, leaseId, clock.GetUtcNow(),
                            "OUTBOX_RETRY_EXHAUSTED", ct);
                        return true;
                    }, cancellationToken);
                else
                    await transaction.ExecuteAsync(async ct => {
                        await store.ScheduleRetryAsync(message.EventId, leaseId, attempts,
                            clock.GetUtcNow().Add(RetryDelay(attempts)), "OUTBOX_HANDLER_FAILED",
                            ct);
                        return true;
                    }, cancellationToken);
            }
        }

        return messages.Count;
    }

    private static TimeSpan RetryDelay(int attempts) =>
        TimeSpan.FromSeconds(Math.Min(900, Math.Pow(2, attempts) * 5));
}
