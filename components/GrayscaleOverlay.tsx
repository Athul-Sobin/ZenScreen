import React, { useMemo } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

interface GrayscaleOverlayProps {
  enabled: boolean;
  opacity?: number; // 0.0 (transparent/no grayscale) to 1.0 (full grayscale)
}

/**
 * Full-screen grayscale overlay applied during Focus Mode.
 * Uses a combination of:
 * 1. Hue rotation filter (CSS-like via React Native Skia or simple opacity overlay)
 * 2. Semi-transparent dark overlay to reduce color saturation perception
 * 
 * NOTE: React Native doesn't have native grayscale filter like web CSS.
 * We approximate using a dark overlay + reduce brightness with opacity.
 * For true grayscale, would need: Skia, native module, or screen brightness hack.
 */
export function GrayscaleOverlay({ enabled, opacity = 0.4 }: GrayscaleOverlayProps) {
  const animatedOpacity = useMemo(
    () => new Animated.Value(enabled ? opacity : 0),
    [enabled, opacity]
  );

  // Animate opacity transitions
  React.useEffect(() => {
    Animated.timing(animatedOpacity, {
      toValue: enabled ? opacity : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [enabled, opacity, animatedOpacity]);

  if (!enabled) {
    return null;
  }

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      {/* Grayscale approximation: desaturated overlay */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#000000',
            opacity: animatedOpacity,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999, // Below modals, above content
  },
});

/**
 * TODO: For production, consider:
 * 1. Using react-native-skia for true grayscale filters
 * 2. ColorMatrix for CSS-like hue rotation
 * 3. Native module for system-level screen filter
 * 
 * Current implementation uses opacity overlay as pragmatic approximation:
 * - Reduces perceived color saturation
 * - Darkens the screen (discourages use)
 * - Lightweight and cross-platform
 */
