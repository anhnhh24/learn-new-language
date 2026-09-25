import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Award,
  Layers,
  Repeat,
  ShieldCheck,
  Star,
  Users,
  Play,
  Flame,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { api } from '../../../lib/api/client';
import styles from './LandingPage.module.css';

interface CoursePreview {
  id: string;
  level: string;
  levelBadge: string;
  title: string;
  description: string;
  totalLessons: number;
  durationHours: number;
  rating: number;
  enrolledStudents: number;
  tag: string;
}

const coursesData: CoursePreview[] = [
  {
    id: 'toeic-reading-grammar-foundation',
    level: 'Toàn diện',
    levelBadge: 'Toàn diện',
    title: 'TOEIC Reading: Hệ thống kiến thức chuẩn hóa từ nền tảng đến chuyên sâu',
    description: 'Bao quát trọn vẹn 40 chuyên đề ngữ pháp - từ vựng cốt lõi, 4 bài kiểm định Checkpoint chuẩn hóa và quy trình remediation bù đắp lỗ hổng kiến thức.',
    totalLessons: 40,
    durationHours: 70,
    rating: 4.9,
    enrolledStudents: 12450,
    tag: 'Flagship',
  },
  {
    id: 'toeic-module-a',
    level: 'Level A',
    levelBadge: 'Mục tiêu 450+',
    title: 'Module A: Dựng nền câu, từ loại và cấu trúc câu cốt lõi (Tuần 1–6)',
    description: 'Nhận diện 4 từ loại N/V/Adj/Adv, cấu trúc S-V-O, mạo từ và danh từ đếm được/không đếm được. Checkpoint A 25 câu.',
    totalLessons: 9,
    durationHours: 16,
    rating: 4.8,
    enrolledStudents: 8200,
    tag: 'Nền tảng',
  },
  {
    id: 'toeic-module-b',
    level: 'Level B',
    levelBadge: 'Mục tiêu 600+',
    title: 'Module B: Cấu trúc trung cấp ứng dụng & liên từ thương mại (Tuần 7–13)',
    description: 'Làm chủ các thì hoàn thành, thể bị động, câu điều kiện loại 0-1-2, mệnh đề quan hệ và liên từ kết hợp. Checkpoint B 40 câu.',
    totalLessons: 10,
    durationHours: 20,
    rating: 4.9,
    enrolledStudents: 6940,
    tag: 'Ứng dụng',
  },
  {
    id: 'toeic-module-c',
    level: 'Level C',
    levelBadge: 'Mục tiêu 750+',
    title: 'Module C: Đảo ngữ, phân từ rút gọn & cấu trúc giả định (Tuần 14–21)',
    description: 'Chuyên đề xử lý các bẫy ngữ pháp khó nhất trong Part 5 & 6, tuần 21 chuyên sâu chữa lỗi và Checkpoint C 40 câu.',
    totalLessons: 10,
    durationHours: 22,
    rating: 4.9,
    enrolledStudents: 5310,
    tag: 'Nâng cao',
  },
];

