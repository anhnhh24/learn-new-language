import { useState } from 'react';
import { 
  AlertOctagon, 
  Eye
} from 'lucide-react';
import { Button, Input, Badge, Modal, Alert } from '../../../components/ui';
import { TierBadge } from '../../../components/ui/Badge';
import styles from './CMSPages.module.css';

interface BankItem {
  id: string;
  stem: string;
  part: string;
  primaryTag: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tier: 'Draft' | 'StructuralValid' | 'CrossModelValid' | 'BetaActive' | 'DataValidatedPractice';
  attemptCount: number;
  accuracyRate?: number;
  discriminationScore?: number;
  issueReportsCount: number;
}

const SAMPLE_BANK_ITEMS: BankItem[] = [
  {
    id: 'ITEM-TOEIC-501',
    stem: 'The marketing department will conduct a customer satisfaction survey _______ the end of the second fiscal quarter.',
    part: 'Part 5',
    primaryTag: 'grammar.prepositions',
    difficulty: 'Easy',
    tier: 'DataValidatedPractice',
    attemptCount: 142,
    accuracyRate: 78.2,
    discriminationScore: 0.42,
    issueReportsCount: 0,
  },
  {
    id: 'ITEM-TOEIC-502',
    stem: 'All technicians must wear protective gear _______ entering the semiconductor fabrication laboratory.',
    part: 'Part 5',
    primaryTag: 'grammar.participles',
    difficulty: 'Medium',
    tier: 'BetaActive',
    attemptCount: 84,
    accuracyRate: 64.5,
    discriminationScore: 0.38,
    issueReportsCount: 1,
  },
  {
    id: 'ITEM-TOEIC-503',
    stem: 'The board of directors expressed their _______ for the research team’s breakthrough in energy efficiency.',
    part: 'Part 5',
    primaryTag: 'grammar.word_forms',
    difficulty: 'Easy',
    tier: 'DataValidatedPractice',
    attemptCount: 210,
    accuracyRate: 85.0,
    discriminationScore: 0.45,
    issueReportsCount: 0,
  },
  {
    id: 'ITEM-TOEIC-701',
    stem: 'What is the primary purpose of the internal memorandum sent by Mr. Henderson?',
    part: 'Part 7',
    primaryTag: 'part7.single_email',
    difficulty: 'Hard',
    tier: 'BetaActive',
    attemptCount: 18, // < 30 responses -> "Chưa đủ dữ liệu" per FR-36
    accuracyRate: undefined,
    discriminationScore: undefined,
    issueReportsCount: 0,
  },
  {
    id: 'ITEM-TOEIC-702',
    stem: 'In the email, the word "pertinent" in paragraph 2, line 4 is closest in meaning to:',
    part: 'Part 7',
    primaryTag: 'part7.vocab_context',
    difficulty: 'Hard',
    tier: 'CrossModelValid',
    attemptCount: 5,
    accuracyRate: undefined,
    discriminationScore: undefined,
    issueReportsCount: 0,
  },
];

