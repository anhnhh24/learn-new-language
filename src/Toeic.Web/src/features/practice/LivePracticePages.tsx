import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { errorMessage, jsonBody, learnerRequest, LearnerApiError } from '../../lib/api/learner';
import s from '../live/LearnerLive.module.css';
import p from './LivePractice.module.css';

interface Page<T> { items: T[]; hasMore: boolean }
interface Form { id: string; title: string; tier: string; questionCount: number; durationSeconds: number }
interface History { id: string; title: string; status: string; startedAt: string; deadline: string }
interface Question { id: string; section: string; stimulus: string | null; prompt: string; options: { id: string; text: string }[] }
interface ItemResult { questionId: string; selectedOptionId: string | null; correctOptionIds: string[]; correct: boolean; help: { tag: string; explanation: string; evidence: string | null } }
interface Result { rawScore: number; maxScore: number; answeredCount: number; elapsedSeconds: number; submittedAt: string; items: ItemResult[] }
interface Attempt { id: string; title: string; tier: string; learnerLabel: string; status: string; revision: number; startedAt: string; deadline: string; serverTime: string; questions: Question[]; answers: { questionId: string; optionId: string | null }[]; result: Result | null }
interface Draft { attempt: string; clientOperationId: string; expectedRevision: number; questionId: string; optionId: string | null }
const path = (id: string) => `/practice/attempts/${id}`;
function message(e: unknown) {
  if (e instanceof LearnerApiError) {
    const messages: Record<string, string> = { DEVICE_LEASE_CONFLICT: 'Bài này đang được mở ở phiên khác. Bạn có thể chuyển quyền làm bài sang đây.', DEVICE_LEASE_INVALID: 'Quyền làm bài đã hết hạn hoặc chuyển sang phiên khác. Hãy kết nối lại.', ACTIVE_ATTEMPT_CONFLICT: 'Bạn đã có lượt đang làm cho đề này. Mở lại từ lịch sử.', ATTEMPT_DEADLINE_REACHED: 'Đã hết thời gian làm bài. Hãy tải lại để xem kết quả.', RESPONSE_CONFLICT: 'Bài làm đã thay đổi. Hãy tải lại trước khi chọn đáp án mới.', FORM_NOT_AVAILABLE: 'Đề này hiện chưa sẵn sàng để mở lượt mới.' };
    return messages[e.code] ?? (e.status === 404 ? 'Không tìm thấy dữ liệu hoặc chức năng luyện đề chưa được bật.' : errorMessage(e));
  }
  return errorMessage(e);
}
function Pager({ page, more, busy, change }: { page: number; more: boolean; busy: boolean; change: (n: number) => void }) { return <div className={s.actions}><Button variant="outline" disabled={busy || page === 1} onClick={() => change(page - 1)}>Trước</Button><span>Trang {page}</span><Button variant="outline" disabled={busy || !more} onClick={() => change(page + 1)}>Sau</Button></div>; }

