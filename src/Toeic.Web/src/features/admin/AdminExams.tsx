import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { adminError, adminRequest } from '../../lib/api/admin';
import s from './AdminConsole.module.css';

interface Page<T> { items: T[]; hasMore: boolean }
interface Exam { id: string; version: string; state: string; tier: string; policyVersion: string; examProfileVersion: string; durationSeconds: number; questionCount: number }
interface Source { id: string; familyId: string; part: string; state: string; tier: string; policyVersion: string; questionCount: number; passageKind: string | null }
interface Option { stableId: string; text: string; justification: string }
interface Question { stableId: string; prompt: string; options: Option[]; proposedKey: string; rationale: string; evidence?: { quote: string }[] }
interface Content { id: string; part: string; content: { stem?: string; options?: Option[]; proposedKey?: string; answerDerivation?: string; stimulus?: { text: string }; questions?: Question[] } }
interface Detail { form: Exam; sources: Content[] }
interface ExamProfile { version: string; title: string; kind: string; publicationEnabled: boolean; durationSeconds: number; totalQuestions: number; exactStructure: boolean; structure: { part: string; count?: number; min?: number; max?: number }[] }
const stateName: Record<string, string> = { Active: 'Đang phát hành', Draft: 'Bản nháp', Degraded: 'Cần xử lý', Archived: 'Đã ngừng phát hành' };
function Pages({ page, more, change, disabled }: { page: number; more: boolean; change: (page: number) => void; disabled: boolean }) {
  return <div className={s.actions}><Button variant="outline" disabled={disabled || page === 1} onClick={() => change(page - 1)}>Trước</Button><span>Trang {page}</span><Button variant="outline" disabled={disabled || !more} onClick={() => change(page + 1)}>Sau</Button></div>;
}
function Preview({ source }: { source: Content }) {
  const content = source.content;
  const questions: Question[] = source.part === 'Part5' ? [{ stableId: source.id, prompt: content.stem ?? '', options: content.options ?? [], proposedKey: content.proposedKey ?? '', rationale: content.answerDerivation ?? '' }] : content.questions ?? [];
  return <section className={s.panel}><p className={s.muted}>{source.part} · {source.id}</p>{content.stimulus && <blockquote style={{ whiteSpace: 'pre-wrap' }}>{content.stimulus.text}</blockquote>}{questions.map((q, index) => <article key={q.stableId}><h3>{index + 1}. {q.prompt}</h3><ol type="A">{q.options.map(o => <li key={o.stableId}><strong>{o.text}{o.stableId === q.proposedKey ? ' — Đáp án đúng' : ''}</strong><p className={s.muted}>{o.justification}</p></li>)}</ol><p style={{ whiteSpace: 'pre-wrap' }}>{q.rationale}</p>{q.evidence?.map((e, i) => <blockquote key={i}>{e.quote}</blockquote>)}</article>)}</section>;
}

