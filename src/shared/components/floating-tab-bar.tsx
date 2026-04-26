import { format } from 'date-fns';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddIndicatorSheet } from '@features/dashboard/components/AddIndicatorSheet';
import { useUserStore } from '@shared/stores/user.store';
import { haptic } from '@shared/utils/haptic';
import { colors } from '@theme/colors';

import {
  BAR_HEIGHT,
  BAR_RADIUS,
  BUBBLE_INSET_Y,
  FAB_DIAMETER,
  FAB_NOTCH_WIDTH,
} from './floating-tab-bar/constants';
import { Fab } from './floating-tab-bar/fab';
import { TabButton } from './floating-tab-bar/tab-button';
import { BASE_TABS, ROUTINE_TABS, TabConfig } from './floating-tab-bar/tabs';
import { useBubbleStyle } from './floating-tab-bar/use-bubble-style';

export { SPRING_CONFIG } from './floating-tab-bar/constants';

export function FloatingTabBar(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const hasRoutineAccess = useUserStore((state) => state.hasRoutineAccess);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const bottomPosition = Math.max(insets.bottom, 16);
  const glassAvailable = isLiquidGlassAvailable();

  const allTabs = hasRoutineAccess ? [...BASE_TABS, ...ROUTINE_TABS] : BASE_TABS;
  const splitIndex = allTabs.length / 2;
  const leftTabs = allTabs.slice(0, splitIndex);
  const rightTabs = allTabs.slice(splitIndex);

  const { animatedStyle: bubbleAnimatedStyle } = useBubbleStyle(
    containerWidth,
    leftTabs.length,
    rightTabs.length,
  );

  const handleLayout = (event: LayoutChangeEvent): void => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const handleFabPress = (): void => {
    haptic.impact('medium');
    setSheetVisible(true);
  };

  const bar = containerWidth > 0 && renderTabs(leftTabs, rightTabs);

  return (
    <View className="absolute" style={{ bottom: bottomPosition, left: 16, right: 16 }}>
      {glassAvailable ? (
        <GlassView
          style={styles.bar}
          glassEffectStyle="regular"
          isInteractive
          onLayout={handleLayout}
        >
          {bar}
        </GlassView>
      ) : (
        <View style={[styles.bar, styles.barFallback]} onLayout={handleLayout}>
          {bar}
        </View>
      )}

      {containerWidth > 0 && glassAvailable && (
        <Animated.View style={[styles.bubble, bubbleAnimatedStyle]} pointerEvents="none">
          <View style={styles.bubbleTint} pointerEvents="none" />
        </Animated.View>
      )}

      <View pointerEvents="box-none" style={styles.fabWrapper}>
        <Fab onPress={handleFabPress} />
      </View>

      <AddIndicatorSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        date={format(new Date(), 'yyyy-MM-dd')}
      />
    </View>
  );
}

function renderTabs(leftTabs: TabConfig[], rightTabs: TabConfig[]): React.ReactElement {
  return (
    <>
      <View style={styles.tabGroup}>
        {leftTabs.map((tab) => (
          <TabButton key={tab.name} tab={tab} />
        ))}
      </View>
      <View style={{ width: FAB_NOTCH_WIDTH }} />
      <View style={styles.tabGroup}>
        {rightTabs.map((tab) => (
          <TabButton key={tab.name} tab={tab} />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: BAR_HEIGHT,
    borderRadius: BAR_RADIUS,
    flexDirection: 'row',
    alignItems: 'center',
  },
  barFallback: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  tabGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  bubble: {
    position: 'absolute',
    top: BUBBLE_INSET_Y,
    left: 0,
    borderRadius: BAR_RADIUS,
    overflow: 'hidden',
  },
  bubbleTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${colors.primary}1F`,
  },
  fabWrapper: {
    position: 'absolute',
    top: (BAR_HEIGHT - FAB_DIAMETER) / 2,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
