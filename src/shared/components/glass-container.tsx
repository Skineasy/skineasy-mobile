import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LayoutChangeEvent, StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '@theme/colors';

type GlassEffectStyle = 'clear' | 'regular';

type GlassContainerProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  glassStyle?: GlassEffectStyle;
  onLayout?: (event: LayoutChangeEvent) => void;
  tintColor?: string;
  isInteractive?: boolean;
};

export function GlassContainer({
  children,
  style,
  glassStyle = 'regular',
  onLayout,
  tintColor = colors.surface,
  isInteractive = false,
}: GlassContainerProps): React.ReactElement {
  const isGlassAvailable = isLiquidGlassAvailable();

  if (isGlassAvailable) {
    return (
      <GlassView
        style={[styles.container, style]}
        glassEffectStyle={glassStyle}
        onLayout={onLayout}
        tintColor={tintColor}
        isInteractive={isInteractive}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View style={[styles.container, styles.fallback, style]} onLayout={onLayout}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.creamMuted,
  },
  fallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
});
