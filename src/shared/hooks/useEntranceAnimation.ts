/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  Easing,
  AnimatedStyle,
} from 'react-native-reanimated';
import { ViewStyle } from 'react-native';

import { appConfig } from '@shared/config/appConfig';

const ANIMATION_CONFIG = {
  duration: 400,
  easing: Easing.out(Easing.ease),
};

const DELAY_INCREMENT = 80;
const TRANSLATE_Y = 10;

/**
 * Hook that provides staggered entrance animations for screen elements.
 * Returns an array of animated styles to apply to elements.
 *
 * Respects the `appConfig.features.animations` flag - when disabled,
 * returns empty styles (elements render immediately without animation).
 *
 * @param count - Number of elements to animate
 * @param baseDelay - Initial delay before first animation starts (default: 0)
 * @returns Array of animated styles with staggered fade-in and slide-up effects
 *
 * @example
 * const styles = useEntranceAnimation(3)
 * // Apply: styles[0] to first element, styles[1] to second, etc.
 */
export function useEntranceAnimation(
  count: number,
  baseDelay: number = 0,
): AnimatedStyle<ViewStyle>[] {
  const animationsEnabled = appConfig.features.animations;
  const progress = Array.from({ length: count }, () => useSharedValue(animationsEnabled ? 0 : 1));

  useEffect(() => {
    if (!animationsEnabled) return;

    progress.forEach((p, index) => {
      p.value = withDelay(baseDelay + index * DELAY_INCREMENT, withTiming(1, ANIMATION_CONFIG));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const styles = progress.map((p) =>
    useAnimatedStyle(() => ({
      opacity: p.value,
      transform: [{ translateY: interpolate(p.value, [0, 1], [TRANSLATE_Y, 0]) }],
    })),
  );

  return styles;
}
