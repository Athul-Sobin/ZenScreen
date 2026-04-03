import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useWellbeing } from '@/lib/wellbeing-context';
import * as Haptics from 'expo-haptics';

export default function LimitsScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const { apps, blockRules, updateBlockRules } = useWellbeing();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const handleLimitChange = async (appId: string, enabled: boolean, limitMinutes: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const existingRule = blockRules.find(r => r.appId === appId);
    let newRules = blockRules.filter(r => r.appId !== appId);

    if (enabled) {
      newRules.push({
        id: existingRule?.id || `rule_${appId}_${Date.now()}`,
        appId,
        dailyLimitMinutes: limitMinutes,
        isEnabled: true,
      });
    }

    await updateBlockRules(newRules);
  };

  const getAppRule = (appId: string) => {
    return blockRules.find(r => r.appId === appId);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 16, paddingBottom: 100 }]}
      >
        <View style={styles.header}>
          <View style={styles.backButton}>
            <Ionicons
              name="chevron-back"
              size={24}
              color={c.text}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
            />
          </View>
          <Text style={[styles.title, { color: c.text }]}>App Limits</Text>
          <View style={styles.placeholder} />
        </View>

        <Text style={[styles.subtitle, { color: c.textMuted }]}>
          Set daily time limits for apps. When limits are reached, apps will be blocked until the next day.
        </Text>

        <View style={styles.appsList}>
          {apps.map(app => {
            const rule = getAppRule(app.id);
            const isEnabled = !!rule?.isEnabled;
            const limitMinutes = rule?.dailyLimitMinutes || 60;

            return (
              <View key={app.id} style={[styles.appItem, { backgroundColor: c.surfaceElevated }]}>
                <View style={styles.appInfo}>
                  <View style={[styles.appIcon, { backgroundColor: c.tintLight }]}>
                    <Ionicons name="apps" size={20} color={c.tint} />
                  </View>
                  <View style={styles.appDetails}>
                    <Text style={[styles.appName, { color: c.text }]}>{app.name}</Text>
                    <Text style={[styles.appUsage, { color: c.textMuted }]}>
                      Today: {Math.floor(app.usageMinutes / 60)}h {app.usageMinutes % 60}m
                    </Text>
                  </View>
                </View>

                <View style={styles.controls}>
                  <Switch
                    value={isEnabled}
                    onValueChange={(enabled) => handleLimitChange(app.id, enabled, limitMinutes)}
                    trackColor={{ false: c.border, true: c.tintLight }}
                    thumbColor={isEnabled ? c.tint : c.textMuted}
                    ios_backgroundColor={c.border}
                  />

                  {isEnabled && (
                    <View style={styles.sliderContainer}>
                      <Text style={[styles.limitText, { color: c.textSecondary }]}>
                        {Math.floor(limitMinutes / 60)}h {limitMinutes % 60}m limit
                      </Text>
                      <View style={styles.slider}>
                        {/* Simple slider implementation - in real app would use Slider component */}
                        <View style={styles.sliderTrack}>
                          <View
                            style={[
                              styles.sliderFill,
                              {
                                width: `${(limitMinutes / 480) * 100}%`, // Max 8 hours
                                backgroundColor: c.tint
                              }
                            ]}
                          />
                        </View>
                        <View style={styles.sliderButtons}>
                          <Ionicons
                            name="remove-circle"
                            size={24}
                            color={limitMinutes > 30 ? c.tint : c.textMuted}
                            onPress={() => {
                              if (limitMinutes > 30) {
                                handleLimitChange(app.id, true, limitMinutes - 30);
                              }
                            }}
                          />
                          <Ionicons
                            name="add-circle"
                            size={24}
                            color={limitMinutes < 480 ? c.tint : c.textMuted}
                            onPress={() => {
                              if (limitMinutes < 480) {
                                handleLimitChange(app.id, true, limitMinutes + 30);
                              }
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {apps.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="apps-outline" size={48} color={c.textMuted} />
            <Text style={[styles.emptyText, { color: c.textMuted }]}>
              No apps tracked yet. Start using apps to see them here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontFamily: 'DMSans_700Bold' },
  placeholder: { width: 40 },
  subtitle: { fontSize: 14, fontFamily: 'DMSans_400Regular', marginBottom: 24, lineHeight: 20 },
  appsList: { gap: 12 },
  appItem: { borderRadius: 16, padding: 16, gap: 16 },
  appInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  appIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  appDetails: { flex: 1 },
  appName: { fontSize: 16, fontFamily: 'DMSans_600SemiBold', marginBottom: 2 },
  appUsage: { fontSize: 12, fontFamily: 'DMSans_400Regular' },
  controls: { gap: 12 },
  sliderContainer: { gap: 8 },
  limitText: { fontSize: 12, fontFamily: 'DMSans_500Medium', textAlign: 'center' },
  slider: { gap: 8 },
  sliderTrack: { height: 4, backgroundColor: Colors.dark.border, borderRadius: 2 },
  sliderFill: { height: '100%', borderRadius: 2 },
  sliderButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 16 },
  emptyText: { fontSize: 16, fontFamily: 'DMSans_400Regular', textAlign: 'center', lineHeight: 24 },
});