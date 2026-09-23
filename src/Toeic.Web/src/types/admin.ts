export interface CandidateQualityReview {
  candidateId: string;
  part: string;
  sourceText?: string;
  prompt: string;
  options: { label: string; text: string; isCorrect: boolean }[];
  explanation: string;
  structuralValidation: {
    passed: boolean;
    details: string;
  };
  blindSolvers: {
    solverA: { selectedAnswer: string; passed: boolean };
    solverB: { selectedAnswer: string; passed: boolean };
    consensus: boolean;
  };
  criticReview: {
    severity: 'None' | 'Warning' | 'Blocking';
    findings: string[];
  };
  quarantineStatus: 'None' | 'Quarantined' | 'Degraded';
  quarantineReason?: string;
}

export interface GenerationJobSummary {
  jobId: string;
  blueprintVersion: string;
  part: string;
  quotaRequested: number;
  candidatesGenerated: number;
  acceptedCount: number;
  rejectedCount: number;
  status: 'Running' | 'Completed' | 'Failed';
  startedAt: string;
}
