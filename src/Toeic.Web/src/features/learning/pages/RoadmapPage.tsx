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
          {processedSections.map((section) => (
            <section key={section.sectionNumber} className={styles.sectionCard}>
              {/* Section Header */}
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={styles.sectionBadgeRow}>
                    <span className={`${styles.sectionBadge} ${getBadgeThemeClass(section.themeColor)}`}>
                      {section.badgeTitle}
                    </span>
                    <Badge variant="default">Cấp độ {section.levelCode}</Badge>
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

              {/* Topics Grid */}
              <div className={styles.topicsGrid}>
                {section.matchedTopics.map((topic) => (
                  <div key={topic.id} className={styles.topicCard}>
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
                        variant="primary"
                        size="sm"
                        className={styles.topicActionBtn}
                        onClick={() => navigate(`/learn/lesson/${topic.code}`)}
                        rightIcon={<ArrowRight size={14} />}
                      >
                        Học lý thuyết
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
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
                        <Badge variant="success">MỐC KIỂM ĐỊNH NĂNG LỰC</Badge>
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

                  <div className={styles.checkpointRight}>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => navigate(`/learn/lesson/${section.checkpointCode}`)}
                      rightIcon={<ArrowRight size={16} />}
                    >
                      Vào làm bài Checkpoint {section.levelCode}
                    </Button>
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
