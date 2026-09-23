import { useState } from 'react';
import { 
  UploadCloud, 
  Database
} from 'lucide-react';
import { Button, Badge, Alert } from '../../../components/ui';
import styles from './CMSPages.module.css';

interface ParsedItem {
  number: number;
  part: string;
  stem: string;
  status: 'Valid' | 'Warning' | 'Error';
  validationMessage?: string;
}

export function ImportConsolePage() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isCommitted, setIsCommitted] = useState(false);

  // Mock parsed preview
  const [previewItems, setPreviewItems] = useState<ParsedItem[]>([]);

  const handleSimulateUpload = (filename: string) => {
    setSelectedFile(filename);
    setIsParsing(true);
    setIsCommitted(false);

    setTimeout(() => {
      setIsParsing(false);
      setPreviewItems([
        {
          number: 1,
          part: 'Part 5',
          stem: 'The new regional manager will visit the branch office _______ Friday morning.',
          status: 'Valid',
        },
        {
          number: 2,
          part: 'Part 5',
          stem: 'Please submit your quarterly expense receipts _______ the accounting department.',
          status: 'Valid',
        },
        {
          number: 3,
          part: 'Part 1',
          stem: '[Listening Item Photo 03]',
          status: 'Warning',
          validationMessage: 'Thiếu file audio "part1_photo03.mp3" trong gói đính kèm manifest (FR-33/34).',
        },
        {
          number: 4,
          part: 'Part 5',
          stem: 'All visitors must register at the reception desk before _______ the building.',
          status: 'Valid',
        },
      ]);
    }, 800);
  };

  const hasErrors = previewItems.some((i) => i.status === 'Error');
  const validCount = previewItems.filter((i) => i.status === 'Valid').length;
  const warningCount = previewItems.filter((i) => i.status === 'Warning').length;

  const handleCommitDraft = () => {
    setIsCommitted(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Cổng Nạp Đề Đa Nguồn (Import Jobs FR-34)</h1>
          <p className={styles.description}>
            Nạp đề thi từ tệp DOCX (mẫu chuẩn), PDF (văn bản trích xuất) hoặc CSV/XLSX. Hệ thống kiểm định cấu trúc tự động, phát hiện media thiếu và thực hiện atomic commit vào trạng thái Draft.
          </p>
        </div>
      </div>

      {/* File Dropzone */}
      <div 
        className={styles.dropZone}
        onClick={() => handleSimulateUpload('TOEIC_Reading_Test_04_Official_Format.docx')}
      >
        <UploadCloud size={48} color="var(--color-primary)" style={{ margin: '0 auto var(--space-3)' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-ink-primary)', marginBottom: '6px' }}>
          {selectedFile ? `Đã chọn: ${selectedFile}` : 'Kéo thả tệp đề thi hoặc bấm vào đây để tải lên'}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-ink-secondary)', margin: 0 }}>
          Hỗ trợ .DOCX (theo template chuẩn), .PDF (có text layer) và .CSV tối đa 1.000 câu/job.
        </p>
      </div>

      {/* Parsing progress */}
      {isParsing && (
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-primary)' }}>
            Đang phân tích cấu trúc cú pháp tệp (Schema Validation)...
          </div>
        </div>
      )}

      {/* Validation Preview Table */}
      {previewItems.length > 0 && !isParsing && (
        <div className={styles.previewCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-ink-primary)' }}>
                Kết quả kiểm định sơ bộ: {selectedFile}
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--color-ink-secondary)', marginTop: '4px' }}>
                Tổng cộng: <strong>{previewItems.length} câu hỏi</strong> • {validCount} hợp lệ • {warningCount} cảnh báo thiếu media
              </div>
            </div>

            {!isCommitted ? (
              <Button
                variant="primary"
                onClick={handleCommitDraft}
                disabled={hasErrors}
                leftIcon={<Database size={16} />}
              >
                Commit vào trạng thái Draft (Atomic FR-34)
              </Button>
            ) : (
              <Badge variant="success">Đã commit Draft thành công</Badge>
            )}
          </div>

          {isCommitted && (
            <div style={{ marginBottom: '16px' }}>
              <Alert variant="success" title="Đã lưu vào kho đề bản nháp (Draft)">
                Toàn bộ {previewItems.length} câu hỏi đã được nạp thành công vào hệ thống. Các câu hỏi sẽ tiếp tục đi qua các cổng kiểm định tự động (CrossModelValid) trước khi được kích hoạt Beta.
              </Alert>
            </div>
          )}

          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th>Số thứ tự</th>
                <th>Phần thi</th>
                <th>Nội dung câu hỏi (Stem preview)</th>
                <th>Kiểm tra cú pháp</th>
                <th>Ghi chú / Cảnh báo</th>
              </tr>
            </thead>
            <tbody>
              {previewItems.map((item) => (
                <tr key={item.number}>
                  <td><strong>Câu {item.number}</strong></td>
                  <td>{item.part}</td>
                  <td style={{ maxWidth: '450px' }}>{item.stem}</td>
                  <td>
                    {item.status === 'Valid' && (
                      <Badge variant="success">Hợp lệ</Badge>
                    )}
                    {item.status === 'Warning' && (
                      <Badge variant="warning">Cảnh báo media</Badge>
                    )}
                    {item.status === 'Error' && (
                      <Badge variant="danger">Lỗi cú pháp</Badge>
                    )}
                  </td>
                  <td style={{ fontSize: '12px', color: item.status === 'Warning' ? '#b06000' : 'var(--color-ink-tertiary)' }}>
                    {item.validationMessage || 'Cấu trúc và đáp án đầy đủ.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
