create table content.admin_exam_publications (
    admin_id uuid not null references identity_data.admin_accounts(user_id),
    operation_id uuid not null,
    request_hash char(64) not null,
    form_id uuid not null references content.form_versions(id),
    created_at timestamptz not null,
    primary key(admin_id, operation_id)
);
