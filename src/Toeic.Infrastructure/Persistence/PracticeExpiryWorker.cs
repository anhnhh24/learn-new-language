using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Toeic.Application;

namespace Toeic.Infrastructure.Persistence;

public sealed class PracticeExpiryWorker(IDbConnectionFactory connections, IServiceScopeFactory scopes,
    TimeProvider clock, ILogger<PracticeExpiryWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try { await FinalizeBatch(stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception) { logger.LogError("Practice expiry batch failed. Code: PRACTICE_EXPIRY_BATCH_FAILED"); }
            try { await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
        }
    }

    private async Task FinalizeBatch(CancellationToken ct)
    {
        var work = new List<(Guid User, Guid Attempt)>();
        await using (var db = await connections.OpenAsync(ct))
        {
            await using var query = db.Query("""
                select a.learner_id,a.id from assessment.attempts a
                join assessment.practice_attempts q on q.attempt_id=a.id
                join identity_data.users u on u.id=a.learner_id
                where a.status='Active' and a.deadline<=@now and u.status='Active' and u.email_verified_at is not null
                  and (q.finalization_retry_at is null or q.finalization_retry_at<=@now)
                order by a.deadline,a.id limit 50
                """, null, ("now", clock.GetUtcNow()));
            await using var reader = await query.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct)) work.Add((reader.GetGuid(0), reader.GetGuid(1)));
        }
        foreach (var (user, attempt) in work)
        {
            ct.ThrowIfCancellationRequested();
            try
            {
                await using var scope = scopes.CreateAsyncScope();
                // The normal grading transaction locks the owner and attempt; two workers cannot grade twice.
                await scope.ServiceProvider.GetRequiredService<IPracticeExams>().GetAsync(user, attempt, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
            catch (Exception)
            {
                logger.LogError("Practice expiry item failed. Code: PRACTICE_EXPIRY_ITEM_FAILED");
                await using var db = await connections.OpenAsync(ct);
                await using var delay = db.Query("""
                    update assessment.practice_attempts q set finalization_retry_at=@retry
                    from assessment.attempts a where a.id=q.attempt_id and a.id=@id and a.status='Active'
                    """, null, ("retry", clock.GetUtcNow().AddMinutes(15)), ("id", attempt));
                await delay.ExecuteNonQueryAsync(ct);
            }
        }
    }
}
