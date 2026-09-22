using System.Text.Json;

namespace Toeic.Domain.Content;

public enum GenerationJobState
{
    Created,
    BudgetReserved,
    Running,
    PausedBudget,
    AwaitingCostReconciliation,
    Completed,
    Failed,
    Cancelled
}

public enum GenerationStage { Created, Generating, Validating, Finished }

public sealed record GenerationScope(string TenantId, string OwnerId);
public sealed record CreateGenerationJob(GenerationScope Scope, string IdempotencyKey, Guid BlueprintId,
    int CandidateCount);
public sealed record BudgetReservation(Guid Id, decimal Amount, string Currency, DateTimeOffset ExpiresAt);
public sealed record GenerationCheckpoint(GenerationStage Stage, int ProcessedCandidates,
    int AcceptedCandidates, int RejectedCandidates, DateTimeOffset SavedAt);
public sealed record GenerationJobTransition(GenerationJobState From, GenerationJobState To,
    string ReasonCode, string ActorId, DateTimeOffset At);
public sealed record GenerationJobEvent(Guid EventId, Guid JobId, string EventType,
    string PayloadJson, string PayloadHash, DateTimeOffset OccurredAt);

public sealed class GenerationControl
{
    public bool IsEnabled { get; private set; } = true;
    public string? DisabledReason { get; private set; }

    public void Disable(string reason, Actor actor)
    {
        RequireAdmin(actor);
        if (string.IsNullOrWhiteSpace(reason)) throw new DomainException("KILL_SWITCH_REASON_REQUIRED");
        IsEnabled = false;
        DisabledReason = reason.Trim();
    }

    public void Enable(Actor actor)
    {
        RequireAdmin(actor);
        IsEnabled = true;
        DisabledReason = null;
    }

    public void RequireEnabled()
    {
        if (!IsEnabled) throw new DomainException("GENERATION_DISABLED");
    }

    private static void RequireAdmin(Actor actor)
    {
        if (actor is null || actor.Type != ActorType.Admin || string.IsNullOrWhiteSpace(actor.Id))
            throw new DomainException("FORBIDDEN");
    }
}

public sealed class GenerationJob
{
    private readonly List<GenerationJobTransition> transitions = [];
    private readonly List<GenerationJobEvent> events = [];

    public Guid Id { get; }
    public GenerationScope Scope { get; }
    public string IdempotencyKey { get; }
    public string InputHash { get; }
    public Guid BlueprintId { get; }
    public string BlueprintVersion { get; }
    public string PolicyVersion { get; }
    public ModelRoute Route { get; }
    public int CandidateCount { get; }
    public decimal RequiredBudget { get; }
    public string Currency { get; }
    public GenerationJobState State { get; private set; } = GenerationJobState.Created;
    public BudgetReservation? Reservation { get; private set; }
    public GenerationCheckpoint? Checkpoint { get; private set; }
    public DateTimeOffset CreatedAt { get; }
    public IReadOnlyList<GenerationJobTransition> Transitions => transitions.AsReadOnly();
    public IReadOnlyList<GenerationJobEvent> PendingEvents => events.AsReadOnly();

    private GenerationJob(Guid id, CreateGenerationJob request, ContentBlueprintVersion blueprint,
        DateTimeOffset createdAt)
    {
        Id = id;
        Scope = new(request.Scope.TenantId.Trim(), request.Scope.OwnerId.Trim());
        IdempotencyKey = request.IdempotencyKey.Trim();
        BlueprintId = blueprint.Id;
        BlueprintVersion = blueprint.Version;
        PolicyVersion = blueprint.PolicyVersion;
        Route = blueprint.GeneratorRoute;
        CandidateCount = request.CandidateCount;
        RequiredBudget = blueprint.RequiredReservation(request.CandidateCount);
        Currency = blueprint.Budget.Currency;
        CreatedAt = createdAt;
        InputHash = ComputeInputHash(request, blueprint);
        RecordEvent("GenerationJobCreated", new { Id, InputHash, CandidateCount }, createdAt);
    }

