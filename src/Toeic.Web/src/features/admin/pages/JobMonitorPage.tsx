import { useState, useEffect } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { api } from '../../../lib/api/client';
import { GenerationJobSummary } from '../../../types/admin';
import styles from './AdminPages.module.css';

export function JobMonitorPage() {
  const [jobs, setJobs] = useState<GenerationJobSummary[]>([]);

  useEffect(() => {
    api.getGenerationJobs().then(setJobs);
  }, []);

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Giám sát tác vụ sinh đề (Job Monitor)</h1>
          <p className={styles.subtitle}>
            Theo dõi tiến trình sinh câu hỏi tự động, trạng thái kiểm định và đối soát ngân sách nhà cung cấp (Mục 27).
          </p>
        </div>
      </div>

      <div className={styles.cardTable}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Blueprint</th>
              <th>Part</th>
              <th>Quota yêu cầu</th>
              <th>Đã sinh</th>
              <th>Đạt kiểm định</th>
              <th>Bị từ chối</th>
              <th>Trạng thái</th>
              <th>Khởi tạo lúc</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.jobId}>
                <td>
                  <span className={styles.codeText}>{j.jobId}</span>
                </td>
                <td>
                  <strong>{j.blueprintVersion}</strong>
                </td>
                <td>
                  <Badge variant="primary">{j.part}</Badge>
                </td>
                <td className="text-tabular">{j.quotaRequested} câu</td>
                <td className="text-tabular">{j.candidatesGenerated} câu</td>
                <td className="text-tabular" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                  {j.acceptedCount}
                </td>
                <td className="text-tabular" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                  {j.rejectedCount}
                </td>
                <td>
                  {j.status === 'Completed' ? (
                    <Badge variant="success">Hoàn thành</Badge>
                  ) : (
                    <Badge variant="warning">Đang xử lý</Badge>
                  )}
                </td>
                <td className="text-tabular" style={{ fontSize: 'var(--font-size-xs)' }}>
                  {new Date(j.startedAt).toLocaleTimeString('vi-VN')} {new Date(j.startedAt).toLocaleDateString('vi-VN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
