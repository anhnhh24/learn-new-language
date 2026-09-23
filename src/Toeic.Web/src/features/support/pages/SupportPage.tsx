import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input, Textarea } from '../../../components/ui/Input';
import {
  HelpCircle,
  CheckCircle2,
  Clock,
  Send,
} from 'lucide-react';
import styles from './Support.module.css';

interface TicketItem {
  id: string;
  category: string;
  sourceContext: string;
  description: string;
  status: 'Open' | 'InProgress' | 'Resolved' | 'Rejected';
  createdAt: string;
  resolutionNote?: string;
}

const mockTickets: TicketItem[] = [
  {
    id: 'ticket-1092',
    category: 'Audio không phát được',
    sourceContext: 'Part 1: Question #4',
    description: 'Nút phát âm thanh bị đơ khi bấm trên trình duyệt mobile Safari.',
    status: 'Resolved',
    createdAt: '2026-09-21T10:00:00Z',
    resolutionNote: 'Đã cập nhật bộ giải mã âm thanh AAC tương thích iOS 18 (Revision v2).',
  },
  {
    id: 'ticket-1098',
    category: 'Lời giải chưa rõ ràng',
    sourceContext: 'Part 5: Question #103',
    description: 'Giải thích chưa phân biệt rõ giữa liên từ Although và giới từ In spite of.',
    status: 'InProgress',
    createdAt: '2026-09-22T14:30:00Z',
  },
];

export function SupportPage() {
  const [tickets, setTickets] = useState<TicketItem[]>(mockTickets);
  const [category, setCategory] = useState('Sai đáp án');
  const [sourceContext, setSourceContext] = useState('');
  const [description, setDescription] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;

    const newTicket: TicketItem = {
      id: `ticket-${Math.floor(1000 + Math.random() * 9000)}`,
      category,
      sourceContext: sourceContext || 'Nội dung tự do',
      description,
      status: 'Open',
      createdAt: new Date().toISOString(),
    };

    setTickets([newTicket, ...tickets]);
    setDescription('');
    setSourceContext('');
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 4000);
  };

  return (
    <div className="content-container">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Hỗ trợ & Báo lỗi nội dung</h1>
          <p className={styles.subtitle}>
            Gửi phản ánh về câu hỏi, bài tập hoặc tra cứu tình trạng xử lý phiếu yêu cầu (UI-18 & FR-17).
          </p>
        </div>
      </div>

      <div className={styles.layoutGrid}>
        {/* Submit Ticket Form */}
        <section className={styles.formCard} aria-labelledby="form-heading">
          <div className={styles.cardHeader}>
            <HelpCircle size={20} className={styles.headerIcon} />
            <h2 id="form-heading" className={styles.cardTitle}>Gửi phản ánh mới</h2>
          </div>

          {isSuccess && (
            <div className={styles.successBanner}>
              <CheckCircle2 size={16} />
              <span>Phiếu phản ánh của bạn đã được ghi nhận vào hệ thống đối soát!</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label htmlFor="issue-category" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, display: 'block', marginBottom: 'var(--space-1)' }}>
                Loại phản ánh
              </label>
              <select
                id="issue-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  fontFamily: 'inherit',
                  fontSize: 'var(--font-size-base)',
                  minHeight: '44px',
                }}
              >
                <option value="Sai đáp án">Nghi ngờ đáp án chưa chính xác</option>
                <option value="Audio không phát được">Lỗi file âm thanh / audio không tải</option>
                <option value="Lời giải chưa rõ">Lời giải thích chưa rõ ràng hoặc thiếu ngữ cảnh</option>
                <option value="Lỗi chính tả/định dạng">Lỗi gõ phím, lỗi hiển thị hoặc định dạng</option>
              </select>
            </div>

            <Input
              type="text"
              label="Mã câu hỏi hoặc bài học liên quan"
              placeholder="Ví dụ: Part 5 Câu 103 hoặc Bài 4"
              value={sourceContext}
              onChange={(e) => setSourceContext(e.target.value)}
            />

            <Textarea
              label="Mô tả chi tiết vấn đề (tối đa 2.000 ký tự)"
              placeholder="Mô tả rõ điều bạn quan sát thấy và mong muốn hỗ trợ..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength={2000}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<Send size={15} />}
            >
              Gửi phản ánh tới Ban biên tập
            </Button>
          </form>
        </section>

        {/* Existing Tickets List */}
        <section className={styles.ticketsSection} aria-labelledby="tickets-heading">
          <h2 id="tickets-heading" className={styles.ticketsTitle}>Phiếu phản ánh của bạn</h2>

          <div className={styles.ticketsList}>
            {tickets.map((t) => (
              <div key={t.id} className={styles.ticketCard}>
                <div className={styles.ticketTop}>
                  <span className={styles.ticketId}>{t.id}</span>
                  <div>
                    {t.status === 'Open' && <Badge variant="warning">Đang chờ tiếp nhận</Badge>}
                    {t.status === 'InProgress' && <Badge variant="primary">Đang xác minh</Badge>}
                    {t.status === 'Resolved' && <Badge variant="success">Đã xử lý</Badge>}
                    {t.status === 'Rejected' && <Badge variant="default">Từ chối</Badge>}
                  </div>
                </div>

                <div className={styles.ticketCategory}>
                  <strong>{t.category}</strong> • <span>{t.sourceContext}</span>
                </div>

                <p className={styles.ticketDesc}>{t.description}</p>

                {t.resolutionNote && (
                  <div className={styles.resolutionBox}>
                    <strong>Kết quả phản hồi:</strong> {t.resolutionNote}
                  </div>
                )}

                <div className={styles.ticketDate}>
                  <Clock size={12} />
                  <span>{new Date(t.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
