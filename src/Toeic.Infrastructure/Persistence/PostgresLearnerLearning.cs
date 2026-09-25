using System.Data.Common;
using System.Text.Json;
using Toeic.Application;
using Toeic.Domain.Content;
using Toeic.Domain.Learning;

namespace Toeic.Infrastructure.Persistence;

internal sealed class PostgresLearnerLearning(
    IDbConnectionFactory connections, TimeProvider clock)
    : ILearnerLearning
{
    public async Task<EnrollmentView> EnrollAsync(Guid learnerId, Guid courseVersionId, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var tx = await connection.BeginTransactionAsync(ct);
        await RequireActiveAsync(connection, tx, learnerId, ct);
        await using var course = connection.Query("""
            select access_model from learning.course_versions
            where id = @course and state = 'Published' for share;
            """, tx, ("course", courseVersionId));
        var accessModel = await course.ExecuteScalarAsync(ct) as string
            ?? throw new DomainException("COURSE_NOT_FOUND");
        if (accessModel == "PaidEntitlement" &&
            !await HasEntitlementAsync(connection, tx, learnerId, courseVersionId, ct))
            throw new DomainException("FORBIDDEN");
        await using var insert = connection.Query("""
            insert into learning.enrollments (id, learner_id, course_version_id, state, enrolled_at)
            values (@id, @learner, @course, 'Active', @now)
            on conflict (learner_id, course_version_id) do nothing;
            """, tx, ("id", Guid.NewGuid()), ("learner", learnerId),
            ("course", courseVersionId), ("now", clock.GetUtcNow()));
        await insert.ExecuteNonQueryAsync(ct);
        await using var select = connection.Query("""
            select e.id, e.course_version_id, cv.slug, cv.version, cv.title, e.state, e.enrolled_at
            from learning.enrollments e join learning.course_versions cv on cv.id = e.course_version_id
            where e.learner_id = @learner and e.course_version_id = @course;
            """, tx, ("learner", learnerId), ("course", courseVersionId));
        EnrollmentView result;
        await using (var reader = await select.ExecuteReaderAsync(ct))
        {
            await reader.ReadAsync(ct);
            result = MapEnrollment(reader);
            if (result.State == "Archived") throw new DomainException("ENROLLMENT_ARCHIVED");
        }
        await tx.CommitAsync(ct);
        return result;
    }

    public async Task<IReadOnlyList<EnrollmentView>> ListEnrollmentsAsync(Guid learnerId, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = connection.Query("""
            select e.id, e.course_version_id, cv.slug, cv.version, cv.title, e.state, e.enrolled_at
            from learning.enrollments e join learning.course_versions cv on cv.id = e.course_version_id
            join identity_data.users u on u.id = e.learner_id and u.status = 'Active'
            where e.learner_id = @learner order by e.enrolled_at desc, e.id;
            """, null, ("learner", learnerId));
        var result = new List<EnrollmentView>();
        await using var reader = await command.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct)) result.Add(MapEnrollment(reader));
        return result;
    }

    public async Task<EnrolledLessonView> ReadLessonAsync(Guid learnerId, Guid enrollmentId,
        string lessonCode, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var tx = await connection.BeginTransactionAsync(ct);
        await RequireActiveAsync(connection, tx, learnerId, ct);
        await using var command = connection.Query("""
            select cv.id, cv.slug, cv.access_model
            from learning.enrollments e join learning.course_versions cv on cv.id = e.course_version_id
            where e.id = @enrollment and e.learner_id = @learner
              and e.state in ('Active','Completed') and cv.state = 'Published'
            for share of e, cv;
            """, tx, ("enrollment", enrollmentId), ("learner", learnerId));
        Guid courseId;
        string slug, accessModel;
        await using (var reader = await command.ExecuteReaderAsync(ct))
        {
            if (!await reader.ReadAsync(ct)) throw new DomainException("ENROLLMENT_NOT_FOUND");
            courseId = reader.GetGuid(0);
            slug = reader.GetString(1);
            accessModel = reader.GetString(2);
        }
        if (accessModel == "PaidEntitlement" &&
            !await HasEntitlementAsync(connection, tx, learnerId, courseId, ct))
            throw new DomainException("FORBIDDEN");
        var lesson = await PostgresCurriculumReader.ReadLessonAsync(connection, slug, lessonCode, ct, courseId)
            ?? throw new DomainException("LESSON_NOT_FOUND");
        var progress = await LoadProgressAsync(connection, tx, learnerId, lesson.Id,
            lesson.Pages.Where(p => p.Required).Select(p => p.Id),
            lesson.Pages.Select(p => p.Id), false, ct);
        await tx.CommitAsync(ct);
        return new EnrolledLessonView(lesson, View(progress));
    }

    public async Task<LessonProgressView> ReadProgressAsync(Guid learnerId, Guid lessonId, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var tx = await connection.BeginTransactionAsync(ct);
        await RequireActiveAsync(connection, tx, learnerId, ct);
        // Progress remains visible after entitlement expiry or content withdrawal.
        await RequireLessonAccessAsync(connection, tx, learnerId, lessonId, false, ct);
        var pages = await ReadPageIdsAsync(connection, tx, lessonId, ct);
        var result = await LoadProgressAsync(connection, tx, learnerId, lessonId,
            pages.Required, pages.All, false, ct);
        await tx.CommitAsync(ct);
        return View(result);
    }

    public async Task<LessonProgressView> SaveProgressAsync(Guid learnerId, Guid lessonId,
        SaveReadingProgress request, CancellationToken ct)
    {
        if (request.ExpectedRevision < 0 || request.ReadPageIds is null || request.ReadPageIds.Length > 200)
            throw new DomainException("PROGRESS_INVALID");
        await using var connection = await connections.OpenAsync(ct);
        await using var tx = await connection.BeginTransactionAsync(ct);
        await RequireActiveAsync(connection, tx, learnerId, ct);
        await RequireLessonAccessAsync(connection, tx, learnerId, lessonId, true, ct);
        var pages = await ReadPageIdsAsync(connection, tx, lessonId, ct);
        if (request.ReadPageIds.Any(id => !pages.All.Contains(id)) ||
            (request.BookmarkPageId.HasValue && !pages.All.Contains(request.BookmarkPageId.Value)))
            throw new DomainException("LESSON_PAGE_NOT_FOUND");

        await using var insert = connection.Query("""
            insert into learning.lesson_progress (id, learner_id, lesson_version_id)
            values (@id, @learner, @lesson)
            on conflict (learner_id, lesson_version_id) do nothing;
            """, tx, ("id", Guid.NewGuid()), ("learner", learnerId), ("lesson", lessonId));
        await insert.ExecuteNonQueryAsync(ct);
        var progress = await LoadProgressAsync(connection, tx, learnerId, lessonId,
            pages.Required, pages.All, true, ct);
        if (progress.Revision != request.ExpectedRevision) throw new DomainException("PROGRESS_CONFLICT");
        foreach (var page in request.ReadPageIds.Distinct())
            progress.MarkPageRead(learnerId.ToString(), page, progress.Revision, clock.GetUtcNow());
        if (progress.BookmarkPageId != request.BookmarkPageId)
            progress.SetBookmark(learnerId.ToString(), request.BookmarkPageId, progress.Revision);

        await using var update = connection.Query("""
            update learning.lesson_progress
            set revision = @revision, read_page_ids = cast(@pages as jsonb),
                bookmark_page_id = @bookmark, completed_at = @completed
            where learner_id = @learner and lesson_version_id = @lesson and revision = @expected;
            """, tx, ("revision", progress.Revision),
            ("pages", JsonSerializer.Serialize(progress.ReadPageIds.Order().ToArray())),
            ("bookmark", progress.BookmarkPageId), ("completed", progress.CompletedAt),
            ("learner", learnerId), ("lesson", lessonId), ("expected", request.ExpectedRevision));
        if (await update.ExecuteNonQueryAsync(ct) != 1) throw new DomainException("PROGRESS_CONFLICT");
        await tx.CommitAsync(ct);
        return View(progress);
    }

    private static async Task RequireActiveAsync(DbConnection db, DbTransaction tx, Guid user, CancellationToken ct)
    {
        await using var command = db.Query("""
            select id from identity_data.users
            where id = @id and status = 'Active' and email_verified_at is not null for share;
            """, tx, ("id", user));
        if (await command.ExecuteScalarAsync(ct) is null) throw new DomainException("FORBIDDEN");
    }

    private async Task RequireLessonAccessAsync(DbConnection db, DbTransaction tx,
        Guid user, Guid lesson, bool write, CancellationToken ct)
    {
        await using var command = db.Query("""
            select cv.id, cv.access_model, cv.state, lv.state, e.state
            from learning.lesson_versions lv
            join learning.course_versions cv on cv.id = lv.course_version_id
            join learning.enrollments e on e.course_version_id = cv.id and e.learner_id = @user
            where lv.id = @lesson for share of e, cv, lv;
            """, tx, ("user", user), ("lesson", lesson));
        Guid courseId;
        string access;
        await using (var reader = await command.ExecuteReaderAsync(ct))
        {
            if (!await reader.ReadAsync(ct)) throw new DomainException("LESSON_NOT_FOUND");
            courseId = reader.GetGuid(0);
            access = reader.GetString(1);
            if (write && (reader.GetString(2) != "Published" || reader.GetString(3) != "Published" ||
                reader.GetString(4) == "Archived"))
                throw new DomainException("FORBIDDEN");
        }
        if (write && access == "PaidEntitlement" &&
            !await HasEntitlementAsync(db, tx, user, courseId, ct))
            throw new DomainException("FORBIDDEN");
    }

    private async Task<bool> HasEntitlementAsync(DbConnection db, DbTransaction tx,
        Guid user, Guid course, CancellationToken ct)
    {
        await using var command = db.Query("""
            select id from billing.entitlements
            where learner_id = @user and resource_id = @course and starts_at <= @now and expires_at > @now
            limit 1 for share;
            """, tx, ("user", user), ("course", course), ("now", clock.GetUtcNow()));
        return await command.ExecuteScalarAsync(ct) is not null;
    }

    internal static async Task<(Guid[] Required, Guid[] All)> ReadPageIdsAsync(
        DbConnection db, DbTransaction tx, Guid lesson, CancellationToken ct)
    {
        await using var command = db.Query("""
            select id, required from learning.lesson_pages
            where lesson_version_id = @lesson order by page_order;
            """, tx, ("lesson", lesson));
        var required = new List<Guid>();
        var all = new List<Guid>();
        await using var reader = await command.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            all.Add(reader.GetGuid(0));
            if (reader.GetBoolean(1)) required.Add(reader.GetGuid(0));
        }
        return (required.ToArray(), all.ToArray());
    }

    internal static async Task<LessonProgress> LoadProgressAsync(DbConnection db, DbTransaction tx,
        Guid user, Guid lesson, IEnumerable<Guid> required, IEnumerable<Guid> all, bool locked, CancellationToken ct)
    {
        await using var command = db.Query("""
            select id, revision, read_page_ids::text, bookmark_page_id, quiz_submitted,
                   first_quiz_accuracy, completed_at, needs_review
            from learning.lesson_progress where learner_id = @user and lesson_version_id = @lesson
            """ + (locked ? " for update;" : ";"), tx, ("user", user), ("lesson", lesson));
        await using var reader = await command.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct))
            return new LessonProgress(Guid.NewGuid(), user.ToString(), lesson, required, all);
        var progress = new LessonProgress(reader.GetGuid(0), user.ToString(), lesson, required, all);
        progress.Restore(reader.GetInt64(1), JsonSerializer.Deserialize<Guid[]>(reader.GetString(2))!,
            reader.IsDBNull(3) ? null : reader.GetGuid(3), reader.GetBoolean(4),
            reader.IsDBNull(5) ? null : reader.GetDecimal(5),
            reader.IsDBNull(6) ? null : reader.GetFieldValue<DateTimeOffset>(6), reader.GetBoolean(7));
        return progress;
    }

    private static EnrollmentView MapEnrollment(DbDataReader reader) =>
        new(reader.GetGuid(0), reader.GetGuid(1), reader.GetString(2), reader.GetString(3),
            reader.GetString(4), reader.GetString(5), reader.GetFieldValue<DateTimeOffset>(6));

    private static LessonProgressView View(LessonProgress progress) =>
        new(progress.LessonVersionId, progress.Revision, progress.ReadPageIds.Order().ToArray(),
            progress.BookmarkPageId, progress.QuizSubmitted, progress.FirstQuizAccuracy,
            progress.Completed, progress.NeedsReview, progress.CompletedAt);
}
