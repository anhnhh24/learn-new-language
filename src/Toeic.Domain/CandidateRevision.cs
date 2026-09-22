using System.Collections.Immutable;

namespace Toeic.Domain.Content;

// Dedicated DTO deliberately omits proposed key, derivation, option justifications and provenance.
public sealed record BlindOption(string StableId, string Text);
public sealed record BlindSolverInput(Guid RevisionId, string Stem, ImmutableArray<BlindOption> Options);
public sealed record SolverVote(Guid InvocationId, Guid RevisionId, string InputHash,
    string PolicyVersion, ModelRoute Route, string SelectedOptionId, bool Ambiguous);
public sealed record Transition(CandidateState From, CandidateState To, string ReasonCode,
    string PolicyVersion, Guid CandidateRevision, Actor Actor, DateTimeOffset At);

public sealed class CandidateRevision
{
    private readonly List<Transition> history = [];
    public Guid Id { get; } = Guid.NewGuid();
    public Guid? PreviousRevisionId { get; }
    public Part5Content Content { get; }
    public string ContentHash { get; }
    public CandidateState State { get; private set; } = CandidateState.Generated;
    public IReadOnlyList<Transition> History => history.AsReadOnly();
    public PublicationTier Tier => State switch
    {
        CandidateState.AdversarialValid or CandidateState.BetaReady => PublicationTier.AutoValidated,
        CandidateState.BetaActive => PublicationTier.BetaPractice,
        CandidateState.DataValidatedPractice => PublicationTier.DataValidatedPractice,
        CandidateState.ExpertReviewed => PublicationTier.ExpertReviewed,
        CandidateState.CalibratedMock => PublicationTier.CalibratedMock,
        _ => PublicationTier.Draft
    };

    public CandidateRevision(Part5Content content, Guid? previousRevisionId = null)
    {
        ArgumentNullException.ThrowIfNull(content);
        Content = content;
        ContentHash = global::Toeic.Domain.Content.ContentHash.Of(content);
        PreviousRevisionId = previousRevisionId;
    }

    public CandidateRevision Revise(Part5Content replacement, Actor actor)
    {
        RequireActor(actor, ActorType.Admin, ActorType.ContentOperator);
        return new(replacement, Id);
    }

    public ValidationReport ValidateStructure(Part5Blueprint blueprint, IReadOnlySet<string> existingFamilies,
        Actor actor, TimeProvider clock)
    {
        RequireActor(actor, ActorType.SystemWorker);
        RequireState(CandidateState.Generated);
        var report = Part5Validator.Validate(Content, blueprint, existingFamilies);
        Move(report.Passed ? CandidateState.StructuralValid : CandidateState.Rejected,
            report.Passed ? "STRUCTURE_PASSED" : report.Findings[0].Code, blueprint.PolicyVersion, actor, clock);
        return report;
    }

    public BlindSolverInput CreateBlindInput()
    {
        RequireState(CandidateState.StructuralValid);
        return new(Id, Content.Stem, Content.Options.Select(o => new BlindOption(o.StableId, o.Text)).ToImmutableArray());
    }

    // Worker-only contract. Provider adapters must build each independent invocation
    // from CreateBlindInput, and bind the response to that invocation, never client fields.
    public ValidationReport ValidateConsensus(SolverVote first, SolverVote second, Actor actor, TimeProvider clock)
    {
        RequireActor(actor, ActorType.SystemWorker);
        RequireState(CandidateState.StructuralValid);
        var findings = ImmutableArray.CreateBuilder<Finding>();
        var expectedHash = global::Toeic.Domain.Content.ContentHash.Of(CreateBlindInput());
        var policy = Content.Provenance.PolicyVersion;
        foreach (var vote in new[] { first, second })
        {
            if (vote is null || vote.InvocationId == Guid.Empty || vote.RevisionId != Id ||
                vote.InputHash != expectedHash || vote.PolicyVersion != policy || !Part5Validator.ValidRoute(vote.Route))
                findings.Add(new("SOLVER_RUN_INVALID", "votes"));
            else if (vote.Ambiguous || vote.SelectedOptionId != Content.ProposedKey)
                findings.Add(new("SOLVER_DISAGREEMENT", "votes.selectedOptionId"));
        }
        if (first is not null && second is not null && first.InvocationId == second.InvocationId)
            findings.Add(new("SOLVER_NOT_INDEPENDENT", "votes.invocationId"));
        var report = new ValidationReport(findings.ToImmutable());
        Move(report.Passed ? CandidateState.CrossModelValid : CandidateState.Rejected,
            report.Passed ? "CONSENSUS_PASSED" : report.Findings[0].Code, policy, actor, clock);
        return report;
    }

    public void Quarantine(string reason, Actor actor, TimeProvider clock)
    {
        RequireActor(actor, ActorType.Admin, ActorType.SystemWorker);
        if (State is CandidateState.Rejected or CandidateState.Archived or CandidateState.Quarantined)
            throw new DomainException("TERMINAL_STATE");
        Move(CandidateState.Quarantined, reason, Content.Provenance.PolicyVersion, actor, clock);
    }

    public void Archive(string reason, Actor actor, TimeProvider clock)
    {
        RequireActor(actor, ActorType.Admin);
        if (State == CandidateState.Archived) throw new DomainException("TERMINAL_STATE");
        Move(CandidateState.Archived, reason, Content.Provenance.PolicyVersion, actor, clock);
    }

    private void Move(CandidateState next, string reason, string policy, Actor actor, TimeProvider clock)
    {
        if (string.IsNullOrWhiteSpace(reason) || string.IsNullOrWhiteSpace(policy))
            throw new DomainException("AUDIT_METADATA_REQUIRED");
        history.Add(new(State, next, reason, policy, Id, actor, clock.GetUtcNow()));
        State = next;
    }

    private void RequireState(CandidateState expected)
    {
        if (State != expected) throw new DomainException("INVALID_TRANSITION");
    }

    private static void RequireActor(Actor actor, params ActorType[] allowed)
    {
        if (actor is null || string.IsNullOrWhiteSpace(actor.Id) || !allowed.Contains(actor.Type))
            throw new DomainException("FORBIDDEN");
    }
}
