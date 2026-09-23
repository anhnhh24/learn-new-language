import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  Bookmark,
  CheckCircle,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../../lib/api/client';
import { MistakeRecord, MistakeStatus } from '../../../types/review';
import styles from './ErrorNotebook.module.css';

export function ErrorNotebookPage() {
  const navigate = useNavigate();
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  useEffect(() => {
    api.getMistakes().then(setMistakes);
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: MistakeStatus) => {
    await api.updateMistakeStatus(id, newStatus);
    setMistakes((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );
  };

  const filteredMistakes = mistakes.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (selectedTag !== 'all' && m.knowledgeTag !== selectedTag) return false;
    return true;
  });

  const allTags = Array.from(new Set(mistakes.map((m) => m.knowledgeTag)));

  return (
    <div className="content-container">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Sổ lỗi sai</h1>
          <p className={styles.subtitle}>
            Tự động lưu và phân loại các câu làm sai theo kiến thức ngữ pháp và đọc hiểu (UI-08).
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className={styles.filterSection}>
        <div className={styles.statusTabs}>
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'Open', label: 'Cần xem (Open)' },
            { key: 'Improving', label: 'Đang tiến bộ' },
            { key: 'Resolved', label: 'Đã khắc phục' },
            { key: 'Ignored', label: 'Đã bỏ qua' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`${styles.tabBtn} ${statusFilter === tab.key ? styles.activeTab : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.tagFilter}>
          <label htmlFor="tag-select" className={styles.tagLabel}>Chủ điểm:</label>
          <select
            id="tag-select"
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className={styles.tagSelect}
          >
            <option value="all">Tất cả chủ điểm kiến thức</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mistake Cards List */}
      {filteredMistakes.length === 0 ? (
        <EmptyState
          icon={<Bookmark size={36} />}
          title="Không có câu hỏi nào trong danh mục này"
          description="Bạn chưa có lỗi sai nào chưa giải quyết hoặc các câu hỏi đã được lọc hết."
          action={
            <Button variant="primary" size="sm" onClick={() => navigate('/learn/practice')}>
              Luyện thêm đề mới
            </Button>
          }
        />
      ) : (
        <div className={styles.mistakeList}>
          {filteredMistakes.map((m) => (
            <div key={m.id} className={styles.mistakeCard}>
              <div className={styles.cardHeader}>
                <div className={styles.metaLeft}>
                  <Badge variant="primary">{m.part}</Badge>
                  <Badge variant="default">{m.knowledgeTag}</Badge>
                  <span className={`${styles.countLabel} text-tabular`}>Làm sai: {m.mistakeCount} lần</span>
                </div>

                <div className={styles.statusBadge}>
                  {m.status === 'Open' && <Badge variant="danger">Đang mở (Cần ôn)</Badge>}
                  {m.status === 'Improving' && <Badge variant="warning">Đang tiến bộ</Badge>}
                  {m.status === 'Resolved' && <Badge variant="success">Đã khắc phục</Badge>}
                  {m.status === 'Ignored' && <Badge variant="default">Đã bỏ qua</Badge>}
                </div>
              </div>

              <p className={styles.prompt}>{m.prompt}</p>

              <div className={styles.answerComparison}>
                <div className={styles.answerCol}>
                  <span className={styles.colLabel}>Lựa chọn đã sai:</span>
                  <div className={styles.wrongBox}>{m.selectedAnswer}</div>
                </div>

                <div className={styles.answerCol}>
                  <span className={styles.colLabel}>Đáp án chính xác:</span>
                  <div className={styles.correctBox}>{m.correctAnswer}</div>
                </div>
              </div>

              <div className={styles.explanationBox}>
                <HelpCircle size={16} className={styles.helpIcon} />
                <p className={styles.explanationText}>
                  <strong>Phân tích: </strong>
                  {m.explanation}
                </p>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.footerLeft}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/learn/practice')}
                    leftIcon={<Play size={14} />}
                  >
                    Luyện câu tương đương
                  </Button>
                </div>

                <div className={styles.footerRight}>
                  {m.status !== 'Resolved' && (
                    <Button
                      variant="text"
                      size="sm"
                      onClick={() => handleUpdateStatus(m.id, 'Resolved')}
                      leftIcon={<CheckCircle size={14} />}
                    >
                      Đánh dấu đã hiểu
                    </Button>
                  )}
                  {m.status === 'Resolved' && (
                    <Button
                      variant="text"
                      size="sm"
                      onClick={() => handleUpdateStatus(m.id, 'Open')}
                      leftIcon={<RotateCcw size={14} />}
                    >
                      Mở lại câu này
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
