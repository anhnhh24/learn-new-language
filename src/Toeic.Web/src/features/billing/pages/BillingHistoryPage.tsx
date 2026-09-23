import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, Download } from 'lucide-react';
import { Button, Badge, Modal, Alert, Textarea } from '../../../components/ui';
import { OrderSnapshot } from '../../../types/billing';
import styles from './Billing.module.css';

export function BillingHistoryPage() {
  const [orders, setOrders] = useState<OrderSnapshot[]>([
    {
      orderId: 'ord-001',
      orderNumber: 'ORD-892104',
      productPlanId: 'plan-01',
      courseId: 'toeic-core-750',
      courseTitle: 'TOEIC Luyện thi Căn bản & Mở rộng 550–750',
      amountVnd: 590000,
      currency: 'VND',
      status: 'Paid',
      paymentMethod: 'VietQR',
      createdAt: '2026-09-20T10:15:00Z',
      expiresAt: '2026-09-20T10:45:00Z',
      paidAt: '2026-09-20T10:18:22Z',
      entitlementId: 'ent-001',
    },
    {
      orderId: 'ord-002',
      orderNumber: 'ORD-871402',
      productPlanId: 'plan-02',
      courseId: 'toeic-part7-mastery',
      courseTitle: 'TOEIC Chiến thuật Đọc hiểu Chuyên sâu Part 7',
      amountVnd: 390000,
      currency: 'VND',
      status: 'Paid',
      paymentMethod: 'NapasBankTransfer',
      createdAt: '2026-09-22T14:00:00Z',
      expiresAt: '2026-09-22T14:30:00Z',
      paidAt: '2026-09-22T14:04:15Z',
      entitlementId: 'ent-002',
    },
  ]);

  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<OrderSnapshot | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundSubmitted, setRefundSubmitted] = useState(false);

  const openRefundModal = (order: OrderSnapshot) => {
    setSelectedOrderForRefund(order);
    setRefundReason('');
    setRefundSubmitted(false);
    setRefundModalOpen(true);
  };

  const handleSubmitRefund = () => {
    if (!selectedOrderForRefund) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.orderId === selectedOrderForRefund.orderId
          ? {
              ...o,
              status: 'RefundRequested' as const,
              refundReason,
              refundRequestedAt: new Date().toISOString(),
            }
          : o
      )
    );
    setRefundSubmitted(true);
    setTimeout(() => {
      setRefundModalOpen(false);
    }, 1500);
  };

  const getStatusBadge = (status: OrderSnapshot['status']) => {
    switch (status) {
      case 'Paid':
        return <Badge variant="success">Đã thanh toán (Active)</Badge>;
      case 'PendingPayment':
        return <Badge variant="warning">Chờ thanh toán</Badge>;
      case 'RefundRequested':
        return <Badge variant="info">Đang đối soát hoàn tiền</Badge>;
      case 'Refunded':
        return <Badge variant="default">Đã hoàn tiền</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className={styles.page}>
      <div className="content-container">
        <div className={styles.header}>
          <h1 className={styles.title}>Lịch sử Giao dịch & Quản lý Quyền học</h1>
          <p className={styles.description}>
            Xem danh sách hóa đơn, tình trạng quyền học 180 ngày và yêu cầu hoàn tiền trong 7 ngày theo chính sách FR-41.
          </p>
        </div>

        <div className={styles.card} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className={styles.cardTitle} style={{ margin: 0, padding: 0, border: 'none' }}>
              Quyền học đang hoạt động (Active Entitlements)
            </h2>
            <Link to="/learn/courses" style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600 }}>
              + Khám phá thêm khóa học
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ border: '1px solid #ceead6', background: '#f4fbf6', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#137333' }}>TOEIC 550–750</span>
                <Badge variant="success">177 ngày còn lại</Badge>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '8px 0 4px', color: 'var(--color-ink-primary)' }}>
                TOEIC Luyện thi Căn bản & Mở rộng
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--color-ink-secondary)', margin: 0 }}>
                Hạn sử dụng: <strong>19/03/2027</strong> • Đầy đủ bài giảng và đề thi
              </p>
            </div>

            <div style={{ border: '1px solid #ceead6', background: '#f4fbf6', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#137333' }}>Part 7 Mastery</span>
                <Badge variant="success">179 ngày còn lại</Badge>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '8px 0 4px', color: 'var(--color-ink-primary)' }}>
                Chiến thuật Đọc hiểu Chuyên sâu Part 7
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--color-ink-secondary)', margin: 0 }}>
                Hạn sử dụng: <strong>21/03/2027</strong> • Đầy đủ bài giảng và đề thi
              </p>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Lịch sử hóa đơn thanh toán (FR-39/41)</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.historyTable}>
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khóa học</th>
                  <th>Phương thức</th>
                  <th>Thời gian</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.orderId}>
                    <td>
                      <strong>{o.orderNumber}</strong>
                    </td>
                    <td>{o.courseTitle}</td>
                    <td>{o.paymentMethod || 'VietQR'}</td>
                    <td>{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td style={{ fontWeight: 600 }}>{o.amountVnd.toLocaleString('vi-VN')} đ</td>
                    <td>{getStatusBadge(o.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {o.status === 'Paid' && (
                          <Button 
                            variant="text" 
                            size="sm"
                            onClick={() => openRefundModal(o)}
                            title="Yêu cầu hoàn tiền trong 7 ngày (FR-41)"
                          >
                            <RotateCcw size={14} /> Hoàn tiền
                          </Button>
                        )}
                        <Button variant="text" size="sm" title="Tải biên lai">
                          <Download size={14} /> Biên lai
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Refund Modal adhering to FR-41 */}
        {refundModalOpen && selectedOrderForRefund && (
          <Modal
            isOpen={refundModalOpen}
            onClose={() => setRefundModalOpen(false)}
            title="Yêu cầu hoàn tiền (Chính sách FR-41)"
          >
            {refundSubmitted ? (
              <Alert variant="success" title="Đã ghi nhận yêu cầu hoàn tiền">
                Yêu cầu của bạn cho đơn hàng <strong>{selectedOrderForRefund.orderNumber}</strong> đã được chuyển đến bộ phận đối soát (RefundRequested). Tiền sẽ được hoàn lại tài khoản trong 1–3 ngày làm việc sau khi kiểm tra tiến độ học.
              </Alert>
            ) : (
              <div>
                <Alert variant="info" title="Quy tắc hoàn tiền 100% trong 7 ngày">
                  Theo tiêu chuẩn nghiệm thu FR-41, học viên được hoàn tiền 100% nếu gửi yêu cầu trong vòng 7 ngày kể từ ngày thanh toán và chưa bắt đầu học nội dung trả phí của khóa học.
                </Alert>

                <div style={{ margin: '16px 0', fontSize: '14px' }}>
                  <div>Đơn hàng: <strong>{selectedOrderForRefund.orderNumber}</strong></div>
                  <div>Khóa học: <strong>{selectedOrderForRefund.courseTitle}</strong></div>
                  <div>Số tiền hoàn trả: <strong>{selectedOrderForRefund.amountVnd.toLocaleString('vi-VN')} đ</strong></div>
                </div>

                <Textarea
                  label="Lý do yêu cầu hoàn tiền (Tùy chọn)"
                  placeholder="Vui lòng chia sẻ lý do để ban đào tạo hoàn thiện chất lượng..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                  <Button variant="secondary" onClick={() => setRefundModalOpen(false)}>
                    Hủy bỏ
                  </Button>
                  <Button variant="primary" onClick={handleSubmitRefund}>
                    Xác nhận gửi yêu cầu hoàn tiền
                  </Button>
                </div>
              </div>
            )}
          </Modal>
        )}
      </div>
    </div>
  );
}