export function LivePracticeListPage() {
  const navigate = useNavigate(); const [forms, setForms] = useState<Page<Form> | null>(null); const [history, setHistory] = useState<Page<History> | null>(null);
  const [formPage, setFormPage] = useState(1); const [historyPage, setHistoryPage] = useState(1); const [refresh, setRefresh] = useState(0); const [busy, setBusy] = useState(true); const [error, setError] = useState('');
  const lock = useRef(false); const operation = useRef<{ form: string; id: string }>();
  useEffect(() => {
    const abort = new AbortController(); setBusy(true); setError(''); setForms(null); setHistory(null);
    Promise.all([learnerRequest<Page<Form>>(`/practice/forms?page=${formPage}`, { signal: abort.signal }), learnerRequest<Page<History>>(`/practice/attempts?page=${historyPage}`, { signal: abort.signal })])
      .then(([f, h]) => { if (!abort.signal.aborted) { setForms(f); setHistory(h); } }).catch(e => { if (!abort.signal.aborted) setError(message(e)); }).finally(() => { if (!abort.signal.aborted) setBusy(false); });
    return () => abort.abort();
  }, [formPage, historyPage, refresh]);
  async function start(form: Form) {
    if (busy || lock.current) return; lock.current = true; setBusy(true); setError('');
    if (operation.current?.form !== form.id) operation.current = { form: form.id, id: crypto.randomUUID() };
    try { const attempt = await learnerRequest<Attempt>('/practice/attempts', jsonBody('POST', { formId: form.id, clientOperationId: operation.current.id })); navigate(`/learn/practice/${attempt.id}`); }
    catch (e) { setError(message(e)); } finally { lock.current = false; setBusy(false); }
  }
  return <main className={s.page}><header className={s.header}><div><h1>Luyện đề</h1><p className={s.muted}>Luyện Part 5 và Part 7 với các bộ câu hỏi đang được phép sử dụng.</p></div><Button variant="outline" disabled={busy} onClick={() => setRefresh(v => v + 1)}>Làm mới</Button></header>
    {error && <p role="alert" className={s.error}>{error}</p>}{busy && <p role="status">Đang tải…</p>}
    {forms && <><section className={s.grid}>{forms.items.map(f => <article className={s.panel} key={f.id}><p className={s.muted}>{f.tier === 'BetaPractice' ? 'Luyện tập Beta' : 'Kiểm định bằng dữ liệu'}</p><h2>{f.title}</h2><p>{f.questionCount} câu · {Math.ceil(f.durationSeconds / 60)} phút</p><Button disabled={busy} onClick={() => start(f)}>Bắt đầu luyện</Button></article>)}</section>{forms.items.length === 0 && <p className={s.notice}>Chưa có đề luyện tập sẵn sàng. Các đề chưa qua kiểm định sẽ không xuất hiện ở đây.</p>}<Pager page={formPage} more={forms.hasMore} busy={busy} change={setFormPage} /></>}
    {history && <section className={s.panel}><h2>Lịch sử bài làm</h2>{history.items.length === 0 && <p>Chưa có bài làm.</p>}{history.items.map(h => <article key={h.id} className={s.panel}><h3>{h.title}</h3><p className={s.muted}>{new Date(h.startedAt).toLocaleString('vi-VN')} · {h.status === 'Active' ? 'Đang làm / chờ chấm khi hết giờ' : 'Đã chấm'}</p><Link to={`/learn/practice/${h.id}${h.status === 'Graded' ? '/result' : ''}`}>{h.status === 'Graded' ? 'Xem kết quả' : 'Tiếp tục bài làm'}</Link></article>)}<Pager page={historyPage} more={history.hasMore} busy={busy} change={setHistoryPage} /></section>}
  </main>;
}

export function LiveExamRoomPage() {
  const { attemptId = '' } = useParams();
  return <ExamRoom key={attemptId} />;
}

