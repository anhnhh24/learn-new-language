import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { TierBadge } from '../../../components/ui/Badge';
import {
  PlayCircle,
  Layers,
  Bookmark,
  Clock,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import styles from './Today.module.css';
import { api } from '../../../lib/api/client';
import { FlashcardItem, MistakeRecord } from '../../../types/review';

export function TodayPage() {
  const navigate = useNavigate();
  const [dueCards, setDueCards] = useState<FlashcardItem[]>([]);
  const [openMistakes, setOpenMistakes] = useState<MistakeRecord[]>([]);

  useEffect(() => {
    api.getFlashcards().then(setDueCards);
    api.getMistakes().then((items) => setOpenMistakes(items.filter((i) => i.status === 'Open')));
  }, []);

  return (
    <div className="content-container">
      <div className={styles.todayHeader}>
        <div>
          <h1 className={styles.title}>Hôm nay</h1>
          <p className={styles.subtitle}>
            Kế hoạch học tập ngày 23/09 • Quỹ thời gian dự kiến: 30 phút
          </p>
        </div>
      </div>

      {/* Primary Next Action Banner (UI-04) */}
      <section className={styles.primaryActionCard} aria-labelledby="primary-action-heading">
        <div className={styles.actionLeft}>
          <div className={styles.actionMeta}>
            <span className={styles.actionTag}>LỘ TRÌNH 31 TUẦN · LEVEL A</span>
            <TierBadge tier="BetaPractice" />
          </div>
          <h2 id="primary-action-heading" className={styles.actionTitle}>
            Tuần 1: Bài A1 · Từ loại và vị trí trong câu
          </h2>
          <p className={styles.actionDesc}>
            Xác định danh từ, động từ, tính từ và trạng từ theo vị trí và vai trò ngữ pháp thay vì chỉ dịch nghĩa.
          </p>
          <div className={styles.actionDetails}>
            <span className={styles.detailItem}>
              <Clock size={15} /> Thời lượng 40 phút
            </span>
            <span className={styles.detailItem}>
              <BookOpen size={15} /> 4 công thức & quy trình phân tích
            </span>
          </div>
        </div>

        <div className={styles.actionRight}>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/learn/lesson/A1')}
            leftIcon={<PlayCircle size={18} />}
          >
            Học bài A1 ngay
          </Button>
        </div>
      </section>

      {/* Grid of Due Review Tasks */}
      <div className={styles.tasksGrid}>
        {/* Flashcard Due Queue */}
        <section className={styles.taskCard} aria-labelledby="flashcards-heading">
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <Layers className={styles.cardIcon} size={20} />
              <h3 id="flashcards-heading">Ôn tập Flashcard</h3>
            </div>
            <span className={`${styles.badgeCount} text-tabular`}>{dueCards.length} thẻ đến hạn</span>
          </div>
          <p className={styles.cardText}>
            Các từ vựng và cụm diễn đạt thuộc chủ đề kinh doanh và công sở cần ôn lại theo thuật toán lặp ngắt quãng.
          </p>
          <div className={styles.cardFooter}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/learn/flashcards')}
              rightIcon={<ArrowRight size={14} />}
            >
              Ôn ngay ({dueCards.length} thẻ)
            </Button>
          </div>
        </section>

        {/* Error Notebook Tasks */}
        <section className={styles.taskCard} aria-labelledby="errors-heading">
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <Bookmark className={styles.cardIcon} size={20} />
              <h3 id="errors-heading">Sổ lỗi sai</h3>
            </div>
            <span className={`${styles.badgeCount} text-tabular`}>{openMistakes.length} câu cần xem</span>
          </div>
          <p className={styles.cardText}>
            Các câu làm sai trong Part 5 & Part 7 chưa được giải quyết hoặc cần làm câu tương đương để củng cố.
          </p>
          <div className={styles.cardFooter}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/learn/errors')}
              rightIcon={<ArrowRight size={14} />}
            >
              Mở sổ lỗi sai
            </Button>
          </div>
        </section>
      </div>

      {/* Suggested Next Chapter / Course Card */}
      <section className={styles.nextCourseSection}>
        <div className={styles.nextCourseHeader}>
          <h3>Bài học kiến thức tiếp theo</h3>
          <Link to="/learn/roadmap" className={styles.viewRoadmapLink}>
            Xem toàn bộ lộ trình <ArrowRight size={14} />
          </Link>
        </div>

        <div className={styles.courseItem}>
          <div className={styles.courseIconBox}>
            <BookOpen size={24} />
          </div>
          <div className={styles.courseContent}>
            <h4>Bài 4: Mệnh đề phân từ & Rút gọn trong văn bản kinh doanh</h4>
            <p>Trang 1/5 • Kèm 3 mini-check kiểm tra giải thích ngay và audio ví dụ.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/learn/lesson/4')}
          >
            Học bài này
          </Button>
        </div>
      </section>
    </div>
  );
}
