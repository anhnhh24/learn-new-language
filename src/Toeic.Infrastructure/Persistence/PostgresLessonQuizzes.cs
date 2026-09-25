using System.Collections.Immutable;
using System.Data.Common;
using System.Security.Cryptography;
using System.Text.Json;
using Toeic.Application;
using Toeic.Domain.Analytics;
using Toeic.Domain.Assessment;
using Toeic.Domain.Content;

namespace Toeic.Infrastructure.Persistence;

internal sealed class PostgresLessonQuizzes(IApplicationTransaction transaction, IPostgresSession session,
    BetaServingService serving, IItemTelemetryStore telemetry, ILearnerAnalyticsPseudonymizer pseudonymizer,
    TimeProvider clock) : ILessonQuizzes
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private DbCommand Query(string sql, params (string Name, object? Value)[] args) =>
        session.Connection.Query(sql, session.Transaction, args);

    public Task<LessonQuizView> StartAsync(Guid user, Guid lesson, StartLessonQuiz request, CancellationToken ct) =>
        transaction.ExecuteAsync(async token =>
        {
            if (request.ClientOperationId == Guid.Empty) throw new DomainException("CLIENT_OPERATION_ID_REQUIRED");
            await LockUser(user, token);
            await using (var replay = Query("select attempt_id,lesson_version_id from learning.lesson_quiz_attempts where learner_id=@user and start_operation_id=@op",
                ("user", user), ("op", request.ClientOperationId)))
            {
                Guid? old = null;
                await using (var reader = await replay.ExecuteReaderAsync(token))
                    if (await reader.ReadAsync(token))
                    {
                        if (reader.GetGuid(1) != lesson) throw new DomainException("IDEMPOTENCY_CONFLICT");
                        old = reader.GetGuid(0);
                    }
                if (old.HasValue) return View(await Read(user, old.Value, token));
            }
            await RequireAccess(user, lesson, token);
            Guid form;
            bool checkpoint;
            int count, retryDays;
            decimal passRate;
            await using (var binding = Query("""
                select b.form_version_id,lv.is_level_checkpoint,lv.quiz_question_count,
                       coalesce(lv.recommended_accuracy,0.8),b.retry_after_days
                from learning.lesson_quiz_forms b join learning.lesson_versions lv on lv.id=b.lesson_version_id
                where lv.id=@lesson for share of b,lv
                """, ("lesson", lesson)))
            {
                await using var reader = await binding.ExecuteReaderAsync(token);
                if (!await reader.ReadAsync(token)) throw new DomainException("QUIZ_NOT_READY");
                form = reader.GetGuid(0); checkpoint = reader.GetBoolean(1);
                if (reader.IsDBNull(2)) throw new DomainException("QUIZ_CONFIGURATION_INVALID");
                count = reader.GetInt32(2); passRate = reader.GetDecimal(3); retryDays = checkpoint ? reader.GetInt32(4) : 0;
            }
            await using var active = Query("""
                select a.id from learning.lesson_quiz_attempts q join assessment.attempts a on a.id=q.attempt_id
                where q.learner_id=@user and q.lesson_version_id=@lesson and a.status='Active'
                """, ("user", user), ("lesson", lesson));
            if (await active.ExecuteScalarAsync(token) is not null) throw new DomainException("ACTIVE_QUIZ_CONFLICT");
            if (checkpoint) await RequireCheckpointEntry(user, lesson, token);
            await using var cooldown = Query("""
                select exists(select 1 from learning.lesson_quiz_attempts where learner_id=@user
                  and lesson_version_id=@lesson and retry_at>@now)
                """, ("user", user), ("lesson", lesson), ("now", clock.GetUtcNow()));
            if ((bool)(await cooldown.ExecuteScalarAsync(token))!) throw new DomainException("CHECKPOINT_RETRY_NOT_READY");
            await using var frequency = Query("""
                select count(*) from learning.lesson_quiz_attempts q join assessment.attempts a on a.id=q.attempt_id
                where q.learner_id=@user and a.started_at>@since
                """, ("user", user), ("since", clock.GetUtcNow().AddHours(-1)));
            if ((long)(await frequency.ExecuteScalarAsync(token))! >= 30) throw new DomainException("QUIZ_RATE_LIMIT");
            var started = await serving.StartAsync(new(form, request.ClientOperationId), new(ActorType.Learner, user.ToString()), token);
            await using var insert = Query("""
                insert into learning.lesson_quiz_attempts(attempt_id,learner_id,lesson_version_id,start_operation_id,
                    tier,learner_label,form_version,is_checkpoint,pass_rate,retry_after_days)
                values (@id,@user,@lesson,@op,@tier,@label,@version,@checkpoint,@pass,@retry)
                """, ("id", started.AttemptId), ("user", user), ("lesson", lesson), ("op", request.ClientOperationId),
                ("tier", started.Tier), ("label", started.LearnerLabel), ("version", started.FormVersion),
                ("checkpoint", checkpoint), ("pass", passRate), ("retry", retryDays));
            await insert.ExecuteNonQueryAsync(token);
            var state = await Read(user, started.AttemptId, token);
            if (state.Items.Length != count || state.Items.Any(i => i.CorrectOptionIds.Length != 1 || i.MaxScore != 1))
                throw new DomainException("QUIZ_FORM_MISMATCH");
            return View(state);
        }, ct);

    public Task<LessonQuizView> GetAsync(Guid user, Guid attempt, CancellationToken ct) => transaction.ExecuteAsync(async token =>
    {
        await LockUser(user, token);
        var state = await Read(user, attempt, token);
        if (state.Status == "Active" && clock.GetUtcNow() >= state.Deadline)
        {
            await Finish(user, state, token);
            state = await Read(user, attempt, token);
        }
        return View(state);
    }, ct);

    public Task<QuizAnswerReceipt> SaveAsync(Guid user, Guid attempt, SaveQuizAnswer request, CancellationToken ct) => transaction.ExecuteAsync(async token =>
    {
        ValidateOperation(request.ClientOperationId, request.ExpectedRevision);
        if (request.QuestionId == Guid.Empty || request.OptionId?.Length > 100) throw new DomainException("ANSWER_OPTION_INVALID");
        await LockUser(user, token);
        var state = await Read(user, attempt, token);
        var hash = Hash(new { Kind = "Save", Request = request });
        var replay = await Replay<QuizAnswerReceipt>(attempt, request.ClientOperationId, hash, token);
        if (replay is not null) return replay;
        if (state.Status != "Active") throw new DomainException("ATTEMPT_ALREADY_SUBMITTED");
        if (clock.GetUtcNow() >= state.Deadline) throw new DomainException("ATTEMPT_DEADLINE_REACHED");
        if (state.Revision != request.ExpectedRevision) throw new DomainException("RESPONSE_CONFLICT");
        var item = state.Items.SingleOrDefault(i => i.QuestionRevisionId == request.QuestionId)
            ?? throw new DomainException("ATTEMPT_ITEM_NOT_FOUND");
        if (request.OptionId is not null && !item.Options.Any(o => o.StableId == request.OptionId)) throw new DomainException("ANSWER_OPTION_INVALID");
        var now = clock.GetUtcNow();
        var receipt = new QuizAnswerReceipt(state.Revision + 1, now);
        await using var save = Query("""
            insert into assessment.responses(attempt_id,question_revision_id,answer_json,revision,client_operation_id,saved_at)
            values (@id,@question,cast(@answer as jsonb),@revision,@op,@now)
            on conflict(attempt_id,question_revision_id) do update set answer_json=excluded.answer_json,
              revision=excluded.revision,client_operation_id=excluded.client_operation_id,saved_at=excluded.saved_at;
            update assessment.attempts set revision=@revision where id=@id;
            """, ("id", attempt), ("question", request.QuestionId),
            ("answer", JsonSerializer.Serialize(request.OptionId is null ? Array.Empty<string>() : new[] { request.OptionId }, Json)),
            ("revision", receipt.Revision), ("op", request.ClientOperationId), ("now", now));
        await save.ExecuteNonQueryAsync(token);
        await SaveReceipt(attempt, request.ClientOperationId, hash, receipt, token);
        return receipt;
    }, ct);

    public Task<LessonQuizResult> SubmitAsync(Guid user, Guid attempt, SubmitLessonQuiz request, CancellationToken ct) => transaction.ExecuteAsync(async token =>
    {
        ValidateOperation(request.ClientOperationId, request.ExpectedRevision);
        await LockUser(user, token);
        var state = await Read(user, attempt, token);
        var hash = Hash(new { Kind = "Submit", Request = request });
        var replay = await Replay<LessonQuizResult>(attempt, request.ClientOperationId, hash, token);
        if (replay is not null) return replay;
        if (state.Result is not null) throw new DomainException("ATTEMPT_ALREADY_SUBMITTED");
        if (state.Revision != request.ExpectedRevision) throw new DomainException("ATTEMPT_REVISION_CONFLICT");
        var result = await Finish(user, state, token);
        await SaveReceipt(attempt, request.ClientOperationId, hash, result, token);
        return result;
    }, ct);

    public Task<LessonQuizHistory> HistoryAsync(Guid user, Guid lesson, int page, int pageSize, CancellationToken ct) => transaction.ExecuteAsync(async token =>
    {
        if (page is < 1 or > 10000 || pageSize is < 1 or > 50) throw new DomainException("PAGINATION_INVALID");
        await LockUser(user, token);
        await using var query = Query("""
            select a.id,a.status,a.started_at,a.deadline,q.passed,q.retry_at
            from learning.lesson_quiz_attempts q join assessment.attempts a on a.id=q.attempt_id
            where q.learner_id=@user and q.lesson_version_id=@lesson
            order by a.started_at desc,a.id limit @take offset @skip
            """, ("user", user), ("lesson", lesson), ("take", pageSize + 1), ("skip", (page - 1) * pageSize));
        var items = new List<LessonQuizHistoryItem>();
        await using var reader = await query.ExecuteReaderAsync(token);
        while (await reader.ReadAsync(token)) items.Add(new(reader.GetGuid(0), reader.GetString(1), reader.GetFieldValue<DateTimeOffset>(2),
            reader.GetFieldValue<DateTimeOffset>(3), reader.IsDBNull(4) ? null : reader.GetBoolean(4), reader.IsDBNull(5) ? null : reader.GetFieldValue<DateTimeOffset>(5)));
        return new LessonQuizHistory(items.Take(pageSize).ToArray(), page, pageSize, items.Count > pageSize);
    }, ct);

    private async Task<LessonQuizResult> Finish(Guid user, State state, CancellationToken ct)
    {
        if (state.Status != "Active") throw new DomainException("ATTEMPT_ALREADY_SUBMITTED");
        var now = clock.GetUtcNow();
        var submitted = now >= state.Deadline ? state.Deadline : now;
        var items = state.Items.Select(i =>
        {
            state.Answers.TryGetValue(i.QuestionRevisionId, out var choice);
            var selected = choice is null ? ImmutableHashSet<string>.Empty : ImmutableHashSet.Create(choice);
            var score = i.ToDomain().Score(selected);
            return new QuizItemResult(i.QuestionRevisionId, choice, i.CorrectOptionIds, score == i.MaxScore);
        }).ToArray();
        var raw = items.Count(i => i.Correct);
        var accuracy = decimal.Round((decimal)raw / items.Length, 4);
        // Compare unrounded ratio for the pass decision, not its display representation.
        var passed = raw >= state.PassRate * items.Length;
        var retry = state.Checkpoint && !passed ? submitted.AddDays(state.RetryDays) : (DateTimeOffset?)null;
        var result = new LessonQuizResult(state.Id, raw, items.Length, accuracy, passed, state.Checkpoint, submitted, retry, items, "lesson-quiz-v1");
        await using var grade = Query("""
            insert into assessment.grade_versions(id,attempt_id,version,raw_score,max_score,answered_count,policy_version,graded_at)
            values (@grade,@id,1,@raw,@max,@answered,'lesson-quiz-v1',@now);
            update assessment.attempts set status='Graded',revision=revision+1,submitted_at=@submitted,submission_receipt_id=@receipt where id=@id;
            update learning.lesson_quiz_attempts set passed=@passed,retry_at=@retry,result_json=cast(@result as jsonb) where attempt_id=@id;
            """, ("grade", Guid.NewGuid()), ("id", state.Id), ("raw", raw), ("max", items.Length),
            ("answered", items.Count(i => i.SelectedOptionId is not null)), ("now", now), ("submitted", submitted),
            ("receipt", Guid.NewGuid()), ("passed", passed), ("retry", retry), ("result", JsonSerializer.Serialize(result, Json)));
        await grade.ExecuteNonQueryAsync(ct);
        await UpdateProgress(user, state.Lesson, raw, items.Length, now, ct);
        await PostgresErrorNotebook.CaptureGradedQuizAsync(session.Connection, session.Transaction, user, state.Id, now, ct);
        var learnerHash = pseudonymizer.Pseudonymize(user.ToString());
        foreach (var item in items.Where(i => i.SelectedOptionId is not null))
        {
            // Per-item timing/first-exposure evidence is not collected yet: never promote from these samples.
            await telemetry.AppendResponseAsync(new(Guid.NewGuid(), state.Id, item.QuestionId, learnerHash, state.FormVersion,
                item.SelectedOptionId!, item.Correct, false, 0, "Unknown", submitted), ct);
        }
        return result;
    }

    private async Task UpdateProgress(Guid user, Guid lesson, int score, int maximum, DateTimeOffset submitted, CancellationToken ct)
    {
        var pages = await PostgresLearnerLearning.ReadPageIdsAsync(session.Connection, session.Transaction, lesson, ct);
        await using var ensure = Query("""
            insert into learning.lesson_progress(id,learner_id,lesson_version_id) values (@id,@user,@lesson)
            on conflict(learner_id,lesson_version_id) do nothing
            """, ("id", Guid.NewGuid()), ("user", user), ("lesson", lesson));
        await ensure.ExecuteNonQueryAsync(ct);
        var progress = await PostgresLearnerLearning.LoadProgressAsync(session.Connection, session.Transaction, user, lesson, pages.Required, pages.All, true, ct);
        progress.SubmitQuiz(user.ToString(), score, maximum, progress.Revision, submitted);
        await using var save = Query("""
            update learning.lesson_progress set quiz_submitted=true,first_quiz_accuracy=@accuracy,needs_review=@review,
                revision=@revision,completed_at=@completed where learner_id=@user and lesson_version_id=@lesson
            """, ("accuracy", progress.FirstQuizAccuracy), ("review", progress.NeedsReview), ("revision", progress.Revision),
            ("completed", progress.CompletedAt), ("user", user), ("lesson", lesson));
        await save.ExecuteNonQueryAsync(ct);
    }

    private async Task LockUser(Guid user, CancellationToken ct)
    {
        await using var query = Query("select id from identity_data.users where id=@user and status='Active' and email_verified_at is not null for update", ("user", user));
        if (await query.ExecuteScalarAsync(ct) is null) throw new DomainException("FORBIDDEN");
    }

    private async Task RequireAccess(Guid user, Guid lesson, CancellationToken ct)
    {
        await using var query = Query("""
            select lv.id from learning.lesson_versions lv join learning.course_versions cv on cv.id=lv.course_version_id
            join learning.enrollments e on e.course_version_id=cv.id and e.learner_id=@user
            where lv.id=@lesson and lv.state='Published' and cv.state='Published' and e.state in ('Active','Completed')
              and (cv.access_model<>'PaidEntitlement' or exists(select 1 from billing.entitlements ent
                where ent.learner_id=@user and ent.resource_id=cv.id and ent.starts_at<=@now and ent.expires_at>@now))
            for share of lv,cv,e
            """, ("user", user), ("lesson", lesson), ("now", clock.GetUtcNow()));
        if (await query.ExecuteScalarAsync(ct) is null) throw new DomainException("LESSON_NOT_FOUND");
    }

    private async Task RequireCheckpointEntry(Guid user, Guid lesson, CancellationToken ct)
    {
        await using var missing = Query("""
            select exists(select 1 from learning.lesson_prerequisites pre
              left join learning.lesson_progress p on p.lesson_version_id=pre.prerequisite_lesson_version_id and p.learner_id=@user
              where pre.lesson_version_id=@lesson and pre.requirement_type='RequiredForCheckpoint' and p.completed_at is null)
            """, ("user", user), ("lesson", lesson));
        if ((bool)(await missing.ExecuteScalarAsync(ct))!) throw new DomainException("CHECKPOINT_PREREQUISITE_REQUIRED");
        await using var previous = Query("""
            select exists(
                select 1 from learning.lesson_versions current_lesson
                join learning.course_modules cm on cm.id=current_lesson.module_id
                join learning.curriculum_levels current_level on current_level.id=cm.level_id
                join learning.curriculum_levels previous_level on previous_level.course_version_id=current_level.course_version_id
                    and previous_level.sequence<current_level.sequence
                join learning.course_modules pm on pm.level_id=previous_level.id
                join learning.lesson_versions pl on pl.module_id=pm.id and pl.is_level_checkpoint
                where current_lesson.id=@lesson and not exists(select 1 from learning.lesson_quiz_attempts q
                    where q.learner_id=@user and q.lesson_version_id=pl.id and q.passed=true))
            """, ("user", user), ("lesson", lesson));
        if ((bool)(await previous.ExecuteScalarAsync(ct))!) throw new DomainException("PREVIOUS_CHECKPOINT_REQUIRED");
    }

    private async Task<State> Read(Guid user, Guid attempt, CancellationToken ct)
    {
        State state;
        await using var query = Query("""
            select a.id,q.lesson_version_id,a.status,q.tier,q.learner_label,a.started_at,a.deadline,a.revision,
                a.snapshot_json::text,q.is_checkpoint,q.pass_rate,q.retry_after_days,q.form_version,q.result_json::text
            from learning.lesson_quiz_attempts q join assessment.attempts a on a.id=q.attempt_id
            where a.id=@id and a.learner_id=@user and q.learner_id=@user for update of a,q
            """, ("id", attempt), ("user", user));
        await using (var reader = await query.ExecuteReaderAsync(ct))
        {
            if (!await reader.ReadAsync(ct)) throw new DomainException("ATTEMPT_NOT_FOUND");
            var snapshot = JsonSerializer.Deserialize<Snapshot>(reader.GetString(8), Json)!;
            if (snapshot.SchemaVersion != 2 || snapshot.Items.Length == 0) throw new DomainException("QUIZ_SNAPSHOT_INVALID");
            state = new(reader.GetGuid(0), reader.GetGuid(1), reader.GetString(2), reader.GetString(3), reader.GetString(4),
                reader.GetFieldValue<DateTimeOffset>(5), reader.GetFieldValue<DateTimeOffset>(6), reader.GetInt64(7), snapshot.Items,
                reader.GetBoolean(9), reader.GetDecimal(10), reader.GetInt32(11), reader.GetString(12),
                reader.IsDBNull(13) ? null : JsonSerializer.Deserialize<LessonQuizResult>(reader.GetString(13), Json), []);
        }
        await using var answers = Query("select question_revision_id,answer_json::text from assessment.responses where attempt_id=@id", ("id", attempt));
        await using var rows = await answers.ExecuteReaderAsync(ct);
        while (await rows.ReadAsync(ct)) state.Answers[rows.GetGuid(0)] = JsonSerializer.Deserialize<string[]>(rows.GetString(1), Json)!.SingleOrDefault();
        return state;
    }

    private LessonQuizView View(State state) => new(state.Id, state.Lesson, state.Status, state.Tier, state.Label,
        state.Started, state.Deadline, clock.GetUtcNow(), state.Revision,
        state.Items.Select(i => new QuizQuestion(i.QuestionRevisionId, i.Section, i.Stimulus, i.Prompt,
            i.Options.Select(o => new QuizOption(o.StableId, o.Text)).ToArray())).ToArray(),
        state.Answers.Select(a => new QuizAnswer(a.Key, a.Value)).ToArray(), state.Result);

    private static void ValidateOperation(Guid operation, long revision)
    {
        if (operation == Guid.Empty || revision < 0) throw new DomainException("QUIZ_REQUEST_INVALID");
    }
    private static string Hash<T>(T body) => Convert.ToHexString(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(body, Json)));
    private async Task<T?> Replay<T>(Guid attempt, Guid operation, string hash, CancellationToken ct) where T : class
    {
        await using var query = Query("select request_hash,response_json::text from learning.lesson_quiz_receipts where attempt_id=@id and operation_id=@op",
            ("id", attempt), ("op", operation));
        await using var reader = await query.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct)) return null;
        if (reader.GetString(0) != hash) throw new DomainException("IDEMPOTENCY_CONFLICT");
        return JsonSerializer.Deserialize<T>(reader.GetString(1), Json)!;
    }
    private async Task SaveReceipt<T>(Guid attempt, Guid operation, string hash, T result, CancellationToken ct)
    {
        await using var query = Query("""
            insert into learning.lesson_quiz_receipts(attempt_id,operation_id,request_hash,response_json)
            values (@id,@op,@hash,cast(@result as jsonb))
            """, ("id", attempt), ("op", operation), ("hash", hash), ("result", JsonSerializer.Serialize(result, Json)));
        await query.ExecuteNonQueryAsync(ct);
    }
    private sealed record Snapshot(int SchemaVersion, Item[] Items);
    private sealed record Item(Guid QuestionRevisionId, Guid QuestionFamilyId, string Section, string? Stimulus,
        string Prompt, ImmutableArray<AttemptOption> Options, string[] CorrectOptionIds, decimal MaxScore)
    {
        public AttemptItemSnapshot ToDomain() => new(QuestionRevisionId, QuestionFamilyId, Section, Prompt, Options, CorrectOptionIds, MaxScore, Stimulus);
    }
    private sealed record State(Guid Id, Guid Lesson, string Status, string Tier, string Label, DateTimeOffset Started,
        DateTimeOffset Deadline, long Revision, Item[] Items, bool Checkpoint, decimal PassRate, int RetryDays,
        string FormVersion, LessonQuizResult? Result, Dictionary<Guid, string?> Answers);
}
