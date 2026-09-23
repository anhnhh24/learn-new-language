using System.Collections.Immutable;
using Toeic.Domain.Assessment;
using Toeic.Domain.Analytics;
using Toeic.Domain.Content;

namespace Toeic.Application;

public sealed record ComposeBetaFormCommand(string Version, string PolicyVersion,
    string ExamProfileVersion, TimeSpan AttemptDuration, PublicationTier Tier, ImmutableArray<FormRequirement> Requirements,
    ImmutableArray<Guid> OrderedRevisionIds, ImmutableHashSet<string> LockedFamilyIds,
    int MaximumPriorExposure);

public interface IFormCandidateStore
{
    Task<IReadOnlyList<FormItemCandidate>> LoadAsync(IReadOnlyCollection<Guid> revisionIds,
        CancellationToken cancellationToken);
    Task MarkBetaActiveAsync(IReadOnlyCollection<Guid> revisionIds, string formVersion,
        Actor actor, DateTimeOffset activatedAt, CancellationToken cancellationToken);
    Task QuarantineAsync(Guid revisionId, string reasonCode, string policyVersion,
        Guid statisticSnapshotId, Actor actor, DateTimeOffset quarantinedAt,
        CancellationToken cancellationToken);
}

public interface IFormVersionStore
{
    Task AddAsync(BetaFormVersion form, CancellationToken cancellationToken);
    Task<IReadOnlyList<BetaFormVersion>> FindActiveContainingAsync(Guid revisionId,
        CancellationToken cancellationToken);
    Task SaveAsync(BetaFormVersion form, CancellationToken cancellationToken);
}

public sealed class FormCompositionService(IApplicationTransaction transaction,
    IFormCandidateStore candidates, IFormVersionStore forms, TimeProvider clock)
{
    public Task<BetaFormVersion> ComposeAsync(ComposeBetaFormCommand command, Actor actor,
        CancellationToken cancellationToken) => transaction.ExecuteAsync(async ct =>
    {
        ArgumentNullException.ThrowIfNull(command);
        var requestedIds = command.OrderedRevisionIds.IsDefault
            ? []
            : command.OrderedRevisionIds;
        if (requestedIds.IsDefaultOrEmpty || requestedIds.Any(id => id == Guid.Empty) ||
            requestedIds.Distinct().Count() != requestedIds.Length)
            throw new DomainException("FORM_ITEM_SELECTION_INVALID");

        var loaded = await candidates.LoadAsync(requestedIds, ct);
        if (loaded.Count != requestedIds.Length)
            throw new DomainException("FORM_ITEM_NOT_FOUND");
        var byId = loaded.ToDictionary(item => item.RevisionId);
        if (requestedIds.Any(id => !byId.ContainsKey(id)))
            throw new DomainException("FORM_ITEM_NOT_FOUND");

        var ordered = requestedIds.Select(id => byId[id]).ToImmutableArray();
        var form = BetaFormComposer.Compose(command.Version, command.PolicyVersion,
            command.ExamProfileVersion, command.AttemptDuration, command.Tier, command.Requirements, ordered, command.LockedFamilyIds,
            command.MaximumPriorExposure);
        form.Activate(actor, clock);

        await forms.AddAsync(form, ct);
        var betaReadyIds = ordered.Where(item => item.State == CandidateState.BetaReady)
            .Select(item => item.RevisionId).ToArray();
        if (betaReadyIds.Length > 0)
            await candidates.MarkBetaActiveAsync(betaReadyIds, form.Version, actor,
                clock.GetUtcNow(), ct);
        return form;
    }, cancellationToken);
}

public sealed class AutoQuarantineService(IApplicationTransaction transaction,
    IFormCandidateStore candidates, IFormVersionStore forms, TimeProvider clock)
{
    public Task<IReadOnlyList<Guid>> ApplyAsync(StatisticalDecision decision,
        Actor actor, CancellationToken cancellationToken) => transaction.ExecuteAsync(async ct =>
    {
        ArgumentNullException.ThrowIfNull(decision);
        if (decision.Action != StatisticalAction.Quarantine)
            throw new DomainException("QUARANTINE_DECISION_REQUIRED");

        await candidates.QuarantineAsync(decision.ItemRevisionId, decision.ReasonCode,
            decision.PolicyVersion, decision.SnapshotId, actor, clock.GetUtcNow(), ct);
        var affected = await forms.FindActiveContainingAsync(decision.ItemRevisionId, ct);
        foreach (var form in affected)
        {
            form.DegradeForQuarantinedItem(decision.ItemRevisionId, decision.ReasonCode,
                actor, clock);
            await forms.SaveAsync(form, ct);
        }

        return (IReadOnlyList<Guid>)affected.Select(form => form.Id).ToArray();
    }, cancellationToken);
}
