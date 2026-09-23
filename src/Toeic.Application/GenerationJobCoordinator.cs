using Toeic.Domain.Content;

namespace Toeic.Application;

public sealed record StartGenerationJobCommand(string TenantId, Guid BlueprintId,
    int CandidateCount, string IdempotencyKey);
public sealed record StartGenerationJobResult(Guid JobId, GenerationJobState State,
    bool Replayed, decimal RequiredBudget, string Currency);

public sealed class GenerationJobCoordinator(
    IApplicationTransaction transaction,
    IContentBlueprintRepository blueprints,
    IAtomicGenerationJobStore jobs,
    IBudgetReservationService budgets,
    IOutboxWriter outbox,
    TimeProvider clock)
{
    private static readonly Actor Worker = new(ActorType.SystemWorker, "generation-coordinator");

    public Task<StartGenerationJobResult> StartAsync(StartGenerationJobCommand command,
        Actor requester, CancellationToken cancellationToken)
    {
        RequireGeneratePermission(requester);
        if (!Guid.TryParse(command.IdempotencyKey, out _))
            throw new DomainException("IDEMPOTENCY_KEY_INVALID");

        return transaction.ExecuteAsync(async token =>
        {
            var blueprint = await blueprints.FindAsync(command.BlueprintId, token)
                ?? throw new DomainException("BLUEPRINT_NOT_FOUND");
            var request = new CreateGenerationJob(new(command.TenantId, requester.Id),
                command.IdempotencyKey, command.BlueprintId, command.CandidateCount);
            var proposed = GenerationJob.Create(request, blueprint, clock);
            var insertion = await jobs.GetOrAddAsync(proposed, token);

            if (!insertion.Inserted)
            {
                insertion.Job.EnsureIdempotentReplay(request, blueprint);
                return Result(insertion.Job, true);
            }

            var reservation = await budgets.TryReserveAsync(proposed.Scope, proposed.Id,
                proposed.RequiredBudget, proposed.Currency, token);
            if (reservation is null)
                proposed.PauseForBudget("BUDGET_UNAVAILABLE", Worker, clock);
            else
                proposed.ReserveBudget(reservation, Worker, clock);

            await jobs.SaveAsync(proposed, token);
            await outbox.EnqueueAsync(proposed.PendingEvents, token);
            return Result(proposed, false);
        }, cancellationToken);
    }

    private static StartGenerationJobResult Result(GenerationJob job, bool replayed) =>
        new(job.Id, job.State, replayed, job.RequiredBudget, job.Currency);

    private static void RequireGeneratePermission(Actor actor)
    {
        if (actor is null || actor.Type is not (ActorType.Admin or ActorType.ContentOperator) ||
            string.IsNullOrWhiteSpace(actor.Id))
            throw new DomainException("FORBIDDEN");
    }
}
