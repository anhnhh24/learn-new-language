using System.Collections.Immutable;

namespace Toeic.Domain.Learning;

using Toeic.Domain.Content;

public enum EnrollmentState { Active, Completed, Archived }
public enum ErrorEntryState { Open, Improving, Resolved, Ignored }
public enum ReviewRating { Forgot, Hard, Remembered, Easy }
public enum CardLearningState { New, Learning, Relearning, Review }

public sealed class Enrollment
{
    public Guid Id { get; }
    public string LearnerId { get; }
    public Guid CourseVersionId { get; }
    public EnrollmentState State { get; private set; } = EnrollmentState.Active;
    public DateTimeOffset EnrolledAt { get; }

    public Enrollment(Guid id, string learnerId, Guid courseVersionId, DateTimeOffset enrolledAt)
    {
        if (id == Guid.Empty || courseVersionId == Guid.Empty || string.IsNullOrWhiteSpace(learnerId))
            throw new DomainException("ENROLLMENT_INVALID");
        Id = id;
        LearnerId = learnerId.Trim();
        CourseVersionId = courseVersionId;
        EnrolledAt = enrolledAt;
    }

    public void Complete(string learnerId)
    {
        RequireOwner(learnerId);
        if (State == EnrollmentState.Archived) throw new DomainException("ENROLLMENT_ARCHIVED");
        State = EnrollmentState.Completed;
    }

    public void Archive(Actor actor)
    {
        if (actor is null || actor.Type != ActorType.Admin || string.IsNullOrWhiteSpace(actor.Id))
            throw new DomainException("FORBIDDEN");
        State = EnrollmentState.Archived;
    }

    private void RequireOwner(string learnerId)
    {
        if (LearnerId != learnerId?.Trim()) throw new DomainException("ENROLLMENT_NOT_FOUND");
    }
}

public sealed class LessonProgress
{
    private readonly ImmutableHashSet<Guid> requiredPageIds;
    private readonly ImmutableHashSet<Guid> allPageIds;
    private readonly HashSet<Guid> readPageIds = [];

    public Guid Id { get; }
    public string LearnerId { get; }
    public Guid LessonVersionId { get; }
    public long Revision { get; private set; }
    public Guid? BookmarkPageId { get; private set; }
    public bool QuizSubmitted { get; private set; }
    public decimal? FirstQuizAccuracy { get; private set; }
    public bool Completed { get; private set; }
    public bool NeedsReview { get; private set; }
    public DateTimeOffset? CompletedAt { get; private set; }
    public IReadOnlySet<Guid> ReadPageIds => readPageIds;

    public LessonProgress(Guid id, string learnerId, Guid lessonVersionId, IEnumerable<Guid> requiredPages, IEnumerable<Guid>? allPages = null)
    {
        if (id == Guid.Empty || lessonVersionId == Guid.Empty || string.IsNullOrWhiteSpace(learnerId))
            throw new DomainException("LESSON_PROGRESS_INVALID");
        requiredPageIds = requiredPages?.ToImmutableHashSet() ?? [];
        if (requiredPageIds.IsEmpty || requiredPageIds.Contains(Guid.Empty))
            throw new DomainException("REQUIRED_PAGES_INVALID");

        Id = id;
        LearnerId = learnerId.Trim();
        LessonVersionId = lessonVersionId;
        allPageIds = allPages?.ToImmutableHashSet() ?? requiredPageIds;
        if (!requiredPageIds.IsSubsetOf(allPageIds) || allPageIds.Contains(Guid.Empty))
            throw new DomainException("LESSON_PAGES_INVALID");
    }

    internal void Restore(long revision, IEnumerable<Guid> pages, Guid? bookmark,
        bool quizSubmitted, decimal? accuracy, DateTimeOffset? completedAt, bool needsReview)
    {
        Revision = revision;
        readPageIds.UnionWith(pages);
        BookmarkPageId = bookmark;
        QuizSubmitted = quizSubmitted;
        FirstQuizAccuracy = accuracy;
        CompletedAt = completedAt;
        Completed = completedAt.HasValue;
        NeedsReview = needsReview;
    }