export function AdminExamListPage() {
  const [page, setPage] = useState(1); const [state, setState] = useState(''); const [retry, setRetry] = useState(0);
  const [data, setData] = useState<Page<Exam> | null>(null); const [error, setError] = useState('');
  useEffect(() => {
    const abort = new AbortController(); setData(null); setError('');
    adminRequest<Page<Exam>>(`/exams?page=${page}${state ? `&state=${state}` : ''}`, { signal: abort.signal }).then(value => { if (!abort.signal.aborted) setData(value); }).catch(e => { if (!abort.signal.aborted) setError(adminError(e)); });
    return () => abort.abort();
  }, [page, state, retry]);
  return <><header className={s.heading}><div><h1>Quản lý đề luyện tập</h1><p className={s.muted}>Theo dõi phiên bản đề, xem nội dung và quản lý phát hành.</p></div><Link to="/admin/exams/new">Tạo đề luyện tập →</Link></header><div className={s.actions}><select className={s.input} aria-label="Trạng thái đề" value={state} onChange={e => { setState(e.target.value); setPage(1); }}><option value="">Tất cả trạng thái</option>{Object.entries(stateName).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select><Button variant="outline" onClick={() => setRetry(v => v + 1)}>Làm mới</Button></div>{error && <p className={s.error} role="alert">{error}</p>}{!data && !error && <p role="status">Đang tải đề…</p>}{data && <><div className={s.tableWrap}><table className={s.table}><thead><tr><th>Phiên bản</th><th>Trạng thái</th><th>Nội dung</th></tr></thead><tbody>{data.items.map(f => <tr key={f.id}><td><Link to={`/admin/exams/${f.id}`}>{f.version}</Link><span className={s.id}>{f.id}</span></td><td>{stateName[f.state] ?? f.state}<p className={s.muted}>{f.tier}</p></td><td>{f.questionCount} câu · {f.durationSeconds / 60} phút<p className={s.muted}>{f.policyVersion}</p></td></tr>)}</tbody></table>{data.items.length === 0 && <p className={s.empty}>Chưa có đề phù hợp.</p>}</div><Pages page={page} more={data.hasMore} disabled={false} change={setPage} /></>}</>;
}

export function AdminExamCreatePage() {
  const navigate = useNavigate(); const [version, setVersion] = useState(''); const [policy, setPolicy] = useState(''); const [profile, setProfile] = useState('');
  const [minutes, setMinutes] = useState(30); const [tier, setTier] = useState('BetaPractice'); const [maximum, setMaximum] = useState(100);
  const [page, setPage] = useState(1); const [filter, setFilter] = useState(''); const [retry, setRetry] = useState(0); const [data, setData] = useState<Page<Source> | null>(null);
  const [selected, setSelected] = useState<Source[]>([]); const [preview, setPreview] = useState<Content | null>(null); const [previewId, setPreviewId] = useState('');
  const [profiles, setProfiles] = useState<ExamProfile[] | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [loadError, setLoadError] = useState(''); const [previewError, setPreviewError] = useState('');
  const lock = useRef(false); const operation = useRef<{ payload: string; id: string }>();
  useEffect(() => {
    const abort = new AbortController(); setData(null); setLoadError('');
    adminRequest<Page<Source>>(`/exams/sources?page=${page}${filter ? `&policy=${encodeURIComponent(filter)}` : ''}`, { signal: abort.signal }).then(value => { if (!abort.signal.aborted) setData(value); }).catch(e => { if (!abort.signal.aborted) setLoadError(adminError(e)); });
    return () => abort.abort();
  }, [page, filter, retry]);
  useEffect(() => { const abort = new AbortController(); adminRequest<ExamProfile[]>('/exams/profiles', { signal: abort.signal }).then(value => { if (!abort.signal.aborted) { setProfiles(value); const first = value.find(item => item.publicationEnabled); if (first) { setProfile(first.version); setMinutes(first.durationSeconds / 60); } } }).catch(e => { if (!abort.signal.aborted) setLoadError(adminError(e)); }); return () => abort.abort(); }, []);
  useEffect(() => {
    setPreview(null); setPreviewError(''); if (!previewId) return; const abort = new AbortController();
    adminRequest<Content>(`/exams/sources/${previewId}`, { signal: abort.signal }).then(value => { if (!abort.signal.aborted) setPreview(value); }).catch(e => { if (!abort.signal.aborted) setPreviewError(adminError(e)); });
    return () => abort.abort();
  }, [previewId]);
  const part5 = selected.filter(x => x.part === 'Part5').reduce((n, x) => n + x.questionCount, 0);
  const part6 = selected.filter(x => x.part === 'Part6').reduce((n, x) => n + x.questionCount, 0);
  const part7 = selected.filter(x => x.part === 'Part7DirectEvidence').reduce((n, x) => n + x.questionCount, 0);
  const part7Single = selected.filter(x => x.part === 'Part7DirectEvidence' && (x.passageKind ?? 'Single') === 'Single').reduce((n, x) => n + x.questionCount, 0);
  const part7Multiple = selected.filter(x => x.part === 'Part7DirectEvidence' && ['Double', 'Triple'].includes(x.passageKind ?? '')).reduce((n, x) => n + x.questionCount, 0);
  const incompatible = selected.some(x => x.policyVersion !== policy.trim() || (tier === 'DataValidatedPractice' && x.tier !== 'DataValidatedPractice'));
  const chosenProfile = profiles?.find(item => item.version === profile);
  const expectedPart7Single = chosenProfile?.structure.find(item => item.part === 'Part7Single')?.count ?? 0;
  const expectedPart7Multiple = chosenProfile?.structure.find(item => item.part === 'Part7Multiple')?.count ?? 0;
  const expectedPart7 = (chosenProfile?.structure.find(item => item.part === 'Part7DirectEvidence')?.count ?? 0) + expectedPart7Single + expectedPart7Multiple;
  const profileMismatch = !!chosenProfile?.exactStructure && (part5 !== (chosenProfile.structure.find(item => item.part === 'Part5')?.count ?? 0) || part6 !== (chosenProfile.structure.find(item => item.part === 'Part6')?.count ?? 0) || part7 !== expectedPart7 || (expectedPart7Single > 0 && part7Single !== expectedPart7Single) || (expectedPart7Multiple > 0 && part7Multiple !== expectedPart7Multiple) || minutes * 60 !== chosenProfile.durationSeconds);
  function move(index: number, delta: number) { setSelected(values => { const next = [...values]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; return next; }); }
  async function publish(event: FormEvent) {
    event.preventDefault(); if (lock.current || incompatible || selected.length === 0) return; lock.current = true; setBusy(true); setError('');
    const payload = { version: version.trim(), policyVersion: policy.trim(), examProfileVersion: profile.trim(), durationSeconds: minutes * 60, tier, sourceIds: selected.map(x => x.id), part5Count: part5, part6Count: part6, part7Count: part7, maximumPriorExposure: maximum };
    const signature = JSON.stringify(payload); if (operation.current?.payload !== signature) operation.current = { payload: signature, id: crypto.randomUUID() };
    try { const result = await adminRequest<{ id: string }>('/exams', { method: 'POST', body: JSON.stringify({ ...payload, operationId: operation.current.id }) }); navigate(`/admin/exams/${result.id}`, { replace: true }); }
    catch (e) { setError(adminError(e)); } finally { lock.current = false; setBusy(false); }
  }
  return <><header className={s.heading}><div><h1>Tạo đề luyện tập</h1><p className={s.muted}>Chọn nguồn đã kiểm định. Thứ tự nguồn là thứ tự xuất hiện trong đề; nhóm Part 7 được giữ nguyên.</p></div><Link to="/admin/exams">Danh sách đề</Link></header>
    <section className={s.panel}><h2>Nguồn câu hỏi</h2><label className={s.field}>Lọc theo policy<input className={s.input} maxLength={120} disabled={busy} value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }} /></label><Button variant="outline" disabled={busy} onClick={() => setRetry(v => v + 1)}>Làm mới nguồn</Button>{loadError && <p className={s.error} role="alert">{loadError}</p>}{!data && !loadError && <p role="status">Đang tải nguồn…</p>}{data && <><div className={s.tableWrap}><table className={s.table}><thead><tr><th>Chọn</th><th>Nguồn</th><th>Kiểm định</th><th>Xem trước</th></tr></thead><tbody>{data.items.map(source => <tr key={source.id}><td><input type="checkbox" aria-label={`Chọn nguồn ${source.familyId}`} disabled={busy || (!selected.some(x => x.id === source.id) && selected.length >= 200)} checked={selected.some(x => x.id === source.id)} onChange={e => { setSelected(values => e.target.checked ? [...values, source] : values.filter(x => x.id !== source.id)); if (!policy) setPolicy(source.policyVersion); }} /></td><td>{source.part} · {source.questionCount} câu{source.passageKind ? ` · ${source.passageKind}` : ''}<span className={s.id}>{source.familyId}</span></td><td>{source.tier}<p className={s.muted}>{source.policyVersion}</p></td><td><Button variant="text" onClick={() => setPreviewId(source.id)}>Xem nội dung</Button></td></tr>)}</tbody></table></div>{data.items.length === 0 && <p>Chưa có nguồn đủ điều kiện. Cần đưa nội dung qua pipeline kiểm định trước khi tạo đề.</p>}<Pages page={page} more={data.hasMore} disabled={busy} change={setPage} /></>}</section>
    {previewId && <section aria-label="Xem trước nguồn"><div className={s.actions}><h2>Bản xem trước</h2><Button variant="text" onClick={() => setPreviewId('')}>Đóng</Button></div>{previewError && <p className={s.error} role="alert">{previewError}</p>}{preview ? <Preview source={preview} /> : !previewError && <p role="status">Đang tải nội dung…</p>}</section>}
    <form className={s.panel} onSubmit={publish}><h2>Cấu hình và thứ tự đề</h2><p>Part 5: {part5} câu · Part 6: {part6} câu · Part 7: {part7} câu (single: {part7Single}; multiple: {part7Multiple}) · Tổng: {part5 + part6 + part7} câu</p><ol>{selected.map((source, index) => <li key={source.id}><span>{source.part}{source.passageKind ? ` (${source.passageKind})` : ''} · {source.familyId} · {source.questionCount} câu </span><Button type="button" variant="text" disabled={busy || index === 0} onClick={() => move(index, -1)}>Lên</Button><Button type="button" variant="text" disabled={busy || index === selected.length - 1} onClick={() => move(index, 1)}>Xuống</Button><Button type="button" variant="text" disabled={busy} onClick={() => setSelected(values => values.filter(x => x.id !== source.id))}>Bỏ</Button></li>)}</ol>
      <label className={s.field}>Tên phiên bản đề<input className={s.input} required maxLength={120} disabled={busy} value={version} onChange={e => setVersion(e.target.value)} /></label><label className={s.field}>Policy phiên bản nội dung<input className={s.input} required maxLength={120} disabled={busy} value={policy} onChange={e => setPolicy(e.target.value)} /></label><label className={s.field}>Cấu trúc đề<select className={s.input} required disabled={busy || !profiles} value={profile} onChange={e => { const next = profiles?.find(item => item.version === e.target.value); setProfile(e.target.value); if (next) setMinutes(next.durationSeconds / 60); }}>{profiles?.map(item => <option key={item.version} value={item.version} disabled={!item.publicationEnabled}>{item.title}{item.publicationEnabled ? "" : " — chưa hỗ trợ phát hành"}</option>)}</select></label><label className={s.field}>Thời lượng (phút)<input className={s.input} type="number" min={1} max={240} step={1} required disabled={busy || !!chosenProfile?.exactStructure} value={minutes} onChange={e => setMinutes(Number(e.target.value))} /></label><label className={s.field}>Mức phát hành<select className={s.input} disabled={busy} value={tier} onChange={e => setTier(e.target.value)}><option value="BetaPractice">Luyện tập Beta</option><option value="DataValidatedPractice">Đã kiểm định bằng dữ liệu</option></select></label><label className={s.field}>Số lượt tiếp xúc tối đa đã có của mỗi nguồn<input className={s.input} type="number" min={0} max={100000} step={1} required disabled={busy} value={maximum} onChange={e => setMaximum(Number(e.target.value))} /></label>
      {chosenProfile?.kind === 'FullToeic' && <p className={s.notice}>Profile TOEIC đầy đủ đã được định nghĩa 200 câu/120 phút nhưng bị khóa phát hành cho đến khi hỗ trợ Part 1–4, Part 6 và audio.</p>}{profileMismatch && <p className={s.error}>Cơ cấu câu hoặc thời lượng chưa khớp profile đã chọn.</p>}{incompatible && <p className={s.error}>Các nguồn phải cùng policy và đáp ứng mức phát hành đã chọn.</p>}{error && <p className={s.error} role="alert">{error}</p>}<p className={s.muted}>Xuất bản sẽ cho phép mở lượt luyện tập khi tính năng luyện đề được bật. Nội dung đề đã xuất bản được giữ nguyên; thay đổi nội dung cần tạo phiên bản mới.</p><Button type="submit" disabled={busy || incompatible || profileMismatch || !chosenProfile?.publicationEnabled || selected.length === 0 || part5 + part6 + part7 > 200}>{busy ? 'Đang kiểm tra và xuất bản…' : 'Kiểm tra và xuất bản đề'}</Button>
    </form></>;
}

