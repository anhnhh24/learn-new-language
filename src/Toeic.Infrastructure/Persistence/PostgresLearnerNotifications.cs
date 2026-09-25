using Toeic.Application;
using Toeic.Domain.Content;

namespace Toeic.Infrastructure.Persistence;

internal sealed class PostgresLearnerNotifications(IDbConnectionFactory connections, TimeProvider clock) : ILearnerNotifications
{
    public async Task<NotificationPage> ListAsync(Guid user, int page, int pageSize, bool unreadOnly, CancellationToken ct)
    {
        if (page is < 1 or > 10000 || pageSize is < 1 or > 50) throw new DomainException("PAGINATION_INVALID");
        await using var db = await connections.OpenAsync(ct);
        await using var query = db.Query("""
            select id,kind,title,body,target_path,created_at,read_at from learning.notifications
            where learner_id=@user and (not @unread or read_at is null)
            order by created_at desc,id limit @take offset @skip
            """, null, ("user", user), ("unread", unreadOnly), ("take", pageSize + 1), ("skip", (page - 1) * pageSize));
        var items = new List<LearnerNotification>();
        await using var reader = await query.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct)) items.Add(new(reader.GetGuid(0), reader.GetString(1), reader.GetString(2), reader.GetString(3),
            reader.GetString(4), reader.GetFieldValue<DateTimeOffset>(5), reader.IsDBNull(6) ? null : reader.GetFieldValue<DateTimeOffset>(6)));
        return new(items.Take(pageSize).ToArray(), page, pageSize, items.Count > pageSize);
    }

    public async Task<int> UnreadAsync(Guid user, CancellationToken ct)
    {
        await using var db = await connections.OpenAsync(ct);
        await using var query = db.Query("select count(*)::int from learning.notifications where learner_id=@user and read_at is null", null, ("user", user));
        return (int)(await query.ExecuteScalarAsync(ct))!;
    }

    public async Task ReadAsync(Guid user, Guid id, CancellationToken ct)
    {
        await using var db = await connections.OpenAsync(ct);
        await using var update = db.Query("update learning.notifications set read_at=coalesce(read_at,@now) where id=@id and learner_id=@user",
            null, ("now", clock.GetUtcNow()), ("id", id), ("user", user));
        if (await update.ExecuteNonQueryAsync(ct) == 0) throw new DomainException("NOTIFICATION_NOT_FOUND");
    }
}