    public void MarkPageRead(string learnerId, Guid pageId, long expectedRevision,
        DateTimeOffset receivedAt)
    {
        RequireOwnerAndRevision(learnerId, expectedRevision);
        if (!allPageIds.Contains(pageId)) throw new DomainException("LESSON_PAGE_NOT_FOUND");
        if (readPageIds.Add(pageId)) Revision++;
        RecalculateCompletion(receivedAt);
    }

    public void SetBookmark(string learnerId, Guid? pageId, long expectedRevision)
    {
        RequireOwnerAndRevision(learnerId, expectedRevision);
        if (pageId.HasValue && !allPageIds.Contains(pageId.Value))
            throw new DomainException("LESSON_PAGE_NOT_FOUND");
        BookmarkPageId = pageId;
        Revision++;
    }

    public void SubmitQuiz(string learnerId, decimal earnedScore, decimal maximumScore,
        long expectedRevision, DateTimeOffset receivedAt)
    {
        RequireOwnerAndRevision(learnerId, expectedRevision);
        if (maximumScore <= 0 || earnedScore < 0 || earnedScore > maximumScore)
            throw new DomainException("QUIZ_SCORE_INVALID");

        var accuracy = decimal.Round(earnedScore / maximumScore, 4);
        FirstQuizAccuracy ??= accuracy;
        QuizSubmitted = true;
        NeedsReview |= accuracy < 0.8m;
        Revision++;
        RecalculateCompletion(receivedAt);
    }

    private void RecalculateCompletion(DateTimeOffset receivedAt)
    {
        if (!Completed && QuizSubmitted && requiredPageIds.IsSubsetOf(readPageIds))
        {
            Completed = true;
            CompletedAt = receivedAt;
        }
    }

    private void RequireOwnerAndRevision(string learnerId, long expectedRevision)
    {
        if (LearnerId != learnerId?.Trim()) throw new DomainException("LESSON_PROGRESS_NOT_FOUND");
        if (Revision != expectedRevision) throw new DomainException("PROGRESS_CONFLICT");
    }
}

public sealed class ErrorEntry
{
    private readonly HashSet<Guid> successfulFamilies = [];
    private readonly HashSet<DateOnly> successfulDates = [];

    public Guid Id { get; }
    public string LearnerId { get; }
    public Guid SourceAttemptId { get; }
    public Guid SourceQuestionRevisionId { get; }
    public string PrimaryTag { get; }
    public ErrorEntryState State { get; private set; } = ErrorEntryState.Open;
    public DateTimeOffset LastSeenAt { get; private set; }
    public string? IgnoreReason { get; private set; }

    public ErrorEntry(Guid id, string learnerId, Guid sourceAttemptId, Guid sourceQuestionRevisionId,
        string primaryTag, DateTimeOffset occurredAt)
    {
        if (id == Guid.Empty || sourceAttemptId == Guid.Empty || sourceQuestionRevisionId == Guid.Empty ||
            string.IsNullOrWhiteSpace(learnerId) || string.IsNullOrWhiteSpace(primaryTag))
            throw new DomainException("ERROR_ENTRY_INVALID");
        Id = id;
        LearnerId = learnerId.Trim();
        SourceAttemptId = sourceAttemptId;
        SourceQuestionRevisionId = sourceQuestionRevisionId;
        PrimaryTag = primaryTag.Trim();
        LastSeenAt = occurredAt;
    }

    public void RecordPractice(string learnerId, Guid questionFamilyId, bool correct,
        DateTimeOffset occurredAt, TimeZoneInfo learnerTimeZone)
    {
        RequireOwner(learnerId);
        if (questionFamilyId == Guid.Empty) throw new DomainException("QUESTION_FAMILY_REQUIRED");
        if (occurredAt < LastSeenAt) throw new DomainException("ERROR_EVIDENCE_OUT_OF_ORDER");

        LastSeenAt = occurredAt;

        if (!correct)
        {
            successfulFamilies.Clear();
            successfulDates.Clear();
            State = ErrorEntryState.Open;
            IgnoreReason = null;
            return;
        }

        successfulFamilies.Add(questionFamilyId);
        successfulDates.Add(DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(occurredAt, learnerTimeZone).Date));
        State = successfulFamilies.Count >= 2 && successfulDates.Count >= 2
            ? ErrorEntryState.Resolved
            : ErrorEntryState.Improving;
    }

    public void Ignore(string learnerId, string? reason)
    {
        RequireOwner(learnerId);
        if (reason?.Length > 500) throw new DomainException("IGNORE_REASON_TOO_LONG");
        State = ErrorEntryState.Ignored;
        IgnoreReason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
    }

    private void RequireOwner(string learnerId)
    {
        if (LearnerId != learnerId?.Trim()) throw new DomainException("ERROR_ENTRY_NOT_FOUND");
    }
}

