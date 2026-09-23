using System.Collections.Immutable;

namespace Toeic.Domain.Content;

public sealed record CriticResult(Guid InvocationId, Guid RevisionId, string InputHash,
    string PolicyVersion, ModelRoute Route, bool FoundSecondAnswer,
    ImmutableArray<Finding> BlockingFindings);

public sealed record PerturbationResult(Guid RunId, Guid RevisionId, string InputHash,
    string PolicyVersion, string SemanticKey, bool OptionPermutationStable,
    bool NeutralMutationStable);

public sealed record SimilarityResult(Guid RunId, Guid RevisionId, string InputHash,
    string PolicyVersion, bool FamilyCollision, decimal HighestSimilarity);

public sealed record RightsResult(Guid RunId, Guid RevisionId, string InputHash,
    string PolicyVersion, bool Passed, string RightsReference);

public sealed record AutomatedQualityEvidence(
    CriticResult Critic,
    PerturbationResult Perturbation,
    SimilarityResult Similarity,
    RightsResult Rights,
    ModelRoute SolverARoute,
    ModelRoute SolverBRoute);

public static class AutomatedQualityGate
{
    public static ValidationReport Evaluate(CandidateRevision candidate,
        AutomatedQualityEvidence evidence)
    {
        ArgumentNullException.ThrowIfNull(candidate);
        ArgumentNullException.ThrowIfNull(evidence);
        var findings = ImmutableArray.CreateBuilder<Finding>();
        var revision = candidate.Id;
        var inputHash = candidate.ContentHash;
        var policy = candidate.Content.Provenance.PolicyVersion;

        if (evidence.Critic is null || evidence.Critic.InvocationId == Guid.Empty ||
            evidence.Critic.RevisionId != revision || evidence.Critic.InputHash != inputHash ||
            evidence.Critic.PolicyVersion != policy || !Part5Validator.ValidRoute(evidence.Critic.Route))
            findings.Add(new("CRITIC_RUN_INVALID", "critic"));
        else
        {
            if (evidence.Critic.FoundSecondAnswer)
                findings.Add(new("AMBIGUOUS_SECOND_ANSWER", "critic"));
            if (!evidence.Critic.BlockingFindings.IsDefaultOrEmpty)
                findings.AddRange(evidence.Critic.BlockingFindings);
        }

        if (!RunMatches(evidence.Perturbation?.RunId ?? Guid.Empty,
                evidence.Perturbation?.RevisionId ?? Guid.Empty,
                evidence.Perturbation?.InputHash, evidence.Perturbation?.PolicyVersion,
                revision, inputHash, policy))
            findings.Add(new("PERTURBATION_RUN_INVALID", "perturbation"));
        else if (evidence.Perturbation!.SemanticKey != candidate.Content.ProposedKey ||
                 !evidence.Perturbation.OptionPermutationStable ||
                 !evidence.Perturbation.NeutralMutationStable)
            findings.Add(new("PERTURBATION_KEY_CHANGED", "perturbation"));

        if (!RunMatches(evidence.Similarity?.RunId ?? Guid.Empty,
                evidence.Similarity?.RevisionId ?? Guid.Empty,
                evidence.Similarity?.InputHash, evidence.Similarity?.PolicyVersion,
                revision, inputHash, policy) ||
            evidence.Similarity!.HighestSimilarity is < 0 or > 1)
            findings.Add(new("SIMILARITY_RUN_INVALID", "similarity"));
        else if (evidence.Similarity.FamilyCollision)
            findings.Add(new("FAMILY_COLLISION", "similarity"));

        if (!RunMatches(evidence.Rights?.RunId ?? Guid.Empty,
                evidence.Rights?.RevisionId ?? Guid.Empty,
                evidence.Rights?.InputHash, evidence.Rights?.PolicyVersion,
                revision, inputHash, policy))
            findings.Add(new("RIGHTS_RUN_INVALID", "rights"));
        else if (!evidence.Rights!.Passed || string.IsNullOrWhiteSpace(evidence.Rights.RightsReference))
            findings.Add(new("RIGHTS_NOT_VERIFIED", "rights"));

        if (!PublicationPolicy.HasPublicBetaRouteDiversity(candidate.Content.Provenance.Generator,
                evidence.SolverARoute, evidence.SolverBRoute))
            findings.Add(new("MODEL_ROUTE_DIVERSITY_REQUIRED", "solverRoutes"));

        return new(findings.ToImmutable());
    }

    private static bool RunMatches(Guid runId, Guid revisionId, string? runInputHash,
        string? runPolicy, Guid expectedRevision, string expectedHash, string expectedPolicy) =>
        runId != Guid.Empty && revisionId == expectedRevision && runInputHash == expectedHash &&
        runPolicy == expectedPolicy;
}
