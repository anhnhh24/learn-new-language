using System.Collections.Immutable;

namespace Toeic.Domain.Analytics;

using Toeic.Domain.Content;

public sealed record ItemExposure(Guid EventId, Guid AttemptId, Guid ItemRevisionId,
    string LearnerHash, string FormVersion, DateTimeOffset ExposedAt);
public sealed record ItemResponse(Guid EventId, Guid AttemptId, Guid ItemRevisionId,
    string LearnerHash, string FormVersion, string SelectedOptionId, bool Correct, bool Valid,
    long ResponseTimeMs, string AbilityBand, DateTimeOffset RespondedAt);
public sealed record LearnerIssueReport(Guid Id, Guid ItemRevisionId, string ReporterHash,
    string Category, string? Comment, DateTimeOffset ReportedAt);
public sealed record ReportAppendResult(Guid ReportId, bool Inserted);

public sealed record ItemStatisticSnapshot(Guid Id, Guid ItemRevisionId, string PolicyVersion,
    string Population, DateTimeOffset WindowStart, DateTimeOffset WindowEnd, int ValidResponses,
    int Exposures, decimal CorrectRate, decimal PointBiserial,
    ImmutableDictionary<string, decimal> DistractorRates,
    int UnresolvedReportCount, int HighestCategoryReporterCount);

public enum StatisticalAction { KeepBeta, PromoteDataValidated, Quarantine }

public sealed record StatisticalDecision(StatisticalAction Action, string ReasonCode,
    string PolicyVersion, Guid SnapshotId, Guid ItemRevisionId);

public static class ItemStatisticsPolicy
{
    public static StatisticalDecision Evaluate(ItemStatisticSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        if (snapshot.Id == Guid.Empty || snapshot.ItemRevisionId == Guid.Empty ||
            string.IsNullOrWhiteSpace(snapshot.PolicyVersion) || snapshot.ValidResponses < 0 ||
            snapshot.Exposures < snapshot.ValidResponses || snapshot.CorrectRate is < 0 or > 1 ||
            snapshot.PointBiserial is < -1 or > 1 || snapshot.WindowEnd <= snapshot.WindowStart ||
            snapshot.UnresolvedReportCount < 0 || snapshot.HighestCategoryReporterCount < 0 ||
            snapshot.HighestCategoryReporterCount > snapshot.UnresolvedReportCount ||
            snapshot.DistractorRates.Any(rate => rate.Value is < 0 or > 1))
            throw new DomainException("STATISTIC_SNAPSHOT_INVALID");

        var reportRate = snapshot.Exposures == 0
            ? 0
            : (decimal)snapshot.HighestCategoryReporterCount / snapshot.Exposures;
        if (snapshot.ValidResponses >= 100 && snapshot.PointBiserial < 0)
            return Decision(StatisticalAction.Quarantine, "NEGATIVE_POINT_BISERIAL", snapshot);
        if (snapshot.HighestCategoryReporterCount >= 3 && reportRate >= 0.01m)
            return Decision(StatisticalAction.Quarantine, "REPORT_THRESHOLD_REACHED", snapshot);
        if (snapshot.ValidResponses >= 300 && snapshot.PointBiserial >= 0.15m &&
            snapshot.UnresolvedReportCount == 0)
            return Decision(StatisticalAction.PromoteDataValidated,
                "DATA_VALIDATED_THRESHOLD_REACHED", snapshot);
        return Decision(StatisticalAction.KeepBeta, snapshot.ValidResponses < 300
            ? "INSUFFICIENT_SAMPLE"
            : "DISCRIMINATION_BELOW_PROMOTION", snapshot);
    }

    private static StatisticalDecision Decision(StatisticalAction action, string reason,
        ItemStatisticSnapshot snapshot) => new(action, reason, snapshot.PolicyVersion, snapshot.Id,
            snapshot.ItemRevisionId);
}

public interface IItemTelemetryStore
{
    Task<bool> AppendExposureAsync(ItemExposure exposure, CancellationToken cancellationToken);
    Task<bool> AppendResponseAsync(ItemResponse response, CancellationToken cancellationToken);
    Task<ReportAppendResult> AppendReportAsync(LearnerIssueReport report, CancellationToken cancellationToken);
}
