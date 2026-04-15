export interface StepRow {
  rowIndex: number; // 1-based sheet row number
  date: string;     // dd/mm/yyyy
  time: string;     // HH:MM
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  step: string;
  results: string;
}

export interface MemberStats {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  steps: StepRow[];
  stepCount: number;
  streak: number;
  score: number;
  lastActive: string; // dd/mm/yyyy
}