export function AdminExamDetailPage() { const { examId = '' } = useParams(); return <ExamDetail key={examId} id={examId} />; }
function ExamDetail({ id }: { id: string }) {
  const [data, setData] = useState<Detail | null>(null); const [retry, setRetry] = useState(0); const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const lock = useRef(false);
  useEffect(() => { const abort = new AbortController(); setData(null); setError(''); adminRequest<Detail>(`/exams/${id}`, { signal: abort.signal }).then(value => { if (!abort.signal.aborted) setData(value); }).catch(e => { if (!abort.signal.aborted) setError(adminError(e)); }); return () => abort.abort(); }, [id, retry]);
  async function archive(event: FormEvent) {
    event.preventDefault(); if (!data || lock.current) return; lock.current = true; setBusy(true); setError('');
    try { await adminRequest(`/exams/${id}/archive`, { method: 'POST', body: JSON.stringify({ expectedState: data.form.state, reason: reason.trim() }) }); setRetry(v => v + 1); }
    catch (e) { setError(adminError(e)); } finally { lock.current = false; setBusy(false); }
  }
  return <><header className={s.heading}><h1>{data?.form.version ?? 'Chi tiết đề'}</h1><Link to="/admin/exams">Danh sách đề</Link></header>{error && <p className={s.error} role="alert">{error}</p>}<Button variant="outline" disabled={busy} onClick={() => setRetry(v => v + 1)}>Tải lại</Button>{!data && !error && <p role="status">Đang tải đề…</p>}{data && <><section className={s.panel}><p>{stateName[data.form.state]} · {data.form.tier}</p><p>{data.form.questionCount} câu · {data.form.durationSeconds / 60} phút</p><p className={s.muted}>Policy: {data.form.policyVersion} · Cấu hình: {data.form.examProfileVersion}</p></section>{data.sources.map(source => <Preview key={source.id} source={source} />)}{data.form.state !== 'Archived' && <form className={s.panel} onSubmit={archive}><h2>Ngừng phát hành</h2><p className={s.muted}>Chặn lượt làm mới. Học viên đang làm vẫn có thể hoàn thành bài bằng snapshot đã lưu; lịch sử và kết quả được giữ lại.</p><label className={s.field}>Lý do<textarea className={s.input} required maxLength={1000} disabled={busy} value={reason} onChange={e => setReason(e.target.value)} /></label><Button type="submit" disabled={busy || !reason.trim()}>Ngừng phát hành đề này</Button></form>}</>}</>;
}
