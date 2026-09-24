import { ExamForm, QuestionSnapshot } from '../../types/practice';
import { MistakeRecord, FlashcardItem } from '../../types/review';
import { CandidateQualityReview, GenerationJobSummary } from '../../types/admin';

export const mockExamForms: ExamForm[] = [
  {
    id: 'form-p5-001',
    title: 'Part 5 Luyện tập: Ngữ pháp & Từ vựng nâng cao',
    part: 'Part5',
    tier: 'BetaPractice',
    questionCount: 30,
    durationMinutes: 15,
    description: 'Tập trung vào liên từ, mệnh đề quan hệ và biến đổi từ loại trong ngữ cảnh văn phòng kinh doanh.',
  },
  {
    id: 'form-p7-001',
    title: 'Part 7 Đọc hiểu: Đoạn đơn & Đoạn kép thương mại',
    part: 'Part7',
    tier: 'BetaPractice',
    questionCount: 20,
    durationMinutes: 25,
    description: 'Email giao dịch, thông báo nội bộ và biểu mẫu khảo sát khách hàng có trích dẫn bằng chứng.',
  },
  {
    id: 'form-full-rd-001',
    title: 'Full Reading Simulation: Test 01',
    part: 'FullReading',
    tier: 'BetaPractice',
    questionCount: 100,
    durationMinutes: 75,
    description: 'Mô phỏng đầy đủ 100 câu đọc (Part 5, 6, 7) theo chuẩn thời gian 75 phút.',
  },
  {
    id: 'form-p5-val-001',
    title: 'Part 5 Chẩn đoán: Mẫu câu chuẩn ETS đối soát',
    part: 'Part5',
    tier: 'DataValidatedPractice',
    questionCount: 20,
    durationMinutes: 10,
    description: 'Bộ câu hỏi đã qua kiểm định thống kê và đối soát người học.',
  },
  {
    id: 'form-mini-001',
    title: 'Mini Test 01: Khảo sát phản xạ tốc độ nhanh',
    part: 'MiniTest',
    tier: 'BetaPractice',
    questionCount: 30,
    durationMinutes: 20,
    description: 'Bài kiểm tra tinh gọn gồm 15 câu Part 5 và 15 câu Part 7 giúp đánh giá nhanh phong độ trước giờ thi.',
  },
  {
    id: 'form-p5-speed',
    title: 'Part 5 Tốc độ cao: 30 câu trong 12 phút (Target 800+)',
    part: 'Part5',
    tier: 'BetaPractice',
    questionCount: 30,
    durationMinutes: 12,
    description: 'Luyện kỹ năng giải nhanh 24 giây/câu, nhận diện ngay cấu trúc ngữ pháp và collocations cốt lõi.',
  },
];

export const mockPart5Questions: QuestionSnapshot[] = [
  {
    id: 'q-p5-101',
    sequenceNumber: 101,
    part: 'Part5',
    knowledgeTag: 'Từ loại (Word Form)',
    prompt: 'Mr. Henderson requested that all expense reports be submitted ------- by the end of the business day.',
    options: [
      { id: 'opt-1', label: 'A', text: 'prompt' },
      { id: 'opt-2', label: 'B', text: 'promptly' },
      { id: 'opt-3', label: 'C', text: 'promptness' },
      { id: 'opt-4', label: 'D', text: 'prompting' },
    ],
  },
  {
    id: 'q-p5-102',
    sequenceNumber: 102,
    part: 'Part5',
    knowledgeTag: 'Giới từ (Preposition)',
    prompt: 'The keynote speaker addressed the audience ------- great enthusiasm, receiving a standing ovation.',
    options: [
      { id: 'opt-5', label: 'A', text: 'with' },
      { id: 'opt-6', label: 'B', text: 'from' },
      { id: 'opt-7', label: 'C', text: 'among' },
      { id: 'opt-8', label: 'D', text: 'between' },
    ],
  },
  {
    id: 'q-p5-103',
    sequenceNumber: 103,
    part: 'Part5',
    knowledgeTag: 'Liên từ (Conjunction)',
    prompt: '------- the renovation of the corporate cafeteria was completed ahead of schedule, the reopening was delayed.',
    options: [
      { id: 'opt-9', label: 'A', text: 'Because' },
      { id: 'opt-10', label: 'B', text: 'Although' },
      { id: 'opt-11', label: 'C', text: 'Unless' },
      { id: 'opt-12', label: 'D', text: 'Despite' },
    ],
  },
  {
    id: 'q-p5-104',
    sequenceNumber: 104,
    part: 'Part5',
    knowledgeTag: 'Đại từ (Pronouns)',
    prompt: 'Employees must renew their security badges on ------- own before the current access permits expire.',
    options: [
      { id: 'opt-13', label: 'A', text: 'they' },
      { id: 'opt-14', label: 'B', text: 'their' },
      { id: 'opt-15', label: 'C', text: 'them' },
      { id: 'opt-16', label: 'D', text: 'themselves' },
    ],
  },
  {
    id: 'q-p5-105',
    sequenceNumber: 105,
    part: 'Part5',
    knowledgeTag: 'Từ vựng (Vocabulary)',
    prompt: 'The new inventory software is expected to ------- the processing time for international shipments significantly.',
    options: [
      { id: 'opt-17', label: 'A', text: 'reduce' },
      { id: 'opt-18', label: 'B', text: 'decline' },
      { id: 'opt-19', label: 'C', text: 'postpone' },
      { id: 'opt-20', label: 'D', text: 'terminate' },
    ],
  },
];

