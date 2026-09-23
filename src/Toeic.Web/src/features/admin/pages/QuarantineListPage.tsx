import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { AlertOctagon, RotateCcw, Archive, ShieldAlert } from 'lucide-react';
import styles from './AdminPages.module.css';

interface QuarantinedItem {
  id: string;
  candidateId: string;
  part: string;
  prompt: string;
  reason: string;
  quarantinedAt: string;
  findingType: 'DualSolverDisagreement' | 'CriticBlocking' | 'PerturbationDrift' | 'LearnerReportThreshold';
}

const mockQuarantined: QuarantinedItem[] = [
  {
    id: 'q-item-01',
    candidateId: 'cand-p5-8912',
    part: 'Part 5',
    prompt: 'The CEO was pleased with the result of the ------- negotiation with overseas suppliers.',
    reason: 'Dual-solver consensus failed: Solver A chọn B (successful), Solver B chọn C (successfully).',
    quarantinedAt: '2026-09-23T07:15:00Z',
    findingType: 'DualSolverDisagreement',
  },
  {
    id: 'q-item-02',
    candidateId: 'cand-p7-4102',
    part: 'Part 7',
    prompt: 'What is indicated about the newly scheduled maintenance window?',
    reason: 'Critic Blocking: Câu hỏi yêu cầu thông tin không xuất hiện trong đoạn trích dẫn chứng thực.',
    quarantinedAt: '2026-09-23T08:40:00Z',
    findingType: 'CriticBlocking',
  },
];

export function QuarantineListPage() {
  const [items, setItems] = useState<QuarantinedItem[]>(mockQuarantined);

  const handleRestore = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
    alert('Đã chuyển candidate sang trạng thái tái kiểm định.');
  };

  const handleArchive = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
    alert('Đã lưu trữ vĩnh viễn candidate.');
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Kiểm soát cách ly nội dung (Quarantine Console)</h1>
          <p className={styles.subtitle}>
            Danh sách candidate và form bị cách ly khỏi kho phát hành Beta do vi phạm cổng chất lượng (SRS Mục 28).
          </p>
        </div>
      </div>

      <div className={styles.quarantineBanner}>
        <ShieldAlert size={20} className={styles.bannerIcon} />
        <div>
          <strong>Quy tắc bất biến:</strong>
          <p>
            Mọi candidate có finding Blocking hoặc bất đồng thuận giữa 2 solver độc lập phải bị cách ly ngay lập tức. Candidate bị cách ly không bao giờ xuất hiện trong đề thi của học viên.
          </p>
        </div>
      </div>

      <div className={styles.cardTable}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Candidate ID</th>
              <th>Part</th>
              <th>Nội dung câu hỏi</th>
              <th>Nguyên nhân cách ly</th>
              <th>Thời điểm</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className={styles.codeText}>{item.candidateId}</span>
                </td>
                <td>
                  <Badge variant="primary">{item.part}</Badge>
                </td>
                <td style={{ maxWidth: '300px' }}>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', lineHeight: '1.4' }}>
                    {item.prompt}
                  </p>
                </td>
                <td>
                  <div className={styles.reasonText}>
                    <AlertOctagon size={14} style={{ color: 'var(--color-danger)', flexShrink: 0, marginTop: '2px' }} />
                    <span>{item.reason}</span>
                  </div>
                </td>
                <td className="text-tabular" style={{ fontSize: 'var(--font-size-xs)' }}>
                  {new Date(item.quarantinedAt).toLocaleTimeString('vi-VN')} {new Date(item.quarantinedAt).toLocaleDateString('vi-VN')}
                </td>
                <td>
                  <div className={styles.actionCell}>
                    <Button
                      variant="text"
                      size="sm"
                      onClick={() => handleRestore(item.id)}
                      leftIcon={<RotateCcw size={14} />}
                    >
                      Kiểm định lại
                    </Button>
                    <Button
                      variant="text"
                      size="sm"
                      onClick={() => handleArchive(item.id)}
                      leftIcon={<Archive size={14} />}
                    >
                      Lưu trữ
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
