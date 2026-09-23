using System.Security.Cryptography;
using System.Text;

namespace Toeic.Domain.Identity;

using Toeic.Domain.Content;

public enum UserStatus { PendingVerification, Active, Suspended, DeletionPending, Deleted }
public enum AssessmentKnowledge { Unknown, Measured }

public sealed record ConsentRecord(string Type, string Version, DateTimeOffset AcceptedAt);

public sealed class UserAccount
{
    private readonly List<ConsentRecord> consents = [];

    public Guid Id { get; }
    public string EmailNormalized { get; private set; }
    public string PasswordHash { get; private set; }
    public string DisplayName { get; private set; }
    public string TimeZoneId { get; private set; }
    public UserStatus Status { get; private set; } = UserStatus.PendingVerification;
    public DateTimeOffset? EmailVerifiedAt { get; private set; }
    public IReadOnlyList<ConsentRecord> Consents => consents.AsReadOnly();

    public UserAccount(Guid id, string email, string passwordHash, string displayName,
        string timeZoneId, ConsentRecord termsConsent)
    {
        if (id == Guid.Empty || string.IsNullOrWhiteSpace(passwordHash))
            throw new DomainException("USER_INVALID");
        ValidateDisplayName(displayName);
        ValidateTimeZone(timeZoneId);
        if (termsConsent.Type != "terms" || string.IsNullOrWhiteSpace(termsConsent.Version))
            throw new DomainException("TERMS_CONSENT_REQUIRED");

        Id = id;
        EmailNormalized = NormalizeEmail(email);
        PasswordHash = passwordHash;
        DisplayName = displayName.Trim();
        TimeZoneId = timeZoneId;
        consents.Add(termsConsent);
    }

    public void VerifyEmail(DateTimeOffset verifiedAt)
    {
        if (Status == UserStatus.Deleted) throw new DomainException("USER_DELETED");
        EmailVerifiedAt ??= verifiedAt;
        Status = UserStatus.Active;
    }

    public void UpdateProfile(string displayName, string timeZoneId)
    {
        if (Status != UserStatus.Active) throw new DomainException("USER_NOT_ACTIVE");
        ValidateDisplayName(displayName);
        ValidateTimeZone(timeZoneId);
        DisplayName = displayName.Trim();
        TimeZoneId = timeZoneId;
    }

    public void ChangePasswordHash(string newPasswordHash)
    {
        if (Status is UserStatus.Deleted or UserStatus.DeletionPending)
            throw new DomainException("USER_NOT_ACTIVE");
        if (string.IsNullOrWhiteSpace(newPasswordHash)) throw new DomainException("PASSWORD_HASH_REQUIRED");
        PasswordHash = newPasswordHash;
    }

    public void Suspend(string reason, Actor actor)
    {
        RequireAdmin(actor);
        if (string.IsNullOrWhiteSpace(reason)) throw new DomainException("SUSPENSION_REASON_REQUIRED");
        Status = UserStatus.Suspended;
    }

    public void RequestDeletion() => Status = UserStatus.DeletionPending;

    private static string NormalizeEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email) || email.Length > 320 || !email.Contains('@'))
            throw new DomainException("EMAIL_INVALID");
        return email.Trim().Normalize(NormalizationForm.FormKC).ToUpperInvariant();
    }

    private static void ValidateDisplayName(string value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Trim().Length is < 2 or > 100)
            throw new DomainException("DISPLAY_NAME_INVALID");
    }

    private static void ValidateTimeZone(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new DomainException("TIMEZONE_INVALID");
        try { _ = TimeZoneInfo.FindSystemTimeZoneById(value); }
        catch (TimeZoneNotFoundException) { throw new DomainException("TIMEZONE_INVALID"); }
        catch (InvalidTimeZoneException) { throw new DomainException("TIMEZONE_INVALID"); }
    }

    private static void RequireAdmin(Actor actor)
    {
        if (actor is null || actor.Type != ActorType.Admin || string.IsNullOrWhiteSpace(actor.Id))
            throw new DomainException("FORBIDDEN");
    }
}

public sealed class OneTimeToken
{
    public Guid Id { get; }
    public Guid UserId { get; }
    public string Purpose { get; }
    public string TokenHash { get; }
    public DateTimeOffset ExpiresAt { get; }
    public DateTimeOffset? UsedAt { get; private set; }

