import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import styles from './Auth.module.css';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // FR-03: Always display generic notice regardless of email existence
      setIsSubmitted(true);
    }, 600);
  };

  return (
    <div className={styles.authForm}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-3)' }}>
        <KeyRound size={40} style={{ color: 'var(--color-primary)', margin: '0 auto' }} />
      </div>

      <h1 className={styles.title} style={{ textAlign: 'center' }}>Khôi phục mật khẩu</h1>
      <p className={styles.subtitle} style={{ textAlign: 'center' }}>
        Nhập địa chỉ email đăng ký tài khoản của bạn để nhận hướng dẫn đặt lại mật khẩu.
      </p>

      {isSubmitted ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
          <CheckCircle2 size={36} style={{ color: 'var(--color-success)', margin: '0 auto var(--space-3)' }} />
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
            Yêu cầu đã được tiếp nhận
          </h3>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
            Nếu email của bạn tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu dùng một lần (có hiệu lực trong 30 phút).
          </p>
          <div style={{ marginTop: 'var(--space-6)' }}>
            <Link to="/auth/login" className={styles.link} style={{ fontSize: 'var(--font-size-sm)' }}>
              <ArrowLeft size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Quay lại Đăng nhập
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <Input
            type="email"
            label="Địa chỉ email"
            placeholder="tenban@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className={styles.submitBtn}
            isLoading={isLoading}
          >
            Gửi liên kết khôi phục
          </Button>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
            <Link to="/auth/login" className={styles.link} style={{ fontSize: 'var(--font-size-xs)' }}>
              <ArrowLeft size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Quay lại Đăng nhập
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
