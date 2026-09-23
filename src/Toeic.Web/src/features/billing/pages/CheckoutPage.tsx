import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Shield, QrCode, CreditCard, Landmark, Wallet } from 'lucide-react';
import { Button, Alert, Badge } from '../../../components/ui';
import { PaymentMethod } from '../../../types/billing';
import styles from './Billing.module.css';

export function CheckoutPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  // Mock course & plan data
  const isAlreadyEnrolled = false; // per FR-39 check duplicate purchase
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('VietQR');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  const courseTitle = courseId === 'toeic-core-750' 
    ? 'TOEIC Luyện thi Căn bản & Mở rộng 550–750'
    : 'TOEIC Chiến thuật Đọc hiểu Chuyên sâu Part 7';

  const priceVnd = 590000;
  const originalPriceVnd = 850000;
  const durationDays = 180;

  const handleCreateOrder = () => {
    setIsProcessing(true);
    // In real app: POST /api/orders { courseId, paymentMethod, idempotencyKey }
    setTimeout(() => {
      setIsProcessing(false);
      const generatedOrderId = `ORD-${Date.now().toString().slice(-6)}`;
      navigate(`/learn/billing/orders/${generatedOrderId}`, {
        state: {
          orderId: generatedOrderId,
          courseId,
          courseTitle,
          amountVnd: priceVnd,
          paymentMethod: selectedMethod,
        }
      });
    }, 600);
  };

  return (
    <div className={styles.page}>
      <div className="content-container">
        <div className={styles.header}>
          <Link to={`/learn/courses/${courseId || ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-ink-secondary)', marginBottom: '12px', fontSize: '14px' }}>
            <ArrowLeft size={16} /> Quay lại thông tin khóa học
          </Link>
          <h1 className={styles.title}>Thanh toán & Đăng ký Quyền học</h1>
          <p className={styles.description}>
            Xác nhận gói học trực tiếp với quyền truy cập đầy đủ 180 ngày và cam kết hoàn tiền minh bạch theo chính sách FR-39/41.
          </p>
        </div>

        {isAlreadyEnrolled && (
          <div style={{ marginBottom: '24px' }}>
            <Alert variant="warning" title="Cảnh báo mua trùng (FR-39)">
              Bạn hiện đã sở hữu quyền học khóa học này. Hệ thống không tự động gia hạn cộng dồn thời hạn bằng đơn mua trùng. Vui lòng kiểm tra mục Quyền học trong trang cá nhân.
            </Alert>
          </div>
        )}

        <div className={styles.grid}>
          {/* Left Column: Payment Method Selection */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>1. Chọn phương thức thanh toán</h2>
            
            <div className={styles.methodList}>
              <label 
                className={`${styles.methodOption} ${selectedMethod === 'VietQR' ? styles.methodOptionSelected : ''}`}
                onClick={() => setSelectedMethod('VietQR')}
              >
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  checked={selectedMethod === 'VietQR'} 
                  onChange={() => setSelectedMethod('VietQR')}
                  className={styles.methodRadio}
                />
                <QrCode size={24} color="#0052cc" />
                <div className={styles.methodDetails}>
                  <span className={styles.methodName}>Quét mã VietQR chuyển khoản (Khuyên dùng)</span>
                  <span className={styles.methodDescription}>Xác nhận thanh toán tự động trong 60 giây qua cổng đối soát ngân hàng.</span>
                </div>
                <Badge variant="success">Tự động</Badge>
              </label>

              <label 
                className={`${styles.methodOption} ${selectedMethod === 'NapasBankTransfer' ? styles.methodOptionSelected : ''}`}
                onClick={() => setSelectedMethod('NapasBankTransfer')}
              >
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  checked={selectedMethod === 'NapasBankTransfer'} 
                  onChange={() => setSelectedMethod('NapasBankTransfer')}
                  className={styles.methodRadio}
                />
                <Landmark size={24} color="#333333" />
                <div className={styles.methodDetails}>
                  <span className={styles.methodName}>Chuyển khoản liên ngân hàng Napas 24/7</span>
                  <span className={styles.methodDescription}>Ghi đúng mã đơn hàng trong nội dung chuyển khoản để khớp lệnh.</span>
                </div>
              </label>

              <label 
                className={`${styles.methodOption} ${selectedMethod === 'CreditCard' ? styles.methodOptionSelected : ''}`}
                onClick={() => setSelectedMethod('CreditCard')}
              >
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  checked={selectedMethod === 'CreditCard'} 
                  onChange={() => setSelectedMethod('CreditCard')}
                  className={styles.methodRadio}
                />
                <CreditCard size={24} color="#333333" />
                <div className={styles.methodDetails}>
                  <span className={styles.methodName}>Thẻ quốc tế Visa / MasterCard / JCB</span>
                  <span className={styles.methodDescription}>Cổng thanh toán bảo mật PCI-DSS xác thực OTP 3D-Secure.</span>
                </div>
              </label>

              <label 
                className={`${styles.methodOption} ${selectedMethod === 'Momo' ? styles.methodOptionSelected : ''}`}
                onClick={() => setSelectedMethod('Momo')}
              >
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  checked={selectedMethod === 'Momo'} 
                  onChange={() => setSelectedMethod('Momo')}
                  className={styles.methodRadio}
                />
                <Wallet size={24} color="#ae2070" />
                <div className={styles.methodDetails}>
                  <span className={styles.methodName}>Ví điện tử MoMo</span>
                  <span className={styles.methodDescription}>Quét mã QR từ ứng dụng MoMo trên điện thoại.</span>
                </div>
              </label>
            </div>

            <div style={{ marginTop: '24px' }}>
              <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '13px', color: 'var(--color-ink-primary)' }}>
                <input 
                  type="checkbox" 
                  checked={agreedToTerms} 
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  style={{ marginTop: '3px' }}
                />
                <span>
                  Tôi đã đọc và đồng ý với <strong>Điều khoản dịch vụ</strong> và <strong>Chính sách hoàn tiền trong 7 ngày</strong> nếu chưa bắt đầu nội dung học trả phí (theo quy định FR-41).
                </span>
              </label>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>2. Tóm tắt đơn hàng</h2>

            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-ink-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Khóa học đăng ký</span>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px', color: 'var(--color-ink-primary)' }}>
                {courseTitle}
              </h3>
            </div>

            <div className={styles.summaryRow}>
              <span>Thời hạn quyền học:</span>
              <span style={{ fontWeight: 600, color: 'var(--color-ink-primary)' }}>{durationDays} ngày (từ thời điểm thanh toán)</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Giá gốc:</span>
              <span style={{ textDecoration: 'line-through' }}>{originalPriceVnd.toLocaleString('vi-VN')} đ</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Ưu đãi áp dụng:</span>
              <span style={{ color: '#137333', fontWeight: 600 }}>-{(originalPriceVnd - priceVnd).toLocaleString('vi-VN')} đ</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Thuế & Phí dịch vụ:</span>
              <span>Đã bao gồm VAT</span>
            </div>

            <div className={styles.summaryTotal}>
              <span>Tổng thanh toán:</span>
              <span className={styles.totalAmount}>{priceVnd.toLocaleString('vi-VN')} đ</span>
            </div>

            <div className={styles.policyNotice}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '4px', color: 'var(--color-ink-primary)' }}>
                <Shield size={14} color="var(--color-primary)" />
                Bảo vệ quyền lợi học viên (FR-41)
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc' }}>
                <li>Toàn quyền truy cập tất cả bài giảng và bài tập trong 180 ngày.</li>
                <li>Hỗ trợ hoàn tiền 100% trong 7 ngày nếu chưa học nội dung trả phí.</li>
                <li>Tiến độ học tập và sổ lỗi sai vẫn được lưu giữ vĩnh viễn sau khi hết hạn.</li>
              </ul>
            </div>

            <div className={styles.actionArea}>
              <Button 
                variant="primary" 
                size="lg" 
                style={{ width: '100%' }}
                onClick={handleCreateOrder}
                isLoading={isProcessing}
                disabled={!agreedToTerms}
              >
                Tiến hành thanh toán ({priceVnd.toLocaleString('vi-VN')} đ)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
