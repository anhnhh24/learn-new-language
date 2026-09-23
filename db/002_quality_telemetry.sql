create table content.form_versions (
    id uuid primary key,
    version text not null unique,
    tier text not null,
    state text not null check (state in ('Draft','Active','Degraded','Archived')),
    snapshot_json jsonb not null,
    policy_version text not null,
    created_at timestamptz not null default now()
);

create table content.form_items (
    form_version_id uuid not null references content.form_versions(id),
    item_revision_id uuid not null references content.question_revisions(id),
    item_order integer not null,
    primary key (form_version_id, item_revision_id),
    unique (form_version_id, item_order)
);

create table content.form_questions (
    form_version_id uuid not null references content.form_versions(id),
    item_revision_id uuid not null,
    question_revision_id uuid not null references content.question_revisions(id),
    question_order integer not null,
    primary key (form_version_id, question_revision_id),
    unique (form_version_id, question_order),
    foreign key (form_version_id, item_revision_id) references content.form_items(form_version_id, item_revision_id)
);

create table assessment.item_exposures (
create table assessment.start_attempt_receipts (
    learner_id uuid not null references identity_data.users(id),
    client_operation_id uuid not null,
    form_version_id uuid not null references content.form_versions(id),
    attempt_id uuid not null references assessment.attempts(id),
    response_json jsonb not null,
    created_at timestamptz not null default now(),
    primary key (learner_id, client_operation_id),
    unique (attempt_id)
);

    event_id uuid primary key,
    attempt_id uuid not null references assessment.attempts(id),
    item_revision_id uuid not null references content.question_revisions(id),
    learner_hash char(64) not null,
    form_version text not null,
    exposed_at timestamptz not null,
    unique (attempt_id, item_revision_id)
);

create table assessment.item_responses (
    event_id uuid primary key,
    attempt_id uuid not null references assessment.attempts(id),
    item_revision_id uuid not null references content.question_revisions(id),
    learner_hash char(64) not null,
    form_version text not null,
    selected_option_id text not null,
    correct boolean not null,
    valid boolean not null default true,
    response_time_ms bigint not null check (response_time_ms >= 0),
    ability_band text not null,
    responded_at timestamptz not null,
    unique (attempt_id, item_revision_id)
);

create table assessment.learner_issue_reports (
    id uuid primary key,
    item_revision_id uuid not null references content.question_revisions(id),
    reporter_hash char(64) not null,
    category text not null,
    comment text check (length(comment) <= 2000),
    state text not null default 'Open',
    reported_at timestamptz not null,
    unique (item_revision_id, reporter_hash, category)
);

create table assessment.item_statistic_snapshots (
    id uuid primary key,
    item_revision_id uuid not null references content.question_revisions(id),
    policy_version text not null,
    population text not null,
    window_start timestamptz not null,
    window_end timestamptz not null,
    valid_responses integer not null check (valid_responses >= 0),
    exposures integer not null check (exposures >= valid_responses),
    correct_rate numeric(6,5) not null check (correct_rate between 0 and 1),
    point_biserial numeric(6,5) not null check (point_biserial between -1 and 1),
    distractor_rates jsonb not null,
    unresolved_report_count integer not null,
    highest_category_reporter_count integer not null,
    created_at timestamptz not null default now(),
    check (window_end > window_start)
);

create table assessment.quarantine_decisions (
    id uuid primary key,
    item_revision_id uuid not null references content.question_revisions(id),
    snapshot_id uuid references assessment.item_statistic_snapshots(id),
    reason_code text not null,
    policy_version text not null,
    affected_forms jsonb not null default '[]',
    created_at timestamptz not null default now()
);

create index ix_exposures_item_time on assessment.item_exposures(item_revision_id, exposed_at);
create index ix_responses_item_time on assessment.item_responses(item_revision_id, responded_at);
create index ix_reports_open_item on assessment.learner_issue_reports(item_revision_id)
    where state = 'Open';
