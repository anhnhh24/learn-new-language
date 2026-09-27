create table content.part6_drafts (
    id uuid primary key,
    creator_id uuid not null references identity_data.admin_accounts(user_id),
    blueprint_id uuid not null references content.blueprint_versions(id),
    previous_revision_id uuid references content.question_revisions(id),
    family_id text not null,
    stimulus_id uuid not null,
    title text not null,
    body jsonb not null,
    revision bigint not null default 0 check(revision>=0),
    source_id uuid unique references content.question_revisions(id),
    created_at timestamptz not null,
    updated_at timestamptz not null
);
create index ix_part6_drafts_updated on content.part6_drafts(updated_at desc,id);

update content.exam_profiles set title='Luyện Reading tùy chỉnh (Part 5 / Part 6 / Part 7)',
structure_json='[{"part":"Part5","min":0,"max":200},{"part":"Part6","min":0,"max":200},{"part":"Part7DirectEvidence","min":0,"max":200}]'
where version='TOEIC-R-CUSTOM-PRACTICE-v1';

insert into content.exam_profiles(version,title,kind,publication_enabled,duration_seconds,total_questions,exact_structure,structure_json)
values('TOEIC-R-STRUCTURE-100-v1','Reading 100 câu: Part 5–7 (chưa kiểm cơ cấu passage)','Practice',true,4500,100,true,
'[{"part":"Part5","count":30},{"part":"Part6","count":16},{"part":"Part7DirectEvidence","count":54}]');