    public static GenerationJob Create(CreateGenerationJob request, ContentBlueprintVersion blueprint,
        TimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(blueprint);
        ValidateRequest(request);
        blueprint.RequireUsableForGeneration();
        if (request.BlueprintId != blueprint.Id) throw new DomainException("BLUEPRINT_ID_MISMATCH");
        return new(Guid.NewGuid(), request, blueprint, clock.GetUtcNow());
    }

    public void EnsureIdempotentReplay(CreateGenerationJob request, ContentBlueprintVersion blueprint)
    {
        ValidateRequest(request);
        if (!string.Equals(Scope.TenantId, request.Scope.TenantId.Trim(), StringComparison.Ordinal) ||
            !string.Equals(Scope.OwnerId, request.Scope.OwnerId.Trim(), StringComparison.Ordinal) ||
            !string.Equals(IdempotencyKey, request.IdempotencyKey.Trim(), StringComparison.Ordinal))
            throw new DomainException("IDEMPOTENCY_SCOPE_MISMATCH");

        if (!string.Equals(InputHash, ComputeInputHash(request, blueprint), StringComparison.Ordinal))
            throw new DomainException("IDEMPOTENCY_CONFLICT");
    }

    public void ReserveBudget(BudgetReservation reservation, Actor actor, TimeProvider clock)
    {
        RequireWorker(actor);
        RequireState(GenerationJobState.Created, GenerationJobState.PausedBudget);
        ArgumentNullException.ThrowIfNull(reservation);
        if (reservation.Id == Guid.Empty || reservation.Amount < RequiredBudget ||
            !string.Equals(reservation.Currency, Currency, StringComparison.Ordinal) ||
            reservation.ExpiresAt <= clock.GetUtcNow())
            throw new DomainException("BUDGET_RESERVATION_INVALID");

        Reservation = reservation;
        Move(GenerationJobState.BudgetReserved, "BUDGET_RESERVED", actor, clock);
    }

    public void Start(GenerationControl control, Actor actor, TimeProvider clock)
    {
        RequireWorker(actor);
        RequireState(GenerationJobState.BudgetReserved);
        ArgumentNullException.ThrowIfNull(control);
        control.RequireEnabled();
        if (Reservation is null || Reservation.ExpiresAt <= clock.GetUtcNow())
            throw new DomainException("BUDGET_RESERVATION_EXPIRED");

        Checkpoint ??= new(GenerationStage.Generating, 0, 0, 0, clock.GetUtcNow());
        Move(GenerationJobState.Running, "GENERATION_STARTED", actor, clock);
    }

    public void SaveCheckpoint(GenerationStage stage, int processedCandidates, int acceptedCandidates,
        int rejectedCandidates, Actor actor, TimeProvider clock)
    {
        RequireWorker(actor);
        RequireState(GenerationJobState.Running);
        if (stage is GenerationStage.Created or GenerationStage.Finished || processedCandidates < 0 ||
            acceptedCandidates < 0 || rejectedCandidates < 0 ||
            processedCandidates != acceptedCandidates + rejectedCandidates ||
            processedCandidates > CandidateCount)
            throw new DomainException("CHECKPOINT_INVALID");

        if (Checkpoint is not null && (stage < Checkpoint.Stage ||
            processedCandidates < Checkpoint.ProcessedCandidates ||
            acceptedCandidates < Checkpoint.AcceptedCandidates ||
            rejectedCandidates < Checkpoint.RejectedCandidates))
            throw new DomainException("CHECKPOINT_REGRESSION");

        Checkpoint = new(stage, processedCandidates, acceptedCandidates, rejectedCandidates, clock.GetUtcNow());
        RecordEvent("GenerationCheckpointSaved", Checkpoint, clock.GetUtcNow());
    }

    public void Complete(Actor actor, TimeProvider clock)
    {
        RequireWorker(actor);
        RequireState(GenerationJobState.Running);
        if (Checkpoint is null || Checkpoint.ProcessedCandidates != CandidateCount)
            throw new DomainException("JOB_NOT_FULLY_PROCESSED");

        Checkpoint = Checkpoint with { Stage = GenerationStage.Finished, SavedAt = clock.GetUtcNow() };
        Move(GenerationJobState.Completed, "GENERATION_COMPLETED", actor, clock);
    }

