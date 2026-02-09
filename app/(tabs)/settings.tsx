import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Switch, TextInput, Alert } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useWellbeing } from '@/lib/wellbeing-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const { settings, updateSettings } = useWellbeing();

  const [editingWarning, setEditingWarning] = useState(false);
  const [warningDraft, setWarningDraft] = useState(settings.warningMessage);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(settings.dailyGoalMinutes.toString());

  const handleSaveWarning = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateSettings({ warningMessage: warningDraft });
    setEditingWarning(false);
  };

  const handleSaveGoal = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const mins = parseInt(goalDraft, 10);
    if (!isNaN(mins) && mins > 0) {
      await updateSettings({ dailyGoalMinutes: mins });
    }
    setEditingGoal(false);
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will clear all your usage data, settings, and preferences. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await AsyncStorage.clear();
            await updateSettings({ onboardingComplete: true });
          },
        },
      ]
    );
  };

  const formatGoal = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} minutes`;
    return m > 0 ? `${h}h ${m}m` : `${h} hours`;
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 16, paddingBottom: 100 }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={[styles.title, { color: c.text }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>Customize your experience</Text>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>SCREEN TIME</Text>

        <View style={[styles.settingCard, { backgroundColor: c.surface }]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setEditingGoal(!editingGoal);
              setGoalDraft(settings.dailyGoalMinutes.toString());
            }}
            style={styles.settingRow}
          >
            <View style={[styles.settingIcon, { backgroundColor: c.tintLight }]}>
              <Ionicons name="timer-outline" size={18} color={c.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: c.text }]}>Daily Goal</Text>
              <Text style={[styles.settingValue, { color: c.textMuted }]}>{formatGoal(settings.dailyGoalMinutes)}</Text>
            </View>
            <Feather name={editingGoal ? 'chevron-up' : 'chevron-down'} size={18} color={c.textMuted} />
          </Pressable>
          {editingGoal && (
            <View style={[styles.editSection, { borderTopColor: c.border }]}>
              <TextInput
                style={[styles.input, { backgroundColor: c.surfaceElevated, color: c.text, borderColor: c.border }]}
                value={goalDraft}
                onChangeText={setGoalDraft}
                keyboardType="number-pad"
                placeholder="Minutes per day"
                placeholderTextColor={c.textMuted}
              />
              <Pressable
                onPress={handleSaveGoal}
                style={({ pressed }) => [styles.saveBtn, { backgroundColor: c.tint, opacity: pressed ? 0.9 : 1 }]}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
            </View>
          )}
        </View>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>WARNING MESSAGE</Text>

        <View style={[styles.settingCard, { backgroundColor: c.surface }]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setEditingWarning(!editingWarning);
              setWarningDraft(settings.warningMessage);
            }}
            style={styles.settingRow}
          >
            <View style={[styles.settingIcon, { backgroundColor: c.warningLight }]}>
              <Ionicons name="alert-circle-outline" size={18} color={c.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: c.text }]}>Custom Warning</Text>
              <Text style={[styles.settingValue, { color: c.textMuted }]} numberOfLines={1}>{settings.warningMessage}</Text>
            </View>
            <Feather name={editingWarning ? 'chevron-up' : 'chevron-down'} size={18} color={c.textMuted} />
          </Pressable>
          {editingWarning && (
            <View style={[styles.editSection, { borderTopColor: c.border }]}>
              <TextInput
                style={[styles.input, styles.inputMultiline, { backgroundColor: c.surfaceElevated, color: c.text, borderColor: c.border }]}
                value={warningDraft}
                onChangeText={setWarningDraft}
                multiline
                numberOfLines={3}
                placeholder="Your warning message..."
                placeholderTextColor={c.textMuted}
              />
              <Pressable
                onPress={handleSaveWarning}
                style={({ pressed }) => [styles.saveBtn, { backgroundColor: c.tint, opacity: pressed ? 0.9 : 1 }]}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
            </View>
          )}
        </View>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>FEATURES</Text>

        <View style={[styles.settingCard, { backgroundColor: c.surface }]}>
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: c.purpleLight }]}>
              <Ionicons name="moon-outline" size={18} color={c.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: c.text }]}>Sleep Tracking</Text>
              <Text style={[styles.settingValue, { color: c.textMuted }]}>Monitor your rest patterns</Text>
            </View>
            <Switch
              value={settings.sleepTrackingEnabled}
              onValueChange={(v) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                updateSettings({ sleepTrackingEnabled: v });
              }}
              trackColor={{ false: c.border, true: c.tintDark }}
              thumbColor={settings.sleepTrackingEnabled ? c.tint : c.textMuted}
            />
          </View>
        </View>

        <View style={[styles.settingCard, { backgroundColor: c.surface }]}>
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: c.blueLight }]}>
              <Ionicons name="notifications-outline" size={18} color={c.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: c.text }]}>Focus Reminders</Text>
              <Text style={[styles.settingValue, { color: c.textMuted }]}>Periodic break reminders</Text>
            </View>
            <Switch
              value={settings.focusReminderEnabled}
              onValueChange={(v) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                updateSettings({ focusReminderEnabled: v });
              }}
              trackColor={{ false: c.border, true: c.tintDark }}
              thumbColor={settings.focusReminderEnabled ? c.tint : c.textMuted}
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>DATA</Text>

        <Pressable
          onPress={handleResetData}
          style={({ pressed }) => [styles.settingCard, { backgroundColor: c.surface, opacity: pressed ? 0.8 : 1 }]}
        >
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: c.dangerLight }]}>
              <Ionicons name="trash-outline" size={18} color={c.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: c.danger }]}>Reset All Data</Text>
              <Text style={[styles.settingValue, { color: c.textMuted }]}>Clear all local data</Text>
            </View>
          </View>
        </Pressable>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: c.textMuted }]}>Zenscreen v1.0.0</Text>
          <Text style={[styles.footerText, { color: c.textMuted }]}>All data stored locally on your device</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  title: { fontSize: 24, fontFamily: 'DMSans_700Bold' },
  subtitle: { fontSize: 14, fontFamily: 'DMSans_400Regular', marginTop: 4, marginBottom: 24 },
  sectionLabel: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  settingCard: { borderRadius: 14, marginBottom: 8, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingTitle: { fontSize: 15, fontFamily: 'DMSans_600SemiBold' },
  settingValue: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  editSection: { padding: 14, borderTopWidth: 1, gap: 10 },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, fontSize: 14, fontFamily: 'DMSans_400Regular' },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  saveBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#0F1419' },
  footer: { alignItems: 'center', marginTop: 40, gap: 4 },
  footerText: { fontSize: 12, fontFamily: 'DMSans_400Regular' },
});
