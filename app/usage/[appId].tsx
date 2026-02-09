import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, TextInput, Alert } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useWellbeing } from '@/lib/wellbeing-context';
import ProgressRing from '@/components/ProgressRing';
import * as Haptics from 'expo-haptics';

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function AppUsageDetailScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const { appId } = useLocalSearchParams<{ appId: string }>();
  const { apps, settings, updateApp } = useWellbeing();

  const app = apps.find(a => a.id === appId);
  const [editingLimit, setEditingLimit] = useState(false);
  const [limitDraft, setLimitDraft] = useState(app?.dailyLimit?.toString() || '0');
  const [showWarning, setShowWarning] = useState(false);

  if (!app) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.emptyContainer, { paddingTop: topInset + 60 }]}>
          <Ionicons name="alert-circle-outline" size={48} color={c.textMuted} />
          <Text style={[styles.emptyText, { color: c.textSecondary }]}>App not found</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.backLink, { color: c.tint }]}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const overLimit = app.dailyLimit > 0 && app.usageMinutes > app.dailyLimit;
  const progress = app.dailyLimit > 0 ? Math.min(app.usageMinutes / app.dailyLimit, 1) : 0;
  const weeklyData = Array.from({ length: 7 }, (_, i) => ({
    day: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][i],
    minutes: Math.floor(app.usageMinutes * (0.5 + Math.random())),
  }));

  const handleSaveLimit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const mins = parseInt(limitDraft, 10);
    if (!isNaN(mins) && mins >= 0) {
      await updateApp(app.id, { dailyLimit: mins });
    }
    setEditingLimit(false);
  };

  const handleToggleBlock = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateApp(app.id, { isBlocked: !app.isBlocked });
  };

  const maxWeekly = Math.max(...weeklyData.map(d => d.minutes));

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 8, paddingBottom: 40 }]}
      >
        <View style={styles.navRow}>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}>
            <Ionicons name="arrow-back" size={24} color={c.text} />
          </Pressable>
        </View>

        <LinearGradient
          colors={[app.color + '30', c.surface]}
          style={styles.headerCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerTop}>
            <View style={[styles.appIcon, { backgroundColor: app.color + '22' }]}>
              <Ionicons name={app.icon as any} size={28} color={app.color} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.appName, { color: c.text }]}>{app.name}</Text>
              <Text style={[styles.appCategory, { color: c.textMuted }]}>{app.category}</Text>
            </View>
            {app.isBlocked && (
              <View style={[styles.blockedBadge, { backgroundColor: c.dangerLight }]}>
                <Ionicons name="lock-closed" size={12} color={c.danger} />
                <Text style={[styles.blockedText, { color: c.danger }]}>Blocked</Text>
              </View>
            )}
            {app.isShortForm && (
              <View style={[styles.shortFormBadge, { backgroundColor: c.warningLight }]}>
                <Ionicons name="videocam" size={12} color={c.warning} />
                <Text style={[styles.shortFormText, { color: c.warning }]}>Short-form</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: c.surface }]}>
            <ProgressRing progress={progress} size={64} strokeWidth={5} color={overLimit ? c.warning : c.tint}>
              <Text style={[styles.statRingValue, { color: c.text }]}>{formatTime(app.usageMinutes)}</Text>
            </ProgressRing>
            <Text style={[styles.statCardLabel, { color: c.textMuted }]}>Screen Time</Text>
            {app.dailyLimit > 0 && (
              <Text style={[styles.statCardSub, { color: overLimit ? c.warning : c.textMuted }]}>
                / {formatTime(app.dailyLimit)}
              </Text>
            )}
          </View>
          <View style={[styles.statCard, { backgroundColor: c.surface }]}>
            <Text style={[styles.statBigValue, { color: c.text }]}>{app.opens}</Text>
            <Text style={[styles.statCardLabel, { color: c.textMuted }]}>App Opens</Text>
            <Text style={[styles.statCardSub, { color: c.textMuted }]}>today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: c.surface }]}>
            <Text style={[styles.statBigValue, { color: c.text }]}>{app.notifications}</Text>
            <Text style={[styles.statCardLabel, { color: c.textMuted }]}>Notifications</Text>
            <Text style={[styles.statCardSub, { color: c.textMuted }]}>today</Text>
          </View>
        </View>

        {overLimit && (
          <Pressable
            onPress={() => setShowWarning(!showWarning)}
            style={[styles.warningCard, { backgroundColor: c.warningLight }]}
          >
            <Ionicons name="alert-circle" size={20} color={c.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.warningTitle, { color: c.warning }]}>Daily Limit Exceeded</Text>
              <Text style={[styles.warningDesc, { color: c.warning + 'CC' }]}>
                {formatTime(app.usageMinutes - app.dailyLimit)} over your limit
              </Text>
            </View>
            <Feather name={showWarning ? 'chevron-up' : 'chevron-down'} size={16} color={c.warning} />
          </Pressable>
        )}

        {showWarning && (
          <View style={[styles.warningMessageCard, { backgroundColor: c.surface, borderColor: c.warning + '30' }]}>
            <Ionicons name="chatbox-ellipses-outline" size={18} color={c.accent} />
            <Text style={[styles.warningMessageText, { color: c.textSecondary }]}>
              {settings.warningMessage}
            </Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: c.text }]}>Weekly Usage</Text>
        <View style={[styles.chartCard, { backgroundColor: c.surface }]}>
          <View style={styles.weekChart}>
            {weeklyData.map((d, i) => {
              const barH = maxWeekly > 0 ? (d.minutes / maxWeekly) * 80 : 4;
              const isToday = i === new Date().getDay();
              return (
                <View key={i} style={styles.weekBar}>
                  <Text style={[styles.weekBarVal, { color: c.textMuted }]}>{formatTime(d.minutes)}</Text>
                  <View style={styles.weekBarWrap}>
                    <View style={[styles.weekBarFill, { height: barH, backgroundColor: isToday ? app.color : app.color + '50' }]} />
                  </View>
                  <Text style={[styles.weekBarLabel, { color: isToday ? c.text : c.textMuted }]}>{d.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: c.text }]}>Controls</Text>

        <View style={[styles.controlCard, { backgroundColor: c.surface }]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setEditingLimit(!editingLimit);
              setLimitDraft(app.dailyLimit.toString());
            }}
            style={styles.controlRow}
          >
            <View style={[styles.controlIcon, { backgroundColor: c.tintLight }]}>
              <Ionicons name="timer-outline" size={18} color={c.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.controlTitle, { color: c.text }]}>Daily Time Limit</Text>
              <Text style={[styles.controlValue, { color: c.textMuted }]}>
                {app.dailyLimit > 0 ? formatTime(app.dailyLimit) : 'No limit set'}
              </Text>
            </View>
            <Feather name="edit-2" size={16} color={c.textMuted} />
          </Pressable>
          {editingLimit && (
            <View style={[styles.editSection, { borderTopColor: c.border }]}>
              <Text style={[styles.editHint, { color: c.textMuted }]}>Set to 0 to remove limit</Text>
              <TextInput
                style={[styles.input, { backgroundColor: c.surfaceElevated, color: c.text, borderColor: c.border }]}
                value={limitDraft}
                onChangeText={setLimitDraft}
                keyboardType="number-pad"
                placeholder="Minutes"
                placeholderTextColor={c.textMuted}
              />
              <Pressable
                onPress={handleSaveLimit}
                style={({ pressed }) => [styles.saveBtn, { backgroundColor: c.tint, opacity: pressed ? 0.9 : 1 }]}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
            </View>
          )}
        </View>

        <Pressable
          onPress={handleToggleBlock}
          style={({ pressed }) => [
            styles.controlCard,
            { backgroundColor: c.surface, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <View style={styles.controlRow}>
            <View style={[styles.controlIcon, { backgroundColor: app.isBlocked ? c.dangerLight : c.surfaceElevated }]}>
              <Ionicons name={app.isBlocked ? 'lock-closed' : 'lock-open-outline'} size={18} color={app.isBlocked ? c.danger : c.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.controlTitle, { color: app.isBlocked ? c.danger : c.text }]}>
                {app.isBlocked ? 'Unblock App' : 'Block App'}
              </Text>
              <Text style={[styles.controlValue, { color: c.textMuted }]}>
                {app.isBlocked ? 'This app is currently blocked' : 'Prevent access to this app'}
              </Text>
            </View>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  navRow: { flexDirection: 'row', marginBottom: 12 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 16, fontFamily: 'DMSans_500Medium' },
  backLink: { fontSize: 15, fontFamily: 'DMSans_600SemiBold' },
  headerCard: { borderRadius: 18, padding: 20, marginBottom: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  appIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 22, fontFamily: 'DMSans_700Bold' },
  appCategory: { fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  blockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  blockedText: { fontSize: 11, fontFamily: 'DMSans_600SemiBold' },
  shortFormBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 6 },
  shortFormText: { fontSize: 11, fontFamily: 'DMSans_600SemiBold' },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6 },
  statRingValue: { fontSize: 11, fontFamily: 'DMSans_700Bold' },
  statBigValue: { fontSize: 24, fontFamily: 'DMSans_700Bold' },
  statCardLabel: { fontSize: 11, fontFamily: 'DMSans_500Medium' },
  statCardSub: { fontSize: 10, fontFamily: 'DMSans_400Regular' },
  warningCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, marginBottom: 8 },
  warningTitle: { fontSize: 14, fontFamily: 'DMSans_600SemiBold' },
  warningDesc: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  warningMessageCard: { padding: 14, borderRadius: 12, marginBottom: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  warningMessageText: { fontSize: 14, fontFamily: 'DMSans_400Regular', lineHeight: 20, flex: 1 },
  sectionTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold', marginTop: 8, marginBottom: 12 },
  chartCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  weekChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 120 },
  weekBar: { alignItems: 'center', flex: 1 },
  weekBarVal: { fontSize: 9, fontFamily: 'DMSans_400Regular', marginBottom: 4 },
  weekBarWrap: { height: 80, justifyContent: 'flex-end' },
  weekBarFill: { width: 20, borderRadius: 6, minHeight: 4 },
  weekBarLabel: { fontSize: 11, fontFamily: 'DMSans_500Medium', marginTop: 6 },
  controlCard: { borderRadius: 14, marginBottom: 8, overflow: 'hidden' },
  controlRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  controlIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  controlTitle: { fontSize: 15, fontFamily: 'DMSans_600SemiBold' },
  controlValue: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  editSection: { padding: 14, borderTopWidth: 1, gap: 10 },
  editHint: { fontSize: 12, fontFamily: 'DMSans_400Regular' },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, fontSize: 14, fontFamily: 'DMSans_400Regular' },
  saveBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#0F1419' },
});
