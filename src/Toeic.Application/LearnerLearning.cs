namespace Toeic.Application;

public sealed record EnrollmentView(Guid Id, Guid CourseVersionId, string CourseSlug,
    string CourseVersion, string Title, string State, DateTimeOffset EnrolledAt);
public sealed record LessonProgressView(Guid LessonVersionId, long Revision,
    IReadOnlyList<Guid> ReadPageIds, Guid? BookmarkPageId, bool QuizSubmitted,
    decimal? FirstQuizAccuracy, bool Completed, bool NeedsReview, DateTimeOffset? CompletedAt);
public sealed record SaveReadingProgress(long ExpectedRevision, Guid[] ReadPageIds,
    Guid? BookmarkPageId);
public sealed record EnrolledLessonView(PublishedLessonView Lesson, LessonProgressView Progress);

public interface ILearnerLearning
{
    Task<EnrollmentView> EnrollAsync(Guid learnerId, Guid courseVersionId, CancellationToken ct);
    Task<IReadOnlyList<EnrollmentView>> ListEnrollmentsAsync(Guid learnerId, CancellationToken ct);
    Task<EnrolledLessonView> ReadLessonAsync(Guid learnerId, Guid enrollmentId,
        string lessonCode, CancellationToken ct);
    Task<LessonProgressView> ReadProgressAsync(Guid learnerId, Guid lessonId, CancellationToken ct);
    Task<LessonProgressView> SaveProgressAsync(Guid learnerId, Guid lessonId,
        SaveReadingProgress request, CancellationToken ct);
}
