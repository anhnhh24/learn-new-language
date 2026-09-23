import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { AudioPlayer } from '../../../components/ui/AudioPlayer';
import {
  Layers,
  Eye,
  CheckCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { api } from '../../../lib/api/client';
import { FlashcardItem, FlashcardRating } from '../../../types/review';
import styles from './Flashcard.module.css';

export function FlashcardPage() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<FlashcardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    api.getFlashcards().then(setCards);
  }, []);

  const currentCard = cards[currentIndex];

  const handleRate = async (rating: FlashcardRating) => {
    if (!currentCard) return;
    await api.rateFlashcard(currentCard.id, rating);
    setReviewedCount((prev) => prev + 1);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsRevealed(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsRevealed(false);
    setIsFinished(false);
    setReviewedCount(0);
  };

  if (cards.length === 0) {
    return (
      <div className="content-container">
        <div className={styles.emptyCard}>
          <Layers size={40} className={styles.emptyIcon} />
          <h2>Không có thẻ từ vựng nào đến hạn</h2>
          <p>Tất cả các thẻ trong hàng đợi Spaced Repetition của bạn đã được ôn tập xong!</p>
          <Button variant="primary" onClick={() => navigate('/learn/today')}>
            Quay lại Hôm nay
          </Button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="content-container">
        <div className={styles.finishedCard}>
          <CheckCircle size={48} className={styles.finishedIcon} />
          <h1>Hoàn thành phiên ôn tập Flashcard</h1>
          <p>Bạn đã hoàn thành việc ôn luyện <strong>{reviewedCount} thẻ từ vựng</strong> theo thuật toán lặp ngắt quãng.</p>

          <div className={styles.finishedActions}>
            <Button variant="outline" onClick={handleRestart} leftIcon={<RotateCcw size={16} />}>
              Ôn lại phiên này
            </Button>
            <Button variant="primary" onClick={() => navigate('/learn/today')}>
              Trở về Hôm nay
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-container">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Ôn tập Flashcard (SRS)</h1>
          <p className={styles.subtitle}>
            Thuật toán Spaced Repetition giúp ghi nhớ từ vựng và ngữ cảnh lâu dài (UI-09).
          </p>
        </div>

        <div className={`${styles.counter} text-tabular`}>
          Thẻ {currentIndex + 1} / {cards.length}
        </div>
      </div>

      <div className={styles.flashcardContainer}>
        {/* Flashcard Box */}
        <div className={`${styles.cardBox} ${isRevealed ? styles.cardRevealed : ''}`}>
          <div className={styles.cardTop}>
            <Badge variant="primary">{currentCard.knowledgeTag}</Badge>
            <span className={styles.posTag}>{currentCard.partOfSpeech}</span>
          </div>

          <div className={styles.cardFront}>
            <h2 className={styles.wordTitle}>{currentCard.wordOrPhrase}</h2>

            <div className={styles.contextBox}>
              <span className={styles.contextLabel}>Ngữ cảnh câu mẫu:</span>
              <p className={styles.contextSentence}>"{currentCard.contextSentence}"</p>
            </div>

            {currentCard.audioUrl && (
              <div style={{ margin: 'var(--space-4) 0' }}>
                <AudioPlayer src={currentCard.audioUrl} />
              </div>
            )}
          </div>

          {/* Revealed Back Side */}
          {isRevealed && (
            <div className={styles.cardBack}>
              <div className={styles.divider} />
              <div className={styles.meaningBox}>
                <span className={styles.meaningLabel}>Ý nghĩa tiếng Việt:</span>
                <p className={styles.meaningText}>{currentCard.vietnameseMeaning}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className={styles.actionControls}>
          {!isRevealed ? (
            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsRevealed(true)}
              leftIcon={<Eye size={18} />}
              style={{ width: '100%', maxWidth: '320px' }}
            >
              Hiện đáp án (Reveal)
            </Button>
          ) : (
            <div className={styles.ratingRow}>
              <button
                type="button"
                onClick={() => handleRate('again')}
                className={`${styles.rateBtn} ${styles.rateAgain}`}
              >
                <strong>Quên</strong>
                <span>1 ngày</span>
              </button>

              <button
                type="button"
                onClick={() => handleRate('hard')}
                className={`${styles.rateBtn} ${styles.rateHard}`}
              >
                <strong>Khó</strong>
                <span>2 ngày</span>
              </button>

              <button
                type="button"
                onClick={() => handleRate('good')}
                className={`${styles.rateBtn} ${styles.rateGood}`}
              >
                <strong>Nhớ</strong>
                <span>4 ngày</span>
              </button>

              <button
                type="button"
                onClick={() => handleRate('easy')}
                className={`${styles.rateBtn} ${styles.rateEasy}`}
              >
                <Sparkles size={14} style={{ display: 'inline', marginRight: '2px' }} />
                <strong>Dễ</strong>
                <span>7 ngày</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
