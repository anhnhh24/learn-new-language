import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Bookmark, 
  Layers, 
  ArrowRight, 
  RotateCcw,
  HelpCircle
} from 'lucide-react';
import { Button, Badge, Modal, Input, Textarea, Alert } from '../../../components/ui';
import { LiveQuizPage } from '../../live/LiveQuizPage';
import styles from './QuizRunner.module.css';

interface QuizQuestion {
  id: string;
  number: number;
  stem: string;
  options: { id: string; letter: string; text: string }[];
  correctOptionId: string;
  explanation: string;
  primaryTag: string;
  tier: 'BetaPractice' | 'DataValidatedPractice';
}

const SAMPLE_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q-501',
    number: 1,
    stem: 'The marketing department will conduct a customer satisfaction survey _______ the end of the second fiscal quarter.',
    options: [
      { id: 'opt-a', letter: 'A', text: 'prior' },
      { id: 'opt-b', letter: 'B', text: 'before' },
      { id: 'opt-c', letter: 'C', text: 'earlier' },
      { id: 'opt-d', letter: 'D', text: 'ahead' },
    ],
    correctOptionId: 'opt-b',
    explanation: 'Giới từ "before" đi kèm trực tiếp với một mốc thời gian ("the end of the second fiscal quarter"). Các từ khác cần giới từ phụ: "prior to", "ahead of", hoặc trạng từ so sánh "earlier than".',
    primaryTag: 'grammar.prepositions',
    tier: 'BetaPractice',
  },
  {
    id: 'q-502',
    number: 2,
    stem: 'All technicians must wear protective gear _______ entering the semiconductor fabrication laboratory.',
    options: [
      { id: 'opt-a', letter: 'A', text: 'when' },
      { id: 'opt-b', letter: 'B', text: 'during' },
      { id: 'opt-c', letter: 'C', text: 'despite' },
      { id: 'opt-d', letter: 'D', text: 'among' },
    ],
    correctOptionId: 'opt-a',
    explanation: 'Liên từ "when" có thể đi kèm cấu trúc rút gọn phân từ chủ động V-ing ("when entering"). Giới từ "during" chỉ đi kèm danh từ chỉ thời kỳ, không đi kèm trực tiếp với V-ing mang tân ngữ.',
    primaryTag: 'grammar.participles',
    tier: 'DataValidatedPractice',
  },
  {
    id: 'q-503',
    number: 3,
    stem: 'The board of directors expressed their _______ for the research team’s breakthrough in energy efficiency.',
    options: [
      { id: 'opt-a', letter: 'A', text: 'appreciate' },
      { id: 'opt-b', letter: 'B', text: 'appreciation' },
      { id: 'opt-c', letter: 'C', text: 'appreciative' },
      { id: 'opt-d', letter: 'D', text: 'appreciatively' },
    ],
    correctOptionId: 'opt-b',
    explanation: 'Sau tính từ sở hữu "their" cần một danh từ làm tân ngữ trực tiếp cho ngoại động từ "expressed". Do đó chọn danh từ "appreciation".',
    primaryTag: 'grammar.word_forms',
    tier: 'BetaPractice',
  },
  {
    id: 'q-504',
    number: 4,
    stem: 'The new inventory software is _______ faster than the outdated spreadsheet system used previously.',
    options: [
      { id: 'opt-a', letter: 'A', text: 'substantially' },
      { id: 'opt-b', letter: 'B', text: 'very' },
      { id: 'opt-c', letter: 'C', text: 'extreme' },
      { id: 'opt-d', letter: 'D', text: 'substantial' },
    ],
    correctOptionId: 'opt-a',
    explanation: 'Để bổ nghĩa cho tính từ so sánh hơn "faster", ta dùng trạng từ mức độ như "substantially", "significantly", "much", hoặc "far". Không dùng "very" trước tính từ so sánh hơn.',
    primaryTag: 'grammar.adverbs',
    tier: 'DataValidatedPractice',
  },
  {
    id: 'q-505',
    number: 5,
    stem: 'Neither the project supervisor nor the committee members _______ satisfied with the preliminary cost estimates.',
    options: [
      { id: 'opt-a', letter: 'A', text: 'was' },
      { id: 'opt-b', letter: 'B', text: 'were' },
      { id: 'opt-c', letter: 'C', text: 'is' },
      { id: 'opt-d', letter: 'D', text: 'has been' },
    ],
    correctOptionId: 'opt-b',
    explanation: 'Quy tắc hòa hợp chủ vị với cấu trúc tương quan "Neither... nor...": Động từ chia theo chủ ngữ gần nhất ("the committee members" - số nhiều trong quá khứ) -> "were".',
    primaryTag: 'grammar.subject_verb_agreement',
    tier: 'BetaPractice',
  },
];

