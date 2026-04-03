import { AppState, AppStateStatus } from 'react-native';
import { SleepRecord } from './types';
import { UserSettings } from './types';

const SLEEP_DETECTION_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours minimum for valid sleep session

interface SleepDetectionState {
  appWentBackgroundAt?: number;
  appReturnedAt?: number;
}

/**
 * Sleep detection service - monitors app foreground/background transitions
 * to automatically detect sleep sessions.
 * 
 * Logic:
 * 1. When app goes to background, record timestamp
 * 2. When app returns to foreground, calculate session duration
 * 3. If duration >= 2 hours AND overlaps with bedtime window, likely sleep session - record it
 * 4. Prompt user to confirm and rate quality (next screen load)
 */
export class SleepDetectionService {
  private state: SleepDetectionState = {};

  /**
   * Handle app state change for sleep detection.
   * Call from AppState listener in app/_layout.tsx
   */
  handleAppStateChange(nextAppState: AppStateStatus, settings?: UserSettings): SleepRecord | null {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      this.state.appWentBackgroundAt = Date.now();
      return null;
    }

    if (nextAppState === 'active') {
      const potentialSleepRecord = this.detectSleepSession(settings);
      this.state.appWentBackgroundAt = undefined;
      return potentialSleepRecord;
    }

    return null;
  }

  /**
   * Check if current time is within the bedtime window.
   */
  isWithinBedtimeWindow(settings: UserSettings): boolean {
    if (!settings.sleepBedtime || !settings.sleepWakeTime) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

    const [bedHour, bedMin] = settings.sleepBedtime.split(':').map(Number);
    const [wakeHour, wakeMin] = settings.sleepWakeTime.split(':').map(Number);
    
    const bedTime = bedHour * 60 + bedMin;
    const wakeTime = wakeHour * 60 + wakeMin;

    // Handle overnight sleep (bedtime after midnight, waketime next day)
    if (bedTime > wakeTime) {
      return currentTime >= bedTime || currentTime <= wakeTime;
    } else {
      return currentTime >= bedTime && currentTime <= wakeTime;
    }
  }

  /**
   * Calculate if a sleep session occurred based on background duration and bedtime window.
   */
  private detectSleepSession(settings?: UserSettings): SleepRecord | null {
    if (!this.state.appWentBackgroundAt || !settings) {
      return null;
    }

    const backgroundDuration = Date.now() - this.state.appWentBackgroundAt;

    // Only consider sessions >= 2 hours (to avoid false positives)
    if (backgroundDuration < SLEEP_DETECTION_THRESHOLD_MS) {
      return null;
    }

    // Only consider sessions that overlap with bedtime window
    if (!this.isWithinBedtimeWindow(settings)) {
      return null;
    }

    // Create sleep record for detected session
    const endTime = Date.now();
    const durationMinutes = Math.round(backgroundDuration / 60000);

    return {
      id: `sleep_${Date.now()}_${Math.random()}`,
      startTime: this.state.appWentBackgroundAt,
      endTime,
      durationMinutes,
      isAutoDetected: true,
      // qualityRating will be set when user confirms on next screen load
    };
  }

  /**
   * Reset detection state (call on daily reset).
   */
  reset(): void {
    this.state = {};
  }

  /**
   * Get threshold (for testing purposes).
   */
  getThresholdMs(): number {
    return SLEEP_DETECTION_THRESHOLD_MS;
  }
}

/**
 * Factory function to create singleton instance.
 */
let detectionServiceInstance: SleepDetectionService | null = null;

export function getSleepDetectionService(): SleepDetectionService {
  if (!detectionServiceInstance) {
    detectionServiceInstance = new SleepDetectionService();
  }
  return detectionServiceInstance;
}
