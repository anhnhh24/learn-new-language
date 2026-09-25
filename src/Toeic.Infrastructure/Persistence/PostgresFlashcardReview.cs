using System.Data.Common;
using System.Security.Cryptography;
using System.Text.Json;
using Toeic.Application;
using Toeic.Domain.Content;
using Toeic.Domain.Learning;

namespace Toeic.Infrastructure.Persistence;

internal sealed class PostgresFlashcardReview(IDbConnectionFactory connections, TimeProvider clock) : IFlashcardReview
{
    private const string Columns = "c.id,p.term,p.meaning,p.example,c.state,c.interval_days,c.due_at,c.revision,p.archived";
    private const string Join = " from learning.user_cards c join learning.private_card_content p on p.card_id=c.id ";

    public async Task<FlashcardView> CreateAsync(Guid user, CreateFlashcard request, CancellationToken ct)
    {
        ValidateContent(request.Term, request.Meaning, request.Example);
        if (request.ClientOperationId == Guid.Empty) throw new DomainException("OPERATION_ID_REQUIRED");
        var hash = Hash(new { Kind = "Create", Term = request.Term.Trim(), Meaning = request.Meaning.Trim(), Example = request.Example?.Trim() ?? "" });
        await using var db = await connections.OpenAsync(ct);
        await using var tx = await db.BeginTransactionAsync(ct);
        await LockUser(db, tx, user, ct);
        var replay = await Replay<FlashcardView>(db, tx, user, request.ClientOperationId, hash, ct);
        if (replay is not null) return replay;
        var now = clock.GetUtcNow();
        await using var count = db.Query("select count(*)" + Join + "where c.learner_id=@user and p.created_at>@since", tx,
            ("user", user), ("since", now.AddHours(-1)));
        if ((long)(await count.ExecuteScalarAsync(ct))! >= 100) throw new DomainException("FLASHCARD_RATE_LIMIT");
        var id = Guid.NewGuid();
        var view = new FlashcardView(id, request.Term.Trim(), request.Meaning.Trim(), request.Example?.Trim() ?? "",
            "New", 0, now, 0, false);
        await using var insert = db.Query("""
            insert into learning.user_cards(id,learner_id,card_version_id,state,interval_days,due_at,algorithm_version)
            values (@id,@user,@version,'New',0,@now,@algorithm);
            insert into learning.private_card_content(card_id,term,meaning,example,created_at,create_operation_id,create_hash)
            values (@id,@term,@meaning,@example,@now,@operation,@hash);
            """, tx, ("id", id), ("user", user), ("version", Guid.NewGuid()), ("now", now),
            ("algorithm", UserCard.AlgorithmVersion), ("term", view.Term), ("meaning", view.Meaning),
            ("example", view.Example), ("operation", request.ClientOperationId), ("hash", hash));
        await insert.ExecuteNonQueryAsync(ct);
        await Receipt(db, tx, user, request.ClientOperationId, hash, view, ct);
        await tx.CommitAsync(ct);
        return view;
    }

