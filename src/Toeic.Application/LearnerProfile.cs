namespace Toeic.Application;

public sealed record ReminderPreferences(bool Email, bool InApp,
    int MinuteOfDay, int QuietStartMinute, int QuietEndMinute);

public sealed record LearnerProfileView(Guid UserId, long Revision, string DisplayName,
    string TimeZone, string Goal, string SelfLevel, int MinutesPerDay,
    int[] StudyDays, string[] Interests, DateTimeOffset? OnboardingCompletedAt,
    DateTimeOffset? PlacementSkippedAt, ReminderPreferences Reminders);

public sealed record SaveLearnerProfile(long ExpectedRevision, string DisplayName,
    string TimeZone, string Goal, string SelfLevel, int MinutesPerDay,
    int[] StudyDays, string[] Interests, bool CompleteOnboarding,
    bool SkipPlacement, ReminderPreferences Reminders);

public interface ILearnerProfile
{
    Task<LearnerProfileView> GetAsync(Guid userId, CancellationToken ct);
    Task<LearnerProfileView> SaveAsync(Guid userId, SaveLearnerProfile request, CancellationToken ct);
}
