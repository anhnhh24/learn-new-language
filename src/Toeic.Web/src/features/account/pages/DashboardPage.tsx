import { useState } from 'react';
import { Badge } from '../../../components/ui/Badge';
import {
  BarChart2,
  CheckCircle2,
  TrendingUp,
  Clock,
  HelpCircle,
} from 'lucide-react';
import styles from './Dashboard.module.css';

export function DashboardPage() {
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');

  const knowledgeStats = [
    { tag: 'Mệnh đề quan hệ & Liên từ', accuracy: 84, totalAnswered: 45, status: 'Vững' },
    { tag: 'Dạng từ loại (Word Form)', accuracy: 78, totalAnswered: 60, status: 'Khá' },
    { tag: 'Đọc hiểu E-mail thương mại (Part 7)', accuracy: 82, totalAnswered: 38, status: 'Vững' },
    { tag: 'Suy luận ngầm (Inference Part 7)', accuracy: 62, totalAnswered: 24, status: 'Cần cải thiện' },
    { tag: 'Cụm giới từ nâng cao', accuracy: null, totalAnswered: 3, status: 'Chưa đủ dữ liệu' },
  ];

  return (
    <div className="content-container">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Thống kê học tập & Kỹ năng</h1>
          <p className={styles.subtitle}>
            Báo cáo tiến độ hoàn tất bài học, độ chính xác làm đề và chỉ báo kiến thức (UI-13).
          </p>
        </div>

        <div className={styles.timeFilter}>
          {(['7', '30', '90'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTimeRange(r)}
              className={`${styles.filterBtn} ${timeRange === r ? styles.activeFilter : ''}`}
            >
              {r} ngày qua
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Core Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricTop}>
            <span className={styles.metricLabel}>Tỷ lệ hoàn thành lộ trình</span>
            <CheckCircle2 size={18} className={styles.metricIcon} />
          </div>
          <div className={styles.metricValue}>
            <strong className="text-tabular">42%</strong>
          </div>
          <span className={styles.metricSub}>12/28 bài học bắt buộc đã nộp</span>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricTop}>
            <span className={styles.metricLabel}>Độ chính xác lần đầu (Quiz)</span>
            <TrendingUp size={18} className={styles.metricIcon} />
          </div>
          <div className={styles.metricValue}>
            <strong className="text-tabular">76.4%</strong>
          </div>
          <span className={styles.metricSub}>Tính trên các bài làm không có gợi ý</span>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricTop}>
            <span className={styles.metricLabel}>Thời gian học tích lũy</span>
            <Clock size={18} className={styles.metricIcon} />
          </div>
          <div className={styles.metricValue}>
            <strong className="text-tabular">18.5 giờ</strong>
          </div>
          <span className={styles.metricSub}>Trung bình 32 phút/ngày học</span>
        </div>
      </div>

      {/* Knowledge Indicators Table (FR-15) */}
      <section className={styles.knowledgeSection} aria-labelledby="knowledge-heading">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <BarChart2 size={20} className={styles.sectionIcon} />
            <h2 id="knowledge-heading">Chỉ báo thành thạo theo chủ điểm kiến thức</h2>
          </div>
          <div className={styles.disclaimerPill}>
            <HelpCircle size={14} />
            <span>Mục dưới 5 câu sẽ hiển thị "Chưa đủ dữ liệu" để tránh sai số</span>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.statsTable}>
            <thead>
              <tr>
                <th>Chủ điểm kiến thức</th>
                <th>Số câu đã làm</th>
                <th>Độ chính xác</th>
                <th>Đánh giá hệ thống</th>
              </tr>
            </thead>
            <tbody>
              {knowledgeStats.map((stat) => (
                <tr key={stat.tag}>
                  <td>
                    <strong>{stat.tag}</strong>
                  </td>
                  <td className="text-tabular">{stat.totalAnswered} câu</td>
                  <td>
                    {stat.accuracy !== null ? (
                      <div className={styles.accuracyCell}>
                        <div className={styles.accuracyBarTrack}>
                          <div
                            className={styles.accuracyBarFill}
                            style={{ width: `${stat.accuracy}%` }}
                          />
                        </div>
                        <span className="text-tabular">{stat.accuracy}%</span>
                      </div>
                    ) : (
                      <span className={styles.insufficientData}>Chưa đủ dữ liệu</span>
                    )}
                  </td>
                  <td>
                    {stat.status === 'Vững' && <Badge variant="success">Vững vàng</Badge>}
                    {stat.status === 'Khá' && <Badge variant="primary">Khá tốt</Badge>}
                    {stat.status === 'Cần cải thiện' && <Badge variant="warning">Cần củng cố</Badge>}
                    {stat.status === 'Chưa đủ dữ liệu' && <Badge variant="default">Cần thêm mẫu</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
