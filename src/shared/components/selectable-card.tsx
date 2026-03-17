import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { GlassContainer } from '@shared/components/glass-container';
import { Pressable } from '@shared/components/pressable';
import { cn } from '@shared/utils/cn';
import { colors } from '@theme/colors';

type Variant = 'horizontal' | 'vertical';

type SelectableCardProps = {
  selected: boolean;
  onPress: () => void;
  label: string;
  icon?: LucideIcon;
  haptic?: 'light' | 'medium' | 'heavy';
  variant?: Variant;
  iconSize?: number;
};

function getContainerStyle(variant: Variant, selected: boolean): ViewStyle {
  return {
    ...styles.base,
    ...styles[variant],
    ...(selected && styles.selected),
  };
}

export function SelectableCard({
  selected,
  onPress,
  label,
  icon: Icon,
  haptic = 'light',
  variant = 'horizontal',
  iconSize = 20,
}: SelectableCardProps): React.ReactElement {
  const textColor = selected ? colors.primary : colors.textMuted;
  const isVertical = variant === 'vertical';

  return (
    <Pressable onPress={onPress} haptic={haptic}>
      <GlassContainer
        style={getContainerStyle(variant, selected)}
        tintColor={selected ? colors.background : 'transparent'}
      >
        <View className={isVertical ? 'items-center' : 'flex-row items-center gap-3'}>
          {Icon && <Icon color={textColor} size={iconSize} strokeWidth={2} />}
          <Text
            className={cn(
              'font-semibold',
              isVertical ? 'text-sm mt-3' : 'text-base',
              selected ? 'text-primary' : 'text-textMuted',
            )}
          >
            {label}
          </Text>
        </View>
      </GlassContainer>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {},
  horizontal: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  vertical: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: colors.background,
  },
});
