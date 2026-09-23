import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  Calendar,
  PenTool,
  BookOpen,
  Bookmark,
  Layers,
  BarChart2,
  User,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import styles from './LearnerLayout.module.css';

export function LearnerLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/learn/today', label: 'Hôm nay', icon: <Calendar size={18} /> },
    { to: '/learn/practice', label: 'Luyện đề', icon: <PenTool size={18} /> },
    { to: '/learn/errors', label: 'Sổ lỗi sai', icon: <Bookmark size={18} /> },
    { to: '/learn/flashcards', label: 'Flashcard', icon: <Layers size={18} /> },
    { to: '/learn/roadmap', label: 'Lộ trình', icon: <BookOpen size={18} /> },
    { to: '/learn/dashboard', label: 'Thống kê', icon: <BarChart2 size={18} /> },
  ];

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.leftSection}>
            <Link to="/learn/today" className={styles.brand}>
              <span className={styles.brandBadge}>TOEIC</span>
              <span className={styles.brandTitle}>Luyện tập</span>
            </Link>

            <nav className={styles.desktopNav} aria-label="Điều hướng chính">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.activeNavLink : ''}`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className={styles.rightSection}>
            <Link
              to="/admin/quality"
              className={styles.adminLink}
              title="Cổng quản trị chất lượng (Quality Ops)"
            >
              <ShieldCheck size={18} />
              <span className={styles.adminLabel}>Quality Ops</span>
            </Link>

            <Link
              to="/learn/account"
              className={styles.accountLink}
              title="Tài khoản cá nhân"
            >
              <div className={styles.avatar}>
                <User size={16} />
              </div>
              <span className={styles.accountName}>Học viên</span>
            </Link>

            <button
              type="button"
              className={styles.mobileMenuButton}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav className={styles.mobileNav} aria-label="Điều hướng di động">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `${styles.mobileNavLink} ${isActive ? styles.activeMobileNavLink : ''}`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
            <div className={styles.mobileDivider} />
            <Link
              to="/admin/quality"
              onClick={() => setMobileMenuOpen(false)}
              className={styles.mobileNavLink}
            >
              <ShieldCheck size={18} />
              <span>Quản trị Chất lượng (Quality Ops)</span>
            </Link>
            <Link
              to="/learn/account"
              onClick={() => setMobileMenuOpen(false)}
              className={styles.mobileNavLink}
            >
              <User size={18} />
              <span>Thiết lập tài khoản & Quyền riêng tư</span>
            </Link>
          </nav>
        )}
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className="content-container">
          <div className={styles.footerInner}>
            <p className={styles.footerText}>
              Nền tảng tự luyện TOEIC Listening & Reading • Nội dung gốc kiểm soát bằng Controlled AI Item Factory.
            </p>
            <p className={styles.footerDisclaimer}>
              * Hệ thống phát hành các tier BetaPractice và DataValidatedPractice. Kết quả điểm thi tại hệ thống là ước lượng luyện tập nội bộ, không thay thế chứng chỉ TOEIC chính thức của ETS.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
