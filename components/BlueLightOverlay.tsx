import React, { useMemo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface BlueLightOverlayProps {
  enabled: boolean;
  intensity?: number; // 0-100, where 0 is no filter and 100 is maximum orange tint
}

/**
 * Blue Light Filter Overlay
 * 
 * Applies an orange tint over the entire screen to reduce blue light exposure.
 * Used during bedtime hours to minimize sleep disruption.
 * 
 * Intensity mapping:
 * - 0: No filter (transparent)
 * - 25-50: Light filter (slightly warm)
 * - 50-75: Medium filter (noticeable orange tint)
 * - 75-100: Strong filter (heavy orange overlay)
 * 
 * Example colors:
 * - rgba(255, 150, 0, 0.0) - No tint
 * - rgba(255, 150, 0, 0.2) - Light
 * - rgba(255, 140, 0, 0.4) - Medium
 * - rgba(255, 100, 0, 0.6) - Strong
 */
export function BlueLightOverlay({ enabled, intensity = 50 }: BlueLightOverlayProps) {
  const animatedOpacity = useMemo(
    () => new Animated.Value(enabled ? intensity / 100 * 0.6 : 0), // Max 60% opacity
    [enabled, intensity]
  );

  // Animate opacity transitions
  React.useEffect(() => {
    Animated.timing(animatedOpacity, {
      toValue: enabled ? Math.min(intensity / 100 * 0.6, 0.6) : 0,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [enabled, intensity, animatedOpacity]);

  if (!enabled) {
    return null;
  }

  // Calculate orange color tint based on intensity
  // As intensity increases, shift from yellow-orange to red-orange
  const orangeColor = intensity > 75 
    ? `rgba(255, 100, 0, ${animatedOpacity})` // Strong: red-orange
    : `rgba(255, 150, 0, ${animatedOpacity})`; // Light-medium: yellow-orange

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.overlay,
        {
          backgroundColor: orangeColor,
        },
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 998, // Below grayscale overlay (999), above content
  },
});

/**
 * Implementation notes:
 * 
 * TODO: For better visual quality, consider:
 * 1. Using a gradient overlay (orange core fading to transparent edges)
 * 2. Adding warm color temperature adjustment if platform supports it
 * 3. Integrating with native screen filter APIs when available
 * 
 * Current implementation:
 * - Simple semi-transparent orange overlay
 * - Smooth transitions between states
 * - No performance impact (single animated view)
 * - Works across all platforms (iOS, Android, Web)
 */