const testimonials = [
  {
    name: 'Nguyễn Minh Quân',
    role: 'Sinh viên ĐH Bách Khoa Hà Nội',
    initialScore: 480,
    targetScore: 795,
    avatar: '👨‍🎓',
    quote: 'Phương pháp lặp ngắt quãng Flashcard SRS và Sổ lỗi sai tự động giúp mình né được toàn bộ các bẫy từ loại và liên từ trong Part 5. Accuracy tăng từ 55% lên 88% chỉ sau 8 tuần ôn luyện!',
  },
  {
    name: 'Lê Thanh Thảo',
    role: 'Chuyên viên Nhân sự tại FPT Software',
    initialScore: 590,
    targetScore: 845,
    avatar: '👩‍💼',
    quote: 'Giao diện cực kỳ thông thoáng và tập trung. Tính năng phòng thi bấm giờ chuẩn xác như đi thi thật tại IIG, làm xong có bảng phân tích điểm mạnh điểm yếu từng Part rất rõ ràng.',
  },
  {
    name: 'Trần Đăng Khoa',
    role: 'Sinh viên ĐH Ngoại Thương',
    initialScore: 650,
    targetScore: 915,
    avatar: '👨‍💻',
    quote: 'Bộ giải thích đáp án Part 7 trích xuất chính xác dẫn chứng từ bài đọc, không suy diễn lung tung. Đề thi chất lượng và có cả chế độ luyện tập lẫn thi thử tính giờ chuyên nghiệp.',
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [courseCategory, setCourseCategory] = useState<string>('all');
  const isAuth = api.isAuthenticated();

  const filteredCourses = coursesData.filter((c) => {
    if (courseCategory === 'all') return true;
    if (courseCategory === 'foundation') return c.level === 'Level A';
    if (courseCategory === 'intermediate') return c.level === 'Level B';
    if (courseCategory === 'advanced') return c.level === 'Level C';
    return true;
  });

  return (
    <div className={styles.pageContainer}>
      {/* 1. TOP CURVED HERO HEADER (TOTC SIGNATURE) */}
      <section className={styles.heroSection}>
        {/* Navigation Bar inside Hero */}
        <header className={styles.heroNav}>
          <div className={styles.navContainer}>
            <Link to="/" className={styles.brand}>
              <div className={styles.brandIcon}>
                <span className={styles.brandIconText}>TOTC</span>
              </div>
              <div className={styles.brandName}>
                <span className={styles.brandTitle}>TOEIC</span>
                <span className={styles.brandSubtitle}>Master</span>
              </div>
            </Link>

            <nav className={styles.navMenu}>
              <Link to="/learn/courses" className={styles.navItem}>Khóa học</Link>
              <Link to="/learn/practice" className={styles.navItem}>Luyện đề</Link>
              <Link to="/learn/roadmap" className={styles.navItem}>Lộ trình</Link>
              <Link to="/learn/flashcards" className={styles.navItem}>Flashcards SRS</Link>
              <Link to="/learn/dashboard" className={styles.navItem}>Báo cáo</Link>
            </nav>

            <div className={styles.navAuthActions}>
              {isAuth ? (
                <button
                  type="button"
                  onClick={() => navigate('/learn/today')}
                  className={styles.primaryAuthBtn}
                >
                  Vào không gian học <ArrowRight size={16} />
                </button>
              ) : (
                <>
                  <Link to="/auth/login" className={styles.secondaryAuthBtn}>
                    Đăng nhập
                  </Link>
                  <Link to="/auth/register" className={styles.primaryAuthBtn}>
                    Đăng ký miễn phí
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className={styles.heroBody}>
          <div className={styles.heroGrid}>
            <div className={styles.heroLeft}>
              <div className={styles.heroBadge}>
                <Sparkles size={16} className={styles.heroBadgeIcon} />
                <span>NỀN TẢNG LUYỆN THI TOEIC THẾ HỆ MỚI</span>
              </div>

              <h1 className={styles.heroTitle}>
                Học TOEIC Trực Tuyến Hiện Đại & Cá Nhân Hóa Dễ Dàng Hơn
              </h1>

              <p className={styles.heroSubtitle}>
                Hệ thống kiến thức 4 phân hệ từ Level A đến D, tích hợp thuật toán Spaced Repetition (SRS) chống quên từ vựng, sổ lỗi sai tự động và ngân hàng đề thi bám sát cấu trúc ETS.
              </p>

              <div className={styles.heroCtaGroup}>
                <button
                  type="button"
                  onClick={() => navigate(isAuth ? '/learn/today' : '/auth/register')}
                  className={styles.ctaPrimaryBtn}
                >
                  {isAuth ? 'Tiếp tục bài học' : 'Bắt đầu học miễn phí'}
                  <ArrowRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/auth/placement')}
                  className={styles.ctaSecondaryBtn}
                >
                  <Play size={16} className={styles.playIcon} />
                  Test phân lớp 24 câu
                </button>
              </div>

              <div className={styles.heroTrustStat}>
                <div className={styles.avatarGroup}>
                  <span className={styles.miniAvatar}>👨‍🎓</span>
                  <span className={styles.miniAvatar}>👩‍💼</span>
                  <span className={styles.miniAvatar}>👨‍💻</span>
                  <span className={styles.miniAvatar}>👩‍🎓</span>
                </div>
                <div className={styles.trustText}>
                  <strong>25,000+ học viên</strong> đã cải thiện kỹ năng TOEIC Reading
                </div>
              </div>
            </div>

            <div className={styles.heroRight}>
              <div className={styles.heroVisualCard}>
                <div className={styles.heroGraphicWrapper}>
                  {/* Decorative Learning Center Graphic */}
                  <div className={styles.graphicPlaceholder}>
                    <div className={styles.studentBadge}>
                      <GraduationCap size={44} className={styles.capIcon} />
                      <div className={styles.studentTitle}>TOEIC 2026 Ready</div>
                      <div className={styles.studentSub}>ETS Format Listening & Reading</div>
                    </div>
                  </div>

                  {/* Floating Badges (TOTC signature) */}
                  <div className={`${styles.floatingBadge} ${styles.badgeTopLeft}`}>
                    <div className={styles.floatingIconWrap}>
                      <Award size={18} color="#f48c06" />
                    </div>
                    <div>
                      <div className={styles.floatingNum}>95%</div>
                      <div className={styles.floatingLabel}>Chuẩn xác dự đoán</div>
                    </div>
                  </div>

                  <div className={`${styles.floatingBadge} ${styles.badgeBottomRight}`}>
                    <div className={styles.floatingIconWrap}>
                      <Repeat size={18} color="#176b63" />
                    </div>
                    <div>
                      <div className={styles.floatingNum}>Thuật toán SRS</div>
                      <div className={styles.floatingLabel}>Lặp ngắt quãng chống quên</div>
                    </div>
                  </div>

                  <div className={`${styles.floatingBadge} ${styles.badgeBottomLeft}`}>
                    <div className={styles.floatingIconWrap}>
                      <Flame size={18} color="#e04f16" />
                    </div>
                    <div>
                      <div className={styles.floatingNum}>🔥 7 Ngày Streak</div>
                      <div className={styles.floatingLabel}>Hình thành thói quen</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Curved Wave Bottom SVG */}
        <div className={styles.waveDivider}>
          <svg viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none">
            <path
              d="M0,0 C320,100 880,100 1440,0 L1440,120 L0,120 Z"
              fill="#ffffff"
            />
          </svg>
        </div>
      </section>

      {/* 2. TRUSTED PARTNERS / LOGO CLOUD */}
      <section className={styles.partnersSection}>
        <div className="content-container">
          <p className={styles.partnersTitle}>
            ĐƯỢC TIN CHỌN BỞI HỌC VIÊN TỪ CÁC TRƯỜNG ĐẠI HỌC VÀ DOANH NGHIỆP HÀNG ĐẦU
          </p>
          <div className={styles.partnersList}>
            <span className={styles.partnerItem}>ĐH Bách Khoa</span>
            <span className={styles.partnerDot}>•</span>
            <span className={styles.partnerItem}>ĐH Ngoại Thương</span>
            <span className={styles.partnerDot}>•</span>
            <span className={styles.partnerItem}>ĐH Quốc Gia</span>
            <span className={styles.partnerDot}>•</span>
            <span className={styles.partnerItem}>ĐH FPT</span>
            <span className={styles.partnerDot}>•</span>
            <span className={styles.partnerItem}>Viettel Digital</span>
            <span className={styles.partnerDot}>•</span>
            <span className={styles.partnerItem}>FPT Software</span>
          </div>
        </div>
      </section>

      {/* 3. ALL-IN-ONE CLOUD PLATFORM FEATURES (TOTC SIGNATURE) */}
      <section className={styles.featuresSection}>
        <div className="content-container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionPretitle}>TẤT-CẢ-TRONG-MỘT</span>
            <h2 className={styles.sectionTitle}>
              Nền Tảng Hoàn Hảo Cho Quá Trình Chinh Phục TOEIC
            </h2>
            <p className={styles.sectionSubtitle}>
              Hệ thống được thiết kế tinh gọn, kết hợp phương pháp học khoa học và công nghệ kiểm định câu hỏi nghiêm ngặt.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={`${styles.featureIconBox} ${styles.iconBoxTeal}`}>
                <Layers size={28} />
              </div>
              <h3 className={styles.featureTitle}>Luyện Đề Chuẩn ETS & Chấm Server</h3>
              <p className={styles.featureText}>
                Phòng thi bấm giờ đồng bộ server, hỗ trợ chia đôi màn hình Part 7, tự động lưu bài chống mất kết nối và chấm điểm raw score tức thì kèm lời giải chi tiết.
              </p>
              <Link to="/learn/practice" className={styles.featureLink}>
                Khám phá kho đề thi <ChevronRight size={16} />
              </Link>
            </div>

            <div className={styles.featureCard}>
              <div className={`${styles.featureIconBox} ${styles.iconBoxOrange}`}>
                <Repeat size={28} />
              </div>
              <h3 className={styles.featureTitle}>Hệ Thống Kiến Thức & Flashcard SRS</h3>
              <p className={styles.featureText}>
                4 phân hệ kiến thức từ Level A đến D, phân bổ 40 chuyên đề cốt lõi và thuật toán lặp ngắt quãng 4 cấp độ ghi nhớ từ vựng vĩnh viễn.
              </p>
              <Link to="/learn/roadmap" className={styles.featureLink}>
                Xem Hệ thống kiến thức <ChevronRight size={16} />
              </Link>
            </div>

            <div className={styles.featureCard}>
              <div className={`${styles.featureIconBox} ${styles.iconBoxBlue}`}>
                <ShieldCheck size={28} />
              </div>
              <h3 className={styles.featureTitle}>Sổ Lỗi Sai Tự Động & Chẩn Đoán Bẫy</h3>
              <p className={styles.featureText}>
                Tự động gom mọi câu làm sai vào Sổ lỗi sai thông minh, gắn nhãn lỗi bẫy ngữ pháp và cho phép luyện tập lại ngay lập tức đến khi thành thạo.
              </p>
              <Link to="/learn/errors" className={styles.featureLink}>
                Mở sổ lỗi cá nhân <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHAT IS TOTC / CLASSROOM EXPERIENCE (TOTC SIGNATURE DUAL CARDS) */}
      <section className={styles.classroomSection}>
        <div className="content-container">
          <div className={styles.dualCardsGrid}>
            <div className={`${styles.audienceCard} ${styles.studentCard}`}>
              <span className={styles.audienceBadge}>DÀNH CHO HỌC VIÊN</span>
              <h3 className={styles.audienceTitle}>Không Gian Tự Học Tối Giản & Tập Trung</h3>
              <p className={styles.audienceDesc}>
                Giao diện không quảng cáo, tập trung 100% vào việc tiếp thu kiến thức. Đọc lý thuyết ngắn gọn, làm mini-drill củng cố, nghe phát âm IPA và ghi chú 1-click.
              </p>
              <ul className={styles.audienceBenefits}>
                <li><CheckCircle size={18} className={styles.checkIcon} /> Bài học tương tác có giải thích song ngữ</li>
                <li><CheckCircle size={18} className={styles.checkIcon} /> Gợi ý bài ôn tập thông minh mỗi sáng</li>
                <li><CheckCircle size={18} className={styles.checkIcon} /> Theo dõi điểm chẩn đoán tiến bộ theo ngày</li>
              </ul>
              <button
                type="button"
                onClick={() => navigate('/learn/today')}
                className={styles.audienceBtn}
              >
                Vào học ngay hôm nay
              </button>
            </div>

            <div className={`${styles.audienceCard} ${styles.instructorCard}`}>
              <span className={styles.audienceBadge}>KIỂM ĐỊNH NỘI DUNG</span>
              <h3 className={styles.audienceTitle}>Ngân Hàng Câu Hỏi Kiểm Định Đa Tầng</h3>
              <p className={styles.audienceDesc}>
                Mọi câu hỏi trong hệ thống đều trải qua quy trình kiểm tra cấu trúc, 2 solver độc lập, loại bỏ câu trùng lặp và đo lường độ phân biệt D-score chặt chẽ.
              </p>
              <ul className={styles.audienceBenefits}>
                <li><CheckCircle size={18} className={styles.checkIcon} /> Bằng chứng trích xuất trực tiếp từ bài đọc Part 7</li>
                <li><CheckCircle size={18} className={styles.checkIcon} /> Nhãn phân biệt Beta và DataValidated minh bạch</li>
                <li><CheckCircle size={18} className={styles.checkIcon} /> Không suy diễn bẫy vô căn cứ</li>
              </ul>
              <button
                type="button"
                onClick={() => navigate('/learn/practice')}
                className={styles.audienceBtnOutline}
              >
                Trải nghiệm ngân hàng đề
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. POPULAR COURSES SHOWCASE (TOTC STYLE GRID) */}
      <section className={styles.coursesSection}>
        <div className="content-container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionPretitle}>CHƯƠNG TRÌNH ĐÀO TẠO</span>
            <h2 className={styles.sectionTitle}>Khóa Học Nổi Bật Theo Cấp Độ Mục Tiêu</h2>
            <p className={styles.sectionSubtitle}>
              Lộ trình được thiết kế chuẩn khoa học với 4 cấp độ từ mất gốc đến chinh phục 800+ TOEIC Reading.
            </p>
          </div>

          <div className={styles.courseFilterTabs}>
            {[
              { key: 'all', label: 'Tất cả chương trình' },
              { key: 'foundation', label: 'Level A (Nền tảng 350-450)' },
              { key: 'intermediate', label: 'Level B (Trung cấp 500-650)' },
              { key: 'advanced', label: 'Level C (Nâng cao 700-800+)' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCourseCategory(tab.key)}
                className={`${styles.filterTabBtn} ${courseCategory === tab.key ? styles.activeTabBtn : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.coursesGrid}>
            {filteredCourses.map((c) => (
              <div key={c.id} className={styles.courseCard}>
                <div className={styles.courseCardHeader}>
                  <div className={styles.cardHeaderInner}>
                    <span className={styles.levelPill}>{c.level}</span>
                    <span className={styles.targetBadge}>{c.levelBadge}</span>
                  </div>
                </div>

                <div className={styles.courseCardBody}>
                  <div className={styles.courseMetaTop}>
                    <div className={styles.ratingBox}>
                      <Star size={15} fill="#f48c06" color="#f48c06" />
                      <span>{c.rating}</span>
                    </div>
                    <span className={styles.studentCount}>
                      <Users size={14} /> {c.enrolledStudents.toLocaleString('vi-VN')} học viên
                    </span>
                  </div>

                  <h3 className={styles.courseCardTitle}>{c.title}</h3>
                  <p className={styles.courseCardDesc}>{c.description}</p>

                  <div className={styles.courseSpecs}>
                    <div className={styles.specItem}>
                      <BookOpen size={16} />
                      <span>{c.totalLessons} bài học</span>
                    </div>
                    <div className={styles.specItem}>
                      <Clock size={16} />
                      <span>{c.durationHours} giờ học</span>
                    </div>
                  </div>
                </div>

                <div className={styles.courseCardFooter}>
                  <button
                    type="button"
                    onClick={() => navigate(`/learn/courses/${c.id}`)}
                    className={styles.viewCourseBtn}
                  >
                    Xem chi tiết khóa học <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.centerActionWrap}>
            <button
              type="button"
              onClick={() => navigate('/learn/courses')}
              className={styles.catalogMoreBtn}
            >
              Xem toàn bộ danh mục khóa học & bài học thử
            </button>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS / HỌC VIÊN NÓI GÌ */}
      <section className={styles.testimonialSection}>
        <div className="content-container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionPretitle}>KẾT QUẢ THỰC TẾ</span>
            <h2 className={styles.sectionTitle}>Học Viên Đạt Mục Tiêu Nói Gì Về Chúng Tôi?</h2>
            <p className={styles.sectionSubtitle}>
              Hàng nghìn học viên đã bứt phá điểm số chỉ sau 4–12 tuần luyện tập có định hướng.
            </p>
          </div>

          <div className={styles.testimonialsGrid}>
            {testimonials.map((t, idx) => (
              <div key={idx} className={styles.testimonialCard}>
                <div className={styles.scoreBadgeWrap}>
                  <div className={styles.scoreChange}>
                    <span className={styles.oldScore}>{t.initialScore}</span>
                    <ArrowRight size={14} className={styles.scoreArrow} />
                    <span className={styles.newScore}>{t.targetScore} TOEIC</span>
                  </div>
                </div>

                <p className={styles.testimonialQuote}>"{t.quote}"</p>

                <div className={styles.authorInfo}>
                  <div className={styles.authorAvatar}>{t.avatar}</div>
                  <div>
                    <h4 className={styles.authorName}>{t.name}</h4>
                    <p className={styles.authorRole}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CTA CONVERSION BANNER */}
      <section className={styles.ctaBannerSection}>
        <div className="content-container">
          <div className={styles.ctaBannerCard}>
            <div className={styles.ctaBannerContent}>
              <h2 className={styles.ctaBannerTitle}>
                Sẵn Sàng Bứt Phá Điểm TOEIC Của Bạn?
              </h2>
              <p className={styles.ctaBannerDesc}>
                Đăng ký tài khoản miễn phí ngay hôm nay để trải nghiệm bài test phân lớp 24 câu, nhận gợi ý lộ trình và bắt đầu ôn luyện bài học đầu tiên.
              </p>
              <div className={styles.ctaButtonsGroup}>
                <button
                  type="button"
                  onClick={() => navigate('/auth/register')}
                  className={styles.bannerRegisterBtn}
                >
                  Tạo tài khoản học tập ngay
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/auth/placement')}
                  className={styles.bannerTestBtn}
                >
                  Làm bài test phân lớp
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. TOTC SIGNATURE DEEP NAVY FOOTER */}
      <footer className={styles.footer}>
        <div className="content-container">
          <div className={styles.footerGrid}>
            <div className={styles.footerBrandCol}>
              <div className={styles.footerBrand}>
                <div className={styles.footerBrandIcon}>TOTC</div>
                <span className={styles.footerBrandName}>TOEIC Master</span>
              </div>
              <p className={styles.footerBrandDesc}>
                Nền tảng luyện thi TOEIC chuẩn hóa thế hệ mới. Đem đến giải pháp học thông minh với lộ trình cá nhân hóa, SRS và chất lượng câu hỏi được kiểm định độc lập.
              </p>
              <div className={styles.newsletterBox}>
                <input
                  type="email"
                  placeholder="Nhập email nhận mẹo thi..."
                  className={styles.newsletterInput}
                />
                <button type="button" className={styles.newsletterBtn}>
                  Đăng ký
                </button>
              </div>
            </div>

            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>Luyện tập & Thi thử</h4>
              <ul className={styles.footerLinks}>
                <li><Link to="/learn/practice">Phòng thi thử ETS</Link></li>
                <li><Link to="/learn/flashcards">Bộ Flashcards SRS</Link></li>
                <li><Link to="/learn/errors">Sổ tay lỗi sai</Link></li>
                <li><Link to="/learn/dashboard">Báo cáo năng lực 7 Part</Link></li>
              </ul>
            </div>

            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>Khóa học & Lộ trình</h4>
              <ul className={styles.footerLinks}>
                <li><Link to="/learn/courses">Tất cả khóa học</Link></li>
                <li><Link to="/learn/roadmap">Hệ thống kiến thức</Link></li>
                <li><Link to="/learn/courses/toeic-module-a">Level A (350-450)</Link></li>
                <li><Link to="/learn/courses/toeic-module-b">Level B (500-650)</Link></li>
              </ul>
            </div>

            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>Quy định & Hỗ trợ</h4>
              <ul className={styles.footerLinks}>
                <li><Link to="/learn/support">Trung tâm hỗ trợ</Link></li>
                <li><Link to="/learn/account">Cài đặt tài khoản</Link></li>
                <li><Link to="/learn/billing/history">Chính sách hoàn tiền 7 ngày</Link></li>
                <li><Link to="/learn/support">Báo lỗi câu hỏi</Link></li>
              </ul>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p className={styles.copyrightText}>
              © 2026 TOEIC Master Platform. Tất cả quyền được bảo lưu. Đề thi và tài liệu phục vụ mục đích nghiên cứu học thuật. TOEIC® là nhãn hiệu đã đăng ký của ETS; hệ thống này không được ủy quyền hay chứng thực bởi ETS.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
