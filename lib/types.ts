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
  appId?: string; // For focus app identification
  appName?: string; // Display name for focus session
  startTime: number;
  endTime: number;
  durationMinutes?: number; // Duration in minutes for display
  duration: number; // Duration in seconds
  blockedApps: string[];
  grayscaleEnabled: boolean;
  completed: boolean;
}

export interface SleepRecord {
  id: string;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  isAutoDetected: boolean;
  qualityRating?: number;
}

export interface SleepSchedule {
  bedtime: string;
  wakeTime: string;
  bedtimeReminderEnabled: boolean;
  autoDetectionEnabled: boolean;
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
  sleepBedtime: string;
  sleepWakeTime: string;
  bedtimeReminderEnabled: boolean;
  autoSleepDetectionEnabled: boolean;
  blueLightEnabled: boolean;
  blueLightIntensity: number;
  blueLightAutoSchedule: boolean;
}

export interface DailyStats {
  date: string;
  totalScreenTime: number;
  totalOpens: number;
  totalNotifications: number;
  focusMinutes: number;
  bonusMinutesEarned: number;
}

export interface BlockRule {
  appId: string;
  appName: string;
  mode: 'full_block' | 'time_limit' | 'unrestricted';
  dailyLimitMinutes?: number;
}

export interface AppBlockingSession {
  appId: string;
  startTime: number;
  endTime?: number;
}

export interface BlockingState {
  rules: BlockRule[];
  activeFocusSession: boolean;
  focusBlockedApps: string[];
}

export interface SleepDetectionRecord {
  screenOffTime: number;
  screenOnTime?: number;
}

