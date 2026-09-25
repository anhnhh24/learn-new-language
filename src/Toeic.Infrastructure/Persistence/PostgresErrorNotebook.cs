using System.Data.Common;
using System.Text.Json;
using Toeic.Application;
using Toeic.Domain.Content;

namespace Toeic.Infrastructure.Persistence;

internal sealed class PostgresErrorNotebook(IDbConnectionFactory connections, TimeProvider clock) : IErrorNotebook
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private const string Columns = "id,source_attempt_id,source_question_revision_id,primary_tag,state,revision,ignore_reason,last_seen_at,updated_at,snapshot_json::text";

    public async Task<ErrorEntryPage> ListAsync(Guid user, string? state, string? tag, int page, int pageSize, CancellationToken ct)
    {
        if (state is not (null or "Open" or "Improving" or "Resolved" or "Ignored") || tag?.Length > 200 ||
            page is < 1 or > 10000 || pageSize is < 1 or > 50) throw new DomainException("ERROR_FILTER_INVALID");
        await using var db = await connections.OpenAsync(ct);
        await using var query = db.Query("select " + Columns + """
             from learning.error_entries where learner_id=@user
               and (cast(@state as text) is null or state=@state)
               and (cast(@tag as text) is null or primary_tag=@tag)
             order by last_seen_at desc,id limit @take offset @skip
            """, null, ("user", user), ("state", state), ("tag", string.IsNullOrWhiteSpace(tag) ? null : tag.Trim()),
            ("take", pageSize + 1), ("skip", (page - 1) * pageSize));
        var items = new List<ErrorEntryView>();
        await using var reader = await query.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct)) items.Add(Map(reader));
        return new(items.Take(pageSize).ToArray(), page, pageSize, items.Count > pageSize);
    }

    public async Task<ErrorEntryView> GetAsync(Guid user, Guid id, CancellationToken ct)
    {
        await using var db = await connections.OpenAsync(ct);
        return await Read(db, null, user, id, ct);
    }

    public async Task<ErrorEntryView> ChangeAsync(Guid user, Guid id, ChangeErrorEntry request, CancellationToken ct)
    {
        if (request.ExpectedRevision < 0 || request.Action is not ("Ignore" or "Reopen") || request.Reason?.Length > 500 ||
            (request.Action == "Reopen" && !string.IsNullOrWhiteSpace(request.Reason))) throw new DomainException("ERROR_CHANGE_INVALID");
        await using var db = await connections.OpenAsync(ct);
        await using var tx = await db.BeginTransactionAsync(ct);
        await LockUser(db, tx, user, ct);
        var current = await Read(db, tx, user, id, ct);
        if (current.Revision != request.ExpectedRevision) throw new DomainException("ERROR_ENTRY_CONFLICT");
        // A learner may resume an ignored entry, but cannot self-certify mastery.
        if (request.Action == "Reopen" && current.State != "Ignored") throw new DomainException("ERROR_STATE_INVALID");
        if (request.Action == "Ignore" && current.State is not ("Open" or "Improving" or "Ignored"))
            throw new DomainException("ERROR_STATE_INVALID");
        var target = request.Action == "Ignore" ? "Ignored" : "Open";
        var reason = target == "Ignored" && !string.IsNullOrWhiteSpace(request.Reason) ? request.Reason.Trim() : null;
        if (target == current.State && reason == current.IgnoreReason) return current;
        var now = clock.GetUtcNow();
        await using var update = db.Query("""
            update learning.error_entries set state=@state,ignore_reason=@reason,revision=revision+1,updated_at=@now,
                evidence_json=case when @state='Open' then '[]'::jsonb else evidence_json end
            where id=@id and learner_id=@user
            """, tx, ("state", target), ("reason", reason), ("now", now), ("id", id), ("user", user));
        await update.ExecuteNonQueryAsync(ct);
        await tx.CommitAsync(ct);
        return current with { State = target, IgnoreReason = reason, Revision = current.Revision + 1, UpdatedAt = now };
    }

    public async Task<ErrorNotebookSummary> SummaryAsync(Guid user, CancellationToken ct)
    {
        await using var db = await connections.OpenAsync(ct);
        await using var query = db.Query("""
            select count(*) filter(where state='Open')::int,count(*) filter(where state='Improving')::int,
                   count(*) filter(where state='Resolved')::int,count(*) filter(where state='Ignored')::int
            from learning.error_entries where learner_id=@user
            """, null, ("user", user));
        await using var reader = await query.ExecuteReaderAsync(ct);
        await reader.ReadAsync(ct);
        return new(reader.GetInt32(0), reader.GetInt32(1), reader.GetInt32(2), reader.GetInt32(3));
    }

    public async Task<CaptureQuizErrorsReceipt> CaptureAsync(Guid user, CaptureQuizErrors request, CancellationToken ct)
    {
        if (request.AttemptId == Guid.Empty) throw new DomainException("ATTEMPT_NOT_FOUND");
        await using var db = await connections.OpenAsync(ct);
        await using var tx = await db.BeginTransactionAsync(ct);
        await LockUser(db, tx, user, ct);
        await using var source = db.Query("""
            select a.status from assessment.attempts a join learning.lesson_quiz_attempts q on q.attempt_id=a.id
            where a.id=@id and a.learner_id=@user and q.learner_id=@user and q.result_json is not null
            for share of a,q
            """, tx, ("id", request.AttemptId), ("user", user));
        if (await source.ExecuteScalarAsync(ct) as string != "Graded") throw new DomainException("ATTEMPT_NOT_FOUND");
        var added = await CaptureGradedQuizAsync(db, tx, user, request.AttemptId, clock.GetUtcNow(), ct);
        await tx.CommitAsync(ct);
        return new(added);
    }

    // Called inside the grading transaction and reused for explicit capture of older graded quizzes.
    internal static async Task<int> CaptureGradedQuizAsync(DbConnection db, DbTransaction tx, Guid user,
        Guid attempt, DateTimeOffset now, CancellationToken ct)
    {
        await using var insert = db.Query("""
            insert into learning.error_entries(id,learner_id,source_attempt_id,source_question_revision_id,
                primary_tag,state,last_seen_at,updated_at,snapshot_json)
            select gen_random_uuid(),@user,a.id,(item->>'questionRevisionId')::uuid,
                coalesce(nullif(btrim(qr.content_json->>'ruleId'),''),item->>'section'),'Open',a.submitted_at,@now,
                jsonb_build_object(
                    'question',jsonb_build_object('id',item->'questionRevisionId','section',item->'section',
                        'stimulus',item->'stimulus','prompt',item->'prompt','options',
                        (select jsonb_agg(jsonb_build_object('id',opt->'stableId','text',opt->'text') order by ord)
                         from jsonb_array_elements(item->'options') with ordinality as opts(opt,ord))),
                    'selectedOptionId',result->'selectedOptionId','correctOptionIds',result->'correctOptionIds')
            from assessment.attempts a join learning.lesson_quiz_attempts q on q.attempt_id=a.id
            cross join lateral jsonb_array_elements(a.snapshot_json->'items') as snapshots(item)
            cross join lateral jsonb_array_elements(q.result_json->'items') as results(result)
            left join content.question_nodes node on node.id=(item->>'questionRevisionId')::uuid
            left join content.question_revisions qr on qr.id=node.source_revision_id
            where a.id=@attempt and a.learner_id=@user and q.learner_id=@user and a.status='Graded'
                and result->>'questionId'=item->>'questionRevisionId' and result->>'correct'='false'
                and result->>'selectedOptionId' is not null
            on conflict(learner_id,source_attempt_id,source_question_revision_id) do nothing
            """, tx, ("user", user), ("attempt", attempt), ("now", now));
        return await insert.ExecuteNonQueryAsync(ct);
    }

    private static async Task LockUser(DbConnection db, DbTransaction tx, Guid user, CancellationToken ct)
    {
        await using var query = db.Query("select id from identity_data.users where id=@user and status='Active' and email_verified_at is not null for update", tx, ("user", user));
        if (await query.ExecuteScalarAsync(ct) is null) throw new DomainException("FORBIDDEN");
    }

    private static async Task<ErrorEntryView> Read(DbConnection db, DbTransaction? tx, Guid user, Guid id, CancellationToken ct)
    {
        await using var query = db.Query("select " + Columns + " from learning.error_entries where learner_id=@user and id=@id" + (tx is null ? "" : " for update"),
            tx, ("user", user), ("id", id));
        await using var reader = await query.ExecuteReaderAsync(ct);
        return await reader.ReadAsync(ct) ? Map(reader) : throw new DomainException("ERROR_ENTRY_NOT_FOUND");
    }

    private static ErrorEntryView Map(DbDataReader reader) => new(reader.GetGuid(0), reader.GetGuid(1), reader.GetGuid(2),
        reader.GetString(3), reader.GetString(4), reader.GetInt64(5), reader.IsDBNull(6) ? null : reader.GetString(6),
        reader.GetFieldValue<DateTimeOffset>(7), reader.GetFieldValue<DateTimeOffset>(8),
        reader.IsDBNull(9) ? null : JsonSerializer.Deserialize<ErrorQuestionSnapshot>(reader.GetString(9), Json));
}
