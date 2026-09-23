import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExamLayout } from '../../../layouts/ExamLayout';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Badge } from '../../../components/ui/Badge';
import {
  Flag,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { api } from '../../../lib/api/client';
import { AttemptSession, QuestionSnapshot } from '../../../types/practice';
import styles from './ExamRoom.module.css';

export function ExamRoomPage() {
  const { attemptId = 'mock-attempt' } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<AttemptSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);

  // Timer & Deadline Sync
  const [remainingSeconds, setRemainingSeconds] = useState<number>(15 * 60);

  // Autosave State Machine
  const [autosaveState, setAutosaveState] = useState<'saving' | 'saved' | 'failed' | 'offline'>('saved');
  const [savedAt, setSavedAt] = useState<string>('');
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  // UI Modals
  const [isQuestionMapOpen, setIsQuestionMapOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debounceTimerRef = useRef<number | null>(null);

  // Load session
  useEffect(() => {
    api.getActiveAttempt(attemptId).then((sess) => {
      if (sess) {
        setSession(sess);
        setAnswers(sess.responses || {});
        setFlaggedIds(sess.flaggedQuestionIds || []);

        // Compute remaining seconds from server deadline
        const deadlineMs = new Date(sess.deadline).getTime();
        const nowMs = Date.now();
        const diffSecs = Math.max(0, Math.floor((deadlineMs - nowMs) / 1000));
        setRemainingSeconds(diffSecs > 0 ? diffSecs : 15 * 60);
      }
    });

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      setAutosaveState('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [attemptId]);

  // Countdown Interval (Synchronized with deadline offset)
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmitOnTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAutoSubmitOnTimeout = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await api.submitAttempt(attemptId);
      navigate(`/learn/practice/${attemptId}/result`);
    } catch {
      // fallback
      navigate(`/learn/practice/${attemptId}/result`);
    }
  }, [attemptId, navigate]);

  // Answer Selection with Debounce Autosave
  const handleSelectOption = (questionId: string, optionId: string) => {
    const nextAnswers = { ...answers, [questionId]: optionId };
    setAnswers(nextAnswers);

    if (isOffline) {
      setAutosaveState('offline');
      return;
    }

    setAutosaveState('saving');
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(async () => {
      try {
        const ack = await api.saveResponse(attemptId, questionId, optionId);
        setSavedAt(ack.savedAt);
        setAutosaveState('saved');
      } catch {
        setAutosaveState('failed');
      }
    }, 800);
  };

  const handleToggleFlag = async (questionId: string) => {
    const nextFlags = await api.toggleFlagQuestion(attemptId, questionId);
    setFlaggedIds(nextFlags);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.submitAttempt(attemptId);
      setIsSubmitModalOpen(false);
      navigate(`/learn/practice/${attemptId}/result`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p>Đang tải dữ liệu phòng thi và kết nối máy chủ...</p>
      </div>
    );
  }

  const questions = session.questions;
  const currentQuestion: QuestionSnapshot = questions[currentQuestionIndex] || questions[0];
  const isCurrentFlagged = flaggedIds.includes(currentQuestion.id);
  const selectedOptionId = answers[currentQuestion.id];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <ExamLayout
      title={session.formTitle}
      tier={session.tier}
      remainingSeconds={remainingSeconds}
      autosaveState={autosaveState}
      savedAt={savedAt}
      isOffline={isOffline}
      totalQuestions={questions.length}
      answeredCount={answeredCount}
      onToggleQuestionMap={() => setIsQuestionMapOpen(true)}
      onSubmit={() => setIsSubmitModalOpen(true)}
    >
      <div className={styles.roomContent}>
        {/* If Part 7: Split View with Stimulus on Left */}
        {currentQuestion.stimulusText ? (
          <div className={styles.splitLayout}>
            <section className={styles.stimulusPane} aria-label="Đoạn văn đọc hiểu">
              <div className={styles.stimulusHeader}>
                <FileText size={16} />
                <span>{currentQuestion.stimulusTitle || 'Văn bản đọc hiểu Part 7'}</span>
              </div>
              <div className={styles.stimulusBody}>
                <pre className={styles.stimulusPre}>{currentQuestion.stimulusText}</pre>
              </div>
            </section>

            <section className={styles.questionPane} aria-label="Nội dung câu hỏi">
              <div className={styles.questionHeader}>
                <div className={styles.questionMeta}>
                  <Badge variant="primary">Câu {currentQuestion.sequenceNumber}</Badge>
                  {currentQuestion.knowledgeTag && (
                    <span className={styles.tagText}>{currentQuestion.knowledgeTag}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleFlag(currentQuestion.id)}
                  className={`${styles.flagBtn} ${isCurrentFlagged ? styles.activeFlag : ''}`}
                >
                  <Flag size={15} />
                  <span>{isCurrentFlagged ? 'Đã đánh dấu xem lại' : 'Đánh dấu câu'}</span>
                </button>
              </div>

              <p className={styles.questionPrompt}>{currentQuestion.prompt}</p>

              <div className={styles.optionsList}>
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                    className={`${styles.optionBtn} ${selectedOptionId === opt.id ? styles.selectedOption : ''}`}
                  >
                    <span className={styles.optionLabel}>{opt.label}</span>
                    <span className={styles.optionText}>{opt.text}</span>
                  </button>
                ))}
              </div>

              <div className={styles.navRow}>
                <Button
                  variant="secondary"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                  leftIcon={<ArrowLeft size={16} />}
                >
                  Câu trước
                </Button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <Button
                    variant="primary"
                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                    rightIcon={<ArrowRight size={16} />}
                  >
                    Câu tiếp theo
                  </Button>
                ) : (
                  <Button variant="primary" onClick={() => setIsSubmitModalOpen(true)}>
                    Kiểm tra và Nộp bài
                  </Button>
                )}
              </div>
            </section>
          </div>
        ) : (
          /* Part 5: Single Card Focused View */
          <div className={styles.singleCardLayout}>
            <div className={styles.questionCard}>
              <div className={styles.questionHeader}>
                <div className={styles.questionMeta}>
                  <Badge variant="primary">Câu {currentQuestion.sequenceNumber}</Badge>
                  {currentQuestion.knowledgeTag && (
                    <span className={styles.tagText}>{currentQuestion.knowledgeTag}</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleFlag(currentQuestion.id)}
                  className={`${styles.flagBtn} ${isCurrentFlagged ? styles.activeFlag : ''}`}
                >
                  <Flag size={15} />
                  <span>{isCurrentFlagged ? 'Đã đánh dấu xem lại' : 'Đánh dấu câu'}</span>
                </button>
              </div>

              <p className={styles.questionPrompt}>{currentQuestion.prompt}</p>

              <div className={styles.optionsList}>
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                    className={`${styles.optionBtn} ${selectedOptionId === opt.id ? styles.selectedOption : ''}`}
                  >
                    <span className={styles.optionLabel}>{opt.label}</span>
                    <span className={styles.optionText}>{opt.text}</span>
                  </button>
                ))}
              </div>

              <div className={styles.navRow}>
                <Button
                  variant="secondary"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                  leftIcon={<ArrowLeft size={16} />}
                >
                  Câu trước
                </Button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <Button
                    variant="primary"
                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                    rightIcon={<ArrowRight size={16} />}
                  >
                    Câu tiếp theo
                  </Button>
                ) : (
                  <Button variant="primary" onClick={() => setIsSubmitModalOpen(true)}>
                    Kiểm tra và Nộp bài
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Question Map Drawer (Modal) */}
      <Modal
        isOpen={isQuestionMapOpen}
        onClose={() => setIsQuestionMapOpen(false)}
        title="Danh sách câu hỏi bài thi"
        description="Bấm vào câu hỏi bất kỳ để chuyển nhanh tới câu đó."
      >
        <div className={styles.mapGrid}>
          {questions.map((q, idx) => {
            const isAnswered = Boolean(answers[q.id]);
            const isFlagged = flaggedIds.includes(q.id);
            const isCurrent = idx === currentQuestionIndex;

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  setCurrentQuestionIndex(idx);
                  setIsQuestionMapOpen(false);
                }}
                className={`${styles.mapGridItem} ${isAnswered ? styles.mapAnswered : ''} ${
                  isFlagged ? styles.mapFlagged : ''
                } ${isCurrent ? styles.mapCurrent : ''}`}
              >
                <span className="text-tabular">{q.sequenceNumber}</span>
                {isFlagged && <Flag size={10} className={styles.flagIconMarker} />}
              </button>
            );
          })}
        </div>

        <div className={styles.mapLegend}>
          <div className={styles.legendItem}>
            <span className={`${styles.legendBox} ${styles.mapAnswered}`} />
            <span>Đã làm ({answeredCount})</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendBox} ${styles.mapFlagged}`} />
            <span>Đã đánh dấu ({flaggedIds.length})</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendBox} />
            <span>Chưa làm ({unansweredCount})</span>
          </div>
        </div>
      </Modal>

      {/* Submit Confirmation Modal (FR-25) */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Xác nhận nộp bài thi"
        description="Sau khi nộp, hệ thống sẽ chốt toàn bộ đáp án của bạn và chuyển sang phần chấm điểm."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsSubmitModalOpen(false)}>
              Tiếp tục làm bài
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              Nộp bài và xem kết quả
            </Button>
          </>
        }
      >
        <div className={styles.submitModalBody}>
          {unansweredCount > 0 ? (
            <div className={styles.warningBox}>
              <AlertCircle size={20} className={styles.warnIcon} />
              <div>
                <strong>Bạn còn {unansweredCount} câu hỏi chưa trả lời!</strong>
                <p>Các câu bỏ trống sẽ được tính 0 điểm theo quy tắc chấm điểm trắc nghiệm TOEIC.</p>
              </div>
            </div>
          ) : (
            <div className={styles.successBox}>
              <strong>Bạn đã hoàn thành đủ {questions.length}/{questions.length} câu hỏi.</strong>
            </div>
          )}

          <div className={styles.statsSummary}>
            <div className={styles.statRow}>
              <span>Tổng số câu hỏi:</span>
              <strong className="text-tabular">{questions.length}</strong>
            </div>
            <div className={styles.statRow}>
              <span>Số câu đã chọn đáp án:</span>
              <strong className="text-tabular">{answeredCount}</strong>
            </div>
            <div className={styles.statRow}>
              <span>Số câu đánh dấu xem lại:</span>
              <strong className="text-tabular">{flaggedIds.length}</strong>
            </div>
          </div>
        </div>
      </Modal>
    </ExamLayout>
  );
}
