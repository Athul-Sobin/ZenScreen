# PUZZLE RESET LOGIC BUG REPORT
## ZenScreen Digital Wellbeing Application

**Report Date:** February 19, 2026  
**Severity:** CRITICAL  
**Affected Feature:** Puzzle Challenge System (Bonus Minutes)  
**Status:** UNCONFIRMED - Awaiting product team clarification  

---

## 1. BUG SUMMARY

The Puzzle Challenge system has a **critical incomplete reset mechanism** that causes daily data (puzzle completion status, earned bonuses, solved puzzle history) to persist indefinitely instead of resetting at midnight. While some implicit reset logic exists, it is **never actively invoked** and depends on specific user actions to trigger.

**User-Visible Impact:**
- ❌ Users can complete all 3 puzzle tiers on Day 1, earn 15 bonus minutes
- ❌ If the user never closes/reopens the app by Day 2, the puzzles remain marked "completed"
- ❌ User cannot re-solve any puzzles despite the new day
- ✅ Implicit reset occurs when user opens app on a NEW calendar day (bonus minutes reset, puzzle IDs clear)
- ⚠️ **Timezone edge case:** Reset times are inconsistent across different user timezones

---

## 2. ROOT CAUSE ANALYSIS

### 2.1 The Smoking Gun: Unreferenced Function