export const mockPart7Questions: QuestionSnapshot[] = [
  {
    id: 'q-p7-147',
    sequenceNumber: 147,
    part: 'Part7',
    knowledgeTag: 'Chi tiết thông tin (Factual Detail)',
    prompt: 'Why did Ms. Alvarez write the e-mail?',
    options: [
      { id: 'opt-21', label: 'A', text: 'To cancel a subscription to a trade journal' },
      { id: 'opt-22', label: 'B', text: 'To request an adjustment to an invoice' },
      { id: 'opt-23', label: 'C', text: 'To inquire about product availability' },
      { id: 'opt-24', label: 'D', text: 'To schedule a maintenance consultation' },
    ],
    stimulusId: 'stim-01',
    stimulusTitle: 'E-mail: Invoicing Query',
    stimulusType: 'SinglePassage',
    stimulusText: `To: billing@apexsupplies.com
From: malvarez@solardynamics.net
Date: October 14, 2026
Subject: Order #AX-8921 Billing Clarification

Dear Support Team,

I am writing regarding invoice #8921 received this morning for our recent office furniture delivery. According to the original sales quotation provided by Mr. Robert Vance on October 2, our order qualified for a 15% promotional discount on orders exceeding $3,000. 

However, the final invoice shows the full balance without this adjustment applied. Could you please issue a revised billing statement reflecting the promotional pricing before we initiate payment?

Thank you for your prompt assistance.

Sincerely,
Elena Alvarez
Procurement Manager, Solar Dynamics`,
  },
  {
    id: 'q-p7-148',
    sequenceNumber: 148,
    part: 'Part7',
    knowledgeTag: 'Suy luận (Inference)',
    prompt: 'What can be inferred about Solar Dynamics?',
    options: [
      { id: 'opt-25', label: 'A', text: 'It placed an order totaling over $3,000.' },
      { id: 'opt-26', label: 'B', text: 'It recently hired Mr. Robert Vance.' },
      { id: 'opt-27', label: 'C', text: 'It manufactures office furniture.' },
      { id: 'opt-28', label: 'D', text: 'It refused to accept the morning delivery.' },
    ],
    stimulusId: 'stim-01',
    stimulusTitle: 'E-mail: Invoicing Query',
    stimulusType: 'SinglePassage',
    stimulusText: `To: billing@apexsupplies.com
From: malvarez@solardynamics.net
Date: October 14, 2026
Subject: Order #AX-8921 Billing Clarification

Dear Support Team,

I am writing regarding invoice #8921 received this morning for our recent office furniture delivery. According to the original sales quotation provided by Mr. Robert Vance on October 2, our order qualified for a 15% promotional discount on orders exceeding $3,000. 

However, the final invoice shows the full balance without this adjustment applied. Could you please issue a revised billing statement reflecting the promotional pricing before we initiate payment?

Thank you for your prompt assistance.

Sincerely,
Elena Alvarez
Procurement Manager, Solar Dynamics`,
  },
];

