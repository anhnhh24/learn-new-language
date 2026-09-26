-- Migration 025: Seed sample accounts for each role in TOEIC system
-- Password for all accounts: ToeicMaster@2026!
-- Hashes generated via ASP.NET Core Identity PasswordHasher<string>

-- 1. Insert or update users into identity_data.users
insert into identity_data.users (
    id,
    email_normalized,
    password_hash,
    display_name,
    timezone,
    status,
    email_verified_at,
    created_at
) values
-- Learner 1: Học viên nền tảng
(
    'a1000000-0000-0000-0000-000000000001'::uuid,
    'LEARNER@TOEIC.VN',
    'AQAAAAIAAYagAAAAEHtdaV8pwmzSMEGrXyqTrtO7+L3aMHOwCABIvX0l2O//2E1DUg5qXlEDjKmu3/yBHA==',
    'Nguyễn Văn Học (Học viên)',
    'Asia/Ho_Chi_Minh',
    'Active',
    now(),
    now()
),
-- Learner 2: Học viên nâng cao (Mục tiêu 850+)
(
    'a1000000-0000-0000-0000-000000000002'::uuid,
    'LEARNER.ADVANCED@TOEIC.VN',
    'AQAAAAIAAYagAAAAEIMUEq2QwNAkppmOyFTm4Q8mwX2uqjBaqSY4yIoWlZT50RXc4Y3i4pJv/Z8/5+1LCQ==',
    'Trần Thị Mai (Mục tiêu 850+)',
    'Asia/Ho_Chi_Minh',
    'Active',
    now(),
    now()
),
-- Admin: Quản trị viên hệ thống
(
    'a1000000-0000-0000-0000-000000000003'::uuid,
    'ADMIN@TOEIC.VN',
    'AQAAAAIAAYagAAAAEBfL1jgB/dMm2tpa+uLt4wrG4DiViRPRttDkKKmA0u3ZXMZx5HJgv8NdMAF9dTadHQ==',
    'Quản Trị Viên Hệ Thống',
    'Asia/Ho_Chi_Minh',
    'Active',
    now(),
    now()
),
-- Editor: Biên tập viên / Giáo viên soạn đề
(
    'a1000000-0000-0000-0000-000000000004'::uuid,
    'EDITOR@TOEIC.VN',
    'AQAAAAIAAYagAAAAEAAY/J0mgAZbCAIX3NfuVpyOHBwbnCvpJ3VF4/zr1qysI4X1z/fEB0atlyJacCmfLQ==',
    'Lê Hoàng (Giáo viên / Biên tập đề)',
    'Asia/Ho_Chi_Minh',
    'Active',
    now(),
    now()
),
-- Reviewer: Kiểm định viên chất lượng
(
    'a1000000-0000-0000-0000-000000000005'::uuid,
    'REVIEWER@TOEIC.VN',
    'AQAAAAIAAYagAAAAELzzDAN4o0J2e0XcTzs/Xc7u9wACefZpfaY6yoTjS0WORD9n9Sz66zYlmR9XvX7QyQ==',
    'Phạm Minh Thảo (Kiểm định chất lượng)',
    'Asia/Ho_Chi_Minh',
    'Active',
    now(),
    now()
),
-- Support: Nhân viên hỗ trợ học viên
(
    'a1000000-0000-0000-0000-000000000006'::uuid,
    'SUPPORT@TOEIC.VN',
    'AQAAAAIAAYagAAAAEOXNXoCXzFz3tNb+hlUcDW+HWr6tP9u8Hnlx2ua2/0Kb6RtH83sGPznil2PY0+sVCg==',
    'Đỗ Thu Trang (Hỗ trợ học viên)',
    'Asia/Ho_Chi_Minh',
    'Active',
    now(),
    now()
)
on conflict (email_normalized) do update set
    password_hash = excluded.password_hash,
    display_name = excluded.display_name,
    status = 'Active',
    email_verified_at = coalesce(identity_data.users.email_verified_at, now());

-- 2. Cấp quyền quản trị (Admin Console Membership) cho các vai trò quản trị nội bộ
insert into identity_data.admin_accounts (user_id, enabled, failed_login_count, locked_until)
values
    ('a1000000-0000-0000-0000-000000000003'::uuid, true, 0, null),
    ('a1000000-0000-0000-0000-000000000004'::uuid, true, 0, null),
    ('a1000000-0000-0000-0000-000000000005'::uuid, true, 0, null),
    ('a1000000-0000-0000-0000-000000000006'::uuid, true, 0, null)
on conflict (user_id) do update set
    enabled = true,
    failed_login_count = 0,
    locked_until = null;

-- 3. Tạo hồ sơ học tập mẫu (Learner Profiles) cho học viên
insert into learning.learner_profiles (
    learner_id,
    revision,
    goal,
    self_level,
    minutes_per_day,
    study_days,
    interests,
    onboarding_completed_at,
    placement_skipped_at,
    email_reminders,
    in_app_reminders,
    reminder_minute,
    quiet_start_minute,
    quiet_end_minute
) values
(
    'a1000000-0000-0000-0000-000000000001'::uuid,
    1,
    'general',
    'beginner',
    30,
    array[1,2,3,4,5],
    array['grammar', 'business_communication'],
    now(),
    null,
    true,
    true,
    480,
    1260,
    480
),
(
    'a1000000-0000-0000-0000-000000000002'::uuid,
    1,
    'reading',
    'advanced',
    45,
    array[0,1,2,3,4,5,6],
    array['double_passages', 'invoices', 'paraphrasing'],
    now(),
    now(),
    true,
    true,
    510,
    1320,
    420
)
on conflict (learner_id) do update set
    goal = excluded.goal,
    self_level = excluded.self_level,
    minutes_per_day = excluded.minutes_per_day,
    study_days = excluded.study_days,
    interests = excluded.interests;
