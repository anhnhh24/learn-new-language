import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { api } from '../../../lib/api/client';
import styles from './Auth.module.css';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.login(email, password);
      if (!res.success) {
        setError(res.error || 'Email hoặc mật khẩu không chính xác.');
        return;
      }
      navigate('/learn/today');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ xác thực.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authForm}>
      <h1 className={styles.title}>Đăng nhập</h1>
      <p className={styles.subtitle}>
        Tiếp tục hành trình luyện thi TOEIC Listening & Reading của bạn.
      </p>

      {error && (
        <Alert variant="danger" title="Lỗi xác thực">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Input
          type="email"
          label="Địa chỉ email"
          placeholder="tenban@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
        />

        <Input
          type="password"
          label="Mật khẩu"
          placeholder="Tối thiểu 12 ký tự"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <div className={styles.helperRow}>
          <a href="#forgot" className={styles.forgotLink} onClick={(e) => { e.preventDefault(); alert('Liên kết đặt lại mật khẩu đã được gửi (mô phỏng).'); }}>
            Quên mật khẩu?
          </a>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className={styles.submitBtn}
          isLoading={isLoading}
        >
          Đăng nhập vào hệ thống
        </Button>
      </form>

      <div className={styles.footerLinks}>
        <span>
          Chưa có tài khoản học viên?{' '}
          <Link to="/auth/register" className={styles.link}>
            Đăng ký tài khoản mới
          </Link>
        </span>
        <span>
          Hoặc thử ngay{' '}
          <Link to="/auth/onboarding" className={styles.link}>
            Khảo sát mục tiêu ban đầu
          </Link>
        </span>
      </div>
    </div>
  );
}
