begin;

create extension if not exists pgcrypto;
create schema if not exists identity_data;
create schema if not exists content;
create schema if not exists assessment;
create schema if not exists learning;
create schema if not exists billing;
create schema if not exists operations;

create table identity_data.users (
    id uuid primary key default gen_random_uuid(),
    email_normalized text not null unique,
    password_hash text not null,
    display_name text not null,
    timezone text not null default 'Asia/Ho_Chi_Minh',
    status text not null check (status in ('PendingVerification','Active','Suspended','DeletionPending','Deleted')),
    email_verified_at timestamptz,
    created_at timestamptz not null default now()
);

create table identity_data.sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references identity_data.users(id),
    refresh_token_hash text not null unique,
    expires_at timestamptz not null,
    revoked_at timestamptz,
    created_at timestamptz not null default now()
);

create table content.blueprint_versions (
    id uuid primary key,
    version text not null unique,
    policy_version text not null,
    exam_profile text not null,
    part text not null,
    state text not null,
    max_candidates integer not null check (max_candidates between 1 and 10),
    budget_amount numeric(18,6) not null check (budget_amount > 0),
    currency char(3) not null,
    definition jsonb not null,
    created_at timestamptz not null,
    published_at timestamptz
);

create table content.generation_jobs (
    id uuid primary key,
    tenant_id text not null,
    owner_id text not null,
    idempotency_key text not null,
    input_hash char(64) not null,
    blueprint_id uuid not null references content.blueprint_versions(id),
    blueprint_version text not null,
    policy_version text not null,
    state text not null,
    candidate_count integer not null check (candidate_count > 0),
    required_budget numeric(18,6) not null,
    currency char(3) not null,
    checkpoint jsonb,
    created_at timestamptz not null,
    unique (tenant_id, owner_id, idempotency_key)
);

create table content.question_revisions (
    id uuid primary key,
    previous_revision_id uuid references content.question_revisions(id),
    family_id text not null,
    part text not null,
    state text not null,
    tier text not null,
    content_hash char(64) not null,
    content_json jsonb not null,
    provenance_json jsonb not null,
    created_at timestamptz not null default now()
);
create index ix_question_revisions_family on content.question_revisions(family_id);

create table assessment.attempts (
    id uuid primary key,
    learner_id uuid not null references identity_data.users(id),
    assessment_version_id uuid not null,
    exam_profile_version text not null,
    mode text not null,
    status text not null,
    revision bigint not null default 0,
    snapshot_json jsonb not null,
    started_at timestamptz not null,
    deadline timestamptz not null,
    submitted_at timestamptz,
    submission_receipt_id uuid unique,
    submit_idempotency_key uuid,
    lease_token_hash char(64),
    lease_expires_at timestamptz
);
create unique index ux_active_attempt on assessment.attempts(learner_id, assessment_version_id)
    where status = 'Active';

create table assessment.responses (
    attempt_id uuid not null references assessment.attempts(id),
    question_revision_id uuid not null,
    answer_json jsonb not null,
    revision bigint not null,
    client_operation_id uuid not null,
    saved_at timestamptz not null,
    primary key (attempt_id, question_revision_id),
    unique (attempt_id, client_operation_id)
);

create table assessment.grade_versions (
    id uuid primary key,
    attempt_id uuid not null references assessment.attempts(id),
    version integer not null,
    raw_score numeric(12,4) not null,
    max_score numeric(12,4) not null,
    answered_count integer not null,
    policy_version text not null,
    graded_at timestamptz not null,
    unique (attempt_id, version)
);

create table learning.enrollments (
    id uuid primary key,
    learner_id uuid not null references identity_data.users(id),
    course_version_id uuid not null,
    state text not null,
    enrolled_at timestamptz not null,
    unique (learner_id, course_version_id)
);

create table learning.lesson_progress (
    id uuid primary key,
    learner_id uuid not null references identity_data.users(id),
    lesson_version_id uuid not null,
    revision bigint not null default 0,
    read_page_ids jsonb not null default '[]',
    bookmark_page_id uuid,
    quiz_submitted boolean not null default false,
    first_quiz_accuracy numeric(5,4),
    completed_at timestamptz,
    needs_review boolean not null default false,
    unique (learner_id, lesson_version_id)
);

