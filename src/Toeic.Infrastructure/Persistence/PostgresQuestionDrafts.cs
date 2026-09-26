using System.Collections.Immutable;
using System.Data.Common;
using System.Text.Json;
using Toeic.Application;
using Toeic.Domain.Content;

namespace Toeic.Infrastructure.Persistence;

internal sealed class PostgresQuestionDrafts(IApplicationTransaction transaction, IPostgresSession session,
    IContentBlueprintRepository blueprints, IQuestionNodeStore nodes, IAuditWriter audit, TimeProvider clock) : IQuestionDrafts
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private DbCommand Query(string sql, params (string Name, object? Value)[] args) => session.Connection.Query(sql, session.Transaction, args);
    public Task<AdminPage<DraftBlueprint>> BlueprintsAsync(int page, CancellationToken ct) => transaction.ExecuteAsync(async token =>
    {
        Page(page);
        await using var query = Query("select id,version,policy_version,definition->>'ruleId' from content.blueprint_versions where part='Part5' and state='Published' order by created_at desc,id limit 21 offset @skip", ("skip", (page-1)*20));
        var rows = new List<DraftBlueprint>(); await using var reader = await query.ExecuteReaderAsync(token);
        while (await reader.ReadAsync(token)) rows.Add(new(reader.GetGuid(0),reader.GetString(1),reader.GetString(2),reader.GetString(3)));
        return new AdminPage<DraftBlueprint>(rows.Take(20).ToArray(),page,20,rows.Count>20);
    }, ct);
    public Task<AdminPage<QuestionDraftRow>> ListAsync(int page, CancellationToken ct) => transaction.ExecuteAsync(async token =>
    {
        Page(page);
        await using var query = Query("select id,title,revision,source_id,updated_at from content.question_drafts order by updated_at desc,id limit 21 offset @skip", ("skip",(page-1)*20));
        var rows = new List<QuestionDraftRow>(); await using var reader = await query.ExecuteReaderAsync(token);
        while(await reader.ReadAsync(token)) rows.Add(new(reader.GetGuid(0),reader.GetString(1),reader.GetInt64(2),reader.IsDBNull(3)?null:reader.GetGuid(3),reader.GetFieldValue<DateTimeOffset>(4)));
        return new AdminPage<QuestionDraftRow>(rows.Take(20).ToArray(),page,20,rows.Count>20);
    }, ct);
    public Task<QuestionDraft> GetAsync(Guid id, CancellationToken ct) => transaction.ExecuteAsync(token => Read(id,token),ct);
    public Task<QuestionDraft> CreateAsync(Guid admin, CreateQuestionDraft request, CancellationToken ct) => transaction.ExecuteAsync(async token =>
    {
        if(request.Id==Guid.Empty || request.BlueprintId==Guid.Empty || request.PreviousRevisionId==Guid.Empty) throw new DomainException("DRAFT_REQUEST_INVALID");
        await LockAdmin(admin,token);
        // Also serialize two admins accidentally using the same client-generated draft ID.
        await using(var keyLock=Query("select pg_advisory_xact_lock(hashtextextended(@key,0))",("key","question-draft:"+request.Id)))
            await keyLock.ExecuteNonQueryAsync(token);
        await using(var existing=Query("select creator_id,blueprint_id,previous_revision_id from content.question_drafts where id=@id",("id",request.Id)))
        {
            var found=false;
            await using(var r=await existing.ExecuteReaderAsync(token)) if(await r.ReadAsync(token))
            {
                if(r.GetGuid(0)!=admin || r.GetGuid(1)!=request.BlueprintId || (r.IsDBNull(2)?(Guid?)null:r.GetGuid(2))!=request.PreviousRevisionId) throw new DomainException("IDEMPOTENCY_CONFLICT");
                found=true;
            }
            if(found) return await Read(request.Id,token);
        }
        await Blueprint(request.BlueprintId,token);
        var family=Guid.NewGuid().ToString();
        var body=new Part5DraftBody("",new[]{"A","B","C","D"}.Select(id=>new Option(id,"","")).ToArray(),"A","","");
        if(request.PreviousRevisionId.HasValue)
        {
            await using var previous=Query("select content_json::text from content.question_revisions where id=@id and part='Part5' for share",("id",request.PreviousRevisionId.Value));
            var raw=await previous.ExecuteScalarAsync(token) as string ?? throw new DomainException("FORM_ITEM_NOT_FOUND");
            var source=JsonSerializer.Deserialize<Part5Content>(raw,Json)!;
            family=source.FamilyId; body=new(source.Stem,source.Options,source.ProposedKey,source.AnswerDerivation,source.Provenance.RightsReference);
        }
        await using var insert=Query("""
            insert into content.question_drafts(id,creator_id,blueprint_id,previous_revision_id,family_id,title,body,created_at,updated_at)
            values(@id,@admin,@blueprint,@previous,@family,'Câu hỏi Part 5 mới',cast(@body as jsonb),@now,@now)
            """,("id",request.Id),("admin",admin),("blueprint",request.BlueprintId),("previous",request.PreviousRevisionId),("family",family),("body",JsonSerializer.Serialize(body,Json)),("now",clock.GetUtcNow()));
        await insert.ExecuteNonQueryAsync(token); await Audit(admin,request.Id,"create",token);
        return await Read(request.Id,token);
    },ct);
    public Task<QuestionDraft> SaveAsync(Guid admin, Guid id, SaveQuestionDraft request, CancellationToken ct) => transaction.ExecuteAsync(async token =>
    {
        if(request.ExpectedRevision<0 || string.IsNullOrWhiteSpace(request.Title) || request.Title.Length>200 || request.Body is null) throw new DomainException("DRAFT_REQUEST_INVALID");
        var body=request.Body;
        if(body.Stem is null || body.Stem.Length>500 || body.AnswerDerivation is null || body.AnswerDerivation.Length>4000 || body.RightsReference is null || body.RightsReference.Length>2000 ||
            body.ProposedKey is null || body.ProposedKey.Length>100 || body.Options is null || body.Options.Count!=4 ||
            body.Options.Any(o=>o is null || o.StableId is null || o.StableId.Length>100 || o.Text is null || o.Text.Length>120 || o.Justification is null || o.Justification.Length>2000)) throw new DomainException("DRAFT_REQUEST_INVALID");
        await LockAdmin(admin,token); var draft=await Read(id,token);
        var encoded=JsonSerializer.Serialize(body,Json);
        if(draft.SourceId.HasValue) throw new DomainException("DRAFT_ALREADY_SUBMITTED");
        if(draft.Revision==request.ExpectedRevision+1 && draft.Title==request.Title.Trim() && JsonSerializer.Serialize(draft.Body,Json)==encoded) return draft;
        if(draft.Revision!=request.ExpectedRevision) throw new DomainException("DRAFT_REVISION_CONFLICT");
        await using var update=Query("update content.question_drafts set title=@title,body=cast(@body as jsonb),revision=revision+1,updated_at=@now where id=@id",("title",request.Title.Trim()),("body",encoded),("now",clock.GetUtcNow()),("id",id));
        await update.ExecuteNonQueryAsync(token); await Audit(admin,id,"save",token); return await Read(id,token);
    },ct);
    public Task<DraftSubmission> ValidateAsync(Guid admin, Guid id, DraftRevision request, bool submit, CancellationToken ct) => transaction.ExecuteAsync(async token =>
    {
        await LockAdmin(admin,token); var draft=await Read(id,token);
        if(request.ExpectedRevision<0) throw new DomainException("DRAFT_REQUEST_INVALID");
        if(draft.SourceId.HasValue) return new DraftSubmission(draft.SourceId,new([]));
        if(request.ExpectedRevision!=draft.Revision) throw new DomainException("DRAFT_REVISION_CONFLICT");
        var blueprint=await Blueprint(draft.BlueprintId,token);
        var provenance=new Provenance(admin.ToString(),blueprint.Version,blueprint.PolicyVersion,draft.Body.RightsReference,new("human","editorial","manual","admin-editor-v1"));
        var content=new Part5Content(draft.Body.Stem,draft.Body.Options.ToImmutableArray(),draft.Body.ProposedKey,blueprint.Constraints.RuleId,draft.Body.AnswerDerivation,draft.FamilyId,provenance);
        var report=Part5Validator.Validate(content,new(blueprint.Version,blueprint.PolicyVersion,blueprint.ExamProfile,ImmutableHashSet.Create(blueprint.Constraints.RuleId),blueprint.MaxCandidates),ImmutableHashSet<string>.Empty);
        if(!submit || !report.Passed) return new DraftSubmission(null,report);
        var source=Guid.NewGuid();
        await using var insert=Query("""
            insert into content.question_revisions(id,previous_revision_id,family_id,part,state,tier,content_hash,content_json,provenance_json,created_at)
            values(@id,@previous,@family,'Part5','StructuralValid','Draft',@hash,cast(@content as jsonb),cast(@provenance as jsonb),@now);
            update content.question_drafts set source_id=@id,revision=revision+1,updated_at=@now where id=@draft;
            """,("id",source),("previous",draft.PreviousRevisionId),("family",draft.FamilyId),("hash",ContentHash.Of(content)),("content",JsonSerializer.Serialize(content,Json)),("provenance",JsonSerializer.Serialize(provenance,Json)),("now",clock.GetUtcNow()),("draft",id));
        await insert.ExecuteNonQueryAsync(token);
        await nodes.AddAsync(source,[new(Guid.NewGuid(),"q1",1)],token);
        await Audit(admin,id,"submit",token,source); return new DraftSubmission(source,report);
    },ct);
    private async Task<ContentBlueprintVersion> Blueprint(Guid id,CancellationToken ct)
    {
        await using var query=Query("select id from content.blueprint_versions where id=@id and state='Published' and part='Part5' for share",("id",id));
        if(await query.ExecuteScalarAsync(ct) is null) throw new DomainException("BLUEPRINT_NOT_PUBLISHED");
        return await blueprints.FindAsync(id,ct) ?? throw new DomainException("BLUEPRINT_NOT_FOUND");
    }
    private async Task<QuestionDraft> Read(Guid id,CancellationToken ct)
    {
        await using var query=Query("select id,blueprint_id,previous_revision_id,family_id,title,body::text,revision,source_id,updated_at from content.question_drafts where id=@id for update",("id",id));
        await using var r=await query.ExecuteReaderAsync(ct); if(!await r.ReadAsync(ct)) throw new DomainException("DRAFT_NOT_FOUND");
        return new(r.GetGuid(0),r.GetGuid(1),r.IsDBNull(2)?null:r.GetGuid(2),r.GetString(3),r.GetString(4),JsonSerializer.Deserialize<Part5DraftBody>(r.GetString(5),Json)!,r.GetInt64(6),r.IsDBNull(7)?null:r.GetGuid(7),r.GetFieldValue<DateTimeOffset>(8));
    }
    private async Task LockAdmin(Guid admin,CancellationToken ct)
    {
        await using var query=Query("select u.id from identity_data.users u join identity_data.admin_accounts a on a.user_id=u.id where u.id=@id and u.status='Active' and u.email_verified_at is not null and a.enabled for update of u,a",("id",admin));
        if(await query.ExecuteScalarAsync(ct) is null) throw new DomainException("FORBIDDEN");
    }
    private Task Audit(Guid admin,Guid id,string action,CancellationToken ct,Guid? source=null)=>audit.AppendAsync(AuditEntry.Create(new(ActorType.Admin,admin.ToString()),"content.draft."+action,"QuestionDraft",id.ToString(),"ADMIN_AUTHORING",source.HasValue?[new("sourceId",source.Value.ToString())]:[],id.ToString(),clock.GetUtcNow()),ct);
    private static void Page(int page) { if(page is <1 or >10000) throw new DomainException("PAGINATION_INVALID"); }
}
