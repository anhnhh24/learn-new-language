using System.Collections.Immutable;
using System.Security.Cryptography;
using System.Text;

namespace Toeic.Domain.Assessment;

using Toeic.Domain.Content;

public enum AttemptMode { Drill, Practice, Mock }
public enum AttemptStatus { Active, Submitted, Graded, Expired }
public enum GradingStatus { NotQueued, Queued, Completed, Failed }

public sealed record AttemptOption(string StableId, string Text);

public sealed class AttemptItemSnapshot
{
    private readonly ImmutableHashSet<string> correctOptionIds;

    public Guid QuestionRevisionId { get; }
    public Guid QuestionFamilyId { get; }
    public string Section { get; }
    public string? Stimulus { get; }
    public string Prompt { get; }
    public ImmutableArray<AttemptOption> Options { get; }
    public decimal MaxScore { get; }
    internal ImmutableHashSet<string> CorrectOptionIds => correctOptionIds;

    public AttemptItemSnapshot(Guid questionRevisionId, Guid questionFamilyId, string section,
        string prompt, ImmutableArray<AttemptOption> options, IEnumerable<string> correctOptionIds,
        decimal maxScore, string? stimulus = null)
    {
        if (questionRevisionId == Guid.Empty || questionFamilyId == Guid.Empty)
            throw new DomainException("QUESTION_SNAPSHOT_ID_REQUIRED");
        if (string.IsNullOrWhiteSpace(section) || string.IsNullOrWhiteSpace(prompt))
            throw new DomainException("QUESTION_SNAPSHOT_CONTENT_REQUIRED");
        if (options.IsDefaultOrEmpty || options.Any(option => string.IsNullOrWhiteSpace(option.StableId)))
            throw new DomainException("QUESTION_SNAPSHOT_OPTIONS_INVALID");
        if (stimulus?.Length > 6000)
            throw new DomainException("QUESTION_SNAPSHOT_STIMULUS_INVALID");

        var optionIds = options.Select(option => option.StableId).ToImmutableHashSet(StringComparer.Ordinal);
        var keys = correctOptionIds?.ToImmutableHashSet(StringComparer.Ordinal) ?? [];
        if (keys.IsEmpty || !keys.IsSubsetOf(optionIds) || maxScore <= 0)
            throw new DomainException("QUESTION_SNAPSHOT_KEY_INVALID");

        QuestionRevisionId = questionRevisionId;
        QuestionFamilyId = questionFamilyId;
        Section = section.Trim();
        Stimulus = string.IsNullOrWhiteSpace(stimulus) ? null : stimulus;
        Prompt = prompt;
        Options = options;
        this.correctOptionIds = keys;
        MaxScore = maxScore;
    }

    internal decimal Score(ImmutableHashSet<string> selectedOptionIds) =>
        selectedOptionIds.SetEquals(correctOptionIds) ? MaxScore : 0;
}

public sealed record SavedResponse(Guid QuestionRevisionId, ImmutableHashSet<string> SelectedOptionIds,
    long Revision, Guid ClientOperationId, DateTimeOffset SavedAt);
public sealed record ResponseSaveReceipt(long Revision, DateTimeOffset SavedAt, DateTimeOffset ServerTime,
    bool Replayed);
public sealed record SubmissionReceipt(Guid ReceiptId, Guid AttemptId, DateTimeOffset SubmittedAt,
    GradingStatus GradingStatus);
public sealed record GradeVersion(Guid Id, int Version, decimal RawScore, decimal MaxScore,
    int AnsweredCount, DateTimeOffset GradedAt, string PolicyVersion);
internal sealed record OperationReplay(string RequestHash, ResponseSaveReceipt Receipt);

public sealed class Attempt
{
    private readonly Dictionary<Guid, AttemptItemSnapshot> items;
    private readonly Dictionary<Guid, SavedResponse> responses = [];
    private readonly Dictionary<Guid, OperationReplay> operationReceipts = [];
    private string? leaseTokenHash;
    private DateTimeOffset? leaseExpiresAt;
    private string? submitIdempotencyKey;
    private string? submitInputHash;

    public Guid Id { get; }
    public string LearnerId { get; }
    public Guid AssessmentVersionId { get; }
    public string ExamProfileVersion { get; }
    public AttemptMode Mode { get; }
    public AttemptStatus Status { get; private set; } = AttemptStatus.Active;
    public long Revision { get; private set; }
    public DateTimeOffset StartedAt { get; }
    public DateTimeOffset Deadline { get; }
    public SubmissionReceipt? Submission { get; private set; }
    public GradeVersion? Grade { get; private set; }
    public IReadOnlyCollection<AttemptItemSnapshot> Items => items.Values;
    public IReadOnlyCollection<SavedResponse> Responses => responses.Values;

