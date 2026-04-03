import { useEffect } from 'react';
import { UsageModule } from '@/lib/UsageModule';

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useWellbeing } from '@/lib/wellbeing-context';
import ProgressRing from '@/components/ProgressRing';
import UsageCard from '@/components/UsageCard';
import UsageChart from '@/components/UsageChart';
import SummaryCard from '@/components/SummaryCard';
import DashboardSummaryCard from '@/components/DashboardSummaryCard';
import * as Haptics from 'expo-haptics';

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState<'screenTime' | 'sleep'>('screenTime');

  useEffect(() => {
    UsageModule.hello('Hello Android!', (response) => {
      console.log('ANDROID SAYS:', response);
    });
  }, []);
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const { apps, settings, totalScreenTime, totalOpens, totalNotifications, dailyBonusMinutes, weeklyAverages } = useWellbeing();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const dailyGoal = settings.dailyGoalMinutes + dailyBonusMinutes;
  const progress = Math.min(totalScreenTime / dailyGoal, 1);
  const remaining = Math.max(dailyGoal - totalScreenTime, 0);
  const overLimit = totalScreenTime > dailyGoal;

  const appsOverLimit = apps.filter(a => a.dailyLimit > 0 && a.usageMinutes > a.dailyLimit);
  const topApps = [...apps].sort((a, b) => b.usageMinutes - a.usageMinutes).slice(0, 5);

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Calculate dashboard summary metrics
  const avgSleepHours = weeklyAverages?.sleep
    ? weeklyAverages.sleep.reduce((sum, d) => sum + d.value, 0) / weeklyAverages.sleep.length / 60
    : 0;
  const totalScreenTimeMinutes = weeklyAverages?.screenTime
    ? weeklyAverages.screenTime.reduce((sum, d) => sum + d.value, 0)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 16, paddingBottom: 100 }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: c.textSecondary }]}>{dayName}</Text>
            <Text style={[styles.date, { color: c.text }]}>{dateStr}</Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/puzzle');
            }}
            style={({ pressed }) => [styles.puzzleBtn, { backgroundColor: c.accentLight, opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name="extension-puzzle" size={18} color={c.accent} />
          </Pressable>
        </View>

        <LinearGradient
          colors={overLimit ? ['#3a1a1a', c.surface] : ['#1a2a28', c.surface]}
          style={styles.mainCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.ringRow}>
            <ProgressRing
              progress={progress}
              size={140}
              strokeWidth={10}
              color={overLimit ? c.warning : c.tint}
            >
              <Text style={[styles.ringTime, { color: c.text }]}>{formatTime(totalScreenTime)}</Text>
              <Text style={[styles.ringLabel, { color: c.textSecondary }]}>today</Text>
            </ProgressRing>
            <View style={styles.ringStats}>
              <View style={styles.statItem}>
                <Ionicons name="apps-outline" size={16} color={c.tint} />
                <Text style={[styles.statValue, { color: c.text }]}>{totalOpens}</Text>
                <Text style={[styles.statLabel, { color: c.textMuted }]}>opens</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="notifications-outline" size={16} color={c.accent} />
                <Text style={[styles.statValue, { color: c.text }]}>{totalNotifications}</Text>
                <Text style={[styles.statLabel, { color: c.textMuted }]}>alerts</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={16} color={overLimit ? c.warning : c.success} />
                <Text style={[styles.statValue, { color: overLimit ? c.warning : c.text }]}>
                  {overLimit ? '+' + formatTime(totalScreenTime - dailyGoal) : formatTime(remaining)}
                </Text>
                <Text style={[styles.statLabel, { color: c.textMuted }]}>{overLimit ? 'over' : 'left'}</Text>
              </View>
            </View>
          </View>
          {dailyBonusMinutes > 0 && (
            <View style={[styles.bonusBadge, { backgroundColor: c.accentLight }]}>
              <Ionicons name="extension-puzzle" size={12} color={c.accent} />
              <Text style={[styles.bonusText, { color: c.accent }]}>+{dailyBonusMinutes}m bonus earned</Text>
            </View>
          )}
        </LinearGradient>

        {appsOverLimit.length > 0 && (
          <View style={[styles.alertCard, { backgroundColor: c.warningLight }]}>
            <Ionicons name="alert-circle" size={18} color={c.warning} />
            <Text style={[styles.alertText, { color: c.warning }]}>
              {appsOverLimit.length} app{appsOverLimit.length > 1 ? 's' : ''} over limit
            </Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Most Used</Text>
          <Text style={[styles.sectionSub, { color: c.textMuted }]}>{apps.length} apps tracked</Text>
        </View>

        {topApps.map(app => (
          <UsageCard
            key={app.id}
            app={app}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: '/usage/[appId]', params: { appId: app.id } });
            }}
          />
        ))}

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={({ pressed }) => [styles.viewAllBtn, { borderColor: c.border, opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.viewAllText, { color: c.textSecondary }]}>View All Apps</Text>
          <Feather name="chevron-right" size={16} color={c.textMuted} />
        </Pressable>

        {/* Weekly Overview Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Weekly Overview</Text>
          <Text style={[styles.sectionSub, { color: c.textMuted }]}>7-day trends</Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('screenTime');
            }}
            style={[
              styles.tab,
              activeTab === 'screenTime' && [styles.activeTab, { backgroundColor: c.tintLight }]
            ]}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={16}
              color={activeTab === 'screenTime' ? c.tint : c.textMuted}
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'screenTime' ? c.tint : c.textMuted }
            ]}>
              Screen Time
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('sleep');
            }}
            style={[
              styles.tab,
              activeTab === 'sleep' && [styles.activeTab, { backgroundColor: c.purpleLight }]
            ]}
          >
            <Ionicons
              name="moon-outline"
              size={16}
              color={activeTab === 'sleep' ? c.purple : c.textMuted}
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'sleep' ? c.purple : c.textMuted }
            ]}>
              Sleep
            </Text>
          </Pressable>
        </View>

        {/* Summary Cards */}
        <DashboardSummaryCard
          avgSleepHours={avgSleepHours}
          totalScreenTimeMinutes={totalScreenTimeMinutes}
        />

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('screenTime');
            }}
            style={[
              styles.tab,
              activeTab === 'screenTime' && [styles.activeTab, { backgroundColor: '#556B2F20' }]
            ]}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={16}
              color={activeTab === 'screenTime' ? '#556B2F' : c.textMuted}
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'screenTime' ? '#556B2F' : c.textMuted }
            ]}>
              Screen Time
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('sleep');
            }}
            style={[
              styles.tab,
              activeTab === 'sleep' && [styles.activeTab, { backgroundColor: '#E2725B20' }]
            ]}
          >
            <Ionicons
              name="moon-outline"
              size={16}
              color={activeTab === 'sleep' ? '#E2725B' : c.textMuted}
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'sleep' ? '#E2725B' : c.textMuted }
            ]}>
              Sleep
            </Text>
          </Pressable>
        </View>

        {/* Chart */}
        {weeklyAverages && (
          <View style={styles.chartContainer}>
            <UsageChart
              data={activeTab === 'screenTime' ? weeklyAverages.screenTime : weeklyAverages.sleep}
              title={`${activeTab === 'screenTime' ? 'Screen Time' : 'Sleep Duration'} (7 days)`}
              color={activeTab === 'screenTime' ? '#556B2F' : '#E2725B'}
            />
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Quick Actions</Text>
        </View>
        <View style={styles.quickActions}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/focus');
            }}
            style={({ pressed }) => [styles.quickAction, { backgroundColor: c.tintLight, opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name="leaf" size={24} color={c.tint} />
            <Text style={[styles.quickLabel, { color: c.tint }]}>Focus Mode</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/puzzle');
            }}
            style={({ pressed }) => [styles.quickAction, { backgroundColor: c.accentLight, opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name="extension-puzzle" size={24} color={c.accent} />
            <Text style={[styles.quickLabel, { color: c.accent }]}>Puzzles</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/sleep');
            }}
            style={({ pressed }) => [styles.quickAction, { backgroundColor: c.purpleLight, opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name="moon" size={24} color={c.purple} />
            <Text style={[styles.quickLabel, { color: c.purple }]}>Sleep</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 14, fontFamily: 'DMSans_400Regular' },
  date: { fontSize: 24, fontFamily: 'DMSans_700Bold', marginTop: 2 },
  puzzleBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  mainCard: { borderRadius: 20, padding: 24, marginBottom: 16 },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  ringTime: { fontSize: 24, fontFamily: 'DMSans_700Bold' },
  ringLabel: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  ringStats: { flex: 1, gap: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statValue: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
  statLabel: { fontSize: 12, fontFamily: 'DMSans_400Regular' },
  bonusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginTop: 14 },
  bonusText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, marginBottom: 16 },
  alertText: { fontSize: 14, fontFamily: 'DMSans_600SemiBold' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold' },
  sectionSub: { fontSize: 12, fontFamily: 'DMSans_400Regular' },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginTop: 4, gap: 4 },
  viewAllText: { fontSize: 14, fontFamily: 'DMSans_500Medium' },
  quickActions: { flexDirection: 'row', gap: 10 },
  quickAction: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20, borderRadius: 16, gap: 8 },
  quickLabel: { fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  tabContainer: { flexDirection: 'row', backgroundColor: c.surface, borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, gap: 6 },
  activeTab: { shadowColor: c.tint, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  summaryCardsContainer: { paddingHorizontal: 4, gap: 12 },
  chartContainer: { backgroundColor: c.surface, borderRadius: 16, padding: 16, marginBottom: 16 },
});
