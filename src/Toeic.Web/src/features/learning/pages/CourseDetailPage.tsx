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
} from 'lucide-react';
import styles from './CourseDetail.module.css';

export function CourseDetailPage() {
  const { courseId = 'course-toeic-500' } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [isEnrolled, setIsEnrolled] = useState(true);

  const handleEnrollClick = () => {
    setIsEnrolled(true);
    navigate('/learn/lesson/4');
  };

  const chapters = [
    {
      chapterNumber: 1,
      title: 'Chương 1: Các mẫu câu và cấu trúc ngữ pháp Part 5 thường gặp',
      lessons: [
        { id: 'les-1', title: 'Bài 1: Danh từ, Cụm danh từ và Vị trí của tính từ', duration: '25 phút', isFreeSample: true, isDone: true },
        { id: 'les-2', title: 'Bài 2: Đại từ quan hệ (Who, Whom, Whose, Which, That)', duration: '30 phút', isFreeSample: false, isDone: true },
        { id: 'les-3', title: 'Bài 3: Động từ nguyên mẫu (To-V) và Danh động từ (V-ing)', duration: '35 phút', isFreeSample: false, isDone: true },
        { id: 'les-4', title: 'Bài 4: Mệnh đề phân từ & Rút gọn trong văn bản thương mại', duration: '30 phút', isFreeSample: false, isDone: false },
      ],
    },
    {
      chapterNumber: 2,
      title: 'Chương 2: Đọc hiểu văn bản đơn Part 7',
      lessons: [
        { id: 'les-5', title: 'Bài 5: E-mail công việc và thư tín thương mại quốc tế', duration: '40 phút', isFreeSample: false, isDone: false },
        { id: 'les-6', title: 'Bài 6: Bảng thông báo, Bản tin nội bộ và Thư mời hội thảo', duration: '35 phút', isFreeSample: false, isDone: false },
      ],
    },
  ];

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
            <Badge variant="primary">Khóa học nền tảng</Badge>
            <span className={styles.courseCode}>{courseId.toUpperCase()}</span>
          </div>
          <h1 className={styles.courseTitle}>
            TOEIC Nền tảng 500+: Củng cố Ngữ pháp & Từ vựng căn bản
          </h1>
          <p className={styles.courseSubtitle}>
            Chương trình đào tạo giúp học viên làm chủ cấu trúc câu, từ loại và phát triển kỹ năng đọc hiểu văn bản thương mại.
          </p>

          <div className={styles.specsRow}>
            <span><BookOpen size={16} /> 24 bài học</span>
            <span><Clock size={16} /> 18 giờ học tập</span>
            <span><Layers size={16} /> 120 thẻ Flashcard kèm theo</span>
            <span><FileCheck size={16} /> 6 bài Quiz kiểm tra</span>
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
                <strong>Khóa học miễn phí trong giai đoạn Pilot</strong>
              )}
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleEnrollClick}
              leftIcon={<PlayCircle size={18} />}
              style={{ width: '100%' }}
            >
              {isEnrolled ? 'Vào bài học đang dở (Bài 4)' : 'Đăng ký tham gia học ngay'}
            </Button>
          </div>
        </div>
      </div>

      {/* Course Syllabus */}
      <section className={styles.syllabusSection} aria-labelledby="syllabus-heading">
        <h2 id="syllabus-heading" className={styles.syllabusTitle}>Nội dung chương trình đào tạo</h2>

        <div className={styles.chapterList}>
          {chapters.map((ch) => (
            <div key={ch.chapterNumber} className={styles.chapterCard}>
              <h3 className={styles.chapterHeader}>{ch.title}</h3>

              <div className={styles.lessonRows}>
                {ch.lessons.map((les) => (
                  <div key={les.id} className={styles.lessonRow}>
                    <div className={styles.lessonLeft}>
                      {les.isDone ? (
                        <CheckCircle size={16} className={styles.doneIcon} />
                      ) : (
                        <PlayCircle size={16} className={styles.playIcon} />
                      )}
                      <span className={styles.lessonName}>{les.title}</span>
                      {les.isFreeSample && (
                        <Badge variant="default">Bài học thử</Badge>
                      )}
                    </div>

                    <div className={styles.lessonRight}>
                      <span className={`${styles.duration} text-tabular`}>{les.duration}</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate('/learn/lesson/4')}
                      >
                        {les.isDone ? 'Xem lại' : 'Học bài'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
