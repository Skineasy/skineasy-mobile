import { format } from 'date-fns';
import { useTabTrigger } from 'expo-router/ui';
import { BookOpen, Home, Plus, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutChangeEvent, Pressable as RNPressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddIndicatorSheet } from '@features/dashboard/components/AddIndicatorSheet';
import { GlassContainer } from '@shared/components/glass-container';
import { Pressable } from '@shared/components/pressable';
import { useTabBarContext } from '@shared/contexts/TabBarContext';
import { useUserStore } from '@shared/stores/user.store';
import { haptic } from '@shared/utils/haptic';
import { colors } from '@theme/colors';

export const SPRING_CONFIG = { damping: 60, stiffness: 300 };

const FAB_DIAMETER = 60;
const FAB_RADIUS = FAB_DIAMETER / 2;
const FAB_LIFT = 30;
const FAB_NOTCH_WIDTH = 80;
const BUBBLE_PADDING = 8;

type TabConfig = {
  name: string;
  href: string;
  labelKey: string;
  icon: typeof Home;
};

const BASE_TABS: TabConfig[] = [
  { name: 'index', href: '/', labelKey: 'dashboard.home', icon: Home },
  { name: 'journal', href: '/journal', labelKey: 'journal.title', icon: BookOpen },
];

const ROUTINE_TAB: TabConfig = {
  name: 'routine',
  href: '/routine',
  labelKey: 'routine.title',
  icon: Sparkles,
};

type TabButtonProps = {
  tab: TabConfig;
};

function TabButton({ tab }: TabButtonProps): React.ReactElement {
  const { t } = useTranslation();
  const { trigger, triggerProps } = useTabTrigger({ name: tab.name, href: tab.href });
  const Icon = tab.icon;
  const isFocused = trigger?.isFocused ?? false;
  const color = isFocused ? colors.primary : colors.textMuted;

  return (
    <Pressable
      className="flex-1 items-center gap-1 py-1"
      onPress={triggerProps.onPress}
      onLongPress={triggerProps.onLongPress}
    >
      <Icon color={color} size={22} />
      <Text className="font-medium text-xs" style={{ color }}>
        {t(tab.labelKey)}
      </Text>
    </Pressable>
  );
}

type TabBarContentProps = {
  containerWidth: number;
  leftTabs: TabConfig[];
  rightTabs: TabConfig[];
};

function TabBarContent({
  containerWidth,
  leftTabs,
  rightTabs,
}: TabBarContentProps): React.ReactElement {
  const { activeIndex } = useTabBarContext();
  const leftCount = leftTabs.length;
  const rightCount = rightTabs.length;
  const groupWidth = (containerWidth - FAB_NOTCH_WIDTH) / 2;
  const leftTabWidth = groupWidth / leftCount;
  const rightTabWidth = groupWidth / rightCount;
  const bubbleWidth = Math.min(leftTabWidth, rightTabWidth) - BUBBLE_PADDING * 2;

  const bubbleStyle = useAnimatedStyle(() => {
    const idx = activeIndex.value;
    const lastLeftCenter = leftTabWidth * (leftCount - 0.5);
    const firstRightCenter = groupWidth + FAB_NOTCH_WIDTH + rightTabWidth * 0.5;

    let centerX: number;
    if (idx <= leftCount - 1) {
      centerX = leftTabWidth * (idx + 0.5);
    } else if (idx >= leftCount) {
      centerX = groupWidth + FAB_NOTCH_WIDTH + rightTabWidth * (idx - leftCount + 0.5);
    } else {
      const t = idx - (leftCount - 1);
      centerX = lastLeftCenter + (firstRightCenter - lastLeftCenter) * t;
    }

    return {
      transform: [{ translateX: centerX - bubbleWidth / 2 }],
      width: bubbleWidth,
    };
  });

  return (
    <>
      <Animated.View style={[styles.bubble, bubbleStyle]} />
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

export function FloatingTabBar(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const hasRoutineAccess = useUserStore((state) => state.hasRoutineAccess);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const bottomPosition = Math.max(insets.bottom, 16);

  const allTabs = hasRoutineAccess ? [...BASE_TABS, ROUTINE_TAB] : BASE_TABS;
  const splitIndex = Math.ceil(allTabs.length / 2);
  const leftTabs = allTabs.slice(0, splitIndex);
  const rightTabs = allTabs.slice(splitIndex);

  const handleLayout = (event: LayoutChangeEvent): void => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  return (
    <View className="absolute" style={{ bottom: bottomPosition, left: 16, right: 16 }}>
      <GlassContainer style={styles.glassContainer} glassStyle="regular" onLayout={handleLayout}>
        {containerWidth > 0 && (
          <TabBarContent
            containerWidth={containerWidth}
            leftTabs={leftTabs}
            rightTabs={rightTabs}
          />
        )}
      </GlassContainer>

      <View pointerEvents="box-none" style={styles.fabWrapper}>
        <View style={styles.fab}>
          <RNPressable
            onPress={() => {
              haptic.impact('medium');
              setSheetVisible(true);
            }}
            style={styles.fabHit}
          >
            <Plus color={colors.white} size={28} strokeWidth={2.5} />
          </RNPressable>
        </View>
      </View>

      <AddIndicatorSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        date={format(new Date(), 'yyyy-MM-dd')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  glassContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 32,
  },
  tabGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bubble: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    backgroundColor: `${colors.primary}20`,
    borderRadius: 24,
  },
  fabWrapper: {
    position: 'absolute',
    top: -FAB_LIFT,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    width: FAB_DIAMETER,
    height: FAB_DIAMETER,
    borderRadius: FAB_RADIUS,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.background,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  fabHit: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: FAB_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