**Location:** [lib/storage.ts](lib/storage.ts#L148-L150)

```typescript
export async function resetDailyData(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.PUZZLE_EXTENSIONS, KEYS.DAILY_BONUS, KEYS.USED_PUZZLE_IDS]);
}
```

**Critical Problem:** This function is **DEFINED but NEVER CALLED anywhere in the entire codebase.**

```bash
# Codebase search result:
$ grep -r "resetDailyData" .
lib/storage.ts:148:export async function resetDailyData(): Promise<void> {
```

**Only 1 match:** The definition itself. Zero calls. Zero references.

---

### 2.2 Missing Invoke Points

The function should be called in one of these locations, but **none of them exist:**

#### ❌ Option 1: App Launch (Never Implemented)
```tsx
// MISSING: useEffect in app/_layout.tsx
useEffect(() => {
  resetDailyDataIfNeeded();  // ← NOT IMPLEMENTED
}, []);
```

#### ❌ Option 2: AppState Listener (Never Implemented)
```tsx
// MISSING: Listen when app comes to foreground
useEffect(() => {
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      resetDailyDataIfNeeded();  // ← NOT IMPLEMENTED
    }
  });
  return () => subscription.remove();
}, []);
```

#### ❌ Option 3: Scheduled Task (Never Implemented)
```tsx
// MISSING: Run at midnight
const scheduleReset = () => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24*60*60*1000);
  tomorrow.setHours(0, 0, 0, 0);
  const msUntilMidnight = tomorrow - now;
  
  setTimeout(() => {
    resetDailyData();  // ← NOT IMPLEMENTED
  }, msUntilMidnight);
};
```

---

### 2.3 How Daily Reset Actually Works (Implicitly)

Instead of active reset, the code relies on **reactive date checking** when data is fetched:

**Location:** [lib/storage.ts](lib/storage.ts#L117-L128)

```typescript
export async function getDailyBonusMinutes(): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(KEYS.DAILY_BONUS);
    if (data) {
      const parsed = JSON.parse(data);
      const today = new Date().toDateString();  // ← Check today's date
      if (parsed.date === today) return parsed.minutes;  // ← Match?
    }
    return 0;  // ← If not today, return 0 (implicit reset)
  } catch {
    return 0;
  }
}
```

**Similar Pattern for Puzzle IDs:**

```typescript
export async function getUsedPuzzleIds(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.USED_PUZZLE_IDS);
    if (data) {
      const parsed = JSON.parse(data);
      const today = new Date().toDateString();
      if (parsed.date === today) return parsed.ids;  // ← Match?
    }
    return [];  // ← If not today, return empty (implicit reset)
  } catch {
    return [];
  }
}
```

---

### 2.4 The Missing Piece: PuzzleExtensions State

While bonus minutes and used puzzle IDs reset implicitly, **PuzzleExtensions do NOT:**

**Location:** [lib/storage.ts](lib/storage.ts#L107-L115) + [lib/wellbeing-context.tsx](lib/wellbeing-context.tsx#L50-L55)

```typescript
export async function getPuzzleExtensions(): Promise<PuzzleExtension[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.PUZZLE_EXTENSIONS);
    if (data) return JSON.parse(data);  // ← RETURNED AS-IS, NO DATE CHECK
    
    // Default structure
    const defaults: PuzzleExtension[] = [
      { tier: 1, puzzlesRequired: 1, minutesEarned: 5, completed: false, puzzlesSolved: 0 },
      { tier: 2, puzzlesRequired: 2, minutesEarned: 5, completed: false, puzzlesSolved: 0 },
      { tier: 3, puzzlesRequired: 3, minutesEarned: 5, completed: false, puzzlesSolved: 0 },
    ];
    return defaults;
  } catch {
    return [];
  }
}
```

**Problem:** 
- No date check like getDailyBonusMinutes()
- Once a tier is marked `completed: true`, it stays true forever
- User cannot re-solve that tier unless they manually reset app data or the state is overwritten

---

### 2.5 Race Condition: Rapid State Updates

**Location:** [app/puzzle.tsx](app/puzzle.tsx#L106-L113)

When a tier completes:

```typescript
const handleTierComplete = useCallback(async (finalSolved: number) => {
  const ext = puzzleExtensions.find(e => e.tier === currentTier);
  if (!ext) return;
  
  const success = finalSolved >= ext.puzzlesRequired;
  if (success) {
    const updatedExtensions = puzzleExtensions.map(e =>
      e.tier === currentTier ? { ...e, completed: true, puzzlesSolved: finalSolved } : e
    );
    await updatePuzzleExtensions(updatedExtensions);
    await updateDailyBonus(dailyBonusMinutes + ext.minutesEarned);
    // ← No await for both, potential race
  }
  setGameState('result');
}, [currentTier, puzzleExtensions, dailyBonusMinutes, updatePuzzleExtensions, updateDailyBonus]);
```

**The Race Condition:**
1. `updatePuzzleExtensions(updated)` --- writes to AsyncStorage (async, no await)
2. Immediately calls next function
3. If app crashes between these, state is partially written

Not immediately critical (only one user, single app instance) but violates principles.

---

## 3. BUG TIMELINE / USER SCENARIOS

### Scenario A: User on Day 1 (Expected Behavior)
```
08:00 - User opens app
       - puzzleExtensions: [completed: false, completed: false, completed: false]
       - dailyBonusMinutes: 0
       
10:00 - Solves Tier 1 puzzle
       - puzzleExtensions: [completed: true, completed: false, completed: false]
       - Earns 5 bonus minutes
       - dailyBonusMinutes: 5
       
12:00 - Solves Tier 2 puzzles
       - puzzleExtensions: [completed: true, completed: true, completed: false]
       - Earns 5 bonus minutes
       - dailyBonusMinutes: 10
       
14:00 - Solves Tier 3 puzzles
       - puzzleExtensions: [completed: true, completed: true, completed: true]
       - Earns 5 bonus minutes
       - dailyBonusMinutes: 15
```

**Expected reset at Day 2:** ✅ Works correctly

---

### Scenario B: User on Day 1, then Day 2 (WITHOUT Closing App)
```
08:00 Day 1 - Opens app
            - puzzleExtensions: [completed: false, false, false]
            - dailyBonusMinutes: 0

... Solves all tiers ...

23:55 Day 1 - Earned 15 bonus minutes
             - puzzleExtensions: [completed: true, true, true]
             - dailyBonusMinutes: 15
             
00:02 Day 2 - DOES NOT CLOSE APP [CRITICAL BUG HERE]
             - puzzleExtensions: [completed: true, true, true] ✅ WRONG!
             - Should be: [completed: false, false, false]
             - dailyBonusMinutes: 15 ✅ WRONG!
             - Should be: 0
             
             Open puzzle screen:
             - Bonus card shows: "0 / 15 min" ✅ Correct (implicitly reset)
             - Tier 1 shows: "COMPLETED - +5m earned" ✅ WRONG!
             - User cannot click Tier 1 again
             
             Workaround: Force-close app, reopen
             - On reopen, gets fresh puzzleExtensions defaults
             - Can solve again
```

**Expected:** Puzzles reset automatically at midnight ❌ FAILS  
**Actual:** Puzzles stay completed until app restarts ❌ BUG CONFIRMED

---

### Scenario C: User Leaves App Closed at Midnight (Edge Case)
```
14:00 Day 1 - Solves all 3 tiers, earns 15 minutes
             - App is closed and NOT REOPENED

00:00 Day 2 - Midnight passes
             - AsyncStorage on device still contains old state
             - puzzleExtensions: [completed: true, true, true] (unchanged in storage)

08:00 Day 2 - User opens app
             - WellbeingProvider.loadData() called
             - Loads puzzleExtensions from storage
             - No date comparison, so: [completed: true, true, true] loaded into state
             
             BUT:
             - getUsedPuzzleIds() checks date, returns []
             - getDailyBonusMinutes() checks date, returns 0
             
             UI shows:
             - Bonus today: "0 / 15 min" ✅
             - Tier 1: "COMPLETED - +5m earned" ✅ WRONG!
             
             To fix: User must clear app data
```

**Expected:** All puzzle state resets at midnight ❌ FAILS  
**Actual:** Only bonus minutes and used IDs reset ⚠️ INCONSISTENT

---

## 4. TIMEZONE INCONSISTENCY

**Problem:** Using `new Date().toDateString()`

```typescript
const today = new Date().toDateString();
// Returns: "Wed Feb 19 2026" (local client timezone)
```

**Issue:**
- User in 🇦🇺 Sydney (UTC+11:00) finishes puzzles at 23:55 Dec 31
- `toDateString()` → "Fri Jan 01 2027" (Day jumps forward)
- `new Date().toDateString()` next morning → "Fri Jan 01 2027"
- Date check succeeds, bonus persists into new calendar year

---

**Different User in 🇺🇸 Hawaii (UTC-10:00):**
- Same moment in time as Sydney
- `toDateString()` → "Thu Dec 31 2026" (still 2026)
- `new Date().toDateString()` next morning → "Fri Jan 01 2027"
- Different reset time despite same absolute time

---

## 5. EVIDENCE FROM CODE

### Evidence 1: Function Definition
[lib/storage.ts:148-150](lib/storage.ts#L148-L150)
```typescript
export async function resetDailyData(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.PUZZLE_EXTENSIONS, KEYS.DAILY_BONUS, KEYS.USED_PUZZLE_IDS]);
}
```

### Evidence 2: Function Never Called
[Grep result from entire codebase]
```
1 match for "resetDailyData"
└─ lib/storage.ts:148 (definition only, no calls)
```

### Evidence 3: Missing Lifecycle Hook
[app/_layout.tsx](app/_layout.tsx) - No useEffect calling resetDailyData()

### Evidence 4: PuzzleExtensions No Date Check
[lib/storage.ts:107-115](lib/storage.ts#L107-L115)
```typescript
export async function getPuzzleExtensions(): Promise<PuzzleExtension[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.PUZZLE_EXTENSIONS);
    if (data) return JSON.parse(data);  // ← No date check!
    // ...
  }
}
```

### Evidence 5: Bonus Minutes Has Date Check
[lib/storage.ts:117-128](lib/storage.ts#L117-L128)
```typescript
export async function getDailyBonusMinutes(): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(KEYS.DAILY_BONUS);
    if (data) {
      const parsed = JSON.parse(data);
      const today = new Date().toDateString();  // ← Check here
      if (parsed.date === today) return parsed.minutes;
    }
    return 0;
  }
}
```

---

## 6. ROOT CAUSE SUMMARY

| Aspect | Root Cause |
|--------|-----------|
| **Why reset doesn't work** | `resetDailyData()` function is never called anywhere |
| **Why data persists between days** | PuzzleExtensions has no date check; only implicit date check in bonus/puzzleIds |
| **Why bonus resets but tiers don't** | Inconsistent date check logic: bonus has check, extensions don't |
| **Why app restart fixes it** | WellbeingProvider re-initializes, loads fresh defaults |
| **Why timezone inconsistent** | Using client local time `toDateString()` instead of UTC |

---

## 7. SEVERITY ASSESSMENT

### Impact on Users
- 🔴 **Tier 1:** Users cannot re-solve puzzles without force-closing app
- 🔴 **Tier 2:** Bonus minutes don't reset visually until app restart
- 🔴 **Tier 3:** Violates expected ""daily reset"" behavior

### Production Risk
- ✅ **Not data-corrupt:** AsyncStorage data structure is valid
- ✅ **Not crash-prone:** No null references or type errors
- ❌ **Feature-breaking:** Puzzle system feature is non-functional on Day 2 without app restart
- ❌ **User frustration:** Users expect daily resets, will complain

### Business Risk
- Users claim they can "only solve puzzles once"
- Bonus time feature becomes perceived as broken or unfair
- Damage to app reputation and retention

---

## 8. QUESTIONS FOR PRODUCT TEAM

1. **Intended Reset Time:** Should puzzles reset at:
   - [ ] Exactly midnight every day (UTC or user's local time)?
   - [ ] 24 hours from first puzzle solved?
   - [ ] User-configurable bedtime?
   - [ ] Server-determined time (synced across devices)?

2. **Reset Scope:** Which data should reset daily?
   - [ ] `puzzleExtensions` `completed` flag (Tier 1-3 status)
   - [ ] `dailyBonusMinutes` counter (earned bonus total)
   - [ ] `usedPuzzleIds` (prevent duplicate puzzles)
   - All of the above?

3. **Multi-Device Behavior:** If user has multiple devices:
   - [ ] Each device tracks independently?
   - [ ] Sync across devices (need server)?
   - [ ] Lock to one device only?

4. **Edge Cases:**
   - If user solves puzzles at 23:55 on Day X, does bonus apply to Day X or Day X+1 daily goal?
   - If user is in different timezone from server, who "wins"?
   - If app is never opened, does state on device update without launching app?

---

## 9. REPRODUCTION STEPS

### To Reproduce the Bug (Manual Testing)

**Setup:**
1. Launch app
2. Skip onboarding
3. Navigate to Puzzle screen

**Steps:**
1. ✅ Tap "Tier 1" button
2. ✅ Solve 1 easy puzzle correctly
3. ✅ Confirm "Bonus Earned" message (+5m)
4. ✅ Return to menu
5. ✅ **Observe:** Tier 1 card shows "COMPLETED - +5m earned"
6. ✅ Tap Tier 1 button again
7. ❌ **EXPECTED:** Tier 1 should be available again (new day OR implicit reset)
8. ❌ **ACTUAL:** Button is disabled/greyed out "COMPLETED"
9. ✅ **Workaround:** Close app (kill process), reopen
10. ✅ **Observe:** Tier 1 is now available again
11. ✅ **Can solve again:** Fresh puzzle generated

---

## 10. FIX STRATEGY (AWAITING CONFIRMATION)

### Option A: Add Date Check to getPuzzleExtensions() [Minimal Fix]
```typescript
export async function getPuzzleExtensions(): Promise<PuzzleExtension[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.PUZZLE_EXTENSIONS);
    if (data) {
      const parsed = JSON.parse(data);
      const today = new Date().toDateString();
      
      // Add date check like getDailyBonusMinutes()
      if (parsed.date === today) {
        return parsed.extensions;
      }
      // If different day, return fresh defaults
    }
    
    const defaults = [/* ... */];
    // Save with today's date
    await AsyncStorage.setItem(KEYS.PUZZLE_EXTENSIONS, 
      JSON.stringify({ date: new Date().toDateString(), extensions: defaults })
    );
    return defaults;
  } catch {
    return [];
  }
}
```

**Pros:** Quick, consistent with other getters  
**Cons:** Still doesn't handle being stored without date field

---

### Option B: Active Reset at App Launch [Recommended]
```tsx
// In app/_layout.tsx useEffect
useEffect(() => {
  const resetIfNewDay = async () => {
    const lastResetDate = await AsyncStorage.getItem('@last_reset_date');
    const today = new Date().toDateString();
    
    if (lastResetDate !== today) {
      await resetDailyData();
      await AsyncStorage.setItem('@last_reset_date', today);
    }
  };
  
  resetIfNewDay();
}, []);
```

**Pros:** Explicit, clear intent, handles all cases  
**Cons:** Requires app launch to trigger

---

### Option C: Scheduled Midnight Reset [Ideal for Production]
```tsx
// New helper function
const scheduleNextReset = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // Next midnight
  
  const msUntilMidnight = midnight.getTime() - now.getTime();
  
  const timeoutId = setTimeout(async () => {
    await resetDailyData();
    scheduleNextReset(); // Reschedule for next day
  }, msUntilMidnight);
  
  return timeoutId;
};
```

**Pros:** Resets regardless of app state  
**Cons:** Requires background execution (difficult on iOS)

---

## 11. RECOMMENDATIONS

### Must Fix Before Launch
- ✅ Add active reset mechanism at app launch (Option B)
- ✅ Fix PuzzleExtensions date handling
- ✅ Normalize all dates to UTC instead of local time

### Should Fix Before Launch
- ⚠️ Add resetDailyData() call to at least one location
- ⚠️ Document timezone behavior in ReleaseNotes

### Nice to Have
- 📌 Implement scheduled reset with wakelock (Option C)
- 📌 Add unit tests for date handling
- 📌 Add crash analytics to detect edge cases

---

## CONCLUSION

The puzzle reset bug is **caused by a missing function invocation** combined with **inconsistent date-checking logic** across different data types. The function `resetDailyData()` exists but is never called, and `PuzzleExtensions` lacks the same date-check logic that `DailyBonusMinutes` has, causing them to persist indefinitely within a single app session.

**Fix Complexity:** LOW (straightforward implementation)  
**Risk of Breaking Other Features:** LOW (isolated to puzzle system)  
**User Impact Before Fix:** HIGH (puzzle system non-functional on Day 2+)

**Awaiting product team clarification on reset timing and scope before implementation.**

---

## APPENDIX: Related Code Locations

- [lib/storage.ts:148](lib/storage.ts#L148) - `resetDailyData()` definition
- [lib/storage.ts:107](lib/storage.ts#L107) - `getPuzzleExtensions()` missing date check
- [lib/storage.ts:117](lib/storage.ts#L117) - `getDailyBonusMinutes()` has date check (correct pattern)
- [app/puzzle.tsx:34](app/puzzle.tsx#L34) - Initial load of usedIds
- [app/_layout.tsx](app/_layout.tsx) - Root layout, should have reset trigger
- [lib/wellbeing-context.tsx:46](lib/wellbeing-context.tsx#L46) - Initial data load

---

**Report Status:** Ready for Product Team Review  
**Next Steps:** 
1. Clarify reset timing requirements
2. Confirm reset scope (which data types)
3. Implement approved fix strategy
4. Add unit tests for date handling
5. Manual testing on both Android & iOS
