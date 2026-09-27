using System.Collections.Immutable;
using System.Data.Common;
using System.Security.Cryptography;
using System.Text.Json;
using Toeic.Application;
using Toeic.Domain.Assessment;
using Toeic.Domain.Content;

namespace Toeic.Infrastructure.Persistence;

internal sealed class PostgresAdminExams(IApplicationTransaction transaction, IPostgresSession session,
    FormCompositionService composer, IBetaFormReader serving, IAuditWriter audit, TimeProvider clock) : IAdminExams
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private const string Columns = """
        f.id,f.version,f.state,f.tier,f.policy_version,f.exam_profile_version,f.attempt_duration_seconds,
        (select count(*)::int from content.form_questions q where q.form_version_id=f.id),f.created_at
        """;
    private DbCommand Query(string sql, params (string Name, object? Value)[] args) =>
        session.Connection.Query(sql, session.Transaction, args);

    public Task<AdminPage<AdminExam>> ListAsync(int page, string? state, CancellationToken ct) => transaction.ExecuteAsync(async token =>
    {
        ValidatePage(page);
        if (state is not (null or "Draft" or "Active" or "Degraded" or "Archived")) throw new DomainException("FORM_FILTER_INVALID");
        await using var query = Query("select " + Columns + " from content.form_versions f where cast(@state as text) is null or f.state=@state order by f.created_at desc,f.id limit 21 offset @skip", ("state", state), ("skip", (page - 1) * 20));
        var rows = new List<AdminExam>();
        await using var reader = await query.ExecuteReaderAsync(token);
        while (await reader.ReadAsync(token)) rows.Add(Map(reader));
        return new AdminPage<AdminExam>(rows.Take(20).ToArray(), page, 20, rows.Count > 20);
    }, ct);

    public Task<IReadOnlyList<ExamProfileView>> ProfilesAsync(CancellationToken ct) => transaction.ExecuteAsync<IReadOnlyList<ExamProfileView>>(async token =>
    {
        await using var query = Query("select version,title,kind,publication_enabled,duration_seconds,total_questions,exact_structure,structure_json::text from content.exam_profiles order by kind,title");
        var rows = new List<ExamProfileView>();
        await using var reader = await query.ExecuteReaderAsync(token);
        while (await reader.ReadAsync(token)) rows.Add(new(reader.GetString(0), reader.GetString(1), reader.GetString(2), reader.GetBoolean(3), reader.GetInt32(4), reader.GetInt32(5), reader.GetBoolean(6), JsonSerializer.Deserialize<JsonElement>(reader.GetString(7))));
        return rows;
    }, ct);
    public Task<AdminPage<AdminExamSource>> SourcesAsync(int page, string? policy, CancellationToken ct) => transaction.ExecuteAsync(async token =>
    {
        ValidatePage(page);
        if (policy?.Length > 120) throw new DomainException("FORM_FILTER_INVALID");
        await using var query = Query("""
            select r.id,r.family_id,r.part,r.state,r.tier,r.provenance_json->>'policyVersion',
              (select count(*)::int from content.question_nodes n where n.source_revision_id=r.id),
              case when r.part='Part7DirectEvidence' then coalesce(r.content_json->>'passageKind','Single') end
            from content.question_revisions r
            where ((r.state='BetaReady' and r.tier='AutoValidated') or (r.state='DataValidatedPractice' and r.tier='DataValidatedPractice'))
              and r.part in ('Part5','Part6','Part7DirectEvidence')
              and (cast(@policy as text) is null or r.provenance_json->>'policyVersion'=@policy)
            order by r.created_at desc,r.id limit 21 offset @skip
            """, ("policy", policy), ("skip", (page - 1) * 20));
        var rows = new List<AdminExamSource>();
        await using var reader = await query.ExecuteReaderAsync(token);
        while (await reader.ReadAsync(token)) rows.Add(new(reader.GetGuid(0), reader.GetString(1), reader.GetString(2), reader.GetString(3), reader.GetString(4), reader.IsDBNull(5) ? "" : reader.GetString(5), reader.GetInt32(6), reader.IsDBNull(7) ? null : reader.GetString(7)));
        return new AdminPage<AdminExamSource>(rows.Take(20).ToArray(), page, 20, rows.Count > 20);
    }, ct);

    public Task<AdminExamContent> SourceAsync(Guid id, CancellationToken ct) => transaction.ExecuteAsync(async token =>
    {
        await using var query = Query("select id,part,content_json::text from content.question_revisions where id=@id", ("id", id));
        await using var reader = await query.ExecuteReaderAsync(token);
        if (!await reader.ReadAsync(token)) throw new DomainException("FORM_ITEM_NOT_FOUND");
        return Content(reader);
    }, ct);

    public Task<AdminExamDetail> DetailAsync(Guid id, CancellationToken ct) => transaction.ExecuteAsync(async token =>
    {
        AdminExam form;
        await using (var query = Query("select " + Columns + " from content.form_versions f where f.id=@id for share of f", ("id", id)))
        {
            await using var reader = await query.ExecuteReaderAsync(token);
            if (!await reader.ReadAsync(token)) throw new DomainException("FORM_NOT_FOUND");
            form = Map(reader);
        }
        await using var sources = Query("select r.id,r.part,r.content_json::text from content.form_items i join content.question_revisions r on r.id=i.item_revision_id where i.form_version_id=@id order by i.item_order", ("id", id));
        var rows = new List<AdminExamContent>();
        await using var items = await sources.ExecuteReaderAsync(token);
        while (await items.ReadAsync(token)) rows.Add(Content(items));
        return new AdminExamDetail(form, rows);
    }, ct);

    public Task<Guid> PublishAsync(Guid admin, PublishAdminExam request, CancellationToken ct) => transaction.ExecuteAsync(async token =>
    {
        if (request.OperationId == Guid.Empty || request.SourceIds is null || request.SourceIds.Length is < 1 or > 200 ||
            request.SourceIds.Any(id => id == Guid.Empty) || request.SourceIds.Distinct().Count() != request.SourceIds.Length ||
            !ValidText(request.Version) || !ValidText(request.PolicyVersion) || !ValidText(request.ExamProfileVersion) ||
            request.DurationSeconds is < 60 or > 14400 || request.Part5Count is < 0 or > 200 || request.Part6Count is < 0 or > 200 || request.Part7Count is < 0 or > 200 ||
            request.Part5Count + request.Part6Count + request.Part7Count is < 1 or > 200 || request.MaximumPriorExposure is < 0 or > 100000 ||
            request.Tier is not ("BetaPractice" or "DataValidatedPractice")) throw new DomainException("FORM_REQUEST_INVALID");
        await LockAdmin(admin, token);
        var hash = Convert.ToHexString(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(request, Json)));
        await using (var replay = Query("select request_hash,form_id from content.admin_exam_publications where admin_id=@admin and operation_id=@op", ("admin", admin), ("op", request.OperationId)))
        {
            await using var reader = await replay.ExecuteReaderAsync(token);
            if (await reader.ReadAsync(token))
            {
                if (reader.GetString(0) != hash) throw new DomainException("IDEMPOTENCY_CONFLICT");
                return reader.GetGuid(1);
            }
        }
        await ValidateProfile(request, token);
        var requirements = ImmutableArray.CreateBuilder<FormRequirement>();
        if (request.Part5Count > 0) requirements.Add(new(ToeicPart.Part5, request.Part5Count));
        if (request.Part6Count > 0) requirements.Add(new(ToeicPart.Part6, request.Part6Count));
        if (request.Part7Count > 0) requirements.Add(new(ToeicPart.Part7DirectEvidence, request.Part7Count));
        // The caller is an admin; only the trusted composition service performs the automated gate transition.
        var form = await composer.ComposeAsync(new(request.Version, request.PolicyVersion, request.ExamProfileVersion,
            TimeSpan.FromSeconds(request.DurationSeconds), Enum.Parse<PublicationTier>(request.Tier), requirements.ToImmutable(),
            request.SourceIds.ToImmutableArray(), ImmutableHashSet<string>.Empty, request.MaximumPriorExposure),
            new Actor(ActorType.SystemWorker, "admin-exam-composer"), token);
        // Verify content identities and delivery snapshots before committing publication.
        var materialized = await serving.FindForServingAsync(form.Id, token) ?? throw new DomainException("FORM_NOT_AVAILABLE");
        var expectedIds = form.Items.SelectMany(item => item.QuestionRevisionIds).ToHashSet();
        if (materialized.ItemSnapshots.Length != expectedIds.Count ||
            !expectedIds.SetEquals(materialized.ItemSnapshots.Select(item => item.QuestionRevisionId)))
            throw new DomainException("FORM_MATERIALIZATION_INVALID");
        await using var receipt = Query("insert into content.admin_exam_publications(admin_id,operation_id,request_hash,form_id,created_at) values(@admin,@op,@hash,@form,@now)",
            ("admin", admin), ("op", request.OperationId), ("hash", hash), ("form", form.Id), ("now", clock.GetUtcNow()));
        await receipt.ExecuteNonQueryAsync(token);
        await audit.AppendAsync(AuditEntry.Create(new(ActorType.Admin, admin.ToString()), "content.form.publish.requested", "FormVersion", form.Id.ToString(), "ADMIN_PUBLICATION",
            [new("version", form.Version)], request.OperationId.ToString(), clock.GetUtcNow()), token);
        return form.Id;
    }, ct);

    public Task ArchiveAsync(Guid admin, Guid id, ArchiveAdminExam request, CancellationToken ct) => transaction.ExecuteAsync(async token =>
    {
        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Length > 1000 || request.ExpectedState is not ("Draft" or "Active" or "Degraded")) throw new DomainException("FORM_ARCHIVE_INVALID");
        await LockAdmin(admin, token);
        await using var query = Query("select state from content.form_versions where id=@id for update", ("id", id));
        var state = await query.ExecuteScalarAsync(token) as string ?? throw new DomainException("FORM_NOT_FOUND");
        if (state == "Archived") return true;
        if (state != request.ExpectedState) throw new DomainException("FORM_STATE_CONFLICT");
        await using var update = Query("update content.form_versions set state='Archived' where id=@id", ("id", id));
        await update.ExecuteNonQueryAsync(token);
        await audit.AppendAsync(AuditEntry.Create(new(ActorType.Admin, admin.ToString()), "content.form.archive", "FormVersion", id.ToString(), "ADMIN_ARCHIVE",
            [new("reason", request.Reason.Trim()), new("previousState", state)], id.ToString(), clock.GetUtcNow()), token);
        return true;
    }, ct);

    private async Task LockAdmin(Guid admin, CancellationToken ct)
    {
        await using var query = Query("""
            select u.id from identity_data.users u join identity_data.admin_accounts m on m.user_id=u.id
            where u.id=@id and u.status='Active' and u.email_verified_at is not null and m.enabled for update of u,m
            """, ("id", admin));
        if (await query.ExecuteScalarAsync(ct) is null) throw new DomainException("FORBIDDEN");
    }
    private async Task ValidateProfile(PublishAdminExam request, CancellationToken ct)
    {
        bool enabled, exact;
        int duration, totalQuestions;
        JsonElement structure;
        await using (var query = Query("select publication_enabled,duration_seconds,total_questions,exact_structure,structure_json::text from content.exam_profiles where version=@version for share", ("version", request.ExamProfileVersion)))
        {
            await using var reader = await query.ExecuteReaderAsync(ct);
            if (!await reader.ReadAsync(ct)) throw new DomainException("EXAM_PROFILE_NOT_FOUND");
            enabled = reader.GetBoolean(0); duration = reader.GetInt32(1); totalQuestions = reader.GetInt32(2);
            exact = reader.GetBoolean(3); structure = JsonSerializer.Deserialize<JsonElement>(reader.GetString(4));
        }
        if (!enabled) throw new DomainException("EXAM_PROFILE_NOT_SUPPORTED");
        if (!exact) return;
        var total = request.Part5Count + request.Part6Count + request.Part7Count;
        var expectedSingle = Count(structure, "Part7Single");
        var expectedMultiple = Count(structure, "Part7Multiple");
        var expectedPart7 = Count(structure, "Part7DirectEvidence") + expectedSingle + expectedMultiple;
        if (request.DurationSeconds != duration || total != totalQuestions ||
            request.Part5Count != Count(structure, "Part5") || request.Part6Count != Count(structure, "Part6") ||
            request.Part7Count != expectedPart7)
            throw new DomainException("EXAM_PROFILE_STRUCTURE_INVALID");
        if (expectedSingle == 0 && expectedMultiple == 0) return;
        await using var kinds = Query("""
            select coalesce(r.content_json->>'passageKind','Single'),count(n.id)::int
            from content.question_revisions r join content.question_nodes n on n.source_revision_id=r.id
            where r.id=any(@ids) and r.part='Part7DirectEvidence'
            group by coalesce(r.content_json->>'passageKind','Single')
            """, ("ids", request.SourceIds));
        var single = 0; var multiple = 0;
        await using var kindReader = await kinds.ExecuteReaderAsync(ct);
        while (await kindReader.ReadAsync(ct))
        {
            var kind = kindReader.GetString(0); var count = kindReader.GetInt32(1);
            if (kind == "Single") single += count;
            else if (kind is "Double" or "Triple") multiple += count;
            else throw new DomainException("EXAM_PROFILE_STRUCTURE_INVALID");
        }
        if (single != expectedSingle || multiple != expectedMultiple)
            throw new DomainException("EXAM_PROFILE_STRUCTURE_INVALID");
    }
    private static int Count(JsonElement structure, string part) => structure.EnumerateArray()
        .Where(item => item.GetProperty("part").GetString() == part)
        .Select(item => item.TryGetProperty("count", out var count) ? count.GetInt32() : 0).SingleOrDefault();
    private static bool ValidText(string text) => !string.IsNullOrWhiteSpace(text) && text.Length <= 120;
    private static void ValidatePage(int page) { if (page is < 1 or > 10000) throw new DomainException("PAGINATION_INVALID"); }
    private static AdminExam Map(DbDataReader r) => new(r.GetGuid(0), r.GetString(1), r.GetString(2), r.GetString(3), r.GetString(4), r.GetString(5), r.GetInt32(6), r.GetInt32(7), r.GetFieldValue<DateTimeOffset>(8));
    private static AdminExamContent Content(DbDataReader r) => new(r.GetGuid(0), r.GetString(1), JsonSerializer.Deserialize<JsonElement>(r.GetString(2)));
}
