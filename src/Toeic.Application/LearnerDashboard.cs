namespace Toeic.Application;

public sealed record LearningOverview(int EnrolledCourses, int PublishedLessons, int CompletedLessons,
    int LessonsNeedingReview, int LessonsWithQuiz, decimal? MeanFirstQuizAccuracy,
    int GradedQuizAttempts, int PassedCheckpointAttempts, int OpenErrors, int ImprovingErrors,
    int DueCards, int UnintroducedCards);
public sealed record CourseLearningStats(Guid EnrollmentId, Guid CourseVersionId, string Title, string EnrollmentState,
    int PublishedLessons, int CompletedLessons, int LessonsNeedingReview, int LessonsWithQuiz,
    decimal? MeanFirstQuizAccuracy, int PassedCheckpoints, int TotalCheckpoints);
public sealed record CourseLearningPage(IReadOnlyList<CourseLearningStats> Items, int Page, int PageSize, bool HasMore);
public sealed record LearningDay(DateOnly Date, int LessonsCompleted, int QuizzesSubmitted, int CardReviews, int EarlyCardReviews);
public sealed record LearnerDashboardView(DateTimeOffset GeneratedAt, string TimeZone, LearningOverview Overview,
    CourseLearningPage Courses, IReadOnlyList<LearningDay> Days, string MeasurementPolicy);

public interface ILearnerDashboard
{
    Task<LearnerDashboardView> GetAsync(Guid user, int days, int coursePage, int coursePageSize, CancellationToken ct);
}
