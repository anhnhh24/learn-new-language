alter table learning.lesson_quiz_attempts add column finalization_retry_at timestamptz;
create index ix_active_attempt_deadline on assessment.attempts(deadline,id) where status='Active';
