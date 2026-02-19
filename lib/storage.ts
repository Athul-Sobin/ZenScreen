import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppUsageData, FocusSession, SleepRecord, UserSettings, PuzzleExtension, BlockRule } from './types';
import { MOCK_APPS, generateWeeklySleepData } from './data';

const KEYS = {
  SETTINGS: '@zenscreen_settings',
  APPS: '@zenscreen_apps',
  FOCUS_SESSIONS: '@zenscreen_focus_sessions',
  SLEEP_RECORDS: '@zenscreen_sleep_records',
  PUZZLE_EXTENSIONS: '@zenscreen_puzzle_extensions',
  DAILY_BONUS: '@zenscreen_daily_bonus',
  USED_PUZZLE_IDS: '@zenscreen_used_puzzles',
  BLOCK_RULES: '@zenscreen_block_rules',
  ACTIVE_FOCUS_SESSION: '@zenscreen_active_focus_session',
  LAST_RESET_DATE: '@zenscreen_last_reset_date',
  APP_USAGE_TODAY: '@zenscreen_app_usage_today',
};

const DEFAULT_SETTINGS: UserSettings = {
  onboardingComplete: false,
  warningMessage: 'You have reached your daily limit for this app. Take a break and breathe.',
  dailyGoalMinutes: 120,
  focusReminderEnabled: true,
  sleepTrackingEnabled: true,
  bedtimeReminder: '22:00',
  wakeTimeReminder: '07:00',
  sleepBedtime: '22:00',
  sleepWakeTime: '06:30',
  bedtimeReminderEnabled: false,
  autoSleepDetectionEnabled: false,
  blueLightEnabled: false,
  blueLightIntensity: 0,
  blueLightAutoSchedule: false,
};

export async function getSettings(): Promise<UserSettings> {
  try {
    const data = await AsyncStorage.getItem(KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<UserSettings>): Promise<void> {
  const current = await getSettings();
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...current, ...settings }));
}

export async function getApps(): Promise<AppUsageData[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.APPS);
    return data ? JSON.parse(data) : MOCK_APPS;
  } catch {
    return MOCK_APPS;
  }
}

export async function saveApps(apps: AppUsageData[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.APPS, JSON.stringify(apps));
}

export async function updateApp(appId: string, updates: Partial<AppUsageData>): Promise<void> {
  const apps = await getApps();
  const idx = apps.findIndex(a => a.id === appId);
  if (idx >= 0) {
    apps[idx] = { ...apps[idx], ...updates };
    await saveApps(apps);
  }
}

export async function getFocusSessions(): Promise<FocusSession[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.FOCUS_SESSIONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveFocusSession(session: FocusSession): Promise<void> {
  const sessions = await getFocusSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.push(session);
  }
  await AsyncStorage.setItem(KEYS.FOCUS_SESSIONS, JSON.stringify(sessions));
}

export async function getSleepRecords(): Promise<SleepRecord[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.SLEEP_RECORDS);
    if (data) return JSON.parse(data);
    const generated = generateWeeklySleepData();
    await AsyncStorage.setItem(KEYS.SLEEP_RECORDS, JSON.stringify(generated));
    return generated;
  } catch {
    return generateWeeklySleepData();
  }
}

export async function getPuzzleExtensions(): Promise<PuzzleExtension[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.PUZZLE_EXTENSIONS);
    if (data) {
      const parsed = JSON.parse(data);
      const today = new Date().toDateString();
      if (parsed.date === today) return parsed.extensions;
    }
    // If different day or no data, return fresh defaults with today's date
    const defaults: PuzzleExtension[] = [
      { tier: 1, puzzlesRequired: 1, minutesEarned: 5, completed: false, puzzlesSolved: 0 },
      { tier: 2, puzzlesRequired: 2, minutesEarned: 5, completed: false, puzzlesSolved: 0 },
      { tier: 3, puzzlesRequired: 3, minutesEarned: 5, completed: false, puzzlesSolved: 0 },
    ];
    await AsyncStorage.setItem(KEYS.PUZZLE_EXTENSIONS, JSON.stringify({ date: new Date().toDateString(), extensions: defaults }));
    return defaults;
  } catch {
    return [];
  }
}