create table learning.error_entries (
    id uuid primary key,
    learner_id uuid not null references identity_data.users(id),
    source_attempt_id uuid not null references assessment.attempts(id),
    source_question_revision_id uuid not null,
    primary_tag text not null,
    state text not null,
    evidence_json jsonb not null default '[]',
    last_seen_at timestamptz not null,
    unique (learner_id, source_attempt_id, source_question_revision_id)
);

create table learning.user_cards (
    id uuid primary key,
    learner_id uuid not null references identity_data.users(id),
    card_version_id uuid not null,
    state text not null,
    interval_days integer not null check (interval_days between 0 and 180),
    due_at timestamptz not null,
    algorithm_version text not null,
    unique (learner_id, card_version_id)
);

create table learning.review_events (
    event_id uuid primary key,
    card_id uuid not null references learning.user_cards(id),
    learner_id uuid not null references identity_data.users(id),
    rating text not null,
    previous_interval_days integer not null,
    new_interval_days integer not null,
    reviewed_at timestamptz not null,
    due_at timestamptz not null,
    algorithm_version text not null,
    was_early boolean not null
);

create table billing.commerce_control (
    singleton boolean primary key default true check (singleton),
    availability text not null check (availability in ('PendingIntegration','Enabled','Disabled')),
    reason text not null,
    updated_at timestamptz not null default now()
);
insert into billing.commerce_control(singleton, availability, reason)
values (true, 'PendingIntegration', 'PAYMENT_PROVIDER_NOT_CONFIGURED')
on conflict (singleton) do nothing;

create table billing.product_versions (
    id uuid primary key,
    code text not null,
    course_version_id uuid not null,
    price_minor bigint not null check (price_minor > 0),
    currency char(3) not null,
    entitlement_days integer not null check (entitlement_days > 0),
    state text not null,
    unique (code, id)
);

create table billing.orders (
    id uuid primary key,
    learner_id uuid not null references identity_data.users(id),
    product_version_id uuid not null references billing.product_versions(id),
    amount_minor bigint not null check (amount_minor > 0),
    currency char(3) not null,
    state text not null,
    provider_transaction_id text unique,
    created_at timestamptz not null,
    expires_at timestamptz not null,
    paid_at timestamptz
);

create table billing.payment_events (
    provider_event_id uuid primary key,
    order_id uuid not null references billing.orders(id),
    provider text not null,
    event_type text not null,
    payload_hash char(64) not null,
    verification_evidence_id text not null,
    received_at timestamptz not null
);

create table billing.entitlements (
    id uuid primary key,
    learner_id uuid not null references identity_data.users(id),
    resource_id uuid not null,
    starts_at timestamptz not null,
    expires_at timestamptz not null,
    source text not null unique,
    check (expires_at > starts_at)
);

create table billing.quota_ledger (
    id uuid primary key,
    learner_id uuid not null references identity_data.users(id),
    quota_code text not null,
    entry_type text not null,
    delta integer not null,
    reservation_id uuid,
    reason text not null,
    occurred_at timestamptz not null
);
create unique index ux_quota_reservation_terminal on billing.quota_ledger(reservation_id, entry_type)
    where reservation_id is not null and entry_type in ('Commit','Release');

create table operations.idempotency_records (
    scope text not null,
    idempotency_key uuid not null,
    request_hash char(64) not null,
    response_status integer not null,
    response_json jsonb not null,
    expires_at timestamptz not null,
    primary key (scope, idempotency_key)
);

create table operations.outbox_events (
    event_id uuid primary key,
    event_type text not null,
    payload_version integer not null default 1,
    payload_json jsonb not null,
    payload_hash char(64) not null,
    occurred_at timestamptz not null,
    attempts integer not null default 0,
    next_retry_at timestamptz not null default now(),
    processed_at timestamptz,
    dead_lettered_at timestamptz
);
create index ix_outbox_pending on operations.outbox_events(next_retry_at)
    where processed_at is null and dead_lettered_at is null;

create table operations.audit_events (
    id uuid primary key default gen_random_uuid(),
    actor_id text not null,
    action text not null,
    target_type text not null,
    target_id text not null,
    reason text,
    safe_diff jsonb,
    correlation_id text not null,
    occurred_at timestamptz not null default now()
);

commit;
