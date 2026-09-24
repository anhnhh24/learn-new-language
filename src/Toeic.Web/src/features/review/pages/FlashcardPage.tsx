import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  Layers,
  Eye,
  CheckCircle,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { api } from '../../../lib/api/client';
import { FlashcardItem, FlashcardRating } from '../../../types/review';
import styles from './Flashcard.module.css';

export function FlashcardPage() {
  const navigate = useNavigate();
  const [allCards, setAllCards] = useState<FlashcardItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    api.getFlashcards().then(setAllCards);
  }, []);

  const categories = ['all', ...Array.from(new Set(allCards.map((c) => c.knowledgeTag)))];

  const filteredCards = allCards.filter((c) => {
    if (selectedCategory === 'all') return true;
    return c.knowledgeTag === selectedCategory;
  });

  const currentCard = filteredCards[currentIndex];

  const handleRate = useCallback(
    async (rating: FlashcardRating) => {
      if (!currentCard) return;
      await api.rateFlashcard(currentCard.id, rating);
      setReviewedCount((prev) => prev + 1);

      if (currentIndex < filteredCards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsRevealed(false);
      } else {
        setIsFinished(true);
      }
    },
    [currentCard, currentIndex, filteredCards.length]
  );

  const handlePlayAudio = () => {
    if (!currentCard) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentCard.wordOrPhrase);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Keyboard shortcut listener (Space to reveal, 1-4 to rate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsRevealed((prev) => !prev);
      } else if (isRevealed) {
        if (e.key === '1') handleRate('again');
        else if (e.key === '2') handleRate('hard');
        else if (e.key === '3') handleRate('good');
        else if (e.key === '4') handleRate('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRevealed, handleRate]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentIndex(0);
    setIsRevealed(false);
    setIsFinished(false);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsRevealed(false);
    setIsFinished(false);
    setReviewedCount(0);
  };

  if (allCards.length === 0) {
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
          <h1>Hoàn thành phiên ôn tập Flashcard!</h1>
          <p>
            Bạn đã ôn tập xuất sắc <strong>{reviewedCount} thẻ từ vựng</strong> theo thuật toán Spaced Repetition.
            Trí nhớ dài hạn của bạn đã được củng cố.
          </p>

          <div className={styles.finishedActions}>
            <Button variant="outline" onClick={handleRestart} leftIcon={<RotateCcw size={16} />}>
              Ôn lại danh mục này
            </Button>
            <Button variant="primary" onClick={() => navigate('/learn/today')}>
              Trở về Phòng học hôm nay
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / filteredCards.length) * 100);

  return (
    <div className="content-container">
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Phòng luyện Flashcard (SRS)</h1>
          <p className={styles.subtitle}>
            Thuật toán Spaced Repetition giúp nạp từ vựng công sở và collocations vào trí nhớ dài hạn.
          </p>
        </div>

        <div className={`${styles.counter} text-tabular`}>
          Thẻ {currentIndex + 1} / {filteredCards.length}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className={styles.categoryTabs} role="tablist" aria-label="Lọc theo chủ đề thẻ">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => handleCategoryChange(cat)}
            className={`${styles.categoryBtn} ${selectedCategory === cat ? styles.activeCategory : ''}`}
          >
            {cat === 'all' ? 'Tất cả chủ đề' : cat}
          </button>
        ))}
      </div>

      {/* Main Flashcard Container */}
      <div className={styles.flashcardContainer}>
        {/* Progress Track */}
        <div className={styles.cardProgressTrack}>
          <div className={styles.cardProgressFill} style={{ width: `${progressPercent}%` }} />
        </div>

        {/* Flashcard Box */}
        <div className={`${styles.cardBox} ${isRevealed ? styles.cardRevealed : ''}`}>
          <div className={styles.cardTop}>
            <Badge variant="primary">{currentCard.knowledgeTag}</Badge>
            <span className={styles.posTag}>{currentCard.partOfSpeech}</span>
          </div>

          {/* Front Content */}
          <div className={styles.cardFront}>
            <div className={styles.wordRow}>
              <h2 className={styles.wordTitle}>{currentCard.wordOrPhrase}</h2>
              <button
                type="button"
                onClick={handlePlayAudio}
                className={styles.soundBtn}
                title="Nghe phát âm chuẩn (US)"
                aria-label="Phát âm từ vựng"
              >
                <Volume2 size={20} />
              </button>
            </div>

            {currentCard.ipa && <div className={styles.ipaText}>{currentCard.ipa}</div>}

            <div className={styles.contextBox}>
              <span className={styles.contextLabel}>Ngữ cảnh đề thi TOEIC:</span>
              <p className={styles.contextSentence}>"{currentCard.contextSentence}"</p>
            </div>
          </div>

          {/* Revealed Back Content */}
          {isRevealed && (
            <div className={styles.cardBack}>
              <div className={styles.divider} />

              <div className={styles.meaningBox}>
                <span className={styles.meaningLabel}>Ý nghĩa tiếng Việt:</span>
                <p className={styles.meaningText}>{currentCard.vietnameseMeaning}</p>
              </div>

              <div className={styles.backDetailsGrid}>
                {currentCard.collocation && (
                  <div className={styles.detailCol}>
                    <span className={styles.detailColTitle}>Cụm từ hay gặp:</span>
                    <span className={styles.detailColVal}>{currentCard.collocation}</span>
                  </div>
                )}

                {currentCard.wordFamily && (
                  <div className={styles.detailCol}>
                    <span className={styles.detailColTitle}>Họ từ vựng:</span>
                    <span className={styles.detailColVal}>{currentCard.wordFamily}</span>
                  </div>
                )}
              </div>

              {currentCard.translation && (
                <div className={styles.translationBox}>
                  <strong>Dịch câu:</strong> "{currentCard.translation}"
                </div>
              )}
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
              style={{ width: '100%', maxWidth: '360px' }}
            >
              Hiện đáp án (Space)
            </Button>
          ) : (
            <div className={styles.ratingRow}>
              <button
                type="button"
                onClick={() => handleRate('again')}
                className={`${styles.rateBtn} ${styles.rateAgain}`}
              >
                <span className={styles.rateKeyHint}>[Phím 1]</span>
                <strong>Quên</strong>
                <span>&lt; 1 phút</span>
              </button>

              <button
                type="button"
                onClick={() => handleRate('hard')}
                className={`${styles.rateBtn} ${styles.rateHard}`}
              >
                <span className={styles.rateKeyHint}>[Phím 2]</span>
                <strong>Khó</strong>
                <span>12 giờ</span>
              </button>

              <button
                type="button"
                onClick={() => handleRate('good')}
                className={`${styles.rateBtn} ${styles.rateGood}`}
              >
                <span className={styles.rateKeyHint}>[Phím 3]</span>
                <strong>Tốt</strong>
                <span>1 ngày</span>
              </button>

              <button
                type="button"
                onClick={() => handleRate('easy')}
                className={`${styles.rateBtn} ${styles.rateEasy}`}
              >
                <span className={styles.rateKeyHint}>[Phím 4]</span>
                <strong>Dễ</strong>
                <span>4 ngày</span>
              </button>
            </div>
          )}

          <div className={styles.shortcutHint}>
            <span className={styles.shortcutKey}>Phím Space</span> lật thẻ •{' '}
            <span className={styles.shortcutKey}>Phím 1-4</span> đánh giá tốc độ nhớ
          </div>
        </div>
      </div>
    </div>
  );
}
