import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { api } from '../../../lib/api/client';
import styles from './Auth.module.css';

type Mode = 'verify' | 'forgot' | 'reset';

export function AccountActionPage({ mode }: { mode: Mode }) {
  const location = useLocation();
  const [token] = useState(() => new URLSearchParams(location.hash.slice(1)).get('token') ?? '');
  const [email, setEmail] = useState<string>(location.state?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  useEffect(() => {
    if (location.hash) window.history.replaceState(window.history.state, '', location.pathname);
  }, [location.hash, location.pathname]);

  const title = mode === 'verify' ? 'Xác minh email'
    : mode === 'forgot' ? 'Khôi phục mật khẩu' : 'Đặt mật khẩu mới';

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (mode === 'reset' && (password.length < 12 || password.length > 128)) {
      setError('Mật khẩu cần từ 12 đến 128 ký tự.');
      return;
    }
    if (mode === 'reset' && password !== confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setBusy(true);
    try {
      const action = mode === 'reset' ? 'reset-password'
        : mode === 'forgot' ? 'forgot-password' : token ? 'verify-email' : 'resend-verification';
      const body = mode === 'reset' ? { token, password }
        : mode === 'verify' && token ? { token } : { email };
      const result = await api.accountRequest(action, body);
      if (!result.success) {
        setError(result.error ?? 'Yêu cầu chưa thực hiện được.');
        return;
      }
      if (mode === 'reset') {
        localStorage.removeItem('toeic_access_token');
        localStorage.removeItem('toeic_user');
      }
      setCompleted(mode === 'reset' || (mode === 'verify' && !!token));
      setMessage(mode === 'reset' ? 'Mật khẩu đã được đổi. Hãy đăng nhập lại.'
        : mode === 'verify' && token ? 'Email đã được xác minh. Bạn có thể đăng nhập.'
        : 'Yêu cầu đã được tiếp nhận. Nếu email phù hợp, bạn sẽ nhận được hướng dẫn. Hãy kiểm tra cả thư mục spam.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.authForm}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>
        {mode === 'verify'
          ? 'Mở liên kết trong email và chọn xác minh. Liên kết có hiệu lực trong 24 giờ.'
          : mode === 'forgot'
            ? 'Nhập email tài khoản để yêu cầu liên kết khôi phục có hiệu lực trong 30 phút.'
            : 'Chọn mật khẩu từ 12 đến 128 ký tự. Các phiên đăng nhập cũ sẽ được thu hồi.'}
      </p>
      <div aria-live="polite">
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}
      </div>
      {mode === 'reset' && !token ? (
        <Alert variant="warning">
          Thiếu liên kết khôi phục. <Link to="/auth/forgot-password">Yêu cầu liên kết mới</Link>.
        </Alert>
      ) : !completed && (
        <form onSubmit={submit}>
          {(mode === 'forgot' || (mode === 'verify' && !token)) && (
            <Input type="email" label="Địa chỉ email" autoComplete="email"
              required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} />
          )}
          {mode === 'reset' && (
            <>
              <Input type="password" label="Mật khẩu mới" autoComplete="new-password"
                required minLength={12} maxLength={128} value={password}
                onChange={event => setPassword(event.target.value)} />
              <Input type="password" label="Xác nhận mật khẩu" autoComplete="new-password"
                required minLength={12} maxLength={128} value={confirm}
                onChange={event => setConfirm(event.target.value)} />
            </>
          )}
          <Button type="submit" isLoading={busy} className={styles.submitBtn}>
            {mode === 'reset' ? 'Lưu mật khẩu mới'
              : mode === 'verify' && token ? 'Xác minh email'
                : mode === 'verify' ? 'Gửi lại email xác minh' : 'Yêu cầu liên kết khôi phục'}
          </Button>
        </form>
      )}
      <div className={styles.footerLinks}>
        <Link to="/auth/login" className={styles.link}>Quay lại đăng nhập</Link>
        {mode === 'verify' && token && !completed &&
          <Link to="/auth/verify-email" className={styles.link} reloadDocument>Yêu cầu email mới</Link>}
      </div>
    </div>
  );
}

export function VerifyEmailPage() { return <AccountActionPage mode="verify" />; }
export function ForgotPasswordPage() { return <AccountActionPage mode="forgot" />; }
export function ResetPasswordPage() { return <AccountActionPage mode="reset" />; }
