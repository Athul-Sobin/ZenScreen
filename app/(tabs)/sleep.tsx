import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useWellbeing } from '@/lib/wellbeing-context';

export default function SleepScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const { sleepRecords } = useWellbeing();

  const avgSleep = useMemo(() => {
    if (sleepRecords.length === 0) return 0;
    return sleepRecords.reduce((sum, r) => sum + r.durationHours, 0) / sleepRecords.length;
  }, [sleepRecords]);

  const maxHours = useMemo(() => Math.max(...sleepRecords.map(r => r.durationHours), 10), [sleepRecords]);
  const lastNight = sleepRecords.length > 0 ? sleepRecords[sleepRecords.length - 1] : null;

  const qualityColor = (q: string) => {
    switch (q) {
      case 'excellent': return c.success;
      case 'good': return c.tint;
      case 'fair': return c.accent;
      case 'poor': return c.warning;
      default: return c.textMuted;
    }
  };

  const sleepScore = useMemo(() => {
    if (!lastNight) return 0;
    const ideal = 8;
    const diff = Math.abs(lastNight.durationHours - ideal);
    return Math.max(0, Math.round(100 - diff * 15));
  }, [lastNight]);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 16, paddingBottom: 100 }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={[styles.title, { color: c.text }]}>Sleep</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>Track your rest patterns</Text>

        <LinearGradient
          colors={['#1a1a2e', c.surface]}
          style={styles.mainCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.mainCardHeader}>
            <View style={[styles.moonIcon, { backgroundColor: c.purpleLight }]}>
              <Ionicons name="moon" size={24} color={c.purple} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.lastNightLabel, { color: c.textMuted }]}>Last Night</Text>
              <Text style={[styles.lastNightTime, { color: c.text }]}>
                {lastNight ? `${lastNight.durationHours}h` : '--'}
              </Text>
            </View>
            <View style={styles.scoreContainer}>
              <Text style={[styles.scoreValue, { color: sleepScore >= 70 ? c.success : sleepScore >= 50 ? c.accent : c.warning }]}>
                {sleepScore}
              </Text>
              <Text style={[styles.scoreLabel, { color: c.textMuted }]}>score</Text>
            </View>
          </View>

          {lastNight && (
            <View style={styles.timeRow}>
              <View style={styles.timeItem}>
                <Ionicons name="bed-outline" size={16} color={c.purple} />
                <Text style={[styles.timeValue, { color: c.textSecondary }]}>{lastNight.bedtime}</Text>
                <Text style={[styles.timeLabel, { color: c.textMuted }]}>Bedtime</Text>
              </View>
              <View style={[styles.timeDivider, { backgroundColor: c.border }]} />
              <View style={styles.timeItem}>
                <Ionicons name="sunny-outline" size={16} color={c.accent} />
                <Text style={[styles.timeValue, { color: c.textSecondary }]}>{lastNight.wakeTime}</Text>
                <Text style={[styles.timeLabel, { color: c.textMuted }]}>Wake Up</Text>
              </View>
              <View style={[styles.timeDivider, { backgroundColor: c.border }]} />
              <View style={styles.timeItem}>
                <Ionicons name="pulse-outline" size={16} color={qualityColor(lastNight.quality)} />
                <Text style={[styles.timeValue, { color: qualityColor(lastNight.quality) }]}>
                  {lastNight.quality.charAt(0).toUpperCase() + lastNight.quality.slice(1)}
                </Text>
                <Text style={[styles.timeLabel, { color: c.textMuted }]}>Quality</Text>
              </View>
            </View>
          )}
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>This Week</Text>
          <Text style={[styles.avgText, { color: c.textMuted }]}>
            Avg: {avgSleep.toFixed(1)}h
          </Text>
        </View>

        <View style={[styles.chartContainer, { backgroundColor: c.surface }]}>
          <View style={styles.chart}>
            {sleepRecords.map((record, i) => {
              const barHeight = (record.durationHours / maxHours) * 120;
              const isToday = i === sleepRecords.length - 1;
              return (
                <View key={record.id} style={styles.chartBar}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: isToday ? c.purple : c.purple + '40',
                          borderRadius: 6,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: isToday ? c.text : c.textMuted }]}>{record.date}</Text>
                  <Text style={[styles.barValue, { color: c.textMuted }]}>{record.durationHours}h</Text>
                </View>
              );
            })}
          </View>
          <View style={[styles.goalLine, { borderColor: c.tint + '40' }]}>
            <Text style={[styles.goalText, { color: c.tint }]}>8h goal</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Sleep Tips</Text>
        </View>

        {[
          { icon: 'phone-portrait-outline' as const, title: 'Screen Curfew', desc: 'Put your phone away 30 minutes before bed' },
          { icon: 'water-outline' as const, title: 'Blue Light', desc: 'Reduce screen brightness in the evening' },
          { icon: 'time-outline' as const, title: 'Consistency', desc: 'Go to bed and wake up at the same time daily' },
        ].map((tip, i) => (
          <View key={i} style={[styles.tipCard, { backgroundColor: c.surface }]}>
            <View style={[styles.tipIcon, { backgroundColor: c.purpleLight }]}>
              <Ionicons name={tip.icon} size={18} color={c.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.tipTitle, { color: c.text }]}>{tip.title}</Text>
              <Text style={[styles.tipDesc, { color: c.textMuted }]}>{tip.desc}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  title: { fontSize: 24, fontFamily: 'DMSans_700Bold' },
  subtitle: { fontSize: 14, fontFamily: 'DMSans_400Regular', marginTop: 4, marginBottom: 20 },
  mainCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  mainCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  moonIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  lastNightLabel: { fontSize: 12, fontFamily: 'DMSans_400Regular' },
  lastNightTime: { fontSize: 28, fontFamily: 'DMSans_700Bold', marginTop: 2 },
  scoreContainer: { alignItems: 'center' },
  scoreValue: { fontSize: 28, fontFamily: 'DMSans_700Bold' },
  scoreLabel: { fontSize: 11, fontFamily: 'DMSans_400Regular' },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  timeItem: { flex: 1, alignItems: 'center', gap: 4 },
  timeDivider: { width: 1, height: 32 },
  timeValue: { fontSize: 14, fontFamily: 'DMSans_600SemiBold' },
  timeLabel: { fontSize: 11, fontFamily: 'DMSans_400Regular' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
  avgText: { fontSize: 13, fontFamily: 'DMSans_500Medium' },
  chartContainer: { borderRadius: 16, padding: 20, marginBottom: 8, position: 'relative' },
  chart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 160 },
  chartBar: { alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  barWrapper: { height: 120, justifyContent: 'flex-end' },
  bar: { width: 24, minHeight: 4 },
  barLabel: { fontSize: 11, fontFamily: 'DMSans_500Medium', marginTop: 6 },
  barValue: { fontSize: 10, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  goalLine: { position: 'absolute', right: 20, top: 20 + (120 - (8 / 10 * 120)), borderTopWidth: 1, borderStyle: 'dashed', paddingTop: 2 },
  goalText: { fontSize: 10, fontFamily: 'DMSans_500Medium' },
  tipCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, gap: 12 },
  tipIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tipTitle: { fontSize: 14, fontFamily: 'DMSans_600SemiBold' },
  tipDesc: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 2 },
});
