create table identity_data.account_tokens (
    id uuid primary key,
    user_id uuid not null references identity_data.users(id),
    purpose text not null check (purpose in ('VerifyEmail','ResetPassword')),
    token_hash char(64) not null unique,
    created_at timestamptz not null,
    expires_at timestamptz not null,
    consumed_at timestamptz,
    check (expires_at > created_at)
);
create index ix_account_tokens_user on identity_data.account_tokens(user_id, purpose, created_at desc);

create table identity_data.terms_consents (
    user_id uuid not null references identity_data.users(id),
    version text not null,
    accepted_at timestamptz not null,
    primary key (user_id, version)
);

create table identity_data.account_mail_outbox (
    id uuid primary key,
    token_id uuid not null references identity_data.account_tokens(id),
    protected_payload text,
    created_at timestamptz not null,
    expires_at timestamptz not null,
    next_attempt_at timestamptz not null,
    attempts integer not null default 0,
    lease_id uuid,
    lease_until timestamptz,
    delivered_at timestamptz,
    failed_at timestamptz,
    last_error_code text
);
create index ix_account_mail_ready on identity_data.account_mail_outbox(next_attempt_at)
    where delivered_at is null and failed_at is null;
