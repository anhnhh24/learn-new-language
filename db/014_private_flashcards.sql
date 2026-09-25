-- Private content is separate from future editorial vocabulary versions.
alter table learning.user_cards add column revision bigint not null default 0 check (revision >= 0);
create table learning.private_card_content (
    card_id uuid primary key references learning.user_cards(id),
    term text not null check (char_length(term) between 1 and 200),
    meaning text not null check (char_length(meaning) between 1 and 2000),
    example text not null check (char_length(example) <= 2000),
    created_at timestamptz not null,
    introduced_at timestamptz,
    archived boolean not null default false,
    create_operation_id uuid not null,
    create_hash char(64) not null
);
create table learning.flashcard_settings (
    learner_id uuid primary key references identity_data.users(id),
    new_cards_per_day int not null default 5 check (new_cards_per_day between 0 and 30),
    revision bigint not null default 0 check (revision >= 0)
);
create table learning.flashcard_operations (
    learner_id uuid not null references identity_data.users(id),
    operation_id uuid not null,
    request_hash char(64) not null,
    response_json jsonb not null,
    primary key (learner_id,operation_id)
);
-- One reveal per card revision; repeated reveals do not allocate unlimited rows.
create table learning.flashcard_reveals (
    card_id uuid primary key references learning.user_cards(id),
    reveal_id uuid not null unique,
    revision bigint not null,
    expires_at timestamptz not null
);
create index ix_user_cards_due on learning.user_cards(learner_id,due_at,id);
create index ix_private_cards_introduced on learning.private_card_content(introduced_at) where introduced_at is not null;
