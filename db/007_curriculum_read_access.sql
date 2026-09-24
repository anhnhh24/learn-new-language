alter table learning.course_versions
    add column access_model text not null default 'EnrollmentRequired'
    check (access_model in ('Free','EnrollmentRequired','PaidEntitlement'));

alter table learning.lesson_versions
    add column is_sample boolean not null default false;

update learning.lesson_versions lv
set is_sample = true
from learning.course_versions cv
where cv.id = lv.course_version_id
  and cv.slug = 'toeic-reading-grammar-foundation'
  and lv.code = 'LESSON-A1'
  and lv.state = 'Published';

create index ix_course_versions_published_catalog
    on learning.course_versions(published_at desc, title)
    where state = 'Published';

create index ix_lesson_versions_public_lookup
    on learning.lesson_versions(course_version_id, code, published_at desc)
    where state = 'Published';
