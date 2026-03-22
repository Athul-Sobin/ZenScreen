import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { AppUsageData, FocusSession, SleepRecord, UserSettings, PuzzleExtension, BlockRule } from './types';
import * as Storage from './storage';
import { requireNativeModule } from "expo-modules-core";

const UsageModule = requireNativeModule("UsageModule");

interface WellbeingContextValue {
  settings: UserSettings;
  apps: AppUsageData[];
  focusSessions: FocusSession[];
  sleepRecords: SleepRecord[];
  puzzleExtensions: PuzzleExtension[];
  dailyBonusMinutes: number;
  blockRules: BlockRule[];
  blueLightEnabled: boolean;
  blueLightIntensity: number;
  blueLightAutoSchedule: boolean;
  activeFocusSession: FocusSession | null;
  isLoading: boolean;
  totalScreenTime: number;
  totalOpens: number;
  totalNotifications: number;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  updateApp: (appId: string, updates: Partial<AppUsageData>) => Promise<void>;
  saveFocusSession: (session: FocusSession) => Promise<void>;
  updatePuzzleExtensions: (extensions: PuzzleExtension[]) => Promise<void>;
  updateDailyBonus: (minutes: number) => Promise<void>;
  updateBlockRules: (rules: BlockRule[]) => Promise<void>;
  updateBlueLightSettings: (enabled: boolean, intensity: number, autoSchedule: boolean) => Promise<void>;
  setActiveFocusSession: (session: FocusSession | null) => Promise<void>;
  saveSleepRecord: (record: SleepRecord) => Promise<void>;
  refreshData: () => Promise<void>;
}

const WellbeingContext = createContext<WellbeingContextValue | null>(null);

