import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Platform, PressableProps, Text, View } from 'react-native';

import { Pressable } from '@shared/components/pressable';
import { cn } from '@shared/utils/cn';
import { colors } from '@theme/colors';

type ButtonVariant = 'primary' | 'secondary' | 'outline';
type HapticLevel = 'light' | 'medium' | 'heavy' | false;

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  /**
   * Haptic feedback level - defaults to 'heavy' for buttons (save/submit actions)
   */
  haptic?: HapticLevel;
  /**
   * Icon component to render before the title
   */
  iconLeft?: LucideIcon;
  /**
   * Icon component to render after the title
   */
  iconRight?: LucideIcon;
  /**
   * Make button fit content width instead of full width
   */
  fitContent?: boolean;
}

const variantStyles = {
  primary: {
    container: 'bg-primary',
    containerPressed: 'bg-primary-dark',
    text: 'text-white',
  },
  secondary: {
    container: 'bg-surface border border-cream-muted',
    containerPressed: 'bg-surface border border-cream-muted opacity-80',
    text: 'text-primary',
  },
  outline: {
    container: 'bg-transparent border border-primary',
    containerPressed: 'bg-primary/10 border border-primary',
    text: 'text-primary',
  },
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  className,
  haptic = 'heavy', // Default to heavy for buttons (save/submit actions)
  iconLeft: IconLeft,
  iconRight: IconRight,
  fitContent = false,
  ...props
}: ButtonProps) {
  const styles = variantStyles[variant];
  const isDisabled = disabled || loading;
  const iconColor = variant === 'primary' ? colors.surface : colors.text;

  return (
    <Pressable
      className={cn(
        fitContent ? 'px-4' : 'w-full',
        'h-14 rounded-xl items-center justify-center flex-row gap-1',
        styles.container,
        className,
      )}
      style={({ pressed }) => ({
        opacity: isDisabled ? 0.5 : pressed ? 0.6 : 1,
        ...(Platform.OS === 'ios' && {
          shadowColor: variant === 'primary' ? colors.primary : '#000',
          shadowOffset: { width: 0, height: isDisabled ? 0 : 4 },
          shadowOpacity: isDisabled ? 0 : variant === 'primary' ? 0.25 : 0.1,
          shadowRadius: isDisabled ? 0 : 8,
        }),
      })}
      disabled={isDisabled}
      haptic={isDisabled ? false : haptic} // Disable haptic when button disabled
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.surface : colors.primary} />
      ) : (
        <View className="flex-row items-center gap-2">
          {IconLeft && <IconLeft size={20} color={iconColor} strokeWidth={2} />}
          <Text className={cn('text-base font-semibold', styles.text)}>{title}</Text>
          {IconRight && <IconRight size={18} color={iconColor} strokeWidth={2.5} />}
        </View>
      )}
    </Pressable>
  );
}
