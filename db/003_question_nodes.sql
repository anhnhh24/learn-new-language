create table content.question_nodes (
    id uuid primary key,
    source_revision_id uuid not null references content.question_revisions(id),
    stable_id text not null,
    question_order integer not null check (question_order > 0),
    unique (source_revision_id, stable_id),
    unique (source_revision_id, question_order)
);

-- Reusing each legacy UUID preserves every pre-migration form and telemetry FK.
-- Part 5 remains valid because it contains one question. Pre-migration grouped
-- content remains safely unservable and must be revised with explicit nodes.
insert into content.question_nodes (id, source_revision_id, stable_id, question_order)
select id, id, 'legacy-single-question', 1
from content.question_revisions;

alter table content.form_questions
    drop constraint form_questions_question_revision_id_fkey,
    add constraint form_questions_question_revision_id_fkey
        foreign key (question_revision_id) references content.question_nodes(id);

alter table assessment.item_exposures
    drop constraint item_exposures_item_revision_id_fkey,
    add constraint item_exposures_item_revision_id_fkey
        foreign key (item_revision_id) references content.question_nodes(id);

alter table assessment.item_responses
    drop constraint item_responses_item_revision_id_fkey,
    add constraint item_responses_item_revision_id_fkey
        foreign key (item_revision_id) references content.question_nodes(id);

alter table assessment.learner_issue_reports
    drop constraint learner_issue_reports_item_revision_id_fkey,
    add constraint learner_issue_reports_item_revision_id_fkey
        foreign key (item_revision_id) references content.question_nodes(id);

alter table assessment.item_statistic_snapshots
    drop constraint item_statistic_snapshots_item_revision_id_fkey,
    add constraint item_statistic_snapshots_item_revision_id_fkey
        foreign key (item_revision_id) references content.question_nodes(id);

alter table assessment.quarantine_decisions
    drop constraint quarantine_decisions_item_revision_id_fkey,
    add constraint quarantine_decisions_item_revision_id_fkey
        foreign key (item_revision_id) references content.question_nodes(id);
