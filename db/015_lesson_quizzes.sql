-- Bind only existing quality-gated forms; no draft/mock questions are published here.
create table learning.lesson_quiz_forms (
    lesson_version_id uuid primary key references learning.lesson_versions(id),
    form_version_id uuid not null unique references content.form_versions(id),
    retry_after_days int not null default 3 check (retry_after_days between 0 and 30)
);
create table learning.lesson_quiz_attempts (
    attempt_id uuid primary key references assessment.attempts(id),
    learner_id uuid not null references identity_data.users(id),
    lesson_version_id uuid not null references learning.lesson_versions(id),
    start_operation_id uuid not null,
    tier text not null,
    learner_label text not null,
    form_version text not null,
    is_checkpoint boolean not null,
    pass_rate numeric(5,4) not null check (pass_rate between 0 and 1),
    retry_after_days int not null check (retry_after_days between 0 and 30),
    passed boolean,
    retry_at timestamptz,
    result_json jsonb,
    unique(learner_id,start_operation_id)
);
create index ix_lesson_quiz_history on learning.lesson_quiz_attempts(learner_id,lesson_version_id,attempt_id);
create table learning.lesson_quiz_receipts (
    attempt_id uuid not null references learning.lesson_quiz_attempts(attempt_id),
    operation_id uuid not null,
    request_hash char(64) not null,
    response_json jsonb not null,
    primary key(attempt_id,operation_id)
);