function ExamRoom() {
  const { attemptId = '' } = useParams(); const navigate = useNavigate();
  const [attempt, setAttempt] = useState<Attempt | null>(null); const [index, setIndex] = useState(0); const [busy, setBusy] = useState(false); const [held, setHeld] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [seconds, setSeconds] = useState<number | null>(null);
  const [pending, setPending] = useState<Draft | null>(null); const [flags, setFlags] = useState<string[]>([]); const [savedAt, setSavedAt] = useState('');
  const lock = useRef(false); const token = useRef(Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join(''));
  const serverTime = useRef({ value: 0, received: 0 }); const submit = useRef<{ clientOperationId: string; expectedRevision: number }>(); const finalized = useRef(false);
  const draftKey = `toeic_practice_draft_${attemptId}`;
  function accept(value: Attempt) { serverTime.current = { value: Date.parse(value.serverTime), received: performance.now() }; setAttempt(value); if (value.result) { try { sessionStorage.removeItem(draftKey); } catch { /* storage unavailable */ } navigate(`/learn/practice/${attemptId}/result`, { replace: true }); } }
  async function run(work: () => Promise<void>) {
    if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try { await work(); } catch (e) { setError(message(e)); if (e instanceof LearnerApiError && ['DEVICE_LEASE_INVALID', 'DEVICE_LEASE_CONFLICT'].includes(e.code)) setHeld(false); } finally { lock.current = false; setBusy(false); }
  }
  async function connect(takeover = false) {
    await run(async () => {
      const value = await learnerRequest<Attempt>(path(attemptId)); accept(value); if (value.result) return; submit.current = undefined;
      await learnerRequest(`${path(attemptId)}/lease`, jsonBody('PUT', { token: token.current, allowTakeover: takeover })); setHeld(true);
    });
  }
  useEffect(() => {
    setAttempt(null); setHeld(false); setSeconds(null); setPending(null); setFlags([]); setIndex(0); finalized.current = false; submit.current = undefined;
    try { const value = JSON.parse(sessionStorage.getItem(draftKey) ?? 'null') as Draft | null; if (value?.attempt === attemptId && typeof value.clientOperationId === 'string' && typeof value.questionId === 'string' && typeof value.expectedRevision === 'number' && (value.optionId === null || typeof value.optionId === 'string')) setPending(value); } catch { /* ignore malformed local draft */ }
    void connect();
  }, [attemptId]);
  useEffect(() => {
    if (!attempt || attempt.result) return;
    const tick = () => setSeconds(Math.max(0, Math.ceil((Date.parse(attempt.deadline) - serverTime.current.value - (performance.now() - serverTime.current.received)) / 1000)));
    tick(); const interval = window.setInterval(tick, 1000); return () => clearInterval(interval);
  }, [attempt]);
  useEffect(() => {
    if (!held || !attempt || attempt.result) return;
    const interval = window.setInterval(() => { if (!lock.current) void run(async () => { await learnerRequest(`${path(attemptId)}/lease`, jsonBody('PUT', { token: token.current, allowTakeover: false })); }); }, 20000);
    return () => clearInterval(interval);
  }, [held, attempt?.id]);
  useEffect(() => {
    if (seconds !== 0 || busy || !attempt || finalized.current) return;
    finalized.current = true; void run(async () => accept(await learnerRequest<Attempt>(path(attemptId))));
  }, [seconds, busy, attempt]);
  useEffect(() => {
    if (!pending) return; const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [pending]);
  async function save(questionId: string, optionId: string | null) {
    if (!attempt || !held || lock.current) return;
    const draft = pending ?? { attempt: attemptId, clientOperationId: crypto.randomUUID(), expectedRevision: attempt.revision, questionId, optionId };
    setPending(draft); try { sessionStorage.setItem(draftKey, JSON.stringify(draft)); } catch { setNotice('Không lưu được bản nháp trong trình duyệt. Giữ trang mở cho đến khi đáp án được lưu.'); }
    await run(async () => {
      const result = await learnerRequest<{ revision: number; savedAt: string }>(`${path(attemptId)}/answer`, jsonBody('PUT', { ...draft, leaseToken: token.current }));
      accept(await learnerRequest<Attempt>(path(attemptId)));
      setPending(null); setSavedAt(result.savedAt); try { sessionStorage.removeItem(draftKey); } catch { /* replay remains safe */ }
    });
  }
  async function finish() {
    if (!attempt || pending || lock.current) return;
    submit.current ??= { clientOperationId: crypto.randomUUID(), expectedRevision: attempt.revision };
    await run(async () => { await learnerRequest(`${path(attemptId)}/submit`, jsonBody('POST', { ...submit.current, leaseToken: token.current })); navigate(`/learn/practice/${attemptId}/result`, { replace: true }); });
  }
  const question = attempt?.questions[index]; const selected = attempt?.answers.find(a => a.questionId === question?.id)?.optionId;
  return <main className={p.room}><header className={p.toolbar}><Link to="/learn/practice">← Danh sách đề</Link><strong>{attempt?.title ?? 'Phòng luyện đề'}</strong><span role="timer">{seconds === null ? 'Đang đồng bộ giờ' : `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`}</span></header>
    <div className={p.body}>{error && <p role="alert" className={s.error}>{error}</p>}{notice && <p className={s.notice}>{notice}</p>}<div className={s.actions}><Button variant="outline" disabled={busy} onClick={() => connect()}>Kết nối lại</Button>{attempt && !held && <Button disabled={busy} onClick={() => connect(true)}>Chuyển quyền làm bài sang đây</Button>}</div>
      {pending && <div className={s.notice}>Có lựa chọn chưa được xác nhận lưu. <Button disabled={busy || !held || seconds === 0} onClick={() => save(pending.questionId, pending.optionId)}>Thử lưu lại</Button> <Button variant="text" disabled={busy} onClick={() => { setPending(null); try { sessionStorage.removeItem(draftKey); } catch { /* no-op */ } void connect(); }}>Bỏ bản nháp và tải từ máy chủ</Button></div>}
      {attempt && <><p className={s.muted}>{attempt.learnerLabel} · {attempt.answers.filter(a => a.optionId !== null).length}/{attempt.questions.length} câu đã lưu</p><div className={p.navigator} aria-label="Điều hướng câu hỏi">{attempt.questions.map((q, i) => <button type="button" key={q.id} disabled={busy} aria-current={i === index ? 'step' : undefined} onClick={() => setIndex(i)} className={i === index ? p.current : attempt.answers.some(a => a.questionId === q.id && a.optionId !== null) ? p.answered : undefined}>{i + 1}{flags.includes(q.id) ? ' *' : ''}</button>)}</div></>}
      {question && <div className={question.stimulus ? p.columns : undefined}>{question.stimulus && <section className={`${s.panel} ${p.passage}`} aria-label="Bài đọc"><h2>Bài đọc</h2><p className={s.prompt} lang="en">{question.stimulus}</p></section>}<section className={s.panel}><p className={s.muted}>{question.section} · Câu {index + 1}</p><h1 className={p.question} lang="en">{question.prompt}</h1><fieldset disabled={!held || busy || seconds === 0 || !!pending || !!submit.current}><legend>Chọn đáp án</legend>{question.options.map(o => <label key={o.id} className={s.field}><span><input type="radio" name={question.id} checked={selected === o.id} onChange={() => save(question.id, o.id)} /> {o.text}</span></label>)}</fieldset><div className={s.actions}><Button variant="text" disabled={busy || !held || !selected || !!pending || !!submit.current || seconds === 0} onClick={() => save(question.id, null)}>Bỏ chọn</Button><Button variant="outline" disabled={busy} onClick={() => setFlags(v => v.includes(question.id) ? v.filter(id => id !== question.id) : [...v, question.id])}>{flags.includes(question.id) ? 'Bỏ đánh dấu' : 'Đánh dấu xem lại'}</Button></div><p className={s.muted} role="status">{busy ? 'Đang đồng bộ…' : savedAt ? `Đã lưu lúc ${new Date(savedAt).toLocaleTimeString('vi-VN')}` : 'Chỉ đáp án được máy chủ xác nhận mới được tính vào bài làm.'}</p></section></div>}
      {attempt && <div className={s.actions}><Button variant="outline" disabled={busy || index === 0} onClick={() => setIndex(v => v - 1)}>Câu trước</Button><Button variant="outline" disabled={busy || index === attempt.questions.length - 1} onClick={() => setIndex(v => v + 1)}>Câu tiếp</Button><Button disabled={busy || !!pending || !held} onClick={finish}>{submit.current ? 'Thử nộp lại' : 'Nộp bài'}</Button></div>}
    </div></main>;
}

export function LiveExamResultPage() {
  const { attemptId = '' } = useParams(); const [attempt, setAttempt] = useState<Attempt | null>(null); const [error, setError] = useState(''); const [refresh, setRefresh] = useState(0);
  const [question, setQuestion] = useState(''); const [category, setCategory] = useState('WRONG_KEY'); const [comment, setComment] = useState(''); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(''); const lock = useRef(false);
  useEffect(() => { const abort = new AbortController(); setAttempt(null); setError(''); learnerRequest<Attempt>(path(attemptId), { signal: abort.signal }).then(value => { if (!abort.signal.aborted) { setAttempt(value); setQuestion(value.questions[0]?.id ?? ''); } }).catch(e => { if (!abort.signal.aborted) setError(message(e)); }); return () => abort.abort(); }, [attemptId, refresh]);
  async function report(event: FormEvent) {
    event.preventDefault(); if (lock.current) return; lock.current = true; setBusy(true); setError(''); setNotice('');
    try { await learnerRequest('/practice/reports', jsonBody('POST', { attemptId, itemRevisionId: question, category, comment })); setNotice('Đã ghi nhận báo lỗi câu hỏi.'); setComment(''); } catch (e) { setError(message(e)); } finally { lock.current = false; setBusy(false); }
  }
  const result = attempt?.result;
  return <main className={s.page}><header className={s.header}><div><h1>Kết quả luyện đề</h1><p className={s.muted}>{attempt?.title}</p></div><Link to="/learn/practice">Về danh sách đề</Link></header>{error && <p className={s.error} role="alert">{error}</p>}<Button variant="outline" onClick={() => setRefresh(v => v + 1)}>Tải lại</Button>{!attempt && !error && <p role="status">Đang tải kết quả…</p>}{attempt && !result && <p className={s.notice}>Bài chưa được nộp. <Link to={`/learn/practice/${attemptId}`}>Tiếp tục làm bài</Link></p>}
    {attempt && result && <><p className={s.notice}>{attempt.learnerLabel}</p><section className={s.grid}><div className={s.panel}><span>Điểm thô</span><strong className={s.value}>{result.rawScore}/{result.maxScore}</strong></div><div className={s.panel}><span>Số câu đã trả lời</span><strong className={s.value}>{result.answeredCount}/{attempt.questions.length}</strong></div><div className={s.panel}><span>Thời gian lượt làm</span><strong className={s.value}>{Math.floor(result.elapsedSeconds / 60)} phút {result.elapsedSeconds % 60} giây</strong></div></section><p className={s.muted}>Đây là kết quả bài luyện tập, không phải điểm TOEIC chính thức. Thời gian lượt làm tính từ lúc bắt đầu đến lúc nộp, có thể gồm thời gian rời trang.</p>
      <section className={s.panel}><h2>Theo từng Part</h2>{Array.from(new Set(attempt.questions.map(q => q.section))).map(part => { const ids = new Set(attempt.questions.filter(q => q.section === part).map(q => q.id)); return <p key={part}>{part}: {result.items.filter(i => ids.has(i.questionId) && i.correct).length}/{ids.size} câu đúng</p>; })}</section>
      {attempt.questions.map((q, i) => { const review = result.items.find(r => r.questionId === q.id)!; return <article key={q.id} className={s.panel}><h2>Câu {i + 1} · {review.correct ? 'Đúng' : review.selectedOptionId ? 'Chưa đúng' : 'Bỏ trống'}</h2>{q.stimulus && <details><summary>Xem bài đọc</summary><p className={s.prompt}>{q.stimulus}</p></details>}<p className={s.prompt}>{q.prompt}</p><ol className={s.options} type="A">{q.options.map(o => <li key={o.id} className={review.correctOptionIds.includes(o.id) ? s.correct : undefined}>{o.text}{review.selectedOptionId === o.id ? ' — Bạn chọn' : ''}{review.correctOptionIds.includes(o.id) ? ' — Đáp án đúng' : ''}</li>)}</ol><h3>Giải thích</h3><p className={s.prompt}>{review.help.explanation}</p>{review.help.evidence && <blockquote className={s.prompt}>{review.help.evidence}</blockquote>}</article>; })}
      <section className={s.panel}><h2>Báo lỗi câu hỏi</h2>{notice && <p className={s.notice} role="status">{notice}</p>}<form onSubmit={report}><label className={s.field}>Câu hỏi<select className={s.select} disabled={busy} value={question} onChange={e => setQuestion(e.target.value)}>{attempt.questions.map((q, i) => <option key={q.id} value={q.id}>Câu {i + 1}</option>)}</select></label><label className={s.field}>Vấn đề<select className={s.select} disabled={busy} value={category} onChange={e => setCategory(e.target.value)}>{[['WRONG_KEY', 'Đáp án'], ['AMBIGUOUS', 'Nhiều cách hiểu'], ['EXPLANATION', 'Lời giải'], ['TYPO', 'Lỗi chữ'], ['TECHNICAL', 'Lỗi kỹ thuật']].map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className={s.field}>Mô tả<textarea maxLength={2000} disabled={busy} value={comment} onChange={e => setComment(e.target.value)} /></label><Button type="submit" disabled={busy || !question}>Gửi báo lỗi</Button></form></section><Link to="/learn/errors">Mở sổ lỗi sai</Link>
    </>}
  </main>;
}
