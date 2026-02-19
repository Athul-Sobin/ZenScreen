import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useWellbeing } from '@/lib/wellbeing-context';
import { BlockRule } from '@/lib/types';
import * as Haptics from 'expo-haptics';

export default function BlockerScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const { apps, blockRules, updateBlockRules } = useWellbeing();
  const [selectedApps, setSelectedApps] = useState<Set<string>>(
    new Set(blockRules.filter(r => r.mode === 'full_block').map(r => r.appId))
  );

  const handleToggleBlock = (appId: string, appName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSelected = new Set(selectedApps);
    if (newSelected.has(appId)) {
      newSelected.delete(appId);
    } else {
      newSelected.add(appId);
    }
    setSelectedApps(newSelected);

    // Update block rules
    const newRules: BlockRule[] = apps
      .filter(a => newSelected.has(a.id))
      .map(a => ({
        appId: a.id,
        appName: a.name,
        mode: 'full_block' as const,
      }));

    updateBlockRules(newRules);
  };

  const socialApps = apps.filter(a => a.category === 'Social' || a.isShortForm);
  const otherApps = apps.filter(a => a.category !== 'Social' && !a.isShortForm);

  const blockedCount = selectedApps.size;
  const screenTimeReduction = useMemo(() => {
    // Estimate potential screen time reduction
    return blockedCount > 0 ? Math.ceil(blockedCount * 30) : 0; // Rough estimate
  }, [blockedCount]);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 16, paddingBottom: 100 }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={[styles.title, { color: c.text }]}>App Blocker</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>Full-block apps to reduce distractions</Text>

        {/* Stats/Summary */}
        <View style={[styles.summaryCard, { backgroundColor: c.surface }]}>
          <View style={styles.statItem}>
            <Ionicons name="lock-closed-outline" size={20} color={c.tint} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>Blocked</Text>
              <Text style={[styles.statValue, { color: c.text }]}>{blockedCount} app{blockedCount !== 1 ? 's' : ''}</Text>
            </View>
          </View>
          {screenTimeReduction > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="trending-down-outline" size={20} color={c.success} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.statLabel, { color: c.textMuted }]}>Est. Savings</Text>
                <Text style={[styles.statValue, { color: c.success }]}>~{screenTimeReduction}m/day</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Block Apps</Text>
          <Pressable
            onPress={() => {
              if (selectedApps.size === apps.length) {
                setSelectedApps(new Set());
              } else {
                setSelectedApps(new Set(apps.map(a => a.id)));
              }
              const newRules = selectedApps.size === apps.length 
                ? []
                : apps.map(a => ({
                    appId: a.id,
                    appName: a.name,
                    mode: 'full_block' as const,
                  }));
              updateBlockRules(newRules);
            }}
          >
            <Text style={[styles.selectAll, { color: c.tint }]}>
              {selectedApps.size === apps.length ? 'Unblock All' : 'Block All'}
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
                  onPress={() => handleToggleBlock(app.id, app.name)}
                  style={[
                    styles.appItem,
                    {
                      backgroundColor: selectedApps.has(app.id) ? c.tintLight : c.surface,
                      borderColor: selectedApps.has(app.id) ? c.tint + '50' : c.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.appIcon,
                      { backgroundColor: selectedApps.has(app.id) ? c.tint + '20' : c.surfaceElevated },
                    ]}
                  >
                    <Ionicons name={app.icon as any} size={24} color={selectedApps.has(app.id) ? c.tint : app.color} />
                  </View>
                  <Text style={[styles.appName, { color: selectedApps.has(app.id) ? c.tint : c.textSecondary }]} numberOfLines={1}>
                    {app.name}
                  </Text>
                  {selectedApps.has(app.id) && (
                    <View style={[styles.checkmark, { backgroundColor: c.tint }]}>
                      <Ionicons name="checkmark" size={12} color={c.text} />
                    </View>
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
                  onPress={() => handleToggleBlock(app.id, app.name)}
                  style={[
                    styles.appItem,
                    {
                      backgroundColor: selectedApps.has(app.id) ? c.tintLight : c.surface,
                      borderColor: selectedApps.has(app.id) ? c.tint + '50' : c.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.appIcon,
                      { backgroundColor: selectedApps.has(app.id) ? c.tint + '20' : c.surfaceElevated },
                    ]}
                  >
                    <Ionicons name={app.icon as any} size={24} color={selectedApps.has(app.id) ? c.tint : app.color} />
                  </View>
                  <Text style={[styles.appName, { color: selectedApps.has(app.id) ? c.tint : c.textSecondary }]} numberOfLines={1}>
                    {app.name}
                  </Text>
                  {selectedApps.has(app.id) && (
                    <View style={[styles.checkmark, { backgroundColor: c.tint }]}>
                      <Ionicons name="checkmark" size={12} color={c.text} />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={c.tint} />
          <Text style={[styles.infoText, { color: c.textSecondary }]}>
            Blocked apps cannot be opened while this rule is active. Changes apply immediately.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  title: { fontSize: 24, fontFamily: 'DMSans_700Bold' },
  subtitle: { fontSize: 14, fontFamily: 'DMSans_400Regular', marginTop: 4, marginBottom: 20 },
  summaryCard: { borderRadius: 14, padding: 16, marginBottom: 20, gap: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center' },
  statLabel: { fontSize: 12, fontFamily: 'DMSans_500Medium' },
  statValue: { fontSize: 16, fontFamily: 'DMSans_700Bold', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
  selectAll: { fontSize: 13, fontFamily: 'DMSans_600SemiBold' },
  categoryLabel: { fontSize: 12, fontFamily: 'DMSans_500Medium', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  appGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  appItem: { width: '30%', alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  appIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  appName: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', textAlign: 'center' },
  checkmark: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoBox: { flexDirection: 'row', gap: 12, backgroundColor: '#1a3a3a', padding: 12, borderRadius: 12, marginTop: 12, alignItems: 'center' },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'DMSans_400Regular', lineHeight: 16 },
});
