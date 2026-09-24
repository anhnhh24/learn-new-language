import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  HelpCircle, 
  Layers, 
  RotateCcw, 
  ShieldCheck, 
  ArrowRight
} from 'lucide-react';
import { Button, Badge } from '../../../components/ui';
import { toeicReadingCurriculum } from '../../../lib/api/curriculumData';
import { CurriculumLevelCode } from '../../../types/curriculum';
import styles from './Roadmap.module.css';

export function RoadmapPage() {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState<CurriculumLevelCode | 'ALL'>('ALL');

  const { levels, weeks } = toeicReadingCurriculum;

  const filteredWeeks = selectedLevel === 'ALL'
    ? weeks
    : weeks.filter((w) => w.levelCode === selectedLevel);

  const activeLevelInfo = levels.find((l) => l.code === selectedLevel);

  const handleStartActivity = (act: (typeof weeks)[0]['activities'][0]) => {
    if (act.type === 'Lesson' && act.topicCode) {
      navigate(`/learn/lesson/${act.topicCode}`);
    } else if (act.type === 'Checkpoint') {
      navigate(`/learn/lesson/${act.lessonCode || 'CHECKPOINT-A'}`);
    } else if (act.type === 'Quiz' && act.topicCode) {
      navigate(`/learn/quiz/quiz-${act.topicCode.toLowerCase()}`);
    } else if (act.type === 'Flashcard') {
      navigate('/learn/flashcards');
    } else if (act.type === 'MixedReview') {
      navigate('/learn/errors');
    } else {
      navigate('/learn/lesson/A1');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Lesson':
        return <BookOpen size={16} />;
      case 'Quiz':
        return <HelpCircle size={16} />;
      case 'Flashcard':
        return <Layers size={16} />;
      case 'Checkpoint':
        return <ShieldCheck size={16} color="#137333" />;
      case 'MixedReview':
      case 'Remediation':
        return <RotateCcw size={16} color="#b06000" />;
      default:
        return <BookOpen size={16} />;
    }
  };

  return (
    <div className="content-container">
      <div className={styles.header}>
        <div>
          <span className={styles.pretitle}>🗺️ LỘ TRÌNH 31 TUẦN CHUẨN HÓA</span>
          <h1 className={styles.title}>Lộ trình TOEIC Reading theo nhịp học cá nhân</h1>
          <p className={styles.subtitle}>
            31 tuần học tập có cấu trúc từ Nền tảng (Mức A) đến Chuyên sâu Part 5/6 (Mức D) • Cơ chế kiểm định Checkpoint độc lập
          </p>
        </div>
      </div>

      {/* Level Filter Tabs */}
      <div className={styles.levelTabs}>
        <button
          type="button"
          className={`${styles.levelTab} ${selectedLevel === 'ALL' ? styles.levelTabActive : ''}`}
          onClick={() => setSelectedLevel('ALL')}
        >
          Tất cả 31 tuần
        </button>
        {levels.map((lvl) => (
          <button
            key={lvl.code}
            type="button"
            className={`${styles.levelTab} ${selectedLevel === lvl.code ? styles.levelTabActive : ''}`}
            onClick={() => setSelectedLevel(lvl.code)}
          >
            Mức {lvl.code}: {lvl.title.split('—')[1]?.trim() || lvl.title} ({lvl.recommendedWeeks} tuần)
          </button>
        ))}
      </div>

      {/* Level Overview Banner */}
      {activeLevelInfo && (
        <div className={styles.levelOverviewBanner}>
          <div className={styles.levelOverviewTitle}>
            Mục tiêu {activeLevelInfo.title}
          </div>
          <p className={styles.levelOverviewDesc}>
            {activeLevelInfo.outcomeGuidance}
          </p>
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-ink-tertiary)' }}>
            Tiêu chuẩn Checkpoint: <strong>{activeLevelInfo.checkpointQuestionCount} câu hỏi</strong> • Ngưỡng khuyến nghị chuyển mức: <strong>{Math.round(activeLevelInfo.checkpointPassRate * 100)}%</strong>
          </div>
        </div>
      )}

      {/* Weeks List */}
      <div className={styles.roadmapList}>
        {filteredWeeks.map((week) => {
          const isCheckpointWeek = week.checkpointKind === 'LevelCheckpoint';

          return (
            <section 
              key={week.weekNumber} 
              className={`${styles.weekSection} ${isCheckpointWeek ? styles.weekSectionCheckpoint : ''}`} 
              aria-label={`Tuần ${week.weekNumber}`}
            >
              <div className={styles.weekHeader}>
                <div className={styles.weekBadge}>Tuần {week.weekNumber}</div>
                <h2 className={styles.weekTitle}>{week.title}</h2>
                
                <div className={styles.weekMetaPills}>
                  {week.vocabularyTheme && (
                    <Badge variant="default">Chủ đề: {week.vocabularyTheme}</Badge>
                  )}
                  {isCheckpointWeek ? (
                    <Badge variant="success">Level Checkpoint ({Math.round(week.passRate * 100)}%)</Badge>
                  ) : week.checkpointKind === 'MixedReview' ? (
                    <Badge variant="warning">Ôn tập tích lũy</Badge>
                  ) : week.checkpointKind === 'Remediation' ? (
                    <Badge variant="info">Củng cố thích ứng</Badge>
                  ) : (
                    <Badge variant="primary">Mức {week.levelCode}</Badge>
                  )}
                </div>
              </div>

              <div className={styles.weekGoal}>
                <strong>Mục tiêu tuần:</strong> {week.goal}
              </div>

              {/* Activities inside week */}
              <div className={styles.activityList}>
                {week.activities.map((act) => (
                  <div key={act.id} className={styles.activityCard}>
                    <div className={styles.activityLeft}>
                      <div className={styles.activityIcon}>
                        {getActivityIcon(act.type)}
                      </div>
                      <div>
                        <div className={styles.activityTitle}>{act.title}</div>
                        <div className={styles.activityDuration}>
                          Thời lượng ước tính: {act.estimatedMinutes} phút {act.required ? '• Bắt buộc' : '• Tùy chọn'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Button
                        variant={act.type === 'Checkpoint' ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => handleStartActivity(act)}
                      >
                        {act.type === 'Lesson' ? 'Học bài' : act.type === 'Checkpoint' ? 'Vào Checkpoint' : act.type === 'Quiz' ? 'Làm Quiz' : 'Ôn tập'}
                        <ArrowRight size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