export const mockMistakes: MistakeRecord[] = [
  {
    id: 'mis-01',
    questionId: 'q-p5-101',
    part: 'Part 5',
    knowledgeTag: 'Từ loại (Word Form)',
    errorType: 'Ngữ pháp',
    prompt: 'Mr. Henderson requested that all expense reports be submitted ------- by the end of the business day.',
    translation: 'Ông Henderson đã yêu cầu rằng tất cả các báo cáo chi phí phải được nộp kịp thời trước khi kết thúc ngày làm việc.',
    options: [
      { key: 'A', text: 'prompt', isCorrect: false },
      { key: 'B', text: 'promptly', isCorrect: true },
      { key: 'C', text: 'promptness', isCorrect: false },
      { key: 'D', text: 'prompting', isCorrect: false },
    ],
    selectedAnswer: 'A. prompt',
    correctAnswer: 'B. promptly',
    explanation: 'Vị trí này đứng sau cụm động từ bị động "be submitted", cần một phó từ (adverb) để bổ nghĩa cho động từ hành động. "Promptly" mang nghĩa là "ngay lập tức, đúng giờ".',
    mistakeCount: 2,
    lastMistakeAt: '2026-09-22T15:30:00Z',
    status: 'Open',
  },
  {
    id: 'mis-02',
    questionId: 'q-p5-103',
    part: 'Part 5',
    knowledgeTag: 'Liên từ (Conjunction)',
    errorType: 'Bẫy đề thi',
    prompt: '------- the renovation of the corporate cafeteria was completed ahead of schedule, the reopening was delayed.',
    translation: 'Mặc dù việc cải tạo căng tin công ty đã hoàn tất trước thời hạn, việc mở cửa trở lại vẫn bị trì hoãn.',
    options: [
      { key: 'A', text: 'Because', isCorrect: false },
      { key: 'B', text: 'Although', isCorrect: true },
      { key: 'C', text: 'Unless', isCorrect: false },
      { key: 'D', text: 'Despite', isCorrect: false },
    ],
    selectedAnswer: 'D. Despite',
    correctAnswer: 'B. Although',
    explanation: 'Bẫy phân biệt Liên từ và Giới từ: Phía sau chỗ trống là mệnh đề hoàn chỉnh (S + V: the renovation was completed), do đó bắt buộc dùng Liên từ "Although". "Despite" chỉ đi với Cụm danh từ hoặc V-ing.',
    mistakeCount: 1,
    lastMistakeAt: '2026-09-21T09:12:00Z',
    status: 'Open',
  },
  {
    id: 'mis-03',
    questionId: 'q-p5-107',
    part: 'Part 5',
    knowledgeTag: 'Thì của động từ (Verb Tense)',
    errorType: 'Đọc vội / Sai thì',
    prompt: 'Over the last six months, the marketing division ------- three new product campaigns across Europe.',
    translation: 'Trong sáu tháng qua, bộ phận tiếp thị đã triển khai ba chiến dịch sản phẩm mới trên khắp châu Âu.',
    options: [
      { key: 'A', text: 'launches', isCorrect: false },
      { key: 'B', text: 'has launched', isCorrect: true },
      { key: 'C', text: 'launched', isCorrect: false },
      { key: 'D', text: 'is launching', isCorrect: false },
    ],
    selectedAnswer: 'C. launched',
    correctAnswer: 'B. has launched',
    explanation: 'Cụm thời gian "Over the last six months" là dấu hiệu của thì Hiện tại hoàn thành diễn tả hành động kéo dài đến hiện tại. Đọc vội chữ "last" dễ bị nhầm sang Quá khứ đơn.',
    mistakeCount: 1,
    lastMistakeAt: '2026-09-23T11:20:00Z',
    status: 'Improving',
  },
  {
    id: 'mis-04',
    questionId: 'q-p5-108',
    part: 'Part 5',
    knowledgeTag: 'Cặp từ dễ nhầm (Collocation)',
    errorType: 'Từ vựng mới',
    prompt: 'Upgrading the warehouse lighting system proved to be an _______ investment for the logistics center.',
    translation: 'Việc nâng cấp hệ thống chiếu sáng nhà kho đã chứng minh là một khoản đầu tư tiết kiệm chi phí cho trung tâm hậu cần.',
    options: [
      { key: 'A', text: 'economic', isCorrect: false },
      { key: 'B', text: 'economical', isCorrect: true },
      { key: 'C', text: 'economy', isCorrect: false },
      { key: 'D', text: 'economize', isCorrect: false },
    ],
    selectedAnswer: 'A. economic',
    correctAnswer: 'B. economical',
    explanation: 'Phân biệt: "economic" là thuộc về kinh tế vĩ mô (economic growth), còn "economical" là tiết kiệm chi phí/tiền bạc (an economical car/investment).',
    mistakeCount: 2,
    lastMistakeAt: '2026-09-23T14:45:00Z',
    status: 'Open',
  },
  {
    id: 'mis-05',
    questionId: 'q-p7-148',
    part: 'Part 7',
    knowledgeTag: 'Suy luận (Inference)',
    errorType: 'Đọc vội / Sai thì',
    prompt: 'What can be inferred about Solar Dynamics from the purchase order confirmation?',
    translation: 'Điều gì có thể được suy ra về Solar Dynamics từ bản xác nhận đơn đặt hàng?',
    options: [
      { key: 'A', text: 'It placed an order totaling over $3,000.', isCorrect: true },
      { key: 'B', text: 'It cancelled its maintenance contract.', isCorrect: false },
      { key: 'C', text: 'It manufactures office furniture.', isCorrect: false },
      { key: 'D', text: 'It plans to relocate next quarter.', isCorrect: false },
    ],
    selectedAnswer: 'C. It manufactures office furniture.',
    correctAnswer: 'A. It placed an order totaling over $3,000.',
    explanation: 'Trong e-mail có câu "our order qualified for a 15% promotional discount on orders exceeding $3,000", cho thấy đơn hàng phải trên $3,000 thì mới đủ điều kiện áp dụng.',
    mistakeCount: 1,
    lastMistakeAt: '2026-09-20T20:00:00Z',
    status: 'Resolved',
  },
];

