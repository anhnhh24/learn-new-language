create table learning.notifications (
    id uuid primary key,
    learner_id uuid not null references identity_data.users(id),
    kind text not null check(kind in ('StudyReminder')),
    dedupe_key text not null,
    title text not null,
    body text not null,
    target_path text not null,
    created_at timestamptz not null,
    read_at timestamptz,
    unique(learner_id,kind,dedupe_key)
);
create index ix_notifications_learner_created on learning.notifications(learner_id,created_at desc,id);
create index ix_notifications_unread on learning.notifications(learner_id) where read_at is null;
