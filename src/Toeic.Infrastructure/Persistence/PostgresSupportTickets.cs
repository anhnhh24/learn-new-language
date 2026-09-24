using System.Data.Common;
using System.Security.Cryptography;
using System.Text.Json;
using Toeic.Application;
using Toeic.Domain.Content;

namespace Toeic.Infrastructure.Persistence;

internal sealed class PostgresSupportTickets(IDbConnectionFactory connections, TimeProvider clock)
    : ISupportTickets
{
    private const string Columns = """
        t.id,t.category,t.title,t.description,t.lesson_version_id,t.state,
        t.resolution_reason,t.revision,t.created_at,t.updated_at
        """;

    public async Task<SupportTicketView> CreateAsync(Guid learnerId, CreateSupportTicket request, CancellationToken ct)
    {
        if (request.ClientOperationId == Guid.Empty ||
            request.Category is not ("Content" or "Technical" or "Account" or "Billing") ||
            string.IsNullOrWhiteSpace(request.Title) || request.Title.Trim().Length is < 3 or > 150 ||
            string.IsNullOrWhiteSpace(request.Description) || request.Description.Trim().Length > 2000 ||
            request.LessonVersionId == Guid.Empty)
            throw new DomainException("SUPPORT_TICKET_INVALID");
        var title = request.Title.Trim();
        var description = request.Description.Trim();
        var hash = Convert.ToHexString(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(
            new { request.Category, Title = title, Description = description, request.LessonVersionId })));
        await using var db = await connections.OpenAsync(ct);
        await using var tx = await db.BeginTransactionAsync(ct);
        await using var user = db.Query("""
            select id from identity_data.users where id = @user and status = 'Active'
              and email_verified_at is not null for update;
            """, tx, ("user", learnerId));
        if (await user.ExecuteScalarAsync(ct) is null) throw new DomainException("FORBIDDEN");
        await using (var replay = db.Query("select " + Columns + """
            ,t.request_hash from operations.support_tickets t
            where t.learner_id = @user and t.client_operation_id = @operation;
            """, tx, ("user", learnerId), ("operation", request.ClientOperationId)))
        {
            await using var reader = await replay.ExecuteReaderAsync(ct);
            if (await reader.ReadAsync(ct))
            {
                if (reader.GetString(10) != hash) throw new DomainException("IDEMPOTENCY_CONFLICT");
                return Map(reader);
            }
        }
        await using var count = db.Query("""
            select count(*) from operations.support_tickets where learner_id = @user and created_at > @since;
            """, tx, ("user", learnerId), ("since", clock.GetUtcNow().AddHours(-1)));
        if ((long)(await count.ExecuteScalarAsync(ct))! >= 5)
            throw new DomainException("SUPPORT_RATE_LIMIT");
        if (request.LessonVersionId.HasValue)
        {
            // Keep the exact version reference, including withdrawn lessons the learner owned.
            await using var source = db.Query("""
                select lv.id from learning.lesson_versions lv
                join learning.course_versions cv on cv.id = lv.course_version_id
                where lv.id = @lesson and (
                    (lv.state = 'Published' and cv.state = 'Published' and (lv.is_sample or cv.access_model = 'Free'))
                    or exists (select 1 from learning.enrollments e
                        where e.course_version_id = cv.id and e.learner_id = @user));
                """, tx, ("lesson", request.LessonVersionId), ("user", learnerId));
            if (await source.ExecuteScalarAsync(ct) is null) throw new DomainException("LESSON_NOT_FOUND");
        }
        var id = Guid.NewGuid();
        var now = clock.GetUtcNow();
        await using var insert = db.Query("""
            insert into operations.support_tickets
                (id,learner_id,client_operation_id,request_hash,category,title,description,
                 lesson_version_id,created_at,updated_at)
            values (@id,@user,@operation,@hash,@category,@title,@body,@lesson,@now,@now);
            """, tx, ("id", id), ("user", learnerId), ("operation", request.ClientOperationId),
            ("hash", hash), ("category", request.Category), ("title", title), ("body", description),
            ("lesson", request.LessonVersionId), ("now", now));
        await insert.ExecuteNonQueryAsync(ct);
        await tx.CommitAsync(ct);
        return new(id, request.Category, title, description, request.LessonVersionId, "Open", null, 0, now, now);
    }

    public async Task<SupportTicketView> GetAsync(Guid learnerId, Guid ticketId, CancellationToken ct)
    {
        await using var db = await connections.OpenAsync(ct);
        await using var query = db.Query("select " + Columns + """
             from operations.support_tickets t
             join identity_data.users u on u.id = t.learner_id and u.status = 'Active'
             where t.learner_id = @user and t.id = @id;
            """, null, ("user", learnerId), ("id", ticketId));
        await using var reader = await query.ExecuteReaderAsync(ct);
        return await reader.ReadAsync(ct) ? Map(reader) : throw new DomainException("SUPPORT_TICKET_NOT_FOUND");
    }

    public async Task<SupportTicketPage> ListAsync(Guid learnerId, int page, int pageSize, CancellationToken ct)
    {
        if (page is < 1 or > 1000 || pageSize is < 1 or > 50)
            throw new DomainException("PAGINATION_INVALID");
        await using var db = await connections.OpenAsync(ct);
        await using var query = db.Query("select " + Columns + """
             from operations.support_tickets t
             join identity_data.users u on u.id = t.learner_id and u.status = 'Active'
             where t.learner_id = @user
             order by t.created_at desc,t.id limit @take offset @skip;
            """, null, ("user", learnerId), ("take", pageSize + 1), ("skip", (page - 1) * pageSize));
        var items = new List<SupportTicketView>();
        await using var reader = await query.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct)) items.Add(Map(reader));
        return new(items.Take(pageSize).ToArray(), page, pageSize, items.Count > pageSize);
    }

    private static SupportTicketView Map(DbDataReader reader) =>
        new(reader.GetGuid(0), reader.GetString(1), reader.GetString(2), reader.GetString(3),
            reader.IsDBNull(4) ? null : reader.GetGuid(4), reader.GetString(5),
            reader.IsDBNull(6) ? null : reader.GetString(6), reader.GetInt64(7),
            reader.GetFieldValue<DateTimeOffset>(8), reader.GetFieldValue<DateTimeOffset>(9));
}
