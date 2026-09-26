-- Membership is provisioned by trusted operations, never by public registration.
create table identity_data.admin_accounts (
    user_id uuid primary key references identity_data.users(id),
    enabled boolean not null default true,
    failed_login_count int not null default 0 check(failed_login_count>=0),
    locked_until timestamptz,
    created_at timestamptz not null default now()
);
create table identity_data.admin_sessions (
    id uuid primary key,
    user_id uuid not null references identity_data.admin_accounts(user_id),
    token_hash char(64) not null unique,
    created_at timestamptz not null,
    expires_at timestamptz not null,
    revoked_at timestamptz,
    check(expires_at>created_at)
);
create index ix_admin_sessions_user on identity_data.admin_sessions(user_id);
