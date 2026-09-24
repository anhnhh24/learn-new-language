alter table identity_data.users
    add column failed_login_count integer not null default 0 check (failed_login_count >= 0),
    add column login_locked_until timestamptz;

create table identity_data.learner_sessions (
    id uuid primary key,
    user_id uuid not null references identity_data.users(id),
    token_hash char(64) not null unique,
    created_at timestamptz not null,
    expires_at timestamptz not null,
    revoked_at timestamptz,
    check (expires_at > created_at)
);
create index ix_learner_sessions_user on identity_data.learner_sessions(user_id);
