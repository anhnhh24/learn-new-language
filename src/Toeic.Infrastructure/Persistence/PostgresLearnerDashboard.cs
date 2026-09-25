using System.Data;
using System.Data.Common;
using System.Globalization;
using Toeic.Application;
using Toeic.Domain.Content;

namespace Toeic.Infrastructure.Persistence;

internal sealed class PostgresLearnerDashboard(IDbConnectionFactory connections, TimeProvider clock) : ILearnerDashboard
{
    // One row per published lesson in an active/completed enrollment; never multiply by attempts.
    private const string LessonScope = """
        with lessons as (
            select lv.id,lv.is_level_checkpoint,p.completed_at,p.needs_review,p.quiz_submitted,p.first_quiz_accuracy
            from learning.enrollments e
            join learning.lesson_versions lv on lv.course_version_id=e.course_version_id and lv.state='Published'
            left join learning.lesson_progress p on p.lesson_version_id=lv.id and p.learner_id=@user
            where e.learner_id=@user and e.state in ('Active','Completed')
        )
        """;

    public async Task<LearnerDashboardView> GetAsync(Guid user, int days, int coursePage, int coursePageSize, CancellationToken ct)
    {
        if (days is < 1 or > 90 || coursePage is < 1 or > 10000 || coursePageSize is < 1 or > 50)
            throw new DomainException("DASHBOARD_FILTER_INVALID");
        await using var db = await connections.OpenAsync(ct);
        // All sections see the same committed data even if a quiz finishes while this request runs.
        await using var tx = await db.BeginTransactionAsync(IsolationLevel.RepeatableRead, ct);
        var now = clock.GetUtcNow();
        await using var profile = db.Query("select timezone from identity_data.users where id=@user and status='Active' and email_verified_at is not null", tx, ("user", user));
        var zoneName = await profile.ExecuteScalarAsync(ct) as string ?? throw new DomainException("FORBIDDEN");
        TimeZoneInfo zone;
        try { zone = TimeZoneInfo.FindSystemTimeZoneById(zoneName); }
        catch (TimeZoneNotFoundException) { throw new DomainException("TIMEZONE_INVALID"); }
        catch (InvalidTimeZoneException) { throw new DomainException("TIMEZONE_INVALID"); }
        var sqlZone = TimeZoneInfo.TryConvertWindowsIdToIanaId(zoneName, out var iana) ? iana : zoneName;
        var end = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(now, zone).Date);
        var start = end.AddDays(1 - days);

        LearningOverview overview;
        await using (var query = db.Query(LessonScope + """
            select
              (select count(*)::int from learning.enrollments where learner_id=@user and state in ('Active','Completed')),
              count(*)::int,count(*) filter(where completed_at is not null)::int,
              count(*) filter(where needs_review)::int,count(*) filter(where quiz_submitted)::int,
              avg(first_quiz_accuracy) filter(where quiz_submitted),
              (select count(*)::int from learning.lesson_quiz_attempts q join assessment.attempts a on a.id=q.attempt_id
                where q.learner_id=@user and a.status='Graded'),
              (select count(*)::int from learning.lesson_quiz_attempts where learner_id=@user and is_checkpoint and passed=true),
              (select count(*)::int from learning.error_entries where learner_id=@user and state='Open'),
              (select count(*)::int from learning.error_entries where learner_id=@user and state='Improving'),
              (select count(*)::int from learning.user_cards c join learning.private_card_content p on p.card_id=c.id
                where c.learner_id=@user and not p.archived and p.introduced_at is not null and c.due_at<=@now),
              (select count(*)::int from learning.user_cards c join learning.private_card_content p on p.card_id=c.id
                where c.learner_id=@user and not p.archived and p.introduced_at is null)
            from lessons
            """, tx, ("user", user), ("now", now)))
        {
            await using var reader = await query.ExecuteReaderAsync(ct);
            await reader.ReadAsync(ct);
            overview = new(reader.GetInt32(0), reader.GetInt32(1), reader.GetInt32(2), reader.GetInt32(3), reader.GetInt32(4),
                Number(reader, 5), reader.GetInt32(6), reader.GetInt32(7), reader.GetInt32(8), reader.GetInt32(9), reader.GetInt32(10), reader.GetInt32(11));
        }

