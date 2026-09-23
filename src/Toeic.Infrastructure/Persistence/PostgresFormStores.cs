using System.Collections.Immutable;
using System.Data.Common;
using System.Text.Json;
using Npgsql;
using Toeic.Application;
using Toeic.Domain.Assessment;
using Toeic.Domain.Content;

namespace Toeic.Infrastructure.Persistence;

// Shared DTO for JSON provenance stored in content.question_revisions.provenance_json
internal sealed record PersistedProvenance(string ContributorId, string BlueprintVersion,
    string PolicyVersion, string RightsReference);

internal sealed class PostgresFormVersionStore(IPostgresSession session) : IFormVersionStore
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task AddAsync(BetaFormVersion form, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(form);
        await using var command = CreateCommand("""
            insert into content.form_versions
                (id, version, tier, state, snapshot_json, policy_version,
                 exam_profile_version, attempt_duration_seconds, created_at)
            values (@id, @version, @tier, @state, cast(@snapshot_json as jsonb),
                    @policy_version, @exam_profile_version, @attempt_duration_seconds, @created_at);
            """);
        Add(command, "@id", form.Id);
        Add(command, "@version", form.Version);
        Add(command, "@tier", form.Tier.ToString());
        Add(command, "@state", form.State.ToString());
        Add(command, "@snapshot_json", JsonSerializer.Serialize(
            new FormSnapshotDocument(form.SnapshotHash, form.Items), JsonOptions));
        Add(command, "@policy_version", form.PolicyVersion);
        Add(command, "@created_at", DateTimeOffset.UtcNow);
        Add(command, "@exam_profile_version", form.ExamProfileVersion);
        Add(command, "@attempt_duration_seconds", checked((int)form.AttemptDuration.TotalSeconds));

        try
        {
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        catch (PostgresException exception) when (exception.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            throw new DomainException("FORM_VERSION_CONFLICT");
        }

        // Insert form items and questions
        foreach (var item in form.Items)
        {
            await using var itemCommand = CreateCommand("""
                insert into content.form_items
                    (form_version_id, item_revision_id, item_order)
                values (@form_version_id, @item_revision_id, @item_order);
                """);
            Add(itemCommand, "@form_version_id", form.Id);
            Add(itemCommand, "@item_revision_id", item.RevisionId);
            Add(itemCommand, "@item_order", item.Position);
            await itemCommand.ExecuteNonQueryAsync(cancellationToken);

            var questionOrder = 0;
            foreach (var questionId in item.QuestionRevisionIds)
            {
                questionOrder++;
                await using var questionCommand = CreateCommand("""
                    insert into content.form_questions
                        (form_version_id, item_revision_id, question_revision_id, question_order)
                    values (@form_version_id, @item_revision_id, @question_revision_id, @question_order);
                    """);
                Add(questionCommand, "@form_version_id", form.Id);
                Add(questionCommand, "@item_revision_id", item.RevisionId);
                Add(questionCommand, "@question_revision_id", questionId);
                Add(questionCommand, "@question_order", questionOrder);
                await questionCommand.ExecuteNonQueryAsync(cancellationToken);
            }
        }
    }

    public async Task<IReadOnlyList<BetaFormVersion>> FindActiveContainingAsync(
        Guid revisionId, CancellationToken cancellationToken)
    {
        if (revisionId == Guid.Empty) return [];
        await using var command = CreateCommand("""
            select fv.id, fv.version, fv.tier, fv.state, fv.snapshot_json::text,
                   fv.policy_version, fv.exam_profile_version, fv.attempt_duration_seconds
            from content.form_versions fv
            join content.form_questions fq on fq.form_version_id = fv.id
            where fq.question_revision_id = @revision_id and fv.state = 'Active';
            """);
        Add(command, "@revision_id", revisionId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var results = new List<BetaFormVersion>();
        while (await reader.ReadAsync(cancellationToken))
        {
            results.Add(MapForm(reader));
        }
        return results;
    }

    public async Task SaveAsync(BetaFormVersion form, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(form);
        await using var command = CreateCommand("""
            update content.form_versions
            set state = @state
            where id = @id;
            """);
        Add(command, "@id", form.Id);
        Add(command, "@state", form.State.ToString());
        var affected = await command.ExecuteNonQueryAsync(cancellationToken);
        if (affected == 0) throw new DomainException("FORM_NOT_FOUND");
    }

    private static BetaFormVersion MapForm(DbDataReader reader)
    {
        var tier = Enum.Parse<PublicationTier>(reader.GetString(2));
        var snapshotJson = reader.GetString(4);
        var snapshot = JsonSerializer.Deserialize<FormSnapshotDocument>(snapshotJson, JsonOptions)
            ?? throw new DomainException("FORM_SNAPSHOT_CORRUPT");

        var state = Enum.Parse<FormState>(reader.GetString(3));
        var form = BetaFormVersion.Reconstitute(reader.GetGuid(0), reader.GetString(1),
            reader.GetString(5), reader.GetString(6),
            TimeSpan.FromSeconds(reader.GetInt32(7)), tier, snapshot.Items, state);
        if (!string.Equals(form.SnapshotHash, snapshot.SnapshotHash, StringComparison.Ordinal))
            throw new DomainException("FORM_SNAPSHOT_CORRUPT");
        return form;
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

    private sealed record FormSnapshotDocument(string SnapshotHash,
        ImmutableArray<FormItemSnapshot> Items);
}

internal sealed class PostgresFormCandidateStore(IPostgresSession session) : IFormCandidateStore
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<IReadOnlyList<FormItemCandidate>> LoadAsync(
        IReadOnlyCollection<Guid> revisionIds, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(revisionIds);
        if (revisionIds.Count == 0) return [];

        // Build parameterized IN clause
        var parameters = new List<string>();
        var command = CreateCommand("");
        var index = 0;
        foreach (var id in revisionIds)
        {
            var name = $"@id{index}";
            parameters.Add(name);
            Add(command, name, id);
            index++;
        }

        command.CommandText = $"""
            select qr.id, qr.family_id, qr.part, qr.tier, qr.state,
                   qr.provenance_json::text,
                   coalesce(exp.exposure_count, 0) as exposure_count
            from content.question_revisions qr
            left join lateral (
                select count(*)::int as exposure_count
                from assessment.item_exposures ie
                where ie.item_revision_id = qr.id
            ) exp on true
            where qr.id in ({string.Join(", ", parameters)});
            """;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var results = new List<FormItemCandidate>();
        while (await reader.ReadAsync(cancellationToken))
        {
            var revisionId = reader.GetGuid(0);
            var familyId = reader.GetString(1);
            var part = Enum.Parse<ToeicPart>(reader.GetString(2));
            var tier = Enum.Parse<PublicationTier>(reader.GetString(3));
            var state = Enum.Parse<CandidateState>(reader.GetString(4));
            var provenanceJson = reader.GetString(5);
            var provenance = JsonSerializer.Deserialize<PersistedProvenance>(
                provenanceJson, JsonOptions)
                ?? throw new DomainException("PROVENANCE_CORRUPT");
            var exposureCount = reader.GetInt32(6);

            // For Part 5, each revision is a single question
            var questionRevisionIds = ImmutableArray.Create(revisionId);

            results.Add(new FormItemCandidate(revisionId, familyId, part, tier, state,
                questionRevisionIds, exposureCount, provenance.RightsReference,
                provenance.PolicyVersion));
        }
        await command.DisposeAsync();
        return results;
    }

    public async Task MarkBetaActiveAsync(IReadOnlyCollection<Guid> revisionIds,
        string formVersion, Actor actor, DateTimeOffset activatedAt,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(revisionIds);
        foreach (var id in revisionIds)
        {
            await using var command = CreateCommand("""
                update content.question_revisions
                set state = 'BetaActive', tier = 'BetaPractice'
                where id = @id;
                """);
            Add(command, "@id", id);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
    }

    public async Task QuarantineAsync(Guid revisionId, string reasonCode,
        string policyVersion, Guid statisticSnapshotId, Actor actor,
        DateTimeOffset quarantinedAt, CancellationToken cancellationToken)
    {
        await using var updateCommand = CreateCommand("""
            update content.question_revisions
            set state = 'Quarantined'
            where id = @id;
            """);
        Add(updateCommand, "@id", revisionId);
        await updateCommand.ExecuteNonQueryAsync(cancellationToken);

        await using var decisionCommand = CreateCommand("""
            insert into assessment.quarantine_decisions
                (id, item_revision_id, snapshot_id, reason_code, policy_version, created_at)
            values (@id, @item_revision_id, @snapshot_id, @reason_code, @policy_version, @at);
            """);
        Add(decisionCommand, "@id", Guid.NewGuid());
        Add(decisionCommand, "@item_revision_id", revisionId);
        Add(decisionCommand, "@snapshot_id", statisticSnapshotId == Guid.Empty
            ? (object)DBNull.Value : statisticSnapshotId);
        Add(decisionCommand, "@reason_code", reasonCode);
        Add(decisionCommand, "@policy_version", policyVersion);
        Add(decisionCommand, "@at", quarantinedAt);
        await decisionCommand.ExecuteNonQueryAsync(cancellationToken);
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
