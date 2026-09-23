import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button, Badge } from '../../../components/ui';
import { PaymentStatus } from '../../../types/billing';
import styles from './Billing.module.css';

export function PaymentStatusPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const state = (location.state || {}) as {
    orderId?: string;
    courseId?: string;
    courseTitle?: string;
    amountVnd?: number;
    paymentMethod?: string;
  };

  const amountVnd = state.amountVnd || 590000;
  const courseTitle = state.courseTitle || 'TOEIC Luyện thi Căn bản & Mở rộng 550–750';
  const effectiveOrderId = orderId || state.orderId || 'ORD-892104';

  const [status, setStatus] = useState<PaymentStatus>('PendingPayment');
  const [secondsRemaining, setSecondsRemaining] = useState(1800); // 30 mins
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 30-minute countdown timer per FR-39
  useEffect(() => {
    if (status !== 'PendingPayment') return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus('Expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Simulate server webhook reconciliation (FR-40)
  const handleCheckReconciliation = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setStatus('Paid');
    }, 1200);
  };

  return (
    <div className={styles.page}>
      <div className="content-container">
        <div className={styles.statusContainer}>
          {status === 'PendingPayment' && (
            <div className={styles.card}>
              <div className={`${styles.statusIcon} ${styles.statusPending}`}>
                <Clock size={32} />
              </div>
              <h1 className={styles.title} style={{ fontSize: '22px' }}>Đang chờ thanh toán đơn hàng</h1>
              <p className={styles.description}>
                Mã đơn hàng: <strong>{effectiveOrderId}</strong> • Hết hạn sau: <span style={{ color: '#c5221f', fontWeight: 700 }}>{formattedTime}</span>
              </p>

              {/* QR Container */}
              <div className={styles.qrContainer}>
                <div className={styles.qrPlaceholder}>
                  <div style={{ padding: '16px', background: '#0052cc', color: '#fff', borderRadius: '4px', marginBottom: '8px', fontWeight: 700 }}>
                    VietQR 24/7
                  </div>
                  <span>[Mã QR Thanh toán tự động]</span>
                  <span style={{ fontSize: '11px', marginTop: '4px' }}>Quét bằng ứng dụng Ngân hàng bất kỳ</span>
                </div>
                <Badge variant="info">Chính thức tích hợp hệ sinh thái Napas</Badge>
              </div>

              {/* Transfer Details */}
              <div className={styles.bankTransferInfo}>
                <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--color-ink-primary)' }}>
                  Thông tin chuyển khoản thủ công nếu không quét được QR:
                </div>
                <div className={styles.bankRow}>
                  <span style={{ color: 'var(--color-ink-secondary)' }}>Ngân hàng thụ hưởng:</span>
                  <span style={{ fontWeight: 600 }}>TMCP Ngoại Thương Việt Nam (Vietcombank)</span>
                </div>
                <div className={styles.bankRow}>
                  <span style={{ color: 'var(--color-ink-secondary)' }}>Số tài khoản:</span>
                  <span>
                    <strong>0071000987654</strong>
                    <button 
                      type="button" 
                      className={styles.copyBadge}
                      onClick={() => copyToClipboard('0071000987654', 'acc')}
                    >
                      {copiedField === 'acc' ? 'Đã sao chép' : 'Sao chép'}
                    </button>
                  </span>
                </div>
                <div className={styles.bankRow}>
                  <span style={{ color: 'var(--color-ink-secondary)' }}>Chủ tài khoản:</span>
                  <span style={{ fontWeight: 600 }}>TOEIC LEARNING PLATFORM VIETNAM</span>
                </div>
                <div className={styles.bankRow}>
                  <span style={{ color: 'var(--color-ink-secondary)' }}>Số tiền chính xác:</span>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                    {amountVnd.toLocaleString('vi-VN')} đ
                    <button 
                      type="button" 
                      className={styles.copyBadge}
                      onClick={() => copyToClipboard(amountVnd.toString(), 'amount')}
                    >
                      {copiedField === 'amount' ? 'Đã sao chép' : 'Sao chép'}
                    </button>
                  </span>
                </div>
                <div className={styles.bankRow}>
                  <span style={{ color: 'var(--color-ink-secondary)' }}>Nội dung chuyển khoản (Bắt buộc):</span>
                  <span>
                    <strong style={{ color: '#b06000' }}>TOEIC {effectiveOrderId}</strong>
                    <button 
                      type="button" 
                      className={styles.copyBadge}
                      onClick={() => copyToClipboard(`TOEIC ${effectiveOrderId}`, 'syntax')}
                    >
                      {copiedField === 'syntax' ? 'Đã sao chép' : 'Sao chép'}
                    </button>
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Button 
                  variant="primary" 
                  onClick={handleCheckReconciliation} 
                  isLoading={isVerifying}
                >
                  <RefreshCw size={16} /> Kiểm tra trạng thái đã chuyển tiền
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => navigate('/learn/courses')}
                >
                  Để thanh toán sau
                </Button>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--color-ink-tertiary)', marginTop: '16px' }}>
                * Hệ thống tự động kích hoạt quyền học ngay sau khi nhận được thông báo tín dụng từ ngân hàng đối tác (FR-40).
              </p>
            </div>
          )}

          {status === 'Paid' && (
            <div className={styles.card}>
              <div className={`${styles.statusIcon} ${styles.statusSuccess}`}>
                <CheckCircle2 size={36} />
              </div>
              <h1 className={styles.title} style={{ color: '#137333' }}>Thanh toán thành công!</h1>
              <p className={styles.description}>
                Quyền học 180 ngày cho khóa <strong>{courseTitle}</strong> đã được kích hoạt thành công trên tài khoản của bạn.
              </p>

              <div style={{ margin: '24px 0', padding: '16px', background: '#f4fbf6', border: '1px solid #ceead6', borderRadius: '8px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#137333', marginBottom: '8px' }}>
                  <ShieldCheck size={18} />
                  Biên lai điện tử & Quyền học (Entitlement ID: ENT-{Date.now().toString().slice(-6)})
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-ink-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>Mã đơn hàng: <strong>{effectiveOrderId}</strong></div>
                  <div>Số tiền: <strong>{amountVnd.toLocaleString('vi-VN')} đ</strong></div>
                  <div>Thời hạn học: <strong>180 ngày</strong></div>
                  <div>Hạn hoàn tiền: <strong>7 ngày (nếu chưa học)</strong></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={() => navigate('/learn/roadmap')}
                >
                  Bắt đầu học ngay theo Lộ trình <ArrowRight size={18} />
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => navigate('/learn/billing/history')}
                >
                  Xem lịch sử giao dịch
                </Button>
              </div>
            </div>
          )}

          {status === 'Expired' && (
            <div className={styles.card}>
              <div className={`${styles.statusIcon} ${styles.statusFailed}`}>
                <AlertCircle size={36} />
              </div>
              <h1 className={styles.title}>Đơn hàng đã hết hạn thanh toán</h1>
              <p className={styles.description}>
                Thời hạn giữ lệnh 30 phút cho đơn hàng <strong>{effectiveOrderId}</strong> đã kết thúc theo quy định FR-39.
              </p>
              <div style={{ marginTop: '24px' }}>
                <Button variant="primary" onClick={() => navigate('/learn/courses')}>
                  Tạo đơn hàng mới
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
