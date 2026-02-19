# FEATURE SPECIFICATIONS & DESIGN ROADMAP
## ZenScreen Digital Wellbeing Application

**Document Version:** 1.0  
**Date:** February 19, 2026  
**Status:** AWAITING APPROVAL - Do NOT implement until reviewed  

---

## OVERVIEW

This document outlines the five features that will be designed and implemented per the project requirements. Each feature is summarized here with key decisions noted. Detailed Technical Design Documents (TDDs) will be created for each feature separately upon approval.

---

## FEATURE #1: FIX - PUZZLE RESET LOGIC

### Current Status: BROKEN ❌

**What It Should Do:**
- Daily puzzle counter resets at midnight (or as configured)
- Users can re-solve puzzles each day
- Bonus minutes earned each day are tracked independently

**What It Currently Does:**
- Puzzle counter persists until app restart
- `resetDailyData()` function exists but is never called
- Users cannot solve puzzles twice without closing app

**Fix Strategy:** [See PUZZLE_RESET_BUG_REPORT.md for details]

**Success Criteria:**
- [ ] `resetDailyData()` is invoked at appropriate time (app launch or midnight)
- [ ] PuzzleExtensions state resets daily
- [ ] DailyBonusMinutes resets visually and in state
- [ ] UsedPuzzleIds resets so puzzles can be re-solved
- [ ] No data corruption on reset
- [ ] Timezone handling is consistent (UTC or documented)

**Implementation Approach:**
- Add reset trigger in app initialization
- Add date tracking to PuzzleExtensions storage
- Normalize to UTC for consistency
- Add unit tests for date edge cases

**Dependency:** None (prerequisite for puzzle system to work)  
**Complexity:** LOW  
**Estimated Effort:** 2-3 hours

---

## FEATURE #2: FOCUS MODE (APP BLOCKING & NOTIFICATIONS)

### Current Status: INCOMPLETE (UI Only) ⚠️

**Goal:**
Block notifications and distracting apps during focus sessions, allowing users to enter a distraction-free state.

**Scope:**

#### 2.1 Android Implementation
- **Notifications:** Use `NotificationManager.setInterruptionFilter()` or DND (Do Not Disturb) policy
- **App Blocking:** Use AccessibilityService to detect when blocked app is foregrounded, redirect to home screen
- **Website Blocking:** Use VpnService for DNS-level filtering of blocked domains
- **Blocked App List:** User-configurable defaults (YouTube, Instagram, TikTok, Twitter/X, Reddit, Snapchat)
- **Duration:** Configurable (25 min, 45 min, 1 hour, custom)
- **Emergency Override:** Solve puzzle to earn 5 extra minutes

#### 2.2 iOS Implementation
- **Notifications:** Use FamilyControls.ManagedSettingsStore to suppress notifications (requires entitlement)
- **App Blocking:** Use Screen Time API (FamilyActivityPicker, associated web domain blocking)
- **Website Blocking:** ContentBlocker extension or NEFilterDataProvider
- **Note:** Requires `com.apple.developer.family-controls` entitlement (Apple review required)
- **Limitation:** System-level control only with Screen Time entitlements; in-app restrictions not possible without native implementation

#### 2.3 UI Components
- Toggle for active/inactive states
- Countdown timer visible while active
- Add/remove blocked apps and websites interface
- Active focus badge with time remaining

**Current UI:** ✅ Menu, timer display, app selection exist  
**Missing:** ❌ Native implementation, real blocking

**Success Criteria:**
- [ ] Blocked apps cannot be foregrounded during focus (Android)
- [ ] Notifications are suppressed during focus
- [ ] Screen Time API integration works (iOS)
- [ ] Emergency override puzzle mechanism functions
- [ ] Session data persists after app restart
- [ ] Countdown timer survives forced app closure
- [ ] Website blocking works in Safari and in-app browsers

**Implementation Order:**
1. Fix puzzle reset bug first (prerequisite for emergency override)
2. Implement native Android AccessibilityService
3. Implement iOS Screen Time API
4. Build website blocking (VpnService or DNS proxy)
5. Add UI for website management
6. Test with popular apps (Instagram, YouTube, Reddit)

