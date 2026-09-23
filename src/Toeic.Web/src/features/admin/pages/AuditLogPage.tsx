import { useState } from 'react';
import { Eye, Lock } from 'lucide-react';
import { Button, Input, Badge, Modal } from '../../../components/ui';
import styles from './OperationsPages.module.css';

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: 'ContentPublish' | 'QuarantineItem' | 'EmergencyUnpublish' | 'RegradeAttempt' | 'UserRoleGrant' | 'AccountSuspended';
  targetType: string;
  targetId: string;
  reason: string;
  correlationId: string;
  beforeStateSafe: Record<string, any>;
  afterStateSafe: Record<string, any>;
}

const SAMPLE_AUDIT_LOGS: AuditEntry[] = [
  {
    id: 'AUDIT-89101',
    timestamp: '2026-09-23T11:42:10Z',
    actor: 'admin@toeic.vn',
    actorRole: 'SuperAdmin',
    action: 'QuarantineItem',
    targetType: 'Question',
    targetId: 'ITEM-TOEIC-502',
    reason: 'Phát hiện bất đồng phân rã Solver B trên option C (CRITIC-FAIL)',
    correlationId: 'corr-bf89-410a',
    beforeStateSafe: { status: 'BetaActive', tier: 'BetaPractice' },
    afterStateSafe: { status: 'Quarantined', reason: 'DivergentSolver', quarantinedAt: '2026-09-23T11:42:10Z' },
  },
  {
    id: 'AUDIT-89102',
    timestamp: '2026-09-23T10:15:30Z',
    actor: 'factory-worker-03',
    actorRole: 'SystemAgent',
    action: 'ContentPublish',
    targetType: 'ExamForm',
    targetId: 'FORM-BETA-04',
    reason: 'Đạt 100% các cổng kiểm định tự động (Dual-solver, Critic, Perturbation)',
    correlationId: 'corr-0a91-4e7b',
    beforeStateSafe: { status: 'CrossModelValid' },
    afterStateSafe: { status: 'BetaActive', tier: 'BetaPractice' },
  },
  {
    id: 'AUDIT-89103',
    timestamp: '2026-09-22T16:20:00Z',
    actor: 'lead-editor@toeic.vn',
    actorRole: 'ContentEditor',
    action: 'UserRoleGrant',
    targetType: 'UserAccount',
    targetId: 'usr-reviewer-88',
    reason: 'Cấp quyền ContentReviewer sau khi hoàn thành khóa đào tạo kiểm định',
    correlationId: 'corr-811c-99fa',
    beforeStateSafe: { roles: ['Teacher'], mfaActive: true },
    afterStateSafe: { roles: ['Teacher', 'ContentReviewer'], mfaActive: true, grantedBy: 'lead-editor@toeic.vn' },
  },
  {
    id: 'AUDIT-89104',
    timestamp: '2026-09-22T14:05:12Z',
    actor: 'admin@toeic.vn',
    actorRole: 'SuperAdmin',
    action: 'AccountSuspended',
    targetType: 'UserAccount',
    targetId: 'usr-spam-09',
    reason: 'Vi phạm chính sách: Gửi hơn 500 request bất thường trong 5 phút (RateLimit Abuse)',
    correlationId: 'corr-c918-11de',
    beforeStateSafe: { status: 'Active' },
    afterStateSafe: { status: 'Suspended', suspendedReason: 'RateLimit Abuse', suspendedAt: '2026-09-22T14:05:12Z' },
  },
];

