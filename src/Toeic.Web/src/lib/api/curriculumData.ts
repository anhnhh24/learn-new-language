import { CourseCurriculum, KnowledgeTopic } from '../../types/curriculum';
import curriculumTopicsJson from './curriculumTopics.json';

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
  weeks: [
    // LEVEL A
    {
      weekNumber: 1,
      levelCode: 'A',
      title: 'Dựng khung câu & Từ loại',
      goal: 'Nhận diện từ loại và tìm được chủ ngữ, động từ chính, tân ngữ/bổ ngữ trong câu kinh doanh.',
      vocabularyTheme: 'Văn phòng và chức danh',
      checkpointKind: 'LessonQuiz',
      passRate: 0.7,
      activities: [
        { id: 'act-1-1', type: 'Lesson', title: 'A1 · Từ loại và vị trí trong câu', estimatedMinutes: 40, required: true, topicCode: 'A1', lessonCode: 'LESSON-A1' },
        { id: 'act-1-2', type: 'Quiz', title: 'Quiz A1 · Áp dụng và giải thích từ loại', estimatedMinutes: 10, required: true, topicCode: 'A1' },
        { id: 'act-1-3', type: 'Lesson', title: 'A2 · Cấu trúc câu S–V–O và thành phần bổ sung', estimatedMinutes: 45, required: true, topicCode: 'A2', lessonCode: 'LESSON-A2' },
        { id: 'act-1-4', type: 'Quiz', title: 'Quiz A2 · Nhận diện chủ ngữ và động từ chính', estimatedMinutes: 10, required: true, topicCode: 'A2' },
        { id: 'act-1-5', type: 'Flashcard', title: 'Ôn từ vựng · Văn phòng và chức danh', estimatedMinutes: 10, required: false },
      ],
    },
    {
      weekNumber: 2,
      levelCode: 'A',
      title: 'Thời hiện tại và quá khứ',
      goal: 'Chọn thì theo trục thời gian (timeline) thay vì chỉ dựa vào một từ khóa đơn lẻ.',
      vocabularyTheme: 'Lịch làm việc và sự kiện',
      checkpointKind: 'LessonQuiz',
      passRate: 0.7,
      activities: [
        { id: 'act-2-1', type: 'Lesson', title: 'A3 · Hiện tại đơn và hiện tại tiếp diễn', estimatedMinutes: 40, required: true, topicCode: 'A3', lessonCode: 'LESSON-A3' },
        { id: 'act-2-2', type: 'Quiz', title: 'Quiz A3 · Phân biệt thói quen và lịch trình', estimatedMinutes: 10, required: true, topicCode: 'A3' },
        { id: 'act-2-3', type: 'Lesson', title: 'A4 · Quá khứ đơn và quá khứ tiếp diễn', estimatedMinutes: 40, required: true, topicCode: 'A4', lessonCode: 'LESSON-A4' },
        { id: 'act-2-4', type: 'Quiz', title: 'Quiz A4 · Mốc thời gian kết thúc', estimatedMinutes: 10, required: true, topicCode: 'A4' },
        { id: 'act-2-5', type: 'Flashcard', title: 'Ôn từ vựng · Lịch làm việc và quy trình', estimatedMinutes: 10, required: false },
      ],
    },
    {
      weekNumber: 3,
      levelCode: 'A',
      title: 'Tương lai và nhóm danh từ',
      goal: 'Diễn đạt kế hoạch/deadline và chọn lượng từ đúng tính đếm được của danh từ.',
      vocabularyTheme: 'Mua sắm và đặt hàng',
      checkpointKind: 'LessonQuiz',
      passRate: 0.7,
      activities: [
        { id: 'act-3-1', type: 'Lesson', title: 'A5 · Các cách diễn đạt tương lai', estimatedMinutes: 40, required: true, topicCode: 'A5', lessonCode: 'LESSON-A5' },
        { id: 'act-3-2', type: 'Lesson', title: 'A6 · Danh từ đếm được và không đếm được', estimatedMinutes: 40, required: true, topicCode: 'A6', lessonCode: 'LESSON-A6' },
        { id: 'act-3-3', type: 'Flashcard', title: 'Ôn từ vựng · Mua sắm và đơn hàng', estimatedMinutes: 10, required: false },
      ],
    },
    {
      weekNumber: 4,
      levelCode: 'A',
      title: 'Xác định danh từ và tham chiếu',
      goal: 'Dùng article, determiner và pronoun để câu rõ người/vật được nói tới.',
      vocabularyTheme: 'Tài liệu và giao tiếp nội bộ',
      checkpointKind: 'LessonQuiz',
      passRate: 0.7,
      activities: [
        { id: 'act-4-1', type: 'Lesson', title: 'A7 · Mạo từ và từ hạn định', estimatedMinutes: 35, required: true, topicCode: 'A7', lessonCode: 'LESSON-A7' },
        { id: 'act-4-2', type: 'Lesson', title: 'A8 · Đại từ và từ sở hữu', estimatedMinutes: 35, required: true, topicCode: 'A8', lessonCode: 'LESSON-A8' },
        { id: 'act-4-3', type: 'Flashcard', title: 'Ôn từ vựng · Tài liệu và giao tiếp', estimatedMinutes: 10, required: false },
      ],
    },
    {
      weekNumber: 5,
      levelCode: 'A',
      title: 'So sánh và ôn nền tảng',
      goal: 'So sánh đúng đối tượng và kết nối lại A1–A8 bằng bài ôn tập trộn lỗi sai.',
      vocabularyTheme: 'Chi phí và hiệu suất',
      checkpointKind: 'MixedReview',
      passRate: 0.7,
      activities: [
        { id: 'act-5-1', type: 'Lesson', title: 'A9 · So sánh cơ bản', estimatedMinutes: 40, required: true, topicCode: 'A9', lessonCode: 'LESSON-A9' },
        { id: 'act-5-2', type: 'MixedReview', title: 'Ôn trộn theo lỗi lần đầu và tag cần luyện A1–A8', estimatedMinutes: 30, required: true },
        { id: 'act-5-3', type: 'Flashcard', title: 'Ôn từ vựng · Chi phí và hiệu suất', estimatedMinutes: 10, required: false },
      ],
    },
    {
      weekNumber: 6,
      levelCode: 'A',
      title: 'Checkpoint A · Hoàn tất Mức Nền tảng',
      goal: 'Đánh giá 25 câu Part 5 nền tảng; xác định tối đa hai tag cần củng cố trước khi lên Mức B.',
      vocabularyTheme: 'Ôn tích lũy Mức A',
      checkpointKind: 'LevelCheckpoint',
      passRate: 0.7,
      activities: [
        { id: 'act-6-1', type: 'Checkpoint', title: 'Checkpoint Mức A · 25 câu Part 5 nền tảng', estimatedMinutes: 45, required: true, lessonCode: 'CHECKPOINT-A' },
      ],
    },

    // LEVEL B
    {
      weekNumber: 7,
      levelCode: 'B',
      title: 'Hai lớp thời gian hoàn thành',
      goal: 'Phân biệt present perfect, past perfect và mốc quá khứ đơn.',
      vocabularyTheme: 'Nhân sự và hồ sơ',
      checkpointKind: 'LessonQuiz',
      passRate: 0.7,
      activities: [
        { id: 'act-7-1', type: 'Lesson', title: 'B1 · Hiện tại hoàn thành', estimatedMinutes: 45, required: true, topicCode: 'B1', lessonCode: 'LESSON-B1' },
        { id: 'act-7-2', type: 'Quiz', title: 'Quiz B1 · Nhận diện since, for, already', estimatedMinutes: 10, required: true, topicCode: 'B1' },
        { id: 'act-7-3', type: 'Lesson', title: 'B2 · Quá khứ hoàn thành', estimatedMinutes: 40, required: true, topicCode: 'B2', lessonCode: 'LESSON-B2' },
        { id: 'act-7-4', type: 'Flashcard', title: 'Ôn từ vựng · Tuyển dụng và nhân sự', estimatedMinutes: 10, required: false },
      ],
    },
    {
      weekNumber: 8,
      levelCode: 'B',
      title: 'Tương lai nâng cao và bị động',
      goal: 'Chọn trọng tâm tiến trình/hoàn tất và cấu trúc active/passive theo thông tin.',
      vocabularyTheme: 'Dự án và quy trình',
      checkpointKind: 'LessonQuiz',
      passRate: 0.7,
      activities: [
        { id: 'act-8-1', type: 'Lesson', title: 'B3 · Tương lai tiếp diễn và tương lai hoàn thành', estimatedMinutes: 40, required: true, topicCode: 'B3', lessonCode: 'LESSON-B3' },
        { id: 'act-8-2', type: 'Lesson', title: 'B4 · Câu bị động', estimatedMinutes: 45, required: true, topicCode: 'B4', lessonCode: 'LESSON-B4' },
        { id: 'act-8-3', type: 'Quiz', title: 'Quiz B4 · Nhận diện cấu trúc bị động', estimatedMinutes: 10, required: true, topicCode: 'B4' },
      ],
    },
    {
      weekNumber: 9,
      levelCode: 'B',
      title: 'Điều kiện thực và giả định',
      goal: 'Phân loại zero/first/second conditional và tránh trộn timeline.',
      vocabularyTheme: 'Hợp đồng và phương án',
      checkpointKind: 'LessonQuiz',
      passRate: 0.7,
      activities: [
        { id: 'act-9-1', type: 'Lesson', title: 'B5 · Câu điều kiện loại 0, 1 và 2', estimatedMinutes: 45, required: true, topicCode: 'B5', lessonCode: 'LESSON-B5' },
        { id: 'act-9-2', type: 'Quiz', title: 'Quiz B5 · Điều kiện có thực và giả định', estimatedMinutes: 10, required: true, topicCode: 'B5' },
      ],
    },
    {
      weekNumber: 10,
      levelCode: 'B',
      title: 'Modal và verb complement',
      goal: 'Diễn đạt nghĩa vụ/sắc thái và chọn V-ing/to V theo pattern.',
      vocabularyTheme: 'Quy định và quyết định',
      checkpointKind: 'LessonQuiz',
      passRate: 0.7,
      activities: [
        { id: 'act-10-1', type: 'Lesson', title: 'B6 · Động từ khuyết thiếu', estimatedMinutes: 40, required: true, topicCode: 'B6', lessonCode: 'LESSON-B6' },
        { id: 'act-10-2', type: 'Lesson', title: 'B7 · Danh động từ và động từ nguyên mẫu', estimatedMinutes: 45, required: true, topicCode: 'B7', lessonCode: 'LESSON-B7' },
      ],
    },
    {
      weekNumber: 11,
      levelCode: 'B',
      title: 'Mệnh đề và liên kết',
      goal: 'Gắn relative clause đúng antecedent và chọn connector theo clause/phrase.',
      vocabularyTheme: 'Báo cáo và tuyển dụng',
      checkpointKind: 'LessonQuiz',
      passRate: 0.7,
      activities: [
        { id: 'act-11-1', type: 'Lesson', title: 'B8 · Mệnh đề quan hệ', estimatedMinutes: 45, required: true, topicCode: 'B8', lessonCode: 'LESSON-B8' },
        { id: 'act-11-2', type: 'Lesson', title: 'B9 · Liên từ kết hợp và phụ thuộc', estimatedMinutes: 45, required: true, topicCode: 'B9', lessonCode: 'LESSON-B9' },
      ],
    },
    {
      weekNumber: 12,
      levelCode: 'B',
      title: 'Giới từ và ôn trung cấp',
      goal: 'Phân biệt deadline/duration/location và ôn B1–B9 theo lỗi.',
      vocabularyTheme: 'Lịch họp và địa điểm',
      checkpointKind: 'MixedReview',
      passRate: 0.7,
      activities: [
        { id: 'act-12-1', type: 'Lesson', title: 'B10 · Giới từ thời gian và nơi chốn', estimatedMinutes: 40, required: true, topicCode: 'B10', lessonCode: 'LESSON-B10' },
        { id: 'act-12-2', type: 'MixedReview', title: 'Ôn trộn B1–B9 theo lỗi thực hành', estimatedMinutes: 30, required: true },
      ],
    },
    {
      weekNumber: 13,
      levelCode: 'B',
      title: 'Checkpoint B · Hoàn tất Mức Trung cấp',
      goal: 'Đánh giá 40 câu Part 5/6 ở mức trung bình và lập kế hoạch củng cố.',
      vocabularyTheme: 'Ôn tích lũy Mức B',
      checkpointKind: 'LevelCheckpoint',
      passRate: 0.7,
      activities: [
        { id: 'act-13-1', type: 'Checkpoint', title: 'Checkpoint Mức B · 40 câu Part 5/6', estimatedMinutes: 60, required: true, lessonCode: 'CHECKPOINT-B' },
      ],
    },

    // LEVEL C
    {
      weekNumber: 14,
      levelCode: 'C',
      title: 'Giả định quá khứ và bị động nâng cao',
      goal: 'Kết nối timeline giả định với reporting passive/causative.',
      vocabularyTheme: 'Rủi ro và bảo trì',
      checkpointKind: 'LessonQuiz',
      passRate: 0.75,
      activities: [
        { id: 'act-14-1', type: 'Lesson', title: 'C1 · Điều kiện loại 3 và hỗn hợp', estimatedMinutes: 50, required: true, topicCode: 'C1', lessonCode: 'LESSON-C1' },
        { id: 'act-14-2', type: 'Lesson', title: 'C2 · Bị động nâng cao và cấu trúc sai khiến', estimatedMinutes: 50, required: true, topicCode: 'C2', lessonCode: 'LESSON-C2' },
      ],
    },
    {
      weekNumber: 15,
      levelCode: 'C',
      title: 'Đảo ngữ có tín hiệu',
      goal: 'Nhận diện trigger và chọn đúng auxiliary thay vì học thuộc bề mặt.',
      vocabularyTheme: 'Văn bản trang trọng',
      checkpointKind: 'LessonQuiz',
      passRate: 0.75,
      activities: [
        { id: 'act-15-1', type: 'Lesson', title: 'C3 · Đảo ngữ với trạng từ hạn định', estimatedMinutes: 50, required: true, topicCode: 'C3', lessonCode: 'LESSON-C3' },
        { id: 'act-15-2', type: 'Quiz', title: 'Quiz C3 · Bài tập đảo ngữ trang trọng', estimatedMinutes: 10, required: true, topicCode: 'C3' },
      ],
    },
    {
      weekNumber: 16,
      levelCode: 'C',
      title: 'Song song và mệnh đề danh từ',
      goal: 'Giữ cấu trúc cân xứng và statement order trong embedded clause.',
      vocabularyTheme: 'Marketing và yêu cầu',
      checkpointKind: 'LessonQuiz',
      passRate: 0.75,
      activities: [
        { id: 'act-16-1', type: 'Lesson', title: 'C4 · Cấu trúc song song', estimatedMinutes: 45, required: true, topicCode: 'C4', lessonCode: 'LESSON-C4' },
        { id: 'act-16-2', type: 'Lesson', title: 'C5 · Mệnh đề danh từ', estimatedMinutes: 45, required: true, topicCode: 'C5', lessonCode: 'LESSON-C5' },
      ],
    },
    {
      weekNumber: 17,
      levelCode: 'C',
      title: 'Rút gọn bằng phân từ',
      goal: 'Rút gọn khi cùng chủ thể và tránh dangling modifier.',
      vocabularyTheme: 'Hợp đồng và địa điểm',
      checkpointKind: 'LessonQuiz',
      passRate: 0.75,
      activities: [
        { id: 'act-17-1', type: 'Lesson', title: 'C6 · Cụm phân từ và mệnh đề rút gọn', estimatedMinutes: 50, required: true, topicCode: 'C6', lessonCode: 'LESSON-C6' },
        { id: 'act-17-2', type: 'Quiz', title: 'Quiz C6 · Phân tích chủ thể ngầm', estimatedMinutes: 10, required: true, topicCode: 'C6' },
      ],
    },
    {
      weekNumber: 18,
      levelCode: 'C',
      title: 'Cặp liên từ và giả định yêu cầu',
      goal: 'Dùng correlative conjunctions song song và mandative subjunctive.',
      vocabularyTheme: 'Pháp lý và phối hợp',
      checkpointKind: 'LessonQuiz',
      passRate: 0.75,
      activities: [
        { id: 'act-18-1', type: 'Lesson', title: 'C7 · Liên từ tương quan', estimatedMinutes: 45, required: true, topicCode: 'C7', lessonCode: 'LESSON-C7' },
        { id: 'act-18-2', type: 'Lesson', title: 'C8 · Câu giả định trong đề xuất và yêu cầu', estimatedMinutes: 45, required: true, topicCode: 'C8', lessonCode: 'LESSON-C8' },
      ],
    },
    {
      weekNumber: 19,
      levelCode: 'C',
      title: 'Nhấn mạnh, số liệu và ôn nâng cao',
      goal: 'Đặt focus đúng chỗ và diễn đạt so sánh số liệu không mơ hồ.',
      vocabularyTheme: 'Tài chính và thuyết trình',
      checkpointKind: 'MixedReview',
      passRate: 0.75,
      activities: [
        { id: 'act-19-1', type: 'Lesson', title: 'C9 · Cấu trúc nhấn mạnh', estimatedMinutes: 40, required: true, topicCode: 'C9', lessonCode: 'LESSON-C9' },
        { id: 'act-19-2', type: 'Lesson', title: 'C10 · So sánh nâng cao', estimatedMinutes: 45, required: true, topicCode: 'C10', lessonCode: 'LESSON-C10' },
        { id: 'act-19-3', type: 'MixedReview', title: 'Ôn luyện nâng cao C1–C10', estimatedMinutes: 30, required: true },
      ],
    },
    {
      weekNumber: 20,
      levelCode: 'C',
      title: 'Checkpoint C lần đầu',
      goal: 'Đánh giá 40 câu nâng cao; kết quả thấp tạo đề xuất củng cố, không khóa học.',
      vocabularyTheme: 'Ôn tích lũy Mức C',
      checkpointKind: 'LevelCheckpoint',
      passRate: 0.75,
      activities: [
        { id: 'act-20-1', type: 'Checkpoint', title: 'Checkpoint Mức C · 40 câu nâng cao', estimatedMinutes: 60, required: true, lessonCode: 'CHECKPOINT-C' },
      ],
    },
    {
      weekNumber: 21,
      levelCode: 'C',
      title: 'Tuần củng cố thích ứng (Remediation)',
      goal: 'Ôn tối đa hai tag yếu từ checkpoint C hoặc luyện tổng hợp nếu đã đạt.',
      vocabularyTheme: 'Theo tag cá nhân',
      checkpointKind: 'Remediation',
      passRate: 0.75,
      activities: [
        { id: 'act-21-1', type: 'Remediation', title: 'Buổi củng cố 2 tag yếu từ checkpoint C', estimatedMinutes: 35, required: false },
      ],
    },

    // LEVEL D
    {
      weekNumber: 22,
      levelCode: 'D',
      title: 'Word form theo nghĩa và collocation',
      goal: 'Giải quyết nhiều đáp án cùng đúng từ loại bằng nghĩa và collocation.',
      vocabularyTheme: 'Kinh tế và vận hành',
      checkpointKind: 'LessonQuiz',
      passRate: 0.8,
      activities: [
        { id: 'act-22-1', type: 'Lesson', title: 'D1 · Phân biệt từ loại nâng cao', estimatedMinutes: 55, required: true, topicCode: 'D1', lessonCode: 'LESSON-D1' },
        { id: 'act-22-2', type: 'Quiz', title: 'Quiz D1 · Phân biệt affix và từ loại khó', estimatedMinutes: 10, required: true, topicCode: 'D1' },
      ],
    },
    {
      weekNumber: 23,
      levelCode: 'D',
      title: 'Collocation theo cụm',
      goal: 'Ghi nhớ dependent preposition và lexical chunk bằng retrieval.',
      vocabularyTheme: 'Collocation công việc',
      checkpointKind: 'LessonQuiz',
      passRate: 0.8,
      activities: [
        { id: 'act-23-1', type: 'Lesson', title: 'D2 · Giới từ cố định và collocation', estimatedMinutes: 55, required: true, topicCode: 'D2', lessonCode: 'LESSON-D2' },
      ],
    },
    {
      weekNumber: 24,
      levelCode: 'D',
      title: 'Register kinh doanh',
      goal: 'Chọn văn phong đúng thể loại, chính xác nhưng không cầu kỳ giả tạo.',
      vocabularyTheme: 'Email và thông báo',
      checkpointKind: 'LessonQuiz',
      passRate: 0.8,
      activities: [
        { id: 'act-24-1', type: 'Lesson', title: 'D3 · Văn phong trang trọng trong kinh doanh', estimatedMinutes: 50, required: true, topicCode: 'D3', lessonCode: 'LESSON-D3' },
      ],
    },
    {
      weekNumber: 25,
      levelCode: 'D',
      title: 'Cấu trúc rút gọn sâu',
      goal: 'Phân tích noun phrase dài và khôi phục clause để kiểm voice/timeline.',
      vocabularyTheme: 'Chính sách và tài liệu',
      checkpointKind: 'LessonQuiz',
      passRate: 0.8,
      activities: [
        { id: 'act-25-1', type: 'Lesson', title: 'D4 · Rút gọn mệnh đề quan hệ và trạng ngữ', estimatedMinutes: 55, required: true, topicCode: 'D4', lessonCode: 'LESSON-D4' },
      ],
    },
    {
      weekNumber: 26,
      levelCode: 'D',
      title: 'Kết quả và nhượng bộ',
      goal: 'Phân biệt so/such và connector theo clause/phrase.',
      vocabularyTheme: 'Đàm phán và tiến độ',
      checkpointKind: 'LessonQuiz',
      passRate: 0.8,
      activities: [
        { id: 'act-26-1', type: 'Lesson', title: 'D5 · So...that và such...that', estimatedMinutes: 40, required: true, topicCode: 'D5', lessonCode: 'LESSON-D5' },
        { id: 'act-26-2', type: 'Lesson', title: 'D6 · Despite, although và các cấu trúc nhượng bộ', estimatedMinutes: 40, required: true, topicCode: 'D6', lessonCode: 'LESSON-D6' },
      ],
    },
    {
      weekNumber: 27,
      levelCode: 'D',
      title: 'Tường thuật và ôn D1–D6',
      goal: 'Chọn reporting pattern, viewpoint và backshift hợp lý.',
      vocabularyTheme: 'Khách hàng và báo cáo',
      checkpointKind: 'MixedReview',
      passRate: 0.8,
      activities: [
        { id: 'act-27-1', type: 'Lesson', title: 'D7 · Câu hỏi gián tiếp và tường thuật nâng cao', estimatedMinutes: 50, required: true, topicCode: 'D7', lessonCode: 'LESSON-D7' },
        { id: 'act-27-2', type: 'MixedReview', title: 'Ôn tập tổng hợp D1–D6', estimatedMinutes: 30, required: true },
      ],
    },
    {
      weekNumber: 28,
      levelCode: 'D',
      title: 'Quy trình tránh bẫy Part 5/6',
      goal: 'Phân loại item, loại theo cấu trúc và ghi reason code khi sai.',
      vocabularyTheme: 'Bẫy trong đề',
      checkpointKind: 'LessonQuiz',
      passRate: 0.8,
      activities: [
        { id: 'act-28-1', type: 'Lesson', title: 'D8 · Nhận diện bẫy Part 5/6', estimatedMinutes: 60, required: true, topicCode: 'D8', lessonCode: 'LESSON-D8' },
        { id: 'act-28-2', type: 'Quiz', title: 'Quiz D8 · Chiến thuật giải bẫy trong 10 giây', estimatedMinutes: 10, required: true, topicCode: 'D8' },
      ],
    },
    {
      weekNumber: 29,
      levelCode: 'D',
      title: 'Discourse trong Part 6',
      goal: 'Dự đoán quan hệ câu trước khi chọn transition.',
      vocabularyTheme: 'Thông báo và email',
      checkpointKind: 'LessonQuiz',
      passRate: 0.8,
      activities: [
        { id: 'act-29-1', type: 'Lesson', title: 'D9 · Liên từ chuyển tiếp trong Part 6', estimatedMinutes: 55, required: true, topicCode: 'D9', lessonCode: 'LESSON-D9' },
      ],
    },
    {
      weekNumber: 30,
      levelCode: 'D',
      title: 'Đảo điều kiện và cấu trúc nén',
      goal: 'Khôi phục conditional và tách head noun khỏi chuỗi modifier.',
      vocabularyTheme: 'Điều khoản và phân tích',
      checkpointKind: 'MixedReview',
      passRate: 0.85,
      activities: [
        { id: 'act-30-1', type: 'Lesson', title: 'D10 · Đảo ngữ trong câu điều kiện', estimatedMinutes: 50, required: true, topicCode: 'D10', lessonCode: 'LESSON-D10' },
        { id: 'act-30-2', type: 'Lesson', title: 'D11 · Cấu trúc nén thông tin và nominalization', estimatedMinutes: 60, required: true, topicCode: 'D11', lessonCode: 'LESSON-D11' },
      ],
    },
    {
      weekNumber: 31,
      levelCode: 'D',
      title: 'Checkpoint hoàn thành lộ trình (Level D)',
      goal: 'Đánh giá 46 câu Part 5/6; báo cáo độ chính xác và các tag yếu, không quy đổi điểm TOEIC.',
      vocabularyTheme: 'Ôn tích lũy toàn khóa',
      checkpointKind: 'LevelCheckpoint',
      passRate: 0.85,
      activities: [
        { id: 'act-31-1', type: 'Checkpoint', title: 'Checkpoint Mức D · 46 câu Part 5/6', estimatedMinutes: 75, required: true, lessonCode: 'CHECKPOINT-D' },
      ],
    },
  ],
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
      'Kết quả là chỉ báo học tập nhằm định hướng kiến thức, không phải điểm TOEIC chính thức.'
    ],
    remediationPolicy: [
      'Đạt ngưỡng (>= 70%): Đủ điều kiện chuyển tiếp sang Level B (Trung cấp ứng dụng).',
      'Chưa đạt (< 70%): Hệ thống đề xuất 2 buổi ôn tập tập trung vào các tag yếu (A1-A4) trước khi mở quyền làm lại sau 3-5 ngày.'
    ]
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
      'Cần giải thích lý do loại trừ khi hoàn tất để ghi nhận Error Notebook.'
    ],
    remediationPolicy: [
      'Đạt ngưỡng (>= 70%): Mở khóa Level C (Cấu trúc nâng cao có kiểm soát).',
      'Chưa đạt (< 70%): Thực hiện bài ôn củng cố thì và thể bị động; làm lại sau tối thiểu 3 ngày.'
    ]
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
      'Đánh giá chuyên sâu năng lực giải thích cấu trúc thay vì đoán mò.'
    ],
    remediationPolicy: [
      'Đạt ngưỡng (>= 75%): Đủ điều kiện tham gia Level D (Chuyên sâu Part 5/6).',
      'Chưa đạt (< 75%): Bắt buộc tham gia tuần 21 Remediation để rà soát lỗi trước khi thi lại.'
    ]
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
      'Báo cáo chi tiết accuracy theo từng primary tag, không quy đổi bừa bãi ra band điểm 900+.'
    ],
    remediationPolicy: [
      'Đạt ngưỡng (>= 85%): Hoàn tất trọn vẹn lộ trình 31 tuần TOEIC Reading.',
      'Chưa đạt (< 85%): Cần ôn tập tích lũy toàn khóa ít nhất 7 ngày trước khi thi lại.'
    ]
  }
};

export function getTopicByCode(code: string): KnowledgeTopic | undefined {
  const norm = code.toUpperCase().replace(/^LESSON-/, '');
  return (toeicReadingCurriculum.topics as Record<string, KnowledgeTopic>)[norm];
}

export function getCheckpointByCode(code: string): CheckpointInfo | undefined {
  const normalized = code.toUpperCase().replace(/^LESSON-/, '');
  return checkpointCatalog[normalized] || checkpointCatalog[code];
}

