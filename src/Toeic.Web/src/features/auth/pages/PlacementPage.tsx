import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import styles from './Placement.module.css';

interface DiagnosticQuestion {
  id: string;
  category: 'Từ vựng' | 'Ngữ pháp' | 'Đọc hiểu';
  prompt: string;
  options: { label: string; text: string }[];
}

const mockDiagnosticQuestions: DiagnosticQuestion[] = [
  {
    id: 'diag-1',
    category: 'Từ vựng',
    prompt: 'The manager gave a ------- presentation outlining our sales objectives for the upcoming quarter.',
    options: [
      { label: 'A', text: 'brief' },
      { label: 'B', text: 'briefly' },
      { label: 'C', text: 'brevity' },
      { label: 'D', text: 'briefing' },
    ],
  },
  {
    id: 'diag-2',
    category: 'Ngữ pháp',
    prompt: 'Neither the department head nor the assistants ------- available to attend the regional conference.',
    options: [
      { label: 'A', text: 'is' },
      { label: 'B', text: 'are' },
      { label: 'C', text: 'was' },
      { label: 'D', text: 'be' },
    ],
  },
  {
    id: 'diag-3',
    category: 'Đọc hiểu',
    prompt: 'According to the memo, where should the completed feedback forms be returned?',
    options: [
      { label: 'A', text: 'To the receptionist at the front desk' },
      { label: 'B', text: 'Directly to the human resources department' },
      { label: 'C', text: 'In the suggestion box located in the cafeteria' },
      { label: 'D', text: 'Via email to the project coordinator' },
    ],
  },
];

export function PlacementPage() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = mockDiagnosticQuestions[currentIndex];

  const handleSelectOption = (label: string) => {
    setAnswers({ ...answers, [currentQ.id]: label });
  };

  const handleNext = () => {
    if (currentIndex < mockDiagnosticQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (isFinished) {
    return (
      <div className={styles.resultContainer}>
        <div className={styles.resultHeader}>
          <CheckCircle2 size={48} className={styles.successIcon} />
          <h1>Kết quả định hướng học tập</h1>
          <p className={styles.resultNotice}>
            * Kết quả này chỉ mang tính định hướng ban đầu, không thay thế chứng chỉ hay band điểm chính thức.
          </p>
        </div>

        <div className={styles.breakdownCard}>
          <h3>Kết quả theo nhóm kỹ năng đo được:</h3>
          <div className={styles.skillRow}>
            <span>Từ vựng nền tảng</span>
            <Badge variant="success">Mức độ Khá</Badge>
          </div>
          <div className={styles.skillRow}>
            <span>Ngữ pháp cấu trúc</span>
            <Badge variant="warning">Cần củng cố</Badge>
          </div>
          <div className={styles.skillRow}>
            <span>Kỹ năng Đọc hiểu</span>
            <Badge variant="info">Mức độ Trung bình</Badge>
          </div>
        </div>

        <div className={styles.recommendationBox}>
          <h3>Lộ trình khởi đầu đề xuất:</h3>
          <p>
            Bạn nên bắt đầu với các bài luyện tập <strong>Part 5: Mệnh đề và Liên từ</strong>, kết hợp ôn tập thẻ từ vựng thương mại hàng ngày trên hệ thống.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/learn/today')}
          style={{ width: '100%' }}
        >
          Vào trang Hôm nay & Bắt đầu học
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button type="button" onClick={() => navigate('/learn/today')} className={styles.exitBtn}>
            <ArrowLeft size={16} /> Thoát chẩn đoán
          </button>
          <span className={styles.tag}>Chẩn đoán định hướng (24 câu)</span>
        </div>
        <div className={styles.timer}>
          <Clock size={16} />
          <span className="text-tabular">24:15 còn lại</span>
        </div>
      </header>

      <div className={styles.progressRow}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${((currentIndex + 1) / mockDiagnosticQuestions.length) * 100}%` }}
          />
        </div>
        <span className={styles.progressText}>
          Câu {currentIndex + 1} / {mockDiagnosticQuestions.length}
        </span>
      </div>

      <main className={styles.questionCard}>
        <div className={styles.questionCategory}>
          <Badge variant="primary">{currentQ.category}</Badge>
        </div>

        <p className={styles.prompt}>{currentQ.prompt}</p>

        <div className={styles.optionsList}>
          {currentQ.options.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => handleSelectOption(opt.label)}
              className={`${styles.optionBtn} ${answers[currentQ.id] === opt.label ? styles.selectedOption : ''}`}
            >
              <span className={styles.optionLabel}>{opt.label}</span>
              <span className={styles.optionText}>{opt.text}</span>
            </button>
          ))}
        </div>

        <div className={styles.navRow}>
          <Button
            variant="secondary"
            disabled={currentIndex === 0}
            onClick={handlePrev}
          >
            Câu trước
          </Button>

          <Button
            variant="primary"
            onClick={handleNext}
          >
            {currentIndex === mockDiagnosticQuestions.length - 1 ? 'Hoàn thành chẩn đoán' : 'Câu tiếp theo'}
          </Button>
        </div>
      </main>
    </div>
  );
}
