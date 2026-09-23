import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { AudioPlayer } from '../../../components/ui/AudioPlayer';
import { Alert } from '../../../components/ui/Alert';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle,
  HelpCircle,
  Check,
  X,
  FileQuestion,
} from 'lucide-react';
import styles from './Lesson.module.css';

export function LessonPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = 3;

  // Mini-check state
  const [selectedMiniOption, setSelectedMiniOption] = useState<string | null>(null);
  const [miniCheckSubmitted, setMiniCheckSubmitted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [markedRead, setMarkedRead] = useState<Record<number, boolean>>({});

  const handleMiniCheckSubmit = (opt: string) => {
    setSelectedMiniOption(opt);
    setMiniCheckSubmitted(true);
  };

  const handleMarkAsRead = () => {
    setMarkedRead({ ...markedRead, [currentPage]: true });
  };

  return (
    <div className="content-container">
      {/* Top Header */}
      <div className={styles.topNav}>
        <button
          type="button"
          onClick={() => navigate('/learn/roadmap')}
          className={styles.backBtn}
        >
          <ArrowLeft size={16} /> Quay lại lộ trình
        </button>

        <div className={styles.headerRight}>
          <button
            type="button"
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`${styles.bookmarkBtn} ${isBookmarked ? styles.activeBookmark : ''}`}
            aria-label={isBookmarked ? 'Bỏ lưu trang' : 'Lưu trang này'}
          >
            <Bookmark size={16} />
            <span>{isBookmarked ? 'Đã lưu trang' : 'Lưu trang'}</span>
          </button>
        </div>
      </div>

      <div className={styles.lessonLayout}>
        {/* Main Content Area */}
        <main className={styles.mainContent}>
          <div className={styles.lessonHeader}>
            <div className={styles.metaRow}>
              <Badge variant="primary">Part 5 Ngữ pháp</Badge>
              <span className={styles.pageIndicator}>
                Trang {currentPage} / {totalPages}
              </span>
            </div>
            <h1 className={styles.lessonTitle}>
              Bài 4: Mệnh đề Phân từ (Participle Clauses) & Rút gọn trong văn bản thương mại
            </h1>
          </div>

          {currentPage === 1 && (
            <div className={styles.pageBody}>
              <p className={styles.leadParagraph}>
                Trong bài thi TOEIC Reading Part 5 và Part 7, mệnh đề phân từ thường được sử dụng nhằm rút gọn câu, giúp văn bản trở nên súc tích, trang trọng và mang tính chuyên môn cao.
              </p>

              <h2>1. Phân từ hiện tại (-ing) rút gọn mệnh đề chủ động</h2>
              <p>
                Khi hai mệnh đề có cùng chủ ngữ và mang nghĩa chủ động, ta có thể lược bỏ liên từ và đại từ chủ ngữ, chuyển động từ chính sang dạng <strong>V-ing</strong>.
              </p>

              <div className={styles.exampleBox}>
                <div className={styles.exampleOriginal}>
                  <strong>Câu gốc:</strong> Because Mr. Davis arrived early at the airport, he was able to finish the quarterly budget draft.
                </div>
                <div className={styles.exampleReduced}>
                  <strong>Câu rút gọn:</strong> <em>Arriving early at the airport</em>, Mr. Davis was able to finish the quarterly budget draft.
                </div>
              </div>

              {/* Audio Component Example */}
              <div style={{ margin: 'var(--space-6) 0' }}>
                <AudioPlayer
                  title="Nghe phát âm chuẩn câu ví dụ (Giọng Anh-Mỹ):"
                  transcript="Arriving early at the airport, Mr. Davis was able to finish the quarterly budget draft."
                />
              </div>

              {/* Interactive Mini-Check (FR-08) */}
              <div className={styles.miniCheckCard}>
                <div className={styles.miniCheckHeader}>
                  <HelpCircle size={18} className={styles.checkIcon} />
                  <h3>Mini-Check 1 (Kiểm tra nhanh)</h3>
                </div>
                <p className={styles.miniPrompt}>
                  Điền dạng đúng của từ vào chỗ trống: <br />
                  "------- the contract terms thoroughly, the legal advisor approved the final draft."
                </p>

                <div className={styles.miniOptions}>
                  {[
                    { key: 'A', text: 'Review' },
                    { key: 'B', text: 'Reviewed' },
                    { key: 'C', text: 'Reviewing', isCorrect: true },
                    { key: 'D', text: 'To review' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={miniCheckSubmitted}
                      onClick={() => handleMiniCheckSubmit(opt.key)}
                      className={`${styles.miniOptionBtn} ${
                        selectedMiniOption === opt.key ? styles.selectedMini : ''
                      } ${
                        miniCheckSubmitted && opt.isCorrect ? styles.correctMini : ''
                      } ${
                        miniCheckSubmitted && selectedMiniOption === opt.key && !opt.isCorrect
                          ? styles.wrongMini
                          : ''
                      }`}
                    >
                      <span className={styles.optionLabel}>{opt.key}</span>
                      <span>{opt.text}</span>
                      {miniCheckSubmitted && opt.isCorrect && (
                        <Check size={16} style={{ marginLeft: 'auto', color: 'var(--color-success)' }} />
                      )}
                      {miniCheckSubmitted && selectedMiniOption === opt.key && !opt.isCorrect && (
                        <X size={16} style={{ marginLeft: 'auto', color: 'var(--color-danger)' }} />
                      )}
                    </button>
                  ))}
                </div>

                {miniCheckSubmitted && (
                  <div className={styles.miniFeedback}>
                    {selectedMiniOption === 'C' ? (
                      <Alert variant="success" title="Chính xác!">
                        Cố vấn pháp lý chủ động xem xét hợp đồng ("Reviewing the contract terms thoroughly..."), do đó dùng V-ing rút gọn mệnh đề chủ động.
                      </Alert>
                    ) : (
                      <Alert variant="warning" title="Chưa chính xác:">
                        Chủ ngữ "legal advisor" thực hiện hành động kiểm tra hợp đồng một cách chủ động, vì vậy ta phải dùng phân từ hiện tại <strong>Reviewing</strong> (V-ing) thay vì phân từ quá khứ (V-ed).
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentPage === 2 && (
            <div className={styles.pageBody}>
              <h2>2. Phân từ quá khứ (-ed) rút gọn mệnh đề bị động</h2>
              <p>
                Khi chủ ngữ nhận tác động của hành động, mệnh đề được rút gọn bằng <strong>V3/V-ed</strong>.
              </p>
              <div className={styles.exampleBox}>
                <div className={styles.exampleOriginal}>
                  <strong>Câu gốc:</strong> Because it was accompanied by an official receipt, the return request was processed immediately.
                </div>
                <div className={styles.exampleReduced}>
                  <strong>Câu rút gọn:</strong> <em>Accompanied by an official receipt</em>, the return request was processed immediately.
                </div>
              </div>
            </div>
          )}

          {currentPage === 3 && (
            <div className={styles.pageBody}>
              <h2>3. Tổng kết bài học và Quiz luyện tập cuối bài</h2>
              <p>
                Bạn đã hoàn thành các phần kiến thức cốt lõi về mệnh đề phân từ. Hãy thử sức với bài kiểm tra quiz 5 câu để củng cố kiến thức trước khi chuyển sang bài tiếp theo.
              </p>

              <div className={styles.quizTeaser}>
                <FileQuestion size={36} className={styles.quizIcon} />
                <h3>Quiz kiểm tra: Mệnh đề phân từ</h3>
                <p>Gồm 5 câu hỏi phân loại ngữ cảnh TOEIC Part 5 • Điểm đạt khuyến nghị: 4/5 câu (80%)</p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/learn/practice')}
                >
                  Làm Quiz kiểm tra ngay
                </Button>
              </div>
            </div>
          )}

          {/* Footer Action Bar */}
          <footer className={styles.lessonFooter}>
            <div className={styles.footerLeft}>
              <Button
                variant="secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Trang trước
              </Button>

              <Button
                variant={markedRead[currentPage] ? 'outline' : 'secondary'}
                onClick={handleMarkAsRead}
                leftIcon={markedRead[currentPage] ? <Check size={16} /> : undefined}
              >
                {markedRead[currentPage] ? 'Đã xác nhận đọc' : 'Đánh dấu đã đọc'}
              </Button>
            </div>

            <div className={styles.footerRight}>
              {currentPage < totalPages ? (
                <Button
                  variant="primary"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  rightIcon={<ArrowRight size={16} />}
                >
                  Trang tiếp theo
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => navigate('/learn/roadmap')}
                  leftIcon={<CheckCircle size={16} />}
                >
                  Hoàn thành bài học
                </Button>
              )}
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
