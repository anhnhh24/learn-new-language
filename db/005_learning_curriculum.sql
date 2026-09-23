create table learning.course_versions (
    id uuid primary key,
    course_id uuid not null,
    version text not null,
    slug text not null,
    title text not null,
    summary text not null,
    language text not null,
    exam_profile text not null,
    scope text not null,
    level_label text not null,
    state text not null check (state in ('Draft','Published','Archived')),
    author_name text not null,
    rights_reference text not null,
    estimated_minutes integer not null check (estimated_minutes > 0),
    created_at timestamptz not null,
    published_at timestamptz,
    unique (course_id, version),
    unique (slug, version),
    check ((state = 'Draft' and published_at is null) or
           (state in ('Published','Archived') and published_at is not null))
);

create table learning.curriculum_levels (
    id uuid primary key,
    course_version_id uuid not null references learning.course_versions(id),
    code text not null,
    title text not null,
    sequence integer not null check (sequence > 0),
    recommended_weeks integer not null check (recommended_weeks > 0),
    entry_guidance text not null,
    outcome_guidance text not null,
    checkpoint_question_count integer not null check (checkpoint_question_count > 0),
    checkpoint_pass_rate numeric(5,4) not null check (checkpoint_pass_rate between 0 and 1),
    unique (course_version_id, code),
    unique (course_version_id, sequence)
);

create table learning.knowledge_topics (
    id uuid primary key,
    course_version_id uuid not null references learning.course_versions(id),
    level_id uuid not null references learning.curriculum_levels(id),
    code text not null,
    title_vi text not null,
    title_en text not null,
    category text not null check (category in ('Grammar','Vocabulary','ReadingStrategy','ExamStrategy')),
    primary_tag text not null,
    summary text not null,
    learning_objectives jsonb not null,
    core_knowledge jsonb not null,
    common_traps jsonb not null,
    worked_examples jsonb not null,
    vocabulary_theme text,
    estimated_minutes integer not null check (estimated_minutes between 10 and 180),
    sequence integer not null check (sequence > 0),
    state text not null check (state in ('Draft','Published','Archived')),
    unique (course_version_id, code),
    unique (level_id, sequence),
    check (jsonb_typeof(learning_objectives) = 'array'),
    check (jsonb_typeof(core_knowledge) = 'array'),
    check (jsonb_typeof(common_traps) = 'array'),
    check (jsonb_typeof(worked_examples) = 'array')
);

create table learning.course_modules (
    id uuid primary key,
    course_version_id uuid not null references learning.course_versions(id),
    level_id uuid not null references learning.curriculum_levels(id),
    code text not null,
    title text not null,
    summary text not null,
    sequence integer not null check (sequence > 0),
    unique (course_version_id, code),
    unique (course_version_id, sequence)
);

create table learning.lesson_versions (
    id uuid primary key,
    course_version_id uuid not null references learning.course_versions(id),
    module_id uuid not null references learning.course_modules(id),
    code text not null,
    version text not null,
    lesson_type text not null check (lesson_type in ('Concept','GuidedPractice','Review','Checkpoint','Remediation')),
    title text not null,
    objectives jsonb not null,
    language text not null,
    level_label text not null,
    skill text not null,
    primary_tags jsonb not null,
    estimated_minutes integer not null check (estimated_minutes between 5 and 180),
    sequence integer not null check (sequence > 0),
    quiz_question_count integer check (quiz_question_count between 5 and 50),
    recommended_accuracy numeric(5,4) check (recommended_accuracy between 0 and 1),
    is_level_checkpoint boolean not null default false,
    state text not null check (state in ('Draft','Published','Archived')),
    author_name text not null,
    rights_reference text not null,
    published_at timestamptz,
    unique (course_version_id, code, version),
    unique (course_version_id, sequence),
    check (jsonb_typeof(objectives) = 'array'),
    check (jsonb_typeof(primary_tags) = 'array'),
    check ((state = 'Draft' and published_at is null) or
           (state in ('Published','Archived') and published_at is not null))
);

create table learning.lesson_topics (
    lesson_version_id uuid not null references learning.lesson_versions(id),
    topic_id uuid not null references learning.knowledge_topics(id),
    topic_order integer not null check (topic_order > 0),
    primary key (lesson_version_id, topic_id),
    unique (lesson_version_id, topic_order)
);

create table learning.lesson_prerequisites (
    lesson_version_id uuid not null references learning.lesson_versions(id),
    prerequisite_lesson_version_id uuid not null references learning.lesson_versions(id),
    requirement_type text not null check (requirement_type in ('Recommended','RequiredForCheckpoint')),
    primary key (lesson_version_id, prerequisite_lesson_version_id),
    check (lesson_version_id <> prerequisite_lesson_version_id)
);

