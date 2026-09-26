create table content.part7_drafts (
    id uuid primary key,
    creator_id uuid not null references identity_data.admin_accounts(user_id),
    blueprint_id uuid not null references content.blueprint_versions(id),
    previous_revision_id uuid references content.question_revisions(id),
    family_id text not null,
    stimulus_id uuid not null,
    title text not null,
    body jsonb not null,
    revision bigint not null default 0 check(revision>=0),
    source_id uuid unique references content.question_revisions(id),
    created_at timestamptz not null,
    updated_at timestamptz not null
);
create index ix_part7_drafts_updated on content.part7_drafts(updated_at desc,id);