**Complexity:** VERY HIGH  
**Estimated Effort:** 40-60 hours (including native modules)  
**Risks:**
- AccessibilityService requires user accessibility permission (may be revoked)
- iOS Screen Time entitlement requires Apple review (approval not guaranteed)
- VPN-based approach conflicts with other VPN apps
- Website blocking cannot prevent VPN circumvention

---

## FEATURE #3: MANUAL SLEEP CONFIGURATION & AUTO-DETECTION

### Current Status: MOCK DATA ONLY ❌

**Goal:**
Allow users to configure sleep schedule and automatically log sleep sessions by detecting device inactivity.

**Scope:**

#### 3.1 Manual Configuration
- Sleep goal time (bedtime and wake time)
- Optional: Sleep quality rating UI to let users log sessions manually

#### 3.2 Automatic Sleep Detection
- Monitor device screen on/off events after 10:00 PM
- If screen has been off for 30+ consecutive minutes, log sleep session start
- When screen turns back on, log session end
- Session duration, bedtime, wake time, and optional quality rating

#### 3.3 Android Implementation
- ForegroundService with notification (required for persistent listening)
- BroadcastReceiver listening for `ACTION_SCREEN_OFF` / `ACTION_SCREEN_ON`
- Usage stats to confirm no activity (as fallback)
- Runs continuously; does not require user to open app

#### 3.4 iOS Implementation
- BGAppRefreshTask for periodic background checks
- HostingController for privacy-aware device state monitoring
- **Limitation:** iOS heavily restricts background execution
- Cannot reliably detect sleep without explicit user action

#### 3.5 Data Structure
```typescript
{
  id: string,
  date: string (ISO 8601),
  bedtime: string (HH:MM),
  wakeTime: string (HH:MM),
  durationMinutes: number,
  isManual: boolean,
  quality?: 'poor' | 'fair' | 'good' | 'excellent',
  detectionMethod: 'automatic' | 'manual'
}
```

#### 3.6 Notifications
- Bedtime reminder 15 minutes before configured sleep time (unless already in session)
- Wake time reminder at configured time (optional)

#### 3.7 Analytics Display
- 7-day sleep history (already in UI, needs real data)
- Rolling averages (7, 14, 30 days)
- Sleep quality trends
- Deviation from configured sleep time

**Current UI:** ✅ Sleep history chart, quality badges exist  
**Missing:** ❌ Automatic detection, device listener, notifications

**Success Criteria:**
- [ ] Automatic sleep detection works (30+ min inactivity = sleep logged)
- [ ] Sleep log survives app kill/restart
- [ ] Bedtime reminders sent 15 min before configured time
- [ ] Manual sleep entry UI functional
- [ ] History shows both auto-detected and manual entries
- [ ] Analytics (avg sleep, trends) calculated correctly
- [ ] iOS gracefully handles permission denial

**Implementation Order:**
1. Add sleep configuration UI (settings screen expanded)
2. Implement Android ForegroundService + BroadcastReceiver
3. Implement sleep detection logic and logging
4. Implement iOS background task (lesser priority)
5. Add notification scheduling
6. Add analytics calculations
7. Test with multiple sleep patterns

**Complexity:** HIGH  
**Estimated Effort:** 30-40 hours  
**Risks:**
- iOS background execution is unpredictable
- Detecting sleep is difficult without additional sensors (accelerometer, heart rate)
- Battery drain from foreground service (needs optimization)
- False positives if device is just in pocket

