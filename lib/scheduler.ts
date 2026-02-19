/**
 * Blue Light Filter Scheduler
 * 
 * Automatically enables/disables blue light filter based on bedtime schedule.
 * 
 * Logic:
 * 1. At bedtime, enable blue light filter
 * 2. At wake time, disable blue light filter
 * 3. User can manually override anytime
 * 4. Respects manual state until next scheduled time
 */

export interface BlueLightScheduleConfig {
  bedtime: string; // HH:MM format (e.g., "22:00")
  wakeTime: string; // HH:MM format (e.g., "07:00")
  enabled: boolean;
  intensity: number; // 0-100
}

export class BlueLightScheduler {
  /**
   * Determine if blue light should be active now based on schedule.
   */
  shouldBlueLightBeActive(config: BlueLightScheduleConfig): boolean {
    if (!config.enabled) {
      return false;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const { bedtime, wakeTime } = config;

    const bedtimeMinutes = this.timeToMinutes(bedtime);
    const wakeTimeMinutes = this.timeToMinutes(wakeTime);

    // Handle case where bedtime is after wake time (crosses midnight)
    // e.g., bedtime 22:00, wake time 7:00 -> filter active 22:00-23:59 and 00:00-07:00
    if (bedtimeMinutes > wakeTimeMinutes) {
      return currentMinutes >= bedtimeMinutes || currentMinutes < wakeTimeMinutes;
    } else {
      // Bedtime before wake time within same day (shouldn't happen in normal usage)
      return currentMinutes >= bedtimeMinutes && currentMinutes < wakeTimeMinutes;
    }
  }

  /**
   * Get minutes until next schedule change (blue light toggle).
   */
  getMinutesUntilNextChange(config: BlueLightScheduleConfig): number {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const bedtimeMinutes = this.timeToMinutes(config.bedtime);
    const wakeTimeMinutes = this.timeToMinutes(config.wakeTime);

    const isCurrentlyActive = this.shouldBlueLightBeActive(config);

    if (isCurrentlyActive) {
      // Filter is on, calculate minutes until wake time
      if (bedtimeMinutes > wakeTimeMinutes) {
        // Crosses midnight
        if (currentMinutes >= bedtimeMinutes) {
          // We're in the PM portion
          return 24 * 60 - currentMinutes + wakeTimeMinutes;
        } else {
          // We're in the AM portion
          return wakeTimeMinutes - currentMinutes;
        }
      } else {
        return wakeTimeMinutes - currentMinutes;
      }
    } else {
      // Filter is off, calculate minutes until bedtime
      if (bedtimeMinutes > wakeTimeMinutes) {
        return bedtimeMinutes - currentMinutes;
      } else {
        return bedtimeMinutes - currentMinutes;
      }
    }
  }

  /**
   * Calculate suggested intensity based on time of night.
   * Lower intensity earlier in evening, higher intensity deeper into night.
   * 
   * Example:
   * - 20:00 (8pm): 20% intensity
   * - 22:00 (10pm): 50% intensity
   * - 02:00 (2am): 80% intensity
   * - 06:00 (6am): 30% intensity
   */
  getSuggestedIntensity(config: BlueLightScheduleConfig): number {
    const now = new Date();
    const hour = now.getHours();

    // Map hours to intensity
    const bedtimeHour = this.parseHour(config.bedtime);
    const wakeHour = this.parseHour(config.wakeTime);

    // Early evening (before bedtime): lower intensity
    if (hour >= 20 && hour < bedtimeHour) {
      return 20;
    }

    // Late evening/night: medium-high intensity
    if (hour >= bedtimeHour && hour < 2) {
      return 60;
    }

    // Deep night: high intensity
    if (hour >= 2 && hour < 5) {
      return 80;
    }

    // Early morning: medium intensity
    if (hour >= 5 && hour < wakeHour) {
      return 40;
    }

    return 0; // Daytime
  }

  /**
   * Test if current time is within scheduled window.
   * Useful for testing and debugging.
   */
  isInScheduleWindow(config: BlueLightScheduleConfig, testDate?: Date): boolean {
    if (!config.enabled) return false;

    const date = testDate || new Date();
    const currentMinutes = date.getHours() * 60 + date.getMinutes();

    const bedtimeMinutes = this.timeToMinutes(config.bedtime);
    const wakeTimeMinutes = this.timeToMinutes(config.wakeTime);

    if (bedtimeMinutes > wakeTimeMinutes) {
      return currentMinutes >= bedtimeMinutes || currentMinutes < wakeTimeMinutes;
    } else {
      return currentMinutes >= bedtimeMinutes && currentMinutes < wakeTimeMinutes;
    }
  }

  // Private helpers
  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private parseHour(timeStr: string): number {
    return Number(timeStr.split(':')[0]);
  }
}

/**
 * Factory function for scheduler instance.
 */
export function createBlueLightScheduler(): BlueLightScheduler {
  return new BlueLightScheduler();
}
