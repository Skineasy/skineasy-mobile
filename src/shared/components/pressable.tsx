import { Pressable as RNPressable, type PressableProps } from 'react-native';

import { haptic } from '@shared/utils/haptic';

type HapticLevel = 'light' | 'medium' | 'heavy' | false;

interface CustomPressableProps extends PressableProps {
  /**
   * Haptic feedback level to trigger on press
   * - 'light': Reversible actions (back, selections, toggles)
   * - 'medium': Navigation, context switches
   * - 'heavy': Data persistence, auth actions
   * - false: Disable haptic (default)
   */
  haptic?: HapticLevel;
}

/**
 * Custom Pressable component with opacity feedback and optional haptic
 *
 * Provides visual feedback by reducing opacity when pressed,
 * which is a standard mobile UX pattern.
 *
 * @example
 * ```tsx
 * import { Pressable } from '@shared/components/pressable'
 *
 * <Pressable onPress={handlePress} haptic="medium">
 *   <Text>Tap me</Text>
 * </Pressable>
 * ```
 */
export function Pressable({ style, haptic: hapticLevel, onPress, ...props }: CustomPressableProps) {
  const handlePress = (event: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
    // Trigger haptic if configured
    if (hapticLevel) {
      haptic.impact(hapticLevel);
    }

    // Call original onPress handler
    onPress?.(event);
  };

  return (
    <RNPressable
      style={({ pressed }) => [
        typeof style === 'function' ? style({ pressed }) : style,
        { opacity: pressed ? 0.6 : 1 },
      ]}
      onPress={handlePress}
      {...props}
    />
  );
}
