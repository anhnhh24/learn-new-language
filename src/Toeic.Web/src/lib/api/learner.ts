import { api } from './client';

export class LearnerApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export async function learnerRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('toeic_access_token');
  if (!token) throw new LearnerApiError(401, 'AUTHENTICATION_REQUIRED', 'Vui lòng đăng nhập để tiếp tục.');
  const response = await fetch(`${api.getBaseUrl()}/api/v1/me${path}`, {
    ...init, cache: 'no-store', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers },
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}));
    const messages: Record<string, string> = {
      NEW_CARD_DAILY_LIMIT: 'Bạn đã dùng hết số thẻ mới hôm nay. Vẫn có thể ôn các thẻ đã học.',
      REVIEW_REVEAL_REQUIRED: 'Đáp án đã hết hạn. Hãy tải lại hàng đợi và mở đáp án.',
      FLASHCARD_CONFLICT: 'Thẻ đã thay đổi ở một phiên khác. Hãy tải lại dữ liệu.',
      ERROR_ENTRY_CONFLICT: 'Lỗi sai đã được cập nhật ở một phiên khác. Hãy tải lại dữ liệu.',
      CURRENT_PASSWORD_INVALID: 'Mật khẩu hiện tại chưa đúng.',
      QUIZ_NOT_READY: 'Bài này chưa có bộ câu hỏi sẵn sàng.',
    };
    throw new LearnerApiError(response.status, problem.code ?? 'REQUEST_FAILED',
      response.status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' :
      messages[problem.code] ?? problem.message ?? 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.');
  }
  return response.status === 204 ? undefined as T : response.json();
}

export function errorMessage(error: unknown): string {
  return error instanceof LearnerApiError ? error.message : 'Không kết nối được máy chủ. Hãy kiểm tra mạng và thử lại.';
}
export const jsonBody = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });
