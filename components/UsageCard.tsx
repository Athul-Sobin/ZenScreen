import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { AppUsageData } from '@/lib/types';

interface UsageCardProps {
  app: AppUsageData;
  onPress: () => void;
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function UsageCard({ app, onPress }: UsageCardProps) {
  const c = Colors.dark;
  const overLimit = app.dailyLimit > 0 && app.usageMinutes > app.dailyLimit;
  const progress = app.dailyLimit > 0 ? Math.min(app.usageMinutes / app.dailyLimit, 1) : 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: app.color + '22' }]}>
        <Ionicons name={app.icon as any} size={22} color={app.color} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>{app.name}</Text>
        <Text style={[styles.category, { color: c.textMuted }]}>{app.category}</Text>
      </View>
      <View style={styles.stats}>
        <Text style={[styles.time, { color: overLimit ? c.warning : c.text }]}>
          {formatTime(app.usageMinutes)}
        </Text>
        {app.dailyLimit > 0 && (
          <View style={styles.limitRow}>
            <View style={[styles.limitBar, { backgroundColor: c.border }]}>
              <View style={[styles.limitFill, { width: `${progress * 100}%`, backgroundColor: overLimit ? c.warning : c.tint }]} />
            </View>
          </View>
        )}
      </View>
      {overLimit && (
        <View style={[styles.warningDot, { backgroundColor: c.warning }]} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
  },
  category: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    marginTop: 2,
  },
  stats: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  time: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  limitRow: {
    marginTop: 4,
    width: 50,
  },
  limitBar: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  limitFill: {
    height: '100%',
    borderRadius: 2,
  },
  warningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 8,
  },
});
