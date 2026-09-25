import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  HelpCircle,
  ShieldCheck,
  Search,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  X,
  Layers,
  Clock,
  Target,
  Award,
  Lock,
  Unlock,
  RotateCcw,
  Info,
} from 'lucide-react';
import { Button, Badge } from '../../../components/ui';
import { toeicReadingCurriculum, checkpointCatalog } from '../../../lib/api/curriculumData';
import { KnowledgeTopic, CurriculumLevelCode } from '../../../types/curriculum';
import styles from './Roadmap.module.css';

interface SectionConfig {
  levelCode: CurriculumLevelCode;
  sectionNumber: number;
  badgeTitle: string;
  title: string;
  englishTitle: string;
  description: string;
  outcome: string;
  checkpointCode: string;
  themeColor: 'teal' | 'blue' | 'amber' | 'indigo';
}

const KNOWLEDGE_SECTIONS: SectionConfig[] = [
  {
    levelCode: 'A',
    sectionNumber: 1,
    badgeTitle: 'PHẦN 1: CẤU TRÚC NỀN TẢNG',
    title: 'Cấu trúc câu & 4 từ loại cốt lõi',
    englishTitle: 'Foundational Sentence Structures & Parts of Speech',
    description: 'Xây dựng gốc rễ ngữ pháp: nhận diện 4 từ loại chính, cấu trúc câu S–V–O, các thì cơ bản, mạo từ và danh từ đếm được/không đếm được.',
    outcome: 'Làm chủ 100% các câu hỏi nhận diện từ loại và thành phần câu căn bản trong Part 5.',
    checkpointCode: 'CHECKPOINT-A',
    themeColor: 'teal',
  },
  {
    levelCode: 'B',
    sectionNumber: 2,
    badgeTitle: 'PHẦN 2: TRUNG CẤP ỨNG DỤNG',
    title: 'Hệ thống các thì & Mệnh đề liên kết',
    englishTitle: 'Intermediate Tenses, Voice, Modals & Clauses',
    description: 'Vận dụng chuẩn xác các thì hoàn thành, thể bị động, câu điều kiện loại 0-1-2, động từ khuyết thiếu, mệnh đề quan hệ và liên từ kết hợp.',
    outcome: 'Xử lý linh hoạt các câu hỏi liên kết câu, chia động từ và bổ nghĩa trong Part 5/6.',
    checkpointCode: 'CHECKPOINT-B',
    themeColor: 'blue',
  },
  {
    levelCode: 'C',
    sectionNumber: 3,
    badgeTitle: 'PHẦN 3: NGỮ PHÁP NÂNG CAO',
    title: 'Cấu trúc nâng cao & Điểm ngữ pháp phức',
    englishTitle: 'Advanced Structures: Inversion, Participles & Subjunctive',
    description: 'Chinh phục các chủ điểm khó: đảo ngữ trạng từ phủ định, cụm phân từ rút gọn, câu giả định, cấu trúc song song và câu chẻ nhấn mạnh.',
    outcome: 'Phân tích tự tin các câu phức tạp và giải thích được bản chất ngữ pháp logic.',
    checkpointCode: 'CHECKPOINT-C',
    themeColor: 'amber',
  },
  {
    levelCode: 'D',
    sectionNumber: 4,
    badgeTitle: 'PHẦN 4: CHUYÊN SÂU PART 5/6',
    title: 'Độ chính xác chuyên sâu & Né bẫy đề thi',
    englishTitle: 'High-Precision Part 5/6 Mastery & Trap Avoidance',
    description: 'Tinh chỉnh word form khó, collocation công sở, văn phong thương mại trang trọng, liên từ chuyển tiếp đoạn Part 6 và các bẫy đề thi kinh điển.',
    outcome: 'Tối ưu độ chính xác và tốc độ làm bài Part 5/6 để bứt phá điểm Reading.',
    checkpointCode: 'CHECKPOINT-D',
    themeColor: 'indigo',
  },
];

