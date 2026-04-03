import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Svg, { Defs, Filter, FeColorMatrix, Rect } from 'react-native-svg';

interface DisplayFilterOverlayProps {
  children: React.ReactNode;
  blueLightEnabled: boolean;
  grayscaleEnabled: boolean;
}

/**
 * Display Filter Overlay
 *
 * Applies visual filters over the entire screen:
 * - Grayscale: Converts colors to monochrome using SVG ColorMatrix
 * - Blue Light: Applies warm amber overlay using Animated.View
 *
 * Both filters are non-interactive overlays that don't block UI interactions.
 */
export function DisplayFilterOverlay({
  children,
  blueLightEnabled,
  grayscaleEnabled
}: DisplayFilterOverlayProps) {
  const blueLightStyle = useAnimatedStyle(() => ({
    opacity: withTiming(blueLightEnabled ? 1 : 0, { duration: 500 }),
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      {children}

      {/* Grayscale Filter using SVG */}
      {grayscaleEnabled && (
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <Filter id="grayscale">
              <FeColorMatrix
                type="matrix"
                values="0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 1 0"
              />
            </Filter>
          </Defs>
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            filter="url(#grayscale)"
          />
        </Svg>
      )}

      {/* Blue Light Filter using Animated View */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.blueLightOverlay,
          blueLightStyle,
        ]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blueLightOverlay: {
    backgroundColor: 'rgba(255, 140, 0, 0.2)', // Warm amber color
    zIndex: 999, // Above content but below potential modals
  },
});