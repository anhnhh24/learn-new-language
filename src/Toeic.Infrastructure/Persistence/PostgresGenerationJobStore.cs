using System.Data.Common;
using System.Text.Json;
using Toeic.Application;
using Toeic.Domain.Content;

namespace Toeic.Infrastructure.Persistence;

internal sealed class PostgresGenerationJobStore(IPostgresSession session)
    : IAtomicGenerationJobStore, IOutboxWriter, IOutboxStore
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    // --- IAtomicGenerationJobStore ---

    public async Task<GenerationJobInsertResult> GetOrAddAsync(GenerationJob proposed,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(proposed);
        await using var insertCommand = CreateCommand("""
            insert into content.generation_jobs
                (id, tenant_id, owner_id, idempotency_key, input_hash, blueprint_id,
                 blueprint_version, policy_version, state, candidate_count,
                 required_budget, currency, checkpoint, created_at)
            values (@id, @tenant_id, @owner_id, @idempotency_key, @input_hash, @blueprint_id,
                    @blueprint_version, @policy_version, @state, @candidate_count,
                    @required_budget, @currency, cast(@checkpoint as jsonb), @created_at)
            on conflict (tenant_id, owner_id, idempotency_key) do nothing
            returning id;
            """);
        AddJobParameters(insertCommand, proposed);
        var inserted = await insertCommand.ExecuteScalarAsync(cancellationToken);
        if (inserted is not null) return new(proposed, true);

        await using var selectCommand = CreateCommand("""
            select id, tenant_id, owner_id, idempotency_key, input_hash, blueprint_id,
                   blueprint_version, policy_version, state, candidate_count,
                   required_budget, currency, checkpoint::text, created_at
            from content.generation_jobs
            where tenant_id = @tenant_id and owner_id = @owner_id
              and idempotency_key = @idempotency_key;
            """);
        Add(selectCommand, "@tenant_id", proposed.Scope.TenantId);
        Add(selectCommand, "@owner_id", proposed.Scope.OwnerId);
        Add(selectCommand, "@idempotency_key", proposed.IdempotencyKey);
        await using var reader = await selectCommand.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
            throw new DomainException("GENERATION_JOB_PERSISTENCE_FAILED");
        return new(MapJob(reader), false);
    }

    public async Task SaveAsync(GenerationJob job, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(job);
        await using var command = CreateCommand("""
            update content.generation_jobs
            set state = @state,
                checkpoint = cast(@checkpoint as jsonb)
            where id = @id;
            """);
        Add(command, "@id", job.Id);
        Add(command, "@state", job.State.ToString());
        Add(command, "@checkpoint", job.Checkpoint is not null
            ? JsonSerializer.Serialize(job.Checkpoint, JsonOptions)
            : (object)DBNull.Value);
        var affected = await command.ExecuteNonQueryAsync(cancellationToken);
        if (affected == 0) throw new DomainException("GENERATION_JOB_NOT_FOUND");
    }

    // --- IOutboxWriter ---

    public async Task EnqueueAsync(IEnumerable<GenerationJobEvent> events,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(events);
        foreach (var domainEvent in events)
        {
            await using var command = CreateCommand("""
                insert into operations.outbox_events
                    (event_id, event_type, payload_json, payload_hash, occurred_at)
                values (@event_id, @event_type, cast(@payload_json as jsonb),
                        @payload_hash, @occurred_at)
                on conflict (event_id) do nothing;
                """);
            Add(command, "@event_id", domainEvent.EventId);
            Add(command, "@event_type", domainEvent.EventType);
            Add(command, "@payload_json", domainEvent.PayloadJson);
            Add(command, "@payload_hash", domainEvent.PayloadHash);
            Add(command, "@occurred_at", domainEvent.OccurredAt);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
    }

    // --- IOutboxStore ---

    public async Task<IReadOnlyList<PendingOutboxMessage>> ClaimBatchAsync(int batchSize,
        DateTimeOffset now, CancellationToken cancellationToken)
    {
        await using var command = CreateCommand("""
            select event_id, event_type, payload_json::text, payload_hash, attempts
            from operations.outbox_events
            where processed_at is null and dead_lettered_at is null
              and next_retry_at <= @now
            order by next_retry_at
            limit @batch_size
            for update skip locked;
            """);
        Add(command, "@now", now);
        Add(command, "@batch_size", batchSize);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var results = new List<PendingOutboxMessage>();
        while (await reader.ReadAsync(cancellationToken))
        {
            results.Add(new(reader.GetGuid(0), reader.GetString(1),
                reader.GetString(2), reader.GetString(3), reader.GetInt32(4)));
        }
        return results;
    }

    public async Task MarkProcessedAsync(Guid eventId, DateTimeOffset processedAt,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand("""
            update operations.outbox_events
            set processed_at = @processed_at
            where event_id = @event_id;
            """);
        Add(command, "@event_id", eventId);
        Add(command, "@processed_at", processedAt);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task ScheduleRetryAsync(Guid eventId, int attempts,
        DateTimeOffset nextRetryAt, string safeErrorCode,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand("""
            update operations.outbox_events
            set attempts = @attempts, next_retry_at = @next_retry_at
            where event_id = @event_id;
            """);
        Add(command, "@event_id", eventId);
        Add(command, "@attempts", attempts);
        Add(command, "@next_retry_at", nextRetryAt);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task DeadLetterAsync(Guid eventId, DateTimeOffset deadLetteredAt,
        string safeErrorCode, CancellationToken cancellationToken)
    {
        await using var command = CreateCommand("""
            update operations.outbox_events
            set dead_lettered_at = @dead_lettered_at
            where event_id = @event_id;
            """);
        Add(command, "@event_id", eventId);
        Add(command, "@dead_lettered_at", deadLetteredAt);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    // --- Mapping ---

    private static GenerationJob MapJob(DbDataReader reader)
    {
        var checkpointJson = reader.IsDBNull(12) ? null : reader.GetString(12);
        GenerationCheckpoint? checkpoint = null;
        if (checkpointJson is not null)
            checkpoint = JsonSerializer.Deserialize<GenerationCheckpoint>(
                checkpointJson, JsonOptions);

        var createdAt = reader.GetFieldValue<DateTimeOffset>(13);

        // Route is embedded in the blueprint; for reconstitution we create a minimal
        // placeholder. The coordinator always loads the blueprint when replaying,
        // so the route from the blueprint is used for operations.
        var policyVersion = reader.GetString(7);
        var route = new ModelRoute("persisted", "persisted", "persisted", policyVersion);

        return GenerationJob.Reconstitute(
            reader.GetGuid(0),
            new GenerationScope(reader.GetString(1), reader.GetString(2)),
            reader.GetString(3),
            reader.GetString(4),
            reader.GetGuid(5),
            reader.GetString(6),
            policyVersion,
            route,
            reader.GetInt32(9),
            reader.GetDecimal(10),
            reader.GetString(11),
            Enum.Parse<GenerationJobState>(reader.GetString(8)),
            null, // Budget reservation not persisted in generation_jobs table
            checkpoint,
            createdAt);
    }

    private static void AddJobParameters(DbCommand command, GenerationJob job)
    {
        Add(command, "@id", job.Id);
        Add(command, "@tenant_id", job.Scope.TenantId);
        Add(command, "@owner_id", job.Scope.OwnerId);
        Add(command, "@idempotency_key", job.IdempotencyKey);
        Add(command, "@input_hash", job.InputHash);
        Add(command, "@blueprint_id", job.BlueprintId);
        Add(command, "@blueprint_version", job.BlueprintVersion);
        Add(command, "@policy_version", job.PolicyVersion);
        Add(command, "@state", job.State.ToString());
        Add(command, "@candidate_count", job.CandidateCount);
        Add(command, "@required_budget", job.RequiredBudget);
        Add(command, "@currency", job.Currency);
        Add(command, "@checkpoint", job.Checkpoint is not null
            ? JsonSerializer.Serialize(job.Checkpoint, JsonOptions)
            : (object)DBNull.Value);
        Add(command, "@created_at", job.CreatedAt);
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
