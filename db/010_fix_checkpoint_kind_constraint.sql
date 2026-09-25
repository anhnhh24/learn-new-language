-- Migration 010: Dong bo checkpoint_kind voi Remediation activity
-- Cho phep 'Remediation' la mot loai checkpoint hop le trong roadmap_weeks
-- va cap nhat week 21 thanh Remediation dong bo voi Frontend va roadmap_activities.

-- 1. Cap nhat check constraint tren bang learning.roadmap_weeks
alter table learning.roadmap_weeks
    drop constraint if exists roadmap_weeks_checkpoint_kind_check;

alter table learning.roadmap_weeks
    add constraint roadmap_weeks_checkpoint_kind_check
    check (checkpoint_kind in ('LessonQuiz', 'MixedReview', 'LevelCheckpoint', 'Remediation'));

-- 2. Dong bo tuan 21 thanh Remediation
update learning.roadmap_weeks
set checkpoint_kind = 'Remediation'
where week_number = 21 and checkpoint_kind = 'MixedReview';
