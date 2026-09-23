namespace Toeic.Domain.Billing;

using Toeic.Domain.Content;

public enum CommerceAvailability { PendingIntegration, Enabled, Disabled }
public enum ProductState { Draft, Published, Archived }
public enum OrderState
{
    PendingPayment,
    PendingVerification,
    Paid,
    Expired,
    RefundRequested,
    RefundPending,
    Refunded,
    RefundFailed,
    Cancelled
}

public enum QuotaEntryType { Grant, Reserve, Commit, Release, Adjust }

public sealed class CommerceControl
{
    public CommerceAvailability Availability { get; private set; } = CommerceAvailability.PendingIntegration;
    public string Reason { get; private set; } = "PAYMENT_PROVIDER_NOT_CONFIGURED";

    public void Enable(string reason, Actor actor)
    {
        RequireAdmin(actor);
        if (string.IsNullOrWhiteSpace(reason)) throw new DomainException("COMMERCE_REASON_REQUIRED");
        Availability = CommerceAvailability.Enabled;
        Reason = reason.Trim();
    }

    public void Disable(string reason, Actor actor)
    {
        RequireAdmin(actor);
        if (string.IsNullOrWhiteSpace(reason)) throw new DomainException("COMMERCE_REASON_REQUIRED");
        Availability = CommerceAvailability.Disabled;
        Reason = reason.Trim();
    }

    public void RequireCheckoutEnabled()
    {
        if (Availability != CommerceAvailability.Enabled)
            throw new DomainException("COMMERCE_PENDING");
    }

    private static void RequireAdmin(Actor actor)
    {
        if (actor is null || actor.Type != ActorType.Admin || string.IsNullOrWhiteSpace(actor.Id))
            throw new DomainException("FORBIDDEN");
    }
}

public sealed class ProductVersion
{
    public Guid Id { get; }
    public string Code { get; }
    public Guid CourseVersionId { get; }
    public long PriceMinor { get; }
    public string Currency { get; }
    public int EntitlementDays { get; }
    public ProductState State { get; private set; } = ProductState.Draft;

    public ProductVersion(Guid id, string code, Guid courseVersionId, long priceMinor,
        string currency, int entitlementDays = 180)
    {
        if (id == Guid.Empty || courseVersionId == Guid.Empty || string.IsNullOrWhiteSpace(code))
            throw new DomainException("PRODUCT_INVALID");
        if (priceMinor <= 0 || currency != "VND" || entitlementDays <= 0)
            throw new DomainException("PRODUCT_PRICE_INVALID");

        Id = id;
        Code = code.Trim();
        CourseVersionId = courseVersionId;
        PriceMinor = priceMinor;
        Currency = currency;
        EntitlementDays = entitlementDays;
    }

    public void Publish(Actor actor)
    {
        RequireAdmin(actor);
        if (State != ProductState.Draft) throw new DomainException("PRODUCT_NOT_DRAFT");
        State = ProductState.Published;
    }

    public void Archive(Actor actor)
    {
        RequireAdmin(actor);
        if (State != ProductState.Published) throw new DomainException("PRODUCT_NOT_PUBLISHED");
        State = ProductState.Archived;
    }

    private static void RequireAdmin(Actor actor)
    {
        if (actor is null || actor.Type != ActorType.Admin || string.IsNullOrWhiteSpace(actor.Id))
            throw new DomainException("FORBIDDEN");
    }
}

public sealed record VerifiedPaymentEvent(Guid ProviderEventId, string ProviderTransactionId,
    Guid OrderId, long AmountMinor, string Currency, string MerchantId, DateTimeOffset ConfirmedAt,
    string VerificationEvidenceId);

public sealed record VerifiedRefundEvent(Guid ProviderEventId, string ProviderRefundId,
    Guid OrderId, long AmountMinor, string Currency, DateTimeOffset ConfirmedAt,
    string VerificationEvidenceId, bool Succeeded);

public sealed class Order
{
    private readonly Dictionary<Guid, string> providerEventHashes = [];
    private readonly Dictionary<string, string> refundRequestHashes = [];
    private Entitlement? entitlement;

    public Guid Id { get; }
    public string LearnerId { get; }
    public Guid ProductVersionId { get; }
    public Guid CourseVersionId { get; }
    public long AmountMinor { get; }
    public string Currency { get; }
    public int EntitlementDays { get; }
    public OrderState State { get; private set; } = OrderState.PendingPayment;
    public DateTimeOffset CreatedAt { get; }
    public DateTimeOffset ExpiresAt { get; }
    public DateTimeOffset? PaidAt { get; private set; }
    public string? ProviderTransactionId { get; private set; }
    public string? RefundReason { get; private set; }

    private Order(Guid id, string learnerId, ProductVersion product, DateTimeOffset createdAt)
    {
        Id = id;
        LearnerId = learnerId.Trim();
        ProductVersionId = product.Id;
        CourseVersionId = product.CourseVersionId;
        AmountMinor = product.PriceMinor;
        Currency = product.Currency;
        EntitlementDays = product.EntitlementDays;
        CreatedAt = createdAt;
        ExpiresAt = createdAt.AddMinutes(30);
    }

