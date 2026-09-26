export interface SampleAccount {
  id: string;
  roleKey: 'Learner' | 'LearnerAdvanced' | 'SuperAdmin' | 'ContentEditor' | 'ContentReviewer' | 'SupportStaff';
  roleName: string;
  roleBadge: string;
  displayName: string;
  email: string;
  password: string;
  scope: 'learner' | 'admin';
  description: string;
  portalUrl: string;
  badgeVariant: 'primary' | 'success' | 'warning' | 'info' | 'default';
}

export const SAMPLE_PASSWORD = 'ToeicMaster@2026!';

export const SAMPLE_ACCOUNTS: SampleAccount[] = [
  {
    id: 'a1000000-0000-0000-0000-000000000001',
    roleKey: 'Learner',
    roleName: 'Học viên nền tảng',
    roleBadge: 'Học viên (500–650)',
    displayName: 'Nguyễn Văn Học (Học viên)',
    email: 'learner@toeic.vn',
    password: SAMPLE_PASSWORD,
    scope: 'learner',
    description: 'Học viên theo lộ trình Level A–B, luyện đề Part 5/7, ôn flashcards và sổ lỗi sai.',
    portalUrl: '/learn/today',
    badgeVariant: 'primary',
  },
  {
    id: 'a1000000-0000-0000-0000-000000000002',
    roleKey: 'LearnerAdvanced',
    roleName: 'Học viên mục tiêu cao',
    roleBadge: 'Học viên (850+)',
    displayName: 'Trần Thị Mai (Mục tiêu 850+)',
    email: 'learner.advanced@toeic.vn',
    password: SAMPLE_PASSWORD,
    scope: 'learner',
    description: 'Học viên chuyên sâu Level D, hoàn thành bài chẩn đoán và các bài thi Checkpoint.',
    portalUrl: '/learn/today',
    badgeVariant: 'info',
  },
  {
    id: 'a1000000-0000-0000-0000-000000000003',
    roleKey: 'SuperAdmin',
    roleName: 'Quản trị viên hệ thống',
    roleBadge: 'SuperAdmin',
    displayName: 'Quản Trị Viên Hệ Thống',
    email: 'admin@toeic.vn',
    password: SAMPLE_PASSWORD,
    scope: 'admin',
    description: 'Toàn quyền cấu hình hệ thống, quản trị tài khoản, kiểm tra audit log và tác vụ worker.',
    portalUrl: '/admin/overview',
    badgeVariant: 'danger' as any,
  },
  {
    id: 'a1000000-0000-0000-0000-000000000004',
    roleKey: 'ContentEditor',
    roleName: 'Biên tập viên / Giáo viên',
    roleBadge: 'Content Editor',
    displayName: 'Lê Hoàng (Giáo viên / Biên tập đề)',
    email: 'editor@toeic.vn',
    password: SAMPLE_PASSWORD,
    scope: 'admin',
    description: 'Soạn thảo câu hỏi Part 5, biên soạn bài đọc Part 7, quản lý giáo trình và đề thi.',
    portalUrl: '/admin/question-drafts',
    badgeVariant: 'warning',
  },
  {
    id: 'a1000000-0000-0000-0000-000000000005',
    roleKey: 'ContentReviewer',
    roleName: 'Kiểm định viên chất lượng',
    roleBadge: 'Content Reviewer',
    displayName: 'Phạm Minh Thảo (Kiểm định chất lượng)',
    email: 'reviewer@toeic.vn',
    password: SAMPLE_PASSWORD,
    scope: 'admin',
    description: 'Thẩm định đáp án, kiểm duyệt vùng cách ly (Quarantine), kiểm tra blueprint đề thi.',
    portalUrl: '/admin/quarantine',
    badgeVariant: 'success',
  },
  {
    id: 'a1000000-0000-0000-0000-000000000006',
    roleKey: 'SupportStaff',
    roleName: 'Nhân viên hỗ trợ học viên',
    roleBadge: 'Support Staff',
    displayName: 'Đỗ Thu Trang (Hỗ trợ học viên)',
    email: 'support@toeic.vn',
    password: SAMPLE_PASSWORD,
    scope: 'admin',
    description: 'Tiếp nhận báo lỗi câu hỏi từ học viên, quản lý phiếu hỗ trợ kỹ thuật và tài khoản.',
    portalUrl: '/admin/support',
    badgeVariant: 'default',
  },
];
