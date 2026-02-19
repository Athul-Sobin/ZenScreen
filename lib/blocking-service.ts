import { BlockRule, FocusSession } from './types';

/**
 * Pure TypeScript blocking service logic (no React dependencies).
 * Used by both Focus Mode (Feature #2) and App Blocker (Feature #5).
 * 
 * NOTE: Expo managed workflow limitations - cannot intercept system-level app launches.
 * This service provides business logic for:
 * 1. Focus mode grayscale overlay on foreground app
 * 2. Usage modal blocking when app is already open in ZenScreen
 * 3. Time-limit enforcement for app blocker
 */

export interface BlockingContext {
  rules: BlockRule[];
  focusSession?: FocusSession;
  appUsageToday?: Record<string, number>;
}

/**
 * Check if an app should be blocked given current context.
 * Returns true if in Focus Grayscale mode or if app exceeds time limit.
 */
export function isAppBlocked(appId: string, context: BlockingContext): boolean {
  // Check if focus mode is active (grayscale overlay blocks all non-essential apps)
  if (context.focusSession && isFocusingApp(appId, context.focusSession)) {
    return false; // Focus app itself is allowed
  }

  // During focus mode, all other apps appear blocked (with grayscale)
  if (context.focusSession) {
    return true;
  }

  // Outside focus mode, check time-limit rules
  const rule = context.rules?.find(r => r.appId === appId);
  if (!rule) return false;

  // Full block rule
  if (rule.mode === 'full_block') {
    return true;
  }

  // Time limit rule
  if (rule.mode === 'time_limit' && rule.dailyLimitMinutes) {
    const usedToday = context.appUsageToday?.[appId] || 0;
    return usedToday >= rule.dailyLimitMinutes;
  }

  return false;
}

/**
 * Check if we should show the blocking interstitial modal.
 * Prevents showing modal too frequently (e.g., every 1 minute).
 */
export function shouldShowInterstitial(
  appId: string,
  context: BlockingContext,
  lastInterstitialTime?: number
): boolean {
  if (!isAppBlocked(appId, context)) {
    return false;
  }

  // Don't show interstitial more than once per minute
  const MIN_INTERSTITIAL_INTERVAL_MS = 60000;
  if (lastInterstitialTime && Date.now() - lastInterstitialTime < MIN_INTERSTITIAL_INTERVAL_MS) {
    return false;
  }

  return true;
}

/**
 * Get remaining time (in minutes) before app is blocked due to time limit.
 * Returns -1 if app is fully blocked, infinity if unrestricted.
 */
export function getRemainingTimeForApp(
  appId: string,
  context: BlockingContext
): number {
  const rule = context.rules?.find(r => r.appId === appId);
  if (!rule) return Infinity; // No rule = unrestricted

  if (rule.mode === 'full_block') {
    return -1; // Fully blocked
  }

  if (rule.mode === 'unrestricted') {
    return Infinity;
  }

  if (rule.mode === 'time_limit' && rule.dailyLimitMinutes !== undefined) {
    const usedToday = context.appUsageToday?.[appId] || 0;
    const remaining = rule.dailyLimitMinutes - usedToday;
    return Math.max(0, remaining);
  }

  return Infinity;
}

/**
 * Get user-friendly reason text for why app is blocked.
 */
export function getBlockedReason(appId: string, context: BlockingContext): string {
  // Check focus mode first
  if (context.focusSession) {
    const focusAppName = context.focusSession.appName || 'Focus app';
    return `Focus mode active. Only ${focusAppName} is allowed.`;
  }

  const rule = context.rules?.find(r => r.appId === appId);
  if (!rule) return 'App not found';

  if (rule.mode === 'full_block') {
    return `${rule.appName || 'This app'} is blocked.`;
  }

  if (rule.mode === 'time_limit' && rule.dailyLimitMinutes !== undefined) {
    const usedToday = context.appUsageToday?.[appId] || 0;
    if (usedToday >= rule.dailyLimitMinutes) {
      return `Daily limit reached (${rule.dailyLimitMinutes}min used).`;
    }
    const remaining = rule.dailyLimitMinutes - usedToday;
    return `${remaining}min remaining today.`;
  }

  return 'App is restricted';
}

/**
 * Check if given app is the active focus target.
 */
function isFocusingApp(appId: string, focusSession: FocusSession): boolean {
  return focusSession.appId === appId;
}

/**
 * Get list of apps allowed during focus (only focus app itself).
 */
export function getAllowedAppsForFocus(focusSession: FocusSession): string[] {
  return [focusSession.appId];
}

/**
 * Calculate opacity for grayscale overlay (0.0 = full color, 0.3 = moderate grayscale, 0.6 = heavy grayscale).
 * During focus, only the focused app shows in color; others are grayscaled.
 */
export function getGrayscaleOpacity(focusSession: FocusSession, currentAppId?: string): number {
  if (!focusSession || !currentAppId) return 0;
  if (currentAppId === focusSession.appId) return 0; // Focused app is in color
  return 0.4; // Non-focused apps are grayscaled
}
