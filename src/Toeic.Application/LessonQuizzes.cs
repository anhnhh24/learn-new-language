namespace Toeic.Application;

public sealed record StartLessonQuiz(Guid ClientOperationId);
public sealed record SaveQuizAnswer(Guid ClientOperationId, long ExpectedRevision, Guid QuestionId, string? OptionId);
public sealed record SubmitLessonQuiz(Guid ClientOperationId, long ExpectedRevision);
public sealed record QuizOption(string Id, string Text);
public sealed record QuizQuestion(Guid Id, string Section, string? Stimulus, string Prompt, IReadOnlyList<QuizOption> Options);
public sealed record QuizAnswer(Guid QuestionId, string? OptionId);
public sealed record QuizAnswerReceipt(long Revision, DateTimeOffset SavedAt);
public sealed record QuizItemResult(Guid QuestionId, string? SelectedOptionId, IReadOnlyList<string> CorrectOptionIds, bool Correct);
public sealed record LessonQuizResult(Guid AttemptId, decimal RawScore, decimal MaxScore, decimal Accuracy,
    bool Passed, bool IsCheckpoint, DateTimeOffset SubmittedAt, DateTimeOffset? RetryAt,
    IReadOnlyList<QuizItemResult> Items, string PolicyVersion);
public sealed record LessonQuizView(Guid Id, Guid LessonId, string Status, string Tier, string LearnerLabel,
    DateTimeOffset StartedAt, DateTimeOffset Deadline, DateTimeOffset ServerTime, long Revision,
    IReadOnlyList<QuizQuestion> Questions, IReadOnlyList<QuizAnswer> Answers, LessonQuizResult? Result);
public sealed record LessonQuizHistoryItem(Guid Id, string Status, DateTimeOffset StartedAt,
    DateTimeOffset Deadline, bool? Passed, DateTimeOffset? RetryAt);
public sealed record LessonQuizHistory(IReadOnlyList<LessonQuizHistoryItem> Items, int Page, int PageSize, bool HasMore);

public interface ILessonQuizzes
{
    Task<LessonQuizView> StartAsync(Guid user, Guid lesson, StartLessonQuiz request, CancellationToken ct);
    Task<LessonQuizView> GetAsync(Guid user, Guid attempt, CancellationToken ct);
    Task<QuizAnswerReceipt> SaveAsync(Guid user, Guid attempt, SaveQuizAnswer request, CancellationToken ct);
    Task<LessonQuizResult> SubmitAsync(Guid user, Guid attempt, SubmitLessonQuiz request, CancellationToken ct);
    Task<LessonQuizHistory> HistoryAsync(Guid user, Guid lesson, int page, int pageSize, CancellationToken ct);
}