    public Attempt(Guid id, string learnerId, Guid assessmentVersionId, string examProfileVersion,
        AttemptMode mode, IEnumerable<AttemptItemSnapshot> itemSnapshots, DateTimeOffset startedAt,
        DateTimeOffset deadline)
    {
        if (id == Guid.Empty || assessmentVersionId == Guid.Empty || string.IsNullOrWhiteSpace(learnerId) ||
            string.IsNullOrWhiteSpace(examProfileVersion))
            throw new DomainException("ATTEMPT_IDENTITY_INVALID");
        if (deadline <= startedAt) throw new DomainException("ATTEMPT_DEADLINE_INVALID");

        var snapshots = itemSnapshots?.ToArray() ?? [];
        if (snapshots.Length == 0 || snapshots.Select(item => item.QuestionRevisionId).Distinct().Count() != snapshots.Length)
            throw new DomainException("ATTEMPT_SNAPSHOT_INVALID");

        Id = id;
        LearnerId = learnerId.Trim();
        AssessmentVersionId = assessmentVersionId;
        ExamProfileVersion = examProfileVersion.Trim();
        Mode = mode;
        StartedAt = startedAt;
        Deadline = deadline;
        items = snapshots.ToDictionary(item => item.QuestionRevisionId);
    }

    internal string? LeaseTokenHash => leaseTokenHash;
    internal DateTimeOffset? LeaseExpiresAt => leaseExpiresAt;
    internal void RestoreActive(long revision, IEnumerable<SavedResponse> saved, string? tokenHash, DateTimeOffset? expiresAt)
    {
        if (revision < 0) throw new DomainException("ATTEMPT_REVISION_INVALID");
        Revision = revision;
        foreach (var response in saved)
        {
            if (!items.ContainsKey(response.QuestionRevisionId)) throw new DomainException("ATTEMPT_SNAPSHOT_INVALID");
            responses.Add(response.QuestionRevisionId, response);
        }
        leaseTokenHash = tokenHash;
        leaseExpiresAt = expiresAt;
    }
    public string AcquireLease(string learnerId, string rawLeaseToken, DateTimeOffset receivedAt,
        bool allowTakeover)
    {
        RequireOwner(learnerId);
        RequireActive(receivedAt);
        if (string.IsNullOrWhiteSpace(rawLeaseToken) || rawLeaseToken.Length < 32)
            throw new DomainException("LEASE_TOKEN_INVALID");
        if (leaseExpiresAt > receivedAt && !allowTakeover && !MatchesLease(rawLeaseToken))
            throw new DomainException("DEVICE_LEASE_CONFLICT");

        leaseTokenHash = Hash(rawLeaseToken);
        leaseExpiresAt = receivedAt.AddSeconds(60);
        return rawLeaseToken;
    }

    public void RenewLease(string learnerId, string rawLeaseToken, DateTimeOffset receivedAt)
    {
        RequireOwner(learnerId);
        RequireActive(receivedAt);
        RequireLease(rawLeaseToken, receivedAt);
        leaseExpiresAt = receivedAt.AddSeconds(60);
    }

    public ResponseSaveReceipt SaveResponse(string learnerId, Guid questionRevisionId,
        IEnumerable<string> selectedOptionIds, long expectedRevision, Guid clientOperationId,
        string rawLeaseToken, DateTimeOffset receivedAt)
    {
        RequireOwner(learnerId);
        RequireActive(receivedAt);
        RequireLease(rawLeaseToken, receivedAt);
        if (clientOperationId == Guid.Empty) throw new DomainException("CLIENT_OPERATION_ID_REQUIRED");
        if (!items.TryGetValue(questionRevisionId, out var item)) throw new DomainException("ATTEMPT_ITEM_NOT_FOUND");

        var answer = selectedOptionIds?.ToImmutableHashSet(StringComparer.Ordinal) ?? [];
        var optionIds = item.Options.Select(option => option.StableId).ToImmutableHashSet(StringComparer.Ordinal);
        var requestHash = ContentHash.Of(new
        {
            questionRevisionId,
            Options = answer.Order(StringComparer.Ordinal),
            expectedRevision
        });
        if (operationReceipts.TryGetValue(clientOperationId, out var replay))
        {
            if (replay.RequestHash != requestHash) throw new DomainException("IDEMPOTENCY_CONFLICT");
            return replay.Receipt with { Replayed = true };
        }
        if (expectedRevision != Revision) throw new DomainException("RESPONSE_CONFLICT");
        if (!answer.IsSubsetOf(optionIds)) throw new DomainException("ANSWER_OPTION_INVALID");

        Revision++;
        var saved = new SavedResponse(questionRevisionId, answer, Revision, clientOperationId, receivedAt);
        responses[questionRevisionId] = saved;
        var receipt = new ResponseSaveReceipt(Revision, receivedAt, receivedAt, false);
        operationReceipts[clientOperationId] = new(requestHash, receipt);
        return receipt;
    }

