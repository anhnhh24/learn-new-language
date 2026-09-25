import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { errorMessage, jsonBody, learnerRequest } from '../../lib/api/learner';
import s from './LearnerLive.module.css';

type Page<T> = { items: T[]; page: number; pageSize: number; hasMore: boolean };
function ErrorNotice({ message }: { message: string }) { return message ? <div role="alert" className={s.error}>{message} <Link to="/auth/login">Đăng nhập</Link></div> : null; }
function Pager({ page, more, busy, setPage }: { page: number; more: boolean; busy: boolean; setPage: (p: number) => void }) {
  return <div className={s.actions}><Button variant="outline" disabled={busy || page === 1} onClick={() => setPage(page - 1)}>Trước</Button><span>Trang {page}</span><Button variant="outline" disabled={busy || !more} onClick={() => setPage(page + 1)}>Sau</Button></div>;
}
function Stat({ label, value }: { label: string; value: ReactNode }) { return <div className={s.panel}><span className={s.muted}>{label}</span><strong className={s.value}>{value}</strong></div>; }

interface Dashboard {
  timeZone: string;
  overview: { completedLessons: number; publishedLessons: number; meanFirstQuizAccuracy: number | null; openErrors: number; dueCards: number; gradedQuizAttempts: number };
  courses: Page<{ enrollmentId: string; title: string; completedLessons: number; publishedLessons: number; passedCheckpoints: number; totalCheckpoints: number }>;
  days: { date: string; lessonsCompleted: number; quizzesSubmitted: number; cardReviews: number; earlyCardReviews: number }[];
}
export function LiveDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [days, setDays] = useState(30); const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0); const [busy, setBusy] = useState(true); const [error, setError] = useState('');
  useEffect(() => {
    const abort = new AbortController(); setBusy(true); setError(''); setData(null);
    learnerRequest<Dashboard>(`/dashboard?days=${days}&coursePage=${page}`, { signal: abort.signal })
      .then(setData).catch(e => { if (!abort.signal.aborted) setError(errorMessage(e)); })
      .finally(() => { if (!abort.signal.aborted) setBusy(false); });
    return () => abort.abort();
  }, [days, page, refresh]);
  return <main className={s.page}>
    <header className={s.header}><div><h1>Tiến độ học tập</h1><p className={s.muted}>Nhìn lại những bài đã hoàn thành và việc cần ôn tiếp.</p></div><label>Khoảng thời gian <select className={s.select} value={days} onChange={e => setDays(Number(e.target.value))}>{[7, 30, 90].map(n => <option key={n} value={n}>{n} ngày</option>)}</select></label></header>
    <ErrorNotice message={error} /><Button variant="outline" disabled={busy} onClick={() => setRefresh(v => v + 1)}>Tải lại</Button>
    {busy && <p role="status">Đang tải tiến độ…</p>}
    {data && <><div className={s.grid}>
      <Stat label="Bài đã hoàn thành" value={`${data.overview.completedLessons}/${data.overview.publishedLessons}`} />
      <Stat label="Độ chính xác quiz lần đầu" value={data.overview.meanFirstQuizAccuracy === null ? 'Chưa có dữ liệu' : `${Math.round(data.overview.meanFirstQuizAccuracy * 100)}%`} />
      <Stat label="Lỗi đang cần ôn" value={data.overview.openErrors} /><Stat label="Thẻ đến hạn" value={data.overview.dueCards} />
    </div><section className={s.panel}><h2>Khóa học của bạn</h2>{data.courses.items.length === 0 && <p>Chưa có khóa học. <Link to="/learn/courses">Khám phá khóa học</Link></p>}
      {data.courses.items.map(c => <article key={c.enrollmentId} className={s.panel}><h3>{c.title}</h3><p>{c.completedLessons}/{c.publishedLessons} bài hoàn thành · {c.passedCheckpoints}/{c.totalCheckpoints} checkpoint đã đạt</p><progress className={s.progress} aria-label={`Tiến độ ${c.title}`} max={Math.max(1, c.publishedLessons)} value={c.completedLessons} /></article>)}
      <Pager page={page} more={data.courses.hasMore} busy={busy} setPage={setPage} /></section>
      <section className={s.panel}><h2>Hoạt động theo ngày</h2><p className={s.muted}>Múi giờ {data.timeZone}. Hoạt động chỉ đọc trang chưa được tính vào bảng này.</p><div className={s.tableWrap}><table className={s.table}><thead><tr><th scope="col">Ngày</th><th scope="col">Bài hoàn thành</th><th scope="col">Quiz đã nộp</th><th scope="col">Lượt ôn thẻ</th><th scope="col">Ôn sớm</th></tr></thead><tbody>{data.days.map(d => <tr key={d.date}><td>{d.date}</td><td>{d.lessonsCompleted}</td><td>{d.quizzesSubmitted}</td><td>{d.cardReviews}</td><td>{d.earlyCardReviews}</td></tr>)}</tbody></table></div></section>
      <p className={s.muted}>Điểm lần đầu là trung bình các bài đã nộp, không quy đổi thành điểm TOEIC.</p></>}
  </main>;
}

