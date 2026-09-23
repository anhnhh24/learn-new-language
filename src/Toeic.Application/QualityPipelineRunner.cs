using Toeic.Domain.Content;

namespace Toeic.Application;

public sealed record CriticRequest(Guid RevisionId, string ContentHash, string PolicyVersion,
    BlindSolverInput BlindContent);
public sealed record PerturbationRequest(Guid RevisionId, string ContentHash, string PolicyVersion,
    BlindSolverInput BlindContent, string ExpectedSemanticKey);
public sealed record SimilarityRequest(Guid RevisionId, string ContentHash, string PolicyVersion,
    string FamilyId, string Stem, IReadOnlyList<string> OptionTexts);
public sealed record RightsRequest(Guid RevisionId, string ContentHash, string PolicyVersion,
    Provenance Provenance);

public interface IIndependentSolver
{
    Task<SolverVote> SolveAsync(BlindSolverInput input, string policyVersion,
        CancellationToken cancellationToken);
}

public interface IAdversarialCritic
{
    Task<CriticResult> ReviewAsync(CriticRequest request, CancellationToken cancellationToken);
}

public interface IPerturbationRunner
{
    Task<PerturbationResult> RunAsync(PerturbationRequest request,
        CancellationToken cancellationToken);
}

public interface ISimilarityValidator
{
    Task<SimilarityResult> ValidateAsync(SimilarityRequest request,
        CancellationToken cancellationToken);
}

public interface IRightsValidator
{
    Task<RightsResult> ValidateAsync(RightsRequest request, CancellationToken cancellationToken);
}

public sealed record QualityPipelineResult(CandidateState State, ValidationReport Report);

public sealed class QualityPipelineRunner(
    IIndependentSolver solverA,
    IIndependentSolver solverB,
    IAdversarialCritic critic,
    IPerturbationRunner perturbation,
    ISimilarityValidator similarity,
    IRightsValidator rights,
    TimeProvider clock)
{
    private static readonly Actor Worker = new(ActorType.SystemWorker, "quality-pipeline");

    public async Task<QualityPipelineResult> RunAsync(CandidateRevision candidate,
        bool automatedBetaEnabled, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(candidate);
        var blind = candidate.CreateBlindInput();
        var policy = candidate.Content.Provenance.PolicyVersion;
        var solverATask = solverA.SolveAsync(blind, policy, cancellationToken);
        var solverBTask = solverB.SolveAsync(blind, policy, cancellationToken);
        await Task.WhenAll(solverATask, solverBTask);
        var voteA = await solverATask;
        var voteB = await solverBTask;
        var consensus = candidate.ValidateConsensus(voteA, voteB, Worker, clock);
        if (!consensus.Passed) return new(candidate.State, consensus);

        var criticTask = critic.ReviewAsync(
            new(candidate.Id, candidate.ContentHash, policy, blind), cancellationToken);
        var perturbationTask = perturbation.RunAsync(
            new(candidate.Id, candidate.ContentHash, policy, blind, candidate.Content.ProposedKey),
            cancellationToken);
        var similarityTask = similarity.ValidateAsync(
            new(candidate.Id, candidate.ContentHash, policy, candidate.Content.FamilyId,
                candidate.Content.Stem, candidate.Content.Options.Select(option => option.Text).ToArray()),
            cancellationToken);
        var rightsTask = rights.ValidateAsync(
            new(candidate.Id, candidate.ContentHash, policy, candidate.Content.Provenance),
            cancellationToken);
        await Task.WhenAll(criticTask, perturbationTask, similarityTask, rightsTask);

        var evidence = new AutomatedQualityEvidence(await criticTask, await perturbationTask,
            await similarityTask, await rightsTask, voteA.Route, voteB.Route);
        var quality = candidate.ValidateAutomatedQuality(evidence, Worker, clock);
        if (quality.Passed && automatedBetaEnabled) candidate.MarkBetaReady(true, Worker, clock);
        return new(candidate.State, quality);
    }
}
