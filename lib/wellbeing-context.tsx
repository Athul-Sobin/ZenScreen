import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppUsageData, FocusSession, SleepRecord, UserSettings, PuzzleExtension, BlockRule } from './types';
import * as Storage from './storage';
import { db } from './db';
import { sleepLogs } from '../shared/schema';
import { isAppBlocked, getRemainingTimeForApp, getBlockedReason } from './blocking-service';

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
  grayscaleEnabled: boolean;
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
  toggleGrayscale: () => Promise<void>;
  setActiveFocusSession: (session: FocusSession | null) => Promise<void>;
  saveSleepRecord: (record: SleepRecord) => Promise<void>;
  refreshData: () => Promise<void>;
  checkBlockingEnforcement: (appId: string) => { isBlocked: boolean; reason: string; remainingTime: number };
}

const WellbeingContext = createContext<WellbeingContextValue | null>(null);

export function WellbeingProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<UserSettings>({
    onboardingComplete: false,
    warningMessage: '',
    dailyGoalMinutes: 120,
    focusReminderEnabled: true,
    sleepTrackingEnabled: true,
    bedtimeReminder: '22:00',
    wakeTimeReminder: '07:00',
    sleepBedtime: '22:00',
    sleepWakeTime: '07:00',
    bedtimeReminderEnabled: true,
    autoSleepDetectionEnabled: true,
    blueLightEnabled: false,
    blueLightIntensity: 50,
    blueLightAutoSchedule: false,
    grayscaleEnabled: false,
  });
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [puzzleExtensions, setPuzzleExtensions] = useState<PuzzleExtension[]>([]);
  const [dailyBonusMinutes, setDailyBonusMinutes] = useState(0);
  const [blockRules, setBlockRules] = useState<BlockRule[]>([]);
  const [blueLightEnabled, setBlueLightEnabled] = useState(false);
  const [blueLightIntensity, setBlueLightIntensity] = useState(50);
  const [blueLightAutoSchedule, setBlueLightAutoSchedule] = useState(false);
  const [grayscaleEnabled, setGrayscaleEnabled] = useState(false);
  const [activeFocusSession, setActiveFocusSessionState] = useState<FocusSession | null>(null);

  // Use useQuery for apps and sleepRecords
  const { data: apps = [], isLoading: appsLoading } = useQuery({
    queryKey: ['apps'],
    queryFn: Storage.getApps,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: sleepRecords = [], isLoading: sleepRecordsLoading } = useQuery({
    queryKey: ['sleepRecords'],
    queryFn: async () => {
      try {
        const records = await db.select().from(sleepLogs);
        return records.map(record => ({
          id: record.id,
          startTime: record.startTime.getTime(),
          endTime: record.endTime.getTime(),
          durationMinutes: record.durationMinutes,
          isAutoDetected: record.isAutoDetected,
          qualityRating: record.qualityRating || undefined,
        })) as SleepRecord[];
      } catch (error) {
        console.error('Failed to fetch sleep records from DB:', error);
        // Fallback to storage if DB fails
        return Storage.getSleepRecords();
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Compute isLoading based on all query states
  const isLoading = appsLoading || sleepRecordsLoading;

  const loadData = useCallback(async () => {
    try {
      const [s, f, pe, dbm, br, afs] = await Promise.all([
        Storage.getSettings(),
        Storage.getFocusSessions(),
        Storage.getPuzzleExtensions(),
        Storage.getDailyBonusMinutes(),
        Storage.getBlockRules(),
        Storage.getActiveFocusSession(),
      ]);
      setSettings(s);
      setFocusSessions(f);
      setPuzzleExtensions(pe);
      setDailyBonusMinutes(dbm);
      setBlockRules(br);
      setActiveFocusSessionState(afs);
      // Load blue light settings from UserSettings
      setBlueLightEnabled(s.blueLightEnabled || false);
      setBlueLightIntensity(s.blueLightIntensity || 50);
      setBlueLightAutoSchedule(s.blueLightAutoSchedule || false);
      setGrayscaleEnabled(s.grayscaleEnabled || false);
    } catch (e) {
      console.error('Failed to load data', e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Automation: Monitor time and auto-enable filters during bedtime
  useEffect(() => {
    if (!settings.blueLightAutoSchedule) return;

    const checkBedtimeWindow = () => {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const [bedHour, bedMin] = settings.sleepBedtime.split(':').map(Number);
      const [wakeHour, wakeMin] = settings.sleepWakeTime.split(':').map(Number);
      
      const bedTime = bedHour * 60 + bedMin;
      const wakeTime = wakeHour * 60 + wakeMin;

      let isInBedtimeWindow = false;
      if (bedTime > wakeTime) {
        isInBedtimeWindow = currentTime >= bedTime || currentTime <= wakeTime;
      } else {
        isInBedtimeWindow = currentTime >= bedTime && currentTime <= wakeTime;
      }

      if (isInBedtimeWindow) {
        setBlueLightEnabled(true);
        setGrayscaleEnabled(true);
      }
    };

    // Check immediately
    checkBedtimeWindow();

    // Check every minute
    const interval = setInterval(checkBedtimeWindow, 60 * 1000);

    return () => clearInterval(interval);
  }, [settings.blueLightAutoSchedule, settings.sleepBedtime, settings.sleepWakeTime]);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await Storage.saveSettings(updates);
  }, [settings]);

  const updateApp = useCallback(async (appId: string, updates: Partial<AppUsageData>) => {
    // Update query data without modifying useState (since apps comes from useQuery)
    queryClient.setQueryData(['apps'], (prev: AppUsageData[] | undefined) => {
      if (!prev) return prev;
      return prev.map((a: AppUsageData) => a.id === appId ? { ...a, ...updates } : a);
    });
    await Storage.updateApp(appId, updates);
  }, [queryClient]);

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

  const toggleGrayscale = useCallback(async () => {
    const newValue = !grayscaleEnabled;
    setGrayscaleEnabled(newValue);
    await updateSettings({ grayscaleEnabled: newValue });
  }, [grayscaleEnabled, updateSettings]);

  const setActiveFocusSessionCb = useCallback(async (session: FocusSession | null) => {
    setActiveFocusSessionState(session);
    if (session) {
      await Storage.saveActiveFocusSession(session);
    } else {
      await Storage.clearActiveFocusSession();
    }
  }, []);

  const checkBlockingEnforcement = useCallback((appId: string) => {
    // Retrieve current app usage for blocking check
    const currentUsage = apps.reduce((sum, a) => sum + a.usageMinutes, 0);
    const appUsageToday = apps.reduce((acc, a) => {
      acc[a.id] = a.usageMinutes;
      return acc;
    }, {} as Record<string, number>);

    const blockingContext = {
      rules: blockRules,
      focusSession: activeFocusSession || undefined,
      appUsageToday,
    };

    const isBlocked = isAppBlocked(appId, blockingContext);
    const remainingTime = getRemainingTimeForApp(appId, blockingContext);
    const reason = getBlockedReason(appId, blockingContext);

    return {
      isBlocked,
      reason,
      remainingTime,
    };
  }, [apps, blockRules, activeFocusSession]);

  const saveSleepRecordCb = useCallback(async (record: SleepRecord) => {
    try {
      // Insert into database
      await db.insert(sleepLogs).values({
        id: record.id,
        startTime: new Date(record.startTime),
        endTime: new Date(record.endTime),
        durationMinutes: record.durationMinutes,
        isAutoDetected: record.isAutoDetected,
        qualityRating: record.qualityRating,
      });
      // Invalidate and refetch sleep records
      queryClient.invalidateQueries({ queryKey: ['sleepRecords'] });
    } catch (error) {
      console.error('Failed to save sleep record to DB:', error);
      // Fallback to storage
      await Storage.saveSleepRecord(record);
    }
  }, [queryClient]);

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
    grayscaleEnabled,
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
    toggleGrayscale,
    setActiveFocusSession: setActiveFocusSessionCb,
    saveSleepRecord: saveSleepRecordCb,
    refreshData: loadData,
    checkBlockingEnforcement,
  }), [settings, apps, focusSessions, sleepRecords, puzzleExtensions, dailyBonusMinutes, blockRules, blueLightEnabled, blueLightIntensity, blueLightAutoSchedule, grayscaleEnabled, activeFocusSession, isLoading, appsLoading, sleepRecordsLoading, totalScreenTime, totalOpens, totalNotifications, updateSettings, updateApp, saveFocusSessionCb, updatePuzzleExtensions, updateDailyBonus, updateBlockRules, updateBlueLightSettings, toggleGrayscale, setActiveFocusSessionCb, saveSleepRecordCb, loadData, checkBlockingEnforcement]);

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
