import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Animated,
  Modal,
} from 'react-native';
import Colors from '@/constants/colors';
import { FocusSession } from '@/lib/types';

interface BlockingOverlayProps {
  visible: boolean;
  focusSession?: FocusSession;
  onDismiss?: () => void;
  onExitFocus?: () => void;
}

/**
 * Interstitial overlay shown when user tries to open an app while in Focus Mode.
 * Presents options to:
 * 1. Continue focus (dismiss overlay)
 * 2. Exit focus mode (end session)
 *
 * Only shown once per minute per app to avoid modal spam.
 */
export function BlockingOverlay({
  visible,
  focusSession,
  onDismiss,
  onExitFocus,
}: BlockingOverlayProps) {
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [visible, fadeAnim]);

  if (!visible || !focusSession) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Semi-transparent dark background */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onDismiss} // Tap outside to dismiss
        />

        {/* Content card */}
        <View style={styles.card}>
          <Text style={styles.title}>Focus Mode Active</Text>

          <Text style={styles.focusAppText}>
            Currently focusing on{' '}
            <Text style={styles.focusAppName}>
              {focusSession?.appName || 'Focus app'}
            </Text>
          </Text>

          {focusSession && focusSession.durationMinutes && (
            <Text style={styles.timeRemaining}>
              {Math.ceil((focusSession.endTime - Date.now()) / 60000)} minutes
              remaining
            </Text>
          )}

          {/* Action buttons */}
          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.continueButton]}
              onPress={onDismiss}
              android_ripple={{ color: Colors.dark.tint + '20' }}
            >
              <Text style={styles.continueButtonText}>Continue Focus</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.exitButton]}
              onPress={onExitFocus}
              android_ripple={{ color: Colors.dark.danger + '20' }}
            >
              <Text style={styles.exitButtonText}>Exit Focus Mode</Text>
            </Pressable>
          </View>

          <Text style={styles.hint}>Tap outside to dismiss</Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000CC', // Semi-transparent black
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.dark.card,        // was: Colors.darkCard
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 32,
    marginHorizontal: 20,
    width: '85%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.text,                  // was: Colors.white
    marginBottom: 12,
    textAlign: 'center',
  },
  focusAppText: {
    fontSize: 16,
    color: Colors.dark.textSecondary,         // was: Colors.textSecondary
    marginBottom: 8,
    textAlign: 'center',
  },
  focusAppName: {
    color: Colors.dark.tint,                  // was: Colors.primary
    fontWeight: '600',
  },
  timeRemaining: {
    fontSize: 14,
    color: Colors.dark.tint,                  // was: Colors.primary
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButton: {
    backgroundColor: Colors.dark.tint,        // was: Colors.primary
  },
  continueButtonText: {
    color: Colors.dark.text,                  // was: Colors.text
    fontSize: 16,
    fontWeight: '600',
  },
  exitButton: {
    backgroundColor: Colors.dark.background,  // was: Colors.darkBg
    borderWidth: 2,
    borderColor: Colors.dark.danger,          // was: Colors.errorRed
  },
  exitButtonText: {
    color: Colors.dark.danger,                // was: Colors.errorRed
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: Colors.dark.textSecondary,         // was: Colors.textSecondary
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});