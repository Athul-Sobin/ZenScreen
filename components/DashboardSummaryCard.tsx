import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

interface DashboardSummaryCardProps {
  avgSleepHours: number;
  totalScreenTimeMinutes: number;
}

export default function DashboardSummaryCard({
  avgSleepHours,
  totalScreenTimeMinutes
}: DashboardSummaryCardProps) {
  const c = Colors.dark;

  const formatSleepTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const formatScreenTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <View style={[styles.container, { backgroundColor: c.surfaceElevated }]}>
      <View style={styles.row}>
        <View style={styles.metric}>
          <View style={[styles.iconContainer, { backgroundColor: '#9B8FE820' }]}>
            <Ionicons name="moon" size={16} color="#9B8FE8" />
          </View>
          <View>
            <Text style={[styles.label, { color: c.textMuted }]}>Avg Sleep</Text>
            <Text style={[styles.value, { color: c.text }]}>{formatSleepTime(avgSleepHours)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.metric}>
          <View style={[styles.iconContainer, { backgroundColor: '#556B2F20' }]}>
            <Ionicons name="phone-portrait" size={16} color="#556B2F" />
          </View>
          <View>
            <Text style={[styles.label, { color: c.textMuted }]}>Screen Time</Text>
            <Text style={[styles.value, { color: c.text }]}>{formatScreenTime(totalScreenTimeMinutes)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 4,
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metric: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.dark.border,
    marginHorizontal: 16,
  },
});
