import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Clock,
  Layers,
} from 'lucide-react';
import { getTopicByCode, getCheckpointByCode } from '../../../lib/api/curriculumData';
import styles from './Lesson.module.css';

export function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = 3;

  // Bookmarking & Progress state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [markedRead, setMarkedRead] = useState<Record<number, boolean>>({});

  // Interactive Mini-Check state
  const [selectedMiniOption, setSelectedMiniOption] = useState<string | null>(null);
  const [miniCheckSubmitted, setMiniCheckSubmitted] = useState(false);

  // Check if route is a Checkpoint
  const checkpoint = id ? getCheckpointByCode(id) : undefined;
  const isCheckpoint = Boolean(checkpoint);

  // If not checkpoint, look up concept topic
  const normalizedCode = id ? id.toUpperCase().replace(/^LESSON-/, '') : 'A1';
  const topic = getTopicByCode(normalizedCode) || getTopicByCode('A1')!;

  const handleMiniCheckSubmit = (optKey: string) => {
    setSelectedMiniOption(optKey);
    setMiniCheckSubmitted(true);
  };

  const handleMarkAsRead = () => {
    setMarkedRead((prev) => ({ ...prev, [currentPage]: true }));
  };

  // CHECKPOINT RENDER
  if (isCheckpoint && checkpoint) {
    return (
      <div className="content-container">
        <div className={styles.topNav}>
          <button
            type="button"
            onClick={() => navigate('/learn/roadmap')}
            className={styles.backBtn}
          >
            <ArrowLeft size={16} /> Quay lại lộ trình 31 tuần
          </button>
        </div>

        <div className={styles.lessonLayout}>
          <main className={styles.mainContent}>
            <div className={styles.checkpointBanner}>
              <div className={styles.metaRow}>
                <Badge variant="primary">Checkpoint Đánh giá Cấp độ</Badge>
                <Badge variant="default">Level {checkpoint.levelCode}</Badge>
              </div>
              <h1 className={styles.lessonTitle}>{checkpoint.title}</h1>
              <p className={styles.leadParagraph}>{checkpoint.description}</p>

              <div className={styles.checkpointMetrics}>
                <div className={styles.metricBox}>
                  <div className={styles.metricValue}>{checkpoint.questionCount}</div>
                  <div className={styles.metricLabel}>Số câu hỏi Part 5/6</div>
                </div>
                <div className={styles.metricBox}>
                  <div className={styles.metricValue}>
                    {Math.round(checkpoint.passRate * 100)}%
                  </div>
                  <div className={styles.metricLabel}>Tỷ lệ đạt chuẩn</div>
                </div>
                <div className={styles.metricBox}>
                  <div className={styles.metricValue}>{checkpoint.timeLimitMinutes}'</div>
                  <div className={styles.metricLabel}>Thời gian làm bài</div>
                </div>
              </div>
            </div>

            <div className={styles.sectionBlock}>
              <h2 className={styles.sectionHeading}>
                <ShieldCheck size={18} /> Quy định thực hiện Checkpoint
              </h2>
              <div className={styles.rulesList}>
                {checkpoint.rules.map((rule, idx) => (
                  <div key={idx} className={styles.ruleItem}>
                    <strong>{idx + 1}.</strong> {rule}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.sectionBlock}>
              <h2 className={styles.sectionHeading}>
                <Layers size={18} /> Chính sách sau khi nộp bài
              </h2>
              <div className={styles.remediationList}>
                {checkpoint.remediationPolicy.map((item, idx) => (
                  <div key={idx} className={styles.ruleItem}>
                    • {item}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.quizTeaser}>
              <ShieldCheck size={40} className={styles.quizIcon} />
              <h3>Sẵn sàng bước vào bài Checkpoint {checkpoint.levelCode}?</h3>
              <p>
                Hãy đảm bảo bạn có không gian yên tĩnh trong khoảng {checkpoint.timeLimitMinutes} phút để hoàn thành trọn vẹn bài kiểm tra.
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(`/learn/quiz/checkpoint-${checkpoint.levelCode.toLowerCase()}`)}
                leftIcon={<Clock size={18} />}
              >
                Bắt đầu làm Checkpoint ({checkpoint.questionCount} câu · {checkpoint.timeLimitMinutes} phút)
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // STANDARD 2-PAGE TOPIC LESSON
  return (
    <div className="content-container">
      {/* Top Header */}
      <div className={styles.topNav}>
        <button
          type="button"
          onClick={() => navigate('/learn/roadmap')}
          className={styles.backBtn}
        >
          <ArrowLeft size={16} /> Quay lại lộ trình 31 tuần
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
        <main className={styles.mainContent}>
          {/* Lesson Header */}
          <div className={styles.lessonHeader}>
            <div className={styles.metaRow}>
              <Badge variant="primary">Level {topic.levelCode} · Reading</Badge>
              <Badge variant="info">{topic.category}</Badge>
              <span className={styles.pageIndicator}>
                Trang {currentPage} / {totalPages}
              </span>
            </div>
            <h1 className={styles.lessonTitle}>
              {topic.code} · {topic.titleVi}
            </h1>
            <p className={styles.leadParagraph}>{topic.summary}</p>
          </div>

          {/* PAGE 1: KHÁI NIỆM & CÔNG THỨC */}
          {currentPage === 1 && (
            <div className={styles.pageBody}>
              {/* Objectives */}
              <div className={styles.sectionBlock}>
                <h2 className={styles.sectionHeading}>
                  <CheckCircle size={18} /> Mục tiêu bài học
                </h2>
                <div className={styles.objectivesList}>
                  {topic.learningObjectives.map((obj, i) => (
                    <div key={i} className={styles.objectiveItem}>
                      • {obj}
                    </div>
                  ))}
                </div>
              </div>

              {/* Formula Patterns */}
              {topic.guide?.formulaPatterns && topic.guide.formulaPatterns.length > 0 && (
                <div className={styles.sectionBlock}>
                  <h2 className={styles.sectionHeading}>
                    <Layers size={18} /> Công thức và mẫu nhận diện
                  </h2>
                  <div className={styles.formulaGrid}>
                    {topic.guide.formulaPatterns.map((f, i) => (
                      <div key={i} className={styles.formulaCard}>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Core Knowledge */}
              <div className={styles.sectionBlock}>
                <h2 className={styles.sectionHeading}>
                  <Lightbulb size={18} /> Kiến thức cốt lõi
                </h2>
                <div className={styles.coreKnowledgeList}>
                  {topic.coreKnowledge.map((item, i) => (
                    <div key={i} className={styles.coreItem}>
                      <span className={styles.coreBullet}>•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Worked Examples */}
              {topic.workedExamples && topic.workedExamples.length > 0 && (
                <div className={styles.sectionBlock}>
                  <h2 className={styles.sectionHeading}>
                    <FileQuestion size={18} /> Ví dụ minh họa và phân tích
                  </h2>
                  {topic.workedExamples.map((ex, i) => (
                    <div key={i} className={styles.workedExampleCard}>
                      <div className={styles.workedExampleSentence}>"{ex.sentence}"</div>
                      <div className={styles.workedExampleFocus}>
                        <Lightbulb size={15} /> <strong>Phân tích:</strong> {ex.focus}
                      </div>
                    </div>
                  ))}

                  {/* Audio Component Example */}
                  <div style={{ marginTop: 'var(--space-4)' }}>
                    <AudioPlayer
                      title={`Nghe câu ví dụ mẫu TOEIC (${topic.vocabularyTheme}):`}
                      transcript={topic.workedExamples[0].sentence}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PAGE 2: QUY TRÌNH ÁP DỤNG & BẪY THƯỜNG GẶP */}
          {currentPage === 2 && (
            <div className={styles.pageBody}>
              {/* Application Steps */}
              {topic.guide?.applicationSteps && topic.guide.applicationSteps.length > 0 && (
                <div className={styles.sectionBlock}>
                  <h2 className={styles.sectionHeading}>
                    <CheckCircle size={18} /> Quy trình áp dụng giải câu hỏi
                  </h2>
                  <div className={styles.applicationStepsList}>
                    {topic.guide.applicationSteps.map((step, idx) => (
                      <div key={idx} className={styles.stepRow}>
                        <span className={styles.stepNum}>{idx + 1}</span>
                        <span className={styles.stepContent}>{step}</span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.examUseNotice}>
                    <strong>Lưu ý làm bài:</strong> Thực hiện phân tích cấu trúc trước, dịch nghĩa sau; ghi nhận primary tag ({topic.primaryTag}) khi trả lời sai để đưa vào Sổ tay lỗi.
                  </div>
                </div>
              )}

              {/* Common Traps */}
              {topic.commonTraps && topic.commonTraps.length > 0 && (
                <div className={styles.sectionBlock}>
                  <h2 className={styles.sectionHeading}>
                    <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} /> Bẫy thường gặp và cách phòng tránh
                  </h2>
                  <div className={styles.trapsList}>
                    {topic.commonTraps.map((trap, i) => (
                      <div key={i} className={styles.trapRow}>
                        <AlertTriangle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
                        <span>{trap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extensions */}
              {topic.guide?.extensions && topic.guide.extensions.length > 0 && (
                <div className={styles.sectionBlock}>
                  <div className={styles.extensionsCard}>
                    <h2 className={styles.sectionHeading}>
                      <Lightbulb size={18} /> Mở rộng để hiểu sâu hơn
                    </h2>
                    <p className={styles.scopeNote}>
                      Phần mở rộng giúp đọc hiểu văn bản phức tạp; không bắt buộc ghi nhớ ngay ở lượt học đầu.
                    </p>
                    <div className={styles.objectivesList}>
                      {topic.guide.extensions.map((ext, i) => (
                        <div key={i} className={styles.objectiveItem}>
                          • {ext}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Self-check prompts */}
              {topic.guide?.selfCheckPrompts && topic.guide.selfCheckPrompts.length > 0 && (
                <div className={styles.sectionBlock}>
                  <h2 className={styles.sectionHeading}>
                    <HelpCircle size={18} /> Tự kiểm tra nhanh
                  </h2>
                  <div className={styles.selfCheckList}>
                    {topic.guide.selfCheckPrompts.map((prompt, i) => (
                      <div key={i} className={styles.selfCheckItem}>
                        <HelpCircle size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                        <span>{prompt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Mini-Check */}
              <div className={styles.miniCheckCard}>
                <div className={styles.miniCheckHeader}>
                  <HelpCircle size={18} className={styles.checkIcon} />
                  <h3>Mini-Check: Kiểm tra khả năng nhận diện ({topic.code})</h3>
                </div>
                <p className={styles.miniPrompt}>
                  Áp dụng quy trình nhận diện: "{topic.workedExamples[0]?.sentence || 'The committee approved the budget proposal.'}"
                  <br />
                  Chủ điểm nào là trọng tâm phân tích trong câu trên?
                </p>

                <div className={styles.miniOptions}>
                  {[
                    { key: 'A', text: `Dấu hiệu của ${topic.titleVi}`, isCorrect: true },
                    { key: 'B', text: 'Chỉ dựa vào cảm tính hoặc dịch sơ lược', isCorrect: false },
                    { key: 'C', text: 'Bỏ qua vị trí ngữ pháp và liên từ', isCorrect: false },
                    { key: 'D', text: 'Đoán đáp án theo độ dài của từ', isCorrect: false },
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
                    {selectedMiniOption === 'A' ? (
                      <Alert variant="success" title="Chính xác!">
                        Bạn đã nắm vững quy trình phân tích của bài học {topic.code}. Hãy tiếp tục sang phần tổng kết để làm bài tập củng cố.
                      </Alert>
                    ) : (
                      <Alert variant="warning" title="Chưa chính xác:">
                        Hãy nhớ quy trình chuẩn: luôn khoanh vùng cấu trúc ngữ pháp trước ({topic.primaryTag}), loại trừ đáp án sai rồi mới kiểm tra ngữ cảnh.
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PAGE 3: TỔNG KẾT & QUIZ */}
          {currentPage === 3 && (
            <div className={styles.pageBody}>
              <h2 className={styles.sectionHeading}>
                <CheckCircle size={18} /> Tổng kết bài học {topic.code}
              </h2>
              <p>
                Bạn đã hoàn thành các phần kiến thức cốt lõi và quy trình xử lý bẫy cho chủ điểm <strong>{topic.titleVi}</strong> ({topic.titleEn}).
              </p>

              <div className={styles.quizTeaser}>
                <FileQuestion size={40} className={styles.quizIcon} />
                <h3>Quiz kiểm tra: {topic.titleVi}</h3>
                <p>
                  Gồm 8–10 câu hỏi áp dụng chuẩn format Part 5/6 TOEIC • Tỷ lệ đạt khuyến nghị: 80%
                </p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate(`/learn/quiz/quiz-${topic.code.toLowerCase()}`)}
                >
                  Bắt đầu làm Quiz kiểm tra ngay
                </Button>
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <footer className={styles.lessonFooter}>
            <div className={styles.footerLeft}>
              <Button
                variant="secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
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
                  onClick={() => setCurrentPage((p) => p + 1)}
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
