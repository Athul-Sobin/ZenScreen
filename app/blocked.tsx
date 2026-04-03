import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useWellbeing } from '@/lib/wellbeing-context';

/**
 * Blocked Screen
 * 
 * Displayed when a user attempts to use an app that:
 * - Is in full_block mode, or
 * - Has exceeded its daily time limit
 * 
 * Provides options to:
 * 1. Go back (close the blocked app)
 * 2. Solve a puzzle for +5 minute extension
 */
export default function BlockedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = Colors.dark;
  const { blockRules, apps, activeFocusSession } = useWellbeing();
  
  // Get the app ID from route params
  const { appId, reason: passedReason } = useLocalSearchParams<{ appId?: string; reason?: string }>();

  // Find the blocked app
  const blockedApp = appId ? apps.find(a => a.id === appId) : null;

  // Use passed reason or construct it
  const reason = passedReason || (blockedApp ? `${blockedApp.name} is blocked.` : 'This app is blocked.');

  const handleGoBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleSolvePuzzle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to puzzle with context that this is for an extension
    router.push({
      pathname: '/puzzle',
      params: { source: 'blocked-extension', appId },
    });
  }, [router, appId]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <BlurView intensity={90} style={StyleSheet.absoluteFill} tint="dark" />

      <View style={[styles.content, { paddingHorizontal: 20 }]}>
        {/* Icon/Header */}
        <View style={[styles.iconContainer, { backgroundColor: c.dangerLight }]}>
          <Text style={styles.icon}>🚫</Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: c.text }]}>App Blocked</Text>

        {/* App Name */}
        {blockedApp && (
          <Text style={[styles.appName, { color: c.textMuted }]}>
            {blockedApp.name}
          </Text>
        )}

        {/* Reason */}
        <View style={[styles.reasonContainer, { backgroundColor: c.surface, borderColor: c.danger }]}>
          <Text style={[styles.reasonText, { color: c.text }]}>
            {reason}
          </Text>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {/* Solve Puzzle Button */}
          <Pressable
            onPress={handleSolvePuzzle}
            style={({ pressed }) => [
              styles.puzzleButton,
              { backgroundColor: c.tint, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={[styles.puzzleButtonText, { color: c.background }]}>
              Solve Puzzle
            </Text>
            <Text style={[styles.extensionText, { color: c.background }]}>
              +5 min extension
            </Text>
          </Pressable>

          {/* Go Back Button */}
          <Pressable
            onPress={handleGoBack}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: c.surface,
                borderColor: c.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.backButtonText, { color: c.text }]}>
              Go Back
            </Text>
          </Pressable>
        </View>

        {/* Footer Info */}
        <Text style={[styles.footerText, { color: c.textMuted }]}>
          Help yourself focus by setting healthy limits
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  appName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  reasonContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  reasonText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  puzzleButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puzzleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  extensionText: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 4,
    opacity: 0.9,
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});