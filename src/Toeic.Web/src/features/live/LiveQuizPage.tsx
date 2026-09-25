import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { errorMessage, jsonBody, learnerRequest } from '../../lib/api/learner';
import s from './LearnerLive.module.css';

interface Enrollment { id: string; title: string; state: string }
interface Question { id: string; prompt: string; stimulus: string | null; options: { id: string; text: string }[] }
interface Result { rawScore: number; maxScore: number; passed: boolean; isCheckpoint: boolean; retryAt: string | null; items: { questionId: string; selectedOptionId: string | null; correctOptionIds: string[]; correct: boolean }[] }
interface Attempt { id: string; revision: number; status: string; deadline: string; serverTime: string; learnerLabel: string; questions: Question[]; answers: { questionId: string; optionId: string | null }[]; result: Result | null }
interface History { items: { id: string; status: string; startedAt: string; passed: boolean | null }[]; hasMore: boolean }

export function LiveQuizPage() {
  const { quizId = '' } = useParams();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]); const [enrollment, setEnrollment] = useState('');
  const [lesson, setLesson] = useState<{ id: string; title: string } | null>(null); const [history, setHistory] = useState<History | null>(null); const [historyPage, setHistoryPage] = useState(1);
  const [attempt, setAttempt] = useState<Attempt | null>(null); const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [seconds, setSeconds] = useState(0); const [refresh, setRefresh] = useState(0);
  const lock = useRef(false); const startOperation = useRef<string>(); const submitOperation = useRef<{ attempt: string; body: object }>();
  const pendingSave = useRef<{ question: string; option: string | null; body: object }>(); const serverClock = useRef({ server: 0, received: 0 }); const expiredFetch = useRef('');
  const code = /^quiz-[a-d]\d+$/i.test(quizId) ? `LESSON-${quizId.slice(5).toUpperCase()}` : /^checkpoint-[a-d]$/i.test(quizId) ? quizId.toUpperCase() : '';
  function accept(value: Attempt) { serverClock.current = { server: Date.parse(value.serverTime), received: Date.now() }; setAttempt(value); }
  useEffect(() => {
    const abort = new AbortController(); setBusy(true); setError(''); setAttempt(null); setLesson(null); setHistory(null); setEnrollment('');
    startOperation.current = undefined; pendingSave.current = undefined; submitOperation.current = undefined;
    learnerRequest<Enrollment[]>('/enrollments', { signal: abort.signal }).then(items => {
      if (!abort.signal.aborted) { const active = items.filter(e => e.state !== 'Archived'); setEnrollments(active); if (active.length === 1) setEnrollment(active[0].id); }
    }).catch(e => { if (!abort.signal.aborted) setError(errorMessage(e)); }).finally(() => { if (!abort.signal.aborted) setBusy(false); });
    return () => abort.abort();
  }, [quizId]);
  useEffect(() => {
    if (!enrollment || !code) return;
    const abort = new AbortController(); setBusy(true); setError(''); setLesson(null); setAttempt(null); setHistory(null); setIndex(0);
    startOperation.current = undefined; pendingSave.current = undefined; submitOperation.current = undefined;
    learnerRequest<{ lesson: { id: string; title: string } }>(`/enrollments/${enrollment}/lessons/${code}`, { signal: abort.signal })
      .then(async result => { if (abort.signal.aborted) return; setLesson(result.lesson);
        const history = await learnerRequest<History>(`/lessons/${result.lesson.id}/quiz-attempts?page=${historyPage}`, { signal: abort.signal });
        if (abort.signal.aborted) return; setHistory(history);
        const active = history.items.find(a => a.status === 'Active');
        if (active) { const value = await learnerRequest<Attempt>(`/quiz-attempts/${active.id}`, { signal: abort.signal }); if (!abort.signal.aborted) accept(value); }
      }).catch(e => { if (!abort.signal.aborted) setError(errorMessage(e)); }).finally(() => { if (!abort.signal.aborted) setBusy(false); });
    return () => abort.abort();
  }, [enrollment, code, refresh, historyPage]);
  useEffect(() => {
    if (!attempt || attempt.result) return;
    function tick() { const now = serverClock.current.server + Date.now() - serverClock.current.received; setSeconds(Math.max(0, Math.ceil((Date.parse(attempt!.deadline) - now) / 1000))); }
    tick(); const id = window.setInterval(tick, 1000); return () => clearInterval(id);
  }, [attempt]);
  async function run(work: () => Promise<void>) {
    if (lock.current || busy) return; lock.current = true; setBusy(true); setError('');
    try { await work(); } catch (e) { setError(errorMessage(e)); } finally { lock.current = false; setBusy(false); }
  }
  useEffect(() => {
    if (attempt && !attempt.result && seconds === 0 && !busy && Date.now() - serverClock.current.received > 900 && expiredFetch.current !== attempt.id) {
      expiredFetch.current = attempt.id;
      void run(async () => { accept(await learnerRequest<Attempt>(`/quiz-attempts/${attempt.id}`)); pendingSave.current = undefined; });
    }
  }, [seconds, busy, attempt]);
  function start() { if (lesson) void run(async () => {
    startOperation.current ??= crypto.randomUUID();
    accept(await learnerRequest<Attempt>(`/lessons/${lesson.id}/quiz-attempts`, jsonBody('POST', { clientOperationId: startOperation.current })));
    startOperation.current = undefined; expiredFetch.current = ''; setIndex(0);
  }); }
  function save(questionId: string, optionId: string | null) { if (!attempt) return; void run(async () => {
    const pending = pendingSave.current ?? { question: questionId, option: optionId, body: { clientOperationId: crypto.randomUUID(), expectedRevision: attempt.revision, questionId, optionId } };
    pendingSave.current = pending;
    const result = await learnerRequest<{ revision: number }>(`/quiz-attempts/${attempt.id}/answer`, jsonBody('PUT', pending.body));
    setAttempt(v => v ? { ...v, revision: result.revision, answers: [...v.answers.filter(a => a.questionId !== pending.question), { questionId: pending.question, optionId: pending.option }] } : v);
    pendingSave.current = undefined;
  }); }
  function submit() { if (!attempt) return; void run(async () => {
    const pending = submitOperation.current ?? { attempt: attempt.id, body: { clientOperationId: crypto.randomUUID(), expectedRevision: attempt.revision } };
    submitOperation.current = pending;
    const result = await learnerRequest<Result>(`/quiz-attempts/${attempt.id}/submit`, jsonBody('POST', pending.body));
    setAttempt(v => v ? { ...v, status: 'Graded', result } : v); submitOperation.current = undefined;
  }); }
  const question = attempt?.questions[index]; const selected = attempt?.answers.find(a => a.questionId === question?.id)?.optionId;
  return <main className={s.page}><header className={s.header}><div><h1>{lesson?.title ?? 'Bài luyện tập'}</h1><p className={s.muted}>Đáp án được lưu vào tài khoản sau mỗi lựa chọn thành công.</p></div><Link to="/learn/roadmap">Về lộ trình</Link></header>
    {error && <div className={s.error} role="alert">{error}</div>}{busy && <p role="status">Đang xử lý…</p>}
    {!code && <p className={s.notice}>Đường dẫn bài luyện tập không hợp lệ. Hãy mở quiz từ bài học.</p>}
    <label className={s.field}>Khóa học<select className={s.select} value={enrollment} disabled={busy || !!attempt && !attempt.result} onChange={e => { setEnrollment(e.target.value); setHistoryPage(1); }}><option value="">Chọn khóa học đã đăng ký</option>{enrollments.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}</select></label>
    {!busy && enrollments.length === 0 && <p>Bạn cần <Link to="/learn/courses">đăng ký khóa học</Link> trước khi làm quiz.</p>}
    <div className={s.actions}><Button variant="outline" disabled={busy} onClick={() => { pendingSave.current = undefined; submitOperation.current = undefined; setRefresh(v => v + 1); }}>Tải lại bài làm</Button>{lesson && !attempt && <Button disabled={busy} onClick={start}>Bắt đầu lượt mới</Button>}</div>
    {attempt && <p className={s.notice}>{attempt.learnerLabel}</p>}
    {attempt && !attempt.result && question && <section className={s.panel}><p role="timer" aria-label="Thời gian còn lại">Còn {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}</p><p className={s.muted}>Câu {index + 1}/{attempt.questions.length}</p>{question.stimulus && <p className={s.prompt}>{question.stimulus}</p>}<h2 className={s.prompt}>{question.prompt}</h2>
      <fieldset disabled={busy || seconds === 0 || !!pendingSave.current || !!submitOperation.current}><legend>Chọn một đáp án</legend>{question.options.map(o => <label key={o.id} className={s.field}><span><input type="radio" name={question.id} checked={selected === o.id} onChange={() => save(question.id, o.id)} /> {o.text}</span></label>)}</fieldset>
      {pendingSave.current && <Button disabled={busy} onClick={() => save(pendingSave.current!.question, pendingSave.current!.option)}>Thử lưu lại lựa chọn</Button>}
      <div className={s.actions}><Button variant="outline" disabled={busy || index === 0 || !!pendingSave.current} onClick={() => setIndex(v => v - 1)}>Câu trước</Button><Button variant="outline" disabled={busy || index + 1 === attempt.questions.length || !!pendingSave.current} onClick={() => setIndex(v => v + 1)}>Câu tiếp</Button><Button variant="text" disabled={busy || !selected || seconds === 0 || !!pendingSave.current || !!submitOperation.current} onClick={() => save(question.id, null)}>Bỏ chọn</Button></div>
      <p>{attempt.answers.filter(a => a.optionId !== null).length}/{attempt.questions.length} câu đã lưu đáp án.</p><Button disabled={busy || !!pendingSave.current} onClick={submit}>{submitOperation.current ? 'Thử nộp lại' : 'Nộp bài'}</Button></section>}
    {attempt?.result && <section className={s.panel}><h2>Kết quả: {attempt.result.rawScore}/{attempt.result.maxScore}</h2><p>{attempt.result.passed ? 'Đã đạt ngưỡng của bài này.' : 'Bạn nên ôn thêm trước lượt tiếp theo.'}</p>{attempt.result.retryAt && <>
      <p>Có thể làm lại từ {new Date(attempt.result.retryAt).toLocaleString('vi-VN')}.</p><Link to="/learn/errors">Xem sổ lỗi sai</Link>
    </>}
      {attempt.questions.map(q => { const r = attempt.result!.items.find(i => i.questionId === q.id); return <article className={s.panel} key={q.id}><h3 className={s.prompt}>{q.prompt}</h3><ul className={s.options}>{q.options.map(o => <li key={o.id} className={r?.correctOptionIds.includes(o.id) ? s.correct : undefined}>{o.text}{r?.selectedOptionId === o.id ? ' — Bạn đã chọn' : ''}{r?.correctOptionIds.includes(o.id) ? ' — Đáp án đúng' : ''}</li>)}</ul></article>; })}
      <Button variant="outline" disabled={busy} onClick={() => { setAttempt(null); setRefresh(v => v + 1); }}>Về danh sách lượt làm</Button></section>}
    {history && (!attempt || attempt.result) && <section className={s.panel}><h2>Lịch sử bài làm</h2>{history.items.length === 0 && <p>Chưa có lượt làm.</p>}{history.items.map(h => <div key={h.id} className={s.actions}><span>{new Date(h.startedAt).toLocaleString('vi-VN')} · {h.status === 'Active' ? 'Đang làm' : h.passed ? 'Đạt' : 'Cần ôn'}</span><Button variant="outline" disabled={busy} onClick={() => void run(async () => { accept(await learnerRequest<Attempt>(`/quiz-attempts/${h.id}`)); setIndex(0); })}>Mở</Button></div>)}<div className={s.actions}><Button variant="outline" disabled={busy || historyPage === 1} onClick={() => setHistoryPage(v => v - 1)}>Trước</Button><Button variant="outline" disabled={busy || !history.hasMore} onClick={() => setHistoryPage(v => v + 1)}>Sau</Button></div></section>}
  </main>;
}
