create table operations.support_tickets (
    id uuid primary key,
    learner_id uuid not null references identity_data.users(id),
    client_operation_id uuid not null,
    request_hash char(64) not null,
    category text not null check (category in ('Content','Technical','Account','Billing')),
    title text not null check (char_length(title) between 3 and 150),
    description text not null check (char_length(description) between 1 and 2000),
    lesson_version_id uuid references learning.lesson_versions(id),
    state text not null default 'Open' check (state in ('Open','InProgress','Resolved','Rejected')),
    resolution_reason text,
    revision bigint not null default 0,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    unique(learner_id,client_operation_id),
    check (state not in ('Resolved','Rejected') or nullif(btrim(resolution_reason),'') is not null)
);
create index ix_support_tickets_learner on operations.support_tickets(learner_id,created_at desc,id);