export async function savePuzzleExtensions(extensions: PuzzleExtension[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.PUZZLE_EXTENSIONS, JSON.stringify({ date: new Date().toDateString(), extensions }));
}

export async function getDailyBonusMinutes(): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(KEYS.DAILY_BONUS);
    if (data) {
      const parsed = JSON.parse(data);
      const today = new Date().toDateString();
      if (parsed.date === today) return parsed.minutes;
    }
    return 0;
  } catch {
    return 0;
  }
}

export async function saveDailyBonusMinutes(minutes: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.DAILY_BONUS, JSON.stringify({ date: new Date().toDateString(), minutes }));
}

export async function getUsedPuzzleIds(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.USED_PUZZLE_IDS);
    if (data) {
      const parsed = JSON.parse(data);
      const today = new Date().toDateString();
      if (parsed.date === today) return parsed.ids;
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveUsedPuzzleIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.USED_PUZZLE_IDS, JSON.stringify({ date: new Date().toDateString(), ids }));
}

export async function resetDailyData(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.PUZZLE_EXTENSIONS, KEYS.DAILY_BONUS, KEYS.USED_PUZZLE_IDS, KEYS.APP_USAGE_TODAY]);
}

// Block Rules (App Blocker Feature #5)
export async function getBlockRules(): Promise<BlockRule[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.BLOCK_RULES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveBlockRules(rules: BlockRule[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.BLOCK_RULES, JSON.stringify(rules));
}

// Focus Session (Feature #2 - Focus Mode)
export async function getActiveFocusSession(): Promise<FocusSession | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.ACTIVE_FOCUS_SESSION);
    if (data) {
      const session = JSON.parse(data);
      // Check if session hasn't expired
      if (session.endTime && new Date().getTime() < session.endTime) {
        return session;
      }
      // Session expired, clear it
      await AsyncStorage.removeItem(KEYS.ACTIVE_FOCUS_SESSION);
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveActiveFocusSession(session: FocusSession): Promise<void> {
  await AsyncStorage.setItem(KEYS.ACTIVE_FOCUS_SESSION, JSON.stringify(session));
}

export async function clearActiveFocusSession(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.ACTIVE_FOCUS_SESSION);
}

// Sleep Records (Feature #3 - Sleep Detection)
export async function getSleepRecords(): Promise<SleepRecord[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.SLEEP_RECORDS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveSleepRecord(record: SleepRecord): Promise<void> {
  try {
    const existing = await getSleepRecords();
    // Append new record (auto-detected or manual)
    const updated = [...existing, record];
    await AsyncStorage.setItem(KEYS.SLEEP_RECORDS, JSON.stringify(updated));
  } catch {
    // Fallback: save just this record
    await AsyncStorage.setItem(KEYS.SLEEP_RECORDS, JSON.stringify([record]));
  }
}

// App Usage Tracking (Feature #5 - App Blocker)
export async function getAppUsageToday(): Promise<Record<string, number>> {
  try {
    const data = await AsyncStorage.getItem(KEYS.APP_USAGE_TODAY);
    if (data) {
      const parsed = JSON.parse(data);
      const today = new Date().toDateString();
      if (parsed.date === today) return parsed.usage;
    }
    return {};
  } catch {
    return {};
  }
}

export async function updateAppUsageToday(appId: string, additionalMinutes: number): Promise<void> {
  try {
    const usage = await getAppUsageToday();
    usage[appId] = (usage[appId] || 0) + additionalMinutes;
    await AsyncStorage.setItem(KEYS.APP_USAGE_TODAY, JSON.stringify({ date: new Date().toDateString(), usage }));
  } catch {
    // Ignore errors
  }
}

// Daily Reset Tracking
export async function getLastResetDate(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS.LAST_RESET_DATE);
  } catch {
    return null;
  }
}

export async function saveLastResetDate(date: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.LAST_RESET_DATE, date);
  } catch {
    // Ignore errors
  }
}
