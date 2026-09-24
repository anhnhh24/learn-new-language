import { Outlet, Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import styles from './AuthLayout.module.css';

export function AuthLayout() {
  const location = useLocation();
  const isLogin = location.pathname.includes('/login');
  const isRegister = location.pathname.includes('/register');

  return (
    <div className={styles.authContainer}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.backLink}>
            <ArrowLeft size={16} /> Quay lại trang chủ
          </Link>

          <Link to="/" className={styles.brand}>
            <span className={styles.brandBadge}>TOTC</span>
            <span className={styles.brandTitle}>TOEIC Master</span>
          </Link>

          <div className={styles.headerPlaceholder} />
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          {(isLogin || isRegister) && (
            <div className={styles.authTabs}>
              <Link
                to="/auth/login"
                className={`${styles.tabBtn} ${isLogin ? styles.activeTab : ''}`}
              >
                Đăng nhập
              </Link>
              <Link
                to="/auth/register"
                className={`${styles.tabBtn} ${isRegister ? styles.activeTab : ''}`}
              >
                Đăng ký
              </Link>
            </div>
          )}

          <Outlet />
        </div>
      </main>

      <footer className={styles.footer}>
        <p className={styles.footerNotice}>
          Nền tảng học và luyện thi TOEIC Listening & Reading • Bản thử nghiệm nội bộ (Pilot)
        </p>
      </footer>
    </div>
  );
}

