using System.Collections.Immutable;
using Toeic.Domain.Analytics;
using Toeic.Domain.Assessment;
using Toeic.Domain.Content;

namespace Toeic.Application;

public sealed record BetaFormMaterialization(BetaFormVersion Form, string ExamProfileVersion,
    TimeSpan AttemptDuration, ImmutableArray<AttemptItemSnapshot> ItemSnapshots);

public sealed record StartedBetaAttempt(Guid AttemptId, Guid FormId, string FormVersion,
    string Tier, string LearnerLabel, DateTimeOffset StartedAt, DateTimeOffset Deadline);
public sealed record StartBetaAttemptCommand(Guid FormId, Guid ClientOperationId);

public sealed record ReportIssueCommand(Guid AttemptId, Guid ItemRevisionId, string Category,
    string? Comment);

public sealed record ReportIssueReceipt(Guid ReportId, bool Replayed);

public interface IBetaServingControl
{
    Task<bool> IsEnabledAsync(CancellationToken cancellationToken);
}

public interface IBetaFormReader
{
    Task<BetaFormMaterialization?> FindForServingAsync(Guid formId, CancellationToken cancellationToken);
}

public interface IAttemptStore
{
    Task AddAsync(Attempt attempt, CancellationToken cancellationToken);
    Task<bool> IsOwnedExposedItemAsync(Guid attemptId, string learnerId, Guid itemRevisionId,
        CancellationToken cancellationToken);
}

public interface ILearnerAnalyticsPseudonymizer
{
    string Pseudonymize(string learnerId);
}

public sealed record StartAttemptReceipt(string LearnerId, Guid ClientOperationId,
    Guid FormId, StartedBetaAttempt Response);

public interface IStartAttemptReceiptStore
{
    Task<StartAttemptReceipt?> FindAsync(string learnerId, Guid clientOperationId,
        CancellationToken cancellationToken);
    Task AddAsync(StartAttemptReceipt receipt, CancellationToken cancellationToken);
}

public sealed class BetaServingService(IApplicationTransaction transaction,
    IBetaServingControl control, IBetaFormReader forms, IAttemptStore attempts,
    IItemTelemetryStore telemetry, ILearnerAnalyticsPseudonymizer pseudonymizer,
    IStartAttemptReceiptStore receipts, TimeProvider clock)
{
    public Task<StartedBetaAttempt> StartAsync(StartBetaAttemptCommand command, Actor learner,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        RequireLearner(learner);
        if (command.FormId == Guid.Empty || command.ClientOperationId == Guid.Empty)
            throw new DomainException("START_ATTEMPT_INVALID");

        return transaction.ExecuteAsync(async ct =>
        {
            var replay = await receipts.FindAsync(learner.Id, command.ClientOperationId, ct);
            if (replay is not null)
            {
                if (replay.FormId != command.FormId)
                    throw new DomainException("IDEMPOTENCY_CONFLICT");
                return replay.Response;
            }
            if (!await control.IsEnabledAsync(ct))
                throw new DomainException("BETA_SERVING_DISABLED");

            var materialization = await forms.FindForServingAsync(command.FormId, ct) ??
                throw new DomainException("FORM_NOT_FOUND");
            if (materialization.Form.State != FormState.Active)
                throw new DomainException("FORM_NOT_AVAILABLE");
            PublicationPolicy.RequireSupportedTier(materialization.Form.Tier);
            if (materialization.AttemptDuration <= TimeSpan.Zero ||
                materialization.ItemSnapshots.IsDefaultOrEmpty ||
                materialization.ItemSnapshots.Length != materialization.Form.Items.Sum(item => item.QuestionRevisionIds.Length))
                throw new DomainException("FORM_MATERIALIZATION_INVALID");

            var formRevisionIds = materialization.Form.Items
                .SelectMany(item => item.QuestionRevisionIds).ToHashSet();
            if (materialization.ItemSnapshots.Any(item =>
                    !formRevisionIds.Contains(item.QuestionRevisionId)))
                throw new DomainException("FORM_MATERIALIZATION_INVALID");

            var now = clock.GetUtcNow();
            var attempt = new Attempt(Guid.NewGuid(), learner.Id, materialization.Form.Id,
                materialization.ExamProfileVersion, AttemptMode.Practice,
                materialization.ItemSnapshots, now, now.Add(materialization.AttemptDuration));
            await attempts.AddAsync(attempt, ct);

            var learnerHash = pseudonymizer.Pseudonymize(learner.Id);
            if (string.IsNullOrWhiteSpace(learnerHash))
                throw new DomainException("ANALYTICS_PSEUDONYM_INVALID");
            foreach (var item in materialization.ItemSnapshots)
            {
                var appended = await telemetry.AppendExposureAsync(new ItemExposure(Guid.NewGuid(),
                    attempt.Id, item.QuestionRevisionId, learnerHash, materialization.Form.Version, now), ct);
                if (!appended) throw new DomainException("EXPOSURE_CONFLICT");
            }

            var label = PublicationPolicy.LearnerLabel(materialization.Form.Tier) ??
                throw new DomainException("PUBLICATION_TIER_DISABLED");
            var response = new StartedBetaAttempt(attempt.Id, materialization.Form.Id,
                materialization.Form.Version, materialization.Form.Tier.ToString(), label,
                now, attempt.Deadline);
            await receipts.AddAsync(new StartAttemptReceipt(learner.Id,
                command.ClientOperationId, command.FormId, response), ct);
            return response;
        }, cancellationToken);
    }

    private static void RequireLearner(Actor actor)
    {
        if (actor is null || actor.Type != ActorType.Learner || string.IsNullOrWhiteSpace(actor.Id))
            throw new DomainException("FORBIDDEN");
    }
}

