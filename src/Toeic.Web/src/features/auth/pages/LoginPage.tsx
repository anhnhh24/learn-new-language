import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { api } from '../../../lib/api/client';
import { adminSession } from '../../../lib/api/admin';
import { SAMPLE_ACCOUNTS, SampleAccount } from '../../../lib/sampleAccounts';
import { SampleAccountsSelector } from '../../../components/auth/SampleAccountsSelector';
import styles from './Auth.module.css';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const performLogin = async (loginEmail: string, loginPass: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.login(loginEmail, loginPass);
      if (!res.success) {
        // Check if matches sample account
        const sample = SAMPLE_ACCOUNTS.find(
          (a) => a.email.toLowerCase() === loginEmail.trim().toLowerCase() && loginPass === a.password
        );
        if (sample) {
          localStorage.setItem('toeic_access_token', `demo_token_${sample.id}`);
          localStorage.setItem(
            'toeic_user',
            JSON.stringify({
              id: sample.id,
              email: sample.email,
              displayName: sample.displayName,
              role: sample.roleKey,
            })
          );
          if (sample.scope === 'admin') {
            adminSession.save(`adm_demo_${sample.id}`);
            navigate(sample.portalUrl);
            return;
          }
          navigate('/learn/today');
          return;
        }
        setError(res.error || 'Email hoặc mật khẩu không chính xác.');
        return;
      }
      navigate('/learn/today');
    } catch (err: unknown) {
      // Fallback for sample accounts
      const sample = SAMPLE_ACCOUNTS.find(
        (a) => a.email.toLowerCase() === loginEmail.trim().toLowerCase() && loginPass === a.password
      );
      if (sample) {
        localStorage.setItem('toeic_access_token', `demo_token_${sample.id}`);
        localStorage.setItem(
          'toeic_user',
          JSON.stringify({
            id: sample.id,
            email: sample.email,
            displayName: sample.displayName,
            role: sample.roleKey,
          })
        );
        if (sample.scope === 'admin') {
          adminSession.save(`adm_demo_${sample.id}`);
          navigate(sample.portalUrl);
          return;
        }
        navigate('/learn/today');
        return;
      }
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ xác thực.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    await performLogin(email, password);
  };

  const handleFillCredentials = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError(null);
  };

  const handleDirectLogin = async (account: SampleAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    await performLogin(account.email, account.password);
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
          <Link to="/auth/forgot-password" className={styles.forgotLink}>
            Quên mật khẩu?
          </Link>
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

      <SampleAccountsSelector
        onFillCredentials={handleFillCredentials}
        onDirectLogin={handleDirectLogin}
        defaultScope="all"
      />

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
