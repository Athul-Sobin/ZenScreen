import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useWellbeing } from '@/lib/wellbeing-context';
import { PuzzleData } from '@/lib/types';
import { getPuzzlesForTier } from '@/lib/data';
import { getUsedPuzzleIds, saveUsedPuzzleIds } from '@/lib/storage';
import * as Haptics from 'expo-haptics';

type GameState = 'menu' | 'playing' | 'result' | 'complete';

export default function PuzzleScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const { puzzleExtensions, updatePuzzleExtensions, dailyBonusMinutes, updateDailyBonus } = useWellbeing();

  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentTier, setCurrentTier] = useState<1 | 2 | 3>(1);
  const [puzzles, setPuzzles] = useState<PuzzleData[]>([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [solvedCount, setSolvedCount] = useState(0);
  const [usedIds, setUsedIds] = useState<string[]>([]);

  useEffect(() => {
    getUsedPuzzleIds().then(setUsedIds);
  }, []);

  const nextAvailableTier = puzzleExtensions.find(e => !e.completed)?.tier || null;
  const totalBonusAvailable = 15;
  const totalEarned = dailyBonusMinutes;

  const startTier = useCallback(async (tier: 1 | 2 | 3) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const tierPuzzles = getPuzzlesForTier(tier, usedIds);
    setPuzzles(tierPuzzles);
    setCurrentTier(tier);
    setCurrentPuzzleIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setSolvedCount(0);
    setGameState('playing');
  }, [usedIds]);

  const handleAnswer = useCallback(async (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex);
    const puzzle = puzzles[currentPuzzleIndex];
    const correct = answerIndex === puzzle.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const newSolved = solvedCount + 1;
      setSolvedCount(newSolved);
      const newUsedIds = [...usedIds, puzzle.id];
      setUsedIds(newUsedIds);
      await saveUsedPuzzleIds(newUsedIds);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTimeout(() => {
      if (currentPuzzleIndex < puzzles.length - 1) {
        setCurrentPuzzleIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        handleTierComplete(correct ? solvedCount + 1 : solvedCount);
      }
    }, 1800);
  }, [selectedAnswer, puzzles, currentPuzzleIndex, solvedCount, usedIds]);

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setGameState('result');
  }, [currentTier, puzzleExtensions, dailyBonusMinutes, updatePuzzleExtensions, updateDailyBonus]);

  const currentPuzzle = puzzles[currentPuzzleIndex];
  const currentExt = puzzleExtensions.find(e => e.tier === currentTier);
  const tierSuccess = currentExt ? solvedCount >= currentExt.puzzlesRequired || (gameState === 'result' && currentExt.completed) : false;

  if (gameState === 'playing' && currentPuzzle) {
    const typeIcon = currentPuzzle.type === 'knowledge' ? 'bulb-outline' : currentPuzzle.type === 'logic' ? 'git-branch-outline' : 'text-outline';
    const typeLabel = currentPuzzle.type === 'knowledge' ? 'Knowledge' : currentPuzzle.type === 'logic' ? 'Logic' : 'Word';

    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.playHeader, { paddingTop: topInset + 8 }]}>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGameState('menu'); }}>
            <Ionicons name="close" size={24} color={c.textSecondary} />
          </Pressable>
          <View style={styles.progressDots}>
            {puzzles.map((_, i) => (
              <View key={i} style={[styles.progressDot, { backgroundColor: i < currentPuzzleIndex ? c.tint : i === currentPuzzleIndex ? c.accent : c.border }]} />
            ))}
          </View>
          <View style={[styles.tierBadge, { backgroundColor: c.accentLight }]}>
            <Text style={[styles.tierBadgeText, { color: c.accent }]}>Tier {currentTier}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={[styles.playContent, { paddingBottom: bottomInset + 20 }]} showsVerticalScrollIndicator={false}>
          <View style={[styles.typeBadge, { backgroundColor: c.surfaceElevated }]}>
            <Ionicons name={typeIcon as any} size={14} color={c.textSecondary} />
            <Text style={[styles.typeText, { color: c.textSecondary }]}>{typeLabel}</Text>
          </View>

          <Text style={[styles.questionText, { color: c.text }]}>{currentPuzzle.question}</Text>

          <View style={styles.optionsContainer}>
            {currentPuzzle.options.map((option, i) => {
              let bg = c.surface;
              let border = c.border;
              let textColor = c.text;

              if (selectedAnswer !== null) {
                if (i === currentPuzzle.correctAnswer) {
                  bg = c.successLight;
                  border = c.success;
                  textColor = c.success;
                } else if (i === selectedAnswer && !isCorrect) {
                  bg = c.dangerLight;
                  border = c.danger;
                  textColor = c.danger;
                }
              }

              return (
                <Pressable
                  key={i}
                  onPress={() => handleAnswer(i)}
                  disabled={selectedAnswer !== null}
                  style={({ pressed }) => [
                    styles.optionBtn,
                    {
                      backgroundColor: bg,
                      borderColor: border,
                      opacity: pressed ? 0.8 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                >
                  <View style={[styles.optionLetter, { backgroundColor: selectedAnswer !== null && i === currentPuzzle.correctAnswer ? c.success + '30' : c.surfaceElevated }]}>
                    <Text style={[styles.optionLetterText, { color: selectedAnswer !== null && i === currentPuzzle.correctAnswer ? c.success : c.textSecondary }]}>
                      {String.fromCharCode(65 + i)}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
                  {selectedAnswer !== null && i === currentPuzzle.correctAnswer && (
                    <Ionicons name="checkmark-circle" size={20} color={c.success} />
                  )}
                  {selectedAnswer !== null && i === selectedAnswer && !isCorrect && (
                    <Ionicons name="close-circle" size={20} color={c.danger} />
                  )}
                </Pressable>
              );
            })}
          </View>

          {selectedAnswer !== null && (
            <Animated.View entering={FadeInDown.duration(300)} style={[styles.explanationCard, { backgroundColor: c.surfaceElevated }]}>
              <Ionicons name="information-circle-outline" size={18} color={c.tint} />
              <Text style={[styles.explanationText, { color: c.textSecondary }]}>{currentPuzzle.explanation}</Text>
            </Animated.View>
          )}
        </ScrollView>
      </View>
    );
  }

  if (gameState === 'result') {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.resultContainer, { paddingTop: topInset + 60, paddingBottom: bottomInset + 20 }]}>
          <View style={[styles.resultIcon, { backgroundColor: tierSuccess ? c.successLight : c.warningLight }]}>
            <Ionicons name={tierSuccess ? 'trophy' : 'refresh'} size={48} color={tierSuccess ? c.success : c.warning} />
          </View>
          <Text style={[styles.resultTitle, { color: c.text }]}>
            {tierSuccess ? 'Bonus Earned' : 'Not Quite'}
          </Text>
          <Text style={[styles.resultSub, { color: c.textSecondary }]}>
            {tierSuccess
              ? `You earned +${currentExt?.minutesEarned || 5} minutes of screen time!`
              : 'You didn\'t solve enough puzzles. Try again tomorrow!'}
          </Text>
          {tierSuccess && (
            <View style={[styles.bonusEarned, { backgroundColor: c.accentLight }]}>
              <Ionicons name="time" size={20} color={c.accent} />
              <Text style={[styles.bonusEarnedText, { color: c.accent }]}>+{currentExt?.minutesEarned || 5} minutes</Text>
            </View>
          )}
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGameState('menu'); }}
            style={({ pressed }) => [styles.backToMenuBtn, { backgroundColor: c.tint, opacity: pressed ? 0.9 : 1 }]}
          >
            <Text style={styles.backToMenuText}>Back to Menu</Text>
          </Pressable>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.dismissText, { color: c.textMuted }]}>Close</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={[styles.menuContent, { paddingTop: topInset + 8, paddingBottom: bottomInset + 20 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.menuHeader}>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}>
            <Ionicons name="arrow-back" size={24} color={c.text} />
          </Pressable>
        </View>

        <View style={styles.menuHero}>
          <View style={[styles.heroIcon, { backgroundColor: c.accentLight }]}>
            <Ionicons name="extension-puzzle" size={36} color={c.accent} />
          </View>
          <Text style={[styles.heroTitle, { color: c.text }]}>Puzzle Challenge</Text>
          <Text style={[styles.heroSub, { color: c.textSecondary }]}>
            Solve puzzles to earn up to {totalBonusAvailable} extra minutes today
          </Text>
        </View>

        <LinearGradient colors={['#2a1f0a', c.surface]} style={styles.bonusCard}>
          <View style={styles.bonusRow}>
            <Ionicons name="time" size={20} color={c.accent} />
            <Text style={[styles.bonusLabel, { color: c.text }]}>Bonus Earned Today</Text>
          </View>
          <Text style={[styles.bonusAmount, { color: c.accent }]}>{totalEarned} / {totalBonusAvailable} min</Text>
          <View style={[styles.bonusBar, { backgroundColor: c.border }]}>
            <View style={[styles.bonusFill, { width: `${(totalEarned / totalBonusAvailable) * 100}%`, backgroundColor: c.accent }]} />
          </View>
        </LinearGradient>

        {puzzleExtensions.map((ext, i) => {
          const isAvailable = i === 0 || puzzleExtensions[i - 1].completed;
          const locked = !isAvailable && !ext.completed;
          const diffLabel = ext.tier === 1 ? 'Easy' : ext.tier === 2 ? 'Hard' : 'Mixed';
          const diffColor = ext.tier === 1 ? c.success : ext.tier === 2 ? c.danger : c.accent;

          return (
            <Pressable
              key={ext.tier}
              onPress={() => !ext.completed && isAvailable && startTier(ext.tier)}
              disabled={ext.completed || locked}
              style={({ pressed }) => [
                styles.tierCard,
                {
                  backgroundColor: ext.completed ? c.successLight : locked ? c.surface + '60' : c.surface,
                  borderColor: ext.completed ? c.success + '30' : c.border,
                  opacity: pressed ? 0.8 : locked ? 0.5 : 1,
                },
              ]}
            >
              <View style={styles.tierCardTop}>
                <View style={[styles.tierNumber, { backgroundColor: ext.completed ? c.success + '20' : locked ? c.border : diffColor + '20' }]}>
                  {ext.completed ? (
                    <Ionicons name="checkmark" size={20} color={c.success} />
                  ) : locked ? (
                    <Ionicons name="lock-closed" size={18} color={c.textMuted} />
                  ) : (
                    <Text style={[styles.tierNumberText, { color: diffColor }]}>{ext.tier}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tierTitle, { color: ext.completed ? c.success : locked ? c.textMuted : c.text }]}>
                    Tier {ext.tier}
                  </Text>
                  <Text style={[styles.tierDesc, { color: c.textMuted }]}>
                    Solve {ext.puzzlesRequired} puzzle{ext.puzzlesRequired > 1 ? 's' : ''} for +{ext.minutesEarned}m
                  </Text>
                </View>
                <View style={[styles.diffBadge, { backgroundColor: diffColor + '20' }]}>
                  <Text style={[styles.diffText, { color: diffColor }]}>{diffLabel}</Text>
                </View>
              </View>
              {ext.completed && (
                <Text style={[styles.completedLabel, { color: c.success }]}>Completed - +{ext.minutesEarned}m earned</Text>
              )}
            </Pressable>
          );
        })}

        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: c.textSecondary }]}>How It Works</Text>
          {[
            { icon: 'star-outline' as const, text: 'Tier 1: Solve 1 easy puzzle for +5 minutes' },
            { icon: 'flame-outline' as const, text: 'Tier 2: Solve 2 harder puzzles for +5 minutes' },
            { icon: 'diamond-outline' as const, text: 'Tier 3: Solve 3 mixed puzzles for +5 minutes' },
            { icon: 'refresh-outline' as const, text: 'Puzzles reset daily at midnight' },
          ].map((item, i) => (
            <View key={i} style={styles.infoRow}>
              <Ionicons name={item.icon} size={16} color={c.textMuted} />
              <Text style={[styles.infoText, { color: c.textMuted }]}>{item.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  menuContent: { paddingHorizontal: 20 },
  menuHeader: { flexDirection: 'row', marginBottom: 20 },
  menuHero: { alignItems: 'center', marginBottom: 24 },
  heroIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 24, fontFamily: 'DMSans_700Bold', marginBottom: 8 },
  heroSub: { fontSize: 14, fontFamily: 'DMSans_400Regular', textAlign: 'center', lineHeight: 20 },
  bonusCard: { borderRadius: 16, padding: 18, marginBottom: 20 },
  bonusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  bonusLabel: { fontSize: 14, fontFamily: 'DMSans_600SemiBold' },
  bonusAmount: { fontSize: 20, fontFamily: 'DMSans_700Bold', marginBottom: 10 },
  bonusBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  bonusFill: { height: '100%', borderRadius: 3 },
  tierCard: { borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1 },
  tierCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tierNumber: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tierNumberText: { fontSize: 18, fontFamily: 'DMSans_700Bold' },
  tierTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
  tierDesc: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  diffText: { fontSize: 11, fontFamily: 'DMSans_600SemiBold' },
  completedLabel: { fontSize: 12, fontFamily: 'DMSans_500Medium', marginTop: 10 },
  infoSection: { marginTop: 24, gap: 10 },
  infoTitle: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontSize: 13, fontFamily: 'DMSans_400Regular' },
  playHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12, paddingBottom: 12 },
  progressDots: { flex: 1, flexDirection: 'row', gap: 6, justifyContent: 'center' },
  progressDot: { width: 28, height: 4, borderRadius: 2 },
  tierBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tierBadgeText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  playContent: { paddingHorizontal: 24 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 20 },
  typeText: { fontSize: 12, fontFamily: 'DMSans_500Medium' },
  questionText: { fontSize: 22, fontFamily: 'DMSans_700Bold', lineHeight: 32, marginBottom: 28 },
  optionsContainer: { gap: 10 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1, gap: 12 },
  optionLetter: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { fontSize: 14, fontFamily: 'DMSans_700Bold' },
  optionText: { flex: 1, fontSize: 15, fontFamily: 'DMSans_500Medium' },
  explanationCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, marginTop: 20 },
  explanationText: { flex: 1, fontSize: 13, fontFamily: 'DMSans_400Regular', lineHeight: 20 },
  resultContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  resultIcon: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  resultTitle: { fontSize: 28, fontFamily: 'DMSans_700Bold' },
  resultSub: { fontSize: 15, fontFamily: 'DMSans_400Regular', textAlign: 'center', lineHeight: 22 },
  bonusEarned: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginTop: 12 },
  bonusEarnedText: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
  backToMenuBtn: { paddingVertical: 16, paddingHorizontal: 40, borderRadius: 14, marginTop: 24 },
  backToMenuText: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: '#0F1419' },
  dismissText: { fontSize: 14, fontFamily: 'DMSans_500Medium', marginTop: 16 },
});