public sealed record ReviewEvent(Guid EventId, Guid CardId, string LearnerId, ReviewRating Rating,
    int PreviousIntervalDays, int NewIntervalDays, DateTimeOffset ReviewedAt, DateTimeOffset DueAt,
    string AlgorithmVersion, bool WasEarly);

public sealed class UserCard
{
    private readonly Dictionary<Guid, ReviewEvent> reviewEvents = [];
    public const string AlgorithmVersion = "review-v1";
    public Guid Id { get; }
    public string LearnerId { get; }
    public Guid CardVersionId { get; }
    public int IntervalDays { get; private set; }
    public DateTimeOffset DueAt { get; private set; }
    public CardLearningState State { get; private set; } = CardLearningState.New;

    public UserCard(Guid id, string learnerId, Guid cardVersionId, DateTimeOffset createdAt)
    {
        if (id == Guid.Empty || cardVersionId == Guid.Empty || string.IsNullOrWhiteSpace(learnerId))
            throw new DomainException("USER_CARD_INVALID");
        Id = id;
        LearnerId = learnerId.Trim();
        CardVersionId = cardVersionId;
        DueAt = createdAt;
    }

    public ReviewEvent Review(string learnerId, ReviewRating rating, Guid eventId,
        DateTimeOffset reviewedAt, TimeZoneInfo learnerTimeZone)
    {
        if (LearnerId != learnerId?.Trim()) throw new DomainException("USER_CARD_NOT_FOUND");
        if (eventId == Guid.Empty) throw new DomainException("REVIEW_EVENT_ID_REQUIRED");

        if (reviewEvents.TryGetValue(eventId, out var replay))
        {
            if (replay.Rating != rating || replay.ReviewedAt != reviewedAt)
                throw new DomainException("IDEMPOTENCY_CONFLICT");
            return replay;
        }
        var previous = IntervalDays;
        if (reviewedAt < DueAt)
        {
            var early = new ReviewEvent(eventId, Id, LearnerId, rating, previous, previous,
                reviewedAt, DueAt, AlgorithmVersion, true);
            reviewEvents[eventId] = early;
            return early;
        }

        if (rating == ReviewRating.Forgot)
        {
            IntervalDays = 0;
            DueAt = reviewedAt.AddMinutes(10);
            State = CardLearningState.Relearning;
        }
        else
        {
            IntervalDays = Math.Min(180, rating switch
            {
                ReviewRating.Hard => Math.Max(1, (int)Math.Ceiling(previous * 1.2m)),
                ReviewRating.Remembered => previous == 0 ? 1 : (int)Math.Ceiling(previous * 2m),
                ReviewRating.Easy => previous == 0 ? 3 : (int)Math.Ceiling(previous * 3m),
                _ => throw new DomainException("REVIEW_RATING_INVALID")
            });
            DueAt = AtEightLocalDaysLater(reviewedAt, IntervalDays, learnerTimeZone);
            State = CardLearningState.Review;
        }

        var review = new ReviewEvent(eventId, Id, LearnerId, rating, previous, IntervalDays,
            reviewedAt, DueAt, AlgorithmVersion, false);
        reviewEvents[eventId] = review;
        return review;
    }

    private static DateTimeOffset AtEightLocalDaysLater(DateTimeOffset now, int days,
        TimeZoneInfo timeZone)
    {
        var localNow = TimeZoneInfo.ConvertTime(now, timeZone);
        var localTarget = DateTime.SpecifyKind(localNow.Date.AddDays(days).AddHours(8), DateTimeKind.Unspecified);
        if (timeZone.IsInvalidTime(localTarget)) localTarget = localTarget.AddHours(1);
        var offset = timeZone.GetUtcOffset(localTarget);
        return new DateTimeOffset(localTarget, offset).ToUniversalTime();
    }
}
