import { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  KeyRound
} from 'lucide-react';
import { Button, Input, Badge, Modal, Alert, Textarea } from '../../../components/ui';
import styles from './OperationsPages.module.css';

interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  mfaEnabled: boolean;
  status: 'Active' | 'Suspended';
  suspendedReason?: string;
  createdAt: string;
}

const SAMPLE_USERS: UserRecord[] = [
  {
    id: 'usr-001',
    email: 'hocvien@example.com',
    displayName: 'Nguyễn Văn Học',
    roles: ['Learner'],
    mfaEnabled: false,
    status: 'Active',
    createdAt: '2026-09-15',
  },
  {
    id: 'usr-002',
    email: 'giaovien.mai@toeic.vn',
    displayName: 'ThS. Trần Mai',
    roles: ['Teacher', 'ContentReviewer'],
    mfaEnabled: true,
    status: 'Active',
    createdAt: '2026-08-10',
  },
  {
    id: 'usr-003',
    email: 'editor.tuan@toeic.vn',
    displayName: 'Lê Anh Tuấn',
    roles: ['ContentEditor'],
    mfaEnabled: true,
    status: 'Active',
    createdAt: '2026-08-15',
  },
  {
    id: 'usr-004',
    email: 'spam.bot@external.org',
    displayName: 'Unverified Crawler',
    roles: ['Learner'],
    mfaEnabled: false,
    status: 'Suspended',
    suspendedReason: 'Gửi 500 requests/phút vi phạm rate limit (BR-AUTH-01/FR-38)',
    createdAt: '2026-09-22',
  },
];

