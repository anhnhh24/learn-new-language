using System.Data.Common;
using Toeic.Domain.Analytics;
using Toeic.Domain.Content;

namespace Toeic.Infrastructure.Persistence;

internal sealed class PostgresItemTelemetryStore(IPostgresSession session) : IItemTelemetryStore
{
    public async Task<bool> AppendExposureAsync(ItemExposure exposure,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(exposure);
        ValidateIdentity(exposure.EventId, exposure.AttemptId, exposure.ItemRevisionId,
            exposure.LearnerHash, exposure.FormVersion);
        await using var command = CreateCommand("""
            insert into assessment.item_exposures
                (event_id, attempt_id, item_revision_id, learner_hash, form_version, exposed_at)
            values (@event_id, @attempt_id, @item_revision_id, @learner_hash, @form_version, @at)
            on conflict (attempt_id, item_revision_id) do nothing;
            """);
        Add(command, "@event_id", exposure.EventId);
        Add(command, "@attempt_id", exposure.AttemptId);
        Add(command, "@item_revision_id", exposure.ItemRevisionId);
        Add(command, "@learner_hash", exposure.LearnerHash);
        Add(command, "@form_version", exposure.FormVersion);
        Add(command, "@at", exposure.ExposedAt);
        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
    }

    public async Task<bool> AppendResponseAsync(ItemResponse response,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(response);
        ValidateIdentity(response.EventId, response.AttemptId, response.ItemRevisionId,
            response.LearnerHash, response.FormVersion);
        if (string.IsNullOrWhiteSpace(response.SelectedOptionId) ||
            string.IsNullOrWhiteSpace(response.AbilityBand) || response.ResponseTimeMs < 0)
            throw new DomainException("ITEM_RESPONSE_INVALID");
        await using var command = CreateCommand("""
            insert into assessment.item_responses
                (event_id, attempt_id, item_revision_id, learner_hash, form_version,
                 selected_option_id, correct, valid, response_time_ms, ability_band, responded_at)
            values (@event_id, @attempt_id, @item_revision_id, @learner_hash, @form_version,
                    @selected_option_id, @correct, @valid, @response_time_ms, @ability_band, @at)
            on conflict (attempt_id, item_revision_id) do nothing;
            """);
        Add(command, "@event_id", response.EventId);
        Add(command, "@attempt_id", response.AttemptId);
        Add(command, "@item_revision_id", response.ItemRevisionId);
        Add(command, "@learner_hash", response.LearnerHash);
        Add(command, "@form_version", response.FormVersion);
        Add(command, "@selected_option_id", response.SelectedOptionId);
        Add(command, "@correct", response.Correct);
        Add(command, "@valid", response.Valid);
        Add(command, "@response_time_ms", response.ResponseTimeMs);
        Add(command, "@ability_band", response.AbilityBand);
        Add(command, "@at", response.RespondedAt);
        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
    }

    public async Task<ReportAppendResult> AppendReportAsync(LearnerIssueReport report,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(report);
        if (report.Id == Guid.Empty || report.ItemRevisionId == Guid.Empty ||
            !ValidLearnerHash(report.ReporterHash) || string.IsNullOrWhiteSpace(report.Category) ||
            report.Comment?.Length > 2000)
            throw new DomainException("ISSUE_REPORT_INVALID");
        await using var command = CreateCommand("""
            insert into assessment.learner_issue_reports
                (id, item_revision_id, reporter_hash, category, comment, state, reported_at)
            values (@id, @item_revision_id, @reporter_hash, @category, @comment, 'Open', @at)
            on conflict (item_revision_id, reporter_hash, category)
            do update set id = assessment.learner_issue_reports.id
            returning id, id = @id;
            """);
        Add(command, "@id", report.Id);
        Add(command, "@item_revision_id", report.ItemRevisionId);
        Add(command, "@reporter_hash", report.ReporterHash);
        Add(command, "@category", report.Category);
        Add(command, "@comment", report.Comment ?? (object)DBNull.Value);
        Add(command, "@at", report.ReportedAt);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
            throw new DomainException("ISSUE_REPORT_PERSISTENCE_FAILED");
        return new(reader.GetGuid(0), reader.GetBoolean(1));
    }

    private DbCommand CreateCommand(string sql)
    {
        var command = session.Connection.CreateCommand();
        command.Transaction = session.Transaction;
        command.CommandText = sql;
        return command;
    }

    private static void ValidateIdentity(Guid eventId, Guid attemptId, Guid itemRevisionId,
        string learnerHash, string formVersion)
    {
        if (eventId == Guid.Empty || attemptId == Guid.Empty || itemRevisionId == Guid.Empty ||
            !ValidLearnerHash(learnerHash) || string.IsNullOrWhiteSpace(formVersion))
            throw new DomainException("ITEM_TELEMETRY_INVALID");
    }

    private static bool ValidLearnerHash(string value) => value is { Length: 64 } &&
        value.All(character => char.IsAsciiHexDigit(character));

    private static void Add(DbCommand command, string name, object value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value;
        command.Parameters.Add(parameter);
    }
}
