namespace Toeic.Application;

public sealed record NextLearningActivity(Guid EnrollmentId, Guid LessonVersionId,
    string LessonCode, string Title, int EstimatedMinutes, Guid? BookmarkPageId,
    string Action, string Availability);
public sealed record TodayView(NextLearningActivity? NextActivity, int DueCards,
    int OpenErrors, int CompletedLessons, int TotalLessons, string EmptyReason);

public interface ILearnerToday
{
    Task<TodayView> GetAsync(Guid learnerId, CancellationToken ct);
}
