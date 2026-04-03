/**
 * Utility function to get day name from day index (0 = Sunday, 6 = Saturday)
 */
export function getDayName(dayIndex: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayIndex % 7];
}

/**
 * Format date to YYYY-MM-DD UTC
 */
export function toUTCDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parse HH:MM format to minutes since midnight
 */
export function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if current time is within a time window (handles overnight scenarios)
 */
export function isTimeInWindow(
  currentHour: number,
  currentMinute: number,
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number
): boolean {
  const current = currentHour * 60 + currentMinute;
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;

  if (start > end) {
    // Overnight window (e.g., 22:00 to 07:00)
    return current >= start || current <= end;
  }
  // Normal window (e.g., 09:00 to 17:00)
  return current >= start && current <= end;
}
