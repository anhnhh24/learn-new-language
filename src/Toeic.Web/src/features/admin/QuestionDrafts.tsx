import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { adminError, adminRequest } from '../../lib/api/admin';
import s from './AdminConsole.module.css';
import e from './QuestionDrafts.module.css';

const bodySchema = z.object({
  stem: z.string().max(500), proposedKey: z.string().max(100), answerDerivation: z.string().max(4000), rightsReference: z.string().max(2000),
  options: z.array(z.object({ stableId: z.string().min(1).max(100), text: z.string().max(120), justification: z.string().max(2000) }).strict()).length(4),
}).strict().refine(body => new Set(body.options.map(o => o.stableId)).size === 4 && body.options.some(o => o.stableId === body.proposedKey), 'Mã đáp án phải khác nhau và đáp án đúng phải nằm trong bốn lựa chọn.');
type Body = z.infer<typeof bodySchema>;
interface Draft { id: string; blueprintId: string; previousRevisionId: string | null; familyId: string; title: string; body: Body; revision: number; sourceId: string | null; updatedAt: string }
interface Row { id: string; title: string; revision: number; sourceId: string | null; updatedAt: string }
interface Blueprint { id: string; version: string; policyVersion: string; ruleId: string }
interface Page<T> { items: T[]; hasMore: boolean }
interface Report { passed: boolean; findings: { code: string; path: string }[] }
interface Submission { sourceId: string | null; report: Report }
const base = '/question-drafts';
function download(body: Body, name: string) { const url = URL.createObjectURL(new Blob([JSON.stringify(body, null, 2)], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
function Pager({ page, more, change, disabled }: { page: number; more: boolean; change: (n: number) => void; disabled: boolean }) { return <div className={s.actions}><Button variant="outline" disabled={disabled || page === 1} onClick={() => change(page - 1)}>Trước</Button><span>Trang {page}</span><Button variant="outline" disabled={disabled || !more} onClick={() => change(page + 1)}>Sau</Button></div>; }

export function QuestionDraftListPage() {
  const navigate = useNavigate(); const [page, setPage] = useState(1); const [blueprintPage, setBlueprintPage] = useState(1); const [retry, setRetry] = useState(0);
  const [drafts, setDrafts] = useState<Page<Row> | null>(null); const [blueprints, setBlueprints] = useState<Page<Blueprint> | null>(null);
  const [chosen, setChosen] = useState<Blueprint | null>(null); const [previous, setPrevious] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const lock = useRef(false); const operation = useRef<{ payload: string; id: string }>();
  useEffect(() => {
    const abort = new AbortController(); setDrafts(null); setBlueprints(null); setError('');
    Promise.all([adminRequest<Page<Row>>(`${base}?page=${page}`, { signal: abort.signal }), adminRequest<Page<Blueprint>>(`${base}/blueprints?page=${blueprintPage}`, { signal: abort.signal })])
      .then(([d, b]) => { if (!abort.signal.aborted) { setDrafts(d); setBlueprints(b); } }).catch(error => { if (!abort.signal.aborted) setError(adminError(error)); });
    return () => abort.abort();
  }, [page, blueprintPage, retry]);
  async function create(event: FormEvent) {
    event.preventDefault(); if (!chosen || lock.current) return; lock.current = true; setBusy(true); setError('');
    const payload = { blueprintId: chosen.id, previousRevisionId: previous.trim() || null }; const key = JSON.stringify(payload);
    if (operation.current?.payload !== key) operation.current = { payload: key, id: crypto.randomUUID() };
    try { const result = await adminRequest<Draft>(base, { method: 'POST', body: JSON.stringify({ ...payload, id: operation.current.id }) }); navigate(`/admin/question-drafts/${result.id}`); }
    catch (error) { setError(adminError(error)); } finally { lock.current = false; setBusy(false); }
  }
  return <><header className={s.heading}><div><h1>Biên tập câu hỏi Part 5</h1><p className={s.muted}>Lưu bản nháp, nhập nội dung và chuẩn bị nguồn cho kiểm định.</p></div><Button disabled={busy} variant="outline" onClick={() => setRetry(v => v + 1)}>Làm mới</Button></header>{error && <p className={s.error} role="alert">{error}</p>}
    <form className={s.panel} onSubmit={create}><h2>Tạo bản nháp</h2><p className={s.muted}>Chọn blueprint đã xuất bản để xác định quy tắc kiến thức và policy. Nội dung mới chưa được dùng cho học viên.</p>{!blueprints && !error && <p role="status">Đang tải blueprint…</p>}{blueprints && <><div className={e.blueprints}>{blueprints.items.map(b => <label key={b.id} className={e.choice}><input type="radio" name="blueprint" checked={chosen?.id === b.id} disabled={busy} onChange={() => setChosen(b)} /><span><strong>{b.version}</strong><small>{b.ruleId} · {b.policyVersion}</small></span></label>)}</div>{blueprints.items.length === 0 && <p>Chưa có blueprint Part 5 đã xuất bản. Cần chuẩn bị blueprint trước khi tạo nội dung.</p>}<Pager page={blueprintPage} more={blueprints.hasMore} disabled={busy} change={setBlueprintPage} /></>}{chosen && <p>Đã chọn: <strong>{chosen.version}</strong></p>}<label className={s.field}>ID nguồn Part 5 cần tạo phiên bản sửa đổi (tùy chọn)<input className={s.input} value={previous} disabled={busy} pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}" onChange={event => setPrevious(event.target.value)} /><small className={s.muted}>Để trống khi viết câu hỏi mới. Phiên bản sửa đổi giữ cùng family và không thay đổi nguồn cũ.</small></label><Button type="submit" disabled={busy || !chosen}>Tạo bản nháp</Button></form>
    <section className={s.panel}><h2>Bản nháp đã lưu</h2>{!drafts && !error && <p role="status">Đang tải bản nháp…</p>}{drafts && <><div className={s.tableWrap}><table className={s.table}><thead><tr><th>Câu hỏi</th><th>Trạng thái</th><th>Cập nhật</th></tr></thead><tbody>{drafts.items.map(d => <tr key={d.id}><td><Link to={`/admin/question-drafts/${d.id}`}>{d.title}</Link></td><td>{d.sourceId ? 'Đã tạo nguồn kiểm định' : 'Đang biên tập'}</td><td>{new Date(d.updatedAt).toLocaleString('vi-VN')}</td></tr>)}</tbody></table>{drafts.items.length === 0 && <p className={s.empty}>Chưa có bản nháp.</p>}</div><Pager page={page} more={drafts.hasMore} disabled={busy} change={setPage} /></>}</section></>;
}

const findings: Record<string, string> = { STEM_INVALID: 'Câu dẫn phải có nội dung, tối đa 500 ký tự.', BLANK_COUNT: 'Dùng đúng một chỗ trống gồm ít nhất ba dấu gạch dưới: ___.', DERIVATION_REQUIRED: 'Bổ sung cách suy ra đáp án.', OPTION_COUNT: 'Cần đúng bốn đáp án.', OPTION_TEXT_INVALID: 'Đáp án không được để trống, tối đa 120 ký tự.', DUPLICATE_OPTION: 'Có đáp án trùng nội dung.', JUSTIFICATION_REQUIRED: 'Giải thích vì sao từng đáp án đúng hoặc sai.', KEY_INVALID: 'Chọn một đáp án đúng trong danh sách.', PROVENANCE_REQUIRED: 'Bổ sung nguồn và thông tin quyền sử dụng.', BLUEPRINT_INVALID: 'Blueprint không phù hợp với bộ kiểm tra Part 5 hiện tại.', RULE_NOT_ALLOWED: 'Quy tắc kiến thức không thuộc blueprint.', OPTION_ID_INVALID: 'Mã đáp án phải có nội dung và không được trùng.' };
export function QuestionDraftEditorPage() { const { draftId = '' } = useParams(); return <Editor key={draftId} id={draftId} />; }
function Editor({ id }: { id: string }) {
  const navigate = useNavigate(); const [draft, setDraft] = useState<Draft | null>(null); const [body, setBody] = useState<Body | null>(null); const [title, setTitle] = useState('');
  const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false); const [report, setReport] = useState<Report | null>(null); const [retry, setRetry] = useState(0); const [confirmReload, setConfirmReload] = useState(false);
  const [pending, setPending] = useState<{ expectedRevision: number; title: string; body: Body } | null>(null); const lock = useRef(false); const cloneId = useRef(crypto.randomUUID());
  const dirty = !!draft && !!body && (title !== draft.title || JSON.stringify(body) !== JSON.stringify(draft.body));
  const blocker = useBlocker(dirty || !!pending || (busy && !draft?.sourceId));
  function accept(value: Draft) { setDraft(value); setBody(value.body); setTitle(value.title); setReport(null); setPending(null); }
  useEffect(() => {
    const abort = new AbortController(); setError(''); lock.current = true; setBusy(true);
    adminRequest<Draft>(`${base}/${id}`, { signal: abort.signal }).then(value => { if (!abort.signal.aborted) accept(value); }).catch(error => { if (!abort.signal.aborted) setError(adminError(error)); }).finally(() => { if (!abort.signal.aborted) { lock.current = false; setBusy(false); } });
    return () => abort.abort();
  }, [id, retry]);
  useEffect(() => { if (!dirty && !busy && !pending) return; const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty, busy, pending]);
  function edit(value: Body) { setBody(value); setReport(null); setNotice(''); }
  async function save() {
    if (!draft || !body || lock.current) return; lock.current = true; setBusy(true); setError(''); setNotice('');
    const request = pending ?? { expectedRevision: draft.revision, title, body }; setPending(request);
    try { accept(await adminRequest<Draft>(`${base}/${id}`, { method: 'PUT', body: JSON.stringify(request) })); setNotice('Đã lưu bản nháp trên máy chủ.'); }
    catch (error) { setError(adminError(error)); } finally { lock.current = false; setBusy(false); }
  }
  async function validate(submit: boolean) {
    if (!draft || dirty || pending || lock.current) return; lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const result = await adminRequest<Submission>(`${base}/${id}/${submit ? 'submit' : 'validate'}`, { method: 'POST', body: JSON.stringify({ expectedRevision: draft.revision }) });
      setReport(result.report);
      if (result.sourceId) { setDraft({ ...draft, sourceId: result.sourceId }); accept(await adminRequest<Draft>(`${base}/${id}`)); setNotice('Đã tạo nguồn bất biến. Nguồn mới đạt kiểm tra cấu trúc, chưa đủ điều kiện phát hành.'); }
      else if (result.report.passed) setNotice('Cấu trúc hợp lệ. Kiểm tra này chưa xác nhận tính đúng đắn của kiến thức hoặc quyền sử dụng.');
    } catch (error) { setError(adminError(error)); } finally { lock.current = false; setBusy(false); }
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file || lock.current || !body) return;
    lock.current = true; setBusy(true); setError('');
    try { if (file.size > 64000) throw new Error('Tệp vượt giới hạn 64 KB.'); const parsed = bodySchema.safeParse(JSON.parse(await file.text())); if (!parsed.success) throw new Error('JSON không đúng cấu trúc hoặc vượt giới hạn trường. Hãy xuất JSON từ editor để xem định dạng.'); edit(parsed.data); setNotice('Đã đọc nội dung vào editor. Nhấn Lưu nháp để ghi vào máy chủ.'); }
    catch (error) { setError(error instanceof Error ? error.message : 'Không đọc được tệp JSON.'); } finally { lock.current = false; setBusy(false); }
  }
  async function clone() {
    if (!draft?.sourceId || lock.current) return; lock.current = true; setBusy(true); setError('');
    try { const next = await adminRequest<Draft>(base, { method: 'POST', body: JSON.stringify({ id: cloneId.current, blueprintId: draft.blueprintId, previousRevisionId: draft.sourceId }) }); setBusy(false); navigate(`/admin/question-drafts/${next.id}`); }
    catch (error) { setError(adminError(error)); } finally { lock.current = false; setBusy(false); }
  }
  const disabled = busy || !!pending || !!draft?.sourceId;
  return <><header className={s.heading}><div><h1>Biên tập câu hỏi</h1><p className={s.muted}>Part 5 · {draft ? `Bản lưu ${draft.revision}` : 'Đang tải'}</p></div><Link to="/admin/question-drafts">Danh sách bản nháp</Link></header>{error && <p className={s.error} role="alert">{error}</p>}{notice && <p className={e.notice} role="status">{notice}</p>}
    {blocker.state === 'blocked' && <div className={e.notice} role="alert"><p>{busy ? 'Đang gửi dữ liệu. Hãy chờ thao tác hoàn tất trước khi rời trang.' : 'Có dữ liệu chưa xác nhận lưu. Rời trang sẽ bỏ các thay đổi đang giữ trong editor.'}</p><Button variant="outline" onClick={() => blocker.reset()}>Ở lại</Button> <Button variant="danger" disabled={busy} onClick={() => blocker.proceed()}>Rời trang</Button></div>}
    <div className={s.actions}><Button variant="outline" disabled={busy} onClick={() => dirty || pending ? setConfirmReload(true) : setRetry(v => v + 1)}>Tải bản máy chủ</Button>{body && <Button variant="outline" disabled={busy} onClick={() => download(body, 'part5-draft.json')}>Xuất JSON</Button>}</div>
    {confirmReload && <div className={e.notice}><p>Bỏ thay đổi trong editor và tải nội dung đã lưu trên máy chủ?</p><Button variant="danger" disabled={busy} onClick={() => { setConfirmReload(false); setRetry(v => v + 1); }}>Bỏ thay đổi và tải lại</Button> <Button variant="text" onClick={() => setConfirmReload(false)}>Giữ nội dung đang sửa</Button></div>}
    {!draft && !error && <p role="status">Đang tải bản nháp…</p>}{draft && body && <>{draft.sourceId ? <section className={s.panel}><h2>Đã tạo nguồn kiểm định</h2><p className={s.id}>{draft.sourceId}</p><p className={s.muted}>Bản nội dung này đã khóa. Cần tiếp tục kiểm định ngữ nghĩa trước khi được chọn vào đề; hiện chưa có worker xử lý tự động nguồn do admin nhập.</p><Button disabled={busy} onClick={clone}>Tạo phiên bản sửa đổi</Button> <Link to="/admin/items">Mở ngân hàng câu hỏi</Link></section> : <p className={e.notice}>{pending ? 'Lần lưu chưa được xác nhận. Thử lưu lại cùng yêu cầu hoặc tải bản máy chủ trước khi chỉnh sửa tiếp.' : dirty ? 'Có thay đổi chưa lưu.' : `Đã lưu lúc ${new Date(draft.updatedAt).toLocaleString('vi-VN')}`}</p>}
      <div className={e.columns}><section className={s.panel}><h2>Nội dung biên tập</h2><fieldset disabled={disabled} className={e.fields}><label className={s.field}>Tên nội bộ<input className={s.input} maxLength={200} value={title} onChange={event => { setTitle(event.target.value); setReport(null); }} /></label><label className={s.field}>Nhập JSON từ tệp<input type="file" accept="application/json,.json" onChange={importFile} /><small className={s.muted}>Tối đa 64 KB. Nội dung được đưa vào editor, chưa tự động lưu.</small></label><label className={s.field}>Câu dẫn<textarea className={s.input} rows={4} maxLength={500} value={body.stem} onChange={event => edit({ ...body, stem: event.target.value })} /><small className={s.muted}>Dùng ___ để đánh dấu một chỗ trống.</small></label>
      {body.options.map((option, index) => <section key={index} className={e.option}><h3>Đáp án {String.fromCharCode(65 + index)}</h3><label className={s.field}>Nội dung<input className={s.input} maxLength={120} value={option.text} onChange={event => edit({ ...body, options: body.options.map((o, i) => i === index ? { ...o, text: event.target.value } : o) })} /></label><label className={s.field}>Giải thích đúng/sai<textarea className={s.input} rows={3} maxLength={2000} value={option.justification} onChange={event => edit({ ...body, options: body.options.map((o, i) => i === index ? { ...o, justification: event.target.value } : o) })} /></label><label><input type="radio" name="correct" checked={body.proposedKey === option.stableId} onChange={() => edit({ ...body, proposedKey: option.stableId })} /> Đáp án đúng</label></section>)}
      <label className={s.field}>Cách suy ra đáp án<textarea className={s.input} rows={5} maxLength={4000} value={body.answerDerivation} onChange={event => edit({ ...body, answerDerivation: event.target.value })} /></label><label className={s.field}>Nguồn và quyền sử dụng<textarea className={s.input} rows={3} maxLength={2000} value={body.rightsReference} onChange={event => edit({ ...body, rightsReference: event.target.value })} /></label></fieldset></section>
      <aside className={`${s.panel} ${e.preview}`}><h2>Xem trước</h2><p className={e.text} lang="en">{body.stem || 'Câu dẫn sẽ xuất hiện ở đây.'}</p><ol type="A">{body.options.map((o, i) => <li key={i}><strong>{o.text || 'Chưa có nội dung'}{o.stableId === body.proposedKey ? ' — Đáp án đúng' : ''}</strong><p className={e.text}>{o.justification}</p></li>)}</ol><h3>Giải thích</h3><p className={e.text}>{body.answerDerivation}</p></aside></div>
      {report && <section className={s.panel} aria-live="polite"><h2>{report.passed ? 'Kiểm tra cấu trúc đạt' : 'Nội dung cần bổ sung'}</h2><ul>{report.findings.map((f, i) => <li key={i}>{findings[f.code] ?? f.code}<span className={s.id}>{f.path}</span></li>)}</ul></section>}
      {!draft.sourceId && <div className={e.toolbar}><Button disabled={busy || (!dirty && !pending) || !title.trim()} onClick={save}>{pending ? 'Thử lưu lại' : 'Lưu nháp'}</Button><Button variant="outline" disabled={busy || dirty || !!pending} onClick={() => validate(false)}>Kiểm tra cấu trúc</Button><Button disabled={busy || dirty || !!pending || !report?.passed} onClick={() => validate(true)}>Tạo nguồn chờ kiểm định</Button></div>}
    </>}</>;
}
