import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardList, Database, Eye, EyeOff, Layers, LayoutDashboard, LifeBuoy, LogOut, ShieldCheck, Users, Workflow } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AdminApiError, adminError, adminRequest, adminSession } from '../../lib/api/admin';
import { SampleAccountsSelector } from '../../components/auth/SampleAccountsSelector';
import { SampleAccount } from '../../lib/sampleAccounts';
import s from './AdminConsole.module.css';

interface Identity { userId: string; displayName: string; role: string }
export function AdminLoginPage() {
  const navigate = useNavigate(); const location = useLocation();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const lock = useRef(false);
  async function login(event: FormEvent) {
    event.preventDefault(); if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try {
      const result = await adminRequest<{ accessToken: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      adminSession.save(result.accessToken); setPassword('');
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from?.startsWith('/admin/') && !from.startsWith('/admin/login') ? from : '/admin/overview', { replace: true });
    } catch (e) { setError(adminError(e)); } finally { setBusy(false); lock.current = false; }
  }

  const handleFill = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError('');
  };

  const handleDirect = async (acc: SampleAccount) => {
    setEmail(acc.email);
    setPassword(acc.password);
    adminSession.save(`adm_demo_${acc.id}`);
    const from = (location.state as { from?: string } | null)?.from;
    navigate(from?.startsWith('/admin/') && !from.startsWith('/admin/login') ? from : acc.portalUrl, { replace: true });
  };

  return <main className={s.login}><section className={s.intro}><div className={s.brand}><ShieldCheck size={24} /><span>TOEIC · Quản trị</span></div><div><h1>Chăm chút từng phần của trải nghiệm học.</h1><p>Không gian làm việc dành cho đội ngũ quản lý nội dung, hỗ trợ học viên và theo dõi vận hành.</p></div><footer><p>Tài khoản quản trị được cấp bởi người phụ trách hệ thống.</p></footer></section>
    <section className={s.loginSide}><form className={s.loginForm} onSubmit={login}><span className={s.eyebrow}>Cổng quản trị</span><h2>Đăng nhập</h2><p className={s.muted}>Sử dụng tài khoản đã được cấp quyền quản trị.</p>{error && <div className={s.error} role="alert">{error}</div>}
      <label className={s.field}>Email<input className={s.input} type="email" autoComplete="username" required maxLength={254} disabled={busy} value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label className={s.field}>Mật khẩu<span className={s.password}><input className={s.input} type={visible ? 'text' : 'password'} autoComplete="current-password" required maxLength={1024} disabled={busy} value={password} onChange={e => setPassword(e.target.value)} /><Button type="button" variant="text" disabled={busy} aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={visible} onClick={() => setVisible(v => !v)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</Button></span></label>
      <Button type="submit" isLoading={busy} style={{ width: '100%' }}>Đăng nhập quản trị</Button><div className={s.actions}><Link to="/auth/forgot-password">Quên mật khẩu?</Link></div><p className={s.muted}>Bạn là học viên? <Link to="/auth/login">Đến trang đăng nhập học viên</Link></p></form>
      <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}>
        <SampleAccountsSelector onFillCredentials={handleFill} onDirectLogin={handleDirect} defaultScope="admin" />
      </div>
    </section></main>;
}