export function WellbeingProvider({ children }: { children: ReactNode }) {
const [settings, setSettings] = useState<UserSettings>({
  onboardingComplete: false,
  warningMessage: '',
  dailyGoalMinutes: 120,
  focusReminderEnabled: true,
  sleepTrackingEnabled: true,
  bedtimeReminder: '22:00',
  wakeTimeReminder: '07:00',

  // 🔥 Newly required fields
  sleepBedtime: '22:00',
  sleepWakeTime: '07:00',
  bedtimeReminderEnabled: true,
  autoSleepDetectionEnabled: false,
  blueLightEnabled: false,
  blueLightIntensity: 50,
  blueLightAutoSchedule: false,
});
  const [apps, setApps] = useState<AppUsageData[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [puzzleExtensions, setPuzzleExtensions] = useState<PuzzleExtension[]>([]);
  const [dailyBonusMinutes, setDailyBonusMinutes] = useState(0);
  const [blockRules, setBlockRules] = useState<BlockRule[]>([]);
  const [blueLightEnabled, setBlueLightEnabled] = useState(false);
  const [blueLightIntensity, setBlueLightIntensity] = useState(50);
  const [blueLightAutoSchedule, setBlueLightAutoSchedule] = useState(false);
  const [activeFocusSession, setActiveFocusSessionState] = useState<FocusSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
  setIsLoading(true);
  try {
    const hasPermission = await UsageModule.hasUsagePermission();
    if (!hasPermission) {
      setApps([]);
      return;
    }

    const appsData = await UsageModule.getTodayAppUsage();

const formattedApps = appsData.map((app: any) => ({
  id: app.packageName,
  name: app.appName || app.packageName,
  icon: 'apps',                     // default icon
  iconFamily: 'Ionicons',
  color: '#55e68a',                 // default color
  category: 'App',
  usageMinutes: Math.floor(app.time / (1000 * 60)),
  dailyLimit: 0,
  opens: 0,
  notifications: 0,                 // use correct field name
  isBlocked: false,
  isShortForm: false,
}));

    setApps(formattedApps);
  } catch (err) {
    console.log("Real usage error:", err);
  } finally {
    setIsLoading(false);
  }
}, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await Storage.saveSettings(updates);
  }, [settings]);

  const updateApp = useCallback(async (appId: string, updates: Partial<AppUsageData>) => {
    setApps(prev => prev.map(a => a.id === appId ? { ...a, ...updates } : a));
    await Storage.updateApp(appId, updates);
  }, []);

  const saveFocusSessionCb = useCallback(async (session: FocusSession) => {
    setFocusSessions(prev => {
      const idx = prev.findIndex(s => s.id === session.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = session;
        return copy;
      }
      return [...prev, session];
    });
    await Storage.saveFocusSession(session);
  }, []);

  const updatePuzzleExtensions = useCallback(async (extensions: PuzzleExtension[]) => {
    setPuzzleExtensions(extensions);
    await Storage.savePuzzleExtensions(extensions);
  }, []);

  const updateDailyBonus = useCallback(async (minutes: number) => {
    setDailyBonusMinutes(minutes);
    await Storage.saveDailyBonusMinutes(minutes);
  }, []);

  const updateBlockRules = useCallback(async (rules: BlockRule[]) => {
    setBlockRules(rules);
    await Storage.saveBlockRules(rules);
  }, []);

  const updateBlueLightSettings = useCallback(async (enabled: boolean, intensity: number, autoSchedule: boolean) => {
    setBlueLightEnabled(enabled);
    setBlueLightIntensity(intensity);
    setBlueLightAutoSchedule(autoSchedule);
    await updateSettings({
      blueLightEnabled: enabled,
      blueLightIntensity: intensity,
      blueLightAutoSchedule: autoSchedule,
    });
  }, [updateSettings]);

  const setActiveFocusSessionCb = useCallback(async (session: FocusSession | null) => {
    setActiveFocusSessionState(session);
    if (session) {
      await Storage.saveActiveFocusSession(session);
    } else {
      await Storage.clearActiveFocusSession();
    }
  }, []);

  const saveSleepRecordCb = useCallback(async (record: SleepRecord) => {
    setSleepRecords(prev => [...prev, record]);
    await Storage.saveSleepRecord(record);
  }, []);

  const totalScreenTime = useMemo(() => apps.reduce((sum, a) => sum + a.usageMinutes, 0), [apps]);
  const totalOpens = useMemo(() => apps.reduce((sum, a) => sum + a.opens, 0), [apps]);
  const totalNotifications = useMemo(() => apps.reduce((sum, a) => sum + a.notifications, 0), [apps]);

  const value = useMemo(() => ({
    settings,
    apps,
    focusSessions,
    sleepRecords,
    puzzleExtensions,
    dailyBonusMinutes,
    blockRules,
    blueLightEnabled,
    blueLightIntensity,
    blueLightAutoSchedule,
    activeFocusSession,
    isLoading,
    totalScreenTime,
    totalOpens,
    totalNotifications,
    updateSettings,
    updateApp,
    saveFocusSession: saveFocusSessionCb,
    updatePuzzleExtensions,
    updateDailyBonus,
    updateBlockRules,
    updateBlueLightSettings,
    setActiveFocusSession: setActiveFocusSessionCb,
    saveSleepRecord: saveSleepRecordCb,
    refreshData: loadData,
  }), [settings, apps, focusSessions, sleepRecords, puzzleExtensions, dailyBonusMinutes, blockRules, blueLightEnabled, blueLightIntensity, blueLightAutoSchedule, activeFocusSession, isLoading, totalScreenTime, totalOpens, totalNotifications, updateSettings, updateApp, saveFocusSessionCb, updatePuzzleExtensions, updateDailyBonus, updateBlockRules, updateBlueLightSettings, setActiveFocusSessionCb, saveSleepRecordCb, loadData]);

  return (
    <WellbeingContext.Provider value={value}>
      {children}
    </WellbeingContext.Provider>
  );
}

export function useWellbeing() {
  const ctx = useContext(WellbeingContext);
  if (!ctx) throw new Error('useWellbeing must be used within WellbeingProvider');
  return ctx;
}