export const mockFlashcards: FlashcardItem[] = [
  {
    id: 'fc-01',
    wordOrPhrase: 'Promptly',
    ipa: '/ˈprɒmpt.li/',
    partOfSpeech: 'adverb',
    vietnameseMeaning: 'Ngay lập tức, đúng giờ, không chậm trễ',
    collocation: 'submit promptly, respond promptly',
    contextSentence: 'All expense reports must be submitted promptly to the finance department.',
    translation: 'Tất cả các báo cáo chi phí phải được nộp kịp thời cho bộ phận tài chính.',
    wordFamily: 'prompt (adj), promptness (n)',
    knowledgeTag: 'Từ vựng công sở',
    dueAt: '2026-09-23T08:00:00Z',
    intervalDays: 1,
    reviewCount: 3,
  },
  {
    id: 'fc-02',
    wordOrPhrase: 'Standing ovation',
    ipa: '/ˌstæn.dɪŋ oʊˈveɪ.ʃən/',
    partOfSpeech: 'noun phrase',
    vietnameseMeaning: 'Sự vỗ tay nhiệt liệt kéo dài khi cả khán phòng đứng dậy',
    collocation: 'receive a standing ovation',
    contextSentence: 'The keynote speaker delivered a compelling presentation and received a standing ovation.',
    translation: 'Diễn giả chính đã có bài thuyết trình đầy lôi cuốn và nhận được tràng pháo tay đứng nhiệt liệt.',
    knowledgeTag: 'Hội nghị & Sự kiện',
    dueAt: '2026-09-23T10:00:00Z',
    intervalDays: 2,
    reviewCount: 4,
  },
  {
    id: 'fc-03',
    wordOrPhrase: 'Ahead of schedule',
    ipa: '/əˈhed əv ˈskedʒ.uːl/',
    partOfSpeech: 'idiom / adverbial',
    vietnameseMeaning: 'Trước thời hạn quy định, sớm hơn tiến độ dự kiến',
    collocation: 'completed ahead of schedule, finish ahead of schedule',
    contextSentence: 'The construction of the new terminal was finished two months ahead of schedule.',
    translation: 'Công trình nhà ga mới được hoàn thành sớm hơn dự kiến hai tháng.',
    wordFamily: 'on schedule (đúng hạn), behind schedule (trễ hạn)',
    knowledgeTag: 'Quản lý dự án',
    dueAt: '2026-09-23T12:00:00Z',
    intervalDays: 4,
    reviewCount: 5,
  },
  {
    id: 'fc-04',
    wordOrPhrase: 'Confidential',
    ipa: '/ˌkɒn.fɪˈden.ʃəl/',
    partOfSpeech: 'adjective',
    vietnameseMeaning: 'Bảo mật, cơ mật, không tiết lộ ra ngoài',
    collocation: 'strictly confidential, confidential document / report',
    contextSentence: 'Personnel files must remain strictly confidential under corporate security policy.',
    translation: 'Hồ sơ nhân sự phải được giữ bảo mật tuyệt đối theo chính sách an ninh công ty.',
    wordFamily: 'confidentiality (n), confidentially (adv)',
    knowledgeTag: 'Bảo mật & Pháp lý',
    dueAt: '2026-09-24T07:00:00Z',
    intervalDays: 1,
    reviewCount: 2,
  },
  {
    id: 'fc-05',
    wordOrPhrase: 'Compliance',
    ipa: '/kəmˈplaɪ.əns/',
    partOfSpeech: 'noun',
    vietnameseMeaning: 'Sự tuân thủ đúng quy định hoặc tiêu chuẩn',
    collocation: 'in compliance with regulations, ensure compliance',
    contextSentence: 'The factory operates in full compliance with international safety protocols.',
    translation: 'Nhà máy vận hành hoàn toàn tuân thủ các quy chuẩn an toàn quốc tế.',
    wordFamily: 'comply (v), compliant (adj)',
    knowledgeTag: 'Quy trình & Vận hành',
    dueAt: '2026-09-24T08:30:00Z',
    intervalDays: 2,
    reviewCount: 3,
  },
  {
    id: 'fc-06',
    wordOrPhrase: 'Substantially',
    ipa: '/səbˈstæn.ʃəl.i/',
    partOfSpeech: 'adverb',
    vietnameseMeaning: 'Một cách đáng kể, về căn bản',
    collocation: 'increase substantially, substantially higher/lower',
    contextSentence: 'Third-quarter export revenue increased substantially compared to the previous forecast.',
    translation: 'Doanh thu xuất khẩu quý 3 đã tăng đáng kể so với dự báo trước đó.',
    wordFamily: 'substantial (adj), substance (n)',
    knowledgeTag: 'Tài chính & Doanh thu',
    dueAt: '2026-09-24T09:00:00Z',
    intervalDays: 3,
    reviewCount: 4,
  },
  {
    id: 'fc-07',
    wordOrPhrase: 'Designated',
    ipa: '/ˈdez.ɪɡ.neɪ.tɪd/',
    partOfSpeech: 'participle / adj.',
    vietnameseMeaning: 'Được chỉ định, được phân bổ cho mục đích cụ thể',
    collocation: 'designated parking area, designated representative',
    contextSentence: 'Visitors must park only in designated visitor stalls near the front entrance.',
    translation: 'Khách đến thăm chỉ được đỗ xe tại các ô đỗ chỉ định gần lối vào phía trước.',
    wordFamily: 'designate (v), designation (n)',
    knowledgeTag: 'Văn phòng & Tòa nhà',
    dueAt: '2026-09-24T10:00:00Z',
    intervalDays: 1,
    reviewCount: 1,
  },
  {
    id: 'fc-08',
    wordOrPhrase: 'Notwithstanding',
    ipa: '/ˌnɒt.wɪðˈstæn.dɪŋ/',
    partOfSpeech: 'preposition (Bẫy 800+)',
    vietnameseMeaning: 'Mặc dù, bất chấp (đồng nghĩa với despite)',
    collocation: 'notwithstanding the weather, notwithstanding objections',
    contextSentence: 'Notwithstanding recent supply disruptions, the manufacturer met its delivery target.',
    translation: 'Bất chấp những gián đoạn nguồn cung gần đây, nhà sản xuất vẫn đạt được mục tiêu giao hàng.',
    knowledgeTag: 'Bẫy đề thi nâng cao',
    dueAt: '2026-09-24T11:00:00Z',
    intervalDays: 1,
    reviewCount: 2,
  },
];