export function UserManagementPage() {
  const [users, setUsers] = useState<UserRecord[]>(SAMPLE_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Suspend modal state (FR-38)
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<UserRecord | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Role grant modal state with MFA requirement (FR-38)
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserRecord | null>(null);
  const [newRole, setNewRole] = useState('ContentReviewer');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState(false);

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase()) || u.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'ALL' || u.roles.includes(selectedRole);
    return matchesSearch && matchesRole;
  });

  const openSuspendModal = (user: UserRecord) => {
    setTargetUser(user);
    setSuspendReason('');
    setSuspendModalOpen(true);
  };

  const handleConfirmSuspend = () => {
    if (!targetUser || !suspendReason.trim()) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetUser.id
          ? { ...u, status: 'Suspended', suspendedReason: suspendReason }
          : u
      )
    );
    setSuspendModalOpen(false);
  };

  const handleUnlockUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, status: 'Active', suspendedReason: undefined } : u
      )
    );
  };

  const openRoleModal = (user: UserRecord) => {
    setSelectedUserForRole(user);
    setMfaCode('');
    setMfaError(false);
    setRoleModalOpen(true);
  };

  const handleConfirmRoleGrant = () => {
    // Check MFA per FR-38: "Cấp role cao yêu cầu MFA lại"
    if (mfaCode !== '123456' && mfaCode !== '888888') {
      setMfaError(true);
      return;
    }
    if (!selectedUserForRole) return;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUserForRole.id && !u.roles.includes(newRole)
          ? { ...u, roles: [...u.roles, newRole] }
          : u
      )
    );
    setRoleModalOpen(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản trị Người dùng & Phân quyền (FR-38)</h1>
          <p className={styles.description}>
            Quản lý tài khoản, vai trò phân quyền (RBAC), trạng thái kích hoạt xác thực 2 lớp (MFA) và tạm khóa tài khoản có lý do bắt buộc.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className={styles.filtersBar}>
        <div style={{ flex: '1 1 280px' }}>
          <Input
            placeholder="Tìm theo email hoặc họ tên học viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="ALL">Tất cả vai trò</option>
          <option value="Learner">Học viên (Learner)</option>
          <option value="Teacher">Giáo viên (Teacher)</option>
          <option value="ContentEditor">Biên tập viên (Editor)</option>
          <option value="ContentReviewer">Kiểm duyệt viên (Reviewer)</option>
        </select>
      </div>

      {/* Users Table */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Học viên / Nhân sự</th>
            <th>Email</th>
            <th>Vai trò được cấp (Roles)</th>
            <th>Trạng thái MFA</th>
            <th>Tình trạng tài khoản</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.id}>
              <td>
                <strong>{user.displayName}</strong>
                <div style={{ fontSize: '11px', color: 'var(--color-ink-secondary)' }}>
                  ID: {user.id}
                </div>
              </td>
              <td>{user.email}</td>
              <td>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {user.roles.map((r) => (
                    <Badge key={r} variant={r === 'Learner' ? 'default' : r === 'ContentReviewer' ? 'warning' : 'primary'}>
                      {r}
                    </Badge>
                  ))}
                </div>
              </td>
              <td>
                {user.mfaEnabled ? (
                  <Badge variant="success">Bật MFA</Badge>
                ) : (
                  <Badge variant="default">Chưa bật MFA</Badge>
                )}
              </td>
              <td>
                {user.status === 'Active' ? (
                  <Badge variant="success">Đang hoạt động</Badge>
                ) : (
                  <div>
                    <Badge variant="danger">Tạm khóa</Badge>
                    <div style={{ fontSize: '11px', color: '#c5221f', marginTop: '2px', maxWidth: '240px' }}>
                      {user.suspendedReason}
                    </div>
                  </div>
                )}
              </td>
              <td>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openRoleModal(user)}
                    title="Cấp vai trò nghiệp vụ (Yêu cầu xác thực MFA)"
                  >
                    <KeyRound size={14} /> Phân vai trò
                  </Button>

                  {user.status === 'Active' ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => openSuspendModal(user)}
                      title="Khóa tài khoản có lý do (FR-38)"
                    >
                      <Lock size={14} /> Khóa
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUnlockUser(user.id)}
                      title="Mở khóa tài khoản"
                    >
                      <Unlock size={14} /> Mở khóa
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Suspend Modal */}
      {suspendModalOpen && targetUser && (
        <Modal
          isOpen={suspendModalOpen}
          onClose={() => setSuspendModalOpen(false)}
          title="Tạm khóa tài khoản người dùng"
        >
          <Alert variant="danger" title="Khóa tài khoản có lý do (FR-38)">
            Tài khoản <strong>{targetUser.email}</strong> sẽ bị thu hồi phiên đăng nhập ngay lập tức và chặn tạo attempt làm đề mới.
          </Alert>

          <div style={{ margin: '16px 0' }}>
            <Textarea
              label="Lý do khóa tài khoản (Bắt buộc theo chuẩn FR-38)"
              placeholder="VD: Vi phạm rate limit / Có hành vi chia sẻ tài khoản bất thường..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setSuspendModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmSuspend}
              disabled={!suspendReason.trim()}
            >
              Xác nhận khóa tài khoản
            </Button>
          </div>
        </Modal>
      )}

      {/* Role Grant with MFA modal */}
      {roleModalOpen && selectedUserForRole && (
        <Modal
          isOpen={roleModalOpen}
          onClose={() => setRoleModalOpen(false)}
          title="Cấp vai trò đặc quyền (Yêu cầu xác thực MFA)"
        >
          <Alert variant="warning" title="Quy tắc an ninh FR-38">
            Cấp vai trò biên tập viên hoặc kiểm duyệt viên yêu cầu người thực hiện nhập mã MFA 6 chữ số để xác minh danh tính.
          </Alert>

          <div style={{ margin: '16px 0' }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Chọn vai trò cần cấp cho {selectedUserForRole.displayName}:
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className={styles.filterSelect}
                style={{ width: '100%' }}
              >
                <option value="ContentEditor">ContentEditor (Soạn thảo nội dung)</option>
                <option value="ContentReviewer">ContentReviewer (Duyệt nội dung Level 3)</option>
                <option value="Teacher">Teacher (Giáo viên chấm bài)</option>
              </select>
            </div>

            <Input
              label="Nhập mã xác thực MFA 6 chữ số (Mã thử nghiệm: 123456)"
              value={mfaCode}
              onChange={(e) => {
                setMfaCode(e.target.value);
                setMfaError(false);
              }}
              placeholder="123456"
            />
            {mfaError && (
              <span style={{ fontSize: '12px', color: '#c5221f', marginTop: '4px', display: 'block' }}>
                Mã xác thực MFA không hợp lệ. Vui lòng thử lại.
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setRoleModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleConfirmRoleGrant}>
              Xác nhận cấp vai trò
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
