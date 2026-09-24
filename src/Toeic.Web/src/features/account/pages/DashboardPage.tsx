import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import {
  BarChart2,
  CheckCircle2,
  HelpCircle,
  Award,
  AlertOctagon,
  ArrowRight,
  Flame,
  BookOpen,
} from 'lucide-react';
import styles from './Dashboard.module.css';

export function DashboardPage() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');

  const partBreakdown = [
    { part: 'Part 1: Hình ảnh', accuracy: 88, count: 25, color: '#10b981', desc: 'Nhận diện nhanh bối cảnh' },
    { part: 'Part 2: Hỏi & Đáp', accuracy: 80, count: 40, color: '#10b981', desc: 'Bắt từ khóa câu hỏi Wh-' },
    { part: 'Part 3: Hội thoại ngắn', accuracy: 72, count: 45, color: '#0ea5e9', desc: 'Đọc trước câu hỏi 1 nhịp' },
    { part: 'Part 4: Bài nói ngắn', accuracy: 70, count: 35, color: '#0ea5e9', desc: 'Suy luận người nói / người nghe' },
    { part: 'Part 5: Hoàn thành câu', accuracy: 76, count: 90, color: '#0ea5e9', desc: 'Vững từ loại, chú ý liên từ' },
    { part: 'Part 6: Điền đoạn văn', accuracy: 68, count: 30, color: '#f59e0b', desc: 'Mạch liên kết câu còn chậm' },
    { part: 'Part 7: Đọc hiểu văn bản', accuracy: 65, count: 65, color: '#ef4444', desc: 'Thiếu thời gian cho đoạn ba' },
  ];

  const weeklyActivity = [
    { day: 'T2', minutes: 45, isToday: false },
    { day: 'T3', minutes: 30, isToday: false },
    { day: 'T4', minutes: 60, isToday: false },
    { day: 'T5', minutes: 40, isToday: false },
    { day: 'T6', minutes: 35, isToday: false },
    { day: 'T7', minutes: 50, isToday: false },
    { day: 'CN', minutes: 25, isToday: true },
  ];

  const maxMinutes = Math.max(...weeklyActivity.map((d) => d.minutes));

  const knowledgeStats = [
    { tag: 'Mệnh đề quan hệ & Liên từ', accuracy: 84, totalAnswered: 45, status: 'Vững' },
    { tag: 'Dạng từ loại (Word Form)', accuracy: 78, totalAnswered: 60, status: 'Khá' },
    { tag: 'Đọc hiểu E-mail thương mại (Part 7)', accuracy: 82, totalAnswered: 38, status: 'Vững' },
    { tag: 'Suy luận ngầm (Inference Part 7)', accuracy: 62, totalAnswered: 24, status: 'Cần cải thiện' },
    { tag: 'Cụm giới từ nâng cao (prior to, notwithstanding)', accuracy: null, totalAnswered: 3, status: 'Chưa đủ dữ liệu' },
  ];

  return (
    <div className="content-container">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Báo cáo Năng lực & Dự đoán Điểm số TOEIC</h1>
          <p className={styles.subtitle}>
            Chẩn đoán năng lực học viên dựa trên bài thi, bài tập trắc nghiệm và lịch sử sổ lỗi sai theo mô hình chuẩn hóa.
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

      {/* Predicted Score Banner (PREP EdTech Style) */}
      <div className={styles.predictedBanner}>
        <div className={styles.predictedLeft}>
          <div>
            <div className={styles.predictedHeader}>
              <span className={styles.predictedLabel}>
                <Award size={14} color="#fbbf24" /> Dự đoán điểm thi ETS hiện tại
              </span>
              <span className={styles.targetBadge}>Mục tiêu: 750+ TOEIC</span>
            </div>

            <div className={styles.scoreRow}>
              <span className={styles.scoreValue}>685</span>
              <span className={styles.scoreMax}>/ 990</span>
            </div>
          </div>

          <div className={styles.subscores}>
            <div className={styles.subscoreItem}>
              <div className={styles.subscoreLabel}>Listening (Nghe hiểu)</div>
              <div className={styles.subscoreNumber}>
                360 <span style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 400 }}>/ 495 (72%)</span>
              </div>
            </div>

            <div className={styles.subscoreItem}>
              <div className={styles.subscoreLabel}>Reading (Đọc hiểu)</div>
              <div className={styles.subscoreNumber}>
                325 <span style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 400 }}>/ 495 (65%)</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.predictedRight}>
          <div className={styles.quickStatBox}>
            <span className={styles.quickStatTitle}>Tỷ lệ hoàn thành lộ trình</span>
            <div className={styles.quickStatVal}>42%</div>
            <span className={styles.quickStatSub}>12/28 bài học đã hoàn tất</span>
          </div>

          <div className={styles.quickStatBox}>
            <span className={styles.quickStatTitle}>Tốc độ giải trung bình</span>
            <div className={styles.quickStatVal}>52 giây</div>
            <span className={styles.quickStatSub}>Mục tiêu chuẩn: 50s / câu</span>
          </div>

          <div className={styles.quickStatBox}>
            <span className={styles.quickStatTitle}>Khắc phục lỗi sai</span>
            <div className={styles.quickStatVal}>80%</div>
            <span className={styles.quickStatSub}>4/5 câu sai đã làm chủ</span>
          </div>

          <div className={styles.quickStatBox}>
            <span className={styles.quickStatTitle}>Thời gian học tuần này</span>
            <div className={styles.quickStatVal}>4.8 giờ</div>
            <span className={styles.quickStatSub}>Trung bình 40p / buổi</span>
          </div>
        </div>
      </div>

      {/* Part Accuracy Breakdown Section */}
      <section className={styles.partsSection} aria-labelledby="parts-heading">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <BarChart2 size={18} className={styles.sectionIcon} />
            <h2 id="parts-heading">Độ chính xác chi tiết theo từng Part (1–7)</h2>
          </div>
          <span className="text-xs text-muted">Dựa trên 360 câu hỏi đã làm</span>
        </div>

        <div className={styles.partsGrid}>
          {partBreakdown.map((item) => (
            <div key={item.part} className={styles.partAccuracyCard}>
              <div className={styles.partCardTop}>
                <span className={styles.partName}>{item.part}</span>
                <span className={styles.partPercent} style={{ color: item.color }}>
                  {item.accuracy}%
                </span>
              </div>
              <div className={styles.partBarTrack}>
                <div
                  className={styles.partBarFill}
                  style={{ width: `${item.accuracy}%`, backgroundColor: item.color }}
                />
              </div>
              <div className={styles.partDesc}>
                <span>{item.desc}</span>
                <span className="text-tabular">{item.count} câu</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Diagnostic Insights: Strengths vs Weaknesses */}
      <div className={styles.insightsGrid}>
        <div className={styles.insightCard}>
          <div className={styles.insightHeaderGood}>
            <CheckCircle2 size={18} />
            <span>Điểm mạnh cần tiếp tục phát huy</span>
          </div>
          <div className={styles.insightList}>
            <div className={styles.insightItem}>
              <span className={styles.insightTitle}>Part 1 & 2: Nghe phản xạ câu hỏi ngắn</span>
              <p className={styles.insightText}>
                Đạt 88% ở Part 1 và 80% ở Part 2. Khả năng bắt từ khóa Wh- questions và loại suy đáp án lạc đề rất tốt.
              </p>
            </div>
            <div className={styles.insightItem}>
              <span className={styles.insightTitle}>Ngữ pháp: Liên từ & Mệnh đề quan hệ</span>
              <p className={styles.insightText}>
                Đạt 84% độ chính xác. Phân biệt chính xác cấu trúc song hành và mệnh đề rút gọn trong ngữ cảnh email.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.insightCard}>
          <div className={styles.insightHeaderWarn}>
            <AlertOctagon size={18} />
            <span>Lỗ hổng kiến thức cần khắc phục ngay</span>
          </div>
          <div className={styles.insightList}>
            <div className={styles.insightItem}>
              <span className={styles.insightTitle}>Part 7: Đọc suy luận ngầm (Inference)</span>
              <p className={styles.insightText}>
                Độ chính xác hiện tại 62%. Hay bị bẫy ở các câu hỏi "What is suggested about..." do chỉ đọc lướt một đoạn.
              </p>
              <div className={styles.insightAction}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/learn/practice')}
                  rightIcon={<ArrowRight size={14} />}
                >
                  Luyện đề Part 7
                </Button>
              </div>
            </div>

            <div className={styles.insightItem}>
              <span className={styles.insightTitle}>Part 5: Phân biệt Liên từ vs Giới từ (Despite / Although)</span>
              <p className={styles.insightText}>
                Còn 2 câu sai dạng này đang mở trong Sổ lỗi sai. Hãy vào làm lại ngay để củng cố phản xạ.
              </p>
              <div className={styles.insightAction}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/learn/mistakes')}
                  rightIcon={<ArrowRight size={14} />}
                >
                  Vào Sổ lỗi sai
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Activity Volume Chart */}
      <section className={styles.activitySection} aria-labelledby="activity-heading">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <Flame size={18} color="#f97316" />
            <h2 id="activity-heading">Thời gian học tập 7 ngày gần nhất (Phút / ngày)</h2>
          </div>
          <span className="text-xs text-muted">Chuỗi học tập hiện tại: <strong>5 ngày liên tiếp 🔥</strong></span>
        </div>

        <div className={styles.activityChart}>
          {weeklyActivity.map((d) => {
            const heightPercent = Math.round((d.minutes / maxMinutes) * 100);
            return (
              <div key={d.day} className={styles.dayColumn}>
                <div className={styles.barValue}>{d.minutes}p</div>
                <div className={styles.chartBarTrack}>
                  <div
                    className={`${styles.chartBarFill} ${d.isToday ? styles.chartBarFillToday : ''}`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <div className={styles.barLabel}>{d.day}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Knowledge Indicators Table (FR-15) */}
      <section className={styles.knowledgeSection} aria-labelledby="knowledge-heading">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <BookOpen size={18} className={styles.sectionIcon} />
            <h2 id="knowledge-heading">Chi tiết chủ điểm kiến thức chuyên sâu</h2>
          </div>
          <div className={styles.disclaimerPill}>
            <HelpCircle size={14} />
            <span>Chủ điểm dưới 5 câu sẽ hiển thị "Chưa đủ dữ liệu" để tránh sai số</span>
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
