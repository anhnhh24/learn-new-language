import React from 'react';
import { Clock, Check, RefreshCw, AlertTriangle, LayoutGrid, WifiOff } from 'lucide-react';
import { TierBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import styles from './ExamLayout.module.css';

export interface ExamLayoutProps {
  title: string;
  tier: 'BetaPractice' | 'DataValidatedPractice' | string;
  remainingSeconds: number;
  autosaveState: 'saving' | 'saved' | 'failed' | 'offline';
  savedAt?: string;
  isOffline?: boolean;
  totalQuestions: number;
  answeredCount: number;
  onToggleQuestionMap: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
}

export function ExamLayout({
  title,
  tier,
  remainingSeconds,
  autosaveState,
  savedAt,
  isOffline = false,
  totalQuestions,
  answeredCount,
  onToggleQuestionMap,
  onSubmit,
  children,
}: ExamLayoutProps) {
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const isLowTime = remainingSeconds <= 300 && remainingSeconds > 0; // dưới 5 phút

  return (
    <div className={styles.examContainer}>
      <header className={styles.topBar}>
        <div className={styles.titleSection}>
          <h1 className={styles.examTitle}>{title}</h1>
          <TierBadge tier={tier} />
        </div>

        <div className={styles.centerSection}>
          {/* Server Sync Countdown Timer */}
          <div className={`${styles.timerBadge} ${isLowTime ? styles.lowTime : ''}`}>
            <Clock size={16} />
            <span className={`${styles.timerValue} text-tabular`}>
              {remainingSeconds <= 0 ? 'Hết giờ' : formatTime(remainingSeconds)}
            </span>
          </div>

          {/* Autosave & Connectivity State */}
          <div className={styles.saveState}>
            {isOffline ? (
              <span className={styles.offlineState} title="Mất kết nối mạng. Bài làm đang được lưu tạm cục bộ.">
                <WifiOff size={14} />
                <span>Mất mạng (Lưu draft)</span>
              </span>
            ) : autosaveState === 'saving' ? (
              <span className={styles.savingState}>
                <RefreshCw size={14} className={styles.spin} />
                <span>Đang lưu...</span>
              </span>
            ) : autosaveState === 'saved' ? (
              <span className={styles.savedState} title={savedAt ? `Đã đồng bộ lúc ${savedAt}` : 'Đã đồng bộ'}>
                <Check size={14} />
                <span>Đã lưu {savedAt && <span className="text-tabular">({savedAt})</span>}</span>
              </span>
            ) : (
              <span className={styles.failedState} title="Chưa đồng bộ được với server. Hệ thống đang tự động thử lại.">
                <AlertTriangle size={14} />
                <span>Chưa đồng bộ - Thử lại</span>
              </span>
            )}
          </div>
        </div>

        <div className={styles.actionSection}>
          <button
            type="button"
            onClick={onToggleQuestionMap}
            className={styles.mapButton}
            aria-label="Danh sách câu hỏi"
          >
            <LayoutGrid size={16} />
            <span>
              Câu hỏi <strong className="text-tabular">{answeredCount}/{totalQuestions}</strong>
            </span>
          </button>

          <Button variant="primary" size="sm" onClick={onSubmit}>
            Nộp bài
          </Button>
        </div>
      </header>

      {isOffline && (
        <div className={styles.offlineBanner} role="alert">
          <WifiOff size={16} />
          <span>
            Bạn đang làm bài khi mất kết nối. Đáp án tạm thời được giữ an toàn trên trình duyệt của bạn và sẽ tự động gửi khi có mạng trở lại trước deadline.
          </span>
        </div>
      )}

      <main className={styles.examMain}>{children}</main>
    </div>
  );
}
