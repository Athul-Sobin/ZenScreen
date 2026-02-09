import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Switch } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useWellbeing } from '@/lib/wellbeing-context';
import * as Haptics from 'expo-haptics';
import * as Crypto from 'expo-crypto';

type FocusState = 'idle' | 'active' | 'completed';

export default function FocusScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const { apps, saveFocusSession } = useWellbeing();

  const [focusState, setFocusState] = useState<FocusState>('idle');
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [grayscaleEnabled, setGrayscaleEnabled] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [focusDuration, setFocusDuration] = useState(25);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const socialApps = apps.filter(a => a.category === 'Social' || a.isShortForm);
  const otherApps = apps.filter(a => a.category !== 'Social' && !a.isShortForm);

  useEffect(() => {
    if (focusState === 'active') {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const diff = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(diff);
        if (diff >= focusDuration * 60) {
          handleComplete();
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [focusState]);

  const toggleApp = (appId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedApps(prev =>
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFocusState('active');
    setElapsed(0);
  };

  const handleComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setFocusState('completed');
    const session = {
      id: Crypto.randomUUID(),
      startTime: startTimeRef.current,
      endTime: Date.now(),
      duration: elapsed,
      blockedApps: selectedApps,
      grayscaleEnabled,
      completed: true,
    };
    await saveFocusSession(session);
  };

  const handleStop = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setFocusState('idle');
    setElapsed(0);
    const session = {
      id: Crypto.randomUUID(),
      startTime: startTimeRef.current,
      endTime: Date.now(),
      duration: elapsed,
      blockedApps: selectedApps,
      grayscaleEnabled,
      completed: false,
    };
    await saveFocusSession(session);
  };

  const handleReset = () => {
    setFocusState('idle');
    setElapsed(0);
  };

  const formatElapsed = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = elapsed / (focusDuration * 60);
  const durations = [15, 25, 45, 60];

  if (focusState === 'active') {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <LinearGradient colors={['#0a1f18', c.background]} style={[styles.activeContainer, { paddingTop: topInset + 40 }]}>
          <View style={styles.activeTop}>
            <View style={[styles.breatheCircle, { borderColor: c.tint + '30' }]}>
              <View style={[styles.breatheInner, { borderColor: c.tint + '60' }]}>
                <Text style={[styles.timerText, { color: c.tint }]}>{formatElapsed(elapsed)}</Text>
                <Text style={[styles.timerSub, { color: c.textSecondary }]}>
                  of {focusDuration}m
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.progressBarContainer, { backgroundColor: c.border }]}>
            <View style={[styles.progressBarFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: c.tint }]} />
          </View>
          <View style={styles.activeInfo}>
            {grayscaleEnabled && (
              <View style={[styles.modeBadge, { backgroundColor: c.surfaceElevated }]}>
                <Ionicons name="contrast-outline" size={14} color={c.textSecondary} />
                <Text style={[styles.modeText, { color: c.textSecondary }]}>Grayscale Active</Text>
              </View>
            )}
            <Text style={[styles.blockCount, { color: c.textMuted }]}>
              {selectedApps.length} app{selectedApps.length !== 1 ? 's' : ''} blocked
            </Text>
          </View>
          <Pressable
            onPress={handleStop}
            style={({ pressed }) => [styles.stopBtn, { backgroundColor: c.dangerLight, opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name="stop" size={20} color={c.danger} />
            <Text style={[styles.stopText, { color: c.danger }]}>End Session</Text>
          </Pressable>
        </LinearGradient>
      </View>
    );
  }

  if (focusState === 'completed') {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.completedContainer, { paddingTop: topInset + 60 }]}>
          <View style={[styles.completedIcon, { backgroundColor: c.successLight }]}>
            <Ionicons name="checkmark-circle" size={48} color={c.success} />
          </View>
          <Text style={[styles.completedTitle, { color: c.text }]}>Well Done</Text>
          <Text style={[styles.completedSub, { color: c.textSecondary }]}>
            You stayed focused for {formatElapsed(elapsed)}
          </Text>
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [styles.resetBtn, { backgroundColor: c.tint, opacity: pressed ? 0.9 : 1 }]}
          >
            <Text style={styles.resetText}>Start New Session</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 16, paddingBottom: 100 }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={[styles.title, { color: c.text }]}>Focus Mode</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>Block distracting apps and stay present</Text>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Duration</Text>
        </View>
        <View style={styles.durationRow}>
          {durations.map(d => (
            <Pressable
              key={d}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFocusDuration(d);
              }}
              style={[
                styles.durationBtn,
                { backgroundColor: d === focusDuration ? c.tint : c.surface, borderColor: d === focusDuration ? c.tint : c.border },
              ]}
            >
              <Text style={[styles.durationText, { color: d === focusDuration ? '#0F1419' : c.textSecondary }]}>
                {d}m
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.grayscaleCard, { backgroundColor: c.surface }]}>
          <View style={styles.grayscaleInfo}>
            <Ionicons name="contrast-outline" size={20} color={c.textSecondary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.grayscaleTitle, { color: c.text }]}>Grayscale Mode</Text>
              <Text style={[styles.grayscaleSub, { color: c.textMuted }]}>Reduce visual stimulation</Text>
            </View>
          </View>
          <Switch
            value={grayscaleEnabled}
            onValueChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setGrayscaleEnabled(v);
            }}
            trackColor={{ false: c.border, true: c.tintDark }}
            thumbColor={grayscaleEnabled ? c.tint : c.textMuted}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Block Apps</Text>
          <Pressable onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (selectedApps.length === apps.length) setSelectedApps([]);
            else setSelectedApps(apps.map(a => a.id));
          }}>
            <Text style={[styles.selectAll, { color: c.tint }]}>
              {selectedApps.length === apps.length ? 'Deselect All' : 'Select All'}
            </Text>
          </Pressable>
        </View>

        {socialApps.length > 0 && (
          <>
            <Text style={[styles.categoryLabel, { color: c.textMuted }]}>Social & Short-form</Text>
            <View style={styles.appGrid}>
              {socialApps.map(app => (
                <Pressable
                  key={app.id}
                  onPress={() => toggleApp(app.id)}
                  style={[
                    styles.appChip,
                    {
                      backgroundColor: selectedApps.includes(app.id) ? c.tintLight : c.surface,
                      borderColor: selectedApps.includes(app.id) ? c.tint + '50' : c.border,
                    },
                  ]}
                >
                  <Ionicons name={app.icon as any} size={18} color={selectedApps.includes(app.id) ? c.tint : app.color} />
                  <Text style={[styles.appChipText, { color: selectedApps.includes(app.id) ? c.tint : c.textSecondary }]} numberOfLines={1}>
                    {app.name}
                  </Text>
                  {selectedApps.includes(app.id) && (
                    <Ionicons name="checkmark-circle" size={14} color={c.tint} />
                  )}
                </Pressable>
              ))}
            </View>
          </>
        )}

        {otherApps.length > 0 && (
          <>
            <Text style={[styles.categoryLabel, { color: c.textMuted }]}>Other Apps</Text>
            <View style={styles.appGrid}>
              {otherApps.map(app => (
                <Pressable
                  key={app.id}
                  onPress={() => toggleApp(app.id)}
                  style={[
                    styles.appChip,
                    {
                      backgroundColor: selectedApps.includes(app.id) ? c.tintLight : c.surface,
                      borderColor: selectedApps.includes(app.id) ? c.tint + '50' : c.border,
                    },
                  ]}
                >
                  <Ionicons name={app.icon as any} size={18} color={selectedApps.includes(app.id) ? c.tint : app.color} />
                  <Text style={[styles.appChipText, { color: selectedApps.includes(app.id) ? c.tint : c.textSecondary }]} numberOfLines={1}>
                    {app.name}
                  </Text>
                  {selectedApps.includes(app.id) && (
                    <Ionicons name="checkmark-circle" size={14} color={c.tint} />
                  )}
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Pressable
          onPress={handleStart}
          disabled={selectedApps.length === 0}
          style={({ pressed }) => [
            styles.startBtn,
            {
              backgroundColor: selectedApps.length > 0 ? c.tint : c.border,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Ionicons name="leaf" size={20} color={selectedApps.length > 0 ? '#0F1419' : c.textMuted} />
          <Text style={[styles.startText, { color: selectedApps.length > 0 ? '#0F1419' : c.textMuted }]}>
            Start Focus ({focusDuration}m)
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  title: { fontSize: 24, fontFamily: 'DMSans_700Bold' },
  subtitle: { fontSize: 14, fontFamily: 'DMSans_400Regular', marginTop: 4, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
  selectAll: { fontSize: 13, fontFamily: 'DMSans_600SemiBold' },
  durationRow: { flexDirection: 'row', gap: 10 },
  durationBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  durationText: { fontSize: 15, fontFamily: 'DMSans_700Bold' },
  grayscaleCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 14, marginTop: 16 },
  grayscaleInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  grayscaleTitle: { fontSize: 15, fontFamily: 'DMSans_600SemiBold' },
  grayscaleSub: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  categoryLabel: { fontSize: 12, fontFamily: 'DMSans_500Medium', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  appGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  appChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  appChipText: { fontSize: 13, fontFamily: 'DMSans_500Medium' },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, marginTop: 24 },
  startText: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
  activeContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  activeTop: { alignItems: 'center', marginBottom: 32 },
  breatheCircle: { width: 220, height: 220, borderRadius: 110, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  breatheInner: { width: 180, height: 180, borderRadius: 90, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  timerText: { fontSize: 42, fontFamily: 'DMSans_700Bold' },
  timerSub: { fontSize: 14, fontFamily: 'DMSans_400Regular', marginTop: 4 },
  progressBarContainer: { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 24 },
  progressBarFill: { height: '100%', borderRadius: 2 },
  activeInfo: { alignItems: 'center', gap: 8, marginBottom: 40 },
  modeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  modeText: { fontSize: 12, fontFamily: 'DMSans_500Medium' },
  blockCount: { fontSize: 13, fontFamily: 'DMSans_400Regular' },
  stopBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14 },
  stopText: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
  completedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  completedIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  completedTitle: { fontSize: 28, fontFamily: 'DMSans_700Bold', marginBottom: 8 },
  completedSub: { fontSize: 16, fontFamily: 'DMSans_400Regular', textAlign: 'center', marginBottom: 40 },
  resetBtn: { paddingVertical: 16, paddingHorizontal: 40, borderRadius: 14 },
  resetText: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: '#0F1419' },
});