interface ErrorEntry {
  id: string; state: string; primaryTag: string; revision: number; lastSeenAt: string;
  snapshot: null | { question: { prompt: string; stimulus: string | null; options: { id: string; text: string }[] }; selectedOptionId: string; correctOptionIds: string[] };
}
const stateLabels: Record<string, string> = { Open: 'Cần ôn', Improving: 'Đang cải thiện', Resolved: 'Đã khắc phục', Ignored: 'Đã bỏ qua' };
export function LiveErrorNotebookPage() {
  const [data, setData] = useState<Page<ErrorEntry> | null>(null); const [state, setState] = useState('Open'); const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  useEffect(() => {
    const abort = new AbortController(); setBusy(true); setError(''); setData(null);
    learnerRequest<Page<ErrorEntry>>(`/errors?page=${page}${state ? `&state=${state}` : ''}`, { signal: abort.signal })
      .then(setData).catch(e => { if (!abort.signal.aborted) setError(errorMessage(e)); }).finally(() => { if (!abort.signal.aborted) setBusy(false); });
    return () => abort.abort();
  }, [page, state, refresh]);
  async function change(entry: ErrorEntry) {
    if (saving) return; setSaving(true); setError('');
    try { await learnerRequest(`/errors/${entry.id}`, jsonBody('PUT', { expectedRevision: entry.revision, action: entry.state === 'Ignored' ? 'Reopen' : 'Ignore' })); setRefresh(v => v + 1); }
    catch (e) { setError(errorMessage(e)); } finally { setSaving(false); }
  }
  return <main className={s.page}><header className={s.header}><div><h1>Sổ lỗi sai</h1><p className={s.muted}>Xem lại những câu đã trả lời sai và đáp án từ bài làm của bạn.</p></div><label>Trạng thái <select className={s.select} disabled={saving} value={state} onChange={e => { setState(e.target.value); setPage(1); }}><option value="">Tất cả</option>{Object.entries(stateLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label></header>
    <ErrorNotice message={error} /><Button variant="outline" disabled={busy || saving} onClick={() => setRefresh(v => v + 1)}>Tải lại</Button>
    {busy && <p role="status">Đang tải sổ lỗi…</p>}{data?.items.length === 0 && <p className={s.notice}>Chưa có lỗi phù hợp với bộ lọc này.</p>}
    {data?.items.map(e => <article className={s.panel} key={e.id}><p className={s.muted}>{e.primaryTag} · {stateLabels[e.state]} · {new Date(e.lastSeenAt).toLocaleDateString('vi-VN')}</p>
      {e.snapshot ? <>{e.snapshot.question.stimulus && <p className={s.prompt}>{e.snapshot.question.stimulus}</p>}<h2 className={s.prompt}>{e.snapshot.question.prompt}</h2><ol className={s.options} type="A">{e.snapshot.question.options.map(o => <li className={e.snapshot!.correctOptionIds.includes(o.id) ? s.correct : undefined} key={o.id}>{o.text}{e.snapshot!.selectedOptionId === o.id ? ' — Bạn đã chọn' : ''}{e.snapshot!.correctOptionIds.includes(o.id) ? ' — Đáp án đúng' : ''}</li>)}</ol></> : <p>Chưa có chi tiết câu hỏi cho bản ghi cũ này.</p>}
      {e.state !== 'Resolved' && <Button variant="outline" disabled={saving || busy} onClick={() => change(e)}>{e.state === 'Ignored' ? 'Đưa lại vào danh sách ôn' : 'Bỏ qua lỗi này'}</Button>}</article>)}
    {data && <Pager page={page} more={data.hasMore} busy={busy || saving} setPage={setPage} />}
  </main>;
}

interface Card { id: string; term: string; meaning: string; example: string; revision: number; archived: boolean }
interface Front { id: string; term: string; revision: number; isNew: boolean }
interface Answer { revealId: string; cardId: string; revision: number; meaning: string; example: string }
export function LiveFlashcardPage() {
  const [queue, setQueue] = useState<Front[]>([]); const [remaining, setRemaining] = useState(0); const [answer, setAnswer] = useState<Answer | null>(null);
  const [library, setLibrary] = useState<Page<Card> | null>(null); const [page, setPage] = useState(1); const [archived, setArchived] = useState(false);
  const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false); const [loaded, setLoaded] = useState(false); const lock = useRef(false);
  const [term, setTerm] = useState(''); const [meaning, setMeaning] = useState(''); const [example, setExample] = useState(''); const [editing, setEditing] = useState<Card | null>(null);
  const [refresh, setRefresh] = useState(0);
  const createOperation = useRef<{ key: string; id: string }>();
  const pendingRating = useRef<{ card: string; rating: string; body: object }>();
  const current = queue[0];
  useEffect(() => {
    const abort = new AbortController(); setBusy(true); setError(''); setLoaded(false); setAnswer(null); setQueue([]); setLibrary(null);
    Promise.all([learnerRequest<{ items: Front[]; newCardsRemaining: number }>('/flashcards/queue', { signal: abort.signal }), learnerRequest<Page<Card>>(`/flashcards?page=${page}&archived=${archived}`, { signal: abort.signal })])
      .then(([q, cards]) => { if (!abort.signal.aborted) { setQueue(q.items); setRemaining(q.newCardsRemaining); setLibrary(cards); setLoaded(true); pendingRating.current = undefined; } })
      .catch(e => { if (!abort.signal.aborted) setError(errorMessage(e)); }).finally(() => { if (!abort.signal.aborted) setBusy(false); });
    return () => abort.abort();
  }, [page, archived, refresh]);
  async function action(work: () => Promise<void>) {
    if (lock.current || busy) return; lock.current = true; setBusy(true); setError(''); setNotice('');
    try { await work(); } catch (e) { setError(errorMessage(e)); } finally { lock.current = false; setBusy(false); }
  }
  function reveal() { if (current) void action(async () => { const result = await learnerRequest<Answer>(`/flashcards/${current.id}/reveal`, jsonBody('POST', { expectedRevision: current.revision })); setAnswer(result); if (current.isNew) { setRemaining(v => Math.max(0, v - 1)); setQueue(v => v.map(c => c.id === current.id ? { ...c, isNew: false } : c)); } }); }
  function rate(rating: string) { if (!current || !answer) return; void action(async () => {
    const old = pendingRating.current;
    if (old && (old.card !== current.id || old.rating !== rating)) throw new Error('Pending rating');
    const pending = old ?? { card: current.id, rating, body: { clientOperationId: crypto.randomUUID(), revealId: answer.revealId, expectedRevision: answer.revision, rating } };
    pendingRating.current = pending;
    const result = await learnerRequest<{ dueAt: string }>(`/flashcards/${current.id}/reviews`, jsonBody('POST', pending.body));
    pendingRating.current = undefined; setQueue(v => v.slice(1)); setAnswer(null); setNotice(`Đã lưu. Lịch ôn tiếp: ${new Date(result.dueAt).toLocaleString('vi-VN')}.`);
  }); }
  function clearForm() { setEditing(null); setTerm(''); setMeaning(''); setExample(''); }
  function save(event: FormEvent) { event.preventDefault(); void action(async () => {
    const content = { term, meaning, example }; const key = JSON.stringify(content);
    if (editing) await learnerRequest(`/flashcards/${editing.id}`, jsonBody('PUT', { ...content, expectedRevision: editing.revision, archived: editing.archived }));
    else { if (createOperation.current?.key !== key) createOperation.current = { key, id: crypto.randomUUID() }; await learnerRequest('/flashcards', jsonBody('POST', { ...content, clientOperationId: createOperation.current.id })); createOperation.current = undefined; }
    clearForm(); setRefresh(v => v + 1); setNotice('Đã lưu thẻ.');
  }); }
  function toggleArchive(card: Card) { void action(async () => { await learnerRequest(`/flashcards/${card.id}`, jsonBody('PUT', { ...card, expectedRevision: card.revision, archived: !card.archived })); if (editing?.id === card.id) clearForm(); setRefresh(v => v + 1); }); }
  return <main className={s.page}><header className={s.header}><div><h1>Ôn từ vựng</h1><p className={s.muted}>Tự nhớ nghĩa trước khi mở đáp án. Thẻ đến hạn được ưu tiên trước thẻ mới.</p></div><Button variant="outline" disabled={busy} onClick={() => setRefresh(v => v + 1)}>Tải lại hàng đợi</Button></header>
    <ErrorNotice message={error} />{notice && <p role="status" className={s.notice}>{notice}</p>}{busy && <p role="status">Đang xử lý…</p>}
    {loaded && <><p className={s.muted}>Có thể giới thiệu thêm {remaining} thẻ mới hôm nay.</p>{current ? <section className={`${s.panel} ${s.card}`}><p className={s.muted}>{queue.length} thẻ trong lượt này</p><h2 className={s.term}>{current.term}</h2>
      {!answer ? <Button disabled={busy} onClick={reveal}>Hiện đáp án</Button> : <><div className={s.answer}><p>{answer.meaning}</p><p lang="en">{answer.example}</p></div><div className={s.actions}>{[['Forgot', 'Quên'], ['Hard', 'Khó'], ['Remembered', 'Nhớ'], ['Easy', 'Dễ']].map(([value, label]) => <Button key={value} variant="outline" disabled={busy || !!pendingRating.current && pendingRating.current.rating !== value} onClick={() => rate(value)}>{pendingRating.current?.rating === value ? `Thử lưu lại: ${label}` : label}</Button>)}</div></>}</section> : <p className={s.notice}>Hiện không có thẻ cần ôn trong hàng đợi. Bạn có thể thêm thẻ hoặc tải lại sau.</p>}</>}
    <section className={s.panel}><h2>{editing ? 'Sửa thẻ' : 'Thêm thẻ của bạn'}</h2><form onSubmit={save}><label className={s.field}>Từ hoặc cụm từ<input required maxLength={200} disabled={busy} value={term} onChange={e => setTerm(e.target.value)} /></label><label className={s.field}>Nghĩa theo ngữ cảnh<textarea required maxLength={2000} disabled={busy} value={meaning} onChange={e => setMeaning(e.target.value)} /></label><label className={s.field}>Ví dụ<textarea maxLength={2000} disabled={busy} value={example} onChange={e => setExample(e.target.value)} /></label><div className={s.actions}><Button disabled={busy} type="submit">Lưu thẻ</Button>{editing && <Button variant="text" type="button" disabled={busy} onClick={clearForm}>Hủy sửa</Button>}</div></form></section>
    <section className={s.panel}><h2>Thư viện thẻ</h2><label><input type="checkbox" checked={archived} disabled={busy} onChange={e => { setArchived(e.target.checked); setPage(1); }} /> Xem thẻ đã lưu trữ</label>
      {library?.items.length === 0 && <p>Chưa có thẻ trong danh sách này.</p>}{library?.items.map(c => <article className={s.panel} key={c.id}><h3>{c.term}</h3><p>{c.meaning}</p><div className={s.actions}><Button variant="outline" disabled={busy} onClick={() => { setEditing(c); setTerm(c.term); setMeaning(c.meaning); setExample(c.example); }}>Sửa</Button><Button variant="text" disabled={busy} onClick={() => toggleArchive(c)}>{c.archived ? 'Khôi phục' : 'Lưu trữ'}</Button></div></article>)}
      {library && <Pager page={page} more={library.hasMore} busy={busy} setPage={setPage} />}</section>
  </main>;
}
