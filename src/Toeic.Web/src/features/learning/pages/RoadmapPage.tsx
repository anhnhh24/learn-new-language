import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import styles from './Roadmap.module.css';

interface ModuleItem {
  id: string;
  title: string;
  part: string;
  status: 'completed' | 'in_progress' | 'locked' | 'recommended';
  lessonsCount: number;
  completedLessons: number;
}

const mockWeeks = [
  {
    weekNumber: 1,
    title: 'Nền tảng Ngữ pháp & Cấu trúc câu Part 5',
    status: 'Đang học',
    modules: [
      {
        id: 'mod-1',
        title: 'Cụm danh từ, Đại từ và Biến đổi từ loại',
        part: 'Part 5',
        status: 'completed',
        lessonsCount: 5,
        completedLessons: 5,
      },
      {
        id: 'mod-2',
        title: 'Thì động từ, Dạng chủ động & Bị động',
        part: 'Part 5',
        status: 'completed',
        lessonsCount: 4,
        completedLessons: 4,
      },
      {
        id: 'mod-3',
        title: 'Liên từ & Mệnh đề trạng ngữ trong ngữ cảnh kinh doanh',
        part: 'Part 5',
        status: 'in_progress',
        lessonsCount: 6,
        completedLessons: 3,
      },
    ] as ModuleItem[],
  },
  {
    weekNumber: 2,
    title: 'Kỹ năng Đọc lướt (Skimming & Scanning) Part 7',
    status: 'Kế tiếp',
    modules: [
      {
        id: 'mod-4',
        title: 'Đọc hiểu E-mail giao dịch & Bản ghi nhớ nội bộ',
        part: 'Part 7',
        status: 'recommended',
        lessonsCount: 5,
        completedLessons: 0,
      },
      {
        id: 'mod-5',
        title: 'Biểu mẫu khảo sát, Hóa đơn và Lịch trình hội thảo',
        part: 'Part 7',
        status: 'locked',
        lessonsCount: 4,
        completedLessons: 0,
      },
    ] as ModuleItem[],
  },
];

export function RoadmapPage() {
  const navigate = useNavigate();

  return (
    <div className="content-container">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Lộ trình học tập</h1>
          <p className={styles.subtitle}>
            Kế hoạch ôn luyện hướng tới mục tiêu TOEIC 650+ • Dựa trên kết quả định hướng chẩn đoán
          </p>
        </div>
      </div>

      <div className={styles.roadmapList}>
        {mockWeeks.map((week) => (
          <section key={week.weekNumber} className={styles.weekSection} aria-label={`Tuần ${week.weekNumber}`}>
            <div className={styles.weekHeader}>
              <div className={styles.weekBadge}>Tuần {week.weekNumber}</div>
              <h2 className={styles.weekTitle}>{week.title}</h2>
              <span className={styles.weekStatus}>{week.status}</span>
            </div>

            <div className={styles.moduleGrid}>
              {week.modules.map((m) => (
                <div
                  key={m.id}
                  className={`${styles.moduleCard} ${m.status === 'in_progress' ? styles.activeCard : ''}`}
                >
                  <div className={styles.moduleHeader}>
                    <div className={styles.partBadge}>
                      <Badge variant="primary">{m.part}</Badge>
                    </div>
                    {m.status === 'completed' ? (
                      <span className={styles.completedTag}>
                        <CheckCircle2 size={16} /> Đã hoàn thành
                      </span>
                    ) : m.status === 'in_progress' ? (
                      <span className={styles.inProgressTag}>
                        <Circle size={16} className={styles.activeDot} /> Đang tiến hành
                      </span>
                    ) : m.status === 'recommended' ? (
                      <Badge variant="warning">Đề xuất tiếp theo</Badge>
                    ) : (
                      <span className={styles.lockedTag}>Chưa mở</span>
                    )}
                  </div>

                  <h3 className={styles.moduleTitle}>{m.title}</h3>

                  <div className={styles.moduleProgress}>
                    <div className={styles.progressTrack}>
                      <div
                        className={styles.progressBar}
                        style={{ width: `${(m.completedLessons / m.lessonsCount) * 100}%` }}
                      />
                    </div>
                    <span className={`${styles.progressText} text-tabular`}>
                      {m.completedLessons}/{m.lessonsCount} bài hoàn tất
                    </span>
                  </div>

                  <div className={styles.moduleFooter}>
                    <Button
                      variant={m.status === 'in_progress' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => navigate('/learn/lesson/4')}
                      rightIcon={<ArrowRight size={14} />}
                    >
                      {m.status === 'completed' ? 'Xem lại' : 'Vào bài học'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
