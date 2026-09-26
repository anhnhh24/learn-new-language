namespace Toeic.Application;

public sealed record PracticeForm(Guid Id,string Title,string Tier,int QuestionCount,int DurationSeconds);
public sealed record PracticePage<T>(IReadOnlyList<T> Items,int Page,int PageSize,bool HasMore);
public sealed record StartPractice(Guid FormId,Guid ClientOperationId);
public sealed record PracticeLease(string Token,bool AllowTakeover);
public sealed record PracticeLeaseReceipt(DateTimeOffset ExpiresAt,DateTimeOffset ServerTime);
public sealed record SavePracticeAnswer(Guid ClientOperationId,long ExpectedRevision,Guid QuestionId,string? OptionId,string LeaseToken);
public sealed record SubmitPractice(Guid ClientOperationId,long ExpectedRevision,string LeaseToken);
public sealed record PracticeHelp(string Tag,string Explanation,string? Evidence);
public sealed record PracticeItemResult(Guid QuestionId,string? SelectedOptionId,IReadOnlyList<string> CorrectOptionIds,bool Correct,PracticeHelp Help);
public sealed record PracticeResult(Guid AttemptId,decimal RawScore,decimal MaxScore,int AnsweredCount,DateTimeOffset SubmittedAt,
    int ElapsedSeconds,IReadOnlyList<PracticeItemResult> Items,string PolicyVersion);
public sealed record PracticeView(Guid Id,string Title,string Tier,string LearnerLabel,string Status,long Revision,
    DateTimeOffset StartedAt,DateTimeOffset Deadline,DateTimeOffset ServerTime,IReadOnlyList<QuizQuestion> Questions,
    IReadOnlyList<QuizAnswer> Answers,PracticeResult? Result);
public sealed record PracticeHistoryItem(Guid Id,string Title,string Status,DateTimeOffset StartedAt,DateTimeOffset Deadline);
public interface IPracticeExams
{
    Task<PracticePage<PracticeForm>> CatalogAsync(Guid user,int page,int pageSize,CancellationToken ct);
    Task<PracticeView> StartAsync(Guid user,StartPractice request,CancellationToken ct);
    Task<PracticeView> GetAsync(Guid user,Guid id,CancellationToken ct);
    Task<PracticeLeaseReceipt> LeaseAsync(Guid user,Guid id,PracticeLease request,CancellationToken ct);
    Task<QuizAnswerReceipt> SaveAsync(Guid user,Guid id,SavePracticeAnswer request,CancellationToken ct);
    Task<PracticeResult> SubmitAsync(Guid user,Guid id,SubmitPractice request,CancellationToken ct);
    Task<PracticePage<PracticeHistoryItem>> HistoryAsync(Guid user,int page,int pageSize,CancellationToken ct);
}
