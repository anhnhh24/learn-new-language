using System.Collections.Immutable;
using System.Data.Common;
using System.Security.Cryptography;
using System.Text.Json;
using Toeic.Application;
using Toeic.Domain.Content;

namespace Toeic.Infrastructure.Persistence;

internal sealed class PostgresPart7Drafts(IApplicationTransaction transaction, IPostgresSession session,
    IContentBlueprintRepository blueprints, IQuestionNodeStore nodes, IAuditWriter audit, TimeProvider clock) : IPart7Drafts
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private DbCommand Query(string sql, params (string Name, object? Value)[] args) => session.Connection.Query(sql,session.Transaction,args);
    public Task<AdminPage<DraftBlueprint>> BlueprintsAsync(int page,CancellationToken ct)=>transaction.ExecuteAsync(async token=>
    {
        Page(page); await using var q=Query("select id,version,policy_version,definition->>'ruleId' from content.blueprint_versions where part='Part7DirectEvidence' and state='Published' order by created_at desc,id limit 21 offset @skip",("skip",(page-1)*20));
        var rows=new List<DraftBlueprint>(); await using var r=await q.ExecuteReaderAsync(token);
        while(await r.ReadAsync(token)) rows.Add(new(r.GetGuid(0),r.GetString(1),r.GetString(2),r.GetString(3)));
        return new AdminPage<DraftBlueprint>(rows.Take(20).ToArray(),page,20,rows.Count>20);
    },ct);
    public Task<AdminPage<Part7DraftRow>> ListAsync(int page,CancellationToken ct)=>transaction.ExecuteAsync(async token=>
    {
        Page(page); await using var q=Query("select id,title,jsonb_array_length(body->'questions'),revision,source_id,updated_at from content.part7_drafts order by updated_at desc,id limit 21 offset @skip",("skip",(page-1)*20));
        var rows=new List<Part7DraftRow>(); await using var r=await q.ExecuteReaderAsync(token);
        while(await r.ReadAsync(token)) rows.Add(new(r.GetGuid(0),r.GetString(1),r.GetInt32(2),r.GetInt64(3),r.IsDBNull(4)?null:r.GetGuid(4),r.GetFieldValue<DateTimeOffset>(5)));
        return new AdminPage<Part7DraftRow>(rows.Take(20).ToArray(),page,20,rows.Count>20);
    },ct);
    public Task<Part7Draft> GetAsync(Guid id,CancellationToken ct)=>transaction.ExecuteAsync(token=>Read(id,token),ct);
    public Task<Part7Draft> CreateAsync(Guid admin,CreatePart7Draft request,CancellationToken ct)=>transaction.ExecuteAsync(async token=>
    {
        if(request.Id==Guid.Empty||request.BlueprintId==Guid.Empty||request.PreviousRevisionId==Guid.Empty) throw new DomainException("DRAFT_REQUEST_INVALID");
        await LockAdmin(admin,token);
        await using(var key=Query("select pg_advisory_xact_lock(hashtextextended(@key,0))",("key","part7-draft:"+request.Id))) await key.ExecuteNonQueryAsync(token);
        await using(var existing=Query("select creator_id,blueprint_id,previous_revision_id from content.part7_drafts where id=@id",("id",request.Id)))
        {
            var found=false; await using(var r=await existing.ExecuteReaderAsync(token)) if(await r.ReadAsync(token)) { if(r.GetGuid(0)!=admin||r.GetGuid(1)!=request.BlueprintId||(r.IsDBNull(2)?(Guid?)null:r.GetGuid(2))!=request.PreviousRevisionId) throw new DomainException("IDEMPOTENCY_CONFLICT"); found=true; }
            if(found) return await Read(request.Id,token);
        }
        var blueprint=await Blueprint(request.BlueprintId,token); var family=Guid.NewGuid().ToString(); var stimulusId=Guid.NewGuid();
        var questions=Enumerable.Range(1,blueprint.Constraints.GroupSize).Select(i=>EmptyQuestion("q"+i)).ToArray();
        var body=new Part7DraftBody("",questions,"");
        if(request.PreviousRevisionId.HasValue)
        {
            await using var previous=Query("select content_json::text from content.question_revisions where id=@id and part='Part7DirectEvidence' for share",("id",request.PreviousRevisionId.Value));
            var raw=await previous.ExecuteScalarAsync(token) as string??throw new DomainException("FORM_ITEM_NOT_FOUND"); var source=JsonSerializer.Deserialize<Part7GroupContent>(raw,Json)!;
            family=source.FamilyId; stimulusId=source.Stimulus.Id; body=new(source.Stimulus.Text,source.Questions.Select(x=>new Part7DraftQuestion(x.StableId,x.Prompt,x.Options,x.ProposedKey,x.Rationale,x.Evidence.FirstOrDefault()?.Quote??"")).ToArray(),source.Provenance.RightsReference);
        }
        await using var insert=Query("insert into content.part7_drafts(id,creator_id,blueprint_id,previous_revision_id,family_id,stimulus_id,title,body,created_at,updated_at) values(@id,@admin,@blueprint,@previous,@family,@stimulus,'Nhóm câu hỏi Part 7 mới',cast(@body as jsonb),@now,@now)",("id",request.Id),("admin",admin),("blueprint",request.BlueprintId),("previous",request.PreviousRevisionId),("family",family),("stimulus",stimulusId),("body",JsonSerializer.Serialize(body,Json)),("now",clock.GetUtcNow()));
        await insert.ExecuteNonQueryAsync(token); await Audit(admin,request.Id,"create",token); return await Read(request.Id,token);
    },ct);
    public Task<Part7Draft> SaveAsync(Guid admin,Guid id,SavePart7Draft request,CancellationToken ct)=>transaction.ExecuteAsync(async token=>
    {
        ValidateRequest(request); await LockAdmin(admin,token); var draft=await Read(id,token); if(draft.SourceId.HasValue) throw new DomainException("DRAFT_ALREADY_SUBMITTED");
        var encoded=JsonSerializer.Serialize(request.Body,Json);
        if(draft.Revision==request.ExpectedRevision+1&&draft.Title==request.Title.Trim()&&JsonSerializer.Serialize(draft.Body,Json)==encoded) return draft;
        if(draft.Revision!=request.ExpectedRevision) throw new DomainException("DRAFT_REVISION_CONFLICT");
        await using var update=Query("update content.part7_drafts set title=@title,body=cast(@body as jsonb),revision=revision+1,updated_at=@now where id=@id",("title",request.Title.Trim()),("body",encoded),("now",clock.GetUtcNow()),("id",id)); await update.ExecuteNonQueryAsync(token);
        await Audit(admin,id,"save",token); return await Read(id,token);
    },ct);
    public Task<DraftSubmission> ValidateAsync(Guid admin,Guid id,DraftRevision request,bool submit,CancellationToken ct)=>transaction.ExecuteAsync<DraftSubmission>(async token=>
    {
        if(request.ExpectedRevision<0) throw new DomainException("DRAFT_REQUEST_INVALID"); await LockAdmin(admin,token); var draft=await Read(id,token);
        if(draft.SourceId.HasValue) return new(draft.SourceId,new([])); if(draft.Revision!=request.ExpectedRevision) throw new DomainException("DRAFT_REVISION_CONFLICT");
        var blueprint=await Blueprint(draft.BlueprintId,token); if(string.IsNullOrWhiteSpace(draft.Body.Stimulus)) return new(null,new([new("STIMULUS_REQUIRED","stimulus")])); var stimulus=new StimulusVersion(StableStimulusId(draft),draft.Body.Stimulus); var provenance=new Provenance(admin.ToString(),blueprint.Version,blueprint.PolicyVersion,draft.Body.RightsReference,new("human","editorial","manual","admin-part7-editor-v1"));
        var questions=draft.Body.Questions.Select(q=>new Part7Question(q.StableId,q.Prompt,q.Options.ToImmutableArray(),q.ProposedKey,q.Rationale,Evidence(stimulus,q.EvidenceQuote))).ToImmutableArray();
        var content=new Part7GroupContent(stimulus,questions,draft.FamilyId,provenance); var report=Part7Validator.Validate(content,blueprint,ImmutableHashSet<string>.Empty);
        if(!submit||!report.Passed) return new(null,report); var source=Guid.NewGuid();
        await using var insert=Query("""
            insert into content.question_revisions(id,previous_revision_id,family_id,part,state,tier,content_hash,content_json,provenance_json,created_at)
            values(@id,@previous,@family,'Part7DirectEvidence','StructuralValid','Draft',@hash,cast(@content as jsonb),cast(@provenance as jsonb),@now);
            update content.part7_drafts set source_id=@id,revision=revision+1,updated_at=@now where id=@draft;
            """,("id",source),("previous",draft.PreviousRevisionId),("family",draft.FamilyId),("hash",ContentHash.Of(content)),("content",JsonSerializer.Serialize(content,Json)),("provenance",JsonSerializer.Serialize(provenance,Json)),("now",clock.GetUtcNow()),("draft",id)); await insert.ExecuteNonQueryAsync(token);
        await nodes.AddAsync(source,questions.Select((q,i)=>new QuestionNodeDefinition(Guid.NewGuid(),q.StableId,i+1)).ToArray(),token); await Audit(admin,id,"submit",token,source); return new(source,report);
    },ct);
    private static ImmutableArray<EvidenceSpan> Evidence(StimulusVersion stimulus,string quote)
    {
        if(string.IsNullOrEmpty(quote)) return []; var start=stimulus.Text.IndexOf(quote,StringComparison.Ordinal);
        if(start<0||stimulus.Text.IndexOf(quote,start+1,StringComparison.Ordinal)>=0) return [new(-1,quote.Length,quote,stimulus.SourceHash)];
        return [new(start,quote.Length,quote,stimulus.SourceHash)];
    }
    private static Guid StableStimulusId(Part7Draft draft)=>new(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes("part7-stimulus:"+draft.Id)).AsSpan(0,16));
    private async Task<ContentBlueprintVersion> Blueprint(Guid id,CancellationToken ct) { await using var q=Query("select id from content.blueprint_versions where id=@id and state='Published' and part='Part7DirectEvidence' for share",("id",id)); if(await q.ExecuteScalarAsync(ct) is null) throw new DomainException("BLUEPRINT_NOT_PUBLISHED"); return await blueprints.FindAsync(id,ct)??throw new DomainException("BLUEPRINT_NOT_FOUND"); }
    private async Task<Part7Draft> Read(Guid id,CancellationToken ct) { await using var q=Query("select id,blueprint_id,previous_revision_id,family_id,title,body::text,revision,source_id,updated_at from content.part7_drafts where id=@id for update",("id",id)); await using var r=await q.ExecuteReaderAsync(ct); if(!await r.ReadAsync(ct)) throw new DomainException("DRAFT_NOT_FOUND"); return new(r.GetGuid(0),r.GetGuid(1),r.IsDBNull(2)?null:r.GetGuid(2),r.GetString(3),r.GetString(4),JsonSerializer.Deserialize<Part7DraftBody>(r.GetString(5),Json)!,r.GetInt64(6),r.IsDBNull(7)?null:r.GetGuid(7),r.GetFieldValue<DateTimeOffset>(8)); }
    private async Task LockAdmin(Guid id,CancellationToken ct) { await using var q=Query("select u.id from identity_data.users u join identity_data.admin_accounts a on a.user_id=u.id where u.id=@id and u.status='Active' and u.email_verified_at is not null and a.enabled for update of u,a",("id",id)); if(await q.ExecuteScalarAsync(ct) is null) throw new DomainException("FORBIDDEN"); }
    private Task Audit(Guid admin,Guid id,string action,CancellationToken ct,Guid? source=null)=>audit.AppendAsync(AuditEntry.Create(new(ActorType.Admin,admin.ToString()),"content.part7-draft."+action,"Part7Draft",id.ToString(),"ADMIN_AUTHORING",source.HasValue?[new("sourceId",source.Value.ToString())]:[],id.ToString(),clock.GetUtcNow()),ct);
    private static Part7DraftQuestion EmptyQuestion(string id)=>new(id,"",new[]{"A","B","C","D"}.Select(x=>new Option(x,"","")).ToArray(),"A","","");
    private static void Page(int page) { if(page is<1 or>10000) throw new DomainException("PAGINATION_INVALID"); }
    private static void ValidateRequest(SavePart7Draft r) { if(r.ExpectedRevision<0||string.IsNullOrWhiteSpace(r.Title)||r.Title.Length>200||r.Body is null||r.Body.Stimulus is null||r.Body.Stimulus.Length>6000||r.Body.RightsReference is null||r.Body.RightsReference.Length>2000||r.Body.Questions is null||r.Body.Questions.Count is<1 or>5||r.Body.Questions.Any(q=>q is null||q.StableId is null||q.StableId.Length>100||q.Prompt is null||q.Prompt.Length>1000||q.Rationale is null||q.Rationale.Length>4000||q.EvidenceQuote is null||q.EvidenceQuote.Length>6000||q.ProposedKey is null||q.ProposedKey.Length>100||q.Options is null||q.Options.Count!=4||q.Options.Any(o=>o is null||o.StableId is null||o.StableId.Length>100||o.Text is null||o.Text.Length>500||o.Justification is null||o.Justification.Length>2000))) throw new DomainException("DRAFT_REQUEST_INVALID"); }
}
