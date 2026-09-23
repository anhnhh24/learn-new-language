export type MistakeStatus = 'Open' | 'Improving' | 'Resolved' | 'Ignored';

export interface MistakeRecord {
  id: string;
  questionId: string;
  part: string;
  knowledgeTag: string;
  prompt: string;
  selectedAnswer: string;
  correctAnswer: string;
  explanation: string;
  mistakeCount: number;
  lastMistakeAt: string;
  status: MistakeStatus;
  ignoreReason?: string;
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
}
