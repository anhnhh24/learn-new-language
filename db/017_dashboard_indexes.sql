create index ix_review_events_learner_time on learning.review_events(learner_id,reviewed_at);
create index ix_lesson_progress_completed_time on learning.lesson_progress(learner_id,completed_at)
    where completed_at is not null;
