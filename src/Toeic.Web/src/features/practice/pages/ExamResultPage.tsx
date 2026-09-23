import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { TierBadge, Badge } from '../../../components/ui/Badge';
import {
  CheckCircle,
  XCircle,
  Clock,
  Check,
  BookmarkPlus,
  ArrowLeft,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../../../lib/api/client';
import { ExamResult } from '../../../types/practice';
import styles from './ExamResult.module.css';

export function ExamResultPage() {
  const { attemptId = '' } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [addedErrors, setAddedErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (attemptId) {
      api.getExamResult(attemptId).then(setResult);
    }
  }, [attemptId]);

  if (!result) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Đang tính điểm và chuẩn bị bản phân tích kết quả...</p>
      </div>
    );
  }

  const accuracyPercent = Math.round((result.rawScore / result.maxScore) * 100);

  const handleAddMistake = (qId: string) => {
    setAddedErrors({ ...addedErrors, [qId]: true });
  };

  return (
    <div className="content-container">
      {/* Top Banner Navigation */}
      <div className={styles.topNav}>
        <button
          type="button"
          onClick={() => navigate('/learn/practice')}
          className={styles.backBtn}
        >
          <ArrowLeft size={16} /> Danh sách đề luyện thi
        </button>
      </div>

      {/* Main Score Summary Card */}
      <div className={styles.summaryCard}>
        <div className={styles.summaryTop}>
          <div className={styles.metaRow}>
            <span className={styles.modeTag}>KẾT QUẢ {result.mode.toUpperCase()}</span>
            <TierBadge tier={result.tier} />
          </div>
          <h1 className={styles.formTitle}>{result.formTitle}</h1>
        </div>

        <div className={styles.scoreRow}>
          <div className={styles.rawScoreBox}>
            <span className={styles.scoreLabel}>Điểm thô đạt được</span>
            <div className={styles.scoreNumbers}>
              <strong className={`${styles.rawEarned} text-tabular`}>{result.rawScore}</strong>
              <span className={`${styles.rawMax} text-tabular`}>/{result.maxScore}</span>
            </div>
            <span className={styles.scoreSubtext}>
              Độ chính xác: <strong className="text-tabular">{accuracyPercent}%</strong> ({result.answeredCount}/{result.totalQuestions} câu đã làm)
            </span>
          </div>

          <div className={styles.timeBox}>
            <div className={styles.statLine}>
              <Clock size={16} />
              <span>Thời gian làm bài: <strong className="text-tabular">{Math.floor(result.timeSpentSeconds / 60)} phút</strong></span>
            </div>
            <div className={styles.disclaimerNote}>
              <ShieldAlert size={16} className={styles.discIcon} />
              <span>
                * Điểm thi phản ánh kết quả luyện tập của đề AI Item Factory. Điểm số không quy đổi tương đương với chứng chỉ chính thức của ETS.
              </span>
            </div>
          </div>
        </div>

        <div className={styles.actionRow}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/learn/practice')}
            leftIcon={<RotateCcw size={16} />}
          >
            Làm lại đề này
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/learn/today')}
          >
            Trở về màn hình Hôm nay
          </Button>
        </div>
      </div>

      {/* Detailed Question By Question Review (FR-27) */}
      <section className={styles.reviewSection} aria-label="Chi tiết từng câu hỏi">
        <div className={styles.reviewHeader}>
          <h2>Chi tiết lời giải và đánh giá từng câu</h2>
          <p>
            Được phân loại theo đáp án đã chọn, đáp án chính xác, lời giải chi tiết và trích xuất bằng chứng đọc hiểu.
          </p>
        </div>

        <div className={styles.questionsList}>
          {result.questions.map((q) => {
            const isAdded = addedErrors[q.questionId];

            return (
              <div
                key={q.questionId}
                className={`${styles.reviewCard} ${q.isCorrect ? styles.correctCard : styles.incorrectCard}`}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.headerLeft}>
                    {q.isCorrect ? (
                      <span className={styles.badgeCorrect}>
                        <CheckCircle size={16} /> Làm đúng
                      </span>
                    ) : (
                      <span className={styles.badgeIncorrect}>
                        <XCircle size={16} /> Câu này cần xem lại
                      </span>
                    )}
                    <span className={styles.seqBadge}>Câu {q.sequenceNumber} ({q.part})</span>
                    <Badge variant="default">{q.knowledgeTag}</Badge>
                  </div>

                  {!q.isCorrect && (
                    <Button
                      variant={isAdded ? 'outline' : 'secondary'}
                      size="sm"
                      onClick={() => handleAddMistake(q.questionId)}
                      leftIcon={isAdded ? <Check size={14} /> : <BookmarkPlus size={14} />}
                    >
                      {isAdded ? 'Đã lưu vào sổ lỗi' : 'Thêm vào sổ lỗi'}
                    </Button>
                  )}
                </div>

                {q.stimulusText && (
                  <div className={styles.stimulusExcerpt}>
                    <strong>Ngữ cảnh đoạn đọc (Part 7):</strong>
                    <p>{q.stimulusText}</p>
                  </div>
                )}

                <p className={styles.prompt}>{q.prompt}</p>

                {/* Option Analysis List */}
                <div className={styles.reviewOptions}>
                  {q.options.map((opt) => {
                    const isUserPick = opt.id === q.selectedOptionId;
                    const isCorrectAnswer = opt.id === q.correctOptionId;

                    return (
                      <div
                        key={opt.id}
                        className={`${styles.reviewOptionItem} ${
                          isCorrectAnswer ? styles.optCorrect : ''
                        } ${isUserPick && !isCorrectAnswer ? styles.optWrongUser : ''}`}
                      >
                        <span className={styles.optLabel}>{opt.label}</span>
                        <span className={styles.optText}>{opt.text}</span>
                        {isCorrectAnswer && (
                          <span className={styles.optStatusBadge}>Đáp án đúng</span>
                        )}
                        {isUserPick && !isCorrectAnswer && (
                          <span className={styles.optStatusUser}>Lựa chọn của bạn</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation & Evidence */}
                <div className={styles.explanationBox}>
                  <h4>Giải thích chi tiết:</h4>
                  <p>{q.explanation}</p>
                  {q.evidenceQuote && (
                    <div className={styles.evidenceBox}>
                      <strong>Bằng chứng trích xuất từ văn bản:</strong>
                      <blockquote className={styles.blockquote}>
                        "{q.evidenceQuote}"
                      </blockquote>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
