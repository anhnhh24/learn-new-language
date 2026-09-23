import { useState } from 'react';
import { 
  FolderPlus, 
  FileText, 
  Save, 
  AlertTriangle, 
  CheckCircle, 
  Plus
} from 'lucide-react';
import { Button, Input, Badge } from '../../../components/ui';
import styles from './CMSPages.module.css';

interface LessonNode {
  id: string;
  title: string;
  skill: 'Listening' | 'Reading';
  levelLabel: string;
  estimatedMinutes: number;
  prerequisiteId?: string;
  primaryTag: string;
  status: 'Draft' | 'InReview' | 'Published' | 'Archived';
  pageCount: number;
}

interface ModuleNode {
  id: string;
  title: string;
  lessons: LessonNode[];
}

export function CurriculumEditorPage() {
  const [modules, setModules] = useState<ModuleNode[]>([
    {
      id: 'mod-1',
      title: 'Module 1: Ngữ pháp căn bản & Từ loại',
      lessons: [
        {
          id: 'les-1',
          title: 'Bài 1: Danh từ và Cụm danh từ',
          skill: 'Reading',
          levelLabel: 'A2-B1',
          estimatedMinutes: 25,
          primaryTag: 'grammar.nouns',
          status: 'Published',
          pageCount: 4,
        },
        {
          id: 'les-2',
          title: 'Bài 2: Tính từ & Trạng từ chỉ mức độ',
          skill: 'Reading',
          levelLabel: 'B1',
          estimatedMinutes: 30,
          prerequisiteId: 'les-1',
          primaryTag: 'grammar.adjectives_adverbs',
          status: 'Published',
          pageCount: 5,
        },
        {
          id: 'les-3',
          title: 'Bài 3: Mệnh đề phân từ & Rút gọn',
          skill: 'Reading',
          levelLabel: 'B1-B2',
          estimatedMinutes: 35,
          prerequisiteId: 'les-2',
          primaryTag: 'grammar.participles',
          status: 'InReview',
          pageCount: 6,
        },
      ],
    },
    {
      id: 'mod-2',
      title: 'Module 2: Đọc hiểu văn bản công sở Part 7',
      lessons: [
        {
          id: 'les-4',
          title: 'Bài 4: Kỹ thuật Skimming E-mail nội bộ',
          skill: 'Reading',
          levelLabel: 'B1',
          estimatedMinutes: 30,
          prerequisiteId: 'les-1',
          primaryTag: 'part7.single_email',
          status: 'Draft',
          pageCount: 4,
        },
      ],
    },
  ]);

  const [selectedLessonId, setSelectedLessonId] = useState<string>('les-1');
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  // Find currently selected lesson
  const allLessons = modules.flatMap((m) => m.lessons);
  const selectedLesson = allLessons.find((l) => l.id === selectedLessonId) || allLessons[0];

  // Form state
  const [title, setTitle] = useState(selectedLesson.title);
  const [skill, setSkill] = useState(selectedLesson.skill);
  const [levelLabel, setLevelLabel] = useState(selectedLesson.levelLabel);
  const [estimatedMinutes, setEstimatedMinutes] = useState(selectedLesson.estimatedMinutes);
  const [prerequisiteId, setPrerequisiteId] = useState(selectedLesson.prerequisiteId || '');
  const [primaryTag, setPrimaryTag] = useState(selectedLesson.primaryTag);
  const [status, setStatus] = useState(selectedLesson.status);

  // Cycle check for prerequisites (AC-33)
  const checkCycle = (candidatePrereqId: string, currentId: string): string[] | null => {
    if (!candidatePrereqId) return null;
    if (candidatePrereqId === currentId) return [currentId, currentId];

    const visited: string[] = [currentId];
    let curr: string | undefined = candidatePrereqId;

    while (curr) {
      if (curr === currentId) {
        return [...visited, currentId];
      }
      visited.push(curr);
      const nextLesson = allLessons.find((l) => l.id === curr);
      curr = nextLesson?.prerequisiteId;
      if (visited.length > 20) break; // guard
    }
    return null;
  };

  const cyclePath = checkCycle(prerequisiteId, selectedLesson.id);

  const handleSelectLesson = (l: LessonNode) => {
    setSelectedLessonId(l.id);
    setTitle(l.title);
    setSkill(l.skill);
    setLevelLabel(l.levelLabel);
    setEstimatedMinutes(l.estimatedMinutes);
    setPrerequisiteId(l.prerequisiteId || '');
    setPrimaryTag(l.primaryTag);
    setStatus(l.status);
    setIsSavedAlert(false);
  };

  const handleSaveLesson = () => {
    if (cyclePath) {
      alert('Không thể lưu do phát hiện vòng lặp điều kiện tiên quyết (Prerequisite cycle AC-33)!');
      return;
    }

    setModules((prev) =>
      prev.map((mod) => ({
        ...mod,
        lessons: mod.lessons.map((les) =>
          les.id === selectedLesson.id
            ? {
                ...les,
                title,
                skill,
                levelLabel,
                estimatedMinutes,
                prerequisiteId: prerequisiteId || undefined,
                primaryTag,
                status,
              }
            : les
        ),
      }))
    );

    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2500);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản trị Chương trình & Bài học (FR-33)</h1>
          <p className={styles.description}>
            Cấu trúc Khóa học &gt; Module &gt; Bài học &gt; Trang. Quản lý điều kiện tiên quyết (Prerequisites), mục tiêu kiến thức và kiểm soát vòng lặp phụ thuộc (AC-33).
          </p>
        </div>

        <Button variant="primary" onClick={handleSaveLesson} disabled={Boolean(cyclePath)}>
          <Save size={16} /> Lưu bài học
        </Button>
      </div>

      <div className={styles.curriculumLayout}>
        {/* Left: Tree Navigation */}
        <div className={styles.treePanel}>
          <div className={styles.treeTitle}>
            <span>Khóa học: TOEIC 550+ Core</span>
            <Button variant="text" size="sm" title="Thêm module mới">
              <FolderPlus size={16} />
            </Button>
          </div>

          {modules.map((mod) => (
            <div key={mod.id} className={styles.moduleBlock}>
              <div className={styles.moduleHeader}>
                <span>{mod.title}</span>
                <span style={{ fontSize: '11px' }}>{mod.lessons.length} bài</span>
              </div>

              <div>
                {mod.lessons.map((les) => (
                  <div
                    key={les.id}
                    className={`${styles.lessonNode} ${les.id === selectedLesson.id ? styles.lessonNodeSelected : ''}`}
                    onClick={() => handleSelectLesson(les)}
                  >
                    <FileText size={15} />
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {les.title}
                    </span>
                    <Badge variant={les.status === 'Published' ? 'success' : 'default'}>
                      {les.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Button variant="outline" size="sm" style={{ width: '100%', marginTop: '12px' }}>
            <Plus size={14} /> Thêm bài học mới
          </Button>
        </div>

        {/* Right: Lesson Metadata & Block Editor */}
        <div className={styles.editorPanel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                Đang chỉnh sửa: {selectedLesson.id}
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0 0', color: 'var(--color-ink-primary)' }}>
                {title}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Badge variant={status === 'Published' ? 'success' : 'info'}>{status}</Badge>
              <Badge variant="default">{skill}</Badge>
            </div>
          </div>

          {/* AC-33 Cycle Alert */}
          {cyclePath && (
            <div className={styles.cycleAlert}>
              <AlertTriangle size={18} />
              <div>
                <strong>Lỗi vi phạm tiêu chuẩn AC-33: Phát hiện vòng lặp điều kiện tiên quyết (Prerequisite Cycle)!</strong>
                <div style={{ fontSize: '12px', marginTop: '2px' }}>
                  Đường dẫn chu trình: {cyclePath.join(' → ')}. Vui lòng chọn bài học tiên quyết hợp lệ để tránh khóa học bị treo logic.
                </div>
              </div>
            </div>
          )}

          {isSavedAlert && (
            <div style={{ background: '#e6f4ea', borderLeft: '4px solid #137333', color: '#137333', padding: '10px 14px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} /> Đã cập nhật và lưu siêu dữ liệu bài học thành công!
            </div>
          )}

          <div className={styles.formGrid}>
            <Input
              label="Tiêu đề bài học (Title)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'var(--color-ink-primary)' }}>
                Kỹ năng mục tiêu (Skill)
              </label>
              <select
                value={skill}
                onChange={(e) => setSkill(e.target.value as 'Listening' | 'Reading')}
                className={styles.filterSelect}
                style={{ width: '100%' }}
              >
                <option value="Reading">Reading (Đọc hiểu Part 5–7)</option>
                <option value="Listening">Listening (Nghe hiểu Part 1–4)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'var(--color-ink-primary)' }}>
                Trình độ đề xuất (Level Label)
              </label>
              <select
                value={levelLabel}
                onChange={(e) => setLevelLabel(e.target.value)}
                className={styles.filterSelect}
                style={{ width: '100%' }}
              >
                <option value="A1-A2">A1–A2 (Mất gốc / Căn bản 250–450)</option>
                <option value="A2-B1">A2–B1 (Củng cố căn bản 450–600)</option>
                <option value="B1-B2">B1–B2 (Trung cấp / Nâng cao 600–750+)</option>
              </select>
            </div>

            <Input
              type="number"
              label="Thời lượng ước tính (Phút)"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            />

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'var(--color-ink-primary)' }}>
                Bài học tiên quyết (Prerequisite AC-33)
              </label>
              <select
                value={prerequisiteId}
                onChange={(e) => setPrerequisiteId(e.target.value)}
                className={styles.filterSelect}
                style={{ width: '100%' }}
              >
                <option value="">(Không có bài học tiên quyết)</option>
                {allLessons
                  .filter((l) => l.id !== selectedLesson.id)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title} ({l.id})
                    </option>
                  ))}
              </select>
            </div>

            <Input
              label="Primary Knowledge Tag"
              value={primaryTag}
              onChange={(e) => setPrimaryTag(e.target.value)}
            />

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'var(--color-ink-primary)' }}>
                Trạng thái xuất bản (Workflow Status)
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LessonNode['status'])}
                className={styles.filterSelect}
                style={{ width: '100%' }}
              >
                <option value="Draft">Draft (Bản nháp tác giả)</option>
                <option value="InReview">InReview (Đang kiểm định chất lượng)</option>
                <option value="Published">Published (Đã xuất bản cho học viên)</option>
                <option value="Archived">Archived (Đã lưu trữ)</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-ink-primary)' }}>
              Cấu trúc các trang nội dung (Pages & Blocks: {selectedLesson.pageCount} trang)
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-ink-secondary)', marginBottom: '12px' }}>
              Bài giảng chia thành các khối text, audio player, bảng tóm tắt và câu hỏi mini-check kiểm tra tức thì (FR-07/08).
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {Array.from({ length: selectedLesson.pageCount }, (_, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 16px',
                    background: 'var(--color-surface-subtle)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  Trang {i + 1}: {i === 0 ? 'Lý thuyết & Ví dụ' : i === selectedLesson.pageCount - 1 ? 'Mini-Check & Tổng kết' : 'Phân tích tình huống'}
                </div>
              ))}
              <Button variant="outline" size="sm">
                + Thêm trang mới
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
