import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Plus, CheckCircle2, Archive } from 'lucide-react';
import styles from './AdminPages.module.css';

interface BlueprintItem {
  id: string;
  version: string;
  part: string;
  maxCandidatesPerJob: number;
  budgetCapUsd: number;
  status: 'Published' | 'Draft' | 'Archived';
  policyVersion: string;
  updatedAt: string;
}

const mockBlueprints: BlueprintItem[] = [
  {
    id: 'bp-01',
    version: 'BP-P5-v2.1',
    part: 'Part 5',
    maxCandidatesPerJob: 10,
    budgetCapUsd: 2.5,
    status: 'Published',
    policyVersion: 'Pol-2026.09-v1',
    updatedAt: '2026-09-22T10:00:00Z',
  },
  {
    id: 'bp-02',
    version: 'BP-P7-v1.0',
    part: 'Part 7',
    maxCandidatesPerJob: 5,
    budgetCapUsd: 4.0,
    status: 'Published',
    policyVersion: 'Pol-2026.09-v1',
    updatedAt: '2026-09-23T06:00:00Z',
  },
  {
    id: 'bp-03',
    version: 'BP-P5-v2.2-draft',
    part: 'Part 5',
    maxCandidatesPerJob: 10,
    budgetCapUsd: 2.5,
    status: 'Draft',
    policyVersion: 'Pol-2026.10-draft',
    updatedAt: '2026-09-23T11:00:00Z',
  },
];

export function BlueprintsPage() {
  const [blueprints, setBlueprints] = useState<BlueprintItem[]>(mockBlueprints);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [version, setVersion] = useState('');
  const [part, setPart] = useState('Part 5');
  const [maxQuota, setMaxQuota] = useState('10');
  const [budget, setBudget] = useState('3.0');

  const handleCreateBlueprint = (e: React.FormEvent) => {
    e.preventDefault();
    const newBp: BlueprintItem = {
      id: `bp-0${blueprints.length + 1}`,
      version: version || `BP-${part.replace(/\s+/g, '')}-v1.0`,
      part,
      maxCandidatesPerJob: Number(maxQuota) || 10,
      budgetCapUsd: Number(budget) || 3.0,
      status: 'Draft',
      policyVersion: 'Pol-2026.09-v1',
      updatedAt: new Date().toISOString(),
    };
    setBlueprints([...blueprints, newBp]);
    setIsCreateModalOpen(false);
  };

  const handlePublish = (id: string) => {
    setBlueprints(
      blueprints.map((b) => (b.id === id ? { ...b, status: 'Published' } : b))
    );
  };

  const handleArchive = (id: string) => {
    setBlueprints(
      blueprints.map((b) => (b.id === id ? { ...b, status: 'Archived' } : b))
    );
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Cấu hình Blueprint (Controlled Item Factory)</h1>
          <p className={styles.subtitle}>
            Quản trị phiên bản Blueprint sinh đề, ràng buộc Quota tối đa và hạn mức chi phí ngân sách (Mục 27, 28).
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus size={16} />}
        >
          Tạo Blueprint mới
        </Button>
      </div>

      <div className={styles.cardTable}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Phiên bản</th>
              <th>Part áp dụng</th>
              <th>Quota tối đa/Job</th>
              <th>Hạn mức ngân sách</th>
              <th>Policy Version</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {blueprints.map((bp) => (
              <tr key={bp.id}>
                <td>
                  <strong>{bp.version}</strong>
                </td>
                <td>
                  <Badge variant="primary">{bp.part}</Badge>
                </td>
                <td className="text-tabular">{bp.maxCandidatesPerJob} câu/job</td>
                <td className="text-tabular">${bp.budgetCapUsd.toFixed(2)} USD</td>
                <td>
                  <span className={styles.codeText}>{bp.policyVersion}</span>
                </td>
                <td>
                  {bp.status === 'Published' && <Badge variant="success">Published (Đang dùng)</Badge>}
                  {bp.status === 'Draft' && <Badge variant="warning">Draft (Bản nháp)</Badge>}
                  {bp.status === 'Archived' && <Badge variant="default">Archived (Lưu trữ)</Badge>}
                </td>
                <td>
                  <div className={styles.actionCell}>
                    {bp.status === 'Draft' && (
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => handlePublish(bp.id)}
                        leftIcon={<CheckCircle2 size={14} />}
                      >
                        Publish
                      </Button>
                    )}
                    {bp.status === 'Published' && (
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => handleArchive(bp.id)}
                        leftIcon={<Archive size={14} />}
                      >
                        Archive
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tạo cấu hình Blueprint mới"
        description="Định nghĩa thông số quota và ngân sách tối đa trước khi triển khai tác vụ sinh nội dung AI."
      >
        <form onSubmit={handleCreateBlueprint} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input
            type="text"
            label="Mã phiên bản Blueprint"
            placeholder="Ví dụ: BP-P5-v3.0"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            required
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Part áp dụng</label>
            <select
              value={part}
              onChange={(e) => setPart(e.target.value)}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                minHeight: '44px',
                fontFamily: 'inherit',
              }}
            >
              <option value="Part 5">Part 5 (Incomplete Sentences)</option>
              <option value="Part 7">Part 7 (Reading Comprehension)</option>
              <option value="Part 6">Part 6 (Text Completion)</option>
            </select>
          </div>

          <Input
            type="number"
            label="Quota tối đa mỗi Job (Part 5 tối đa 10)"
            value={maxQuota}
            onChange={(e) => setMaxQuota(e.target.value)}
            max={10}
            required
          />

          <Input
            type="number"
            step="0.1"
            label="Hạn mức ngân sách tối đa ($USD)"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Lưu bản nháp Blueprint
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
