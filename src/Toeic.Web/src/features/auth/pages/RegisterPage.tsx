import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { api } from '../../../lib/api/client';
import styles from './Auth.module.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName || !email || !password) {
      setError('Vui lòng điền đầy đủ các trường thông tin bắt buộc.');
      return;
    }

    if (password.length < 12) {
      setError('Mật khẩu phải chứa ít nhất 12 ký tự theo tiêu chuẩn bảo mật hệ thống.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu đã nhập.');
      return;
    }

    if (!agreeTerms) {
      setError('Bạn cần đồng ý với điều khoản tham gia giai đoạn thử nghiệm (Pilot).');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.register(displayName, email, password, agreeTerms);
      if (!res.success) {
        setError(res.error || 'Đăng ký tài khoản không thành công.');
        return;
      }
      navigate('/auth/verify-email', { state: { email } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authForm}>
      <h1 className={styles.title}>Đăng ký tài khoản</h1>
      <p className={styles.subtitle}>
        Bắt đầu chương trình tự học với các đề thi đã qua kiểm chứng.
      </p>

      <div className={styles.pilotNotice}>
        <strong>* Lưu ý giai đoạn Pilot:</strong> Hệ thống sử dụng nội dung tạo tự động kết hợp bộ lọc chất lượng. Chúng tôi không cam kết quy đổi trực tiếp sang điểm thi ETS chính thức.
      </div>

      {error && (
        <Alert variant="danger" title="Lỗi đăng ký">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Input
          type="text"
          label="Tên hiển thị"
          placeholder="Ví dụ: Hoàng Anh"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          autoComplete="name"
        />

        <Input
          type="email"
          label="Địa chỉ email"
          placeholder="tenban@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <Input
          type="password"
          label="Mật khẩu"
          placeholder="Từ 12 đến 128 ký tự"
          hint="Cho phép dán và sử dụng phần mềm quản lý mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />

        <Input
          type="password"
          label="Xác nhận mật khẩu"
          placeholder="Nhập lại mật khẩu"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />

        <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
          <input
            type="checkbox"
            id="terms"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            style={{ marginTop: '4px', cursor: 'pointer' }}
          />
          <label htmlFor="terms" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', lineHeight: '1.4', cursor: 'pointer' }}>
            Tôi xác nhận đủ độ tuổi tham gia chương trình thí điểm và đồng ý với các điều khoản bảo mật dữ liệu học tập cá nhân.
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className={styles.submitBtn}
          isLoading={isLoading}
        >
          Tạo tài khoản
        </Button>
      </form>

      <div className={styles.footerLinks}>
        <span>
          Đã có tài khoản?{' '}
          <Link to="/auth/login" className={styles.link}>
            Đăng nhập ngay
          </Link>
        </span>
      </div>
    </div>
  );
}
