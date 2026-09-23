using System.Collections.Immutable;
using System.Data.Common;
using System.Text.Json;
using Npgsql;
using Toeic.Application;
using Toeic.Domain.Assessment;
using Toeic.Domain.Content;

namespace Toeic.Infrastructure.Persistence;

internal sealed class PostgresAttemptStore(IPostgresSession session) : IAttemptStore
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task AddAsync(Attempt attempt, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(attempt);
        if (!Guid.TryParse(attempt.LearnerId, out var learnerId))
            throw new DomainException("LEARNER_ID_INVALID");

        var document = new AttemptSnapshotDocument(2, attempt.Items.Select(item =>
            new AttemptItemDocument(item.QuestionRevisionId, item.QuestionFamilyId,
                item.Section, item.Stimulus, item.Prompt, item.Options,
                item.CorrectOptionIds.Order(StringComparer.Ordinal).ToImmutableArray(),
                item.MaxScore)).ToImmutableArray());
        await using var command = CreateCommand("""
            insert into assessment.attempts
                (id, learner_id, assessment_version_id, exam_profile_version, mode, status,
                 revision, snapshot_json, started_at, deadline)
            values (@id, @learner_id, @assessment_version_id, @exam_profile_version, @mode,
                    @status, @revision, cast(@snapshot_json as jsonb), @started_at, @deadline);
            """);
        Add(command, "@id", attempt.Id);
        Add(command, "@learner_id", learnerId);
        Add(command, "@assessment_version_id", attempt.AssessmentVersionId);
        Add(command, "@exam_profile_version", attempt.ExamProfileVersion);
        Add(command, "@mode", attempt.Mode.ToString());
        Add(command, "@status", attempt.Status.ToString());
        Add(command, "@revision", attempt.Revision);
        Add(command, "@snapshot_json", JsonSerializer.Serialize(document, JsonOptions));
        Add(command, "@started_at", attempt.StartedAt);
        Add(command, "@deadline", attempt.Deadline);
        try
        {
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        catch (PostgresException exception) when (exception.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            throw new DomainException("ACTIVE_ATTEMPT_CONFLICT");
        }
    }

    public async Task<bool> IsOwnedExposedItemAsync(Guid attemptId, string learnerId,
        Guid itemRevisionId, CancellationToken cancellationToken)
    {
        if (attemptId == Guid.Empty || itemRevisionId == Guid.Empty ||
            !Guid.TryParse(learnerId, out var ownerId))
            return false;
        await using var command = CreateCommand("""
            select exists (
                select 1
                from assessment.attempts a
                join assessment.item_exposures e on e.attempt_id = a.id
                where a.id = @attempt_id and a.learner_id = @learner_id
                  and e.item_revision_id = @item_revision_id
            );
            """);
        Add(command, "@attempt_id", attemptId);
        Add(command, "@learner_id", ownerId);
        Add(command, "@item_revision_id", itemRevisionId);
        return (bool)(await command.ExecuteScalarAsync(cancellationToken) ?? false);
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

    private sealed record AttemptSnapshotDocument(int SchemaVersion,
        ImmutableArray<AttemptItemDocument> Items);
    private sealed record AttemptItemDocument(Guid QuestionRevisionId, Guid QuestionFamilyId,
        string Section, string? Stimulus, string Prompt, ImmutableArray<AttemptOption> Options,
        ImmutableArray<string> CorrectOptionIds, decimal MaxScore);
}

internal sealed class PostgresStartAttemptReceiptStore(IPostgresSession session)
    : IStartAttemptReceiptStore
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<StartAttemptReceipt?> FindAsync(string learnerId, Guid clientOperationId,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(learnerId, out var ownerId) || clientOperationId == Guid.Empty)
            return null;
        await using var command = CreateCommand("""
            select form_version_id, response_json::text
            from assessment.start_attempt_receipts
            where learner_id = @learner_id and client_operation_id = @client_operation_id;
            """);
        Add(command, "@learner_id", ownerId);
        Add(command, "@client_operation_id", clientOperationId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) return null;
        var response = JsonSerializer.Deserialize<StartedBetaAttempt>(reader.GetString(1), JsonOptions)
            ?? throw new DomainException("START_ATTEMPT_RECEIPT_INVALID");
        return new(learnerId.Trim(), clientOperationId, reader.GetGuid(0), response);
    }

    public async Task AddAsync(StartAttemptReceipt receipt,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(receipt);
        if (!Guid.TryParse(receipt.LearnerId, out var learnerId) ||
            receipt.ClientOperationId == Guid.Empty || receipt.FormId == Guid.Empty ||
            receipt.Response.AttemptId == Guid.Empty || receipt.Response.FormId != receipt.FormId)
            throw new DomainException("START_ATTEMPT_RECEIPT_INVALID");
        await using var command = CreateCommand("""
            insert into assessment.start_attempt_receipts
                (learner_id, client_operation_id, form_version_id, attempt_id, response_json,
                 created_at)
            values (@learner_id, @client_operation_id, @form_version_id, @attempt_id,
                    cast(@response_json as jsonb), @created_at);
            """);
        Add(command, "@learner_id", learnerId);
        Add(command, "@client_operation_id", receipt.ClientOperationId);
        Add(command, "@form_version_id", receipt.FormId);
        Add(command, "@attempt_id", receipt.Response.AttemptId);
        Add(command, "@response_json", JsonSerializer.Serialize(receipt.Response, JsonOptions));
        Add(command, "@created_at", receipt.Response.StartedAt);
        try
        {
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        catch (PostgresException exception) when (exception.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            throw new DomainException("IDEMPOTENCY_CONFLICT");
        }
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
