using System.Collections.Immutable;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Toeic.Domain.Content;

public enum CandidateState
{
    Generated, StructuralValid, CrossModelValid, AdversarialValid,
    BetaReady, BetaActive, DataValidatedPractice, ExpertReviewed,
    CalibratedMock, Rejected, Quarantined, Archived
}

public enum PublicationTier { Draft, AutoValidated, BetaPractice, DataValidatedPractice, ExpertReviewed, CalibratedMock }
public enum ActorType { Admin, ContentOperator, SystemWorker, Learner }
public sealed record Actor(ActorType Type, string Id);
public sealed record Option(string StableId, string Text, string Justification);
public sealed record ModelRoute(string Provider, string Family, string Model, string PromptVersion);
public sealed record Provenance(string ContributorId, string BlueprintVersion, string PolicyVersion,
    string RightsReference, ModelRoute Generator);

// ImmutableArray prevents caller-owned lists changing after validation.
// This is an untrusted candidate DTO; only validation can advance its lifecycle.
public sealed record Part5Content(string Stem, ImmutableArray<Option> Options, string ProposedKey,
    string RuleId, string AnswerDerivation, string FamilyId, Provenance Provenance);

public sealed record Part5Blueprint(string Version, string PolicyVersion, string ExamProfile,
    ImmutableHashSet<string> AllowedRuleIds, int MaxCandidates = 10, int MaxStemLength = 500,
    int MaxOptionLength = 120);

public sealed record Finding(string Code, string Path);
public sealed record ValidationReport(ImmutableArray<Finding> Findings)
{
    public bool Passed => Findings.IsEmpty;
}

public static class ContentHash
{
    public static string Of<T>(T value) => Convert.ToHexString(
        SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(value))));
}

public sealed class DomainException(string code) : InvalidOperationException(code)
{
    public string Code { get; } = code;
}
