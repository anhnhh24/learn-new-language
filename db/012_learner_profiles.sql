create table learning.learner_profiles (
    learner_id uuid primary key references identity_data.users(id),
    revision bigint not null default 0 check (revision >= 0),
    goal text not null default 'general',
    self_level text not null default 'unknown',
    minutes_per_day integer not null default 30 check (minutes_per_day between 5 and 180),
    study_days integer[] not null default '{1,2,3,4,5}',
    interests text[] not null default '{}',
    onboarding_completed_at timestamptz,
    placement_skipped_at timestamptz,
    email_reminders boolean not null default false,
    in_app_reminders boolean not null default false,
    reminder_minute integer not null default 480 check (reminder_minute between 0 and 1439),
    quiet_start_minute integer not null default 1260 check (quiet_start_minute between 0 and 1439),
    quiet_end_minute integer not null default 480 check (quiet_end_minute between 0 and 1439),
    updated_at timestamptz not null default now(),
    check (cardinality(study_days) between 1 and 7),
    check (study_days <@ array[0,1,2,3,4,5,6]),
    check (cardinality(interests) <= 10),
    check (quiet_start_minute <> quiet_end_minute)
);

create table learning.reminder_consent_events (
    id uuid primary key,
    learner_id uuid not null references identity_data.users(id),
    channel text not null check (channel in ('Email','InApp')),
    enabled boolean not null,
    profile_revision bigint not null,
    occurred_at timestamptz not null,
    unique(learner_id,channel,profile_revision)
);
