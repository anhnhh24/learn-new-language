import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import {
  Bell,
  Shield,
  Download,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import styles from './Account.module.css';

export function AccountPage() {
  const [displayName, setDisplayName] = useState('Học viên TOEIC');
  const [email] = useState('hocvien@example.com');
  const [quietHoursStart, setQuietHoursStart] = useState('21:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');
  const [allowEmailReminders, setAllowEmailReminders] = useState(true);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [exportRequested, setExportRequested] = useState(false);
  const [deleteRequested, setDeleteRequested] = useState(false);

  const handleRequestExport = () => {
    setExportRequested(true);
    setTimeout(() => {
      setIsExportModalOpen(false);
    }, 1500);
  };

  const handleRequestDelete = () => {
    setDeleteRequested(true);
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="content-container">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tài khoản & Quyền riêng tư</h1>
          <p className={styles.subtitle}>
            Quản lý thông tin cá nhân, lịch nhắc học và quyền kiểm soát dữ liệu người học (UI-14 & FR-18).
          </p>
        </div>
      </div>

      <div className={styles.accountGrid}>
        {/* Profile Info */}
        <section className={styles.sectionCard} aria-labelledby="profile-heading">
          <div className={styles.cardHeader}>
            <h2 id="profile-heading" className={styles.cardTitle}>Hồ sơ học viên</h2>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); alert('Đã lưu thay đổi hồ sơ!'); }}>
            <Input
              type="text"
              label="Tên hiển thị"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />

            <Input
              type="email"
              label="Địa chỉ email đã xác minh"
              value={email}
              disabled
              hint="Email không thể tự đổi trực tiếp khi chưa qua quy trình xác minh lại"
            />

            <Button variant="primary" size="sm" type="submit">
              Lưu thay đổi hồ sơ
            </Button>
          </form>
        </section>

        {/* Study Reminder & Quiet Hours (FR-16) */}
        <section className={styles.sectionCard} aria-labelledby="reminder-heading">
          <div className={styles.cardHeader}>
            <Bell size={20} className={styles.headerIcon} />
            <h2 id="reminder-heading" className={styles.cardTitle}>Nhắc nhở học tập & Giờ yên tĩnh</h2>
          </div>

          <p className={styles.sectionDesc}>
            Theo quy tắc FR-16, hệ thống chỉ gửi tối đa 1 thông báo/ngày và tuyệt đối không gửi trong khung giờ yên tĩnh.
          </p>

          <div className={styles.checkboxRow}>
            <input
              type="checkbox"
              id="reminderCheck"
              checked={allowEmailReminders}
              onChange={(e) => setAllowEmailReminders(e.target.checked)}
            />
            <label htmlFor="reminderCheck">
              Nhận email nhắc nhở ôn tập Spaced Repetition đến hạn
            </label>
          </div>

          <div className={styles.quietHoursGrid}>
            <Input
              type="time"
              label="Bắt đầu giờ yên tĩnh"
              value={quietHoursStart}
              onChange={(e) => setQuietHoursStart(e.target.value)}
            />
            <Input
              type="time"
              label="Kết thúc giờ yên tĩnh"
              value={quietHoursEnd}
              onChange={(e) => setQuietHoursEnd(e.target.value)}
            />
          </div>
        </section>

        {/* Data Privacy & GDPR/FR-18 Rights */}
        <section className={styles.sectionCard} aria-labelledby="privacy-heading">
          <div className={styles.cardHeader}>
            <Shield size={20} className={styles.headerIcon} />
            <h2 id="privacy-heading" className={styles.cardTitle}>Quyền kiểm soát dữ liệu cá nhân</h2>
          </div>

          <p className={styles.sectionDesc}>
            Tuân thủ quy định bảo vệ dữ liệu FR-18: Bạn có toàn quyền tải về lịch sử học tập hoặc yêu cầu xóa vĩnh viễn tài khoản.
          </p>

          {exportRequested && (
            <div className={styles.alertSuccess}>
              <CheckCircle size={16} />
              <span>Yêu cầu xuất dữ liệu đã được ghi nhận. Liên kết tải tệp zip (hạn 24 giờ) sẽ sẵn sàng sau ít phút.</span>
            </div>
          )}

          {deleteRequested && (
            <div className={styles.alertDanger}>
              <strong>Tài khoản đang trong thời hạn chờ xóa (7 ngày).</strong>
              <p>Bạn có thể hủy yêu cầu này bất cứ lúc nào trước khi thời hạn 7 ngày kết thúc.</p>
            </div>
          )}

          <div className={styles.privacyActions}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExportModalOpen(true)}
              leftIcon={<Download size={16} />}
            >
              Yêu cầu xuất toàn bộ dữ liệu (Export)
            </Button>

            {!deleteRequested && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                leftIcon={<Trash2 size={16} />}
              >
                Yêu cầu xóa tài khoản
              </Button>
            )}
          </div>
        </section>
      </div>

      {/* Export Confirmation Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Xuất dữ liệu học tập cá nhân"
        description="Gói xuất bao gồm toàn bộ tiến độ bài học, các lần làm đề, sổ lỗi sai và ghi chú cá nhân của bạn."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsExportModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleRequestExport}>
              Tạo gói dữ liệu tải về
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
          Hệ thống sẽ tổng hợp tệp nén mã hóa an toàn. Để bảo vệ sở hữu trí tuệ, gói dữ liệu không bao gồm toàn văn answer key của các đề chưa được công bố công khai.
        </p>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Yêu cầu xóa vĩnh viễn tài khoản"
        description="Cửa sổ hủy trong vòng 7 ngày cho phép bạn phục hồi nếu đổi ý."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Giữ lại tài khoản
            </Button>
            <Button variant="danger" onClick={handleRequestDelete}>
              Xác nhận đưa vào hàng đợi xóa (7 ngày)
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)' }}>
          Sau thời hạn 7 ngày, toàn bộ lịch sử điểm số, thống kê làm đề và hồ sơ học viên sẽ bị xóa hoặc ẩn danh hóa hoàn toàn khỏi cơ sở dữ liệu.
        </p>
      </Modal>
    </div>
  );
}
