import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  Clock,
  FileQuestion,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { getCheckpointByCode, getTopicByCode } from '../../../lib/api/curriculumData';
import styles from './Lesson.module.css';

const LESSON_STEPS = [
  { id: 1, label: 'Nắm quy tắc', description: 'Mục tiêu, công thức và ví dụ' },
  { id: 2, label: 'Áp dụng', description: 'Quy trình và lỗi thường gặp' },
  { id: 3, label: 'Tự kiểm tra', description: 'Ghi nhớ và luyện tập' },
] as const;

type LessonStep = (typeof LESSON_STEPS)[number]['id'];

export function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<LessonStep>(1);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<LessonStep>>(new Set());
  const [checkedPrompts, setCheckedPrompts] = useState<Set<string>>(new Set());

  const checkpoint = id ? getCheckpointByCode(id) : undefined;
  const normalizedCode = id?.toUpperCase().replace(/^LESSON-/, '') ?? '';
  const topic = checkpoint ? undefined : getTopicByCode(normalizedCode);

  useEffect(() => {
    setCurrentStep(1);
    setCompletedSteps(new Set());
    setCheckedPrompts(new Set());
  }, [id]);

  const progress = Math.round((completedSteps.size / LESSON_STEPS.length) * 100);
  const selfCheckPrompts = useMemo(
    () => topic?.guide?.selfCheckPrompts ?? [],
    [topic],
  );

  const goToStep = (step: LessonStep) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleCurrentStep = () => {
    setCompletedSteps((previous) => {
      const next = new Set(previous);
      if (next.has(currentStep)) next.delete(currentStep);
      else next.add(currentStep);
      return next;
    });
  };

  const togglePrompt = (prompt: string) => {
    setCheckedPrompts((previous) => {
      const next = new Set(previous);
      if (next.has(prompt)) next.delete(prompt);
      else next.add(prompt);
      return next;
    });
  };

  if (checkpoint) {
    return (
      <div className={styles.lessonPage}>
        <div className={styles.utilityBar}>
          <button type="button" onClick={() => navigate('/learn/roadmap')} className={styles.backButton}>
            <ArrowLeft size={17} aria-hidden="true" />
            Lộ trình 31 tuần
          </button>
        </div>

        <main className={styles.checkpointPage}>
          <header className={styles.checkpointHeader}>
            <p className={styles.eyebrow}>Checkpoint · Level {checkpoint.levelCode}</p>
            <h1>{checkpoint.title}</h1>
            <p className={styles.intro}>{checkpoint.description}</p>
          </header>

          <dl className={styles.checkpointFacts}>
            <div>
              <dt>Số câu</dt>
              <dd>{checkpoint.questionCount}</dd>
              <span>Part 5 và Part 6</span>
            </div>
            <div>
              <dt>Ngưỡng đề xuất</dt>
              <dd>{Math.round(checkpoint.passRate * 100)}%</dd>
              <span>để chuyển sang chặng tiếp theo</span>
            </div>
            <div>
              <dt>Thời gian</dt>
              <dd>{checkpoint.timeLimitMinutes} phút</dd>
              <span>nên làm trong một lượt</span>
            </div>
          </dl>

          <div className={styles.checkpointColumns}>
            <section aria-labelledby="checkpoint-before">
              <p className={styles.sectionKicker}>Trước khi bắt đầu</p>
              <h2 id="checkpoint-before">Cách thực hiện</h2>
              <ol className={styles.numberedList}>
                {checkpoint.rules.map((rule) => <li key={rule}>{rule}</li>)}
              </ol>
            </section>

            <section aria-labelledby="checkpoint-after">
              <p className={styles.sectionKicker}>Sau khi nộp bài</p>
              <h2 id="checkpoint-after">Hướng ôn tập đề xuất</h2>
              <ul className={styles.plainList}>
                {checkpoint.remediationPolicy.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          </div>

          <div className={styles.checkpointAction}>
            <div>
              <strong>Đây là chỉ báo học tập.</strong>
              <span>Kết quả không được quy đổi thành điểm TOEIC chính thức.</span>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(`/learn/quiz/checkpoint-${checkpoint.levelCode.toLowerCase()}`)}
              rightIcon={<ArrowRight size={18} aria-hidden="true" />}
            >
              Bắt đầu checkpoint
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className={styles.lessonPage}>
        <main className={styles.emptyState}>
          <p className={styles.eyebrow}>Không tìm thấy bài học</p>
          <h1>Đường dẫn này chưa có nội dung</h1>
          <p>Hãy quay lại lộ trình để chọn một bài học đang được phát hành.</p>
          <Button
            variant="primary"
            onClick={() => navigate('/learn/roadmap')}
            leftIcon={<ArrowLeft size={17} aria-hidden="true" />}
          >
            Quay lại lộ trình
          </Button>
        </main>
      </div>
    );
  }

  const formulaPatterns = topic.guide?.formulaPatterns ?? [];
  const applicationSteps = topic.guide?.applicationSteps ?? [];
  const extensions = topic.guide?.extensions ?? [];
  const currentStepDone = completedSteps.has(currentStep);

  return (
    <div className={styles.lessonPage}>
      <div className={styles.utilityBar}>
        <button type="button" onClick={() => navigate('/learn/roadmap')} className={styles.backButton}>
          <ArrowLeft size={17} aria-hidden="true" />
          Lộ trình 31 tuần
        </button>
        <button
          type="button"
          onClick={() => setIsBookmarked((value) => !value)}
          className={`${styles.bookmarkButton} ${isBookmarked ? styles.bookmarkActive : ''}`}
          aria-pressed={isBookmarked}
        >
          <Bookmark size={17} fill={isBookmarked ? 'currentColor' : 'none'} aria-hidden="true" />
          {isBookmarked ? 'Đã lưu' : 'Lưu bài'}
        </button>
      </div>

      <div className={styles.lessonGrid}>
        <aside className={styles.lessonRail} aria-label="Tiến độ bài học">
          <div className={styles.railSummary}>
            <span>{topic.code} · Level {topic.levelCode}</span>
            <strong>{progress}% hoàn thành</strong>
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-label="Tiến độ bài học"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <span style={{ width: `${progress}%` }} />
          </div>

          <nav className={styles.stepNavigation} aria-label="Các phần trong bài">
            {LESSON_STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isDone = completedSteps.has(step.id);
              return (
                <button
                  type="button"
                  key={step.id}
                  onClick={() => goToStep(step.id)}
                  className={`${styles.stepButton} ${isActive ? styles.stepActive : ''}`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span className={styles.stepMarker} aria-hidden="true">
                    {isDone ? <Check size={15} /> : step.id}
                  </span>
                  <span>
                    <strong>{step.label}</strong>
                    <small>{step.description}</small>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className={styles.lessonMeta}>
            <span><Clock size={16} aria-hidden="true" /> {topic.estimatedMinutes} phút</span>
            <span><BookOpen size={16} aria-hidden="true" /> {topic.vocabularyTheme}</span>
          </div>
        </aside>

        <main className={styles.article}>
          <header className={styles.lessonHeader}>
            <p className={styles.eyebrow}>{topic.category} · {topic.primaryTag}</p>
            <h1>{topic.titleVi}</h1>
            <p className={styles.englishTitle} lang="en">{topic.titleEn}</p>
            <p className={styles.intro}>{topic.summary}</p>
          </header>

          {currentStep === 1 && (
            <div className={styles.stepContent}>
              <section aria-labelledby="learning-objectives">
                <p className={styles.sectionKicker}>Sau bài này</p>
                <h2 id="learning-objectives">Bạn sẽ làm được gì?</h2>
                <ul className={styles.outcomeList}>
                  {topic.learningObjectives.map((objective) => (
                    <li key={objective}><Check size={16} aria-hidden="true" /><span>{objective}</span></li>
                  ))}
                </ul>
              </section>

              {formulaPatterns.length > 0 && (
                <section aria-labelledby="lesson-formulas">
                  <p className={styles.sectionKicker}>Nhận diện nhanh</p>
                  <h2 id="lesson-formulas">Công thức cần nhớ</h2>
                  <div className={styles.formulaList}>
                    {formulaPatterns.map((formula) => <code key={formula}>{formula}</code>)}
                  </div>
                </section>
              )}

              <section aria-labelledby="core-knowledge">
                <p className={styles.sectionKicker}>Hiểu bản chất</p>
                <h2 id="core-knowledge">Quy tắc cốt lõi</h2>
                <ol className={styles.knowledgeList}>
                  {topic.coreKnowledge.map((item) => <li key={item}>{item}</li>)}
                </ol>
              </section>

              {topic.workedExamples.length > 0 && (
                <section aria-labelledby="worked-examples">
                  <p className={styles.sectionKicker}>Xem trong ngữ cảnh</p>
                  <h2 id="worked-examples">Ví dụ có phân tích</h2>
                  <div className={styles.examples}>
                    {topic.workedExamples.map((example, index) => (
                      <article key={`${example.sentence}-${example.focus}`} className={styles.example}>
                        <span>Ví dụ {index + 1}</span>
                        <p lang="en">{example.sentence}</p>
                        <div><strong>Vì sao?</strong><span>{example.focus}</span></div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className={styles.stepContent}>
              {applicationSteps.length > 0 && (
                <section aria-labelledby="application-process">
                  <p className={styles.sectionKicker}>Khi gặp câu hỏi</p>
                  <h2 id="application-process">Quy trình áp dụng</h2>
                  <ol className={styles.processList}>
                    {applicationSteps.map((step) => <li key={step}>{step}</li>)}
                  </ol>
                  <p className={styles.examNote}>
                    <strong>Mẹo làm bài:</strong> xác định cấu trúc trước, kiểm tra nghĩa sau.
                    Nếu trả lời sai, ghi tag <b>{topic.primaryTag}</b> vào sổ tay lỗi để ôn đúng điểm yếu.
                  </p>
                </section>
              )}

              {topic.commonTraps.length > 0 && (
                <section aria-labelledby="common-traps">
                  <p className={styles.sectionKicker}>Dừng lại một nhịp</p>
                  <h2 id="common-traps">Lỗi thường gặp</h2>
                  <div className={styles.trapList}>
                    {topic.commonTraps.map((trap, index) => (
                      <div key={trap} className={styles.trapItem}>
                        <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                        <p>{trap}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {extensions.length > 0 && (
                <section aria-labelledby="lesson-extension">
                  <details className={styles.extension}>
                    <summary id="lesson-extension">
                      <span>
                        <strong>Mở rộng để hiểu sâu hơn</strong>
                        <small>Dành cho lượt học thứ hai hoặc khi bạn đã chắc phần chính</small>
                      </span>
                      <span className={styles.detailsHint}>Mở phần này</span>
                    </summary>
                    <ul className={styles.plainList}>
                      {extensions.map((extension) => <li key={extension}>{extension}</li>)}
                    </ul>
                  </details>
                </section>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className={styles.stepContent}>
              <section aria-labelledby="self-check">
                <p className={styles.sectionKicker}>Không cần nhìn tài liệu</p>
                <h2 id="self-check">Tự giải thích bằng lời của bạn</h2>
                <p className={styles.sectionIntro}>
                  Đánh dấu khi bạn có thể trả lời rõ ràng. Đây là bước tự đánh giá,
                  hệ thống chưa chấm đúng sai ở phần này.
                </p>
                <div className={styles.selfCheckList}>
                  {selfCheckPrompts.map((prompt) => {
                    const isChecked = checkedPrompts.has(prompt);
                    return (
                      <button
                        type="button"
                        key={prompt}
                        onClick={() => togglePrompt(prompt)}
                        className={`${styles.selfCheckItem} ${isChecked ? styles.selfCheckDone : ''}`}
                        aria-pressed={isChecked}
                      >
                        <span className={styles.checkBox} aria-hidden="true">
                          {isChecked && <Check size={16} />}
                        </span>
                        <span>{prompt}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className={styles.recap} aria-labelledby="lesson-recap">
                <p className={styles.sectionKicker}>Trước khi luyện tập</p>
                <h2 id="lesson-recap">Điểm cần mang theo</h2>
                <p>
                  Khi gặp câu hỏi về <strong>{topic.titleVi.toLowerCase()}</strong>, hãy nhận diện
                  dấu hiệu <strong>{topic.primaryTag}</strong>, áp dụng công thức và kiểm tra lại
                  câu trong ngữ cảnh đầy đủ.
                </p>
              </section>

              <section className={styles.quizCallout} aria-labelledby="lesson-quiz">
                <div>
                  <FileQuestion size={25} aria-hidden="true" />
                  <p className={styles.sectionKicker}>Bước tiếp theo</p>
                  <h2 id="lesson-quiz">Luyện tập với quiz ngắn</h2>
                  <p>8–10 câu theo dạng Part 5/6. Mốc 80% dùng để gợi ý phần nên ôn lại.</p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => navigate(`/learn/quiz/quiz-${topic.code.toLowerCase()}`)}
                  rightIcon={<ArrowRight size={17} aria-hidden="true" />}
                >
                  Bắt đầu quiz
                </Button>
              </section>
            </div>
          )}

          <footer className={styles.lessonFooter}>
            <Button
              variant="text"
              disabled={currentStep === 1}
              onClick={() => goToStep((currentStep - 1) as LessonStep)}
              leftIcon={<ArrowLeft size={17} aria-hidden="true" />}
            >
              Phần trước
            </Button>

            <button
              type="button"
              onClick={toggleCurrentStep}
              className={`${styles.markReadButton} ${currentStepDone ? styles.markReadDone : ''}`}
              aria-pressed={currentStepDone}
            >
              <span>{currentStepDone && <Check size={15} aria-hidden="true" />}</span>
              {currentStepDone ? 'Đã đọc phần này' : 'Đánh dấu đã đọc'}
            </button>

            {currentStep < LESSON_STEPS.length ? (
              <Button
                variant="primary"
                onClick={() => goToStep((currentStep + 1) as LessonStep)}
                rightIcon={<ArrowRight size={17} aria-hidden="true" />}
              >
                Phần tiếp theo
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => navigate('/learn/roadmap')}
                rightIcon={<ArrowRight size={17} aria-hidden="true" />}
              >
                Về lộ trình
              </Button>
            )}
          </footer>

          <p className={styles.srOnly} aria-live="polite">
            {isBookmarked ? 'Đã lưu bài học.' : 'Bài học chưa được lưu.'}
          </p>
        </main>
      </div>
    </div>
  );
}
