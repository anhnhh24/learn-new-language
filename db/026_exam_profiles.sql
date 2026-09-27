create table content.exam_profiles (
    version text primary key,
    title text not null,
    kind text not null check(kind in ('Practice','FullToeic')),
    publication_enabled boolean not null,
    duration_seconds integer not null check(duration_seconds between 60 and 14400),
    total_questions integer not null check(total_questions between 1 and 200),
    exact_structure boolean not null,
    structure_json jsonb not null,
    created_at timestamptz not null default now()
);

insert into content.exam_profiles(version,title,kind,publication_enabled,duration_seconds,total_questions,exact_structure,structure_json)
values
('TOEIC-R-CUSTOM-PRACTICE-v1','Luyện Reading tùy chỉnh (Part 5 / Part 7)','Practice',true,1800,200,false,
 '[{"part":"Part5","min":0,"max":200},{"part":"Part7DirectEvidence","min":0,"max":200}]'),
('TOEIC-R-P5P7-84-v1','Reading 84 câu: Part 5 + Part 7','Practice',true,4500,84,true,
 '[{"part":"Part5","count":30},{"part":"Part7DirectEvidence","count":54}]'),
('TOEIC-LR-FULL-200-v1','TOEIC Listening & Reading đầy đủ 200 câu','FullToeic',false,7200,200,true,
 '[{"part":"Part1","count":6},{"part":"Part2","count":25},{"part":"Part3","count":39},{"part":"Part4","count":30},{"part":"Part5","count":30},{"part":"Part6","count":16},{"part":"Part7Single","count":29},{"part":"Part7Multiple","count":25}]');