    public OneTimeToken(Guid id, Guid userId, string purpose, string rawToken,
        DateTimeOffset expiresAt)
    {
        if (id == Guid.Empty || userId == Guid.Empty || string.IsNullOrWhiteSpace(purpose) ||
            string.IsNullOrWhiteSpace(rawToken))
            throw new DomainException("TOKEN_INVALID");
        Id = id;
        UserId = userId;
        Purpose = purpose.Trim();
        TokenHash = Hash(rawToken);
        ExpiresAt = expiresAt;
    }

    public void Consume(string rawToken, string expectedPurpose, DateTimeOffset now)
    {
        if (UsedAt is not null) throw new DomainException("TOKEN_ALREADY_USED");
        if (now >= ExpiresAt) throw new DomainException("TOKEN_EXPIRED");
        if (Purpose != expectedPurpose || !FixedEquals(TokenHash, Hash(rawToken)))
            throw new DomainException("TOKEN_INVALID");
        UsedAt = now;
    }

    private static string Hash(string value) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));

    private static bool FixedEquals(string left, string right) => CryptographicOperations.FixedTimeEquals(
        Encoding.UTF8.GetBytes(left), Encoding.UTF8.GetBytes(right));
}

public sealed class UserSession
{
    public Guid Id { get; }
    public Guid UserId { get; }
    public string RefreshTokenHash { get; }
    public DateTimeOffset ExpiresAt { get; }
    public DateTimeOffset? RevokedAt { get; private set; }

    public UserSession(Guid id, Guid userId, string refreshTokenHash, DateTimeOffset expiresAt)
    {
        if (id == Guid.Empty || userId == Guid.Empty || string.IsNullOrWhiteSpace(refreshTokenHash))
            throw new DomainException("SESSION_INVALID");
        Id = id;
        UserId = userId;
        RefreshTokenHash = refreshTokenHash;
        ExpiresAt = expiresAt;
    }

    public bool IsActive(DateTimeOffset now) => RevokedAt is null && now < ExpiresAt;
    public void Revoke(DateTimeOffset now) => RevokedAt ??= now;
}

public sealed class LearningProfile
{
    private readonly HashSet<DayOfWeek> studyDays = [];
    public Guid UserId { get; }
    public string Goal { get; private set; } = "general";
    public string SelfLevel { get; private set; } = "unknown";
    public AssessmentKnowledge AssessmentStatus { get; private set; } = AssessmentKnowledge.Unknown;
    public int MinutesPerDay { get; private set; } = 15;
    public IReadOnlySet<DayOfWeek> StudyDays => studyDays;

    public LearningProfile(Guid userId)
    {
        if (userId == Guid.Empty) throw new DomainException("PROFILE_USER_REQUIRED");
        UserId = userId;
    }

    public void UpdateOnboarding(string goal, string selfLevel, int minutesPerDay,
        IEnumerable<DayOfWeek> days)
    {
        if (string.IsNullOrWhiteSpace(goal) || string.IsNullOrWhiteSpace(selfLevel) ||
            minutesPerDay is < 5 or > 180)
            throw new DomainException("ONBOARDING_INVALID");
        var requestedDays = days?.ToHashSet() ?? [];
        if (requestedDays.Count == 0) throw new DomainException("STUDY_DAYS_REQUIRED");

        Goal = goal.Trim();
        SelfLevel = selfLevel.Trim();
        MinutesPerDay = minutesPerDay;
        studyDays.Clear();
        studyDays.UnionWith(requestedDays);
    }

    public void RecordAssessment() => AssessmentStatus = AssessmentKnowledge.Measured;
}

public sealed record AuthorizationSubject(string UserId, IReadOnlySet<string> Permissions,
    bool MfaSatisfied)
{
    public void Require(string permission, bool requireMfa = false)
    {
        if (!Permissions.Contains(permission) || (requireMfa && !MfaSatisfied))
            throw new DomainException("FORBIDDEN");
    }
}

public interface IPasswordService
{
    string Hash(string password);
    bool Verify(string passwordHash, string password);
}

public interface ITransactionalEmailSender
{
    Task SendVerificationAsync(string email, string rawToken, CancellationToken cancellationToken);
    Task SendPasswordResetAsync(string email, string rawToken, CancellationToken cancellationToken);
}
