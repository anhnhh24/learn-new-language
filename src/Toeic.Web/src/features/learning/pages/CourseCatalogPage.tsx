import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  BookOpen,
  Clock,
  CheckCircle,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import styles from './CourseCatalog.module.css';

interface CourseItem {
  id: string;
  title: string;
  targetLevel: string;
  levelBadge: string;
  totalLessons: number;
  durationHours: number;
  description: string;
  hasSampleLesson: boolean;
  isEnrolled: boolean;
}

const officialCourses: CourseItem[] = [
  {
    id: 'toeic-reading-grammar-foundation',
    title: 'TOEIC Reading: Ngữ pháp và từ vựng từ nền tảng đến nâng cao',
    targetLevel: 'Lộ trình chính thức 31 tuần (Level A → D)',
    levelBadge: 'Toàn diện',
    totalLessons: 35,
    durationHours: 70,
    description: 'Chương trình flagship bao quát 35 chủ điểm ngữ pháp cốt lõi, 4 bài thi Checkpoint chuẩn hóa và quy trình remediation chống hổng kiến thức.',
    hasSampleLesson: true,
    isEnrolled: true,
  },
  {
    id: 'toeic-module-a',
    title: 'Module A: Dựng nền câu và từ loại (Tuần 1–6)',
    targetLevel: 'Mục tiêu củng cố căn bản · Level A',
    levelBadge: 'Level A',
    totalLessons: 9,
    durationHours: 16,
    description: 'Nhận diện 4 từ loại, cấu trúc câu S–V–O, các thì cơ bản, mạo từ và danh từ đếm được/không đếm được. Checkpoint A gồm 25 câu.',
    hasSampleLesson: true,
    isEnrolled: true,
  },
  {
    id: 'toeic-module-b',
    title: 'Module B: Cấu trúc trung cấp ứng dụng (Tuần 7–13)',
    targetLevel: 'Mục tiêu ứng dụng linh hoạt · Level B',
    levelBadge: 'Level B',
    totalLessons: 10,
    durationHours: 20,
    description: 'Làm chủ thì hoàn thành, thể bị động, câu điều kiện loại 0-1-2, mệnh đề quan hệ và liên từ kết hợp. Checkpoint B gồm 40 câu.',
    hasSampleLesson: false,
    isEnrolled: false,
  },
  {
    id: 'toeic-module-c',
    title: 'Module C: Cấu trúc nâng cao có kiểm soát (Tuần 14–21)',
    targetLevel: 'Mục tiêu xử lý câu khó · Level C',
    levelBadge: 'Level C',
    totalLessons: 10,
    durationHours: 22,
    description: 'Chuyên đề đảo ngữ, phân từ rút gọn, câu giả định và cấu trúc nhấn mạnh. Có tuần 21 remediation chuyên sâu. Checkpoint C gồm 40 câu.',
    hasSampleLesson: false,
    isEnrolled: false,
  },
  {
    id: 'toeic-module-d',
    title: 'Module D: Độ chính xác chuyên sâu Part 5/6 (Tuần 22–31)',
    targetLevel: 'Mục tiêu tối đa điểm Reading · Level D',
    levelBadge: 'Level D',
    totalLessons: 11,
    durationHours: 26,
    description: 'Tinh chỉnh word-form, collocation công sở, văn phong thương mại và chiến lược né bẫy đề thi. Checkpoint D tốt nghiệp 46 câu.',
    hasSampleLesson: false,
    isEnrolled: false,
  },
];

export function CourseCatalogPage() {
  const navigate = useNavigate();
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [courses, setCourses] = useState<CourseItem[]>(officialCourses);

  const handleEnroll = (courseId: string) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, isEnrolled: true } : c))
    );
    navigate(`/learn/courses/${courseId}`);
  };

  const filteredCourses = courses.filter((c) => {
    if (levelFilter === 'all') return true;
    return c.levelBadge === levelFilter;
  });

  return (
    <div className="content-container">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Danh mục khóa học</h1>
          <p className={styles.subtitle}>
            Chương trình đào tạo chuẩn hóa từ Database: 31 tuần, 4 cấp độ và 35 chủ điểm bài học.
          </p>
        </div>
      </div>

      <div className={styles.filtersRow}>
        {[
          { key: 'all', label: 'Tất cả chương trình' },
          { key: 'Toàn diện', label: 'Toàn diện 31 tuần' },
          { key: 'Level A', label: 'Level A (Nền tảng)' },
          { key: 'Level B', label: 'Level B (Trung cấp)' },
          { key: 'Level C', label: 'Level C (Nâng cao)' },
          { key: 'Level D', label: 'Level D (Chuyên sâu)' },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setLevelFilter(f.key)}
            className={`${styles.filterBtn} ${levelFilter === f.key ? styles.activeFilter : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={styles.coursesGrid}>
        {filteredCourses.map((c) => (
          <div key={c.id} className={styles.courseCard}>
            <div className={styles.cardTop}>
              <span className={styles.levelBadge}>{c.levelBadge}</span>
              {c.isEnrolled ? (
                <Badge variant="success">Đang theo học</Badge>
              ) : (
                <span className={styles.targetLevel}>{c.targetLevel}</span>
              )}
            </div>

            <h3 className={styles.courseTitle}>{c.title}</h3>
            <p className={styles.courseDesc}>{c.description}</p>

            <div className={styles.metaInfo}>
              <div className={styles.metaItem}>
                <BookOpen size={16} />
                <span>{c.totalLessons} bài học</span>
              </div>
              <div className={styles.metaItem}>
                <Clock size={16} />
                <span>{c.durationHours} giờ học</span>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <Button
                variant={c.isEnrolled ? 'primary' : 'secondary'}
                onClick={() => {
                  if (c.isEnrolled) {
                    navigate('/learn/roadmap');
                  } else {
                    handleEnroll(c.id);
                  }
                }}
                rightIcon={c.isEnrolled ? <ArrowRight size={16} /> : <GraduationCap size={16} />}
              >
                {c.isEnrolled ? 'Vào học theo lộ trình' : 'Xem chi tiết & Đăng ký'}
              </Button>

              {c.hasSampleLesson && (
                <button
                  type="button"
                  onClick={() => navigate('/learn/lesson/A1')}
                  className={styles.sampleLink}
                >
                  <CheckCircle size={14} /> Học thử bài A1
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
