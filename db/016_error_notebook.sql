alter table learning.error_entries
    add column revision bigint not null default 0 check (revision >= 0),
    add column ignore_reason text check (char_length(ignore_reason) <= 500),
    add column snapshot_json jsonb,
    add column updated_at timestamptz;
update learning.error_entries set updated_at=last_seen_at;
alter table learning.error_entries alter column updated_at set not null;
create index ix_error_entries_learner_state on learning.error_entries(learner_id,state,last_seen_at desc,id);
