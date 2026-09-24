import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Badge, TierBadge } from '../../../components/ui/Badge';
import {
  PlayCircle,
  Layers,
  Bookmark,
  Clock,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Flame,
  TrendingUp,
  CalendarCheck,
  Check,
  Award,
} from 'lucide-react';
import { api } from '../../../lib/api/client';
import { FlashcardItem, MistakeRecord } from '../../../types/review';
import { toeicReadingCurriculum } from '../../../lib/api/curriculumData';
import styles from './Today.module.css';

export function TodayPage() {
  const navigate = useNavigate();
  const [dueCards, setDueCards] = useState<FlashcardItem[]>([]);
  const [openMistakes, setOpenMistakes] = useState<MistakeRecord[]>([]);

  useEffect(() => {
    api.getFlashcards().then(setDueCards);
    api.getMistakes().then((items) => setOpenMistakes(items.filter((i) => i.status === 'Open')));
  }, []);

  const course = toeicReadingCurriculum;

  const weeklyHabit = [
    { day: 'T2', completed: true, isToday: false },
    { day: 'T3', completed: true, isToday: false },
    { day: 'T4', completed: true, isToday: false },
    { day: 'T5', completed: true, isToday: false },
    { day: 'T6', completed: true, isToday: true },
    { day: 'T7', completed: false, isToday: false },
    { day: 'CN', completed: false, isToday: false },
  ];

  return (
    <div className="content-container">
      <div className={styles.todayContainer}>
        {/* Study Space Header */}
        <header className={styles.studyHeader}>
          <div className={styles.greetingBlock}>
            <h1>Phòng học thông minh</h1>
            <p className={styles.greetingSub}>
              Chào mừng bạn trở lại! Tiếp tục hoàn thành 30 phút mục tiêu hôm nay để duy trì chuỗi học tập 🎯
            </p>
          </div>

          <div className={styles.quickStatsRow}>
            <div className={styles.streakPill} title="Chuỗi ngày học liên tục">
              <Flame size={18} />
              <span>5 ngày liên tiếp</span>
            </div>

            <div className={styles.predictedScorePill} title="Dự đoán điểm TOEIC theo dữ liệu làm bài gần nhất">
              <TrendingUp size={16} />
              <span>Dự đoán: 685 / 990</span>
            </div>
          </div>
        </header>

        {/* Weekly Habit Tracker */}
        <section className={styles.weekHabitSection} aria-label="Thói quen học tập tuần này">
          <div className={styles.habitTitleBlock}>
            <CalendarCheck size={18} style={{ color: 'var(--color-primary)' }} />
            <span>Kỷ luật học tập tuần này (5/7 ngày đã hoàn thành)</span>
          </div>

          <div className={styles.habitDaysGrid}>
            {weeklyHabit.map((h, i) => (
              <div key={i} className={styles.habitDayItem}>
                <span className={styles.dayLabel}>{h.day}</span>
                <span
                  className={`${styles.dayCircle} ${h.completed ? styles.dayCompleted : ''} ${
                    h.isToday ? styles.dayToday : ''
                  }`}
                >
                  {h.completed ? <Check size={14} /> : i + 19}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Core Daily Tasks List (PREP-style) */}
        <section aria-labelledby="daily-tasks-heading">
          <div className={styles.sectionHeadingRow}>
            <h2 id="daily-tasks-heading" className={styles.sectionTitle}>
              <CheckCircle2 size={20} style={{ color: 'var(--color-primary)' }} />
              Nhiệm vụ học tập hôm nay
            </h2>
            <div className={styles.taskProgressBar}>
              <span>Tiến độ: 1/4 nhiệm vụ đã nộp</span>
            </div>
          </div>

          <div className={styles.taskList}>
            {/* Task 1: Core Concept Lesson */}
            <div className={`${styles.taskCard} ${styles.taskCardPrimary}`}>
              <div className={styles.taskLeft}>
                <div className={`${styles.taskIconBox} ${styles.iconBoxTeal}`}>
                  <BookOpen size={20} />
                </div>
                <div className={styles.taskInfo}>
                  <div className={styles.taskMetaRow}>
                    <span className={styles.taskBadge}>BÀI HỌC CỐT LÕI · TUẦN 1</span>
                    <Badge variant="primary">Level A</Badge>
                  </div>
                  <h3 className={styles.taskName}>Bài A1: Từ loại và vị trí trong câu</h3>
                  <p className={styles.taskDesc}>
                    Nhận diện 4 từ loại, bảng hậu tố nhận biết và công thức vị trí vàng trong Part 5 (40 phút).
                  </p>
                  <div className={styles.taskSpecs}>
                    <span className={styles.specItem}>
                      <Clock size={13} /> 40 phút lý thuyết
                    </span>
                    <span className={styles.specItem}>
                      <Award size={13} /> 2 câu Part 5 thực chiến
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.taskRight}>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/learn/lesson/A1')}
                  leftIcon={<PlayCircle size={16} />}
                >
                  Vào học ngay
                </Button>
              </div>
            </div>

            {/* Task 2: Part 5 Practice Drill */}
            <div className={`${styles.taskCard} ${styles.taskCardBlue}`}>
              <div className={styles.taskLeft}>
                <div className={`${styles.taskIconBox} ${styles.iconBoxBlue}`}>
                  <TrendingUp size={20} />
                </div>
                <div className={styles.taskInfo}>
                  <div className={styles.taskMetaRow}>
                    <span className={styles.taskBadge} style={{ color: '#2563eb' }}>LUYỆN TẬP THỰC CHIẾN</span>
                    <TierBadge tier="BetaPractice" />
                  </div>
                  <h3 className={styles.taskName}>Quiz A1: 10 câu trắc nghiệm Phân biệt Từ loại</h3>
                  <p className={styles.taskDesc}>
                    Giải đề có bấm giờ và xem giải thích chi tiết tức thì cho từng phương án A, B, C, D.
                  </p>
                  <div className={styles.taskSpecs}>
                    <span className={styles.specItem}>
                      <Clock size={13} /> 10 phút
                    </span>
                    <span className={styles.specItem}>
                      <Award size={13} /> Mục tiêu đạt 80%
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.taskRight}>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate('/learn/quiz/part5-grammar')}
                >
                  Làm Quiz (10 câu)
                </Button>
              </div>
            </div>

            {/* Task 3: Flashcard Spaced Repetition */}
            <div className={`${styles.taskCard} ${styles.taskCardAmber}`}>
              <div className={styles.taskLeft}>
                <div className={`${styles.taskIconBox} ${styles.iconBoxAmber}`}>
                  <Layers size={20} />
                </div>
                <div className={styles.taskInfo}>
                  <div className={styles.taskMetaRow}>
                    <span className={styles.taskBadge} style={{ color: '#f48c06' }}>LẶP NGẮT QUÃNG (SRS)</span>
                    <Badge variant="default">{dueCards.length} thẻ đến hạn</Badge>
                  </div>
                  <h3 className={styles.taskName}>Ôn tập Flashcard từ vựng thương mại</h3>
                  <p className={styles.taskDesc}>
                    Củng cố từ vựng chuyên ngành văn phòng và collocations theo thuật toán lặp ngắt quãng.
                  </p>
                  <div className={styles.taskSpecs}>
                    <span className={styles.specItem}>
                      <Clock size={13} /> ~8 phút
                    </span>
                    <span className={styles.specItem}>
                      <Award size={13} /> {dueCards.length} thẻ cần ôn
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.taskRight}>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate('/learn/flashcards')}
                >
                  Ôn {dueCards.length} thẻ
                </Button>
              </div>
            </div>

            {/* Task 4: Error Notebook Review */}
            <div className={`${styles.taskCard} ${styles.taskCardRose}`}>
              <div className={styles.taskLeft}>
                <div className={`${styles.taskIconBox} ${styles.iconBoxRose}`}>
                  <Bookmark size={20} />
                </div>
                <div className={styles.taskInfo}>
                  <div className={styles.taskMetaRow}>
                    <span className={styles.taskBadge} style={{ color: '#e11d48' }}>SỔ TAY LỖI SAI</span>
                    <Badge variant={openMistakes.length > 0 ? 'danger' : 'success'}>
                      {openMistakes.length} câu chưa sửa
                    </Badge>
                  </div>
                  <h3 className={styles.taskName}>Rà soát và làm lại câu làm sai</h3>
                  <p className={styles.taskDesc}>
                    Khắc phục các bẫy liên từ và danh từ ghép hay nhầm lẫn trong các bài thi thử trước.
                  </p>
                  <div className={styles.taskSpecs}>
                    <span className={styles.specItem}>
                      <Clock size={13} /> ~5 phút
                    </span>
                    <span className={styles.specItem}>
                      <Award size={13} /> {openMistakes.length} câu cần làm lại
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.taskRight}>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate('/learn/errors')}
                >
                  Mở sổ lỗi sai
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Grid: Active Course & Skill Analytics Overview */}
        <div className={styles.bottomGrid}>
          {/* Active Course Status */}
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>
                <BookOpen size={18} style={{ color: 'var(--color-primary)' }} />
                Khóa học đang theo học
              </h3>
              <Link to="/learn/roadmap" className={styles.panelLink}>
                Xem hệ thống kiến thức <ArrowRight size={13} />
              </Link>
            </div>

            <div className={styles.courseProgressBox}>
              <div className={styles.courseProgressHeader}>
                <span className={styles.courseTitle}>{course.title}</span>
                <span className={styles.courseLevel}>Level A · 40 chuyên đề</span>
              </div>

              <div className={styles.progressBarBg}>
                <div className={styles.progressBarFill} style={{ width: '12%' }} />
              </div>

              <div className={styles.courseMetaFooter}>
                <span>Phần 1: Cấu trúc câu & 4 từ loại cốt lõi</span>
                <span>Tiến độ: 12% hoàn thành</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/learn/roadmap')}
              style={{ width: '100%' }}
            >
              Mở hệ thống kiến thức chuẩn hóa
            </Button>
          </div>

          {/* Quick Review Overview */}
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>
                <TrendingUp size={18} style={{ color: 'var(--color-primary)' }} />
                Chỉ số năng lực hiện tại
              </h3>
              <Link to="/learn/dashboard" className={styles.panelLink}>
                Báo cáo chi tiết <ArrowRight size={13} />
              </Link>
            </div>

            <div className={styles.reviewStatsRow}>
              <div className={styles.reviewStatBox}>
                <div className={styles.reviewStatVal}>76.4%</div>
                <div className={styles.reviewStatLabel}>Độ chính xác Part 5</div>
              </div>
              <div className={styles.reviewStatBox}>
                <div className={styles.reviewStatVal}>240 từ</div>
                <div className={styles.reviewStatLabel}>Từ vựng đã làm chủ</div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/learn/dashboard')}
              style={{ width: '100%' }}
            >
              Xem biểu đồ kỹ năng & phân tích điểm yếu
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
