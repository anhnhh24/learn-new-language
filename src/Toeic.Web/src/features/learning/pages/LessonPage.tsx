import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { AudioPlayer } from '../../../components/ui/AudioPlayer';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle,
  Check,
  X,
  FileQuestion,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Award,
  Sparkles,
} from 'lucide-react';
import { getTopicByCode, getCheckpointByCode } from '../../../lib/api/curriculumData';
import { getTopicEnrichment } from '../../../lib/api/lessonEnrichmentData';
import styles from './Lesson.module.css';

export function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = 3;

  // Bookmarking & Read status
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [markedRead, setMarkedRead] = useState<Record<number, boolean>>({});

  // Part 5 interactive drill states: stores selected option key per drill index
  const [drillAnswers, setDrillAnswers] = useState<Record<number, string>>({});
  const [drillSubmitted, setDrillSubmitted] = useState<Record<number, boolean>>({});

  // Self-check accordion open states
  const [openSelfCheck, setOpenSelfCheck] = useState<Record<number, boolean>>({});

  // Checkpoint detection
  const checkpoint = id ? getCheckpointByCode(id) : undefined;
  const isCheckpoint = Boolean(checkpoint);

  // Normal topic resolution
  const normalizedCode = id ? id.toUpperCase().replace(/^LESSON-/, '') : 'A1';
  const topic = getTopicByCode(normalizedCode) || getTopicByCode('A1')!;
  const enrichment = getTopicEnrichment(normalizedCode);

  const handleDrillOptionSelect = (drillIdx: number, optKey: string) => {
    setDrillAnswers((prev) => ({ ...prev, [drillIdx]: optKey }));
    setDrillSubmitted((prev) => ({ ...prev, [drillIdx]: true }));
  };

  const toggleSelfCheck = (idx: number) => {
    setOpenSelfCheck((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleMarkAsRead = () => {
    setMarkedRead((prev) => ({ ...prev, [currentPage]: true }));
  };

  // CHECKPOINT PAGE VIEW
  if (isCheckpoint && checkpoint) {
    return (
      <div className={styles.lessonPage}>
        <div className={styles.utilityBar}>
          <button
            type="button"
            onClick={() => navigate('/learn/roadmap')}
            className={styles.backButton}
          >
            <ArrowLeft size={16} /> Quay lại lộ trình 31 tuần
          </button>
        </div>

        <div className={styles.checkpointPage}>
          <div className={styles.checkpointHeader}>
            <div className={styles.eyebrow}>TOEIC READING CHECKPOINT · LEVEL {checkpoint.levelCode}</div>
            <h1>{checkpoint.title}</h1>
            <p className={styles.intro}>{checkpoint.description}</p>
          </div>

          <dl className={styles.checkpointFacts}>
            <div>
              <dt>Số câu hỏi</dt>
              <dd>{checkpoint.questionCount} câu</dd>
              <span>Chuẩn cấu trúc Part 5 & 6</span>
            </div>
            <div>
              <dt>Ngưỡng đạt tiêu chuẩn</dt>
              <dd>{Math.round(checkpoint.passRate * 100)}%</dd>
              <span>Tối thiểu {Math.ceil(checkpoint.questionCount * checkpoint.passRate)}/{checkpoint.questionCount} câu đúng</span>
            </div>
            <div>
              <dt>Thời gian làm bài</dt>
              <dd>{checkpoint.timeLimitMinutes} phút</dd>
              <span>Đếm ngược liên tục</span>
            </div>
          </dl>

          <div className={styles.checkpointColumns}>
            <div>
              <h2>Quy định làm bài Checkpoint</h2>
              <ol className={styles.numberedList}>
                {checkpoint.rules.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ol>
            </div>

            <div>
              <h2>Chính sách sau khi nộp bài</h2>
              <ul className={styles.plainList}>
                {checkpoint.remediationPolicy.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.checkpointAction}>
            <div>
              <strong>Sẵn sàng kiểm tra năng lực Level {checkpoint.levelCode}?</strong>
              <span>Đảm bảo bạn có đủ {checkpoint.timeLimitMinutes} phút yên tĩnh để hoàn thành trọn vẹn bài thi.</span>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(`/learn/quiz/checkpoint-${checkpoint.levelCode.toLowerCase()}`)}
              leftIcon={<ShieldCheck size={18} />}
            >
              Bắt đầu bài Checkpoint ({checkpoint.questionCount} câu)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD RICH LESSON VIEW
  const stepTitles = [
    { title: 'Lý thuyết & Bảng quy tắc', subtitle: 'Khái niệm, Suffixes & Mẫu câu' },
    { title: 'Thực chiến & Bẫy thi', subtitle: 'Giải đề Part 5, Từ vựng, Bẫy' },
    { title: 'Tự kiểm tra & Quiz', subtitle: 'Self-check, Pro-tips, Làm Quiz' },
  ];

  return (
    <div className={styles.lessonPage}>
      {/* Top Utility Bar */}
      <div className={styles.utilityBar}>
        <button
          type="button"
          onClick={() => navigate('/learn/roadmap')}
          className={styles.backButton}
        >
          <ArrowLeft size={16} /> Quay lại hệ thống kiến thức
        </button>

        <button
          type="button"
          onClick={() => setIsBookmarked(!isBookmarked)}
          className={`${styles.bookmarkButton} ${isBookmarked ? styles.bookmarkActive : ''}`}
          aria-label={isBookmarked ? 'Bỏ lưu bài học' : 'Lưu bài học này'}
        >
          <Bookmark size={16} />
          <span>{isBookmarked ? 'Đã lưu bài học' : 'Lưu bài học'}</span>
        </button>
      </div>

      <div className={styles.lessonGrid}>
        {/* Left Sticky Rail */}
        <aside className={styles.lessonRail}>
          <div className={styles.railSummary}>
            <span>Đang học chủ điểm</span>
            <strong>{topic.code} · Level {topic.levelCode}</strong>
          </div>

          <div className={styles.progressTrack} aria-label="Tiến độ bài học">
            <span style={{ width: `${(currentPage / totalPages) * 100}%` }} />
          </div>

          <nav className={styles.stepNavigation} aria-label="Các phần của bài học">
            {stepTitles.map((st, i) => {
              const stepNum = i + 1;
              const isActive = currentPage === stepNum;
              return (
                <button
                  key={stepNum}
                  type="button"
                  onClick={() => setCurrentPage(stepNum)}
                  className={`${styles.stepButton} ${isActive ? styles.stepActive : ''}`}
                >
                  <span className={styles.stepMarker}>
                    {markedRead[stepNum] ? <Check size={14} /> : `0${stepNum}`}
                  </span>
                  <span>
                    <strong>{st.title}</strong>
                    <small>{st.subtitle}</small>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className={styles.lessonMeta}>
            <span>
              <Clock size={14} /> Thời lượng ước tính: {topic.estimatedMinutes} phút
            </span>
            <span>
              <Layers size={14} /> Tag: {topic.primaryTag}
            </span>
            <span>
              <BookOpen size={14} /> Chủ đề: {topic.vocabularyTheme}
            </span>
          </div>
        </aside>

        {/* Main Article Content */}
        <main className={styles.article}>
          <header className={styles.lessonHeader}>
            <div className={styles.eyebrow}>
              LEVEL {topic.levelCode} · TOEIC READING · {topic.category.toUpperCase()}
            </div>
            <h1>{topic.code} · {topic.titleVi}</h1>
            <p className={styles.englishTitle}>{topic.titleEn} (Mã chuẩn hóa: {topic.primaryTag})</p>
            <p className={styles.intro}>{topic.summary}</p>
          </header>

          <div className={styles.stepContent}>
            {/* STEP 1: KHÁI NIỆM & BẢNG QUY TẮC */}
            {currentPage === 1 && (
              <>
                {/* 1.1 Objectives */}
                <section>
                  <div className={styles.sectionKicker}>Phần 1.1</div>
                  <h2>Mục tiêu cần làm chủ sau bài học</h2>
                  <ul className={styles.outcomeList}>
                    {topic.learningObjectives.map((obj, idx) => (
                      <li key={idx}>
                        <CheckCircle size={18} />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* 1.2 Grammar Tables */}
                {enrichment.grammarRules.map((rule, ruleIdx) => (
                  <section key={ruleIdx}>
                    <div className={styles.sectionKicker}>Phần 1.{ruleIdx + 2}</div>
                    <h2>{rule.title}</h2>
                    <p className={styles.sectionIntro}>{rule.description}</p>

                    {rule.tableHeaders && rule.tableRows && (
                      <div className={styles.tableWrapper}>
                        <table className={styles.grammarTable}>
                          <thead>
                            <tr>
                              {rule.tableHeaders.map((h, i) => (
                                <th key={i}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rule.tableRows.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx}>{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {rule.notes && rule.notes.length > 0 && (
                      <ul className={styles.tableNoteList}>
                        {rule.notes.map((note, nIdx) => (
                          <li key={nIdx} className={styles.tableNoteItem}>
                            <strong>•</strong> {note}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}

                {/* 1.3 Formula Patterns */}
                {topic.guide?.formulaPatterns && topic.guide.formulaPatterns.length > 0 && (
                  <section>
                    <div className={styles.sectionKicker}>Phần 1.3</div>
                    <h2>Công thức và khuôn mẫu nhận diện</h2>
                    <p className={styles.sectionIntro}>
                      Ghi nhớ các cấu trúc vị trí xuất hiện với tần suất cao nhất trong đề thi Part 5:
                    </p>
                    <div className={styles.formulaList}>
                      {topic.guide.formulaPatterns.map((f, i) => (
                        <code key={i}>{f}</code>
                      ))}
                    </div>
                  </section>
                )}

                {/* 1.4 Core Knowledge */}
                <section>
                  <div className={styles.sectionKicker}>Phần 1.4</div>
                  <h2>Kiến thức cốt lõi không thể bỏ qua</h2>
                  <ol className={styles.knowledgeList}>
                    {topic.coreKnowledge.map((ck, i) => (
                      <li key={i}>{ck}</li>
                    ))}
                  </ol>
                </section>

                {/* 1.5 Worked Examples with Audio */}
                {topic.workedExamples && topic.workedExamples.length > 0 && (
                  <section>
                    <div className={styles.sectionKicker}>Phần 1.5</div>
                    <h2>Ví dụ minh họa thực tế</h2>
                    <div className={styles.examples}>
                      {topic.workedExamples.map((ex, i) => (
                        <div key={i} className={styles.example}>
                          <span>Ví dụ minh họa #{i + 1}</span>
                          <p>"{ex.sentence}"</p>
                          <div>
                            <strong>Phân tích:</strong>
                            <span>{ex.focus}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 'var(--space-4)' }}>
                      <AudioPlayer
                        title={`Nghe phát âm chuẩn câu ví dụ (${topic.vocabularyTheme}):`}
                        transcript={topic.workedExamples[0].sentence}
                      />
                    </div>
                  </section>
                )}
              </>
            )}

            {/* STEP 2: THỰC CHIẾN PART 5, TỪ VỰNG & BẪY THI */}
            {currentPage === 2 && (
              <>
                {/* 2.1 Application Steps */}
                {topic.guide?.applicationSteps && topic.guide.applicationSteps.length > 0 && (
                  <section>
                    <div className={styles.sectionKicker}>Phần 2.1</div>
                    <h2>Quy trình 4 bước áp dụng giải nhanh câu hỏi</h2>
                    <p className={styles.sectionIntro}>
                      Huấn luyện thói quen tư duy có hệ thống thay vì đoán mò theo cảm tính:
                    </p>
                    <ol className={styles.processList}>
                      {topic.guide.applicationSteps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>

                    <div className={styles.examNote}>
                      <strong>Lưu ý chiến lược phòng thi:</strong> Luôn phân tích cấu trúc ngữ pháp trước, dịch nghĩa sau. Khi làm sai, lập tức ghi chú primary tag <code>{topic.primaryTag}</code> để hệ thống đưa vào Sổ tay lỗi rà soát.
                    </div>
                  </section>
                )}

                {/* 2.2 Realistic Part 5 Drills */}
                <section>
                  <div className={styles.sectionKicker}>Phần 2.2</div>
                  <h2>Bài tập thực chiến Part 5 (Kèm phân tích 3 bước)</h2>
                  <p className={styles.sectionIntro}>
                    Thử sức với câu hỏi mô phỏng đề thi TOEIC thật, chọn đáp án để xem giải thích chi tiết:
                  </p>

                  {enrichment.part5Drills.map((drill, dIdx) => {
                    const selectedKey = drillAnswers[dIdx];
                    const isSubmitted = drillSubmitted[dIdx];

                    return (
                      <div key={dIdx} className={styles.drillCard}>
                        <div className={styles.drillQuestion}>
                          <strong>Câu hỏi #{dIdx + 1}:</strong> {drill.question}
                        </div>

                        <div className={styles.drillOptionsGrid}>
                          {drill.options.map((opt) => {
                            const isSelected = selectedKey === opt.key;
                            let btnStyle = styles.drillOptionBtn;
                            if (isSubmitted) {
                              if (opt.isCorrect) btnStyle += ` ${styles.drillCorrect}`;
                              else if (isSelected && !opt.isCorrect) btnStyle += ` ${styles.drillWrong}`;
                            }

                            return (
                              <button
                                key={opt.key}
                                type="button"
                                disabled={isSubmitted}
                                onClick={() => handleDrillOptionSelect(dIdx, opt.key)}
                                className={btnStyle}
                              >
                                <span className={styles.drillOptionKey}>{opt.key}</span>
                                <span>{opt.text}</span>
                                {isSubmitted && opt.isCorrect && (
                                  <Check size={16} style={{ marginLeft: 'auto', color: 'var(--color-success)' }} />
                                )}
                                {isSubmitted && isSelected && !opt.isCorrect && (
                                  <X size={16} style={{ marginLeft: 'auto', color: 'var(--color-danger)' }} />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {isSubmitted && (
                          <div className={styles.drillAnalysisBox}>
                            <div className={styles.drillTranslation}>
                              <strong>Dịch nghĩa:</strong> {drill.translation}
                            </div>

                            <div className={styles.drillSteps}>
                              {drill.analysisSteps.map((st, sIdx) => (
                                <div key={sIdx} className={styles.drillStepRow}>
                                  <span className={styles.drillStepTitle}>{st.stepTitle}</span>
                                  <span>{st.description}</span>
                                </div>
                              ))}
                            </div>

                            {drill.trapWarning && (
                              <div className={styles.drillTrapAlert}>
                                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                                <span><strong>Cảnh báo bẫy:</strong> {drill.trapWarning}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </section>

                {/* 2.3 Common Traps */}
                {topic.commonTraps && topic.commonTraps.length > 0 && (
                  <section>
                    <div className={styles.sectionKicker}>Phần 2.3</div>
                    <h2>Các bẫy đề thi thường gặp & Cách hóa giải</h2>
                    <div className={styles.trapList}>
                      {topic.commonTraps.map((trap, idx) => (
                        <div key={idx} className={styles.trapItem}>
                          <span>BẪY {idx + 1}</span>
                          <p>{trap}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 2.4 Key Business Vocabulary */}
                {enrichment.vocabularyList && enrichment.vocabularyList.length > 0 && (
                  <section>
                    <div className={styles.sectionKicker}>Phần 2.4</div>
                    <h2>Từ vựng thương mại trọng tâm ({topic.vocabularyTheme})</h2>
                    <p className={styles.sectionIntro}>
                      Các từ vựng cốt lõi thường xuất hiện song hành cùng chủ điểm ngữ pháp này:
                    </p>

                    <div className={styles.vocabGrid}>
                      {enrichment.vocabularyList.map((v, vIdx) => (
                        <div key={vIdx} className={styles.vocabCard}>
                          <div className={styles.vocabHeader}>
                            <span className={styles.vocabWord}>{v.word}</span>
                            <span className={styles.vocabIpa}>{v.ipa}</span>
                            <span className={styles.vocabPos}>{v.partOfSpeech}</span>
                          </div>
                          <div className={styles.vocabMeaning}>{v.meaningVi}</div>
                          {v.collocation && (
                            <div className={styles.vocabCollocation}>
                              <strong>Cụm từ hay gặp:</strong> {v.collocation}
                            </div>
                          )}
                          <div className={styles.vocabExample}>"{v.exampleSentence}"</div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 2.5 Deep Dive Extensions */}
                {topic.guide?.extensions && topic.guide.extensions.length > 0 && (
                  <section>
                    <div className={styles.sectionKicker}>Phần 2.5</div>
                    <details className={styles.extension}>
                      <summary>
                        <span>
                          <strong>Mở rộng để hiểu sâu hơn (Kiến thức nâng cao)</strong>
                          <small>Dành cho mục tiêu 750+; không bắt buộc ghi nhớ ngay ở lượt học đầu tiên.</small>
                        </span>
                        <span className={styles.detailsHint}>Xem chi tiết ▾</span>
                      </summary>
                      <ul className={styles.plainList}>
                        {topic.guide.extensions.map((ext, i) => (
                          <li key={i}>{ext}</li>
                        ))}
                      </ul>
                    </details>
                  </section>
                )}
              </>
            )}

            {/* STEP 3: TỰ KIỂM TRA & QUIZ CUỐI BÀI */}
            {currentPage === 3 && (
              <>
                {/* 3.1 Interactive Self-Check Accordion */}
                <section>
                  <div className={styles.sectionKicker}>Phần 3.1</div>
                  <h2>Tự kiểm tra nhanh trước khi làm Quiz</h2>
                  <p className={styles.sectionIntro}>
                    Bấm vào từng câu hỏi để tự trả lời và kiểm tra đáp án chuẩn:
                  </p>

                  <div className={styles.selfCheckAccordion}>
                    {enrichment.selfCheckItems.map((sc, scIdx) => {
                      const isOpen = Boolean(openSelfCheck[scIdx]);
                      return (
                        <div key={scIdx} className={styles.selfCheckCard}>
                          <button
                            type="button"
                            onClick={() => toggleSelfCheck(scIdx)}
                            className={styles.selfCheckTrigger}
                          >
                            <span>
                              <strong>Câu hỏi {scIdx + 1}:</strong> {sc.prompt}
                            </span>
                            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>

                          {isOpen && (
                            <div className={styles.selfCheckContent}>
                              <div className={styles.selfCheckAnswer}>
                                ✓ Đáp án: {sc.answer}
                              </div>
                              <div className={styles.selfCheckExplain}>
                                <strong>Giải thích:</strong> {sc.explanation}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* 3.2 Exam Pro-Tips */}
                <section>
                  <div className={styles.proTipBanner}>
                    <div className={styles.proTipHeader}>
                      <Sparkles size={16} /> Mẹo làm bài nhanh trong phòng thi (Exam Pro-Tips)
                    </div>
                    <ul className={styles.proTipList}>
                      {enrichment.examProTips.map((tip, tIdx) => (
                        <li key={tIdx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </section>

                {/* 3.3 Key Takeaways Checklist */}
                <section>
                  <div className={styles.sectionKicker}>Phần 3.2</div>
                  <div className={styles.recap}>
                    <h2>Checklist ghi nhớ cốt lõi ({topic.code})</h2>
                    <ul className={styles.outcomeList} style={{ marginTop: 'var(--space-3)' }}>
                      {enrichment.keyTakeaways.map((takeaway, kIdx) => (
                        <li key={kIdx}>
                          <CheckCircle size={16} />
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                {/* 3.4 Quiz Callout */}
                <section>
                  <div className={styles.quizCallout}>
                    <div>
                      <FileQuestion size={36} />
                      <h2>Quiz kiểm tra: {topic.titleVi}</h2>
                      <p>
                        Gồm 8–10 câu hỏi trắc nghiệm Part 5/6 thực tế • Tỷ lệ đạt khuyến nghị: 80% • Tự động ghi nhận câu sai vào Sổ tay lỗi.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => navigate(`/learn/quiz/quiz-${topic.code.toLowerCase()}`)}
                      rightIcon={<ArrowRight size={16} />}
                    >
                      Bắt đầu làm Quiz
                    </Button>
                  </div>
                </section>
              </>
            )}
          </div>

          {/* Footer Action Bar */}
          <footer className={styles.lessonFooter}>
            <Button
              variant="secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Trang trước
            </Button>

            <button
              type="button"
              onClick={handleMarkAsRead}
              className={`${styles.markReadButton} ${markedRead[currentPage] ? styles.markReadDone : ''}`}
            >
              <span>{markedRead[currentPage] ? <Check size={12} /> : null}</span>
              {markedRead[currentPage] ? 'Đã xác nhận đọc phần này' : 'Đánh dấu đã đọc phần này'}
            </button>

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
                leftIcon={<Award size={16} />}
              >
                Hoàn thành bài học
              </Button>
            )}
          </footer>
        </main>
      </div>
    </div>
  );
}