    public void PauseForBudget(string reason, Actor actor, TimeProvider clock)
    {
        RequireWorker(actor);
        RequireState(GenerationJobState.Created, GenerationJobState.Running);
        Move(GenerationJobState.PausedBudget, reason, actor, clock);
    }

    public void MarkUnknownCost(string reason, Actor actor, TimeProvider clock)
    {
        RequireWorker(actor);
        RequireState(GenerationJobState.Running);
        Move(GenerationJobState.AwaitingCostReconciliation, reason, actor, clock);
    }

    public void Fail(string reason, Actor actor, TimeProvider clock)
    {
        RequireWorker(actor);
        RequireState(GenerationJobState.Created, GenerationJobState.BudgetReserved, GenerationJobState.Running);
        Move(GenerationJobState.Failed, reason, actor, clock);
    }

    public void Cancel(string reason, Actor actor, TimeProvider clock)
    {
        if (actor is null ||
            actor.Type is not (ActorType.Admin or ActorType.ContentOperator) ||
            string.IsNullOrWhiteSpace(actor.Id) ||
            (actor.Type == ActorType.ContentOperator && actor.Id != Scope.OwnerId))
            throw new DomainException("FORBIDDEN");
        RequireState(GenerationJobState.Created, GenerationJobState.BudgetReserved,
            GenerationJobState.PausedBudget);
        Move(GenerationJobState.Cancelled, reason, actor, clock);
    }

    private static string ComputeInputHash(CreateGenerationJob request, ContentBlueprintVersion blueprint) =>
        ContentHash.Of(new
        {
            Scope = new { TenantId = request.Scope.TenantId.Trim(), OwnerId = request.Scope.OwnerId.Trim() },
            request.BlueprintId,
            request.CandidateCount,
            blueprint.Version,
            blueprint.PolicyVersion,
            blueprint.GeneratorRoute
        });

    private void Move(GenerationJobState next, string reason, Actor actor, TimeProvider clock)
    {
        if (string.IsNullOrWhiteSpace(reason)) throw new DomainException("JOB_REASON_REQUIRED");
        var now = clock.GetUtcNow();
        transitions.Add(new(State, next, reason.Trim(), actor.Id, now));
        State = next;
        RecordEvent("GenerationJobStateChanged", transitions[^1], now);
    }

    private void RecordEvent(string eventType, object payload, DateTimeOffset occurredAt)
    {
        var payloadJson = JsonSerializer.Serialize(payload);
        events.Add(new(Guid.NewGuid(), Id, eventType, payloadJson,
            ContentHash.Of(payloadJson), occurredAt));
    }

    private static void ValidateRequest(CreateGenerationJob request)
    {
        if (request.Scope is null || string.IsNullOrWhiteSpace(request.Scope.TenantId) ||
            string.IsNullOrWhiteSpace(request.Scope.OwnerId))
            throw new DomainException("JOB_SCOPE_REQUIRED");
        if (string.IsNullOrWhiteSpace(request.IdempotencyKey) ||
            request.IdempotencyKey.Trim().Length is < 8 or > 128)
            throw new DomainException("IDEMPOTENCY_KEY_INVALID");
        if (request.BlueprintId == Guid.Empty) throw new DomainException("BLUEPRINT_ID_REQUIRED");
        if (request.CandidateCount < 1) throw new DomainException("JOB_QUOTA_INVALID");
    }

    private static void RequireWorker(Actor actor)
    {
        if (actor is null || actor.Type != ActorType.SystemWorker || string.IsNullOrWhiteSpace(actor.Id))
            throw new DomainException("FORBIDDEN");
    }

    private void RequireState(params GenerationJobState[] allowed)
    {
        if (!allowed.Contains(State)) throw new DomainException("INVALID_JOB_TRANSITION");
    }
}

public interface IGenerationJobRepository
{
    Task<GenerationJob?> FindByIdempotencyKeyAsync(GenerationScope scope, string idempotencyKey,
        CancellationToken cancellationToken);
    Task AddAsync(GenerationJob job, CancellationToken cancellationToken);
}

public interface IBudgetReservationService
{
    Task<BudgetReservation?> TryReserveAsync(GenerationScope scope, Guid jobId, decimal amount,
        string currency, CancellationToken cancellationToken);
}
