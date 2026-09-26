create table assessment.practice_attempts (
    attempt_id uuid primary key references assessment.attempts(id),
    learner_id uuid not null references identity_data.users(id),
    start_operation_id uuid not null,
    form_version text not null,
    tier text not null,
    learner_label text not null,
    explanations jsonb not null,
    result_json jsonb,
    finalization_retry_at timestamptz,
    unique(learner_id,start_operation_id)
);
create table assessment.practice_receipts (
    attempt_id uuid not null references assessment.practice_attempts(attempt_id),
    operation_id uuid not null,
    request_hash char(64) not null,
    response_json jsonb not null,
    primary key(attempt_id,operation_id)
);