export function AdminWorkspace() {
  const location = useLocation(); const navigate = useNavigate(); const [identity, setIdentity] = useState<Identity | null>(null);
  const [checking, setChecking] = useState(true); const [error, setError] = useState(''); const [retry, setRetry] = useState(0); const [unauthorized, setUnauthorized] = useState(false); const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const abort = new AbortController(); setChecking(true); setError(''); setUnauthorized(false);
    if (!adminSession.token()) { setUnauthorized(true); setChecking(false); return; }
    adminRequest<Identity>('/auth/me', { signal: abort.signal }).then(value => { if (!abort.signal.aborted) setIdentity(value); })
      .catch(e => { if (!abort.signal.aborted) { if (e instanceof AdminApiError && (e.status === 401 || e.status === 403)) setUnauthorized(true); else setError(adminError(e)); } })
      .finally(() => { if (!abort.signal.aborted) setChecking(false); });
    return () => abort.abort();
  }, [retry]);
  useEffect(() => { const expired = () => { setIdentity(null); setUnauthorized(true); }; window.addEventListener('toeic-admin-session-expired', expired); return () => window.removeEventListener('toeic-admin-session-expired', expired); }, []);
  async function logout() { setLeaving(true); setError(''); try { await adminRequest('/auth/logout', { method: 'POST' }); adminSession.clear(); navigate('/admin/login', { replace: true }); } catch (e) { setError(adminError(e)); } finally { setLeaving(false); } }
  if (unauthorized) return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />;
  if (checking) return <div className={s.loading} role="status">Đang xác minh quyền quản trị…</div>;
  if (!identity) return <div className={s.loading}><p className={s.error} role="alert">{error}</p><Button onClick={() => setRetry(v => v + 1)}>Thử lại</Button> <Link to="/admin/login">Đăng nhập lại</Link></div>;
  const nav = [
    { path: 'overview', name: 'Tổng quan', icon: LayoutDashboard }, { path: 'curriculum', name: 'Khóa học', icon: BookOpen },
    { path: 'question-drafts', name: 'Biên tập Part 5', icon: BookOpen }, { path: 'part6-drafts', name: 'Biên tập Part 6', icon: BookOpen }, { path: 'part7-drafts', name: 'Biên tập Part 7', icon: BookOpen }, { path: 'exams', name: 'Đề luyện tập', icon: ClipboardList }, { path: 'items', name: 'Ngân hàng câu hỏi', icon: Layers }, { path: 'blueprints', name: 'Blueprint', icon: Database },
    { path: 'jobs', name: 'Tác vụ nội dung', icon: Workflow }, { path: 'quarantine', name: 'Nội dung cách ly', icon: ShieldCheck },
    { path: 'users', name: 'Người dùng', icon: Users }, { path: 'support', name: 'Hỗ trợ học viên', icon: LifeBuoy }, { path: 'audit', name: 'Nhật ký hoạt động', icon: ClipboardList },
  ];
  return <div className={s.workspace}><aside className={s.sidebar}><div className={s.brand}><ShieldCheck size={25} /><span>TOEIC Console</span></div><nav className={s.nav} aria-label="Quản trị"><p className={s.navLabel}>Không gian làm việc</p>{nav.map(n => <NavLink key={n.path} to={`/admin/${n.path}`} className={({ isActive }) => isActive ? s.active : undefined}><n.icon size={18} /><span>{n.name}</span></NavLink>)}</nav><div className={s.footer}><Link to="/">Về trang chủ</Link><p className={s.muted}>Cổng quản trị nội bộ</p></div></aside>
    <div><header className={s.topbar}><span className={s.muted}>Quản trị hệ thống</span><div className={s.actions} style={{ margin: 0 }}><span>{identity.displayName}</span><span className={s.badge}>ADMIN</span><Button variant="text" disabled={leaving} onClick={logout} leftIcon={<LogOut size={16} />}>Đăng xuất</Button></div></header><div className={s.content}>{error && <p className={s.error} role="alert">{error}</p>}<Outlet /></div></div></div>;
}

interface Overview { activeLearners: number; publishedCourses: number; publishedLessons: number; openTickets: number; activeForms: number; quarantinedSources: number }
export function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null); const [error, setError] = useState(''); const [retry, setRetry] = useState(0);
  useEffect(() => { const abort = new AbortController(); setError(''); setData(null); adminRequest<Overview>('/overview', { signal: abort.signal }).then(setData).catch(e => { if (!abort.signal.aborted) setError(adminError(e)); }); return () => abort.abort(); }, [retry]);
  return <><header className={s.heading}><div><h1>Tổng quan vận hành</h1><p className={s.muted}>Tình trạng nội dung và các yêu cầu cần theo dõi.</p></div><Button variant="outline" onClick={() => setRetry(v => v + 1)}>Làm mới</Button></header>{error && <div className={s.error} role="alert">{error}</div>}{!data && !error && <p role="status">Đang tải tổng quan…</p>}{data && <div className={s.grid}>{[
    ['Tài khoản đang hoạt động', data.activeLearners, 'users'], ['Khóa học đã xuất bản', data.publishedCourses, 'curriculum'], ['Bài học đã xuất bản', data.publishedLessons, 'curriculum'],
    ['Yêu cầu đang mở', data.openTickets, 'support'], ['Bộ đề đang hoạt động', data.activeForms, 'exams'], ['Nguồn câu hỏi cách ly', data.quarantinedSources, 'quarantine'],
  ].map(([label, value, path]) => <article className={s.metric} key={label}><span className={s.muted}>{label}</span><strong>{value}</strong><Link to={`/admin/${path}`}>Xem danh sách →</Link></article>)}</div>}<section className={s.panel}><h2>Trạng thái triển khai</h2><p className={s.muted}>Các danh sách hiển thị dữ liệu đã lưu trong hệ thống. Đã có quản lý và xuất bản đề luyện tập từ nguồn đã kiểm định. Đã có biên tập và nhập JSON cho bản nháp Part 5. Cấp quyền qua giao diện chưa mở.</p><p className={s.muted}>Thanh toán đang chờ tích hợp.</p></section></>;
}

