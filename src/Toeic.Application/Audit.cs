using System.Collections.Immutable;
using Toeic.Domain.Content;

namespace Toeic.Application;

public sealed record AuditEntry(
    Guid Id,
    Actor Actor,
    string Action,
    string TargetType,
    string TargetId,
    string? ReasonCode,
    ImmutableDictionary<string, string> SafeDiff,
    string CorrelationId,
    DateTimeOffset OccurredAt)
{
    public static AuditEntry Create(Actor actor, string action, string targetType,
        string targetId, string? reasonCode, IEnumerable<KeyValuePair<string, string>> safeDiff,
        string correlationId, DateTimeOffset occurredAt)
    {
        if (actor is null || string.IsNullOrWhiteSpace(actor.Id) ||
            string.IsNullOrWhiteSpace(action) || string.IsNullOrWhiteSpace(targetType) ||
            string.IsNullOrWhiteSpace(targetId) || string.IsNullOrWhiteSpace(correlationId) ||
            occurredAt == default)
            throw new DomainException("AUDIT_ENTRY_INVALID");

        var normalizedDiff = (safeDiff ?? [])
            .Where(pair => !string.IsNullOrWhiteSpace(pair.Key))
            .ToImmutableDictionary(pair => pair.Key.Trim(), pair => pair.Value ?? string.Empty,
                StringComparer.Ordinal);
        return new(Guid.NewGuid(), actor, action.Trim(), targetType.Trim(), targetId.Trim(),
            string.IsNullOrWhiteSpace(reasonCode) ? null : reasonCode.Trim(),
            normalizedDiff, correlationId.Trim(), occurredAt);
    }
}

public interface IAuditWriter
{
    Task AppendAsync(AuditEntry entry, CancellationToken cancellationToken);
}
