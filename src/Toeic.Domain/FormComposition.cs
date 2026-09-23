using System.Collections.Immutable;

namespace Toeic.Domain.Assessment;

using Toeic.Domain.Content;

public enum FormState { Draft, Active, Degraded, Archived }

public sealed record FormRequirement(ToeicPart Part, int QuestionCount);

public sealed record FormItemCandidate(Guid RevisionId, string FamilyId, ToeicPart Part,
    PublicationTier Tier, CandidateState State, int QuestionCount, int PriorExposureCount,
    string RightsReference, string PolicyVersion);

public sealed record FormItemSnapshot(Guid RevisionId, string FamilyId, ToeicPart Part,
    PublicationTier Tier, int QuestionCount, int Position);

public sealed record FormTransition(FormState From, FormState To, string ReasonCode,
    Guid? ItemRevisionId, string ActorId, DateTimeOffset At);

public sealed class BetaFormVersion
{
    private readonly List<FormTransition> history = [];

    public Guid Id { get; }
    public string Version { get; }
    public string PolicyVersion { get; }
    public PublicationTier Tier { get; }
    public ImmutableArray<FormItemSnapshot> Items { get; }
    public string SnapshotHash { get; }
    public FormState State { get; private set; } = FormState.Draft;
    public IReadOnlyList<FormTransition> History => history.AsReadOnly();

    internal BetaFormVersion(Guid id, string version, string policyVersion,
        PublicationTier tier, ImmutableArray<FormItemSnapshot> items)
    {
        Id = id;
        Version = version;
        PolicyVersion = policyVersion;
        Tier = tier;
        Items = items;
        SnapshotHash = ContentHash.Of(new { version, policyVersion, tier, items });
    }

    public void Activate(Actor actor, TimeProvider clock)
    {
        RequireWorker(actor);
        RequireState(FormState.Draft);
        Move(FormState.Active, "FORM_GATE_PASSED", null, actor, clock);
    }

    public void DegradeForQuarantinedItem(Guid itemRevisionId, string reason,
        Actor actor, TimeProvider clock)
    {
        RequireWorker(actor);
        RequireState(FormState.Active);
        if (itemRevisionId == Guid.Empty || !Items.Any(item => item.RevisionId == itemRevisionId))
            throw new DomainException("FORM_ITEM_NOT_FOUND");
        Move(FormState.Degraded, reason, itemRevisionId, actor, clock);
    }

    public void Archive(string reason, Actor actor, TimeProvider clock)
    {
        if (actor is null || actor.Type != ActorType.Admin || string.IsNullOrWhiteSpace(actor.Id))
            throw new DomainException("FORBIDDEN");
        if (State == FormState.Archived) throw new DomainException("TERMINAL_STATE");
        Move(FormState.Archived, reason, null, actor, clock);
    }

    private void Move(FormState next, string reason, Guid? itemRevisionId,
        Actor actor, TimeProvider clock)
    {
        if (string.IsNullOrWhiteSpace(reason)) throw new DomainException("AUDIT_METADATA_REQUIRED");
        history.Add(new(State, next, reason.Trim(), itemRevisionId, actor.Id, clock.GetUtcNow()));
        State = next;
    }

    private void RequireState(FormState expected)
    {
        if (State != expected) throw new DomainException("INVALID_TRANSITION");
    }

    private static void RequireWorker(Actor actor)
    {
        if (actor is null || actor.Type != ActorType.SystemWorker || string.IsNullOrWhiteSpace(actor.Id))
            throw new DomainException("FORBIDDEN");
    }
}

public static class BetaFormComposer
{
    public static BetaFormVersion Compose(string version, string policyVersion,
        PublicationTier requestedTier, ImmutableArray<FormRequirement> requirements,
        ImmutableArray<FormItemCandidate> candidates, ImmutableHashSet<string> lockedFamilyIds,
        int maximumPriorExposure)
    {
        if (string.IsNullOrWhiteSpace(version) || string.IsNullOrWhiteSpace(policyVersion))
            throw new DomainException("FORM_METADATA_REQUIRED");
        if (requestedTier is not (PublicationTier.BetaPractice or
            PublicationTier.DataValidatedPractice))
            throw new DomainException("FORM_TIER_INVALID");
        if (maximumPriorExposure < 0 || requirements.IsDefaultOrEmpty || candidates.IsDefault ||
            lockedFamilyIds is null)
            throw new DomainException("FORM_BLUEPRINT_INVALID");

        var duplicateRequirement = requirements.GroupBy(item => item.Part)
            .Any(group => group.Count() > 1);
        if (duplicateRequirement || requirements.Any(item => item.QuestionCount <= 0))
            throw new DomainException("FORM_BLUEPRINT_INVALID");
        if (candidates.Any(item => item.RevisionId == Guid.Empty ||
            string.IsNullOrWhiteSpace(item.FamilyId) ||
            string.IsNullOrWhiteSpace(item.RightsReference) ||
            item.PolicyVersion != policyVersion || item.QuestionCount <= 0 ||
            item.PriorExposureCount < 0))
            throw new DomainException("FORM_ITEM_INVALID");
        if (candidates.Select(item => item.RevisionId).Distinct().Count() != candidates.Length)
            throw new DomainException("FORM_ITEM_DUPLICATE");
        if (candidates.Any(item => lockedFamilyIds.Contains(item.FamilyId)))
            throw new DomainException("FORM_FAMILY_LOCKED");
        if (candidates.Select(item => item.FamilyId).Distinct(StringComparer.Ordinal).Count() !=
            candidates.Length)
            throw new DomainException("FORM_FAMILY_COLLISION");
        if (candidates.Any(item => item.PriorExposureCount > maximumPriorExposure))
            throw new DomainException("FORM_EXPOSURE_LIMIT");

        foreach (var requirement in requirements)
        {
            if (candidates.Where(item => item.Part == requirement.Part)
                .Sum(item => item.QuestionCount) != requirement.QuestionCount)
                throw new DomainException("FORM_COVERAGE_INVALID");
        }

        if (candidates.Any(item => !Eligible(item, requestedTier)))
            throw new DomainException("FORM_ITEM_TIER_INVALID");

        var items = candidates.Select((item, index) => new FormItemSnapshot(item.RevisionId,
            item.FamilyId, item.Part, item.Tier, item.QuestionCount, index + 1)).ToImmutableArray();
        return new BetaFormVersion(Guid.NewGuid(), version.Trim(), policyVersion.Trim(),
            requestedTier, items);
    }

    private static bool Eligible(FormItemCandidate item, PublicationTier requestedTier) =>
        requestedTier switch
        {
            PublicationTier.BetaPractice =>
                item.State == CandidateState.BetaReady &&
                item.Tier == PublicationTier.AutoValidated ||
                item.State == CandidateState.DataValidatedPractice &&
                item.Tier == PublicationTier.DataValidatedPractice,
            PublicationTier.DataValidatedPractice =>
                item.State == CandidateState.DataValidatedPractice &&
                item.Tier == PublicationTier.DataValidatedPractice,
            _ => false
        };
}
