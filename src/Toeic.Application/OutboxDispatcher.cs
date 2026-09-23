namespace Toeic.Application;

public sealed class OutboxDispatcher(IOutboxStore store, IEnumerable<IOutboxMessageHandler> handlers,
    TimeProvider clock)
{
    private const int MaximumAttempts = 8;
    private readonly IReadOnlyDictionary<string, IOutboxMessageHandler> handlersByType =
        handlers.ToDictionary(handler => handler.EventType, StringComparer.Ordinal);

    public async Task<int> DispatchBatchAsync(int batchSize, CancellationToken cancellationToken)
    {
        if (batchSize is < 1 or > 100) throw new ArgumentOutOfRangeException(nameof(batchSize));
        var messages = await store.ClaimBatchAsync(batchSize, clock.GetUtcNow(), cancellationToken);

        foreach (var message in messages)
        {
            if (!handlersByType.TryGetValue(message.EventType, out var handler))
            {
                await store.DeadLetterAsync(message.EventId, clock.GetUtcNow(),
                    "OUTBOX_HANDLER_NOT_FOUND", cancellationToken);
                continue;
            }

            try
            {
                await handler.HandleAsync(message.PayloadJson, cancellationToken);
                await store.MarkProcessedAsync(message.EventId, clock.GetUtcNow(), cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch
            {
                var attempts = message.Attempts + 1;
                if (attempts >= MaximumAttempts)
                    await store.DeadLetterAsync(message.EventId, clock.GetUtcNow(),
                        "OUTBOX_RETRY_EXHAUSTED", cancellationToken);
                else
                    await store.ScheduleRetryAsync(message.EventId, attempts,
                        clock.GetUtcNow().Add(RetryDelay(attempts)), "OUTBOX_HANDLER_FAILED",
                        cancellationToken);
            }
        }

        return messages.Count;
    }

    private static TimeSpan RetryDelay(int attempts) =>
        TimeSpan.FromSeconds(Math.Min(900, Math.Pow(2, attempts) * 5));
}
