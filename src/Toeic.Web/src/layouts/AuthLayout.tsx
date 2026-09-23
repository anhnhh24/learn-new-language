import { Outlet, Link } from 'react-router-dom';
import styles from './AuthLayout.module.css';

export function AuthLayout() {
  return (
    <div className={styles.authContainer}>
      <header className={styles.header}>
        <Link to="/auth/login" className={styles.brand}>
          <span className={styles.brandBadge}>TOEIC</span>
          <span className={styles.brandTitle}>Luyện tập</span>
        </Link>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
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