create table learning.lesson_pages (
    id uuid primary key,
    lesson_version_id uuid not null references learning.lesson_versions(id),
    title text not null,
    page_order integer not null check (page_order > 0),
    required boolean not null default true,
    unique (lesson_version_id, page_order)
);

create table learning.lesson_blocks (
    id uuid primary key,
    page_id uuid not null references learning.lesson_pages(id),
    block_order integer not null check (block_order > 0),
    block_type text not null check (block_type in ('Text','Rule','Example','Contrast','Table','MiniCheck','Tip')),
    content jsonb not null,
    unique (page_id, block_order),
    check (jsonb_typeof(content) = 'object')
);

create table learning.roadmap_templates (
    id uuid primary key,
    course_version_id uuid not null references learning.course_versions(id),
    version text not null,
    title text not null,
    algorithm_version text not null,
    session_minutes_min integer not null check (session_minutes_min >= 5),
    session_minutes_max integer not null check (session_minutes_max >= session_minutes_min),
    sessions_per_week_min integer not null check (sessions_per_week_min > 0),
    sessions_per_week_max integer not null check (sessions_per_week_max >= sessions_per_week_min),
    review_ratio numeric(5,4) not null check (review_ratio between 0 and 1),
    learning_ratio numeric(5,4) not null check (learning_ratio between 0 and 1),
    buffer_ratio numeric(5,4) not null check (buffer_ratio between 0 and 1),
    personalization_policy jsonb not null,
    state text not null check (state in ('Draft','Published','Archived')),
    unique (course_version_id, version),
    check (review_ratio + learning_ratio + buffer_ratio = 1),
    check (jsonb_typeof(personalization_policy) = 'object')
);

create table learning.roadmap_weeks (
    id uuid primary key,
    roadmap_template_id uuid not null references learning.roadmap_templates(id),
    level_id uuid not null references learning.curriculum_levels(id),
    week_number integer not null check (week_number > 0),
    title text not null,
    weekly_goal text not null,
    vocabulary_theme text,
    checkpoint_kind text check (checkpoint_kind in ('LessonQuiz','MixedReview','LevelCheckpoint')),
    pass_rate numeric(5,4) check (pass_rate between 0 and 1),
    remediation_rule jsonb not null,
    unique (roadmap_template_id, week_number),
    check (jsonb_typeof(remediation_rule) = 'object')
);

create table learning.roadmap_activities (
    id uuid primary key,
    roadmap_week_id uuid not null references learning.roadmap_weeks(id),
    lesson_version_id uuid references learning.lesson_versions(id),
    topic_id uuid references learning.knowledge_topics(id),
    session_order integer not null check (session_order > 0),
    activity_type text not null check (activity_type in
        ('Flashcard','Lesson','Quiz','GuidedPractice','MixedReview','Checkpoint','Remediation')),
    title text not null,
    estimated_minutes integer not null check (estimated_minutes between 5 and 180),
    required boolean not null default true,
    scheduling_policy jsonb not null,
    unique (roadmap_week_id, session_order),
    check (lesson_version_id is not null or topic_id is not null or
        activity_type in ('Flashcard','MixedReview','Remediation')),
    check (jsonb_typeof(scheduling_policy) = 'object')
);

create table learning.placement_recommendation_rules (
    id uuid primary key,
    course_version_id uuid not null references learning.course_versions(id),
    policy_version text not null,
    minimum_answered integer not null check (minimum_answered between 1 and 24),
    correct_min integer not null check (correct_min between 0 and 24),
    correct_max integer not null check (correct_max between correct_min and 24),
    recommended_level_id uuid not null references learning.curriculum_levels(id),
    guidance_label text not null,
    is_certification_claim boolean not null default false,
    unique (course_version_id, policy_version, correct_min, correct_max),
    check (is_certification_claim = false)
);

alter table learning.enrollments
    add constraint enrollments_course_version_fk
    foreign key (course_version_id) references learning.course_versions(id) not valid;

alter table learning.lesson_progress
    add constraint lesson_progress_lesson_version_fk
    foreign key (lesson_version_id) references learning.lesson_versions(id) not valid;

create index ix_topics_primary_tag on learning.knowledge_topics(primary_tag);
create index ix_lessons_module_sequence on learning.lesson_versions(module_id, sequence);
create index ix_roadmap_activities_week on learning.roadmap_activities(roadmap_week_id, session_order);
