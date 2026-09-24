import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { TierBadge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Clock, BookOpen, Play, ShieldAlert, Sparkles, Timer, CheckCircle } from 'lucide-react';
import { api } from '../../../lib/api/client';
import { ExamForm, ExamMode } from '../../../types/practice';
import styles from './Practice.module.css';

export function PracticeListPage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<ExamForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<ExamForm | null>(null);
  const [isPreflightOpen, setIsPreflightOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ExamMode>('Practice');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    api.getExamForms().then(setForms);
  }, []);

  const openPreflight = (form: ExamForm, preferredMode: ExamMode = 'Practice') => {
    setSelectedForm(form);
    setSelectedMode(preferredMode);
    setIsPreflightOpen(true);
  };

  const handleStartExam = async () => {
    if (!selectedForm) return;
    setIsStarting(true);
    try {
      const session = await api.startAttempt(selectedForm.id, selectedMode);
      setIsPreflightOpen(false);
      navigate(`/learn/practice/${session.attemptId}`);
    } finally {
      setIsStarting(false);
    }
  };

  const filteredForms = forms.filter((form) => {
    if (activeCategory === 'Part5' && form.part !== 'Part5') return false;
    if (activeCategory === 'Part7' && form.part !== 'Part7') return false;
    if (activeCategory === 'FullReading' && form.part !== 'FullReading') return false;
    if (activeCategory === 'MiniTest' && form.part !== 'MiniTest') return false;
    if (tierFilter !== 'all' && form.tier !== tierFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = form.title.toLowerCase().includes(q);
      const matchDesc = form.description.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="content-container">
      {/* TOTC-inspired Hero Banner */}
      <div className={styles.heroBanner}>
        <div className={styles.heroBannerContent}>
          <span className={styles.heroPretitle}>🎯 THƯ VIỆN ĐỀ THI CHUẨN ETS</span>
          <h1 className={styles.heroTitle}>Phòng Thi & Luyện Đề Chuẩn Hóa</h1>
          <p className={styles.heroSubtitle}>
            Hệ thống bộ đề thi Full Reading, Mini Test và chuyên đề Part 1–7 với đồng hồ tính giờ server, tự động lưu bài chống rớt mạng và giải thích dẫn chứng chi tiết.
          </p>
          <div className={styles.heroStatsRow}>
            <span className={styles.heroStatChip}>📝 1,200+ Câu hỏi chuẩn hóa</span>
            <span className={styles.heroStatChip}>⏱️ Đồng hồ đếm ngược Server</span>
            <span className={styles.heroStatChip}>💡 Phân tích bẫy đề thi Part 5 & 7</span>
          </div>
        </div>
      </div>

      <div className={styles.tierDisclaimer}>
        <ShieldAlert size={18} className={styles.tierIcon} />
        <div>
          <strong>Tiêu chuẩn nội dung và Tier phát hành:</strong>
          <p>
            Các bộ đề gắn nhãn <strong>[BETA] Luyện tập Beta</strong> được sinh bởi Controlled AI Item Factory và đã vượt qua 100% các cổng kiểm định tự động (Dual-solver, Critic, Perturbation). Bộ câu hỏi <strong>[DATA VALIDATED]</strong> đã hoàn tất đối soát thống kê người học thực tế.
          </p>
        </div>
      </div>

      {/* Topic & Grammar Mini-Drills (UI-07, FR-10, FR-21) */}
      <section className={styles.sectionHeader} aria-labelledby="drills-heading">
        <h2 id="drills-heading" className={styles.sectionTitle}>
          Luyện tập Chuyên đề Cấp tốc (Mini-Drills UI-07)
        </h2>
        <p className={styles.sectionSubtitle}>
          Bài tập 5 câu trọng tâm có phản hồi tức thì và giải thích bẫy đề thi chi tiết từng câu giúp khắc phục điểm yếu nhanh chóng.
        </p>
      </section>

      <div className={styles.drillsGrid}>
        <div className={styles.drillCard}>
          <div className={styles.drillTop}>
            <div className={styles.drillMeta}>
              <span className={styles.drillTag}>PART 5 • NGỮ PHÁP</span>
              <TierBadge tier="BetaPractice" compact />
            </div>
            <h3 className={styles.drillTitle}>
              Giới từ & Rút gọn Mệnh đề phân từ
            </h3>
            <p className={styles.drillDesc}>
              5 câu hỏi phân biệt before/prior, when/while/during và mệnh đề phân từ trong ngữ cảnh văn bản công sở.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/learn/quiz/part5-grammar')}>
            Luyện tập ngay (5 câu)
          </Button>
        </div>

        <div className={styles.drillCard}>
          <div className={styles.drillTop}>
            <div className={styles.drillMeta}>
              <span className={styles.drillTag}>PART 5 • TỪ LOẠI</span>
              <TierBadge tier="DataValidatedPractice" compact />
            </div>
            <h3 className={styles.drillTitle}>
              Hòa hợp Chủ vị & Hậu tố Từ loại
            </h3>
            <p className={styles.drillDesc}>
              5 câu hỏi nhận diện cấu trúc tương quan (Neither... nor...), danh từ trừu tượng và trạng từ bổ nghĩa.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/learn/quiz/part5-wordforms')}>
            Luyện tập ngay (5 câu)
          </Button>
        </div>

        <div className={styles.drillCard}>
          <div className={styles.drillTop}>
            <div className={styles.drillMeta}>
              <span className={styles.drillTag}>PART 7 • ĐỌC HIỂU</span>
              <TierBadge tier="BetaPractice" compact />
            </div>
            <h3 className={styles.drillTitle}>
              Kỹ năng Quét thông tin E-mail & Đơn hàng
            </h3>
            <p className={styles.drillDesc}>
              Đoạn văn đơn 4 câu hỏi định vị thông tin chi tiết và suy luận mục đích người gửi thư thương mại.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/learn/quiz/part7-single-passage')}>
            Luyện tập ngay (4 câu)
          </Button>
        </div>
      </div>

      {/* Full & Part Test Forms Section */}
      <section className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          Đề thi Chuẩn hóa & Bài kiểm tra theo Part
        </h2>
        <p className={styles.sectionSubtitle}>
          Chọn bài thi phù hợp với thời gian hiện tại của bạn để đánh giá chính xác năng lực thực chiến.
        </p>
      </section>

      {/* Filter and Search Bar */}
      <div className={styles.filterBar}>
        <div className={styles.categoryTabs}>
          {[
            { key: 'all', label: `Tất cả (${forms.length})` },
            { key: 'FullReading', label: 'Full Reading (100 câu)' },
            { key: 'MiniTest', label: 'Mini Test (30 câu)' },
            { key: 'Part5', label: 'Part 5' },
            { key: 'Part7', label: 'Part 7' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveCategory(tab.key)}
              className={`${styles.categoryTab} ${activeCategory === tab.key ? styles.categoryTabActive : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.filterControls}>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Tất cả Tier</option>
            <option value="BetaPractice">Beta Practice</option>
            <option value="DataValidatedPractice">Data Validated</option>
          </select>

          <input
            type="text"
            placeholder="Tìm đề thi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Forms Grid */}
      <div className={styles.formsGrid}>
        {filteredForms.map((form) => (
          <div key={form.id} className={styles.formCard}>
            <div className={styles.cardTop}>
              <div className={styles.cardMeta}>
                <span className={styles.partTag}>{form.part}</span>
                <TierBadge tier={form.tier} compact />
              </div>
              <h3 className={styles.cardTitle}>{form.title}</h3>
              <p className={styles.cardDesc}>{form.description}</p>
            </div>

            <div className={styles.cardSpecs}>
              <span className={styles.specItem}>
                <BookOpen size={15} /> <strong className="text-tabular">{form.questionCount}</strong> câu
              </span>
              <span className={styles.specItem}>
                <Clock size={15} /> <strong className="text-tabular">{form.durationMinutes}</strong> phút
              </span>
              <span className={styles.specItem} style={{ marginLeft: 'auto' }}>
                <CheckCircle size={15} color="#10b981" /> Sẵn sàng
              </span>
            </div>

            <div className={styles.cardActions}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openPreflight(form, 'Practice')}
                leftIcon={<Sparkles size={14} />}
              >
                Luyện tập
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => openPreflight(form, 'Mock')}
                leftIcon={<Timer size={14} />}
              >
                Thi thử
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Preflight Modal (FR-21) */}
      {selectedForm && (
        <Modal
          isOpen={isPreflightOpen}
          onClose={() => setIsPreflightOpen(false)}
          title={`Chuẩn bị: ${selectedForm.title}`}
          description="Kiểm tra thông số bài thi và chế độ làm bài trước khi kích hoạt phòng thi."
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsPreflightOpen(false)}>
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                onClick={handleStartExam}
                isLoading={isStarting}
                leftIcon={<Play size={16} />}
              >
                Bắt đầu làm bài
              </Button>
            </>
          }
        >
          <div className={styles.preflightBody}>
            <div className={styles.preflightRow}>
              <span>Số câu hỏi:</span>
              <strong>{selectedForm.questionCount} câu trắc nghiệm</strong>
            </div>
            <div className={styles.preflightRow}>
              <span>Thời lượng tối đa:</span>
              <strong>{selectedForm.durationMinutes} phút (đồng bộ server deadline)</strong>
            </div>
            <div className={styles.preflightRow}>
              <span>Tier phát hành:</span>
              <TierBadge tier={selectedForm.tier} />
            </div>

            <div className={styles.modeSection}>
              <h4>Chọn chế độ làm bài:</h4>
              <div className={styles.modeOptions}>
                <label className={`${styles.modeCard} ${selectedMode === 'Practice' ? styles.activeMode : ''}`}>
                  <input
                    type="radio"
                    name="examMode"
                    value="Practice"
                    checked={selectedMode === 'Practice'}
                    onChange={() => setSelectedMode('Practice')}
                  />
                  <div>
                    <div className={styles.modeTitle}>Chế độ Luyện tập (Practice)</div>
                    <div className={styles.modeDesc}>Tự do thời gian, có thể xem lại câu đã đánh dấu, giải thích chi tiết sau khi nộp.</div>
                  </div>
                </label>

                <label className={`${styles.modeCard} ${selectedMode === 'Mock' ? styles.activeMode : ''}`}>
                  <input
                    type="radio"
                    name="examMode"
                    value="Mock"
                    checked={selectedMode === 'Mock'}
                    onChange={() => setSelectedMode('Mock')}
                  />
                  <div>
                    <div className={styles.modeTitle}>Thi thử tính giờ nghiêm ngặt (Mock Test ETS)</div>
                    <div className={styles.modeDesc}>Đồng hồ đếm ngược tự động nộp bài khi hết giờ, trải nghiệm áp lực phòng thi thực tế.</div>
                  </div>
                </label>
              </div>
            </div>

            <div className={styles.preflightAlert}>
              * Khi nhấn <strong>Bắt đầu làm bài</strong>, hệ thống sẽ kích hoạt phiên làm bài (attempt session) và bảo lưu tiến độ liên tục vào trình duyệt.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
