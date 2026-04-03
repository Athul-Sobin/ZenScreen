// @ts-ignore
import * as TaskManager from 'expo-task-manager';
// @ts-ignore
import * as BackgroundFetch from 'expo-background-fetch';
import { AppState } from 'react-native';
import { desc } from 'drizzle-orm'; // Fixed: Import desc helper
import { db } from './db';
import { sleepLogs } from '../shared/schema';

const BACKGROUND_SLEEP_DETECTION_TASK = 'BACKGROUND_SLEEP_DETECTION';

// Background task for sleep detection
TaskManager.defineTask(BACKGROUND_SLEEP_DETECTION_TASK, async () => {
  try {
    console.log('[Background] Sleep detection task started');

    // Check current app state
    const currentState = AppState.currentState;
    console.log('[Background] Current app state:', currentState);

    if (currentState === 'background') {
      // Get the last sleep record to determine when background started
      const lastSleepRecords = await db
        .select()
        .from(sleepLogs)
        .orderBy(desc(sleepLogs.endTime)) // Fixed: Use desc() function instead of 'desc' string
        .limit(1);

      const now = Date.now();
      let backgroundStartTime = now - (15 * 60 * 1000); // Default to 15 minutes ago

      if (lastSleepRecords.length > 0) {
        const lastRecord = lastSleepRecords[0];
        if (lastRecord.endTime) {
          const lastEndTime = new Date(lastRecord.endTime).getTime();
          // If last sleep ended recently, use that as potential background start
          if (now - lastEndTime < 2 * 60 * 60 * 1000) { // Within 2 hours
            backgroundStartTime = lastEndTime;
          }
        }
      }

      const backgroundDuration = now - backgroundStartTime;
      const backgroundDurationHours = backgroundDuration / (1000 * 60 * 60);

      console.log(`[Background] Background duration: ${backgroundDurationHours.toFixed(2)} hours`);

      // If backgrounded for more than 2 hours, create sleep record
      if (backgroundDuration >= 2 * 60 * 60 * 1000) { // 2 hours in milliseconds
        const sleepRecord = {
          id: `sleep_${now}`,
          startTime: new Date(backgroundStartTime),
          endTime: new Date(now),
          durationMinutes: Math.floor(backgroundDuration / (1000 * 60)),
          isAutoDetected: true,
          qualityRating: null, 
        };

        await db.insert(sleepLogs).values(sleepRecord);

        console.log('[Background] Sleep record created');
        return BackgroundFetch.BackgroundFetchResult.NewData;
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[Background] Sleep detection task failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register the background task
export async function registerBackgroundSleepDetection() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SLEEP_DETECTION_TASK);

    if (!isRegistered) {
      console.log('[Background] Registering sleep detection task');

      // Register for background fetch (runs every 15 mins when backgrounded)
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SLEEP_DETECTION_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false, 
        startOnBoot: true, 
      });

      console.log('[Background] Sleep detection task registered successfully');
    } else {
      console.log('[Background] Sleep detection task already registered');
    }
  } catch (error) {
    console.error('[Background] Failed to register sleep detection task:', error);
  }
}

// Unregister the background task
export async function unregisterBackgroundSleepDetection() {
  try {
    console.log('[Background] Unregistering sleep detection task');
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SLEEP_DETECTION_TASK);
    console.log('[Background] Sleep detection task unregistered');
  } catch (error) {
    console.error('[Background] Failed to unregister sleep detection task:', error);
  }
}

// Get background task status
export async function getBackgroundTaskStatus() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SLEEP_DETECTION_TASK);
    const status = await BackgroundFetch.getStatusAsync();

    return {
      isRegistered,
      status,
      isAvailable: status === BackgroundFetch.BackgroundFetchStatus.Available,
    };
  } catch (error) {
    console.error('[Background] Failed to get task status:', error);
    return {
      isRegistered: false,
      status: BackgroundFetch.BackgroundFetchStatus.Denied,
      isAvailable: false,
    };
  }
}