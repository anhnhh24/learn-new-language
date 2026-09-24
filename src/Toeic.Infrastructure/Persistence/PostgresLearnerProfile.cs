using System.Data.Common;
using Toeic.Application;
using Toeic.Domain.Content;

namespace Toeic.Infrastructure.Persistence;

internal sealed class PostgresLearnerProfile(IDbConnectionFactory connections, TimeProvider clock)
    : ILearnerProfile
{
    public async Task<LearnerProfileView> GetAsync(Guid userId, CancellationToken ct)
    {
        await using var db = await connections.OpenAsync(ct);
        return await ReadAsync(db, null, userId, ct);
    }

    public async Task<LearnerProfileView> SaveAsync(Guid userId, SaveLearnerProfile input, CancellationToken ct)
    {
        Validate(input);
        await using var db = await connections.OpenAsync(ct);
        await using var tx = await db.BeginTransactionAsync(ct);
        // Serializes first insert as well as subsequent writes with account lifecycle changes.
        await using var guard = db.Query("""
            select id from identity_data.users where id = @id
              and status = 'Active' and email_verified_at is not null for update;
            """, tx, ("id", userId));
        if (await guard.ExecuteScalarAsync(ct) is null) throw new DomainException("FORBIDDEN");
        var current = await ReadAsync(db, tx, userId, ct);
        if (current.Revision != input.ExpectedRevision) throw new DomainException("PROFILE_CONFLICT");
        var now = clock.GetUtcNow();
        var revision = checked(current.Revision + 1);
        var completed = current.OnboardingCompletedAt ?? (input.CompleteOnboarding ? now : null);
        var skipped = current.PlacementSkippedAt ?? (input.SkipPlacement ? now : null);
        var days = input.StudyDays.Distinct().Order().ToArray();
        var interests = input.Interests.Select(value => value.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        await using var command = db.Query("""
            update identity_data.users set display_name = @name, timezone = @timezone where id = @id;
            insert into learning.learner_profiles
                (learner_id,revision,goal,self_level,minutes_per_day,study_days,interests,
                 onboarding_completed_at,placement_skipped_at,email_reminders,in_app_reminders,
                 reminder_minute,quiet_start_minute,quiet_end_minute,updated_at)
            values (@id,@revision,@goal,@level,@minutes,@days,@interests,@completed,@skipped,
                    @email,@inapp,@reminder,@quietStart,@quietEnd,@now)
            on conflict (learner_id) do update set
                revision = excluded.revision, goal = excluded.goal, self_level = excluded.self_level,
                minutes_per_day = excluded.minutes_per_day, study_days = excluded.study_days,
                interests = excluded.interests, onboarding_completed_at = excluded.onboarding_completed_at,
                placement_skipped_at = excluded.placement_skipped_at,
                email_reminders = excluded.email_reminders, in_app_reminders = excluded.in_app_reminders,
                reminder_minute = excluded.reminder_minute, quiet_start_minute = excluded.quiet_start_minute,
                quiet_end_minute = excluded.quiet_end_minute, updated_at = excluded.updated_at;
            """, tx, ("id", userId), ("name", input.DisplayName.Trim()), ("timezone", input.TimeZone),
            ("revision", revision), ("goal", input.Goal), ("level", input.SelfLevel),
            ("minutes", input.MinutesPerDay), ("days", days), ("interests", interests),
            ("completed", completed), ("skipped", skipped), ("email", input.Reminders.Email),
            ("inapp", input.Reminders.InApp), ("reminder", input.Reminders.MinuteOfDay),
            ("quietStart", input.Reminders.QuietStartMinute), ("quietEnd", input.Reminders.QuietEndMinute),
            ("now", now));
        await command.ExecuteNonQueryAsync(ct);
        foreach (var (channel, before, after) in new[] {
            ("Email", current.Reminders.Email, input.Reminders.Email),
            ("InApp", current.Reminders.InApp, input.Reminders.InApp) })
        {
            if (before == after) continue;
            await using var consent = db.Query("""
                insert into learning.reminder_consent_events
                    (id,learner_id,channel,enabled,profile_revision,occurred_at)
                values (@id,@user,@channel,@enabled,@revision,@now);
                """, tx, ("id", Guid.NewGuid()), ("user", userId), ("channel", channel),
                ("enabled", after), ("revision", revision), ("now", now));
            await consent.ExecuteNonQueryAsync(ct);
        }
        await tx.CommitAsync(ct);
        return new(userId, revision, input.DisplayName.Trim(), input.TimeZone, input.Goal,
            input.SelfLevel, input.MinutesPerDay, days, interests, completed, skipped, input.Reminders);
    }

    private static async Task<LearnerProfileView> ReadAsync(DbConnection db, DbTransaction? tx,
        Guid userId, CancellationToken ct)
    {
        await using var command = db.Query("""
            select u.display_name,u.timezone,coalesce(p.revision,0),
                   coalesce(p.goal,'general'),coalesce(p.self_level,'unknown'),coalesce(p.minutes_per_day,30),
                   coalesce(p.study_days,array[1,2,3,4,5]),coalesce(p.interests,array[]::text[]),
                   p.onboarding_completed_at,p.placement_skipped_at,
                   coalesce(p.email_reminders,false),coalesce(p.in_app_reminders,false),
                   coalesce(p.reminder_minute,480),coalesce(p.quiet_start_minute,1260),
                   coalesce(p.quiet_end_minute,480)
            from identity_data.users u left join learning.learner_profiles p on p.learner_id = u.id
            where u.id = @id and u.status = 'Active' and u.email_verified_at is not null;
            """, tx, ("id", userId));
        await using var reader = await command.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct)) throw new DomainException("FORBIDDEN");
        return new(userId, reader.GetInt64(2), reader.GetString(0), reader.GetString(1),
            reader.GetString(3), reader.GetString(4), reader.GetInt32(5),
            reader.GetFieldValue<int[]>(6), reader.GetFieldValue<string[]>(7),
            reader.IsDBNull(8) ? null : reader.GetFieldValue<DateTimeOffset>(8),
            reader.IsDBNull(9) ? null : reader.GetFieldValue<DateTimeOffset>(9),
            new(reader.GetBoolean(10), reader.GetBoolean(11),
                reader.GetInt32(12), reader.GetInt32(13), reader.GetInt32(14)));
    }

    private static void Validate(SaveLearnerProfile input)
    {
        if (input.ExpectedRevision < 0 || string.IsNullOrWhiteSpace(input.DisplayName) ||
            input.DisplayName.Trim().Length is < 2 or > 100 ||
            input.Goal is not ("general" or "reading" or "vocabulary" or "grammar") ||
            input.SelfLevel is not ("unknown" or "beginner" or "intermediate" or "advanced") ||
            input.MinutesPerDay is < 5 or > 180 ||
            input.StudyDays is null || input.StudyDays.Length is < 1 or > 7 ||
            input.StudyDays.Any(day => day is < 0 or > 6) ||
            input.Interests is null || input.Interests.Length > 10 ||
            input.Interests.Any(value => string.IsNullOrWhiteSpace(value) || value.Length > 80))
            throw new DomainException("PROFILE_INVALID");
        if (string.IsNullOrWhiteSpace(input.TimeZone) ||
            !(input.TimeZone == "UTC" || TimeZoneInfo.TryConvertIanaIdToWindowsId(input.TimeZone, out _)))
            throw new DomainException("TIMEZONE_INVALID");
        if (input.Reminders is null || input.Reminders.MinuteOfDay is < 0 or > 1439 ||
            input.Reminders.QuietStartMinute is < 0 or > 1439 ||
            input.Reminders.QuietEndMinute is < 0 or > 1439 ||
            input.Reminders.QuietStartMinute == input.Reminders.QuietEndMinute)
            throw new DomainException("REMINDER_PREFERENCES_INVALID");
    }
}
