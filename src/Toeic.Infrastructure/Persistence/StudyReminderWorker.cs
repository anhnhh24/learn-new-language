using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Toeic.Infrastructure.Persistence;

public sealed class StudyReminderWorker(IDbConnectionFactory connections, TimeProvider clock,
    ILogger<StudyReminderWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var db = await connections.OpenAsync(stoppingToken);
                await using var insert = db.Query("""
                    with eligible as (
                        select u.id,local.now::date as day
                        from identity_data.users u join learning.learner_profiles p on p.learner_id=u.id
                        cross join lateral (select @now at time zone u.timezone as now) local
                        cross join lateral (select extract(hour from local.now)::int*60+extract(minute from local.now)::int as minute) t
                        where u.status='Active' and u.email_verified_at is not null and p.in_app_reminders
                          and extract(dow from local.now)::int=any(p.study_days) and t.minute>=p.reminder_minute
                          and not (case when p.quiet_start_minute<p.quiet_end_minute
                              then t.minute>=p.quiet_start_minute and t.minute<p.quiet_end_minute
                              else t.minute>=p.quiet_start_minute or t.minute<p.quiet_end_minute end)
                          and not exists(select 1 from learning.notifications n where n.learner_id=u.id
                              and n.kind='StudyReminder' and n.dedupe_key=local.now::date::text)
                        order by u.id limit 500 for share of u,p
                    )
                    insert into learning.notifications(id,learner_id,kind,dedupe_key,title,body,target_path,created_at)
                    select gen_random_uuid(),id,'StudyReminder',day::text,'Đến giờ học theo lịch của bạn',
                        'Bạn có thể tiếp tục bài học hoặc ôn lại các thẻ đến hạn.','/learn/today',@now from eligible
                    on conflict(learner_id,kind,dedupe_key) do nothing
                    """, null, ("now", clock.GetUtcNow()));
                await insert.ExecuteNonQueryAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception) { logger.LogError("Study reminder worker failed. Code: STUDY_REMINDER_FAILURE"); }
            try { await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
        }
    }
}
