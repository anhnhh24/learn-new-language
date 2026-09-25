import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  Layers,
  Eye,
  CheckCircle,
  RotateCcw,
  Volume2,
  Star,
  Shuffle,
  ArrowLeft,
  ArrowRight,
  Flame,
  Sparkles,
  Zap,
  Award,
  BookOpen,
} from 'lucide-react';
import { api } from '../../../lib/api/client';
import { FlashcardItem, FlashcardRating } from '../../../types/review';
import styles from './Flashcard.module.css';

interface SessionStats {
  again: number;
  hard: number;
  good: number;
  easy: number;
}

export function FlashcardPage() {
  const navigate = useNavigate();
  const [allCards, setAllCards] = useState<FlashcardItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  // Starred card IDs persisted in localStorage
  const [starredIds, setStarredIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('toeic_starred_flashcards');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Session review breakdown
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  useEffect(() => {
    api.getFlashcards().then(setAllCards);
  }, []);

  const toggleStar = (cardId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setStarredIds((prev) => {
      const next = prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId];
      localStorage.setItem('toeic_starred_flashcards', JSON.stringify(next));
      return next;
    });
  };

  const categories = useMemo(() => {
    const set = new Set(allCards.map((c) => c.knowledgeTag));
    return ['all', ...Array.from(set)];
  }, [allCards]);

  const filteredCards = useMemo(() => {
    return allCards.filter((c) => {
      const matchesCategory = selectedCategory === 'all' || c.knowledgeTag === selectedCategory;
      const matchesStar = !showStarredOnly || starredIds.includes(c.id);
      return matchesCategory && matchesStar;
    });
  }, [allCards, selectedCategory, showStarredOnly, starredIds]);

  const currentCard = filteredCards[currentIndex];

  const handlePlayAudio = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (!currentCard) return;
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentCard.wordOrPhrase);
        utterance.lang = 'en-US';
        utterance.rate = 0.88;
        setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    },
    [currentCard]
  );

  const handleRate = useCallback(
    async (rating: FlashcardRating) => {
      if (!currentCard) return;
      await api.rateFlashcard(currentCard.id, rating);

      setSessionStats((prev) => ({
        ...prev,
        [rating]: prev[rating] + 1,
      }));

      if (currentIndex < filteredCards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsRevealed(false);
      } else {
        setIsFinished(true);
      }
    },
    [currentCard, currentIndex, filteredCards.length]
  );

  const handlePrev = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
        setIsRevealed(false);
      }
    },
    [currentIndex]
  );

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (currentIndex < filteredCards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsRevealed(false);
      }
    },
    [currentIndex, filteredCards.length]
  );

  const handleShuffle = () => {
    setAllCards((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsRevealed(false);
  };

  // Keyboard shortcut listener (Space to reveal, 1-4 to rate, S to speak, Left/Right arrow)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsRevealed((prev) => !prev);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handlePlayAudio();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (isRevealed) {
        if (e.key === '1') handleRate('again');
        else if (e.key === '2') handleRate('hard');
        else if (e.key === '3') handleRate('good');
        else if (e.key === '4') handleRate('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRevealed, handleRate, handlePlayAudio, handlePrev, handleNext]);

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
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
  };

  // Get color theme for Part of Speech
  const getPosClass = (pos: string) => {
    const p = pos.toLowerCase();
    if (p.includes('noun')) return styles.posNoun;
    if (p.includes('verb')) return styles.posVerb;
    if (p.includes('adj')) return styles.posAdj;
    if (p.includes('adv')) return styles.posAdv;
    return styles.posPhrase;
  };

  // Calculate retention meter level (1-5)
  const getRetentionLevel = (card?: FlashcardItem) => {
    if (!card) return 1;
    const count = card.reviewCount || 1;
    return Math.min(5, Math.max(1, count));
  };

  const totalReviewed =
    sessionStats.again + sessionStats.hard + sessionStats.good + sessionStats.easy;

  // Empty State
  if (allCards.length === 0 || filteredCards.length === 0) {
    return (
      <div className="content-container">
        <div className={styles.celebrationCard}>
          <div className={styles.celebrationIconBox} style={{ background: '#f0fdfa', color: '#176b63' }}>
            <Layers size={36} />
          </div>
          <h2 className={styles.celebrationTitle}>
            {showStarredOnly ? 'Chưa có thẻ nào được đánh dấu sao' : 'Không có thẻ từ vựng trong danh mục này'}
          </h2>
          <p className={styles.celebrationDesc}>
            {showStarredOnly
              ? 'Nhấn vào biểu tượng ngôi sao ⭐ trên thẻ để lưu lại những từ vựng khó cần ôn tập chuyên sâu.'
              : 'Tất cả thẻ từ vựng trong danh mục đã được ôn tập xong theo lịch Spaced Repetition!'}
          </p>
          <div className={styles.celebrationActions}>
            {showStarredOnly && (
              <Button variant="outline" onClick={() => setShowStarredOnly(false)}>
                Xem tất cả thẻ
              </Button>
            )}
            <Button variant="primary" onClick={() => navigate('/learn/today')}>
              Trở về Hôm nay
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Finished Celebration State
  if (isFinished) {
    const retentionRate =
      totalReviewed > 0
        ? Math.round(((sessionStats.good + sessionStats.easy) / totalReviewed) * 100)
        : 100;

    return (
      <div className="content-container">
        <div className={styles.celebrationCard}>
          <div className={styles.celebrationIconBox}>
            <Award size={40} />
          </div>
          <h1 className={styles.celebrationTitle}>Hoàn thành phiên ôn tập Flashcard! 🎉</h1>
          <p className={styles.celebrationDesc}>
            Bạn đã ôn tập xuất sắc <strong>{totalReviewed} thẻ từ vựng</strong> theo thuật toán Spaced Repetition (SRS).
            Vùng nhớ dài hạn của bạn đã được kích hoạt thành công.
          </p>

          {/* Performance Breakdown Grid */}
          <div className={styles.performanceGrid}>
            <div className={styles.perfStatCard} style={{ borderColor: '#a7f3d0' }}>
              <div className={styles.perfStatVal} style={{ color: '#047857' }}>
                {sessionStats.easy}
              </div>
              <div className={styles.perfStatLabel}>Dễ (4 ngày)</div>
            </div>

            <div className={styles.perfStatCard} style={{ borderColor: '#bfdbfe' }}>
              <div className={styles.perfStatVal} style={{ color: '#1d4ed8' }}>
                {sessionStats.good}
              </div>
              <div className={styles.perfStatLabel}>Tốt (1 ngày)</div>
            </div>

            <div className={styles.perfStatCard} style={{ borderColor: '#fed7aa' }}>
              <div className={styles.perfStatVal} style={{ color: '#c2410c' }}>
                {sessionStats.hard}
              </div>
              <div className={styles.perfStatLabel}>Khó (12 giờ)</div>
            </div>

            <div className={styles.perfStatCard} style={{ borderColor: '#fecdd3' }}>
              <div className={styles.perfStatVal} style={{ color: '#be123c' }}>
                {sessionStats.again}
              </div>
              <div className={styles.perfStatLabel}>Quên (&lt; 1p)</div>
            </div>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: '#ecfdf5',
              color: '#065f46',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            <Sparkles size={16} color="#059669" />
            Tỉ lệ ghi nhớ phiên này: {retentionRate}%
          </div>

          <div className={styles.celebrationActions}>
            <Button variant="outline" onClick={handleRestart} leftIcon={<RotateCcw size={16} />}>
              Ôn lại danh mục này
            </Button>
            <Button variant="primary" onClick={() => navigate('/learn/today')}>
              Trở về Hôm nay
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / filteredCards.length) * 100);
  const isStarred = currentCard ? starredIds.includes(currentCard.id) : false;
  const retentionLevel = getRetentionLevel(currentCard);

  return (
    <div className="content-container">
      <div className={styles.container}>
        {/* Hero Header Banner (TOTC Style) */}
        <header className={styles.heroBanner}>
          <div className={styles.heroContent}>
            <div className={styles.heroPretitle}>
              <Zap size={14} /> Hệ thống Spaced Repetition (SRS)
            </div>
            <h1 className={styles.heroTitle}>Phòng Luyện Flashcard Từ Vựng</h1>
            <p className={styles.subtitle}>
              Ghi nhớ từ vựng công sở và collocations theo chu kỳ lặp ngắt quãng khoa học, chống đường cong quên lãng Ebbinghaus.
            </p>
          </div>

          <div className={styles.heroStatsRow}>
            <div className={styles.statPill} title="Chuỗi ngày ôn tập liên tục">
              <Flame size={15} color="#ffd166" />
              <span>Chuỗi 5 ngày</span>
            </div>
            <div className={styles.statPill} title="Tiến độ thẻ trong phiên">
              <BookOpen size={15} />
              <span>
                Thẻ {currentIndex + 1} / {filteredCards.length}
              </span>
            </div>
          </div>
        </header>

        {/* Toolbar: Category Filter & Deck Tools */}
        <div className={styles.toolbarRow}>
          <div className={styles.categoryTabs} role="tablist" aria-label="Lọc theo chủ đề thẻ">
            {categories.map((cat) => {
              const count =
                cat === 'all'
                  ? allCards.length
                  : allCards.filter((c) => c.knowledgeTag === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`${styles.categoryBtn} ${selectedCategory === cat ? styles.activeCategory : ''}`}
                >
                  <span>{cat === 'all' ? 'Tất cả chủ đề' : cat}</span>
                  <span className={styles.categoryCountBadge}>{count}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.deckTools}>
            <button
              type="button"
              onClick={() => setShowStarredOnly(!showStarredOnly)}
              className={`${styles.toolIconBtn} ${showStarredOnly ? styles.toolIconBtnActive : ''}`}
              title={showStarredOnly ? 'Đang chỉ hiện từ đánh dấu sao' : 'Lọc từ đã đánh dấu sao'}
              aria-label="Lọc từ đánh dấu sao"
            >
              <Star size={16} fill={showStarredOnly ? '#f59e0b' : 'none'} />
            </button>

            <button
              type="button"
              onClick={handleShuffle}
              className={styles.toolIconBtn}
              title="Xáo trộn ngẫu nhiên thứ tự thẻ"
              aria-label="Xáo trộn thẻ"
            >
              <Shuffle size={16} />
            </button>
          </div>
        </div>

        {/* Central Card Arena */}
        <div className={styles.cardArena}>
          {/* Progress Bar Track */}
          <div className={styles.progressContainer}>
            <div className={styles.progressMeta}>
              <span>Tiến độ học tập</span>
              <span>
                {currentIndex + 1} / {filteredCards.length} thẻ ({progressPercent}%)
              </span>
            </div>
            <div className={styles.progressBarTrack}>
              <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {/* 3D Interactive Flip Card */}
          <div className={styles.flipCardWrapper}>
            <div
              className={`${styles.flipCardInner} ${isRevealed ? styles.isFlipped : ''}`}
              onClick={() => setIsRevealed((prev) => !prev)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsRevealed((prev) => !prev);
              }}
              aria-label="Nhấn để lật thẻ flashcard"
            >
              {/* FRONT FACE */}
              <div className={styles.cardFace}>
                {/* Top Bar */}
                <div className={styles.cardTopBar}>
                  <div className={styles.cardTopLeft}>
                    <Badge variant="primary">{currentCard.knowledgeTag}</Badge>
                    <span className={`${styles.posPill} ${getPosClass(currentCard.partOfSpeech)}`}>
                      {currentCard.partOfSpeech}
                    </span>
                  </div>

                  <div className={styles.cardTopRight}>
                    <button
                      type="button"
                      onClick={(e) => toggleStar(currentCard.id, e)}
                      className={`${styles.starBtn} ${isStarred ? styles.starBtnActive : ''}`}
                      title={isStarred ? 'Bỏ đánh dấu sao' : 'Đánh dấu sao từ khó để ôn sau'}
                      aria-label="Đánh dấu sao"
                    >
                      <Star size={20} fill={isStarred ? '#f59e0b' : 'none'} />
                    </button>
                    <span className={styles.cardIndexPill}>
                      #{String(currentIndex + 1).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Center Content */}
                <div className={styles.cardCenterFront}>
                  <div className={styles.wordBlock}>
                    <h2 className={styles.wordTitle}>{currentCard.wordOrPhrase}</h2>
                    <button
                      type="button"
                      onClick={handlePlayAudio}
                      className={`${styles.audioSpeakerBtn} ${isSpeaking ? styles.speakingPulse : ''}`}
                      title="Phát âm chuẩn tiếng Anh Mỹ (US)"
                      aria-label="Phát âm từ vựng"
                    >
                      <Volume2 size={22} />
                    </button>
                  </div>

                  {currentCard.ipa && <div className={styles.ipaPill}>{currentCard.ipa}</div>}

                  {/* SRS Retention Meter */}
                  <div className={styles.retentionMeter} title={`Cấp độ ghi nhớ: ${retentionLevel}/5`}>
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`${styles.retentionDot} ${
                          lvl <= retentionLevel ? styles.retentionDotActive : ''
                        }`}
                      />
                    ))}
                    <span className={styles.retentionLabel}>Độ nhớ L{retentionLevel}</span>
                  </div>

                  {/* TOEIC Context Sentence */}
                  <div className={styles.contextSentenceBox}>
                    <div className={styles.contextHeader}>
                      <BookOpen size={12} /> Ngữ cảnh đề thi TOEIC:
                    </div>
                    <p className={styles.contextText}>"{currentCard.contextSentence}"</p>
                  </div>
                </div>

                {/* Bottom Hint */}
                <div className={styles.cardBottomHint}>
                  <RotateCcw size={12} />
                  <span>Nhấp chuột vào thẻ hoặc nhấn Space để lật xem đáp án</span>
                </div>
              </div>

              {/* BACK FACE */}
              <div className={`${styles.cardFace} ${styles.cardBackFace}`}>
                {/* Top Bar */}
                <div className={styles.cardTopBar}>
                  <div className={styles.cardTopLeft}>
                    <Badge variant="success">✓ ĐÁP ÁN & GIẢI NGHĨA</Badge>
                    <span className={`${styles.posPill} ${getPosClass(currentCard.partOfSpeech)}`}>
                      {currentCard.partOfSpeech}
                    </span>
                  </div>

                  <div className={styles.cardTopRight}>
                    <button
                      type="button"
                      onClick={(e) => toggleStar(currentCard.id, e)}
                      className={`${styles.starBtn} ${isStarred ? styles.starBtnActive : ''}`}
                      title={isStarred ? 'Bỏ đánh dấu sao' : 'Đánh dấu sao'}
                      aria-label="Đánh dấu sao"
                    >
                      <Star size={20} fill={isStarred ? '#f59e0b' : 'none'} />
                    </button>
                    <span className={styles.cardIndexPill}>
                      #{String(currentIndex + 1).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Center Content */}
                <div className={styles.cardCenterBack}>
                  {/* Vietnamese Meaning Box */}
                  <div className={styles.vietnameseMeaningCard}>
                    <div className={meaningTitleRowClass}>
                      <CheckCircle size={13} /> Định nghĩa tiếng Việt:
                    </div>
                    <p className={styles.vietnameseMeaningText}>{currentCard.vietnameseMeaning}</p>
                  </div>

                  {/* Sentence Translation */}
                  {currentCard.translation && (
                    <div className={styles.translationBox}>
                      <strong style={{ color: '#0f172a' }}>Dịch câu ví dụ:</strong> "{currentCard.translation}"
                    </div>
                  )}

                  {/* Details Grid: Collocation & Word Family */}
                  <div className={styles.detailsGrid}>
                    {currentCard.collocation && (
                      <div className={styles.detailCard}>
                        <div className={styles.detailCardHeader}>
                          <Sparkles size={11} color="#059669" /> Cụm từ hay gặp:
                        </div>
                        <div className={styles.detailCardContent}>{currentCard.collocation}</div>
                      </div>
                    )}

                    {currentCard.wordFamily && (
                      <div className={styles.detailCard}>
                        <div className={styles.detailCardHeader}>
                          <Layers size={11} color="#2563eb" /> Họ từ vựng:
                        </div>
                        <div className={styles.detailCardContent}>{currentCard.wordFamily}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Hint */}
                <div className={styles.cardBottomHint}>
                  <RotateCcw size={12} />
                  <span>Nhấp chuột vào thẻ để quay lại mặt trước</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Controls & Rating Stage */}
          <div className={styles.actionControlsContainer}>
            {!isRevealed ? (
              <div className={styles.unrevealedActionsRow}>
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className={styles.navArrowBtn}
                  title="Thẻ trước (Phím ←)"
                  aria-label="Thẻ trước"
                >
                  <ArrowLeft size={18} />
                </button>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setIsRevealed(true)}
                  leftIcon={<Eye size={18} />}
                  className={styles.revealMainBtn}
                >
                  Lật thẻ xem nghĩa (Phím Space)
                </Button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentIndex === filteredCards.length - 1}
                  className={styles.navArrowBtn}
                  title="Thẻ sau (Phím →)"
                  aria-label="Thẻ sau"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <div className={styles.ratingGrid}>
                <button
                  type="button"
                  onClick={() => handleRate('again')}
                  className={`${styles.ratingBtn} ${styles.rateAgain}`}
                  title="Lặp lại trong vài phút"
                >
                  <span className={styles.rateKeyTag}>[Phím 1]</span>
                  <div className={styles.ratingTitle}>Quên</div>
                  <span className={styles.ratingInterval}>&lt; 1 phút</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRate('hard')}
                  className={`${styles.ratingBtn} ${styles.rateHard}`}
                  title="Nhớ mang máng, cần kiểm tra sớm"
                >
                  <span className={styles.rateKeyTag}>[Phím 2]</span>
                  <div className={styles.ratingTitle}>Khó</div>
                  <span className={styles.ratingInterval}>12 giờ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRate('good')}
                  className={`${styles.ratingBtn} ${styles.rateGood}`}
                  title="Nhớ đúng theo tiêu chuẩn"
                >
                  <span className={styles.rateKeyTag}>[Phím 3]</span>
                  <div className={styles.ratingTitle}>Tốt</div>
                  <span className={styles.ratingInterval}>1 ngày</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRate('easy')}
                  className={`${styles.ratingBtn} ${styles.rateEasy}`}
                  title="Đã thuộc lòng, kéo dài chu kỳ"
                >
                  <span className={styles.rateKeyTag}>[Phím 4]</span>
                  <div className={styles.ratingTitle}>Dễ</div>
                  <span className={styles.ratingInterval}>4 ngày</span>
                </button>
              </div>
            )}

            {/* Keyboard Shortcuts Hint Bar */}
            <div className={styles.keyboardHelperBar}>
              <span className={styles.keyChip}>
                <kbd className={styles.kbdKey}>Space</kbd> Lật thẻ
              </span>
              <span className={styles.keyChip}>
                <kbd className={styles.kbdKey}>1 - 4</kbd> Đánh giá nhớ
              </span>
              <span className={styles.keyChip}>
                <kbd className={styles.kbdKey}>S</kbd> Phát âm
              </span>
              <span className={styles.keyChip}>
                <kbd className={styles.kbdKey}>← / →</kbd> Chuyển thẻ
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const meaningTitleRowClass = styles.meaningTitleRow;