    public static Order Create(Guid id, string learnerId, ProductVersion product,
        CommerceControl control, DateTimeOffset createdAt)
    {
        ArgumentNullException.ThrowIfNull(product);
        ArgumentNullException.ThrowIfNull(control);
        control.RequireCheckoutEnabled();
        if (id == Guid.Empty || string.IsNullOrWhiteSpace(learnerId))
            throw new DomainException("ORDER_INVALID");
        if (product.State != ProductState.Published) throw new DomainException("PRODUCT_NOT_PUBLISHED");
        return new(id, learnerId, product, createdAt);
    }

    public void MarkRedirectReturned()
    {
        if (State != OrderState.PendingPayment) throw new DomainException("ORDER_STATE_INVALID");
        State = OrderState.PendingVerification;
    }

    public bool ApplyVerifiedPayment(VerifiedPaymentEvent payment, string expectedMerchantId)
    {
        ArgumentNullException.ThrowIfNull(payment);
        if (payment.ProviderEventId == Guid.Empty || payment.OrderId != Id ||
            payment.AmountMinor != AmountMinor || payment.Currency != Currency ||
            payment.MerchantId != expectedMerchantId ||
            string.IsNullOrWhiteSpace(payment.ProviderTransactionId) ||
            string.IsNullOrWhiteSpace(payment.VerificationEvidenceId))
            throw new DomainException("PAYMENT_VERIFICATION_MISMATCH");
        var eventHash = ContentHash.Of(payment);
        if (providerEventHashes.TryGetValue(payment.ProviderEventId, out var previousHash))
        {
            if (previousHash != eventHash) throw new DomainException("PROVIDER_EVENT_CONFLICT");
            return false;
        }
        if (State == OrderState.Paid && ProviderTransactionId == payment.ProviderTransactionId)
        {
            providerEventHashes[payment.ProviderEventId] = eventHash;
            return false;
        }
        if (State is not (OrderState.PendingPayment or OrderState.PendingVerification or OrderState.Expired))
            throw new DomainException("ORDER_STATE_INVALID");
        if (ProviderTransactionId is not null && ProviderTransactionId != payment.ProviderTransactionId)
            throw new DomainException("PAYMENT_TRANSACTION_CONFLICT");
        if (State == OrderState.Expired && payment.ConfirmedAt > ExpiresAt)
            throw new DomainException("PAYMENT_CONFIRMED_AFTER_EXPIRY");

        ProviderTransactionId = payment.ProviderTransactionId;
        PaidAt = payment.ConfirmedAt;
        State = OrderState.Paid;
        providerEventHashes[payment.ProviderEventId] = eventHash;
        return true;
    }

    public void Expire(DateTimeOffset now)
    {
        if (State is not (OrderState.PendingPayment or OrderState.PendingVerification))
            throw new DomainException("ORDER_STATE_INVALID");
        if (now < ExpiresAt) throw new DomainException("ORDER_NOT_EXPIRED");
        State = OrderState.Expired;
    }

    public void RequestRefund(string learnerId, string reason, string idempotencyKey)
    {
        RequireOwner(learnerId);
        if (State != OrderState.Paid) throw new DomainException("ORDER_NOT_PAID");
        if (string.IsNullOrWhiteSpace(reason) || reason.Length > 1000 ||
            !Guid.TryParse(idempotencyKey, out _))
            throw new DomainException("REFUND_REQUEST_INVALID");

        var requestHash = ContentHash.Of(new { Reason = reason.Trim() });
        if (refundRequestHashes.TryGetValue(idempotencyKey, out var previous))
        {
            if (previous != requestHash) throw new DomainException("IDEMPOTENCY_CONFLICT");
            return;
        }

        refundRequestHashes[idempotencyKey] = requestHash;
        RefundReason = reason.Trim();
        State = OrderState.RefundRequested;
    }

    public void BeginRefund(Actor actor)
    {
        RequireAdmin(actor);
        if (State is not (OrderState.RefundRequested or OrderState.RefundFailed))
            throw new DomainException("ORDER_STATE_INVALID");
        State = OrderState.RefundPending;
    }

    public bool ApplyVerifiedRefund(VerifiedRefundEvent refund)
    {
        ArgumentNullException.ThrowIfNull(refund);
        if (refund.ProviderEventId == Guid.Empty || refund.OrderId != Id ||
            refund.AmountMinor != AmountMinor || refund.Currency != Currency ||
            string.IsNullOrWhiteSpace(refund.ProviderRefundId) ||
            string.IsNullOrWhiteSpace(refund.VerificationEvidenceId))
            throw new DomainException("REFUND_VERIFICATION_MISMATCH");
        var eventHash = ContentHash.Of(refund);
        if (providerEventHashes.TryGetValue(refund.ProviderEventId, out var previousHash))
        {
            if (previousHash != eventHash) throw new DomainException("PROVIDER_EVENT_CONFLICT");
            return false;
        }
        if (State != OrderState.RefundPending) throw new DomainException("ORDER_STATE_INVALID");

        State = refund.Succeeded ? OrderState.Refunded : OrderState.RefundFailed;
        providerEventHashes[refund.ProviderEventId] = eventHash;
        return true;
    }