export function QuizRunnerPage() {
  const { quizId = '' } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const isLiveQuiz = /^quiz-[a-d]\d+$/i.test(quizId) || /^checkpoint-[a-d]$/i.test(quizId);
  if (isLiveQuiz) {
    return <LiveQuizPage />;
  }

  const questions = SAMPLE_QUIZ_QUESTIONS;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, boolean>>({});
  const [isFinished, setIsFinished] = useState(false);

  // Modals for Mistake Notebook and Flashcard
  const [savedToNotebook, setSavedToNotebook] = useState<Record<string, boolean>>({});
  const [flashcardModalOpen, setFlashcardModalOpen] = useState(false);
  const [flashcardWord, setFlashcardWord] = useState('');
  const [flashcardDefinition, setFlashcardDefinition] = useState('');
  const [flashcardSaved, setFlashcardSaved] = useState(false);

  // Issue report modal (FR-17)
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('KeySai');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const currentQ = questions[currentIndex];
  const selectedOptionId = selectedAnswers[currentQ?.id];
  const isRevealed = revealedQuestions[currentQ?.id];

  const handleSelectOption = (optionId: string) => {
    if (isRevealed) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: optionId }));
  };

  const handleCheckAnswer = () => {
    if (!selectedOptionId) return;
    setRevealedQuestions((prev) => ({ ...prev, [currentQ.id]: true }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleSaveToNotebook = (questionId: string) => {
    setSavedToNotebook((prev) => ({ ...prev, [questionId]: true }));
  };

  const openFlashcardModal = (word: string, def: string) => {
    setFlashcardWord(word);
    setFlashcardDefinition(def);
    setFlashcardSaved(false);
    setFlashcardModalOpen(true);
  };

  const handleSaveFlashcard = () => {
    setFlashcardSaved(true);
    setTimeout(() => {
      setFlashcardModalOpen(false);
    }, 1200);
  };

  const handleSubmitReport = () => {
    setReportSubmitted(true);
    setTimeout(() => {
      setReportModalOpen(false);
      setReportSubmitted(false);
      setReportDescription('');
    }, 1500);
  };

  // Calculations for summary screen
  const correctCount = questions.filter(
    (q) => selectedAnswers[q.id] === q.correctOptionId
  ).length;
  const scorePercent = Math.round((correctCount / questions.length) * 100);

  return (
    <div className={styles.page}>
      <div className="content-container">
        {/* Top Header */}
        <div className={styles.topBar}>
          <button 
            type="button" 
            className={styles.backButton}
            onClick={() => navigate('/learn/practice')}
          >
            <ArrowLeft size={16} /> Thoát bài luyện
          </button>

          <div className={styles.progressInfo}>
            <div className={styles.progressBarContainer}>
              <div 
                className={styles.progressBarFill} 
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
            <span className={styles.progressText}>
              Câu {currentIndex + 1} / {questions.length}
            </span>
          </div>
        </div>

        {!isFinished ? (
          <div className={styles.quizContainer}>
            <div className={styles.questionCard}>
              <div className={styles.cardHeader}>
                <div>
                  <span className={styles.questionNumber}>
                    Luyện tập Chuyên đề Part 5 • Câu {currentQ.number}
                  </span>
                  <div style={{ marginTop: '4px' }}>
                    <span className={styles.primaryTag}>{currentQ.primaryTag}</span>
                  </div>
                </div>

                <Badge variant={currentQ.tier === 'BetaPractice' ? 'default' : 'success'}>
                  {currentQ.tier}
                </Badge>
              </div>

              {/* Question Stem */}
              <div className={styles.promptText}>
                {currentQ.stem}
              </div>

              {/* Options */}
              <div className={styles.optionsList}>
                {currentQ.options.map((opt) => {
                  const isChosen = selectedOptionId === opt.id;
                  const isCorrect = isRevealed && opt.id === currentQ.correctOptionId;
                  const isWrong = isRevealed && isChosen && opt.id !== currentQ.correctOptionId;

                  let itemClass = styles.optionItem;
                  if (isChosen && !isRevealed) itemClass += ` ${styles.optionSelected}`;
                  if (isCorrect) itemClass += ` ${styles.optionCorrect}`;
                  if (isWrong) itemClass += ` ${styles.optionWrong}`;

                  return (
                    <div
                      key={opt.id}
                      className={itemClass}
                      onClick={() => handleSelectOption(opt.id)}
                    >
                      <span className={styles.optionLetter}>
                        {isCorrect ? <CheckCircle2 size={16} /> : isWrong ? <XCircle size={16} /> : opt.letter}
                      </span>
                      <span className={styles.optionText}>{opt.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Explanation & Micro-actions when revealed */}
              {isRevealed && (
                <div className={styles.explanationCard}>
                  <div className={styles.explanationTitle}>
                    {selectedOptionId === currentQ.correctOptionId ? (
                      <span style={{ color: '#137333', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={16} /> Bạn đã trả lời chính xác!
                      </span>
                    ) : (
                      <span style={{ color: '#c5221f', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <XCircle size={16} /> Chưa chính xác. Đáp án đúng là {currentQ.options.find(o => o.id === currentQ.correctOptionId)?.letter}
                      </span>
                    )}
                  </div>
                  <p className={styles.explanationContent}>{currentQ.explanation}</p>

                  <div className={styles.microActions}>
                    <Button
                      variant="text"
                      size="sm"
                      onClick={() => handleSaveToNotebook(currentQ.id)}
                      disabled={savedToNotebook[currentQ.id]}
                    >
                      <Bookmark size={14} />
                      {savedToNotebook[currentQ.id] ? 'Đã lưu vào Sổ lỗi sai' : 'Lưu vào Sổ lỗi sai'}
                    </Button>

                    <Button
                      variant="text"
                      size="sm"
                      onClick={() => openFlashcardModal('appreciation', 'sự đánh giá cao, sự cảm kích')}
                    >
                      <Layers size={14} /> Thêm từ vựng vào Flashcard
                    </Button>

                    <Button
                      variant="text"
                      size="sm"
                      onClick={() => setReportModalOpen(true)}
                    >
                      <HelpCircle size={14} /> Báo lỗi câu hỏi
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Footer */}
              <div className={styles.actionFooter}>
                <span style={{ fontSize: '13px', color: 'var(--color-ink-tertiary)' }}>
                  {!isRevealed ? 'Chọn một đáp án và bấm Kiểm tra' : 'Đã kiểm tra lời giải chi tiết'}
                </span>

                <div>
                  {!isRevealed ? (
                    <Button
                      variant="primary"
                      onClick={handleCheckAnswer}
                      disabled={!selectedOptionId}
                    >
                      Kiểm tra đáp án
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={handleNext}
                    >
                      {currentIndex < questions.length - 1 ? (
                        <>Câu tiếp theo <ArrowRight size={16} /></>
                      ) : (
                        <>Hoàn thành bài luyện <CheckCircle2 size={16} /></>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Finished Screen */
          <div className={styles.quizContainer}>
            <div className={styles.questionCard}>
              <div className={styles.summaryContainer}>
                <div className={styles.scoreCircle}>
                  <span className={styles.scoreNumber}>{correctCount}</span>
                  <span className={styles.scoreTotal}>trên {questions.length} câu</span>
                </div>

                <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-ink-primary)', marginBottom: '8px' }}>
                  {scorePercent >= 80 ? 'Hoàn thành xuất sắc!' : scorePercent >= 60 ? 'Hoàn thành bài luyện tập' : 'Cần củng cố thêm kiến thức'}
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--color-ink-secondary)', maxWidth: '480px', margin: '0 auto' }}>
                  Kết quả đã được ghi nhận vào chỉ báo thực hành kiến thức (Mastery Indicator BR-LEARN-02).
                </p>

                {/* Tag Breakdown */}
                <div className={styles.tagBreakdown}>
                  <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '13px', color: 'var(--color-ink-primary)' }}>
                    Chỉ báo thành thạo theo điểm kiến thức (Tags):
                  </div>
                  <div className={styles.tagItem}>
                    <span>grammar.prepositions</span>
                    <Badge variant="success">PracticedWell (100%)</Badge>
                  </div>
                  <div className={styles.tagItem}>
                    <span>grammar.participles</span>
                    <Badge variant="info">Developing (75%)</Badge>
                  </div>
                  <div className={styles.tagItem}>
                    <span>grammar.word_forms</span>
                    <Badge variant="success">PracticedWell (100%)</Badge>
                  </div>
                  <div className={styles.tagItem}>
                    <span>grammar.subject_verb_agreement</span>
                    <Badge variant="warning">NeedsPractice (50%)</Badge>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setCurrentIndex(0);
                      setSelectedAnswers({});
                      setRevealedQuestions({});
                      setIsFinished(false);
                    }}
                  >
                    <RotateCcw size={16} /> Luyện tập lại bài này
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => navigate('/learn/practice')}
                  >
                    Quay lại danh mục đề thi
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate('/learn/errors')}
                  >
                    Xem Sổ lỗi sai
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Flashcard Modal */}
        {flashcardModalOpen && (
          <Modal
            isOpen={flashcardModalOpen}
            onClose={() => setFlashcardModalOpen(false)}
            title="Thêm từ vựng vào bộ thẻ Flashcard"
          >
            {flashcardSaved ? (
              <Alert variant="success" title="Đã thêm vào Flashcard">
                Từ vựng <strong>{flashcardWord}</strong> đã được thêm vào hàng đợi ôn tập Spaced Repetition (FR-13).
              </Alert>
            ) : (
              <div>
                <Input
                  label="Từ / Cụm từ"
                  value={flashcardWord}
                  onChange={(e) => setFlashcardWord(e.target.value)}
                />
                <div style={{ marginTop: '12px' }}>
                  <Input
                    label="Định nghĩa ngữ cảnh"
                    value={flashcardDefinition}
                    onChange={(e) => setFlashcardDefinition(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                  <Button variant="secondary" onClick={() => setFlashcardModalOpen(false)}>
                    Hủy
                  </Button>
                  <Button variant="primary" onClick={handleSaveFlashcard}>
                    Lưu thẻ từ mới
                  </Button>
                </div>
              </div>
            )}
          </Modal>
        )}

        {/* Question Report Modal (FR-17) */}
        {reportModalOpen && (
          <Modal
            isOpen={reportModalOpen}
            onClose={() => setReportModalOpen(false)}
            title="Báo cáo lỗi câu hỏi (FR-17)"
          >
            {reportSubmitted ? (
              <Alert variant="success" title="Đã gửi báo cáo">
                Cảm ơn bạn đã phản hồi. Ticket hỗ trợ đã được tạo và gửi đến ban biên tập nội dung.
              </Alert>
            ) : (
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Loại vấn đề gặp phải:
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                  >
                    <option value="KeySai">Đáp án hoặc lời giải chưa chính xác</option>
                    <option value="AudioError">Lỗi phát âm thanh hoặc sai giọng</option>
                    <option value="Typo">Lỗi chính tả hoặc định dạng văn bản</option>
                    <option value="Ambiguous">Câu hỏi không rõ ràng / có nhiều đáp án đúng</option>
                  </select>
                </div>

                <Textarea
                  label="Mô tả chi tiết"
                  placeholder="Vui lòng cung cấp thêm thông tin để ban kiểm định xác minh..."
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={3}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                  <Button variant="secondary" onClick={() => setReportModalOpen(false)}>
                    Hủy
                  </Button>
                  <Button variant="primary" onClick={handleSubmitReport}>
                    Gửi báo cáo
                  </Button>
                </div>
              </div>
            )}
          </Modal>
        )}
      </div>
    </div>
  );
}
