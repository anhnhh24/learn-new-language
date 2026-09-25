import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Target, Clock, Calendar, Compass, ArrowRight, ArrowLeft, Info } from 'lucide-react';
import styles from './Onboarding.module.css';

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [targetScore, setTargetScore] = useState<string>('650');
  const [minutesBudget, setMinutesBudget] = useState<number>(30);
  const [studyDays, setStudyDays] = useState<number[]>([1, 2, 3, 4, 5]);

  const targetOptions = [
    { value: '500', label: '500 - 600', desc: 'Yêu cầu chuẩn tốt nghiệp hoặc cơ bản công sở' },
    { value: '650', label: '650 - 750', desc: 'Giao tiếp tốt và đáp ứng đa số doanh nghiệp quốc tế' },
    { value: '800', label: '800 - 900+', desc: 'Thành thạo cao trong môi trường học thuật và làm việc' },
    { value: 'unknown', label: 'Chưa rõ mục tiêu', desc: 'Tập trung ôn tập theo mức độ hiện tại' },
  ];

  const timeOptions = [
    { minutes: 15, label: '15 phút/ngày', desc: 'Duy trì thói quen' },
    { minutes: 30, label: '30 phút/ngày', desc: 'Tiến độ tiêu chuẩn (Khuyến nghị)' },
    { minutes: 45, label: '45 phút/ngày', desc: 'Tăng tốc vừa phải' },
    { minutes: 60, label: '60 phút/ngày', desc: 'Luyện thi cấp tốc' },
  ];

  const daysOfWeek = [
    { id: 1, label: 'Th 2' },
    { id: 2, label: 'Th 3' },
    { id: 3, label: 'Th 4' },
    { id: 4, label: 'Th 5' },
    { id: 5, label: 'Th 6' },
    { id: 6, label: 'Th 7' },
    { id: 0, label: 'CN' },
  ];

  const toggleDay = (id: number) => {
    if (studyDays.includes(id)) {
      if (studyDays.length > 1) {
        setStudyDays(studyDays.filter((d) => d !== id));
      }
    } else {
      setStudyDays([...studyDays, id]);
    }
  };

  const handleNext = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
  };

  const handleSkipPlacement = () => {
    // Skipped placement test -> assessmentStatus = Unknown
    navigate('/learn/today');
  };

  const handleStartPlacement = () => {
    navigate('/auth/placement');
  };

  return (
    <div className={styles.container}>
      <div className={styles.stepper}>
        <div className={`${styles.stepIndicator} ${step >= 1 ? styles.activeStep : ''}`}>
          <span>1</span> Mục tiêu
        </div>
        <div className={styles.stepDivider} />
        <div className={`${styles.stepIndicator} ${step >= 2 ? styles.activeStep : ''}`}>
          <span>2</span> Quỹ thời gian
        </div>
        <div className={styles.stepDivider} />
        <div className={`${styles.stepIndicator} ${step >= 3 ? styles.activeStep : ''}`}>
          <span>3</span> Định hướng
        </div>
      </div>

      {step === 1 && (
        <div className={styles.stepContent}>
          <div className={styles.stepHeader}>
            <Target className={styles.headerIcon} size={28} />
            <h2>Mục tiêu điểm số của bạn</h2>
            <p>Chọn khoảng điểm TOEIC bạn muốn hướng tới để hệ thống gợi ý lộ trình phù hợp.</p>
          </div>

          <div className={styles.optionList}>
            {targetOptions.map((opt) => (
              <label
                key={opt.value}
                className={`${styles.radioCard} ${targetScore === opt.value ? styles.selectedCard : ''}`}
              >
                <input
                  type="radio"
                  name="targetScore"
                  value={opt.value}
                  checked={targetScore === opt.value}
                  onChange={() => setTargetScore(opt.value)}
                  className={styles.radioInput}
                />
                <div className={styles.cardContent}>
                  <div className={styles.cardTitle}>{opt.label}</div>
                  <div className={styles.cardDesc}>{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {targetScore === '800' && (
            <div
              style={{
                display: 'flex',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md, 10px)',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                fontSize: '13px',
                lineHeight: 1.5,
                color: 'var(--color-text-secondary, #475569)',
                marginTop: '12px',
              }}
            >
              <Info size={18} style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>
                  Lưu ý về Phân hệ Chuyên sâu Level D:
                </strong>
                <p style={{ margin: '4px 0 0 0' }}>
                  Bài kiểm tra chẩn đoán năng lực ban đầu sẽ xếp lớp vào các phân hệ nền tảng (Level A, B hoặc C). Phân hệ Chuyên sâu Level D (Target 800–900+) mở khóa khi bạn hoàn thành đạt chuẩn bài thi Checkpoint C để đảm bảo vững toàn bộ ngữ pháp lõi trước khi luyện bẫy đề thi thực tế.
                </p>
              </div>
            </div>
          )}

          <div className={styles.buttonRow}>
            <div />
            <Button variant="primary" onClick={handleNext} rightIcon={<ArrowRight size={16} />}>
              Tiếp tục
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={styles.stepContent}>
          <div className={styles.stepHeader}>
            <Clock className={styles.headerIcon} size={28} />
            <h2>Quỹ thời gian học tập</h2>
            <p>Đặt thời gian học mỗi ngày và những ngày bạn có thể dành thời gian luyện tập.</p>
          </div>

          <h3 className={styles.sectionHeading}>Thời gian mỗi ngày</h3>
          <div className={styles.grid2}>
            {timeOptions.map((opt) => (
              <div
                key={opt.minutes}
                onClick={() => setMinutesBudget(opt.minutes)}
                className={`${styles.selectableBox} ${minutesBudget === opt.minutes ? styles.selectedBox : ''}`}
              >
                <div className={styles.boxTitle}>{opt.label}</div>
                <div className={styles.boxDesc}>{opt.desc}</div>
              </div>
            ))}
          </div>

          <h3 className={styles.sectionHeading} style={{ marginTop: 'var(--space-6)' }}>
            <Calendar size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
            Ngày học trong tuần
          </h3>
          <div className={styles.daysSelector}>
            {daysOfWeek.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleDay(d.id)}
                className={`${styles.dayBtn} ${studyDays.includes(d.id) ? styles.selectedDayBtn : ''}`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className={styles.buttonRow}>
            <Button variant="secondary" onClick={() => setStep(1)} leftIcon={<ArrowLeft size={16} />}>
              Quay lại
            </Button>
            <Button variant="primary" onClick={handleNext} rightIcon={<ArrowRight size={16} />}>
              Tiếp tục
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className={styles.stepContent}>
          <div className={styles.stepHeader}>
            <Compass className={styles.headerIcon} size={28} />
            <h2>Bài chẩn đoán định hướng (Tùy chọn)</h2>
            <p>
              Làm bài kiểm tra ngắn 24 câu (khoảng 20–25 phút: 8 từ vựng, 8 ngữ pháp, 8 đọc) để ước lượng điểm khởi đầu.
            </p>
          </div>

          <div className={styles.placementNote}>
            <h4>Quy tắc minh bạch:</h4>
            <ul>
              <li>Bạn có thể bỏ qua bước này để vào thẳng học tự do mà không bị đánh giá thấp.</li>
              <li>Kết quả chẩn đoán chỉ đóng vai trò định hướng học tập nội bộ, không tạo chứng chỉ hay band điểm chính thức.</li>
            </ul>
          </div>

          <div className={styles.placementActions}>
            <Button variant="primary" size="lg" onClick={handleStartPlacement}>
              Bắt đầu bài chẩn đoán (24 câu)
            </Button>

            <Button variant="outline" size="md" onClick={handleSkipPlacement}>
              Bỏ qua bài kiểm tra và vào Hôm nay
            </Button>
          </div>

          <div className={styles.buttonRow} style={{ marginTop: 'var(--space-6)' }}>
            <Button variant="secondary" onClick={() => setStep(2)} leftIcon={<ArrowLeft size={16} />}>
              Quay lại
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