export const mockCandidateReviews: CandidateQualityReview[] = [
  {
    candidateId: 'cand-p5-8910',
    part: 'Part 5',
    prompt: 'The newly appointed director pledged to conduct an ------- audit of the quarterly expenditures.',
    options: [
      { label: 'A', text: 'exhausting', isCorrect: false },
      { label: 'B', text: 'exhaustive', isCorrect: true },
      { label: 'C', text: 'exhausted', isCorrect: false },
      { label: 'D', text: 'exhaust', isCorrect: false },
    ],
    explanation: '"Exhaustive" là tính từ có nghĩa là "toàn diện, thấu đáo". "Exhausting" mang nghĩa "gây kiệt sức".',
    structuralValidation: {
      passed: true,
      details: '4 options, 1 valid key, length constraints satisfied, no formatting leaks.',
    },
    blindSolvers: {
      solverA: { selectedAnswer: 'B', passed: true },
      solverB: { selectedAnswer: 'B', passed: true },
      consensus: true,
    },
    criticReview: {
      severity: 'None',
      findings: [],
    },
    quarantineStatus: 'None',
  },
  {
    candidateId: 'cand-p5-8911',
    part: 'Part 5',
    prompt: 'Unless the weather conditions ------- by noon, the outdoor reception will be relocated inside.',
    options: [
      { label: 'A', text: 'improve', isCorrect: true },
      { label: 'B', text: 'improves', isCorrect: false },
      { label: 'C', text: 'improving', isCorrect: false },
      { label: 'D', text: 'improvement', isCorrect: false },
    ],
    explanation: 'Chủ ngữ "weather conditions" là danh từ số nhiều, nên động từ ở thì hiện tại đơn chia nguyên mẫu là "improve".',
    structuralValidation: {
      passed: true,
      details: 'Validated successfully.',
    },
    blindSolvers: {
      solverA: { selectedAnswer: 'A', passed: true },
      solverB: { selectedAnswer: 'A', passed: true },
      consensus: true,
    },
    criticReview: {
      severity: 'Warning',
      findings: ['Mệnh đề điều kiện có thể quá quen thuộc trong các ngân hàng câu hỏi chuẩn.'],
    },
    quarantineStatus: 'None',
  },
  {
    candidateId: 'cand-p5-8912',
    part: 'Part 5',
    prompt: 'The CEO was pleased with the result of the ------- negotiation with overseas suppliers.',
    options: [
      { label: 'A', text: 'success', isCorrect: false },
      { label: 'B', text: 'successful', isCorrect: true },
      { label: 'C', text: 'successfully', isCorrect: false },
      { label: 'D', text: 'succeed', isCorrect: false },
    ],
    explanation: 'Vị trí trước danh từ "negotiation" cần một tính từ "successful".',
    structuralValidation: {
      passed: true,
      details: 'Pass',
    },
    blindSolvers: {
      solverA: { selectedAnswer: 'B', passed: true },
      solverB: { selectedAnswer: 'C', passed: false }, // Solver disagreement!
      consensus: false,
    },
    criticReview: {
      severity: 'Blocking',
      findings: ['Bất đồng thuận giữa 2 solver độc lập (Solver B chọn C). Chặn phát hành lên Beta.'],
    },
    quarantineStatus: 'Quarantined',
    quarantineReason: 'Dual-solver consensus failed: Blocking finding.',
  },
];

export const mockGenerationJobs: GenerationJobSummary[] = [
  {
    jobId: 'job-bp-p5-v2-001',
    blueprintVersion: 'BP-P5-v2.1',
    part: 'Part 5',
    quotaRequested: 10,
    candidatesGenerated: 10,
    acceptedCount: 8,
    rejectedCount: 2,
    status: 'Completed',
    startedAt: '2026-09-23T06:00:00Z',
  },
  {
    jobId: 'job-bp-p7-v1-002',
    blueprintVersion: 'BP-P7-v1.0',
    part: 'Part 7',
    quotaRequested: 5,
    candidatesGenerated: 5,
    acceptedCount: 4,
    rejectedCount: 1,
    status: 'Completed',
    startedAt: '2026-09-23T08:30:00Z',
  },
];
