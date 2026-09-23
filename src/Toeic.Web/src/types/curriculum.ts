export type CurriculumLevelCode = 'A' | 'B' | 'C' | 'D';

export interface CurriculumLevel {
  id: string;
  code: CurriculumLevelCode;
  title: string;
  sequence: number;
  recommendedWeeks: number;
  entryGuidance: string;
  outcomeGuidance: string;
  checkpointQuestionCount: number;
  checkpointPassRate: number;
}

export interface KnowledgeTopic {
  id: string;
  levelCode: CurriculumLevelCode;
  code: string; // e.g. 'A1', 'B4', 'C6', 'D2'
  titleVi: string;
  titleEn: string;
  category: 'Grammar' | 'Vocabulary' | 'ReadingStrategy' | 'ExamStrategy';
  primaryTag: string;
  summary: string;
  learningObjectives: string[];
  coreKnowledge: string[];
  commonTraps: string[];
  workedExamples: { sentence: string; focus: string }[];
  vocabularyTheme: string;
  estimatedMinutes: number;
  sequence: number;
  guide?: {
    formulaPatterns: string[];
    applicationSteps: string[];
    extensions: string[];
    selfCheckPrompts: string[];
  };
}

export interface RoadmapWeek {
  weekNumber: number;
  levelCode: CurriculumLevelCode;
  title: string;
  goal: string;
  vocabularyTheme: string;
  checkpointKind: 'LessonQuiz' | 'MixedReview' | 'LevelCheckpoint' | 'Remediation';
  passRate: number;
  activities: {
    id: string;
    type: 'Lesson' | 'Quiz' | 'Flashcard' | 'MixedReview' | 'Checkpoint' | 'Remediation';
    title: string;
    estimatedMinutes: number;
    required: boolean;
    lessonCode?: string;
    topicCode?: string;
  }[];
}

export interface CourseCurriculum {
  id: string;
  slug: string;
  title: string;
  summary: string;
  levelLabel: string;
  estimatedMinutes: number;
  levels: CurriculumLevel[];
  modules: {
    id: string;
    levelCode: CurriculumLevelCode;
    code: string;
    title: string;
    summary: string;
  }[];
  topics: Record<string, KnowledgeTopic>;
  weeks: RoadmapWeek[];
}
