export type FormTier = 'BetaPractice' | 'DataValidatedPractice';
export type ExamPart = 'Part1' | 'Part2' | 'Part3' | 'Part4' | 'Part5' | 'Part6' | 'Part7';
export type ExamMode = 'Drill' | 'Practice' | 'Mock';

export interface OptionSnapshot {
  id: string;
  label: string; // 'A', 'B', 'C', 'D'
  text: string;
}

export interface QuestionSnapshot {
  id: string;
  sequenceNumber: number;
  part: ExamPart;
  prompt: string;
  options: OptionSnapshot[];
  stimulusId?: string;
  stimulusTitle?: string;
  stimulusText?: string;
  stimulusType?: 'SinglePassage' | 'DoublePassage' | 'TriplePassage';
  knowledgeTag?: string;
}

export interface ExamForm {
  id: string;
  title: string;
  part: ExamPart | 'FullReading' | 'FullListening';
  tier: FormTier;
  questionCount: number;
  durationMinutes: number;
  description: string;
}

export interface AttemptSession {
  attemptId: string;
  formId: string;
  formTitle: string;
  tier: FormTier;
  mode: ExamMode;
  startedAt: string;
  deadline: string; // ISO server deadline
  questions: QuestionSnapshot[];
  responses: Record<string, string>; // questionId -> selected optionId
  flaggedQuestionIds: string[];
}

export interface QuestionReviewDetail {
  questionId: string;
  sequenceNumber: number;
  part: ExamPart;
  prompt: string;
  options: OptionSnapshot[];
  stimulusText?: string;
  selectedOptionId?: string;
  correctOptionId: string;
  isCorrect: boolean;
  explanation: string;
  evidenceQuote?: string;
  knowledgeTag: string;
}

export interface ExamResult {
  attemptId: string;
  formTitle: string;
  tier: FormTier;
  mode: ExamMode;
  rawScore: number;
  maxScore: number;
  totalQuestions: number;
  answeredCount: number;
  timeSpentSeconds: number;
  partBreakdown: Record<string, { correct: number; total: number }>;
  tagBreakdown: Record<string, { correct: number; total: number }>;
  questions: QuestionReviewDetail[];
}
