export interface AppUsageData {
  id: string;
  name: string;
  icon: string;
  iconFamily: 'Ionicons' | 'MaterialIcons' | 'Feather' | 'MaterialCommunityIcons' | 'FontAwesome';
  color: string;
  category: string;
  usageMinutes: number;
  dailyLimit: number;
  opens: number;
  notifications: number;
  isBlocked: boolean;
  isShortForm: boolean;
}

export interface FocusSession {
  id: string;
  startTime: number;
  endTime: number | null;
  duration: number;
  blockedApps: string[];
  grayscaleEnabled: boolean;
  completed: boolean;
}

export interface SleepRecord {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  durationHours: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface PuzzleData {
  id: string;
  type: 'knowledge' | 'logic' | 'word';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface PuzzleExtension {
  tier: 1 | 2 | 3;
  puzzlesRequired: number;
  minutesEarned: number;
  completed: boolean;
  puzzlesSolved: number;
}

export interface UserSettings {
  onboardingComplete: boolean;
  warningMessage: string;
  dailyGoalMinutes: number;
  focusReminderEnabled: boolean;
  sleepTrackingEnabled: boolean;
  bedtimeReminder: string;
  wakeTimeReminder: string;
}

export interface DailyStats {
  date: string;
  totalScreenTime: number;
  totalOpens: number;
  totalNotifications: number;
  focusMinutes: number;
  bonusMinutesEarned: number;
}
