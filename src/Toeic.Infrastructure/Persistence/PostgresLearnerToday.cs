using Toeic.Application;

namespace Toeic.Infrastructure.Persistence;

internal sealed class PostgresLearnerToday(IDbConnectionFactory connections, TimeProvider clock, IBetaServingControl betaServing)
    : ILearnerToday
{
    public async Task<TodayView> GetAsync(Guid learnerId, CancellationToken ct)
    {
        await using var db = await connections.OpenAsync(ct);
        // Ordered by roadmap position, so checkpoints stay between their levels.
        // No completion or mastery is inferred from opening a page.
        await using var command = db.Query("""
            select e.id, lv.id, lv.code, lv.title, lv.estimated_minutes,
                   p.bookmark_page_id,
                   not exists (select 1 from learning.lesson_pages pg
                     where pg.lesson_version_id = lv.id and pg.required
                       and not coalesce(p.read_page_ids, '[]'::jsonb) @> to_jsonb(array[pg.id])) as all_read
            from learning.enrollments e
            join identity_data.users u on u.id = e.learner_id and u.status = 'Active'
            join learning.course_versions cv on cv.id = e.course_version_id and cv.state = 'Published'
            join learning.lesson_versions lv on lv.course_version_id = cv.id and lv.state = 'Published'
            left join learning.lesson_progress p on p.learner_id = e.learner_id and p.lesson_version_id = lv.id
            left join lateral (
                select rw.week_number, ra.session_order
                from learning.roadmap_activities ra
                join learning.roadmap_weeks rw on rw.id = ra.roadmap_week_id
                join learning.roadmap_templates rt on rt.id = rw.roadmap_template_id
                where ra.lesson_version_id = lv.id and rt.course_version_id = cv.id
                  and rt.state = 'Published' and ra.activity_type in ('Lesson','Checkpoint')
                order by rw.week_number, ra.session_order limit 1
            ) pos on true
            where e.learner_id = @user and e.state in ('Active','Completed')
              and p.completed_at is null
              and (cv.access_model <> 'PaidEntitlement' or exists (
                select 1 from billing.entitlements ent where ent.learner_id = e.learner_id
                  and ent.resource_id = cv.id and ent.starts_at <= @now and ent.expires_at > @now))
            order by all_read asc, (p.bookmark_page_id is not null) desc,
                     (coalesce(p.revision, 0) > 0) desc, e.enrolled_at,
                     pos.week_number nulls last, pos.session_order nulls last, lv.sequence, lv.id
            limit 1;
            """, null, ("user", learnerId), ("now", clock.GetUtcNow()));
        NextLearningActivity? next = null;
        await using (var reader = await command.ExecuteReaderAsync(ct))
        {
            if (await reader.ReadAsync(ct))
            {
                var read = reader.GetBoolean(6);
                next = new NextLearningActivity(reader.GetGuid(0), reader.GetGuid(1),
                    reader.GetString(2), reader.GetString(3), reader.GetInt32(4),
                    reader.IsDBNull(5) ? null : reader.GetGuid(5),
                    read ? "LessonQuiz" : "ReadLesson",
                    read ? "QuestionBankPending" : "Available");
            }
        }
        if (next?.Action == "LessonQuiz")
        {
            var availability = "QuizServingDisabled";
            if (await betaServing.IsEnabledAsync(ct))
            {
                await using var quiz = db.Query("""
                    select exists(select 1 from learning.lesson_quiz_forms q
                      join content.form_versions f on f.id = q.form_version_id
                      where q.lesson_version_id = @lesson and f.state = 'Active')
                    """, null, ("lesson", next.LessonVersionId));
                // This is a discovery hint; start still validates all item and prerequisite gates.
                availability = (bool)(await quiz.ExecuteScalarAsync(ct))! ? "QuizConfigured" : "QuestionBankPending";
            }
            next = next with { Availability = availability };
        }
        await using var counts = db.Query("""
            select
              (select count(*)::int from learning.user_cards c
                 join learning.private_card_content pc on pc.card_id = c.id
                 where c.learner_id = @user and c.due_at <= @now
                   and pc.introduced_at is not null and not pc.archived),
              (select count(*)::int from learning.error_entries
                 where learner_id = @user and state in ('Open','Improving')),
              count(*) filter (where p.completed_at is not null)::int, count(*)::int
            from learning.enrollments e
            join learning.lesson_versions lv on lv.course_version_id = e.course_version_id
            left join learning.lesson_progress p on p.learner_id = e.learner_id and p.lesson_version_id = lv.id
            where e.learner_id = @user and e.state in ('Active','Completed')
              and lv.state = 'Published';
            """, null, ("user", learnerId), ("now", clock.GetUtcNow()));
        await using var result = await counts.ExecuteReaderAsync(ct);
        await result.ReadAsync(ct);
        return new TodayView(next, result.GetInt32(0), result.GetInt32(1),
            result.GetInt32(2), result.GetInt32(3),
            next is null ? "NoAccessibleIncompleteLesson" : "");
    }
}
