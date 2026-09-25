import { CourseCurriculum, KnowledgeTopic } from '../../types/curriculum';
import curriculumTopicsJson from './curriculumTopics.json';
import { legacyRoadmapWeeks } from './legacyRoadmapWeeks';

export const toeicReadingCurriculum: CourseCurriculum = {
  id: '60000000-0000-4000-8000-000000000001',
  slug: 'toeic-reading-grammar-foundation',
  title: 'TOEIC Reading: Ngữ pháp và từ vựng từ nền tảng đến nâng cao',
  summary:
    'Hệ thống kiến thức TOEIC Reading gồm 4 phân hệ lớn, 40 chuyên đề ngữ pháp - từ vựng cốt lõi và 4 bài thi Checkpoint kiểm định năng lực độc lập.',
  levelLabel: 'Nền tảng đến nâng cao',
  estimatedMinutes: 4200, // 70 giờ
  levels: [
    {
      id: '61000000-0000-4000-8000-000000000001',
      code: 'A',
      title: 'Phần 1: Cấu trúc câu & 4 từ loại cốt lõi (Level A)',
      sequence: 1,
      recommendedWeeks: 6,
      entryGuidance:
        'Phù hợp khi kiến thức câu và từ loại chưa ổn định hoặc người học chủ động chọn bắt đầu lại từ nền.',
      outcomeGuidance:
        'Nhận diện cấu trúc câu cơ bản và xử lý câu Part 5 nền tảng; kết quả là chỉ báo học tập, không quy đổi band.',
      checkpointQuestionCount: 25,
      checkpointPassRate: 0.7,
    },
    {
      id: '61000000-0000-4000-8000-000000000002',
      code: 'B',
      title: 'Phần 2: Hệ thống các thì & Mệnh đề liên kết (Level B)',
      sequence: 2,
      recommendedWeeks: 7,
      entryGuidance:
        'Phù hợp sau checkpoint A hoặc khi placement cho thấy nền tảng cơ bản đã ổn.',
      outcomeGuidance:
        'Vận dụng thì hoàn thành, bị động, mệnh đề và liên kết trong Part 5/6 ở mức trung bình.',
      checkpointQuestionCount: 40,
      checkpointPassRate: 0.7,
    },
    {
      id: '61000000-0000-4000-8000-000000000003',
      code: 'C',
      title: 'Phần 3: Cấu trúc nâng cao & Điểm ngữ pháp phức (Level C)',
      sequence: 3,
      recommendedWeeks: 8,
      entryGuidance:
        'Phù hợp sau checkpoint B; không tự mở chỉ dựa trên điểm tự khai.',
      outcomeGuidance:
        'Xử lý cấu trúc nâng cao và giải thích được dấu hiệu chọn đáp án trong ngữ cảnh Reading.',
      checkpointQuestionCount: 40,
      checkpointPassRate: 0.75,
    },
    {
      id: '61000000-0000-4000-8000-000000000004',
      code: 'D',
      title: 'Phần 4: Độ chính xác chuyên sâu & Né bẫy Part 5/6 (Level D)',
      sequence: 4,
      recommendedWeeks: 10,
      entryGuidance:
        'Phù hợp sau checkpoint C hoặc bằng chứng thực hành tương đương; placement ngắn không tự gợi ý mức này.',
      outcomeGuidance:
        'Tăng độ chính xác với collocation, register, cấu trúc rút gọn và bẫy Part 5/6; không phải chứng nhận 900+.',
      checkpointQuestionCount: 46,
      checkpointPassRate: 0.85,
    },
  ],
  modules: [
    {
      id: '62000000-0000-4000-8000-000000000001',
      levelCode: 'A',
      code: 'MODULE-A',
      title: 'Phần 1: Cấu trúc câu và từ loại cốt lõi',
      summary: 'Dựng lại cấu trúc câu S–V–O, các thì cơ bản, mạo từ và nhóm danh từ.',
    },
    {
      id: '62000000-0000-4000-8000-000000000002',
      levelCode: 'B',
      code: 'MODULE-B',
      title: 'Phần 2: Hệ thống các thì và mệnh đề liên kết',
      summary: 'Các thì hoàn thành, bị động, điều kiện, mệnh đề quan hệ và liên từ kết hợp.',
    },
    {
      id: '62000000-0000-4000-8000-000000000003',
      levelCode: 'C',
      code: 'MODULE-C',
      title: 'Phần 3: Cấu trúc nâng cao và ngữ pháp phức',
      summary: 'Đảo ngữ, phân từ rút gọn, câu giả định, cấu trúc song song và nhấn mạnh.',
    },
    {
      id: '62000000-0000-4000-8000-000000000004',
      levelCode: 'D',
      code: 'MODULE-D',
      title: 'Phần 4: Độ chính xác chuyên sâu và né bẫy Part 5/6',
      summary: 'Word form khó, collocation công sở, văn phong thương mại, transitions và cấu trúc nén.',
    },
  ],
  topics: curriculumTopicsJson as unknown as Record<string, KnowledgeTopic>,
  weeks: legacyRoadmapWeeks,
};


export interface CheckpointInfo {
  code: string;
  levelCode: 'A' | 'B' | 'C' | 'D';
  title: string;
  questionCount: number;
  passRate: number;
  timeLimitMinutes: number;
  description: string;
  rules: string[];
  remediationPolicy: string[];
}

