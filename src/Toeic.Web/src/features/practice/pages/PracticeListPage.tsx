import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { TierBadge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Clock, BookOpen, Play, ShieldAlert } from 'lucide-react';
import { api } from '../../../lib/api/client';
import { ExamForm, ExamMode } from '../../../types/practice';
import styles from './Practice.module.css';

export function PracticeListPage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<ExamForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<ExamForm | null>(null);
  const [isPreflightOpen, setIsPreflightOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ExamMode>('Practice');
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    api.getExamForms().then(setForms);
  }, []);

  const openPreflight = (form: ExamForm) => {
    setSelectedForm(form);
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

  return (
    <div className="content-container">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Luyện đề & Phòng thi TOEIC</h1>
          <p className={styles.subtitle}>
            Chọn bài luyện tập Part 5, Part 7 hoặc đề mô phỏng kiểm tra thời gian thực.
          </p>
        </div>
      </div>

      <div className={styles.tierDisclaimer}>
        <ShieldAlert size={20} className={styles.tierIcon} />
        <div>
          <strong>Thông báo về tiêu chuẩn nội dung và Tier phát hành:</strong>
          <p>
            Các bộ đề gắn nhãn <strong>[BETA] Luyện tập Beta</strong> được sinh bởi Controlled AI Item Factory và đã vượt qua 100% các cổng kiểm định tự động (Dual-solver, Critic, Perturbation). Điểm số là điểm thô (raw score) ước lượng, không phải chứng chỉ chuẩn hóa ETS.
          </p>
        </div>
      </div>

      {/* Topic & Grammar Mini-Drills (UI-07, FR-10, FR-21) */}
      <section style={{ marginBottom: '32px' }} aria-labelledby="drills-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
          <div>
            <h2 id="drills-heading" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-ink-primary)' }}>
              Luyện tập Chuyên đề & Ngữ pháp (Mini-Drills UI-07)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-ink-secondary)', margin: 0 }}>
              Bài tập 5–10 câu có phản hồi tức thì và giải thích chi tiết từng câu để củng cố điểm yếu nhanh chóng.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>PART 5 • NGỮ PHÁP</span>
                <TierBadge tier="BetaPractice" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink-primary)', marginBottom: '6px' }}>
                Giới từ & Rút gọn Mệnh đề phân từ
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-ink-secondary)', marginBottom: '12px' }}>
                5 câu hỏi phân biệt before/prior, when/while/during và mệnh đề phân từ trong ngữ cảnh văn bản công sở.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => navigate('/learn/quiz/part5-grammar')}>
              Bắt đầu luyện tập tức thì
            </Button>
          </div>

          <div style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>PART 5 • TỪ LOẠI</span>
                <TierBadge tier="DataValidatedPractice" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink-primary)', marginBottom: '6px' }}>
                Hòa hợp Chủ vị & Hậu tố Từ loại
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-ink-secondary)', marginBottom: '12px' }}>
                5 câu hỏi nhận diện cấu trúc tương quan (Neither... nor...), danh từ trừu tượng và trạng từ bổ nghĩa.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => navigate('/learn/quiz/part5-wordforms')}>
              Bắt đầu luyện tập tức thì
            </Button>
          </div>

          <div style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>PART 7 • ĐỌC HIỂU</span>
                <TierBadge tier="BetaPractice" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink-primary)', marginBottom: '6px' }}>
                Kỹ năng Quét thông tin E-mail & Đơn hàng
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-ink-secondary)', marginBottom: '12px' }}>
                Đoạn văn đơn 4 câu hỏi định vị thông tin chi tiết và suy luận mục đích người gửi.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => navigate('/learn/quiz/part7-single-passage')}>
              Bắt đầu luyện tập tức thì
            </Button>
          </div>
        </div>
      </section>

      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-ink-primary)' }}>
          Đề thi trọn vẹn & Đề luyện từng Part (Full Simulation & Part Tests)
        </h2>
      </div>

      <div className={styles.formsGrid}>
        {forms.map((form) => (
          <div key={form.id} className={styles.formCard}>
            <div className={styles.cardTop}>
              <div className={styles.cardMeta}>
                <span className={styles.partTag}>{form.part}</span>
                <TierBadge tier={form.tier} />
              </div>
              <h2 className={styles.cardTitle}>{form.title}</h2>
              <p className={styles.cardDesc}>{form.description}</p>
            </div>

            <div className={styles.cardSpecs}>
              <span className={styles.specItem}>
                <BookOpen size={16} /> <strong className="text-tabular">{form.questionCount}</strong> câu hỏi
              </span>
              <span className={styles.specItem}>
                <Clock size={16} /> <strong className="text-tabular">{form.durationMinutes}</strong> phút
              </span>
            </div>

            <div className={styles.cardActions}>
              <Button
                variant="primary"
                size="md"
                onClick={() => openPreflight(form)}
                leftIcon={<Play size={16} />}
                style={{ width: '100%' }}
              >
                Vào làm bài
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
          description="Kiểm tra thông số bài thi và chế độ làm bài trước khi đồng hồ bắt đầu đếm."
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
                Bắt đầu tính giờ
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
                    <div className={styles.modeDesc}>Có thể dừng tạm thời, xem lại câu đã đánh dấu.</div>
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
                    <div className={styles.modeTitle}>Thi thử nghiêm ngặt (Mock)</div>
                    <div className={styles.modeDesc}>Tuân thủ tuyệt đối thời gian thi, không hỗ trợ xem gợi ý.</div>
                  </div>
                </label>
              </div>
            </div>

            <div className={styles.preflightAlert}>
              * Khi nhấn <strong>Bắt đầu tính giờ</strong>, hệ thống sẽ kích hoạt thiết bị làm bài và đồng bộ thời gian trực tiếp với máy chủ.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
