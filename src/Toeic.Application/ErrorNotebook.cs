namespace Toeic.Application;

public sealed record ErrorQuestionSnapshot(QuizQuestion Question, string SelectedOptionId, IReadOnlyList<string> CorrectOptionIds);
public sealed record ErrorEntryView(Guid Id, Guid SourceAttemptId, Guid SourceQuestionId, string PrimaryTag,
    string State, long Revision, string? IgnoreReason, DateTimeOffset LastSeenAt, DateTimeOffset UpdatedAt,
    ErrorQuestionSnapshot? Snapshot);
public sealed record ErrorEntryPage(IReadOnlyList<ErrorEntryView> Items, int Page, int PageSize, bool HasMore);
public sealed record ChangeErrorEntry(long ExpectedRevision, string Action, string? Reason);
public sealed record ErrorNotebookSummary(int Open, int Improving, int Resolved, int Ignored);
public sealed record CaptureQuizErrors(Guid AttemptId);
public sealed record CaptureQuizErrorsReceipt(int Added);

public interface IErrorNotebook
{
    Task<ErrorEntryPage> ListAsync(Guid user, string? state, string? tag, int page, int pageSize, CancellationToken ct);
    Task<ErrorEntryView> GetAsync(Guid user, Guid id, CancellationToken ct);
    Task<ErrorEntryView> ChangeAsync(Guid user, Guid id, ChangeErrorEntry request, CancellationToken ct);
    Task<ErrorNotebookSummary> SummaryAsync(Guid user, CancellationToken ct);
    Task<CaptureQuizErrorsReceipt> CaptureAsync(Guid user, CaptureQuizErrors request, CancellationToken ct);
}