    public Entitlement CreateEntitlement()
    {
        if (State != OrderState.Paid || PaidAt is null) throw new DomainException("ORDER_NOT_PAID");
        return entitlement ??= new(Guid.NewGuid(), LearnerId, CourseVersionId, PaidAt.Value,
            PaidAt.Value.AddDays(EntitlementDays), $"order:{Id}");
    }

    private void RequireOwner(string learnerId)
    {
        if (LearnerId != learnerId?.Trim()) throw new DomainException("ORDER_NOT_FOUND");
    }

    private static void RequireAdmin(Actor actor)
    {
        if (actor is null || actor.Type != ActorType.Admin || string.IsNullOrWhiteSpace(actor.Id))
            throw new DomainException("FORBIDDEN");
    }
}

public sealed record Entitlement(Guid Id, string LearnerId, Guid ResourceId, DateTimeOffset StartsAt,
    DateTimeOffset ExpiresAt, string Source)
{
    public bool CanStart(DateTimeOffset now) => now >= StartsAt && now < ExpiresAt;

    public bool CanContinueAttempt(DateTimeOffset attemptStartedAt, DateTimeOffset attemptDeadline,
        DateTimeOffset now) => attemptStartedAt >= StartsAt && attemptStartedAt < ExpiresAt && now < attemptDeadline;
}

public sealed record QuotaLedgerEntry(Guid Id, QuotaEntryType Type, int Delta, Guid? ReservationId,
    string Reason, DateTimeOffset OccurredAt);

public sealed class QuotaLedger
{
    private readonly List<QuotaLedgerEntry> entries = [];
    private readonly HashSet<Guid> completedReservations = [];
    public string LearnerId { get; }
    public string QuotaCode { get; }
    public int Balance => entries.Sum(entry => entry.Delta);
    public IReadOnlyList<QuotaLedgerEntry> Entries => entries.AsReadOnly();

    public QuotaLedger(string learnerId, string quotaCode)
    {
        if (string.IsNullOrWhiteSpace(learnerId) || string.IsNullOrWhiteSpace(quotaCode))
            throw new DomainException("QUOTA_LEDGER_INVALID");
        LearnerId = learnerId.Trim();
        QuotaCode = quotaCode.Trim();
    }

    public void Grant(int amount, string reason, DateTimeOffset now)
    {
        if (amount <= 0) throw new DomainException("QUOTA_AMOUNT_INVALID");
        Append(QuotaEntryType.Grant, amount, null, reason, now);
    }

    public Guid Reserve(int amount, string reason, DateTimeOffset now)
    {
        if (amount <= 0 || Balance < amount) throw new DomainException("QUOTA_INSUFFICIENT");
        var reservationId = Guid.NewGuid();
        Append(QuotaEntryType.Reserve, -amount, reservationId, reason, now);
        return reservationId;
    }

    public void Commit(Guid reservationId, string reason, DateTimeOffset now)
    {
        var reservation = FindOpenReservation(reservationId);
        completedReservations.Add(reservationId);
        Append(QuotaEntryType.Commit, 0, reservation.Id, reason, now);
    }

    public void Release(Guid reservationId, string reason, DateTimeOffset now)
    {
        var reservation = FindOpenReservation(reservationId);
        completedReservations.Add(reservationId);
        Append(QuotaEntryType.Release, -reservation.Delta, reservation.Id, reason, now);
    }

    private QuotaLedgerEntry FindOpenReservation(Guid reservationId)
    {
        if (reservationId == Guid.Empty || completedReservations.Contains(reservationId))
            throw new DomainException("QUOTA_RESERVATION_INVALID");
        return entries.SingleOrDefault(entry => entry.Type == QuotaEntryType.Reserve &&
                   entry.ReservationId == reservationId)
               ?? throw new DomainException("QUOTA_RESERVATION_NOT_FOUND");
    }

    private void Append(QuotaEntryType type, int delta, Guid? reservationId, string reason,
        DateTimeOffset now)
    {
        if (string.IsNullOrWhiteSpace(reason)) throw new DomainException("QUOTA_REASON_REQUIRED");
        if (Balance + delta < 0) throw new DomainException("QUOTA_INSUFFICIENT");
        entries.Add(new(Guid.NewGuid(), type, delta, reservationId, reason.Trim(), now));
    }
}

public interface IPaymentProviderAdapter
{
    Task<PaymentCheckoutReference> CreateCheckoutAsync(Order order, CancellationToken cancellationToken);
    Task<VerifiedPaymentEvent> VerifyPaymentAsync(string payload, IReadOnlyDictionary<string, string> headers,
        CancellationToken cancellationToken);
    Task<VerifiedRefundEvent> VerifyRefundAsync(string payload, IReadOnlyDictionary<string, string> headers,
        CancellationToken cancellationToken);
}

public sealed record PaymentCheckoutReference(string Provider, string ExternalOrderId, Uri CheckoutUri,
    DateTimeOffset ExpiresAt);
