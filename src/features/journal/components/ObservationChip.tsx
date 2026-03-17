import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { GlassContainer } from '@shared/components/glass-container';
import { Pressable } from '@shared/components/pressable';
import { cn } from '@shared/utils/cn';
import { colors } from '@theme/colors';

type ChipVariant = 'positive' | 'negative';

type ObservationChipProps = {
  selected: boolean;
  onPress: () => void;
  label: string;
  icon: LucideIcon;
  variant: ChipVariant;
};

function getContainerStyle(variant: ChipVariant, selected: boolean): ViewStyle {
  if (!selected) return styles.container;
  return {
    ...styles.container,
    backgroundColor: variant === 'positive' ? colors.background : 'rgba(232, 76, 63, 0.15)',
  };
}

function getTintColor(variant: ChipVariant, selected: boolean): string {
  if (!selected) return 'transparent';
  return variant === 'positive' ? colors.background : 'rgba(232, 76, 63, 0.15)';
}

function getTextColor(variant: ChipVariant, selected: boolean): string {
  if (!selected) return colors.textMuted;
  return variant === 'positive' ? colors.primary : colors.secondary;
}

export function ObservationChip({
  selected,
  onPress,
  label,
  icon: Icon,
  variant,
}: ObservationChipProps): React.ReactElement {
  const textColor = getTextColor(variant, selected);

  return (
    <Pressable onPress={onPress} haptic="light">
      <GlassContainer
        style={getContainerStyle(variant, selected)}
        tintColor={getTintColor(variant, selected)}
      >
        <View className="flex-row items-center gap-2">
          <Icon color={textColor} size={18} strokeWidth={2} />
          <Text
            className={cn(
              'text-sm font-medium',
              selected && variant === 'positive' && 'text-primary',
              selected && variant === 'negative' && 'text-secondary',
              !selected && 'text-textMuted',
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
  container: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
});
