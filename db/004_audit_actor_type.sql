alter table operations.audit_events
    add column actor_type text not null default 'Legacy';

alter table operations.audit_events
    alter column actor_type drop default;
