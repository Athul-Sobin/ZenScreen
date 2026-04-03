import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useCallback } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppState, AppStateStatus, View } from "react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { WellbeingProvider, useWellbeing } from "@/lib/wellbeing-context";
import * as Storage from "@/lib/storage";
import { getSleepDetectionService } from "@/lib/sleep-detection";
import { createBlueLightScheduler } from "@/lib/scheduler";
import { BlueLightOverlay } from "@/components/BlueLightOverlay";
import { DisplayFilterOverlay } from "@/components/DisplayFilterOverlay";
import { registerBackgroundSleepDetection } from "@/lib/tasks";
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from "@expo-google-fonts/dm-sans";
import { StatusBar } from "expo-status-bar";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="usage/[appId]" options={{ animation: 'slide_from_right', presentation: 'card' }} />
      <Stack.Screen name="puzzle" options={{ animation: 'slide_from_bottom', presentation: 'card' }} />
      <Stack.Screen name="blocked" options={{ animation: 'fade', presentation: 'modal' }} />
    </Stack>
  );
}

// Component to handle daily reset, sleep detection, and blue light scheduling
function DailyResetAndSleepManager() {
  const { refreshData, settings, saveSleepRecord, blueLightEnabled, blueLightIntensity, grayscaleEnabled } = useWellbeing();
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const sleepService = getSleepDetectionService();
  const scheduler = createBlueLightScheduler();

  const checkAndResetDaily = async () => {
    try {
      const lastResetDate = await Storage.getLastResetDate();
      // Use UTC date string to avoid timezone edge cases at midnight
      const today = new Date().toISOString().split('T')[0];
      
      if (lastResetDate !== today) {
        // Day has changed, reset daily data
        await Storage.resetDailyData();
        await Storage.saveLastResetDate(today);
        sleepService.reset();
        // Refresh context data to reflect reset
        await refreshData();
      }
    } catch (e) {
      console.error('Failed to check daily reset:', e);
    }
  };

  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    // When app comes to foreground, check if a new day has started
    if (appState !== 'active' && nextAppState === 'active') {
      await checkAndResetDaily();
    }

    // Handle sleep detection on foreground return
    if (appState !== 'active' && nextAppState === 'active') {
      const potentialSleepRecord = sleepService.handleAppStateChange(nextAppState, settings);
      if (potentialSleepRecord && settings.autoSleepDetectionEnabled) {
        // Save detected sleep session
        await saveSleepRecord(potentialSleepRecord);
        console.log('Sleep session detected:', potentialSleepRecord.durationMinutes, 'minutes');
      }
    } else {
      // App going to background
      sleepService.handleAppStateChange(nextAppState, settings);
    }

    setAppState(nextAppState);
  }, [appState, checkAndResetDaily, settings, saveSleepRecord]);

  // Check on mount
  useEffect(() => {
    checkAndResetDaily();
  }, []);

  // Monitor app state (foreground/background transitions)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [handleAppStateChange]);

  return null; // This component doesn't render anything
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      // Register background sleep detection task
      registerBackgroundSleepDetection();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
            <WellbeingProvider>
              <DailyResetAndSleepManager />
              <DisplayFilterWrapper />
            </WellbeingProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Wrapper for display filters that consumes context
function DisplayFilterWrapper() {
  const { blueLightEnabled, blueLightIntensity, settings, grayscaleEnabled } = useWellbeing();
  const scheduler = createBlueLightScheduler();
  
  const isAutoScheduleActive = settings.blueLightAutoSchedule &&
    scheduler.isInScheduleWindow({
      bedtime: settings.sleepBedtime,
      wakeTime: settings.sleepWakeTime,
      enabled: true,
      intensity: blueLightIntensity,
    });

  return (
    <DisplayFilterOverlay
      blueLightEnabled={blueLightEnabled || isAutoScheduleActive}
      grayscaleEnabled={grayscaleEnabled}
    >
      <StatusBar style="light" />
      <RootLayoutNav />
    </DisplayFilterOverlay>
  );
}