        var courses = new List<CourseLearningStats>();
        await using (var query = db.Query("""
            with selected as (
                select e.id,e.course_version_id,e.state,e.enrolled_at,cv.title
                from learning.enrollments e join learning.course_versions cv on cv.id=e.course_version_id
                where e.learner_id=@user and e.state in ('Active','Completed')
                order by e.enrolled_at desc,e.id limit @take offset @skip
            )
            select e.id,e.course_version_id,e.title,e.state,count(lv.id)::int,
                count(lv.id) filter(where p.completed_at is not null)::int,
                count(lv.id) filter(where p.needs_review)::int,
                count(lv.id) filter(where p.quiz_submitted)::int,
                avg(p.first_quiz_accuracy) filter(where p.quiz_submitted),
                count(lv.id) filter(where lv.is_level_checkpoint and exists(
                    select 1 from learning.lesson_quiz_attempts q where q.learner_id=@user
                      and q.lesson_version_id=lv.id and q.passed=true))::int,
                count(lv.id) filter(where lv.is_level_checkpoint)::int
            from selected e
            left join learning.lesson_versions lv on lv.course_version_id=e.course_version_id and lv.state='Published'
            left join learning.lesson_progress p on p.lesson_version_id=lv.id and p.learner_id=@user
            group by e.id,e.course_version_id,e.title,e.state,e.enrolled_at order by e.enrolled_at desc,e.id
            """, tx, ("user", user), ("take", coursePageSize + 1), ("skip", (coursePage - 1) * coursePageSize)))
        {
            await using var reader = await query.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct)) courses.Add(new(reader.GetGuid(0), reader.GetGuid(1), reader.GetString(2), reader.GetString(3),
                reader.GetInt32(4), reader.GetInt32(5), reader.GetInt32(6), reader.GetInt32(7), Number(reader, 8), reader.GetInt32(9), reader.GetInt32(10)));
        }

        var activity = new List<LearningDay>();
        await using (var query = db.Query("""
            with dates as (
                select cast(@start as date)+n as day from generate_series(0,@days-1) as n
            ), completions as (
                select (completed_at at time zone @zone)::date as day,count(*)::int as total
                from learning.lesson_progress where learner_id=@user
                  and completed_at>=@since and completed_at<=@now group by day
            ), quizzes as (
                select (a.submitted_at at time zone @zone)::date as day,count(*)::int as total
                from learning.lesson_quiz_attempts q join assessment.attempts a on a.id=q.attempt_id
                where q.learner_id=@user and a.status='Graded' and a.submitted_at>=@since and a.submitted_at<=@now group by day
            ), reviews as (
                select (reviewed_at at time zone @zone)::date as day,
                    count(*) filter(where not was_early)::int as total,count(*) filter(where was_early)::int as early
                from learning.review_events where learner_id=@user and reviewed_at>=@since and reviewed_at<=@now group by day
            )
            select d.day,coalesce(c.total,0),coalesce(q.total,0),coalesce(r.total,0),coalesce(r.early,0)
            from dates d left join completions c on c.day=d.day left join quizzes q on q.day=d.day
            left join reviews r on r.day=d.day order by d.day
            """, tx, ("user", user), ("start", start.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)),
            ("days", days), ("zone", sqlZone), ("since", now.AddDays(-days - 2)), ("now", now)))
        {
            await using var reader = await query.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct)) activity.Add(new(reader.GetFieldValue<DateOnly>(0), reader.GetInt32(1), reader.GetInt32(2), reader.GetInt32(3), reader.GetInt32(4)));
        }
        await tx.CommitAsync(ct);
        return new(now, zoneName, overview, new(courses.Take(coursePageSize).ToArray(), coursePage, coursePageSize, courses.Count > coursePageSize), activity,
            "learning-dashboard-v1");
    }

    private static decimal? Number(DbDataReader reader, int ordinal) => reader.IsDBNull(ordinal) ? null : decimal.Round(reader.GetDecimal(ordinal), 4);
}
