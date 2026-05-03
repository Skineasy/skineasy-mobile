import type { ViewProps, ViewStyle } from 'react-native';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { type AnimatedProps } from 'react-native-reanimated';

import { colors } from '@theme/colors';

type CardVariant = 'default' | 'outlined';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  animated?: boolean;
  entering?: AnimatedProps<ViewProps>['entering'];
  exiting?: AnimatedProps<ViewProps>['exiting'];
  style?: ViewStyle;
  isPressed?: boolean;
}

const PADDING_VALUES: Record<CardPadding, number> = {
  none: 0,
  sm: 8,
  md: 16,
  lg: 24,
};

function getCardStyle(variant: CardVariant, padding: CardPadding, isPressed: boolean): ViewStyle {
  const base: ViewStyle = {
    borderRadius: 16,
    padding: PADDING_VALUES[padding],
  };

  const shadow: ViewStyle = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    default: {},
  }) as ViewStyle;

  if (isPressed) {
    return {
      ...base,
      ...shadow,
      backgroundColor: colors.primary,
      borderWidth: 1,
      borderColor: colors.primary,
    };
  }

  switch (variant) {
    case 'default':
      return {
        ...base,
        ...shadow,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      };
    case 'outlined':
      return {
        ...base,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
      };
  }
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className,
  animated = false,
  entering,
  exiting,
  style,
  isPressed = false,
}: CardProps): React.ReactElement {
  const cardStyle = StyleSheet.flatten([getCardStyle(variant, padding, isPressed), style]);

  if (animated) {
    return (
      <Animated.View entering={entering} exiting={exiting} style={cardStyle} className={className}>
        {children}
      </Animated.View>
    );
  }

  return (
    <View style={cardStyle} className={className}>
      {children}
    </View>
  );
}