type Row = { id: string; title?: string; displayName?: string; state?: string; status?: string; detail?: string; description?: string; resolutionReason?: string; emailVerified?: boolean; createdAt?: string; occurredAt?: string; action?: string; actorType?: string; targetType?: string; targetId?: string };
const titles: Record<string, [string, string]> = {
  users: ['Người dùng', 'Danh sách tài khoản và trạng thái xác minh.'], support: ['Hỗ trợ học viên', 'Theo dõi yêu cầu đã được học viên gửi vào hệ thống.'], audit: ['Nhật ký hoạt động', 'Các sự kiện đã được backend ghi nhận.'],
  curriculum: ['Khóa học', 'Các phiên bản khóa học và trạng thái xuất bản.'], items: ['Ngân hàng câu hỏi', 'Danh sách nguồn câu hỏi theo phiên bản và mức kiểm định.'],
  jobs: ['Tác vụ nội dung', 'Trạng thái các tác vụ tạo nội dung đã được lưu.'], blueprints: ['Blueprint', 'Cấu hình nội dung có phiên bản.'], quarantine: ['Nội dung cách ly', 'Các nguồn câu hỏi đang bị cách ly.'],
};
export function AdminListPage({ kind }: { kind: string }) {
  const [page, setPage] = useState(1); const [filter, setFilter] = useState(''); const [rows, setRows] = useState<Row[] | null>(null); const [more, setMore] = useState(false); const [error, setError] = useState(''); const [retry, setRetry] = useState(0);
  const [title, description] = titles[kind];
  useEffect(() => { setPage(1); setFilter(''); }, [kind]);
  useEffect(() => {
    const abort = new AbortController(); setRows(null); setError('');
    const path = kind === 'support' ? '/tickets' : kind === 'users' || kind === 'audit' ? `/${kind}` : `/resources/${kind}`;
    adminRequest<{ items: Row[]; hasMore: boolean }>(`${path}?page=${page}${kind === 'support' && filter ? `&state=${filter}` : ''}`, { signal: abort.signal })
      .then(result => { if (!abort.signal.aborted) { setRows(result.items); setMore(result.hasMore); } }).catch(e => { if (!abort.signal.aborted) setError(adminError(e)); });
    return () => abort.abort();
  }, [kind, page, filter, retry]);
  const audit = kind === 'audit'; const users = kind === 'users';
  return <><header className={s.heading}><div><h1>{title}</h1><p className={s.muted}>{description}</p></div><Button variant="outline" onClick={() => setRetry(v => v + 1)}>Làm mới</Button></header>
    {kind === 'support' && <label className={s.field}>Trạng thái<select className={s.input} value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}><option value="">Tất cả</option>{[['Open', 'Đã tiếp nhận'], ['InProgress', 'Đang xử lý'], ['Resolved', 'Đã giải quyết'], ['Rejected', 'Đã đóng']].map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>}
    {error && <div role="alert" className={s.error}>{error}</div>}{!rows && !error && <p role="status">Đang tải danh sách…</p>}{rows && <div className={s.tableWrap}><table className={s.table}><thead><tr><th scope="col">{audit ? 'Sự kiện' : users ? 'Người dùng' : 'Nội dung'}</th><th scope="col">{audit ? 'Đối tượng' : 'Trạng thái'}</th><th scope="col">{audit ? 'Thời gian' : 'Chi tiết'}</th></tr></thead><tbody>{rows.map(r => <tr key={r.id}><td>{audit ? r.action : r.title ?? r.displayName}<span className={s.id}>{r.id}</span></td><td>{audit ? `${r.targetType} · ${r.targetId}` : <span className={s.status}>{r.state ?? r.status}</span>}</td><td>{audit ? <>{r.actorType}<br />{r.occurredAt && new Date(r.occurredAt).toLocaleString('vi-VN')}</> : users ? <>{r.emailVerified ? 'Email đã xác minh' : 'Chưa xác minh email'}<br />{r.createdAt && new Date(r.createdAt).toLocaleDateString('vi-VN')}</> : <>{r.detail ?? r.description}{r.resolutionReason && <p>{r.resolutionReason}</p>}</>}</td></tr>)}</tbody></table>{rows.length === 0 && <p className={s.empty}>Chưa có dữ liệu phù hợp.</p>}</div>}
    <div className={s.actions}><Button variant="outline" disabled={!rows || page === 1} onClick={() => setPage(v => v - 1)}>Trước</Button><span>Trang {page}</span><Button variant="outline" disabled={!rows || !more} onClick={() => setPage(v => v + 1)}>Sau</Button></div></>;
}

export function AdminImportPage() { return <section className={s.panel}><h1>Nhập nội dung</h1><p className={s.muted}>Đã hỗ trợ nhập JSON cho từng câu hỏi Part 5 trong trình biên tập. Nhập đề hàng loạt từ PDF/Word và biên tập Part 7 chưa được triển khai.</p><Link to="/admin/question-drafts">Mở trình biên tập Part 5</Link></section>; }