const CATEGORY_NAMES: Record<string, string> = {
  Grammar: 'Ngữ pháp',
  Vocabulary: 'Từ vựng',
  ExamStrategy: 'Chiến thuật Part 5/6',
  ReadingStrategy: 'Chiến thuật Đọc',
};

export function RoadmapPage() {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState<CurriculumLevelCode | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // BL-02 & RISK-01: Prerequisite Enforcement & Progression State
  const [enforcePrerequisites, setEnforcePrerequisites] = useState<boolean>(() => {
    const saved = localStorage.getItem('toeic_enforce_prerequisites');
    return saved !== null ? saved === 'true' : true;
  });

  const [passedCheckpoints, setPassedCheckpoints] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('toeic_passed_checkpoints');
      return saved ? JSON.parse(saved) : ['CHECKPOINT-A'];
    } catch {
      return ['CHECKPOINT-A'];
    }
  });

  const isLevelUnlocked = (levelCode: CurriculumLevelCode): { unlocked: boolean; reason?: string } => {
    if (!enforcePrerequisites) return { unlocked: true };
    if (levelCode === 'A') return { unlocked: true };
    if (levelCode === 'B') {
      const ok = passedCheckpoints.includes('CHECKPOINT-A');
      return ok ? { unlocked: true } : { unlocked: false, reason: 'Yêu cầu đạt Checkpoint A (ngưỡng 70%) để mở khóa Phân hệ 2' };
    }
    if (levelCode === 'C') {
      const ok = passedCheckpoints.includes('CHECKPOINT-B');
      return ok ? { unlocked: true } : { unlocked: false, reason: 'Yêu cầu đạt Checkpoint B (ngưỡng 70%) để mở khóa Phân hệ 3' };
    }
    if (levelCode === 'D') {
      const ok = passedCheckpoints.includes('CHECKPOINT-C');
      return ok ? { unlocked: true } : { unlocked: false, reason: 'Yêu cầu đạt Checkpoint C (ngưỡng 75%) để mở khóa Phân hệ 4 Chuyên sâu' };
    }
    return { unlocked: true };
  };

  const toggleCheckpointPass = (cpCode: string) => {
    setPassedCheckpoints((prev) => {
      const next = prev.includes(cpCode) ? prev.filter((c) => c !== cpCode) : [...prev, cpCode];
      localStorage.setItem('toeic_passed_checkpoints', JSON.stringify(next));
      return next;
    });
  };

  const resetProgression = () => {
    const defaultState = ['CHECKPOINT-A'];
    setPassedCheckpoints(defaultState);
    localStorage.setItem('toeic_passed_checkpoints', JSON.stringify(defaultState));
  };

  // Extract all 40 topics from curriculum and sort deterministically
  const allTopics: KnowledgeTopic[] = Object.values(
    toeicReadingCurriculum.topics as Record<string, KnowledgeTopic>
  ).sort((a, b) => {
    const levelOrder: Record<string, number> = { A: 1, B: 2, C: 3, D: 4 };
    const lvlDiff = (levelOrder[a.levelCode] || 0) - (levelOrder[b.levelCode] || 0);
    if (lvlDiff !== 0) return lvlDiff;
    const numA = parseInt(a.code.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.code.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });

  // Filter sections and their matched topics
  const processedSections = KNOWLEDGE_SECTIONS.map((section) => {
    const sectionTopics = allTopics.filter((t) => t.levelCode === section.levelCode);
    const matchedTopics = sectionTopics.filter((t) => {
      const matchesCategory =
        selectedCategory === 'ALL' || t.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query === '' ||
        t.code.toLowerCase().includes(query) ||
        t.titleVi.toLowerCase().includes(query) ||
        t.titleEn.toLowerCase().includes(query) ||
        t.summary.toLowerCase().includes(query) ||
        t.primaryTag.toLowerCase().includes(query) ||
        t.coreKnowledge.some((k) => k.toLowerCase().includes(query)) ||
        t.commonTraps.some((trap) => trap.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });

    return {
      ...section,
      matchedTopics,
      totalSectionTopics: sectionTopics.length,
      checkpoint: checkpointCatalog[section.checkpointCode],
    };
  }).filter((section) => {
    if (selectedLevel !== 'ALL' && section.levelCode !== selectedLevel) {
      return false;
    }
    return section.matchedTopics.length > 0 || searchQuery.trim() === '';
  });

  const totalMatchedCount = processedSections.reduce(
    (sum, sec) => sum + sec.matchedTopics.length,
    0
  );

  const getPillThemeClass = (theme: SectionConfig['themeColor']) => {
    switch (theme) {
      case 'teal':
        return styles.codePillTeal;
      case 'blue':
        return styles.codePillBlue;
      case 'amber':
        return styles.codePillAmber;
      case 'indigo':
        return styles.codePillIndigo;
      default:
        return styles.codePillTeal;
    }
  };

  const getBadgeThemeClass = (theme: SectionConfig['themeColor']) => {
    switch (theme) {
      case 'teal':
        return styles.badgeTeal;
      case 'blue':
        return styles.badgeBlue;
      case 'amber':
        return styles.badgeAmber;
      case 'indigo':
        return styles.badgeIndigo;
      default:
        return styles.badgeTeal;
    }
  };

  return (
    <div className="content-container">
      {/* TOTC-Inspired Hero Banner */}
      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <span className={styles.heroPretitle}>BẢN ĐỒ HỆ THỐNG KIẾN THỨC</span>
          <h1 className={styles.heroTitle}>Hệ thống kiến thức TOEIC Reading chuẩn hóa</h1>
          <p className={styles.heroSubtitle}>
            Toàn bộ 40 chuyên đề ngữ pháp, từ vựng và kỹ năng Part 5/6 được cấu trúc theo 4 phân hệ kiến thức từ Nền tảng đến Chuyên sâu, tích hợp bài kiểm định Checkpoint độc lập.
          </p>

          <div className={styles.heroStatsRow}>
            <span className={styles.heroStatChip}>
              <Layers size={15} /> 4 Phân hệ kiến thức
            </span>
            <span className={styles.heroStatChip}>
              <BookOpen size={15} /> 40 Chuyên đề cốt lõi
            </span>
            <span className={styles.heroStatChip}>
              <ShieldCheck size={15} /> 4 Bài kiểm định Checkpoint
            </span>
            <span className={styles.heroStatChip}>
              <Sparkles size={15} /> 100% Kèm ví dụ & bài tập
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.searchAndTabsRow}>
          {/* Search Box */}
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm chuyên đề, cấu trúc, bẫy thi (ví dụ: bị động, mệnh đề, đảo ngữ...)..."
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={styles.clearSearchBtn}
                title="Xóa tìm kiếm"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Section Selector Tabs */}
          <div className={styles.levelTabs}>
            <button
              type="button"
              className={`${styles.levelTab} ${selectedLevel === 'ALL' ? styles.levelTabActive : ''}`}
              onClick={() => setSelectedLevel('ALL')}
            >
              Tất cả phân hệ (40)
            </button>
            <button
              type="button"
              className={`${styles.levelTab} ${selectedLevel === 'A' ? styles.levelTabActive : ''}`}
              onClick={() => setSelectedLevel('A')}
            >
              Phần 1: Nền tảng (9)
            </button>
            <button
              type="button"
              className={`${styles.levelTab} ${selectedLevel === 'B' ? styles.levelTabActive : ''}`}
              onClick={() => setSelectedLevel('B')}
            >
              Phần 2: Trung cấp (10)
            </button>
            <button
              type="button"
              className={`${styles.levelTab} ${selectedLevel === 'C' ? styles.levelTabActive : ''}`}
              onClick={() => setSelectedLevel('C')}
            >
              Phần 3: Nâng cao (10)
            </button>
            <button
              type="button"
              className={`${styles.levelTab} ${selectedLevel === 'D' ? styles.levelTabActive : ''}`}
              onClick={() => setSelectedLevel('D')}
            >
              Phần 4: Chuyên sâu (11)
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className={styles.categoryFilterRow}>
          <span className={styles.categoryLabel}>Chủ điểm:</span>
          {[
            { key: 'ALL', label: 'Tất cả chủ điểm' },
            { key: 'Grammar', label: 'Ngữ pháp (Grammar)' },
            { key: 'Vocabulary', label: 'Từ vựng & Collocation' },
            { key: 'ExamStrategy', label: 'Chiến thuật Part 5/6' },
            { key: 'ReadingStrategy', label: 'Chiến thuật Đọc hiểu' },
          ].map((cat) => (
            <button
              key={cat.key}
              type="button"
              className={`${styles.categoryChip} ${selectedCategory === cat.key ? styles.categoryChipActive : ''}`}
              onClick={() => setSelectedCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Prerequisite & Progression Gate Bar (BL-02 & RISK-01) */}
        <div className={styles.gateToggleBar}>
          <div className={styles.gateToggleLeft}>
            <Info size={14} style={{ color: '#0284c7', flexShrink: 0 }} />
            <span>
              {enforcePrerequisites
                ? 'Hệ thống đang khóa tuần tự: Phân hệ B, C, D chỉ mở khi bạn vượt qua bài thi Checkpoint của phân hệ trước.'
                : 'Chế độ xem tự do (Audit Mode): Đang mở khóa toàn bộ chuyên đề và bài kiểm định để khảo sát nhanh.'}
            </span>
          </div>

          <div className={styles.gateToggleRight}>
            <button
              type="button"
              onClick={() => {
                const next = !enforcePrerequisites;
                setEnforcePrerequisites(next);
                localStorage.setItem('toeic_enforce_prerequisites', String(next));
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: enforcePrerequisites ? '1px solid #10b981' : '1px solid #cbd5e1',
                backgroundColor: enforcePrerequisites ? '#ecfdf5' : '#ffffff',
                color: enforcePrerequisites ? '#065f46' : '#64748b',
                transition: 'all 0.2s',
              }}
              title="Bật/Tắt khóa phân hệ theo điều kiện tiên quyết"
            >
              {enforcePrerequisites ? <Lock size={12} style={{ color: '#059669' }} /> : <Unlock size={12} />}
              <span>Khóa điều kiện: {enforcePrerequisites ? 'ĐANG BẬT' : 'TỰ DO (Audit)'}</span>
            </button>

            {enforcePrerequisites && (
              <button
                type="button"
                onClick={resetProgression}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#64748b',
                }}
                title="Khôi phục trạng thái tiến độ mặc định (Level A passed)"
              >
                <RotateCcw size={11} />
                <span>Reset tiến độ</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {processedSections.length === 0 || totalMatchedCount === 0 ? (
        <div className={styles.emptyState}>
          <BookOpen size={48} color="var(--color-primary)" />
          <h2 className={styles.emptyTitle}>Không tìm thấy chuyên đề phù hợp</h2>
          <p className={styles.emptySubtitle}>
            Không có kết quả nào khớp với từ khóa "{searchQuery}". Bạn hãy thử tìm kiếm với từ khóa khác như "thì", "danh từ", "bị động", "mệnh đề"...
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSelectedLevel('ALL');
            }}
          >
            Đặt lại bộ lọc
          </Button>
        </div>
      ) : (
        /* Sections List */
        <div className={styles.sectionsList}>
          {processedSections.map((section) => {
            const levelStatus = isLevelUnlocked(section.levelCode);
            const isLevelLocked = !levelStatus.unlocked;
            const isCheckpointPassed = passedCheckpoints.includes(section.checkpointCode);

            return (
              <section
                key={section.sectionNumber}
                className={`${styles.sectionCard} ${isLevelLocked ? styles.lockedSectionCard : ''}`}
              >
                {/* Section Header */}
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionHeaderLeft}>
                    <div className={styles.sectionBadgeRow}>
                      <span className={`${styles.sectionBadge} ${getBadgeThemeClass(section.themeColor)}`}>
                        {section.badgeTitle}
                      </span>
                      <Badge variant="default">Cấp độ {section.levelCode}</Badge>
                      {isLevelLocked ? (
                        <span className={styles.topicLockBadge}>
                          <Lock size={11} /> Đang khóa
                        </span>
                      ) : isCheckpointPassed ? (
                        <Badge variant="success">✓ Đã vượt qua Checkpoint</Badge>
                      ) : (
                        <Badge variant="warning">Đang tiến hành</Badge>
                      )}
                    </div>
                    <h2 className={styles.sectionTitle}>{section.title}</h2>
                    <div className={styles.sectionEnglishTitle}>{section.englishTitle}</div>
                    <p className={styles.sectionDesc}>{section.description}</p>
                    <div className={styles.sectionOutcome}>
                      <Target size={14} />
                      <span><strong>Mục tiêu:</strong> {section.outcome}</span>
                    </div>
                  </div>

                  <div className={styles.sectionHeaderRight}>
                    <span className={styles.countChip}>
                      {section.matchedTopics.length} / {section.totalSectionTopics} chuyên đề
                    </span>
                  </div>
                </div>

                {/* Locked Banner if level is locked */}
                {isLevelLocked && (
                  <div className={styles.lockedSectionBanner}>
                    <Lock size={18} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Phân hệ đang khóa:</strong> {levelStatus.reason}
                    </div>
                  </div>
                )}

                {/* Topics Grid */}
                <div className={styles.topicsGrid}>
                  {section.matchedTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className={`${styles.topicCard} ${isLevelLocked ? styles.lockedTopicCard : ''}`}
                    >
                      {/* Top Row: Code Pill, Category, Duration */}
                      <div className={styles.topicTopRow}>
                        <div className={`${styles.codePill} ${getPillThemeClass(section.themeColor)}`}>
                          {topic.code}
                        </div>
                        <div className={styles.topicMetaBadges}>
                          <span className={styles.topicCategoryTag}>
                            {CATEGORY_NAMES[topic.category] || topic.category}
                          </span>
                          <span className={styles.topicDuration}>
                            <Clock size={12} /> {topic.estimatedMinutes} phút
                          </span>
                          {isLevelLocked && (
                            <span className={styles.topicLockBadge}>
                              <Lock size={10} /> Khóa
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Topic Title */}
                      <h3 className={styles.topicTitle}>{topic.titleVi}</h3>
                      <div className={styles.topicSubtitle}>{topic.titleEn}</div>

                      {/* Topic Summary */}
                      <p className={styles.topicSummary}>{topic.summary}</p>

                      {/* Key Knowledge Box */}
                      {topic.coreKnowledge && topic.coreKnowledge.length > 0 && (
                        <div className={styles.keyPointsBox}>
                          <div className={styles.keyPointsHeader}>
                            <Sparkles size={12} /> Trọng tâm ghi nhớ:
                          </div>
                          <ul className={styles.keyPointsList}>
                            {topic.coreKnowledge.slice(0, 2).map((item, idx) => (
                              <li key={idx} className={styles.keyPointItem}>
                                <CheckCircle2 size={12} />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Common Trap Box */}
                      {topic.commonTraps && topic.commonTraps.length > 0 && (
                        <div className={styles.trapBox}>
                          <AlertTriangle size={13} />
                          <span><strong>Bẫy Part 5:</strong> {topic.commonTraps[0]}</span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className={styles.topicActions}>
                        <Button
                          variant={isLevelLocked ? 'outline' : 'primary'}
                          size="sm"
                          disabled={isLevelLocked}
                          title={isLevelLocked ? levelStatus.reason : 'Bắt đầu học lý thuyết'}
                          className={styles.topicActionBtn}
                          onClick={() => navigate(`/learn/lesson/${topic.code}`)}
                          rightIcon={isLevelLocked ? <Lock size={14} /> : <ArrowRight size={14} />}
                        >
                          {isLevelLocked ? 'Chưa mở' : 'Học lý thuyết'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isLevelLocked}
                          title={isLevelLocked ? levelStatus.reason : 'Luyện bài tập'}
                          className={styles.topicActionBtn}
                          onClick={() => navigate(`/learn/quiz/quiz-${topic.code.toLowerCase()}`)}
                          leftIcon={<HelpCircle size={14} />}
                        >
                          Luyện bài tập
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Section Checkpoint Milestone Card */}
                {section.checkpoint && (
                  <div className={styles.checkpointCard}>
                    <div className={styles.checkpointLeft}>
                      <div className={styles.checkpointIconBox}>
                        <ShieldCheck size={28} />
                      </div>
                      <div className={styles.checkpointMeta}>
                        <div className={styles.checkpointTagRow}>
                          <Badge variant={isCheckpointPassed ? 'success' : isLevelLocked ? 'warning' : 'primary'}>
                            {isCheckpointPassed
                              ? '✓ ĐÃ HOÀN THÀNH ĐẠT CHUẨN'
                              : isLevelLocked
                              ? 'CHƯA MỞ KHÓA'
                              : 'MỐC KIỂM ĐỊNH NĂNG LỰC'}
                          </Badge>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            Đánh giá chuẩn hóa độc lập
                          </span>
                        </div>
                        <h3 className={styles.checkpointTitle}>{section.checkpoint.title}</h3>
                        <p className={styles.checkpointDesc}>{section.checkpoint.description}</p>
                        <div className={styles.checkpointSpecs}>
                          <span className={styles.checkpointSpecItem}>
                            <BookOpen size={13} /> {section.checkpoint.questionCount} câu hỏi
                          </span>
                          <span className={styles.checkpointSpecItem}>
                            <Clock size={13} /> {section.checkpoint.timeLimitMinutes} phút
                          </span>
                          <span className={styles.checkpointSpecItem}>
                            <Award size={13} /> Ngưỡng đạt: {Math.round(section.checkpoint.passRate * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={styles.checkpointRight}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}
                    >
                      <Button
                        variant={isCheckpointPassed ? 'outline' : isLevelLocked ? 'outline' : 'primary'}
                        size="md"
                        disabled={isLevelLocked}
                        title={isLevelLocked ? levelStatus.reason : undefined}
                        onClick={() => navigate(`/learn/lesson/${section.checkpointCode}`)}
                        rightIcon={isLevelLocked ? <Lock size={16} /> : <ArrowRight size={16} />}
                      >
                        {isCheckpointPassed
                          ? `Luyện lại Checkpoint ${section.levelCode}`
                          : isLevelLocked
                          ? `Khóa Checkpoint ${section.levelCode}`
                          : `Vào làm bài Checkpoint ${section.levelCode}`}
                      </Button>

                      {/* Simulation helper button for testing */}
                      <button
                        type="button"
                        onClick={() => toggleCheckpointPass(section.checkpointCode)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: '11px',
                          color: isCheckpointPassed ? '#059669' : '#64748b',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                        title="Mô phỏng đỗ/trượt checkpoint để kiểm thử luồng mở khóa phân hệ tiếp theo"
                      >
                        {isCheckpointPassed
                          ? '✓ Đã đạt (Bấm để hủy)'
                          : '⚡ Mô phỏng đã đạt Checkpoint này'}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
