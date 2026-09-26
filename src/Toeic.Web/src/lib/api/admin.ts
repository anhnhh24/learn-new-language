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
      problem.message ?? 'Không thể thực hiện yêu cầu. Vui lòng thử lại.');
  }
  return response.status === 204 ? undefined as T : response.json();
}
export const adminError = (error: unknown) => error instanceof AdminApiError ? error.message : 'Không kết nối được máy chủ. Vui lòng thử lại.';
