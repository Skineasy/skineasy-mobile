import { forwardRef } from 'react';
import { ScrollView } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
} from 'react-native-keyboard-controller';

export interface KeyboardScrollViewProps extends KeyboardAwareScrollViewProps {
  /**
   * Distance between keyboard and focused input
   * @default 16
   */
  bottomOffset?: number;
}

/**
 * A keyboard-aware ScrollView that automatically scrolls to focused TextInput.
 * Uses react-native-keyboard-controller for native performance.
 *
 * @example
 * ```tsx
 * <KeyboardScrollView>
 *   <Input ... />
 *   <Input ... />
 *   <Button ... />
 * </KeyboardScrollView>
 * ```
 */
export const KeyboardScrollView = forwardRef<ScrollView, KeyboardScrollViewProps>(
  ({ bottomOffset = 16, children, ...props }, ref) => {
    return (
      <KeyboardAwareScrollView
        ref={ref}
        bottomOffset={bottomOffset}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...props}
      >
        {children}
      </KeyboardAwareScrollView>
    );
  },
);

KeyboardScrollView.displayName = 'KeyboardScrollView';
