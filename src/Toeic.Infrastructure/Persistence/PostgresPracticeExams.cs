using System.Collections.Immutable;
using System.Data.Common;
using System.Security.Cryptography;
using System.Text.Json;
using Toeic.Application;
using Toeic.Domain.Analytics;
using Toeic.Domain.Assessment;
using Toeic.Domain.Content;

namespace Toeic.Infrastructure.Persistence;

internal sealed class PostgresPracticeExams(IApplicationTransaction transaction,IPostgresSession session,
    BetaServingService serving,IItemTelemetryStore telemetry,ILearnerAnalyticsPseudonymizer pseudonymizer,TimeProvider clock) : IPracticeExams
{
    private static readonly JsonSerializerOptions Json=new(JsonSerializerDefaults.Web);
    private DbCommand Query(string sql,params (string Name,object? Value)[] args)=>session.Connection.Query(sql,session.Transaction,args);
    private const string Available="""
        f.state='Active' and f.tier in ('BetaPractice','DataValidatedPractice')
        and not exists(select 1 from learning.lesson_quiz_forms l where l.form_version_id=f.id)
        and exists(select 1 from content.form_questions fq where fq.form_version_id=f.id)
        and not exists(select 1 from content.form_questions fq join content.question_nodes n on n.id=fq.question_revision_id
            join content.question_revisions r on r.id=n.source_revision_id where fq.form_version_id=f.id
            and (r.state not in ('BetaActive','DataValidatedPractice') or r.part not in ('Part5','Part7DirectEvidence')))
        """;
    public Task<PracticePage<PracticeForm>> CatalogAsync(Guid user,int page,int pageSize,CancellationToken ct)=>transaction.ExecuteAsync(async token=>
    {
        ValidatePage(page,pageSize); await LockUser(user,token);
        await using var query=Query("select f.id,f.version,f.tier,f.attempt_duration_seconds,(select count(*)::int from content.form_questions q where q.form_version_id=f.id) from content.form_versions f where "+Available+" order by f.created_at desc,f.id limit @take offset @skip",("take",pageSize+1),("skip",(page-1)*pageSize));
        var rows=new List<PracticeForm>(); await using var reader=await query.ExecuteReaderAsync(token);
        while(await reader.ReadAsync(token)) rows.Add(new(reader.GetGuid(0),reader.GetString(1),reader.GetString(2),reader.GetInt32(4),reader.GetInt32(3)));
        return new PracticePage<PracticeForm>(rows.Take(pageSize).ToArray(),page,pageSize,rows.Count>pageSize);
    },ct);

    public Task<PracticeView> StartAsync(Guid user,StartPractice request,CancellationToken ct)=>transaction.ExecuteAsync(async token=>
    {
        if(request.FormId==Guid.Empty || request.ClientOperationId==Guid.Empty) throw new DomainException("START_ATTEMPT_INVALID");
        await LockUser(user,token);
        await using(var replay=Query("select a.id,a.assessment_version_id from assessment.practice_attempts p join assessment.attempts a on a.id=p.attempt_id where p.learner_id=@user and p.start_operation_id=@op",("user",user),("op",request.ClientOperationId)))
        {
            Guid? id=null; await using(var reader=await replay.ExecuteReaderAsync(token)) if(await reader.ReadAsync(token))
            { if(reader.GetGuid(1)!=request.FormId) throw new DomainException("IDEMPOTENCY_CONFLICT"); id=reader.GetGuid(0); }
            if(id.HasValue) return View(await Read(user,id.Value,token));
        }
        // Start-operation IDs are shared with lesson quizzes; never adopt a quiz attempt as practice.
        await using var used=Query("select 1 from assessment.start_attempt_receipts where learner_id=@user and client_operation_id=@op",("user",user),("op",request.ClientOperationId));
        if(await used.ExecuteScalarAsync(token) is not null) throw new DomainException("IDEMPOTENCY_CONFLICT");
        await using var form=Query("select f.id from content.form_versions f where f.id=@id and "+Available+" for share of f",("id",request.FormId));
        if(await form.ExecuteScalarAsync(token) is null) throw new DomainException("FORM_NOT_AVAILABLE");
        await using var count=Query("select count(*) from assessment.practice_attempts p join assessment.attempts a on a.id=p.attempt_id where p.learner_id=@user and a.started_at>@since",("user",user),("since",clock.GetUtcNow().AddHours(-1)));
        if((long)(await count.ExecuteScalarAsync(token))!>=10) throw new DomainException("PRACTICE_RATE_LIMIT");
        var started=await serving.StartAsync(new(request.FormId,request.ClientOperationId),new(ActorType.Learner,user.ToString()),token);
        var help=await ReadHelp(request.FormId,token);
        await using var insert=Query("""
            insert into assessment.practice_attempts(attempt_id,learner_id,start_operation_id,form_version,tier,learner_label,explanations)
            values(@id,@user,@op,@version,@tier,@label,cast(@help as jsonb))
            """,("id",started.AttemptId),("user",user),("op",request.ClientOperationId),("version",started.FormVersion),
            ("tier",started.Tier),("label",started.LearnerLabel),("help",JsonSerializer.Serialize(help,Json)));
        await insert.ExecuteNonQueryAsync(token);
        var state=await Read(user,started.AttemptId,token);
        if(state.Aggregate.Items.Any(i=>i.CorrectOptionIds.Count!=1)) throw new DomainException("FORM_CONTENT_UNSUPPORTED");
        return View(state);
    },ct);

    public Task<PracticeView> GetAsync(Guid user,Guid id,CancellationToken ct)=>transaction.ExecuteAsync(async token=>
    {
        await LockUser(user,token); var state=await Read(user,id,token);
        if(state.Status=="Active" && clock.GetUtcNow()>=state.Aggregate.Deadline)
        { await Finish(user,state,null,token); state=await Read(user,id,token); }
        return View(state);
    },ct);

    public Task<PracticeLeaseReceipt> LeaseAsync(Guid user,Guid id,PracticeLease request,CancellationToken ct)=>transaction.ExecuteAsync(async token=>
    {
        ValidateLease(request.Token); await LockUser(user,token); var state=await Read(user,id,token); RequireActive(state);
        var now=clock.GetUtcNow(); state.Aggregate.AcquireLease(user.ToString(),request.Token,now,request.AllowTakeover);
        await using var save=Query("update assessment.attempts set lease_token_hash=@hash,lease_expires_at=@until where id=@id",("hash",state.Aggregate.LeaseTokenHash),("until",state.Aggregate.LeaseExpiresAt),("id",id));
        await save.ExecuteNonQueryAsync(token); return new PracticeLeaseReceipt(state.Aggregate.LeaseExpiresAt!.Value,now);
    },ct);

    public Task<QuizAnswerReceipt> SaveAsync(Guid user,Guid id,SavePracticeAnswer request,CancellationToken ct)=>transaction.ExecuteAsync(async token=>
    {
        ValidateOperation(request.ClientOperationId,request.ExpectedRevision); ValidateLease(request.LeaseToken);
        if(request.OptionId?.Length>100) throw new DomainException("ANSWER_OPTION_INVALID");
        await LockUser(user,token); var state=await Read(user,id,token);
        var hash=Hash(new {Kind="Save",request.ClientOperationId,request.ExpectedRevision,request.QuestionId,request.OptionId});
        var replay=await Replay<QuizAnswerReceipt>(id,request.ClientOperationId,hash,token); if(replay is not null) return replay;
        RequireActive(state); var now=clock.GetUtcNow();
        var result=state.Aggregate.SaveResponse(user.ToString(),request.QuestionId,request.OptionId is null?[]:[request.OptionId],request.ExpectedRevision,request.ClientOperationId,request.LeaseToken,now);
        state.Aggregate.RenewLease(user.ToString(),request.LeaseToken,now);
        await using var save=Query("""
            insert into assessment.responses(attempt_id,question_revision_id,answer_json,revision,client_operation_id,saved_at)
            values(@id,@question,cast(@answer as jsonb),@revision,@op,@now)
            on conflict(attempt_id,question_revision_id) do update set answer_json=excluded.answer_json,revision=excluded.revision,
              client_operation_id=excluded.client_operation_id,saved_at=excluded.saved_at;
            update assessment.attempts set revision=@revision,lease_expires_at=@until where id=@id;
            """,("id",id),("question",request.QuestionId),("answer",JsonSerializer.Serialize(request.OptionId is null?Array.Empty<string>():[request.OptionId],Json)),
            ("revision",result.Revision),("op",request.ClientOperationId),("now",now),("until",state.Aggregate.LeaseExpiresAt));
        await save.ExecuteNonQueryAsync(token); var receipt=new QuizAnswerReceipt(result.Revision,now);
        await Receipt(id,request.ClientOperationId,hash,receipt,token); return receipt;
    },ct);

    public Task<PracticeResult> SubmitAsync(Guid user,Guid id,SubmitPractice request,CancellationToken ct)=>transaction.ExecuteAsync(async token=>
    {
        ValidateOperation(request.ClientOperationId,request.ExpectedRevision); ValidateLease(request.LeaseToken);
        await LockUser(user,token); var state=await Read(user,id,token);
        var hash=Hash(new {Kind="Submit",request.ClientOperationId,request.ExpectedRevision});
        var replay=await Replay<PracticeResult>(id,request.ClientOperationId,hash,token); if(replay is not null) return replay;
        RequireActive(state);
        if(state.Aggregate.Revision!=request.ExpectedRevision) throw new DomainException("ATTEMPT_REVISION_CONFLICT");
        if(clock.GetUtcNow()<state.Aggregate.Deadline) state.Aggregate.RenewLease(user.ToString(),request.LeaseToken,clock.GetUtcNow());
        var result=await Finish(user,state,request.ClientOperationId,token);
        await Receipt(id,request.ClientOperationId,hash,result,token); return result;
    },ct);

    public Task<PracticePage<PracticeHistoryItem>> HistoryAsync(Guid user,int page,int pageSize,CancellationToken ct)=>transaction.ExecuteAsync(async token=>
    {
        ValidatePage(page,pageSize); await LockUser(user,token);
        await using var query=Query("""
            select a.id,p.form_version,a.status,a.started_at,a.deadline from assessment.practice_attempts p
            join assessment.attempts a on a.id=p.attempt_id where p.learner_id=@user order by a.started_at desc,a.id limit @take offset @skip
            """,("user",user),("take",pageSize+1),("skip",(page-1)*pageSize));
        var rows=new List<PracticeHistoryItem>(); await using var reader=await query.ExecuteReaderAsync(token);
        while(await reader.ReadAsync(token)) rows.Add(new(reader.GetGuid(0),reader.GetString(1),reader.GetString(2),reader.GetFieldValue<DateTimeOffset>(3),reader.GetFieldValue<DateTimeOffset>(4)));
        return new PracticePage<PracticeHistoryItem>(rows.Take(pageSize).ToArray(),page,pageSize,rows.Count>pageSize);
    },ct);

    private async Task<PracticeResult> Finish(Guid user,State state,Guid? operation,CancellationToken ct)
    {
        RequireActive(state); var now=clock.GetUtcNow(); var attempt=state.Aggregate;
        var submission=now>=attempt.Deadline ? attempt.ExpireAndSubmit(now) : attempt.Submit(user.ToString(),attempt.Revision,operation!.Value.ToString(),now);
        var grade=attempt.GradeObjective("practice-objective-v1",now);
        var items=attempt.Items.Select(i=>
        {
            var selected=attempt.Responses.FirstOrDefault(r=>r.QuestionRevisionId==i.QuestionRevisionId)?.SelectedOptionIds ?? ImmutableHashSet<string>.Empty;
            return new PracticeItemResult(i.QuestionRevisionId,selected.SingleOrDefault(),i.CorrectOptionIds.Order().ToArray(),i.Score(selected)==i.MaxScore,state.Help[i.QuestionRevisionId]);
        }).ToArray();
        var result=new PracticeResult(attempt.Id,grade.RawScore,grade.MaxScore,items.Count(i=>i.SelectedOptionId is not null),submission.SubmittedAt,
            (int)(submission.SubmittedAt-attempt.StartedAt).TotalSeconds,items,grade.PolicyVersion);
        await using var persist=Query("""
            insert into assessment.grade_versions(id,attempt_id,version,raw_score,max_score,answered_count,policy_version,graded_at)
            values(@grade,@id,1,@raw,@max,@answered,@policy,@now);
            update assessment.attempts set status='Graded',revision=@revision,submitted_at=@submitted,submission_receipt_id=@receipt,
              lease_token_hash=null,lease_expires_at=null where id=@id;
            update assessment.practice_attempts set result_json=cast(@result as jsonb) where attempt_id=@id;
            """,("grade",grade.Id),("id",attempt.Id),("raw",grade.RawScore),("max",grade.MaxScore),("answered",result.AnsweredCount),("policy",grade.PolicyVersion),
            ("now",now),("revision",attempt.Revision),("submitted",submission.SubmittedAt),("receipt",submission.ReceiptId),("result",JsonSerializer.Serialize(result,Json)));
        await persist.ExecuteNonQueryAsync(ct);
        foreach(var item in items.Where(i=>i.SelectedOptionId is not null))
        {
            await telemetry.AppendResponseAsync(new(Guid.NewGuid(),attempt.Id,item.QuestionId,pseudonymizer.Pseudonymize(user.ToString()),state.Version,item.SelectedOptionId!,item.Correct,false,0,"Unknown",submission.SubmittedAt),ct);
            if(item.Correct) continue;
            var question=attempt.Items.Single(i=>i.QuestionRevisionId==item.QuestionId);
            var snapshot=new ErrorQuestionSnapshot(Question(question),item.SelectedOptionId!,item.CorrectOptionIds);
            await using var error=Query("""
                insert into learning.error_entries(id,learner_id,source_attempt_id,source_question_revision_id,primary_tag,state,last_seen_at,updated_at,snapshot_json)
                values(@id,@user,@attempt,@question,@tag,'Open',@submitted,@now,cast(@snapshot as jsonb))
                on conflict(learner_id,source_attempt_id,source_question_revision_id) do nothing
                """,("id",Guid.NewGuid()),("user",user),("attempt",attempt.Id),("question",item.QuestionId),("tag",item.Help.Tag),("submitted",submission.SubmittedAt),("now",now),("snapshot",JsonSerializer.Serialize(snapshot,Json)));
            await error.ExecuteNonQueryAsync(ct);
        }
        return result;
    }

    private async Task<State> Read(Guid user,Guid id,CancellationToken ct)
    {
        State state;
        await using(var query=Query("""
            select a.assessment_version_id,a.exam_profile_version,a.started_at,a.deadline,a.status,a.revision,a.snapshot_json::text,
              a.lease_token_hash,a.lease_expires_at,p.form_version,p.tier,p.learner_label,p.explanations::text,p.result_json::text
            from assessment.attempts a join assessment.practice_attempts p on p.attempt_id=a.id
            where a.id=@id and a.learner_id=@user and p.learner_id=@user for update of a,p
            """,("id",id),("user",user)))
        {
            await using var r=await query.ExecuteReaderAsync(ct); if(!await r.ReadAsync(ct)) throw new DomainException("ATTEMPT_NOT_FOUND");
            var snapshot=JsonSerializer.Deserialize<Snapshot>(r.GetString(6),Json)!;
            if(snapshot.SchemaVersion!=2) throw new DomainException("ATTEMPT_SNAPSHOT_INVALID");
            var attempt=new Attempt(id,user.ToString(),r.GetGuid(0),r.GetString(1),AttemptMode.Practice,snapshot.Items.Select(i=>i.ToDomain()),r.GetFieldValue<DateTimeOffset>(2),r.GetFieldValue<DateTimeOffset>(3));
            state=new(attempt,r.GetString(4),r.GetInt64(5),r.IsDBNull(7)?null:r.GetString(7),r.IsDBNull(8)?null:r.GetFieldValue<DateTimeOffset>(8),r.GetString(9),r.GetString(10),r.GetString(11),
                JsonSerializer.Deserialize<Dictionary<Guid,PracticeHelp>>(r.GetString(12),Json)!,r.IsDBNull(13)?null:JsonSerializer.Deserialize<PracticeResult>(r.GetString(13),Json));
        }
        await using var answers=Query("select question_revision_id,answer_json::text,revision,client_operation_id,saved_at from assessment.responses where attempt_id=@id",("id",id));
        var saved=new List<SavedResponse>(); await using(var r=await answers.ExecuteReaderAsync(ct))
            while(await r.ReadAsync(ct)) saved.Add(new(r.GetGuid(0),JsonSerializer.Deserialize<string[]>(r.GetString(1),Json)!.ToImmutableHashSet(StringComparer.Ordinal),r.GetInt64(2),r.GetGuid(3),r.GetFieldValue<DateTimeOffset>(4)));
        state.Aggregate.RestoreActive(state.Revision,saved,state.LeaseHash,state.LeaseUntil); return state;
    }

    private async Task<Dictionary<Guid,PracticeHelp>> ReadHelp(Guid form,CancellationToken ct)
    {
        var help=new Dictionary<Guid,PracticeHelp>();
        await using var query=Query("""
            select n.id,n.stable_id,r.part,r.content_json::text from content.form_questions f
            join content.question_nodes n on n.id=f.question_revision_id join content.question_revisions r on r.id=n.source_revision_id
            where f.form_version_id=@id
            """,("id",form));
        await using var reader=await query.ExecuteReaderAsync(ct);
        while(await reader.ReadAsync(ct))
        {
            if(reader.GetString(2)=="Part5")
            {
                var content=JsonSerializer.Deserialize<Part5Content>(reader.GetString(3),Json)!;
                help.Add(reader.GetGuid(0),new(content.RuleId,content.AnswerDerivation+"\n"+string.Join("\n",content.Options.Select(o=>$"{o.Text}: {o.Justification}")),null));
            }
            else
            {
                var content=JsonSerializer.Deserialize<Part7GroupContent>(reader.GetString(3),Json)!;
                var item=content.Questions.Single(q=>q.StableId==reader.GetString(1));
                help.Add(reader.GetGuid(0),new("Part7DirectEvidence",item.Rationale,string.Join("\n",item.Evidence.Select(e=>e.Quote))));
            }
        }
        return help;
    }
    private PracticeView View(State s)=>new(s.Aggregate.Id,s.Version,s.Tier,s.Label,s.Status,s.Revision,s.Aggregate.StartedAt,s.Aggregate.Deadline,clock.GetUtcNow(),
        s.Aggregate.Items.Select(Question).ToArray(),s.Aggregate.Responses.Select(r=>new QuizAnswer(r.QuestionRevisionId,r.SelectedOptionIds.SingleOrDefault())).ToArray(),s.Result);
    private static QuizQuestion Question(AttemptItemSnapshot i)=>new(i.QuestionRevisionId,i.Section,i.Stimulus,i.Prompt,i.Options.Select(o=>new QuizOption(o.StableId,o.Text)).ToArray());
    private async Task LockUser(Guid user,CancellationToken ct)
    {
        await using var query=Query("select id from identity_data.users where id=@user and status='Active' and email_verified_at is not null for update",("user",user));
        if(await query.ExecuteScalarAsync(ct) is null) throw new DomainException("FORBIDDEN");
    }
    private static void RequireActive(State state) { if(state.Status!="Active") throw new DomainException("ATTEMPT_ALREADY_SUBMITTED"); }
    private static void ValidateLease(string token) { if(token is null || token.Length!=64 || !token.All(char.IsAsciiHexDigit)) throw new DomainException("LEASE_TOKEN_INVALID"); }
    private static void ValidateOperation(Guid id,long revision) { if(id==Guid.Empty || revision<0) throw new DomainException("ATTEMPT_REQUEST_INVALID"); }
    private static void ValidatePage(int page,int size) { if(page is <1 or >10000 || size is <1 or >50) throw new DomainException("PAGINATION_INVALID"); }
    private static string Hash<T>(T value)=>Convert.ToHexString(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(value,Json)));
    private async Task<T?> Replay<T>(Guid id,Guid operation,string hash,CancellationToken ct) where T:class
    {
        await using var q=Query("select request_hash,response_json::text from assessment.practice_receipts where attempt_id=@id and operation_id=@op",("id",id),("op",operation));
        await using var r=await q.ExecuteReaderAsync(ct); if(!await r.ReadAsync(ct)) return null;
        if(r.GetString(0)!=hash) throw new DomainException("IDEMPOTENCY_CONFLICT"); return JsonSerializer.Deserialize<T>(r.GetString(1),Json)!;
    }
    private async Task Receipt<T>(Guid id,Guid operation,string hash,T result,CancellationToken ct)
    {
        await using var q=Query("insert into assessment.practice_receipts(attempt_id,operation_id,request_hash,response_json) values(@id,@op,@hash,cast(@json as jsonb))",("id",id),("op",operation),("hash",hash),("json",JsonSerializer.Serialize(result,Json)));
        await q.ExecuteNonQueryAsync(ct);
    }
    private sealed record Snapshot(int SchemaVersion,Item[] Items);
    private sealed record Item(Guid QuestionRevisionId,Guid QuestionFamilyId,string Section,string? Stimulus,string Prompt,ImmutableArray<AttemptOption> Options,string[] CorrectOptionIds,decimal MaxScore)
    { public AttemptItemSnapshot ToDomain()=>new(QuestionRevisionId,QuestionFamilyId,Section,Prompt,Options,CorrectOptionIds,MaxScore,Stimulus); }
    private sealed record State(Attempt Aggregate,string Status,long Revision,string? LeaseHash,DateTimeOffset? LeaseUntil,string Version,string Tier,string Label,Dictionary<Guid,PracticeHelp> Help,PracticeResult? Result);
}