**Edge Cases to Handle:**
- Minimum sleep duration (don't log <2 hour sessions as sleep)
- User manually turns on screen briefly at 2 AM (don't break session)
- Device is plugged in overnight with screen on (don't log as sleep)
- Multiple microbursts of activity (handle as single session)

---

## FEATURE #4: BLUE LIGHT FILTER (WARM OVERLAY)

### Current Status: NOT IMPLEMENTED ❌

**Goal:**
Apply warm-toned overlay to reduce blue light emission, reducing eye strain and sleep disruption.

**Scope:**

#### 4.1 Overlay Control
- Intensity slider: 0% (off) to 100% (maximum warmth)
- Maps to orange/amber ARGB color with variable alpha
- Full-screen overlay drawn above all content

#### 4.2 Scheduling
- Auto-enable at user-configured time (e.g., 9 PM)
- Auto-disable at wake time
- Integration with sleep schedule from Feature #3
- Manual toggle for immediate on/off

#### 4.3 Android Implementation
- Use SYSTEM_ALERT_WINDOW permission (TYPE_APPLICATION_OVERLAY API level 26+)
- Overlay drawn using WindowManager
- Persists outside the Flutter/Expo app
- Does not require app to be in foreground

#### 4.4 iOS Implementation
- **Limitation:** True system-wide overlay not possible without Screen Time entitlements
- **Solution:** Overlay can be applied inside app only
- Recommend pointing users to native Night Shift as complement
- If Screen Time entitlements obtained, can apply system-wide (lower priority)

#### 4.5 UI Components
- Intensity slider on dashboard or settings
- Schedule time picker
- Toggle switch (on/off)
- Preview of overlay effect
- Status indicator showing current intensity

**Current UI:** None  
**Missing:** ❌ Native overlay, scheduling, configuration UI

**Success Criteria:**
- [ ] Overlay appears at scheduled time
- [ ] Intensity adjustable in real-time
- [ ] Overlay persists over all apps (Android)
- [ ] Auto-disable at wake time
- [ ] Manual override works (toggle on/off)
- [ ] Minimal battery drain
- [ ] Color warmth perceived as reducing blue light

**Implementation Order:**
1. Build configuration UI (settings screen additions)
2. Implement Android WindowManager overlay
3. Schedule enable/disable (with app launch check)
4. Add intensity slider
5. Implement iOS in-app overlay as fallback
6. Test with sleep detection integration
7. Performance optimization

**Complexity:** MEDIUM  
**Estimated Effort:** 15-20 hours  
**Risks:**
- WindowManager requires SYSTEM_ALERT_WINDOW permission (may be restricted on some devices)
- Battery drain from persistent overlay
- Perception of blue light reduction varies (not scientifically proven)
- Custom color may not match native Night Shift appearance

---

## FEATURE #5: APP BLOCKER (24/7 USAGE LIMITS)

### Current Status: NOT IMPLEMENTED ❌

**Goal:**
Persistent app blocking system operating 24/7. Users set daily time limits or full blocks per app, with interstitial screens and puzzle override mechanism.

**Scope:**

#### 5.1 Blocklist Manager
- Query installed apps using `device_apps` or `installed_apps` package
- Display with app icons
- User can set per-app:
  - Full Block (cannot launch at all)
  - Time Limit (launch allowed until X minutes spent today)
  - Unrestricted (no limit)

#### 5.2 Time Tracking
- Use UsageStatsManager (Android) to track time per app
- Track app opens and total screen-on time
- Reset counters at midnight

#### 5.3 Interstitial Screen
When a blocked or limit-exceeded app is launched:
- Show full-screen interstitial with:
  - Time spent today on that app
  - Daily limit (if set)
  - Motivational message
  - "Solve a Puzzle for 5 more minutes" option
  - "Try Again Tomorrow" button
- Interstitial blocks app launch until dismissed or puzzle solved

#### 5.4 Dashboard
- Per-app usage display as bar chart (use `fl_chart` or equivalent)
- Rolling averages (daily, weekly)
- Predictions ("At current rate, you'll hit limit in X minutes")
- Trending (showing improvement/regression)

#### 5.5 Android Implementation
- UsageStatsManager for usage tracking
- AccessibilityService to intercept app launches
- Foreground Service for persistent monitoring
- BroadcastReceiver for app launch events
- Store limits and block list in AsyncStorage

#### 5.6 iOS Implementation
- Screen Time API for app limiting (if entitlements granted)
- App Groups + Shared Container for data sharing between app and Screen Time extension
- **Limitation:** Cannot intercept app launches without system-level control
- Manual logging as fallback

**Current UI:** Dashboard shows mock apps; no settings for blocklist  
**Missing:** ❌ Native tracking, app interception, blocklist configuration

**Success Criteria:**
- [ ] All installed apps appear in App Blocker UI
- [ ] Time limits enforced (app launch blocked if limit exceeded)
- [ ] Interstitial shows app-specific usage and limit
- [ ] Puzzle override grants 5 minutes
- [ ] Usage data accurate to within 1% of system stats
- [ ] Data persists after app restart
- [ ] Battery impact is minimal (<5% drain)
- [ ] Does not conflict with Focus Mode

**Implementation Order:**
1. Query installed apps and display in settings
2. Create blocklist + limit storage schema
3. Implement UsageStatsManager tracking (Android)
4. Implement AccessibilityService app interception
5. Build interstitial UI
6. Integrate puzzle override
7. Build usage dashboard with charts
8. iOS implementation (lower priority if Screen Time not available)
9. Handle edge case apps (system apps, launchers, other security apps)
10. Performance optimization (don't track too frequently)

**Complexity:** VERY HIGH  
**Estimated Effort:** 50-70 hours  
**Risks:**
- AccessibilityService can be toggled off by user (no enforcement)
- UsageStatsManager requires permission and has limited history (30 days)
- Some apps may not register in UsageStatsManager (system services)
- Conflict with device admin policies
- User can uninstall app to bypass blocking
- iOS implementation heavily limited without Screen Time

**Shared Architecture:**
- Must share common `BlockingService` abstraction with Focus Mode
- Both features use AccessibilityService, so coordination needed
- Overlapping permissions (must request once, use for both)

---

## CROSS-CUTTING CONCERNS

### Native Module Organization
All native code should be organized under:
```
android/app/src/main/java/com/zenscreen/
├── modules/
│   ├── UsageTrackerModule.java        (Feature #5)
│   ├── FocusBlockerModule.java        (Feature #2)
│   ├── SleepDetectorModule.java       (Feature #3)
│   └── BlueLight FilterModule.java    (Feature #4)
├── services/
│   ├── AccessibilityService.java
│   ├── ForegroundService.java
│   ├── BootReceiver.java
│   └── NotificationListener.java
└── utils/
    └── BlockingService.java           (Shared)

ios/
├── Modules/
│   └── UsageTrackerModule.swift
├── Services/
│   └── ScreenTimeIntegration.swift
└── Extensions/
    └── ScreenTimeExtension.appex/
```

### Shared State Management
Create unified access layer:
```
lib/
├── services/
│   ├── BlockingService.ts    (Abstract base)
│   ├── AndroidBlockingService.ts
│   ├── IOSBlockingService.ts
│   ├── UsageService.ts
│   ├── NotificationService.ts
│   └── SleepService.ts
└── hooks/
    ├── useBlocking.ts
    ├── useUsageTracking.ts
    ├── useSleepDetection.ts
    └── useBlueLight.ts
```

### Permissions Strategy
Group permission requests:
```
1. APP USAGE PERMISSIONS
   - PACKAGE_USAGE_STATS (Android)
   - Screen Time read (iOS)

2. APP CONTROL PERMISSIONS
   - ACCESSIBILITY_SERVICE (Android)
   - SYSTEM_ALERT_WINDOW (Android)
   - com.apple.developer.family-controls (iOS)

3. NOTIFICATION PERMISSIONS
   - POST_NOTIFICATIONS (Android 13+)
   - notificationCenter permission (iOS)

4. SYSTEM PERMISSIONS
   - DEVICE_POWER (for wakelock if needed)
```

---

## IMPLEMENTATION DEPENDENCIES

```
Feature #1: Puzzle Reset Fix
    ↓
    Prerequisite for #2 (emergency override uses puzzles)

Feature #2: Focus Mode (App Blocking)
    ↓
    Uses shared BlockingService
    Depends on AccessibilityService
    May conflict with Feature #5

Feature #3: Sleep Detection
    ↓
    Integrates with Feature #4 (auto-enable blue light)
    Independent of others

Feature #4: Blue Light Filter
    ↓
    Can be built independently
    Works better with Feature #3

Feature #5: App Blocker
    ↓
    Shares BlockingService with Feature #2
    Conflicts: Both use AccessibilityService
    Solution: Merge into unified BlockingService

CRITICAL: Features #2 and #5 must NOT be implemented independently
Solution: Create unified BlockingService that handles both
```

---

## RISK REGISTER

### Platform Limitations

| Risk | Platform | Mitigation |
|------|----------|-----------|
| Screen Time entitlement rejection | iOS | Implement graceful degradation; point to native APIs |
| AccessibilityService can be disabled | Android | Detect and notify user; document limitation |
| UsageStatsManager limited history | Android | Supplement with manual tracking if needed |
| Battery drain from ForegroundService | Android | Optimize wakelock; use efficient timers |
| iOS background execution restricted | iOS | Use BGAppRefreshTask; expect intermittent results |
| VPN conflicts with website blocking | Android | Document as limitation; recommend Tailscale |
| Dual-permission conflict | Android | Design single permission request flow |

### Quality Assurance Challenges

| Risk | Area | Mitigation |
|------|------|-----------|
| Hard to test blocking in emulator | Android | Test on real device; mock native modules |
| Sleep detection false positives | All | Set high thresholds (30 min min); allow manual override |
| Timezone handling bugs | All | Use UTC throughout; add specific tests |
| State sync across app restart | All | Add unit tests for persistence |
| Performance degradation | All | Profile with real data; optimize database queries |

### Adoption Risks

| Risk | Area | Mitigation |
|------|------|-----------|
| Users disable accessibility service | Android | Educate in onboarding; check permission status |
| App store rejection (iOS) | iOS | Get pre-approval; use public APIs only |
| Perception of surveillance | All | Transparent privacy policy; local storage only |
| Feature overwhelming users | UX | Implement gradual rollout; keep defaults sensible |

---

## FEATURE ROLLOUT STRATEGY

### Phase 1: Stabilization (Week 1-2)
1. ✅ Fix puzzle reset bug
2. ✅ Add comprehensive testing
3. ✅ Validate existing features
4. Release maintenance patch

### Phase 2: Sleep & Blue Light (Week 3-4)
1. Implement Feature #3 (Sleep Detection)
2. Implement Feature #4 (Blue Light Filter)
3. Integrate sleep + blue light automation
4. Beta release

### Phase 3: Focus & Blocking (Week 5-8)
1. Design unified BlockingService
2. Implement Feature #2 (Focus Mode) with real blocking
3. Implement Feature #5 (App Blocker) using shared service
4. Handle permission flows and conflicts
5. Extensive testing on multiple Android/iOS versions
6. Production release

---

## APPROVAL CHECKPOINTS

Before implementation of each feature, the following must be approved:

- [ ] **Feature #1 Fix (Puzzle Reset):** Approved by: _____ Date: _____
- [ ] **Feature #2 (Focus Mode):** Approved by: _____ Date: _____
- [ ] **Feature #3 (Sleep):** Approved by: _____ Date: _____
- [ ] **Feature #4 (Blue Light):** Approved by: _____ Date: _____
- [ ] **Feature #5 (App Blocker):** Approved by: _____ Date: _____

---

## NEXT STEPS

1. ✅ **This document:** Review and approve feature scopes
2. ⏳ **Technical Design Documents:** Create detailed TDD for each feature (data models, state management, platform APIs)
3. ⏳ **Implementation Plan:** Create ordered task list with dependencies
4. ⏳ **Risk Register:** Detailed risk assessment and mitigation
5. ⏳ **Begin Phase 1:** Start puzzle fix bug implementation

---

**Document Status:** AWAITING PRODUCT TEAM APPROVAL  
**Last Updated:** February 19, 2026  
**Next Review:** Upon completion of all TDDs
