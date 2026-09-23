import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import {
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Cpu,
} from 'lucide-react';
import { api } from '../../../lib/api/client';
import { CandidateQualityReview, GenerationJobSummary } from '../../../types/admin';
import styles from './QualityDashboard.module.css';

export function QualityDashboardPage() {
  const [candidates, setCandidates] = useState<CandidateQualityReview[]>([]);
  const [jobs, setJobs] = useState<GenerationJobSummary[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateQualityReview | null>(null);
  const [quarantineReason, setQuarantineReason] = useState('');
  const [isQuarantineModalOpen, setIsQuarantineModalOpen] = useState(false);

  useEffect(() => {
    api.getQualityCandidates().then(setCandidates);
    api.getGenerationJobs().then(setJobs);
  }, []);

  const openQuarantine = (c: CandidateQualityReview) => {
    setSelectedCandidate(c);
    setQuarantineReason(c.criticReview.findings[0] || 'Cần xem xét lại chất lượng học thuật');
    setIsQuarantineModalOpen(true);
  };

  const handleConfirmQuarantine = async () => {
    if (!selectedCandidate) return;
    await api.quarantineCandidate(selectedCandidate.candidateId, quarantineReason);
    setCandidates((prev) =>
      prev.map((c) =>
        c.candidateId === selectedCandidate.candidateId
          ? { ...c, quarantineStatus: 'Quarantined', quarantineReason }
          : c
      )
    );
    setIsQuarantineModalOpen(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Cổng kiểm định chất lượng nội dung AI</h1>
          <p className={styles.subtitle}>
            Controlled AI Item Factory: Quản lý vòng đời Candidate, Dual-solver Consensus và Bộ lọc Critic (UI-15 & SRS Mục 28).
          </p>
        </div>
      </header>

      {/* Generation Jobs Overview Cards */}
      <section className={styles.jobsSection} aria-labelledby="jobs-heading">
        <div className={styles.sectionHeader}>
          <Cpu size={18} className={styles.sectionIcon} />
          <h2 id="jobs-heading">Tiến độ tác vụ sinh câu hỏi (Generation Jobs)</h2>
        </div>

        <div className={styles.jobsGrid}>
          {jobs.map((job) => (
            <div key={job.jobId} className={styles.jobCard}>
              <div className={styles.jobTop}>
                <span className={styles.jobId}>{job.jobId}</span>
                <Badge variant="success">Hoàn thành</Badge>
              </div>

              <div className={styles.jobBlueprint}>
                <strong>{job.blueprintVersion}</strong> • {job.part}
              </div>

              <div className={styles.jobStats}>
                <div>
                  <span className={styles.statLabel}>Chấp thuận</span>
                  <strong className="text-tabular" style={{ color: 'var(--color-success)' }}>
                    {job.acceptedCount}
                  </strong>
                </div>
                <div>
                  <span className={styles.statLabel}>Từ chối</span>
                  <strong className="text-tabular" style={{ color: 'var(--color-danger)' }}>
                    {job.rejectedCount}
                  </strong>
                </div>
                <div>
                  <span className={styles.statLabel}>Chỉ tiêu Quota</span>
                  <strong className="text-tabular">{job.quotaRequested}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Automated Quality Gates Review Table */}
      <section className={styles.candidatesSection} aria-labelledby="candidates-heading">
        <div className={styles.sectionHeader}>
          <ShieldCheck size={18} className={styles.sectionIcon} />
          <h2 id="candidates-heading">Bảng đối soát Cổng kiểm định tự động (Quality Gates)</h2>
        </div>

        <div className={styles.candidatesList}>
          {candidates.map((cand) => {
            const hasBlocking = cand.criticReview.severity === 'Blocking';
            const isQuarantined = cand.quarantineStatus === 'Quarantined';

            return (
              <div
                key={cand.candidateId}
                className={`${styles.candidateCard} ${isQuarantined ? styles.cardQuarantined : ''}`}
              >
                <div className={styles.candidateHeader}>
                  <div className={styles.candidateMeta}>
                    <span className={styles.candId}>{cand.candidateId}</span>
                    <Badge variant="primary">{cand.part}</Badge>
                    {isQuarantined ? (
                      <Badge variant="danger">ĐÃ CÁCH LY (QUARANTINED)</Badge>
                    ) : hasBlocking ? (
                      <Badge variant="danger">BLOCKING FINDING</Badge>
                    ) : (
                      <Badge variant="success">ĐỦ ĐIỀU KIỆN BETA</Badge>
                    )}
                  </div>

                  <div className={styles.candidateActions}>
                    {!isQuarantined && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openQuarantine(cand)}
                        leftIcon={<AlertOctagon size={14} />}
                      >
                        Cách ly Candidate
                      </Button>
                    )}
                  </div>
                </div>

                <p className={styles.candPrompt}>{cand.prompt}</p>

                {/* Gates Status Grid */}
                <div className={styles.gatesGrid}>
                  {/* Gate 1: Structural Validator */}
                  <div className={styles.gateBox}>
                    <div className={styles.gateTitle}>1. Structural Validator</div>
                    <div className={styles.gateStatus}>
                      <CheckCircle2 size={16} color="var(--color-success)" />
                      <span>4 options, 1 valid key</span>
                    </div>
                  </div>

                  {/* Gate 2: Dual Blind Solvers */}
                  <div className={styles.gateBox}>
                    <div className={styles.gateTitle}>2. Dual-solver Consensus</div>
                    <div className={styles.gateStatus}>
                      {cand.blindSolvers.consensus ? (
                        <>
                          <CheckCircle2 size={16} color="var(--color-success)" />
                          <span>Đồng thuận (A: {cand.blindSolvers.solverA.selectedAnswer}, B: {cand.blindSolvers.solverB.selectedAnswer})</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={16} color="var(--color-danger)" />
                          <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                            Bất đồng thuận (A: {cand.blindSolvers.solverA.selectedAnswer} ≠ B: {cand.blindSolvers.solverB.selectedAnswer})
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Gate 3: Adversarial Critic */}
                  <div className={styles.gateBox}>
                    <div className={styles.gateTitle}>3. Adversarial Critic</div>
                    <div className={styles.gateStatus}>
                      {cand.criticReview.severity === 'None' ? (
                        <>
                          <CheckCircle2 size={16} color="var(--color-success)" />
                          <span>Không có cảnh báo</span>
                        </>
                      ) : cand.criticReview.severity === 'Warning' ? (
                        <span style={{ color: 'var(--color-warning)', fontWeight: 500 }}>
                          Cảnh báo độ trùng lặp
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                          Chặn phát hành: {cand.criticReview.findings[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isQuarantined && cand.quarantineReason && (
                  <div className={styles.quarantineNotice}>
                    <strong>Lý do cách ly:</strong> {cand.quarantineReason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Quarantine Modal */}
      <Modal
        isOpen={isQuarantineModalOpen}
        onClose={() => setIsQuarantineModalOpen(false)}
        title="Xác nhận cách ly câu hỏi (Quarantine)"
        description="Câu hỏi bị cách ly sẽ không thể xuất hiện trong bất kỳ đề thi BetaPractice nào của học viên."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsQuarantineModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button variant="danger" onClick={handleConfirmQuarantine}>
              Thi hành cách ly ngay
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
            Lý do cách ly kỹ thuật hoặc học thuật:
          </label>
          <textarea
            value={quarantineReason}
            onChange={(e) => setQuarantineReason(e.target.value)}
            style={{
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              minHeight: '80px',
              fontFamily: 'inherit',
              fontSize: 'var(--font-size-sm)',
            }}
          />
        </div>
      </Modal>
    </div>
  );
}
