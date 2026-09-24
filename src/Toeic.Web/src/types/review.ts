export type MistakeStatus = 'Open' | 'Improving' | 'Resolved' | 'Ignored';

export interface MistakeOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
  isCorrect: boolean;
}

export interface MistakeRecord {
  id: string;
  questionId: string;
  part: string;
  knowledgeTag: string;
  prompt: string;
  options?: MistakeOption[];
  selectedAnswer: string;
  correctAnswer: string;
  explanation: string;
  mistakeCount: number;
  lastMistakeAt: string;
  status: MistakeStatus;
  ignoreReason?: string;
  errorType?: 'Ngữ pháp' | 'Từ vựng mới' | 'Bẫy đề thi' | 'Đọc vội / Sai thì';
  translation?: string;
}

export type FlashcardRating = 'again' | 'hard' | 'good' | 'easy';

export interface FlashcardItem {
  id: string;
  wordOrPhrase: string;
  contextSentence: string;
  vietnameseMeaning: string;
  partOfSpeech: string;
  audioUrl?: string;
  knowledgeTag: string;
  dueAt: string;
  intervalDays: number;
  reviewCount: number;
  ipa?: string;
  collocation?: string;
  translation?: string;
  wordFamily?: string;
}

