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
  Sparkles,
  AlertTriangle,
  Check,
  XCircle,
  Zap,
} from 'lucide-react';
import { api } from '../../../lib/api/client';
import { MistakeRecord, MistakeStatus } from '../../../types/review';
import styles from './ErrorNotebook.module.css';

interface ReattemptState {
  [mistakeId: string]: {
    active: boolean;
    selectedKey: string | null;
    isCorrect?: boolean;
  };
}

export function ErrorNotebookPage() {
  const navigate = useNavigate();
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [partFilter, setPartFilter] = useState<string>('all');
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reattempts, setReattempts] = useState<ReattemptState>({});

  useEffect(() => {
    api.getMistakes().then(setMistakes);
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: MistakeStatus) => {
    await api.updateMistakeStatus(id, newStatus);
    setMistakes((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );
  };

  const toggleReattempt = (id: string) => {
    setReattempts((prev) => ({
      ...prev,
      [id]: {
        active: !prev[id]?.active,
        selectedKey: null,
      },
    }));
  };

  const handleSelectOption = (mistakeId: string, optionKey: string, isCorrect: boolean) => {
    setReattempts((prev) => ({
      ...prev,
      [mistakeId]: {
        active: true,
        selectedKey: optionKey,
        isCorrect,
      },
    }));

    if (isCorrect) {
      // Auto-update to improving or resolved if answered correctly
      setMistakes((prev) =>
        prev.map((m) =>
          m.id === mistakeId && m.status === 'Open'
            ? { ...m, status: 'Improving' }
            : m
        )
      );
    }
  };

  // Metrics
  const totalMistakes = mistakes.length;
  const openCount = mistakes.filter((m) => m.status === 'Open').length;
  const improvingCount = mistakes.filter((m) => m.status === 'Improving').length;
  const resolvedCount = mistakes.filter((m) => m.status === 'Resolved').length;
  const resolutionRate = totalMistakes > 0 ? Math.round((resolvedCount / totalMistakes) * 100) : 0;

  // Filter options
  const parts = Array.from(new Set(mistakes.map((m) => m.part)));
  const errorTypes = Array.from(
    new Set(mistakes.map((m) => m.errorType).filter(Boolean) as string[])
  );

  const filteredMistakes = mistakes.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (partFilter !== 'all' && m.part !== partFilter) return false;
    if (errorTypeFilter !== 'all' && m.errorType !== errorTypeFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchPrompt = m.prompt.toLowerCase().includes(q);
      const matchExpl = m.explanation.toLowerCase().includes(q);
      const matchTag = m.knowledgeTag.toLowerCase().includes(q);
      if (!matchPrompt && !matchExpl && !matchTag) return false;
    }
    return true;
  });

  return (
    <div className="content-container">
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>Sổ tay lỗi sai thông minh</h1>
            <p className={styles.subtitle}>
              Lưu trữ tự động các câu làm sai, phân tích bẫy đề thi theo phương pháp PREP và cung cấp chế độ làm lại trực tiếp để triệt tiêu lỗi lặp lại.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/learn/practice')}
            leftIcon={<Play size={14} />}
          >
            Luyện đề mới
          </Button>
        </div>
      </div>

      {/* Analytics Summary Banner */}
      <div className={styles.statsBanner}>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>
              <Bookmark size={13} /> Tổng lỗi ghi nhận
            </span>
            <span className={styles.statValue}>{totalMistakes}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>
              <AlertTriangle size={13} /> Cần khắc phục
            </span>
            <span className={`${styles.statValue} ${styles.statValueDanger}`}>
              {openCount}
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>
              <Sparkles size={13} /> Đang tiến bộ
            </span>
            <span className={`${styles.statValue} ${styles.statValueWarning}`}>
              {improvingCount}
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>
              <CheckCircle size={13} /> Đã làm chủ
            </span>
            <span className={`${styles.statValue} ${styles.statValueSuccess}`}>
              {resolvedCount}
            </span>
          </div>
        </div>

        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span>Tỷ lệ khắc phục lỗi triệt để</span>
            <span className="font-semibold text-tabular">{resolutionRate}% hoàn thành ({resolvedCount}/{totalMistakes} câu)</span>
          </div>
          <div className={styles.progressBarContainer}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${resolutionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className={styles.filterSection}>
        <div className={styles.filterControlsRow}>
          <div className={styles.statusTabs}>
            {[
              { key: 'all', label: `Tất cả (${totalMistakes})` },
              { key: 'Open', label: `Cần xem (${openCount})` },
              { key: 'Improving', label: `Đang tiến bộ (${improvingCount})` },
              { key: 'Resolved', label: `Đã làm chủ (${resolvedCount})` },
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

          <div className={styles.selectGroup}>
            <select
              value={partFilter}
              onChange={(e) => setPartFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Tất cả Part</option>
              {parts.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              value={errorTypeFilter}
              onChange={(e) => setErrorTypeFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Tất cả dạng lỗi</option>
              {errorTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Tìm kiếm lỗi sai..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mistake Cards List */}
      {filteredMistakes.length === 0 ? (
        <EmptyState
          icon={<Bookmark size={36} />}
          title="Không tìm thấy câu hỏi phù hợp bộ lọc"
          description="Bạn chưa có lỗi sai nào trong danh mục đã chọn hoặc tất cả các câu đã được khắc phục hoàn toàn!"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusFilter('all');
                setPartFilter('all');
                setErrorTypeFilter('all');
                setSearchQuery('');
              }}
            >
              Xóa tất cả bộ lọc
            </Button>
          }
        />
      ) : (
        <div className={styles.mistakeList}>
          {filteredMistakes.map((m) => {
            const reattempt = reattempts[m.id];
            const isReattempting = reattempt?.active;

            return (
              <div key={m.id} className={styles.mistakeCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.metaLeft}>
                    <Badge variant="primary">{m.part}</Badge>
                    <Badge variant="default">{m.knowledgeTag}</Badge>
                    {m.errorType && (
                      <span className={styles.errorTypeBadge}>
                        {m.errorType}
                      </span>
                    )}
                    <span className={`${styles.countLabel} text-tabular`}>
                      Sai {m.mistakeCount} lần
                    </span>
                  </div>

                  <div className={styles.statusBadge}>
                    {m.status === 'Open' && <Badge variant="danger">Cần ôn luyện</Badge>}
                    {m.status === 'Improving' && <Badge variant="warning">Đang tiến bộ</Badge>}
                    {m.status === 'Resolved' && <Badge variant="success">Đã khắc phục</Badge>}
                    {m.status === 'Ignored' && <Badge variant="default">Đã bỏ qua</Badge>}
                  </div>
                </div>

                <p className={styles.prompt}>{m.prompt}</p>
                {m.translation && (
                  <p className={styles.promptTranslation}>Dịch nghĩa: {m.translation}</p>
                )}

                {/* Interactive Re-attempt View or Standard Answer Comparison */}
                {isReattempting && m.options && m.options.length > 0 ? (
                  <div className={styles.reattemptContainer}>
                    <div className={styles.reattemptHeader}>
                      <span className={styles.reattemptTitle}>
                        <Zap size={14} color="#f59e0b" /> Chế độ làm lại trực tiếp
                      </span>
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => toggleReattempt(m.id)}
                      >
                        Đóng làm lại
                      </Button>
                    </div>

                    <div className={styles.optionsGrid}>
                      {m.options.map((opt) => {
                        const isSelected = reattempt.selectedKey === opt.key;
                        let optionClass = styles.optionBtn;
                        if (reattempt.selectedKey) {
                          if (opt.isCorrect) {
                            optionClass = `${styles.optionBtn} ${styles.optionCorrect}`;
                          } else if (isSelected && !opt.isCorrect) {
                            optionClass = `${styles.optionBtn} ${styles.optionWrong}`;
                          }
                        }

                        return (
                          <button
                            key={opt.key}
                            type="button"
                            className={optionClass}
                            disabled={!!reattempt.selectedKey}
                            onClick={() =>
                              handleSelectOption(m.id, opt.key, opt.isCorrect)
                            }
                          >
                            <span className={styles.optionKey}>{opt.key}</span>
                            <span>{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {reattempt.selectedKey && (
                      reattempt.isCorrect ? (
                        <div className={styles.feedbackBannerSuccess}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Check size={16} />
                            <span><strong>Chính xác!</strong> Bạn đã nắm vững kiến thức này.</span>
                          </div>
                          {m.status !== 'Resolved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(m.id, 'Resolved')}
                            >
                              Đánh dấu đã hiểu hoàn toàn
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className={styles.feedbackBannerDanger}>
                          <XCircle size={16} />
                          <span><strong>Chưa chính xác!</strong> Hãy xem kỹ giải thích và bẫy đề thi bên dưới.</span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
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
                )}

                <div className={styles.explanationBox}>
                  <HelpCircle size={16} className={styles.helpIcon} />
                  <div className={styles.explanationContent}>
                    <p className={styles.explanationText}>
                      <strong>Phân tích chuyên sâu: </strong>
                      {m.explanation}
                    </p>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.footerLeft}>
                    {m.options && m.options.length > 0 && (
                      <Button
                        variant={isReattempting ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => toggleReattempt(m.id)}
                        leftIcon={<RotateCcw size={14} />}
                      >
                        {isReattempting ? 'Xem đáp án' : 'Làm lại câu này'}
                      </Button>
                    )}
                    <Button
                      variant="text"
                      size="sm"
                      onClick={() => navigate('/learn/practice')}
                      leftIcon={<Play size={14} />}
                    >
                      Luyện câu tương tự
                    </Button>
                  </div>

                  <div className={styles.footerRight}>
                    {m.status !== 'Resolved' ? (
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => handleUpdateStatus(m.id, 'Resolved')}
                        leftIcon={<CheckCircle size={14} />}
                      >
                        Đánh dấu đã hiểu
                      </Button>
                    ) : (
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
            );
          })}
        </div>
      )}
    </div>
  );
}