    public async Task<FlashcardPage> ListAsync(Guid user, int page, int pageSize, bool archived, CancellationToken ct)
    {
        if (page is < 1 or > 10000 || pageSize is < 1 or > 50) throw new DomainException("PAGINATION_INVALID");
        await using var db = await connections.OpenAsync(ct);
        await using var query = db.Query("select " + Columns + Join + """
            where c.learner_id=@user and p.archived=@archived order by p.created_at desc,c.id limit @take offset @skip
            """, null, ("user", user), ("archived", archived), ("take", pageSize + 1), ("skip", (page - 1) * pageSize));
        var items = new List<FlashcardView>();
        await using var reader = await query.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct)) items.Add(Map(reader));
        return new(items.Take(pageSize).ToArray(), page, pageSize, items.Count > pageSize);
    }

    public async Task<FlashcardView> EditAsync(Guid user, Guid card, EditFlashcard request, CancellationToken ct)
    {
        ValidateContent(request.Term, request.Meaning, request.Example);
        await using var db = await connections.OpenAsync(ct);
        await using var tx = await db.BeginTransactionAsync(ct);
        await LockUser(db, tx, user, ct);
        var current = await ReadCard(db, tx, user, card, ct);
        RequireRevision(current, request.ExpectedRevision);
        // Editing invalidates every previous reveal, but preserves the learner's schedule.
        await using var update = db.Query("""
            update learning.private_card_content set term=@term,meaning=@meaning,example=@example,archived=@archived where card_id=@id;
            update learning.user_cards set revision=revision+1 where id=@id and learner_id=@user;
            delete from learning.flashcard_reveals where card_id=@id;
            """, tx, ("id", card), ("user", user), ("term", request.Term.Trim()), ("meaning", request.Meaning.Trim()),
            ("example", request.Example?.Trim() ?? ""), ("archived", request.Archived));
        await update.ExecuteNonQueryAsync(ct);
        await tx.CommitAsync(ct);
        return current with { Term = request.Term.Trim(), Meaning = request.Meaning.Trim(), Example = request.Example?.Trim() ?? "",
            Archived = request.Archived, Revision = current.Revision + 1 };
    }

    public async Task<FlashcardQueue> QueueAsync(Guid user, int limit, CancellationToken ct)
    {
        if (limit is < 1 or > 20) throw new DomainException("REVIEW_LIMIT_INVALID");
        await using var db = await connections.OpenAsync(ct);
        await using var tx = await db.BeginTransactionAsync(ct);
        var zone = await LockUser(db, tx, user, ct);
        var now = clock.GetUtcNow();
        var remaining = await Remaining(db, tx, user, now, zone, ct);
        await using var query = db.Query("""
            with candidates as (
                (select c.id,p.term,c.revision,false as is_new,c.due_at,0 as priority,c.due_at as sort_at
                 from learning.user_cards c join learning.private_card_content p on p.card_id=c.id
                 where c.learner_id=@user and not p.archived and p.introduced_at is not null and c.due_at<=@now
                 order by c.due_at,c.id limit @take)
                union all
                (select c.id,p.term,c.revision,true as is_new,c.due_at,1 as priority,p.created_at as sort_at
                 from learning.user_cards c join learning.private_card_content p on p.card_id=c.id
                 where c.learner_id=@user and not p.archived and p.introduced_at is null
                 order by p.created_at,c.id limit @remaining)
            ) select id,term,revision,is_new,due_at from candidates order by priority,sort_at,id limit @take;
            """, tx, ("user", user), ("now", now), ("take", limit), ("remaining", remaining));
        var items = new List<FlashcardFront>();
        await using (var reader = await query.ExecuteReaderAsync(ct))
            while (await reader.ReadAsync(ct)) items.Add(new(reader.GetGuid(0), reader.GetString(1), reader.GetInt64(2), reader.GetBoolean(3), reader.GetFieldValue<DateTimeOffset>(4)));
        await tx.CommitAsync(ct);
        return new(items, remaining);
    }

    public async Task<FlashcardAnswer> RevealAsync(Guid user, Guid card, RevealFlashcard request, CancellationToken ct)
    {
        await using var db = await connections.OpenAsync(ct);
        await using var tx = await db.BeginTransactionAsync(ct);
        var zone = await LockUser(db, tx, user, ct);
        var current = await ReadCard(db, tx, user, card, ct);
        RequireRevision(current, request.ExpectedRevision);
        if (current.Archived) throw new DomainException("USER_CARD_NOT_FOUND");
        var now = clock.GetUtcNow();
        await using var introduced = db.Query("select introduced_at from learning.private_card_content where card_id=@id", tx, ("id", card));
        if (await introduced.ExecuteScalarAsync(ct) is DBNull)
        {
            if (await Remaining(db, tx, user, now, zone, ct) == 0) throw new DomainException("NEW_CARD_DAILY_LIMIT");
            await using var introduce = db.Query("update learning.private_card_content set introduced_at=@now where card_id=@id", tx,
                ("now", now), ("id", card));
            await introduce.ExecuteNonQueryAsync(ct);
        }
        var reveal = Guid.NewGuid();
        var expires = now.AddMinutes(30);
        // Keep a still-valid reveal stable across tabs and retries for the same revision.
        await using var save = db.Query("""
            insert into learning.flashcard_reveals(card_id,reveal_id,revision,expires_at) values (@id,@reveal,@revision,@expires)
            on conflict(card_id) do update set reveal_id=excluded.reveal_id,revision=excluded.revision,expires_at=excluded.expires_at
            where learning.flashcard_reveals.revision<>excluded.revision or learning.flashcard_reveals.expires_at<=@now;
            """, tx, ("id", card), ("reveal", reveal), ("revision", current.Revision), ("expires", expires), ("now", now));
        await save.ExecuteNonQueryAsync(ct);
        await using var read = db.Query("select reveal_id,expires_at from learning.flashcard_reveals where card_id=@id", tx, ("id", card));
        await using (var reader = await read.ExecuteReaderAsync(ct))
        {
            await reader.ReadAsync(ct);
            reveal = reader.GetGuid(0); expires = reader.GetFieldValue<DateTimeOffset>(1);
        }
        await tx.CommitAsync(ct);
        return new(reveal, card, current.Revision, current.Meaning, current.Example, expires);
    }

    public async Task<FlashcardReviewReceipt> RateAsync(Guid user, Guid card, RateFlashcard request, CancellationToken ct)
    {
        if (request.ClientOperationId == Guid.Empty || request.RevealId == Guid.Empty || request.ExpectedRevision < 0)
            throw new DomainException("REVIEW_INVALID");
        var rating = request.Rating switch
        {
            "Forgot" => ReviewRating.Forgot, "Hard" => ReviewRating.Hard,
            "Remembered" => ReviewRating.Remembered, "Easy" => ReviewRating.Easy,
            _ => throw new DomainException("REVIEW_RATING_INVALID")
        };
        var hash = Hash(new { Kind = "Rate", Card = card, request.RevealId, request.ExpectedRevision, request.Rating });
        await using var db = await connections.OpenAsync(ct);
        await using var tx = await db.BeginTransactionAsync(ct);
        var zone = await LockUser(db, tx, user, ct);
        var replay = await Replay<FlashcardReviewReceipt>(db, tx, user, request.ClientOperationId, hash, ct);
        if (replay is not null) return replay;
        var current = await ReadCard(db, tx, user, card, ct);
        RequireRevision(current, request.ExpectedRevision);
        if (current.Archived) throw new DomainException("USER_CARD_NOT_FOUND");
        var now = clock.GetUtcNow();
        await using var reveal = db.Query("""
            select reveal_id from learning.flashcard_reveals where card_id=@id and reveal_id=@reveal
            and revision=@revision and expires_at>@now
            """, tx, ("id", card), ("reveal", request.RevealId), ("revision", current.Revision), ("now", now));
        if (await reveal.ExecuteScalarAsync(ct) is null) throw new DomainException("REVIEW_REVEAL_REQUIRED");
        await using var version = db.Query("select card_version_id from learning.user_cards where id=@id", tx, ("id", card));
        var aggregate = new UserCard(card, user.ToString(), (Guid)(await version.ExecuteScalarAsync(ct))!, now);
        aggregate.Restore(current.IntervalDays, current.DueAt, Enum.Parse<CardLearningState>(current.State));
        var result = aggregate.Review(user.ToString(), rating, Guid.NewGuid(), now, zone);
        var receipt = new FlashcardReviewReceipt(result.EventId, card, request.Rating, result.NewIntervalDays, now,
            result.DueAt, aggregate.State.ToString(), current.Revision + 1, result.WasEarly);
        await using var persist = db.Query("""
            update learning.user_cards set state=@state,interval_days=@interval,due_at=@due,revision=revision+1,algorithm_version=@algorithm
            where id=@id and learner_id=@user;
            insert into learning.review_events(event_id,card_id,learner_id,rating,previous_interval_days,new_interval_days,
                reviewed_at,due_at,algorithm_version,was_early)
            values (@event,@id,@user,@rating,@previous,@interval,@now,@due,@algorithm,@early);
            delete from learning.flashcard_reveals where card_id=@id;
            """, tx, ("id", card), ("user", user), ("state", receipt.State), ("interval", receipt.IntervalDays),
            ("due", receipt.DueAt), ("algorithm", result.AlgorithmVersion), ("event", result.EventId),
            ("rating", request.Rating), ("previous", result.PreviousIntervalDays), ("now", now), ("early", result.WasEarly));
        await persist.ExecuteNonQueryAsync(ct);
        await Receipt(db, tx, user, request.ClientOperationId, hash, receipt, ct);
        await tx.CommitAsync(ct);
        return receipt;
    }

    public async Task<FlashcardSettings> SettingsAsync(Guid user, ChangeFlashcardSettings? request, CancellationToken ct)
    {
        if (request is not null && (request.NewCardsPerDay is < 0 or > 30 || request.ExpectedRevision < 0))
            throw new DomainException("FLASHCARD_SETTINGS_INVALID");
        await using var db = await connections.OpenAsync(ct);
        await using var tx = await db.BeginTransactionAsync(ct);
        await LockUser(db, tx, user, ct);
        var current = new FlashcardSettings(5, 0);
        await using var query = db.Query("select new_cards_per_day,revision from learning.flashcard_settings where learner_id=@user", tx, ("user", user));
        await using (var reader = await query.ExecuteReaderAsync(ct))
            if (await reader.ReadAsync(ct)) current = new(reader.GetInt32(0), reader.GetInt64(1));
        if (request is not null)
        {
            if (request.ExpectedRevision != current.Revision) throw new DomainException("FLASHCARD_SETTINGS_CONFLICT");
            current = new(request.NewCardsPerDay, current.Revision + 1);
            await using var save = db.Query("""
                insert into learning.flashcard_settings(learner_id,new_cards_per_day,revision) values (@user,@limit,@revision)
                on conflict(learner_id) do update set new_cards_per_day=excluded.new_cards_per_day,revision=excluded.revision
                """, tx, ("user", user), ("limit", current.NewCardsPerDay), ("revision", current.Revision));
            await save.ExecuteNonQueryAsync(ct);
        }
        await tx.CommitAsync(ct);
        return current;
    }

    private static async Task<TimeZoneInfo> LockUser(DbConnection db, DbTransaction tx, Guid user, CancellationToken ct)
    {
        await using var query = db.Query("select timezone from identity_data.users where id=@user and status='Active' and email_verified_at is not null for update", tx, ("user", user));
        var zone = await query.ExecuteScalarAsync(ct) as string ?? throw new DomainException("FORBIDDEN");
        try { return TimeZoneInfo.FindSystemTimeZoneById(zone); }
        catch (TimeZoneNotFoundException) { throw new DomainException("TIMEZONE_INVALID"); }
        catch (InvalidTimeZoneException) { throw new DomainException("TIMEZONE_INVALID"); }
    }

    private static async Task<int> Remaining(DbConnection db, DbTransaction tx, Guid user, DateTimeOffset now, TimeZoneInfo zone, CancellationToken ct)
    {
        // Compare local dates directly: also handles DST gaps at local midnight.
        var day = TimeZoneInfo.ConvertTime(now, zone).ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture);
        var ianaZone = zone.Id;
        if (TimeZoneInfo.TryConvertWindowsIdToIanaId(zone.Id, out var converted)) ianaZone = converted;
        await using var query = db.Query("""
            select greatest(0,coalesce((select new_cards_per_day from learning.flashcard_settings where learner_id=@user),5)
                -(select count(*)::int from learning.user_cards c join learning.private_card_content p on p.card_id=c.id
                  where c.learner_id=@user and (p.introduced_at at time zone @zone)::date=cast(@day as date)))
            """, tx, ("user", user), ("zone", ianaZone), ("day", day));
        return (int)(await query.ExecuteScalarAsync(ct))!;
    }

    private static async Task<FlashcardView> ReadCard(DbConnection db, DbTransaction tx, Guid user, Guid card, CancellationToken ct)
    {
        await using var query = db.Query("select " + Columns + Join + "where c.learner_id=@user and c.id=@id for update of c,p", tx, ("user", user), ("id", card));
        await using var reader = await query.ExecuteReaderAsync(ct);
        return await reader.ReadAsync(ct) ? Map(reader) : throw new DomainException("USER_CARD_NOT_FOUND");
    }

    private static FlashcardView Map(DbDataReader reader) => new(reader.GetGuid(0), reader.GetString(1), reader.GetString(2),
        reader.GetString(3), reader.GetString(4), reader.GetInt32(5), reader.GetFieldValue<DateTimeOffset>(6), reader.GetInt64(7), reader.GetBoolean(8));

    private static void RequireRevision(FlashcardView card, long revision)
    {
        if (revision != card.Revision) throw new DomainException("FLASHCARD_CONFLICT");
    }

    private static void ValidateContent(string term, string meaning, string? example)
    {
        if (string.IsNullOrWhiteSpace(term) || term.Trim().Length > 200 || string.IsNullOrWhiteSpace(meaning) ||
            meaning.Trim().Length > 2000 || (example?.Trim().Length ?? 0) > 2000)
            throw new DomainException("FLASHCARD_CONTENT_INVALID");
    }

    private static string Hash<T>(T request) => Convert.ToHexString(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(request)));

    private static async Task<T?> Replay<T>(DbConnection db, DbTransaction tx, Guid user, Guid operation, string hash, CancellationToken ct) where T : class
    {
        await using var query = db.Query("select request_hash,response_json::text from learning.flashcard_operations where learner_id=@user and operation_id=@operation", tx,
            ("user", user), ("operation", operation));
        await using var reader = await query.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct)) return null;
        if (reader.GetString(0) != hash) throw new DomainException("IDEMPOTENCY_CONFLICT");
        return JsonSerializer.Deserialize<T>(reader.GetString(1))!;
    }

    private static async Task Receipt<T>(DbConnection db, DbTransaction tx, Guid user, Guid operation, string hash, T response, CancellationToken ct)
    {
        await using var save = db.Query("insert into learning.flashcard_operations(learner_id,operation_id,request_hash,response_json) values (@user,@operation,@hash,cast(@response as jsonb))", tx,
            ("user", user), ("operation", operation), ("hash", hash), ("response", JsonSerializer.Serialize(response)));
        await save.ExecuteNonQueryAsync(ct);
    }
}