export const checkpointCatalog: Record<string, CheckpointInfo> = {
  'CHECKPOINT-A': {
    code: 'CHECKPOINT-A',
    levelCode: 'A',
    title: 'Checkpoint Củng cố Nền tảng (Level A)',
    questionCount: 25,
    passRate: 0.7,
    timeLimitMinutes: 25,
    description: 'Đánh giá độ chắc chắn về 4 từ loại, cấu trúc câu S–V–O và các thì cơ bản (A1–A9).',
    rules: [
      'Làm bài trong một lượt liên tục, không xem lời giải giữa chừng.',
      'Câu bỏ trống tính là chưa đúng.',
      'Kết quả là chỉ báo học tập nhằm định hướng kiến thức, không phải điểm TOEIC chính thức.',
    ],
    remediationPolicy: [
      'Đạt ngưỡng (>= 70%): Đủ điều kiện chuyển tiếp sang Phân hệ Level B (Hệ thống các thì & Mệnh đề liên kết).',
      'Chưa đạt (< 70%): Kích hoạt Chế độ Củng cố Thích ứng (Remediation A): Tự động tổng hợp 2 chủ điểm yếu nhất (A1–A9) vào Sổ lỗi sai, yêu cầu hoàn thành 2 bài luyện tập ngắn và đợi giãn cách 3–5 ngày trước khi làm lại đề kiểm định.',
    ],
  },
  'CHECKPOINT-B': {
    code: 'CHECKPOINT-B',
    levelCode: 'B',
    title: 'Checkpoint Ứng dụng Trung cấp (Level B)',
    questionCount: 40,
    passRate: 0.7,
    timeLimitMinutes: 35,
    description: 'Kiểm tra năng lực xử lý thì hoàn thành, bị động, câu điều kiện, mệnh đề quan hệ và liên từ (B1–B10).',
    rules: [
      'Làm bài trong một lượt liên tục, không xem giải thích đáp án giữa chừng.',
      'Phần thi gồm 40 câu trắc nghiệm dạng Part 5 và Part 6 ngắn.',
      'Cần giải thích lý do loại trừ khi hoàn tất để ghi nhận Error Notebook.',
    ],
    remediationPolicy: [
      'Đạt ngưỡng (>= 70%): Mở khóa Phân hệ Level C (Cấu trúc nâng cao & Điểm ngữ pháp phức).',
      'Chưa đạt (< 70%): Kích hoạt Chế độ Củng cố Thích ứng (Remediation B): Rà soát các câu sai thuộc nhóm thì phức và mệnh đề liên kết, luyện tập bổ sung tối thiểu 30 câu trong Sổ tay lỗi và làm lại sau 3 ngày.',
    ],
  },
  'CHECKPOINT-C': {
    code: 'CHECKPOINT-C',
    levelCode: 'C',
    title: 'Checkpoint Cấu trúc Nâng cao (Level C)',
    questionCount: 40,
    passRate: 0.75,
    timeLimitMinutes: 35,
    description: 'Đo lường năng lực phân tích cấu trúc phức tạp: đảo ngữ, phân từ rút gọn, câu giả định và cấu trúc nhấn mạnh (C1–C10).',
    rules: [
      'Thời gian làm bài tối đa 35 phút cho 40 câu hỏi.',
      'Yêu cầu độ chính xác tối thiểu 75% (30/40 câu).',
      'Đánh giá chuyên sâu năng lực giải thích cấu trúc thay vì đoán mò.',
    ],
    remediationPolicy: [
      'Đạt ngưỡng (>= 75%): Đủ điều kiện mở khóa Phân hệ Level D (Độ chính xác chuyên sâu & Né bẫy Part 5/6).',
      'Chưa đạt (< 75%): Kích hoạt Chế độ Củng cố Thích ứng (Remediation C): Hoàn thành gói ôn củng cố 2 tag yếu nhất trong đề Checkpoint C kết hợp rà soát flashcard ngữ pháp nâng cao trước khi thi lại sau 5 ngày.',
    ],
  },
  'CHECKPOINT-D': {
    code: 'CHECKPOINT-D',
    levelCode: 'D',
    title: 'Checkpoint Hoàn thành Lộ trình Chuyên sâu (Level D)',
    questionCount: 46,
    passRate: 0.85,
    timeLimitMinutes: 45,
    description: 'Thử thách năng lực với collocation, word family khó, register thương mại và bẫy đề thi Part 5/6 (D1–D11).',
    rules: [
      'Bộ đề 46 câu Part 5 & 6 mô phỏng độ khó kỳ thi TOEIC thật ở mức cao nhất.',
      'Ngưỡng đạt tiêu chuẩn: 85% (>= 39/46 câu đúng).',
      'Báo cáo chi tiết accuracy theo từng primary tag, không quy đổi bừa bãi ra band điểm 900+.',
    ],
    remediationPolicy: [
      'Đạt ngưỡng (>= 85%): Hoàn tất trọn vẹn Hệ thống phân hệ kiến thức TOEIC Reading và đạt chuẩn năng lực cao cấp.',
      'Chưa đạt (< 85%): Kích hoạt Chế độ Củng cố Chuyên sâu (Remediation D): Rà soát toàn bộ bẫy Part 5/6, từ vựng phân loại cao cấp và các cặp từ dễ nhầm lẫn trong Sổ lỗi sai; luyện tập mô phỏng Part 5 tốc độ cao tối thiểu 7 ngày trước khi thi lại.',
    ],
  },
};

export function getTopicByCode(code: string): KnowledgeTopic | undefined {
  const norm = code.toUpperCase().replace(/^LESSON-/, '');
  return (toeicReadingCurriculum.topics as Record<string, KnowledgeTopic>)[norm];
}

export function getCheckpointByCode(code: string): CheckpointInfo | undefined {
  const normalized = code.toUpperCase().replace(/^LESSON-/, '');
  return checkpointCatalog[normalized] || checkpointCatalog[code];
}