export function ItemBankPage() {
  const [items, setItems] = useState<BankItem[]>(SAMPLE_BANK_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPart, setSelectedPart] = useState('ALL');
  const [selectedTier, setSelectedTier] = useState('ALL');

  // Quarantine Modal
  const [quarantineModalOpen, setQuarantineModalOpen] = useState(false);
  const [targetItem, setTargetItem] = useState<BankItem | null>(null);
  const [quarantineReason, setQuarantineReason] = useState('DivergentSolver');

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.stem.toLowerCase().includes(searchQuery.toLowerCase()) || item.primaryTag.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPart = selectedPart === 'ALL' || item.part === selectedPart;
    const matchesTier = selectedTier === 'ALL' || item.tier === selectedTier;
    return matchesSearch && matchesPart && matchesTier;
  });

  const openQuarantine = (item: BankItem) => {
    setTargetItem(item);
    setQuarantineModalOpen(true);
  };

  const handleConfirmQuarantine = () => {
    if (!targetItem) return;
    setItems((prev) => prev.filter((i) => i.id !== targetItem.id));
    setQuarantineModalOpen(false);
    alert(`Đã đưa câu hỏi ${targetItem.id} vào hàng đợi Cách ly (Quarantine Console).`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Ngân hàng Đề thi & Chỉ số Câu hỏi (FR-36)</h1>
          <p className={styles.description}>
            Khám phá toàn bộ kho câu hỏi TOEIC. Theo dõi tỷ lệ chính xác, độ phân biệt (Discrimination index) và báo lỗi từ người học. Quy định FR-36: mẫu dưới 30 lượt làm hiển thị &quot;Chưa đủ dữ liệu&quot;.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className={styles.filtersBar}>
        <div style={{ flex: '1 1 280px' }}>
          <Input
            placeholder="Tìm kiếm nội dung câu hỏi hoặc primary tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          value={selectedPart}
          onChange={(e) => setSelectedPart(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="ALL">Tất cả các Part</option>
          <option value="Part 5">Part 5: Hoàn thành câu</option>
          <option value="Part 6">Part 6: Điền đoạn văn</option>
          <option value="Part 7">Part 7: Đọc hiểu</option>
        </select>

        <select
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="ALL">Tất cả các Tier</option>
          <option value="Draft">Draft</option>
          <option value="CrossModelValid">CrossModelValid</option>
          <option value="BetaActive">BetaActive</option>
          <option value="DataValidatedPractice">DataValidatedPractice</option>
        </select>
      </div>

      {/* Items Table */}
      <table className={styles.itemsTable}>
        <thead>
          <tr>
            <th>Mã & Part</th>
            <th>Nội dung câu hỏi (Stem) & Tag</th>
            <th>Độ khó</th>
            <th>Tier xuất bản</th>
            <th>Số lượt làm</th>
            <th>Tỷ lệ đúng / Phân biệt</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((item) => (
            <tr key={item.id}>
              <td>
                <strong>{item.id}</strong>
                <div style={{ fontSize: '11px', color: 'var(--color-ink-secondary)', marginTop: '2px' }}>
                  {item.part}
                </div>
              </td>
              <td>
                <div style={{ fontWeight: 500, marginBottom: '4px', maxWidth: '420px' }}>
                  {item.stem}
                </div>
                <Badge variant="default">{item.primaryTag}</Badge>
              </td>
              <td>
                <Badge variant={item.difficulty === 'Easy' ? 'success' : item.difficulty === 'Medium' ? 'info' : 'warning'}>
                  {item.difficulty}
                </Badge>
              </td>
              <td>
                <TierBadge tier={item.tier === 'Draft' || item.tier === 'CrossModelValid' ? 'BetaPractice' : (item.tier as any)} />
              </td>
              <td style={{ fontFeatureSettings: 'tnum' }}>
                {item.attemptCount} lượt
              </td>
              <td>
                {item.attemptCount < 30 ? (
                  <span style={{ fontSize: '12px', color: 'var(--color-ink-tertiary)', fontStyle: 'italic' }}>
                    Chưa đủ dữ liệu (&lt;30)
                  </span>
                ) : (
                  <div>
                    <div style={{ fontWeight: 600, color: '#137333' }}>
                      {item.accuracyRate}% đúng
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-ink-secondary)' }}>
                      D-score: {item.discriminationScore}
                    </div>
                  </div>
                )}
              </td>
              <td>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button variant="outline" size="sm" title="Xem chi tiết câu hỏi">
                    <Eye size={14} />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => openQuarantine(item)}
                    title="Đưa vào cách ly khẩn cấp (Quarantine)"
                  >
                    <AlertOctagon size={14} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Quarantine Modal */}
      {quarantineModalOpen && targetItem && (
        <Modal
          isOpen={quarantineModalOpen}
          onClose={() => setQuarantineModalOpen(false)}
          title="Cách ly câu hỏi khỏi kho đề thi (Quarantine)"
        >
          <Alert variant="warning" title="Xác nhận cách ly câu hỏi">
            Câu hỏi <strong>{targetItem.id}</strong> sẽ bị thu hồi ngay lập tức khỏi các bài thi đang phát hành cho học viên theo quy định FR-35/36.
          </Alert>

          <div style={{ margin: '16px 0' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Lý do đưa vào cách ly:
            </label>
            <select
              value={quarantineReason}
              onChange={(e) => setQuarantineReason(e.target.value)}
              className={styles.filterSelect}
              style={{ width: '100%' }}
            >
              <option value="DivergentSolver">Dual-solver phát hiện xung đột đáp án</option>
              <option value="LearnerComplaint">Có báo cáo lỗi từ học viên đang chờ thẩm định</option>
              <option value="LowDiscrimination">Độ phân biệt D-score dưới ngưỡng quy định (&lt;0.2)</option>
              <option value="AmbiguousKey">Đáp án mơ hồ hoặc có nhiều hơn một lựa chọn đúng</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setQuarantineModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button variant="danger" onClick={handleConfirmQuarantine}>
              Xác nhận cách ly
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
