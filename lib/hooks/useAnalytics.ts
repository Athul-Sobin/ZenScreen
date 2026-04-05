import { useQuery } from '@tanstack/react-query';
import { getDb } from '../db';
// REMOVED: const db = getDb(); - This was causing import-time database initialization
import { sleepLogs, appUsageLogs } from '../../shared/schema';
import { sql } from 'drizzle-orm';
import { getDayName } from '../utils/date-utils';

export interface AnalyticsDataPoint {
  day: string;
  value: number;
}

export interface WeeklyAverages {
  sleep: AnalyticsDataPoint[];
  screenTime: AnalyticsDataPoint[];
}

/**
 * Fetches aggregated analytics data for 7-day period using efficient SQL queries.
 * All aggregation happens in the database, not in JavaScript.
 */
export async function getWeeklyAverage(): Promise<WeeklyAverages> {
  try {
    // LAZY DATABASE INITIALIZATION - Only initialize when actually called
    const db = getDb();
    // === SLEEP LOGS: 7-day average duration ===
    // Query: SELECT AVG(duration_minutes) grouped by date
    const sleepData = await db
      .select({
        date: sql<string>`DATE(${sleepLogs.startTime})`,
        avgDuration: sql<number>`CAST(AVG(${sleepLogs.durationMinutes}) AS INTEGER)`,
      })
      .from(sleepLogs)
      .where(
        sql`${sleepLogs.startTime} >= NOW() - INTERVAL '7 days'`
      )
      .groupBy(sql`DATE(${sleepLogs.startTime})`)
      .orderBy(sql`DATE(${sleepLogs.startTime})`);

    // === APP USAGE LOGS: 7-day total screen time ===
    // Query: SELECT SUM(minutes) grouped by date
    const screenTimeData = await db
      .select({
        date: sql<string>`DATE(${appUsageLogs.timestamp})`,
        totalMinutes: sql<number>`CAST(SUM(${appUsageLogs.minutes}) AS INTEGER)`,
      })
      .from(appUsageLogs)
      .where(
        sql`${appUsageLogs.timestamp} >= NOW() - INTERVAL '7 days'`
      )
      .groupBy(sql`DATE(${appUsageLogs.timestamp})`)
      .orderBy(sql`DATE(${appUsageLogs.timestamp})`);

    // === FORMAT FOR BAR CHART ===
    // Get date range (last 7 days)
    const today = new Date();
    const dateRange = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return {
        date: d.toISOString().split('T')[0],
        dayName: getDayName(d.getDay()),
      };
    });

    // Map sleep data
    const sleepChart = dateRange.map(entry => {
      const match = sleepData.find((s: { date: string; avgDuration: number }) => s.date === entry.date);
      return {
        day: entry.dayName,
        value: match?.avgDuration ?? 0,
      };
    });

    // Map screen time data
    const screenChart = dateRange.map(entry => {
      const match = screenTimeData.find((st: { date: string; totalMinutes: number }) => st.date === entry.date);
      return {
        day: entry.dayName,
        value: match?.totalMinutes ?? 0,
      };
    });

    return {
      sleep: sleepChart,
      screenTime: screenChart,
    };
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    // Return empty data structure on error
    return {
      sleep: Array(7).fill(0).map((_, i) => ({ day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i], value: 0 })),
      screenTime: Array(7).fill(0).map((_, i) => ({ day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i], value: 0 })),
    };
  }
}

/**
 * Custom hook for fetching weekly analytics with TanStack Query caching.
 * Automatically refetches when staleTime expires (15 minutes).
 */
export function useWeeklyAnalytics() {
  return useQuery({
    queryKey: ['weeklyAnalytics'],
    queryFn: getWeeklyAverage,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
