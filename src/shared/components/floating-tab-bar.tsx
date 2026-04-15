import { useTabTrigger } from 'expo-router/ui';
import { BookOpen, Home, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassContainer } from '@shared/components/glass-container';
import { useTabBarContext } from '@shared/contexts/TabBarContext';
import { useUserStore } from '@shared/stores/user.store';
import { colors } from '@theme/colors';

export const SPRING_CONFIG = { damping: 60, stiffness: 300 };

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

const BUBBLE_PADDING = 8;

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
      <Icon color={color} size={24} />
      <Text className="font-medium text-xs" style={{ color }}>
        {t(tab.labelKey)}
      </Text>
    </Pressable>
  );
}

type TabBarContentProps = {
  containerWidth: number;
};

function TabBarContent({ containerWidth }: TabBarContentProps): React.ReactElement {
  const { activeIndex } = useTabBarContext();
  const hasRoutineAccess = useUserStore((state) => state.hasRoutineAccess);
  const tabs = hasRoutineAccess ? [...BASE_TABS, ROUTINE_TAB] : BASE_TABS;
  const tabCount = tabs.length;
  const tabWidth = containerWidth / tabCount;
  const bubbleWidth = tabWidth - BUBBLE_PADDING * 2;

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: activeIndex.value * tabWidth + BUBBLE_PADDING }],
    width: bubbleWidth,
  }));

  return (
    <>
      <Animated.View style={[styles.bubble, bubbleStyle]} />
      {tabs.map((tab) => (
        <TabButton key={tab.name} tab={tab} />
      ))}
    </>
  );
}

export function FloatingTabBar(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [containerWidth, setContainerWidth] = useState(0);

  const bottomPosition = Math.max(insets.bottom, 16);

  const handleLayout = (event: LayoutChangeEvent): void => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  return (
    <View className="absolute" style={{ bottom: bottomPosition, left: 16, right: 16 + 48 + 8 }}>
      <GlassContainer style={styles.glassContainer} glassStyle="regular" onLayout={handleLayout}>
        {containerWidth > 0 && <TabBarContent containerWidth={containerWidth} />}
      </GlassContainer>
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
  bubble: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    backgroundColor: `${colors.primary}20`,
    borderRadius: 24,
  },
});
