import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Svg, Rect, Text as SvgText, G } from 'react-native-svg';
import Colors from '@/constants/colors';

const { width: screenWidth } = Dimensions.get('window');

interface DataPoint {
  day: string;
  value: number;
}

interface UsageChartProps {
  data: DataPoint[];
  title?: string;
  color?: string;
  height?: number;
}

export default function UsageChart({
  data,
  title,
  color = '#556B2F', // Earth Tones: Olive
  height = 200
}: UsageChartProps) {
  const c = Colors.dark;
  const chartWidth = screenWidth - 80; // Account for padding
  const chartHeight = height - 60; // Account for labels
  const barWidth = Math.max(20, (chartWidth - 40) / data.length - 8); // Min 20px, max spacing
  const maxValue = Math.max(...data.map(d => d.value), 1); // Avoid division by zero

  return (
    <View style={[styles.container, { height }]}>
      {title && (
        <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      )}

      <Svg width={chartWidth} height={chartHeight} style={styles.chart}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = chartHeight - (ratio * chartHeight);
          return (
            <G key={i}>
              <Rect
                x={0}
                y={y - 0.5}
                width={chartWidth}
                height={1}
                fill={c.border}
                opacity={0.3}
              />
              <SvgText
                x={-10}
                y={y + 4}
                fontSize={10}
                fill={c.textMuted}
                textAnchor="end"
                fontFamily="DMSans_400Regular"
              >
                {Math.round(maxValue * ratio)}
              </SvgText>
            </G>
          );
        })}

        {/* Bars */}
        {data.map((point, index) => {
          const barHeight = (point.value / maxValue) * chartHeight;
          const x = 40 + index * (barWidth + 8); // 40px left margin for labels
          const y = chartHeight - barHeight;

          return (
            <G key={point.day}>
              {/* Bar */}
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx={4}
              />

              {/* Value label on top of bar */}
              {point.value > 0 && (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 8}
                  fontSize={10}
                  fill={c.textSecondary}
                  textAnchor="middle"
                  fontFamily="DMSans_600SemiBold"
                >
                  {point.value}
                </SvgText>
              )}

              {/* Day label */}
              <SvgText
                x={x + barWidth / 2}
                y={chartHeight + 16}
                fontSize={11}
                fill={c.textMuted}
                textAnchor="middle"
                fontFamily="DMSans_500Medium"
              >
                {point.day}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: 'DMSans_600SemiBold',
    marginBottom: 12,
    marginLeft: 4,
  },
  chart: {
    alignSelf: 'center',
  },
});
