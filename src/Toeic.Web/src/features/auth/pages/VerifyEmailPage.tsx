import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import styles from './Auth.module.css';

export function VerifyEmailPage() {
  const [resendCount, setResendCount] = useState(0);
  const [isSent, setIsSent] = useState(false);
  const [isVerified] = useState(false);

  const handleResend = () => {
    if (resendCount >= 3) {
      alert('Bạn đã vượt quá giới hạn gửi lại mã (tối đa 3 lần/giờ). Vui lòng thử lại sau.');
      return;
    }
    setResendCount((prev) => prev + 1);
    setIsSent(true);
  };

  return (
    <div className={styles.authForm}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
        {isVerified ? (
          <CheckCircle2 size={48} style={{ color: 'var(--color-success)', margin: '0 auto' }} />
        ) : (
          <Mail size={48} style={{ color: 'var(--color-primary)', margin: '0 auto' }} />
        )}
      </div>

      <h1 className={styles.title} style={{ textAlign: 'center' }}>
        {isVerified ? 'Tài khoản đã xác minh' : 'Xác minh địa chỉ Email'}
      </h1>

      <p className={styles.subtitle} style={{ textAlign: 'center' }}>
        {isVerified
          ? 'Email của bạn đã được kích hoạt thành công. Bạn có thể sử dụng đầy đủ các tính năng lưu bài.'
          : 'Chúng tôi đã gửi một liên kết kích hoạt dùng một lần (hạn 24 giờ) tới hòm thư của bạn.'}
      </p>

      {!isVerified ? (
        <>
          <div className={styles.pilotNotice}>
            <strong>* Giới hạn bảo mật (FR-01):</strong> Token xác minh chỉ dùng được một lần. Mỗi tài khoản được gửi lại tối đa 3 lần/giờ để chống lạm dụng.
          </div>

          {isSent && (
            <div style={{
              backgroundColor: 'var(--color-success-subtle)',
              border: '1px solid #a6f4c5',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-success)',
              marginBottom: 'var(--space-4)',
              textAlign: 'center'
            }}>
              Đã gửi lại thư xác minh! (Đã dùng {resendCount}/3 lượt trong giờ này)
            </div>
          )}

          <Button
            variant="secondary"
            size="md"
            onClick={handleResend}
            disabled={resendCount >= 3}
            style={{ width: '100%', marginBottom: 'var(--space-3)' }}
          >
            {resendCount >= 3 ? 'Đã hết lượt gửi lại trong giờ' : 'Gửi lại email xác minh'}
          </Button>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-2)' }}>
            <Link to="/learn/today" className={styles.link} style={{ fontSize: 'var(--font-size-sm)' }}>
              Tiếp tục với tài khoản chưa xác minh <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </Link>
          </div>
        </>
      ) : (
        <Button
          variant="primary"
          size="lg"
          onClick={() => window.location.href = '/learn/today'}
          style={{ width: '100%' }}
        >
          Bắt đầu học ngay
        </Button>
      )}

      <div className={styles.footerLinks}>
        <span>
          Cần hỗ trợ kỹ thuật?{' '}
          <Link to="/learn/support" className={styles.link}>
            Gửi yêu cầu trợ giúp
          </Link>
        </span>
      </div>
    </div>
  );
}