    public SubmissionReceipt Submit(string learnerId, long expectedRevision, string idempotencyKey,
        DateTimeOffset receivedAt)
    {
        RequireOwner(learnerId);
        ValidateIdempotencyKey(idempotencyKey);
        var requestHash = ContentHash.Of(new { expectedRevision });
        if (Submission is not null)
        {
            if (submitIdempotencyKey == idempotencyKey && submitInputHash == requestHash) return Submission;
            if (submitIdempotencyKey == idempotencyKey) throw new DomainException("IDEMPOTENCY_CONFLICT");
            throw new DomainException("ATTEMPT_ALREADY_SUBMITTED");
        }

        if (Status != AttemptStatus.Active) throw new DomainException("ATTEMPT_NOT_ACTIVE");
        if (receivedAt >= Deadline) throw new DomainException("ATTEMPT_DEADLINE_REACHED");
        if (expectedRevision != Revision) throw new DomainException("ATTEMPT_REVISION_CONFLICT");

        Revision++;
        Status = AttemptStatus.Submitted;
        submitIdempotencyKey = idempotencyKey;
        submitInputHash = requestHash;
        Submission = new(Guid.NewGuid(), Id, receivedAt, GradingStatus.Queued);
        return Submission;
    }
    public SubmissionReceipt ExpireAndSubmit(DateTimeOffset receivedAt)
    {
        if (Submission is not null) return Submission;
        if (Status != AttemptStatus.Active || receivedAt < Deadline)
            throw new DomainException("ATTEMPT_NOT_EXPIRED");

        Revision++;
        Status = AttemptStatus.Submitted;
        submitIdempotencyKey = $"deadline:{Id}";
        Submission = new(Guid.NewGuid(), Id, Deadline, GradingStatus.Queued);
        return Submission;
    }

    public GradeVersion GradeObjective(string policyVersion, DateTimeOffset gradedAt)
    {
        if (Status == AttemptStatus.Graded && Grade is not null) return Grade;
        if (Status != AttemptStatus.Submitted || Submission is null)
            throw new DomainException("ATTEMPT_NOT_SUBMITTED");
        if (string.IsNullOrWhiteSpace(policyVersion)) throw new DomainException("GRADE_POLICY_REQUIRED");

        var raw = responses.Sum(pair => items[pair.Key].Score(pair.Value.SelectedOptionIds));
        var maximum = items.Values.Sum(item => item.MaxScore);
        Grade = new(Guid.NewGuid(), (Grade?.Version ?? 0) + 1, raw, maximum, responses.Count,
            gradedAt, policyVersion.Trim());
        Status = AttemptStatus.Graded;
        Submission = Submission with { GradingStatus = GradingStatus.Completed };
        return Grade;
    }

    private void RequireOwner(string learnerId)
    {
        if (!string.Equals(LearnerId, learnerId?.Trim(), StringComparison.Ordinal))
            throw new DomainException("ATTEMPT_NOT_FOUND");
    }

    private void RequireActive(DateTimeOffset receivedAt)
    {
        if (Status != AttemptStatus.Active) throw new DomainException("ATTEMPT_NOT_ACTIVE");
        if (receivedAt >= Deadline) throw new DomainException("ATTEMPT_DEADLINE_REACHED");
    }

    private void RequireLease(string rawLeaseToken, DateTimeOffset receivedAt)
    {
        if (leaseExpiresAt <= receivedAt || !MatchesLease(rawLeaseToken))
            throw new DomainException("DEVICE_LEASE_INVALID");
    }

    private bool MatchesLease(string rawLeaseToken)
    {
        if (leaseTokenHash is null || string.IsNullOrEmpty(rawLeaseToken)) return false;
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(leaseTokenHash), Encoding.UTF8.GetBytes(Hash(rawLeaseToken)));
    }

    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));

    private static void ValidateIdempotencyKey(string value)
    {
        if (!Guid.TryParse(value, out _)) throw new DomainException("IDEMPOTENCY_KEY_INVALID");
    }
}
