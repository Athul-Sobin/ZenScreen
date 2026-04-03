import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

interface DataPoint {
  day: string;
  value: number;
}

interface SummaryCardProps {
  data: DataPoint[];
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  showWeeklyAverage?: boolean;
}

export default function SummaryCard({ data, title, icon, color, showWeeklyAverage = false }: SummaryCardProps) {
  const c = Colors.dark;

  // Calculate percentage change from yesterday to today
  const calculateChange = () => {
    if (data.length < 2) return { change: 0, isPositive: true };

    // Find yesterday and today (assuming data is ordered with today last)
    const today = data[data.length - 1]?.value || 0;
    const yesterday = data[data.length - 2]?.value || 0;

    if (yesterday === 0) {
      return { change: today > 0 ? 100 : 0, isPositive: today >= 0 };
    }

    const change = ((today - yesterday) / yesterday) * 100;
    return {
      change: Math.abs(change),
      isPositive: change >= 0
    };
  };

  const { change, isPositive } = calculateChange();
  const todayValue = data[data.length - 1]?.value || 0;
  const weeklyAverage = data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length) : 0;

  const displayValue = showWeeklyAverage ? weeklyAverage : todayValue;

  const formatValue = (value: number) => {
    if (value >= 60) {
      const hours = Math.floor(value / 60);
      const minutes = value % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${value}m`;
  };

  return (
    <View style={[styles.container, { backgroundColor: c.surfaceElevated }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text style={[styles.title, { color: c.textSecondary }]}>{title}</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.value, { color: c.text }]}>{formatValue(displayValue)}</Text>

        {showWeeklyAverage ? (
          <View style={styles.changeContainer}>
            <Ionicons name="calendar-outline" size={12} color={c.textMuted} />
            <Text style={[styles.changeLabel, { color: c.textMuted }]}>
              7-day average
            </Text>
          </View>
        ) : (
          <View style={styles.changeContainer}>
            <Ionicons
              name={isPositive ? 'trending-up' : 'trending-down'}
              size={12}
              color={isPositive ? c.success : c.warning}
            />
            <Text style={[
              styles.change,
              { color: isPositive ? c.success : c.warning }
            ]}>
              {change.toFixed(0)}%
            </Text>
            <Text style={[styles.changeLabel, { color: c.textMuted }]}>vs yesterday</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    marginVertical: 8,
    minWidth: 140,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    alignItems: 'flex-start',
  },
  value: {
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
    marginBottom: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  change: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
  },
  changeLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
  },
});
