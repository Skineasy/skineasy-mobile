/**
 * Bottom Sheet Component
 *
 * A reusable bottom sheet using native iOS/Android sheet.
 * Wraps @lodev09/react-native-true-sheet with declarative API.
 */

import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useEffect, useRef } from 'react';
import { Dimensions, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number | 'auto';
  scrollable?: boolean;
  backgroundColor?: string;
}

export function BottomSheet({
  visible,
  onClose,
  children,
  height = 'auto',
  scrollable = false,
  backgroundColor,
}: BottomSheetProps) {
  const sheet = useRef<TrueSheet>(null);

  useEffect(() => {
    if (visible) {
      sheet.current?.present().catch(() => {});
    } else {
      sheet.current?.dismiss().catch(() => {});
    }
  }, [visible]);

  // Convert height prop to detents
  const detents: (number | 'auto')[] = height === 'auto' ? ['auto'] : [height / SCREEN_HEIGHT];

  return (
    <TrueSheet
      ref={sheet}
      detents={detents}
      onDidDismiss={onClose}
      grabber
      scrollable={scrollable}
      style={{ paddingTop: 24 }}
      backgroundColor={backgroundColor}
    >
      <View style={{ width: SCREEN_WIDTH }}>{children}</View>
    </TrueSheet>
  );
}
