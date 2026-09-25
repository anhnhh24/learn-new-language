import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  PlayCircle,
  Clock,
  Layers,
  FileCheck,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import { toeicReadingCurriculum } from '../../../lib/api/curriculumData';
import styles from './CourseDetail.module.css';

export function CourseDetailPage() {
  const { courseId = 'toeic-reading-grammar-foundation' } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [isEnrolled, setIsEnrolled] = useState(true);

  const course = toeicReadingCurriculum;

  const handleEnrollClick = () => {
    setIsEnrolled(true);
    navigate('/learn/lesson/A1');
  };

  // Group topics by level/module
  const allTopicsList = Object.values(course.topics);
  const modulesWithTopics = course.modules.map((mod, idx) => {
    const levelTopics = allTopicsList
      .filter((t) => t.levelCode === mod.levelCode)
      .sort((a, b) => a.sequence - b.sequence);
    return {
      chapterNumber: idx + 1,
      levelCode: mod.levelCode,
      code: mod.code,
      title: `${mod.title} (Level ${mod.levelCode})`,
      summary: mod.summary,
      topics: levelTopics,
      checkpointCode: `CHECKPOINT-${mod.levelCode}`,
    };
  });

  return (
    <div className="content-container">
      <div className={styles.topNav}>
        <button
          type="button"
          onClick={() => navigate('/learn/courses')}
          className={styles.backBtn}
        >
          <ArrowLeft size={16} /> Danh mục khóa học
        </button>
      </div>

      <div className={styles.detailHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.metaRow}>
            <Badge variant="primary">{course.levelLabel}</Badge>
            <span className={styles.courseCode}>{courseId.toUpperCase()}</span>
          </div>
          <h1 className={styles.courseTitle}>{course.title}</h1>
          <p className={styles.courseSubtitle}>{course.summary}</p>

          <div className={styles.specsRow}>
            <span><BookOpen size={16} /> 40 chuyên đề cốt lõi</span>
            <span><Clock size={16} /> 4 phân hệ kiến thức (~70 giờ)</span>
            <span><Layers size={16} /> 4 Cột mốc Checkpoint chuyển cấp</span>
            <span><FileCheck size={16} /> Part 5 & 6 Reading chuyên sâu</span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.enrollBox}>
            <div className={styles.enrollStatus}>
              {isEnrolled ? (
                <>
                  <CheckCircle size={20} className={styles.enrolledIcon} />
                  <strong>Bạn đã đăng ký khóa học này</strong>
                </>
              ) : (
                <strong>Khóa học mở tự do cho học viên</strong>
              )}
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleEnrollClick}
              leftIcon={<PlayCircle size={18} />}
              style={{ width: '100%', marginBottom: 'var(--space-2)' }}
            >
              {isEnrolled ? 'Vào bài học đang học (A1 · Từ loại)' : 'Đăng ký tham gia học ngay'}
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/learn/roadmap')}
              leftIcon={<MapPin size={16} />}
              style={{ width: '100%' }}
            >
              Xem Hệ thống kiến thức
            </Button>
          </div>
        </div>
      </div>

      {/* Course Syllabus */}
      <section className={styles.syllabusSection} aria-labelledby="syllabus-heading">
        <h2 id="syllabus-heading" className={styles.syllabusTitle}>
          Cấu trúc 4 Modules & Danh mục bài học chính thức
        </h2>

        <div className={styles.chapterList}>
          {modulesWithTopics.map((ch) => (
            <div key={ch.chapterNumber} className={styles.chapterCard}>
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Badge variant="primary">Module {ch.levelCode}</Badge>
                  <h3 className={styles.chapterHeader} style={{ margin: 0 }}>
                    {ch.title}
                  </h3>
                </div>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                  {ch.summary}
                </p>
              </div>

              <div className={styles.lessonRows}>
                {ch.topics.map((t) => (
                  <div key={t.id} className={styles.lessonRow}>
                    <div className={styles.lessonLeft}>
                      <PlayCircle size={16} className={styles.playIcon} />
                      <span className={styles.lessonName}>
                        <strong>{t.code}</strong> · {t.titleVi} ({t.titleEn})
                      </span>
                      {t.code === 'A1' && <Badge variant="default">Bài học mẫu</Badge>}
                    </div>

                    <div className={styles.lessonRight}>
                      <span className={`${styles.duration} text-tabular`}>{t.estimatedMinutes} phút</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/learn/lesson/${t.code}`)}
                      >
                        Học bài
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Level Checkpoint Row */}
                <div
                  className={styles.lessonRow}
                  style={{
                    backgroundColor: 'var(--color-surface-subtle)',
                    borderLeft: '3px solid var(--color-primary)',
                  }}
                >
                  <div className={styles.lessonLeft}>
                    <ShieldCheck size={16} style={{ color: 'var(--color-primary)' }} />
                    <span className={styles.lessonName}>
                      <strong>{ch.checkpointCode}</strong> · Đánh giá chuẩn đầu ra Level {ch.levelCode}
                    </span>
                    <Badge variant="info">Checkpoint</Badge>
                  </div>

                  <div className={styles.lessonRight}>
                    <span className={`${styles.duration} text-tabular`}>Đạt chuẩn để chuyển cấp</span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/learn/lesson/${ch.checkpointCode}`)}
                    >
                      Chi tiết Checkpoint
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
