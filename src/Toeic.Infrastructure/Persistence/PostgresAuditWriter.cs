using System.Data.Common;
using System.Text.Json;
using Toeic.Application;

namespace Toeic.Infrastructure.Persistence;

internal sealed class PostgresAuditWriter(IPostgresSession session) : IAuditWriter
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task AppendAsync(AuditEntry entry, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(entry);
        await using var command = CreateCommand("""
            insert into operations.audit_events
                (id, actor_id, actor_type, action, target_type, target_id,
                 reason, safe_diff, correlation_id, occurred_at)
            values (@id, @actor_id, @actor_type, @action, @target_type, @target_id,
                    @reason, cast(@safe_diff as jsonb), @correlation_id, @occurred_at);
            """);
        Add(command, "@id", entry.Id);
        Add(command, "@actor_id", entry.Actor.Id);
        Add(command, "@actor_type", entry.Actor.Type.ToString());
        Add(command, "@action", entry.Action);
        Add(command, "@target_type", entry.TargetType);
        Add(command, "@target_id", entry.TargetId);
        Add(command, "@reason", entry.ReasonCode is null ? DBNull.Value : entry.ReasonCode);
        Add(command, "@safe_diff", JsonSerializer.Serialize(entry.SafeDiff, JsonOptions));
        Add(command, "@correlation_id", entry.CorrelationId);
        Add(command, "@occurred_at", entry.OccurredAt);
        if (await command.ExecuteNonQueryAsync(cancellationToken) != 1)
            throw new InvalidOperationException("Audit event was not persisted.");
    }

    private DbCommand CreateCommand(string sql)
    {
        var command = session.Connection.CreateCommand();
        command.Transaction = session.Transaction;
        command.CommandText = sql;
        return command;
    }

    private static void Add(DbCommand command, string name, object value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value;
        command.Parameters.Add(parameter);
    }
}
