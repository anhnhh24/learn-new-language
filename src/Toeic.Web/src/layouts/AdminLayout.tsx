import { NavLink, Outlet, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Cpu, 
  AlertOctagon, 
  ArrowLeft, 
  Database,
  BookOpen,
  Layers,
  UploadCloud,
  Users,
  ClipboardList
} from 'lucide-react';
import styles from './AdminLayout.module.css';

export function AdminLayout() {
  const adminLinks = [
    { to: '/admin/quality', label: 'Cổng kiểm định chất lượng', icon: <ShieldCheck size={18} /> },
    { to: '/admin/jobs', label: 'Tác vụ AI Factory', icon: <Cpu size={18} /> },
    { to: '/admin/quarantine', label: 'Kiểm soát cách ly', icon: <AlertOctagon size={18} /> },
    { to: '/admin/blueprints', label: 'Cấu hình Blueprint', icon: <Database size={18} /> },
    { to: '/admin/curriculum', label: 'Chương trình đào tạo (CMS)', icon: <BookOpen size={18} /> },
    { to: '/admin/items', label: 'Ngân hàng câu hỏi', icon: <Layers size={18} /> },
    { to: '/admin/import', label: 'Nạp đề đa nguồn (Import)', icon: <UploadCloud size={18} /> },
    { to: '/admin/users', label: 'Người dùng & Phân quyền', icon: <Users size={18} /> },
    { to: '/admin/audit', label: 'Nhật ký kiểm toán (Audit)', icon: <ClipboardList size={18} /> },
  ];

  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.brand}>
            <span className={styles.adminTag}>OPS</span>
            <span className={styles.brandTitle}>Quality Console</span>
          </div>
          <p className={styles.versionLabel}>Controlled AI Factory v3.3</p>
        </div>

        <nav className={styles.nav}>
          {adminLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.activeNavItem : ''}`
              }
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link to="/learn/today" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>Quay lại giao diện Học viên</span>
          </Link>
        </div>
      </aside>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
