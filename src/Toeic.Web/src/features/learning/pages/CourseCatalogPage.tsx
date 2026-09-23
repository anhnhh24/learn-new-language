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

const mockCourses: CourseItem[] = [
  {
    id: 'course-toeic-500',
    title: 'TOEIC Nền tảng 500+: Củng cố Ngữ pháp & Từ vựng căn bản',
    targetLevel: 'Mục tiêu 500 - 600',
    levelBadge: 'Nền tảng',
    totalLessons: 24,
    durationHours: 18,
    description: 'Bao quát 12 chủ điểm ngữ pháp trọng yếu Part 5 và kỹ năng đọc hiểu văn bản ngắn Part 7.',
    hasSampleLesson: true,
    isEnrolled: true,
  },
  {
    id: 'course-toeic-650',
    title: 'TOEIC Bứt phá 650+: Chiến thuật Đọc hiểu nhanh & Xử lý bẫy',
    targetLevel: 'Mục tiêu 650 - 750',
    levelBadge: 'Trung cấp',
    totalLessons: 32,
    durationHours: 25,
    description: 'Kỹ thuật đọc lướt Skimming/Scanning, xử lý đoạn kép và đoạn ba thương mại phức tạp.',
    hasSampleLesson: true,
    isEnrolled: false,
  },
  {
    id: 'course-toeic-800',
    title: 'TOEIC Chuyên sâu 800+: Thành thạo Văn phong & Từ vựng kinh doanh nâng cao',
    targetLevel: 'Mục tiêu 800 - 900+',
    levelBadge: 'Nâng cao',
    totalLessons: 28,
    durationHours: 22,
    description: 'Chuyên đề thành ngữ, phrasal verbs công sở và câu hỏi suy luận ngầm logic đa tài liệu.',
    hasSampleLesson: true,
    isEnrolled: false,
  },
];

export function CourseCatalogPage() {
  const navigate = useNavigate();
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [courses, setCourses] = useState<CourseItem[]>(mockCourses);

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
            Các chương trình đào tạo TOEIC Listening & Reading theo lộ trình từng cấp độ (UI-01 & FR-06).
          </p>
        </div>
      </div>

      <div className={styles.filtersRow}>
        {[
          { key: 'all', label: 'Tất cả trình độ' },
          { key: 'Nền tảng', label: 'Mục tiêu 500+' },
          { key: 'Trung cấp', label: 'Mục tiêu 650+' },
          { key: 'Nâng cao', label: 'Mục tiêu 800+' },
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
                <Badge variant="default">Có bài học thử</Badge>
              )}
            </div>

            <h2 className={styles.courseTitle}>{c.title}</h2>
            <p className={styles.courseDesc}>{c.description}</p>

            <div className={styles.specsList}>
              <div className={styles.specRow}>
                <GraduationCap size={15} className={styles.specIcon} />
                <span>{c.targetLevel}</span>
              </div>
              <div className={styles.specRow}>
                <BookOpen size={15} className={styles.specIcon} />
                <span><strong className="text-tabular">{c.totalLessons}</strong> bài học chuẩn hóa</span>
              </div>
              <div className={styles.specRow}>
                <Clock size={15} className={styles.specIcon} />
                <span>Ước tính <strong className="text-tabular">{c.durationHours}</strong> giờ học tập</span>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <Button
                variant={c.isEnrolled ? 'primary' : 'outline'}
                size="sm"
                onClick={() => (c.isEnrolled ? navigate(`/learn/courses/${c.id}`) : handleEnroll(c.id))}
                leftIcon={c.isEnrolled ? <CheckCircle size={15} /> : undefined}
                rightIcon={<ArrowRight size={14} />}
              >
                {c.isEnrolled ? 'Tiếp tục học' : 'Xem chi tiết & Đăng ký'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
