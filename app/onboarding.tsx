import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Platform, FlatList } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useWellbeing } from '@/lib/wellbeing-context';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'shield-checkmark-outline' as const,
    iconFamily: 'Ionicons',
    title: 'Take Control',
    subtitle: 'Track your screen time and understand your digital habits. Zenscreen helps you find balance.',
    gradient: ['#1a3a2a', '#0F1419'] as const,
  },
  {
    icon: 'timer-outline' as const,
    iconFamily: 'Ionicons',
    title: 'Set Boundaries',
    subtitle: 'Create daily time limits for apps. Get gentle reminders when you\'re spending too much time.',
    gradient: ['#1a2a3a', '#0F1419'] as const,
  },
  {
    icon: 'leaf-outline' as const,
    iconFamily: 'Ionicons',
    title: 'Focus Mode',
    subtitle: 'Block distracting apps and enter a calm, focused state. Reduce visual stimulation with grayscale.',
    gradient: ['#2a1a3a', '#0F1419'] as const,
  },
  {
    icon: 'puzzle-outline' as const,
    iconFamily: 'Ionicons',
    title: 'Earn Extra Time',
    subtitle: 'Solve puzzles to unlock up to 15 bonus minutes per day. A mindful way to extend your limits.',
    gradient: ['#3a2a1a', '#0F1419'] as const,
  },
];

function SlideItem({ item, index }: { item: typeof SLIDES[0]; index: number }) {
  const c = Colors.dark;
  return (
    <View style={[styles.slide, { width }]}>
      <LinearGradient colors={[...item.gradient]} style={styles.slideGradient}>
        <View style={[styles.iconCircle, { backgroundColor: c.tintLight }]}>
          <Ionicons name={item.icon} size={48} color={c.tint} />
        </View>
        <Text style={[styles.slideTitle, { color: c.text }]}>{item.title}</Text>
        <Text style={[styles.slideSubtitle, { color: c.textSecondary }]}>{item.subtitle}</Text>
      </LinearGradient>
    </View>
  );
}

export default function OnboardingScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { updateSettings } = useWellbeing();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateSettings({ onboardingComplete: true });
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Pressable
        onPress={handleComplete}
        style={[styles.skipBtn, { top: topInset + 8 }]}
      >
        <Text style={[styles.skipText, { color: c.textSecondary }]}>Skip</Text>
      </Pressable>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(idx);
        }}
        renderItem={({ item, index }) => <SlideItem item={item} index={index} />}
        keyExtractor={(_, i) => i.toString()}
      />

      <View style={[styles.bottom, { paddingBottom: bottomInset + 20 }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === currentIndex ? c.tint : c.border },
                i === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.nextBtn,
            { backgroundColor: c.tint, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          <Text style={styles.nextText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          {currentIndex < SLIDES.length - 1 && (
            <Ionicons name="arrow-forward" size={18} color="#0F1419" style={{ marginLeft: 6 }} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  slide: {
    flex: 1,
  },
  slideGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  slideTitle: {
    fontSize: 28,
    fontFamily: 'DMSans_700Bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  slideSubtitle: {
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottom: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
  },
  nextText: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: '#0F1419',
  },
});
