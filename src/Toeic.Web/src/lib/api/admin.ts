import { api } from './client';

const key = 'toeic_admin_access_token';
export const adminSession = {
  token: () => sessionStorage.getItem(key),
  save: (token: string) => sessionStorage.setItem(key, token),
  clear: () => sessionStorage.removeItem(key),
};
export class AdminApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = adminSession.token();
  const response = await fetch(`${api.getBaseUrl()}/api/v1/admin${path}`, {
    ...init, cache: 'no-store', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}));
    if (response.status === 401 && path !== '/auth/login') {
      adminSession.clear(); window.dispatchEvent(new Event('toeic-admin-session-expired'));
    }
    throw new AdminApiError(response.status, response.status === 429 ? 'Bạn đã thử đăng nhập nhiều lần. Vui lòng chờ một phút.' :
      response.status === 404 ? 'Dịch vụ quản trị chưa được bật hoặc đường dẫn chưa sẵn sàng.' :
      examErrors[problem.code] ?? problem.message ?? 'Không thể thực hiện yêu cầu. Vui lòng thử lại.');
  }
  return response.status === 204 ? undefined as T : response.json();
}
export const adminError = (error: unknown) => error instanceof AdminApiError ? error.message : 'Không kết nối được máy chủ. Vui lòng thử lại.';

const examErrors: Record<string, string> = {
  DRAFT_REQUEST_INVALID: 'Kiểm tra độ dài câu hỏi, bốn đáp án và các trường nội dung.',
  DRAFT_REVISION_CONFLICT: 'Bản nháp đã được cập nhật ở phiên khác. Xuất JSON để giữ nội dung đang sửa rồi tải bản máy chủ.',
  DRAFT_ALREADY_SUBMITTED: 'Bản nháp đã tạo nguồn kiểm định và không thể sửa trực tiếp. Hãy tạo phiên bản sửa đổi.',
  BLUEPRINT_NOT_PUBLISHED: 'Blueprint không còn được xuất bản hoặc không thuộc Part 5. Chọn blueprint hợp lệ để tạo bản nháp mới.',
  FORM_VERSION_CONFLICT: 'Tên phiên bản đề đã tồn tại. Hãy chọn tên khác hoặc mở đề trong danh sách.',
  FORM_STATE_CONFLICT: 'Trạng thái đề đã thay đổi. Tải lại trước khi thực hiện tiếp.',
  IDEMPOTENCY_CONFLICT: 'Yêu cầu đã được sử dụng với nội dung khác. Tải lại và kiểm tra danh sách đề.',
  FORM_ITEM_TIER_INVALID: 'Có nguồn không còn đủ điều kiện phát hành. Làm mới danh sách nguồn và chọn lại.',
  FORM_ITEM_INVALID: 'Nguồn thiếu thông tin quyền sử dụng, khác policy hoặc có dữ liệu không hợp lệ.',
  FORM_FAMILY_COLLISION: 'Đề có nhiều nguồn thuộc cùng một nhóm câu hỏi. Chỉ chọn một nguồn mỗi nhóm.',
  FORM_EXPOSURE_LIMIT: 'Có nguồn vượt giới hạn lượt tiếp xúc đã cấu hình.',
  FORM_COVERAGE_INVALID: 'Số câu theo Part không khớp với cấu hình đề. Làm mới nguồn và kiểm tra lại.',
  FORM_CONTENT_CORRUPT: 'Nội dung nguồn không khớp phiên bản đã kiểm định. Cần xử lý nguồn trước khi xuất bản.',
  FORM_REQUEST_INVALID: 'Kiểm tra tên phiên bản, policy, cấu hình, thời lượng và số câu (tối đa 200).',
  FORM_ITEM_NOT_FOUND: 'Không tìm thấy nguồn câu hỏi đã chọn.',
};