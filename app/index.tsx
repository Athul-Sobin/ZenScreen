import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useWellbeing } from '@/lib/wellbeing-context';

export default function IndexScreen() {
  const { settings, isLoading } = useWellbeing();
  const c = Colors.dark;

  useEffect(() => {
    if (!isLoading) {
      if (settings.onboardingComplete) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [isLoading, settings.onboardingComplete]);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ActivityIndicator size="large" color={c.tint} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