public sealed class LearnerIssueReportService(IApplicationTransaction transaction, IAttemptStore attempts,
    IItemTelemetryStore telemetry, ILearnerAnalyticsPseudonymizer pseudonymizer,
    TimeProvider clock)
{
    private static readonly ImmutableHashSet<string> AllowedCategories =
        ImmutableHashSet.Create(StringComparer.Ordinal, "WRONG_KEY", "AMBIGUOUS",
            "EXPLANATION", "TYPO", "TECHNICAL");

    public Task<ReportIssueReceipt> ReportAsync(ReportIssueCommand command, Actor learner,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        if (learner is null || learner.Type != ActorType.Learner ||
            string.IsNullOrWhiteSpace(learner.Id))
            throw new DomainException("FORBIDDEN");
        var category = command.Category?.Trim().ToUpperInvariant();
        if (command.AttemptId == Guid.Empty || command.ItemRevisionId == Guid.Empty ||
            category is null || !AllowedCategories.Contains(category) ||
            command.Comment?.Length > 2000)
            throw new DomainException("ISSUE_REPORT_INVALID");
        return transaction.ExecuteAsync(async ct =>
        {
            if (!await attempts.IsOwnedExposedItemAsync(command.AttemptId, learner.Id,
                    command.ItemRevisionId, ct))
                throw new DomainException("ATTEMPT_NOT_FOUND");
            var learnerHash = pseudonymizer.Pseudonymize(learner.Id);
            if (string.IsNullOrWhiteSpace(learnerHash))
                throw new DomainException("ANALYTICS_PSEUDONYM_INVALID");

            var report = new LearnerIssueReport(Guid.NewGuid(), command.ItemRevisionId,
                learnerHash, category,
                string.IsNullOrWhiteSpace(command.Comment) ? null : command.Comment.Trim(),
                clock.GetUtcNow());
            var result = await telemetry.AppendReportAsync(report, ct);
            return new ReportIssueReceipt(result.ReportId, !result.Inserted);
        }, cancellationToken);
    }
}
