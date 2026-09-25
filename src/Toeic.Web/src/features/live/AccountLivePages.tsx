import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { errorMessage, jsonBody, learnerRequest } from '../../lib/api/learner';
import s from './LearnerLive.module.css';

interface Profile {
  revision: number; displayName: string; timeZone: string; goal: string; selfLevel: string; minutesPerDay: number;
  studyDays: number[]; interests: string[]; onboardingCompletedAt: string | null; placementSkippedAt: string | null;
  reminders: { email: boolean; inApp: boolean; minuteOfDay: number; quietStartMinute: number; quietEndMinute: number };
}
interface Session { id: string; createdAt: string; expiresAt: string; current: boolean }
interface Notification { id: string; title: string; body: string; readAt: string | null; createdAt: string }
type Page<T> = { items: T[]; hasMore: boolean };
const timeText = (n: number) => `${Math.floor(n / 60).toString().padStart(2, '0')}:${(n % 60).toString().padStart(2, '0')}`;
const minutes = (value: string) => { const [h, m] = value.split(':').map(Number); return h * 60 + m; };

export function LiveAccountPage() {
  const navigate = useNavigate(); const [profile, setProfile] = useState<Profile | null>(null); const [sessions, setSessions] = useState<Session[]>([]);
  const [notifications, setNotifications] = useState<Page<Notification> | null>(null); const [notificationPage, setNotificationPage] = useState(1);
  const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(true); const [refresh, setRefresh] = useState(0); const lock = useRef(false);
  const [interestText, setInterestText] = useState('');
  const [currentPassword, setCurrentPassword] = useState(''); const [newPassword, setNewPassword] = useState('');
  useEffect(() => {
    const abort = new AbortController(); setBusy(true); setError('');
    Promise.all([learnerRequest<Profile>('/profile', { signal: abort.signal }), learnerRequest<Session[]>('/security/sessions', { signal: abort.signal })])
      .then(([p, sessions]) => { if (!abort.signal.aborted) { setProfile(p); setInterestText(p.interests.join(', ')); setSessions(sessions); } })
      .catch(e => { if (!abort.signal.aborted) setError(errorMessage(e)); }).finally(() => { if (!abort.signal.aborted) setBusy(false); });
    return () => abort.abort();
  }, [refresh]);
  useEffect(() => {
    const abort = new AbortController(); setNotifications(null);
    learnerRequest<Page<Notification>>(`/notifications?page=${notificationPage}`, { signal: abort.signal })
      .then(setNotifications).catch(e => { if (!abort.signal.aborted) setError(errorMessage(e)); });
    return () => abort.abort();
  }, [notificationPage, refresh]);
  async function action(work: () => Promise<void>) {
    if (lock.current || busy) return; lock.current = true; setBusy(true); setError(''); setNotice('');
    try { await work(); } catch (e) { setError(errorMessage(e)); } finally { lock.current = false; setBusy(false); }
  }
  function update<K extends keyof Profile>(key: K, value: Profile[K]) { setProfile(p => p ? { ...p, [key]: value } : p); }
  function reminder(key: keyof Profile['reminders'], value: number | boolean) { setProfile(p => p ? { ...p, reminders: { ...p.reminders, [key]: value } } : p); }
  function saveProfile(event: FormEvent) { event.preventDefault(); if (profile) void action(async () => {
    const saved = await learnerRequest<Profile>('/profile', jsonBody('PUT', { ...profile, interests: interestText.split(',').map(v => v.trim()).filter(Boolean), expectedRevision: profile.revision, completeOnboarding: !!profile.onboardingCompletedAt, skipPlacement: !!profile.placementSkippedAt }));
    setProfile(saved); setNotice('Đã lưu thiết lập học tập.');
  }); }
  function signOut() { localStorage.removeItem('toeic_access_token'); localStorage.removeItem('toeic_user'); navigate('/auth/login', { replace: true }); }
  function password(event: FormEvent) { event.preventDefault(); void action(async () => {
    await learnerRequest('/security/password', jsonBody('POST', { currentPassword, newPassword })); setCurrentPassword(''); setNewPassword(''); signOut();
  }); }
  return <main className={s.page}><header className={s.header}><div><h1>Tài khoản & lịch học</h1><p className={s.muted}>Điều chỉnh nhịp học và quản lý các phiên đăng nhập của bạn.</p></div><Button variant="outline" disabled={busy} onClick={() => setRefresh(v => v + 1)}>Tải lại</Button></header>
    {error && <div role="alert" className={s.error}>{error}</div>}{notice && <p role="status" className={s.notice}>{notice}</p>}{busy && <p role="status">Đang xử lý…</p>}
    {profile && <section className={s.panel}><h2>Hồ sơ học tập</h2><form onSubmit={saveProfile}><label className={s.field}>Tên hiển thị<input required minLength={2} maxLength={100} disabled={busy} value={profile.displayName} onChange={e => update('displayName', e.target.value)} /></label>
      <label className={s.field}>Múi giờ<input required disabled={busy} value={profile.timeZone} onChange={e => update('timeZone', e.target.value)} placeholder="Asia/Ho_Chi_Minh" /></label>
      <div className={s.grid}><label className={s.field}>Mục tiêu<select className={s.select} disabled={busy} value={profile.goal} onChange={e => update('goal', e.target.value)}>{[['general', 'Tổng quát'], ['reading', 'Đọc hiểu'], ['vocabulary', 'Từ vựng'], ['grammar', 'Ngữ pháp']].map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className={s.field}>Trình độ tự đánh giá<select className={s.select} disabled={busy} value={profile.selfLevel} onChange={e => update('selfLevel', e.target.value)}>{[['unknown', 'Chưa xác định'], ['beginner', 'Nền tảng'], ['intermediate', 'Trung cấp'], ['advanced', 'Nâng cao']].map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className={s.field}>Số phút học mỗi ngày<input required type="number" min={5} max={180} disabled={busy} value={profile.minutesPerDay} onChange={e => update('minutesPerDay', Number(e.target.value))} /></label></div>
      <fieldset disabled={busy}><legend>Ngày học trong tuần</legend><div className={s.actions}>{['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'].map((name, n) => <label key={n}><input type="checkbox" checked={profile.studyDays.includes(n)} onChange={e => update('studyDays', e.target.checked ? [...profile.studyDays, n] : profile.studyDays.filter(d => d !== n))} /> {name}</label>)}</div></fieldset>
      <label className={s.field}>Chủ đề quan tâm (cách nhau bằng dấu phẩy)<input disabled={busy} maxLength={800} value={interestText} onChange={e => setInterestText(e.target.value)} /></label>
      <label><input type="checkbox" disabled={busy} checked={profile.reminders.inApp} onChange={e => reminder('inApp', e.target.checked)} /> Nhắc học trong ứng dụng</label><div className={s.grid}>
      {([['minuteOfDay', 'Giờ nhắc học'], ['quietStartMinute', 'Bắt đầu giờ yên tĩnh'], ['quietEndMinute', 'Kết thúc giờ yên tĩnh']] as const).map(([key, label]) => <label className={s.field} key={key}>{label}<input type="time" required disabled={busy} value={timeText(profile.reminders[key])} onChange={e => { if (e.target.value) reminder(key, minutes(e.target.value)); }} /></label>)}</div>
      <Button type="submit" disabled={busy || profile.studyDays.length === 0}>Lưu thiết lập</Button></form></section>}
    <section className={s.panel}><h2>Đổi mật khẩu</h2><p className={s.muted}>Sau khi đổi mật khẩu, bạn sẽ đăng nhập lại trên mọi thiết bị.</p><form onSubmit={password}><label className={s.field}>Mật khẩu hiện tại<input required autoComplete="current-password" type="password" disabled={busy} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></label><label className={s.field}>Mật khẩu mới (12–128 ký tự)<input required minLength={12} maxLength={128} autoComplete="new-password" type="password" disabled={busy} value={newPassword} onChange={e => setNewPassword(e.target.value)} /></label><Button type="submit" disabled={busy}>Đổi mật khẩu</Button></form></section>
    <section className={s.panel}><h2>Phiên đăng nhập</h2>{sessions.map(session => <div className={s.actions} key={session.id}><span>{session.current ? 'Phiên hiện tại' : 'Phiên khác'} · {new Date(session.createdAt).toLocaleString('vi-VN')}</span><Button variant="outline" disabled={busy} onClick={() => void action(async () => { await learnerRequest(`/security/sessions/${session.id}`, { method: 'DELETE' }); if (session.current) signOut(); else setSessions(v => v.filter(s => s.id !== session.id)); })}>Đăng xuất phiên này</Button></div>)}<Button variant="outline" disabled={busy} onClick={() => void action(async () => { await learnerRequest('/security/sessions/revoke-others', { method: 'POST' }); setSessions(v => v.filter(s => s.current)); })}>Đăng xuất các phiên khác</Button></section>
    <section className={s.panel}><h2>Thông báo</h2>{notifications?.items.length === 0 && <p>Chưa có thông báo.</p>}{notifications?.items.map(n => <article className={s.panel} key={n.id}><h3>{n.title}</h3><p>{n.body}</p><p className={s.muted}>{new Date(n.createdAt).toLocaleString('vi-VN')}</p>{!n.readAt && <Button variant="text" disabled={busy} onClick={() => void action(async () => { await learnerRequest(`/notifications/${n.id}/read`, { method: 'PUT' }); setNotifications(v => v ? { ...v, items: v.items.map(item => item.id === n.id ? { ...item, readAt: new Date().toISOString() } : item) } : v); })}>Đánh dấu đã đọc</Button>}</article>)}
      <div className={s.actions}><Button variant="outline" disabled={busy || notificationPage === 1} onClick={() => setNotificationPage(v => v - 1)}>Trước</Button><span>Trang {notificationPage}</span><Button variant="outline" disabled={busy || !notifications?.hasMore} onClick={() => setNotificationPage(v => v + 1)}>Sau</Button></div></section>
  </main>;
}

interface Ticket { id: string; title: string; description: string; state: string; resolutionReason: string | null; createdAt: string }
export function LiveSupportPage() {
  const [category, setCategory] = useState('Technical'); const [title, setTitle] = useState(''); const [description, setDescription] = useState('');
  const [tickets, setTickets] = useState<Page<Ticket> | null>(null); const [page, setPage] = useState(1); const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const lock = useRef(false); const operation = useRef<{ key: string; id: string }>();
  useEffect(() => {
    const abort = new AbortController(); setBusy(true); setError(''); setTickets(null);
    learnerRequest<Page<Ticket>>(`/tickets?page=${page}`, { signal: abort.signal }).then(setTickets).catch(e => { if (!abort.signal.aborted) setError(errorMessage(e)); }).finally(() => { if (!abort.signal.aborted) setBusy(false); });
    return () => abort.abort();
  }, [page, refresh]);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (lock.current || busy) return; lock.current = true; setBusy(true); setError(''); setNotice('');
    const body = { category, title, description }; const key = JSON.stringify(body);
    if (operation.current?.key !== key) operation.current = { key, id: crypto.randomUUID() };
    try { await learnerRequest('/tickets', jsonBody('POST', { ...body, clientOperationId: operation.current.id })); operation.current = undefined; setTitle(''); setDescription(''); setPage(1); setRefresh(v => v + 1); setNotice('Yêu cầu đã được lưu. Bạn có thể theo dõi trạng thái bên dưới.'); }
    catch (e) { setError(errorMessage(e)); } finally { lock.current = false; setBusy(false); }
  }
  const labels: Record<string, string> = { Open: 'Đã tiếp nhận', InProgress: 'Đang xử lý', Resolved: 'Đã giải quyết', Rejected: 'Đã đóng' };
  return <main className={s.page}><header className={s.header}><div><h1>Hỗ trợ học viên</h1><p className={s.muted}>Gửi vấn đề cụ thể để đội hỗ trợ có đủ thông tin xử lý.</p></div><Button variant="outline" disabled={busy} onClick={() => setRefresh(v => v + 1)}>Tải lại</Button></header>
    {error && <div role="alert" className={s.error}>{error}</div>}{notice && <p role="status" className={s.notice}>{notice}</p>}
    <form className={s.panel} onSubmit={submit}><label className={s.field}>Loại yêu cầu<select className={s.select} value={category} disabled={busy} onChange={e => setCategory(e.target.value)}>{[['Technical', 'Lỗi kỹ thuật'], ['Content', 'Nội dung bài học'], ['Account', 'Tài khoản'], ['Billing', 'Thanh toán']].map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className={s.field}>Tiêu đề<input required minLength={3} maxLength={150} disabled={busy} value={title} onChange={e => setTitle(e.target.value)} /></label><label className={s.field}>Mô tả<textarea required maxLength={2000} disabled={busy} value={description} onChange={e => setDescription(e.target.value)} /></label><Button type="submit" disabled={busy}>Gửi yêu cầu</Button></form>
    <section className={s.panel}><h2>Yêu cầu của bạn</h2>{busy && <p role="status">Đang tải…</p>}{tickets?.items.length === 0 && <p>Chưa có yêu cầu hỗ trợ.</p>}{tickets?.items.map(t => <article className={s.panel} key={t.id}><p className={s.muted}>{labels[t.state]} · {new Date(t.createdAt).toLocaleDateString('vi-VN')}</p><h3>{t.title}</h3><p className={s.prompt}>{t.description}</p>{t.resolutionReason && <p className={s.notice}>{t.resolutionReason}</p>}</article>)}<div className={s.actions}><Button variant="outline" disabled={busy || page === 1} onClick={() => setPage(v => v - 1)}>Trước</Button><span>Trang {page}</span><Button variant="outline" disabled={busy || !tickets?.hasMore} onClick={() => setPage(v => v + 1)}>Sau</Button></div></section>
  </main>;
}