export function AuditLogPage() {
  const [logs] = useState<AuditEntry[]>(SAMPLE_AUDIT_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: AuditEntry['action']) => {
    switch (action) {
      case 'ContentPublish':
        return <Badge variant="success">ContentPublish</Badge>;
      case 'QuarantineItem':
        return <Badge variant="warning">QuarantineItem</Badge>;
      case 'EmergencyUnpublish':
        return <Badge variant="danger">EmergencyUnpublish</Badge>;
      case 'AccountSuspended':
        return <Badge variant="danger">AccountSuspended</Badge>;
      case 'UserRoleGrant':
        return <Badge variant="info">UserRoleGrant</Badge>;
      default:
        return <Badge variant="default">{action}</Badge>;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Nhật ký Kiểm toán Hệ thống (Audit Trails FR-38)</h1>
          <p className={styles.description}>
            Ghi vết bất biến các hoạt động trọng yếu: xuất bản đề, cách ly câu hỏi, cấp quyền vai trò, tạm khóa tài khoản và phúc khảo điểm.
          </p>
        </div>
      </div>

      <div className={styles.auditAlert}>
        <Lock size={16} />
        <span>
          <strong>Tiêu chuẩn nghiệm thu AC-38:</strong> Toàn bộ bản ghi kiểm toán được mã hóa và lưu trữ bất biến. Giao diện quản trị không hỗ trợ tính năng sửa hoặc xóa nhật ký.
        </span>
      </div>

      {/* Filters Bar */}
      <div className={styles.filtersBar}>
        <div style={{ flex: '1 1 280px' }}>
          <Input
            placeholder="Tìm theo Actor, Target ID hoặc lý do..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="ALL">Tất cả hành động</option>
          <option value="ContentPublish">ContentPublish</option>
          <option value="QuarantineItem">QuarantineItem</option>
          <option value="EmergencyUnpublish">EmergencyUnpublish</option>
          <option value="UserRoleGrant">UserRoleGrant</option>
          <option value="AccountSuspended">AccountSuspended</option>
        </select>
      </div>

      {/* Audit Table */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Tác nhân (Actor)</th>
            <th>Hành động (Action)</th>
            <th>Đối tượng tác động</th>
            <th>Lý do nghiệp vụ (Reason)</th>
            <th>Correlation ID</th>
            <th>Chi tiết</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.map((log) => (
            <tr key={log.id}>
              <td style={{ fontSize: '12px', whiteSpace: 'nowrap', fontFeatureSettings: 'tnum' }}>
                {new Date(log.timestamp).toLocaleString('vi-VN')}
              </td>
              <td>
                <strong>{log.actor}</strong>
                <div style={{ fontSize: '11px', color: 'var(--color-ink-secondary)' }}>
                  {log.actorRole}
                </div>
              </td>
              <td>{getActionBadge(log.action)}</td>
              <td>
                <span style={{ fontWeight: 600 }}>{log.targetType}:</span> {log.targetId}
              </td>
              <td style={{ maxWidth: '320px', fontSize: '13px' }}>{log.reason}</td>
              <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-ink-secondary)' }}>
                {log.correlationId}
              </td>
              <td>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLog(log)}
                  title="Xem diff trạng thái Before/After"
                >
                  <Eye size={14} /> Xem diff
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Detail Diff Modal */}
      {selectedLog && (
        <Modal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={`Chi tiết Kiểm toán: ${selectedLog.id}`}
        >
          <div style={{ fontSize: '13px', marginBottom: '16px' }}>
            <div>Hành động: <strong>{selectedLog.action}</strong></div>
            <div>Tác nhân: <strong>{selectedLog.actor}</strong> ({selectedLog.actorRole})</div>
            <div>Thời điểm: <strong>{new Date(selectedLog.timestamp).toISOString()}</strong></div>
            <div>Mã vết (Correlation ID): <code>{selectedLog.correlationId}</code></div>
            <div style={{ marginTop: '8px' }}>Lý do: <em>{selectedLog.reason}</em></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Trạng thái Trước (Before State Safe):
              </span>
              <pre className={styles.jsonBox}>
                {JSON.stringify(selectedLog.beforeStateSafe, null, 2)}
              </pre>
            </div>

            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Trạng thái Sau (After State Safe):
              </span>
              <pre className={styles.jsonBox}>
                {JSON.stringify(selectedLog.afterStateSafe, null, 2)}
              </pre>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setSelectedLog(null)}>
              Đóng
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
