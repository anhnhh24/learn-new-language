export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'Learner' | 'Admin' | 'Staff';
  isEmailVerified: boolean;
  targetScore?: number;
  dailyMinutesBudget: number;
  studyDaysPerWeek: number[];
  assessmentStatus: 'Unknown' | 'Placed' | 'Skipped';
  timezone: string;
  quietHoursStart: string; // '21:00'
  quietHoursEnd: string; // '08:00'
}

export interface OnboardingData {
  targetScore?: number;
  dailyMinutesBudget: number;
  studyDaysPerWeek: number[];
  skippedPlacement: boolean;
}
