import { Eye, EyeOff } from 'lucide-react-native';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { Animated, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Pressable } from '@shared/components/pressable';
import { useScrollContext } from '@shared/components/screen-header';
import { cn } from '@shared/utils/cn';
import { haptic } from '@shared/utils/haptic';
import { colors } from '@theme/colors';

interface InputProps extends Omit<TextInputProps, 'placeholder'> {
  label?: string;
  error?: string;
  /**
   * Enable haptic feedback on focus (default: true)
   */
  enableHaptic?: boolean;
  /**
   * Show password visibility toggle (only for secureTextEntry inputs)
   */
  showPasswordToggle?: boolean;
  /**
   * Number of lines for multiline input (default: 4)
   * Used to calculate the height of the input
   */
  numberOfLines?: number;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      className,
      style,
      onFocus,
      onBlur,
      enableHaptic = true,
      multiline,
      showPasswordToggle = false,
      secureTextEntry,
      numberOfLines = 4,
      value,
      ...props
    },
    ref,
  ) => {
    // Calculate height for multiline inputs based on numberOfLines
    // lineHeight (18) + some padding
    const multilineHeight = numberOfLines * 18 + 24;
    const scrollContext = useScrollContext();
    const containerRef = useRef<View>(null);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Floating label animation (RN Animated API pattern - accessing .current is valid here)
    // eslint-disable-next-line react-hooks/refs
    const labelAnimation = useRef(new Animated.Value(value ? 1 : 0)).current;

    // Sync label animation when value changes (e.g., when editing existing data)
    useEffect(() => {
      if (value && !isFocused) {
        Animated.timing(labelAnimation, {
          toValue: 1,
          duration: 0, // Instant, no animation needed for initial load
          useNativeDriver: false,
        }).start();
      }
    }, [value, isFocused, labelAnimation]);

    const handleFocus = (event: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      setIsFocused(true);

      // Animate label up
      Animated.timing(labelAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();

      // Trigger selection haptic on focus
      if (enableHaptic) {
        haptic.selection();
      }

      // Scroll to make input visible above keyboard (if in ScreenHeader context)
      if (scrollContext) {
        // Simple scroll up to make room for keyboard
        scrollContext.scrollToPosition(200);
      }

      // Call original onFocus handler
      if (onFocus) {
        onFocus(event);
      }
    };

    const handleBlur = (event: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      setIsFocused(false);

      // Animate label down if no value
      if (!value) {
        Animated.timing(labelAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }

      // Call original onBlur handler
      if (onBlur) {
        onBlur(event);
      }
    };

    const togglePasswordVisibility = () => {
      setIsPasswordVisible(!isPasswordVisible);
    };

    // Label position interpolation (RN Animated API - refs are valid here)
    /* eslint-disable react-hooks/refs */
    const labelTop = labelAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -8],
    });

    const labelFontSize = labelAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    });

    const labelLineHeight = labelAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [24, 16],
    });

    const labelColor = isFocused ? colors.primary : error ? colors.error : colors.textMuted;

    return (
      <View ref={containerRef} className="w-full mb-6">
        <View
          className={cn(
            'relative bg-surface rounded-xl',
            isFocused
              ? 'border-2 border-primary'
              : error
                ? 'border-2 border-error'
                : 'border border-border',
            className,
          )}
          style={{
            height: multiline ? multilineHeight : 24 + 40, // Icon Size + padding vertical
            shadowColor: isFocused ? colors.primary : '#000',
            shadowOffset: { width: 0, height: isFocused ? 4 : 2 },
            shadowOpacity: isFocused ? 0.15 : 0.05,
            shadowRadius: isFocused ? 8 : 4,
            elevation: isFocused ? 4 : 1,
          }}
        >
          {/* Floating Label */}
          {label && (
            <Animated.View
              pointerEvents="none"
              className="absolute left-5 bg-surface px-1 rounded-full"
              style={{
                top: labelTop,
              }}
            >
              <Animated.Text
                style={{
                  fontSize: labelFontSize,
                  lineHeight: labelLineHeight,
                  color: labelColor,
                  fontWeight: '500',
                }}
              >
                {label}
              </Animated.Text>
            </Animated.View>
          )}

          {/* Input */}
          <TextInput
            ref={ref}
            className={cn(
              'w-full h-full pl-4 text-text',
              showPasswordToggle && secureTextEntry ? 'pr-14' : 'pr-4',
            )}
            textAlignVertical={multiline ? 'top' : 'center'}
            style={[{ fontSize: 14, lineHeight: 18, paddingTop: multiline ? 12 : 0 }, style]}
            onFocus={handleFocus}
            onBlur={handleBlur}
            multiline={multiline}
            secureTextEntry={secureTextEntry && !isPasswordVisible}
            value={value}
            {...props}
            placeholder={undefined}
          />

          {/* Password Toggle */}
          {showPasswordToggle && secureTextEntry && (
            <Pressable
              onPress={togglePasswordVisibility}
              haptic="light"
              className="absolute right-2 top-0 bottom-0 w-12 items-center justify-center"
              accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            >
              {isPasswordVisible ? (
                <EyeOff size={20} color={colors.textMuted} />
              ) : (
                <Eye size={20} color={colors.textMuted} />
              )}
            </Pressable>
          )}
        </View>

        {/* Error Message */}
        {error && <Text className="text-xs text-error mt-1 ml-4">{error}</Text>}
      </View>
    );
  },
);

Input.displayName = 'Input';
