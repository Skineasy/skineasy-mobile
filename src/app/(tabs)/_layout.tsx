import { Redirect } from 'expo-router';
import {
  TabList,
  Tabs,
  TabsDescriptor,
  TabSlot,
  TabsSlotRenderOptions,
  TabTrigger,
} from 'expo-router/ui';
import { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { FloatingTabBar, SPRING_CONFIG } from '@shared/components/floating-tab-bar';
import { TabBarContext, useTabBarContext } from '@shared/contexts/TabBarContext';
import { useAuthStore } from '@shared/stores/auth.store';

// Map route names to visual tab indices (must match FloatingTabBar TABS order)
const TAB_INDEX_MAP: Record<string, number> = {
  index: 0,
  journal: 1,
  routine: 2,
};

export default function TabsLayout(): React.ReactElement | null {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { width } = useWindowDimensions();
  const activeIndex = useSharedValue(0);

  const setActiveIndex = useCallback(
    (index: number) => {
      // eslint-disable-next-line react-hooks/immutability
      activeIndex.value = withSpring(index, SPRING_CONFIG);
    },
    [activeIndex],
  );

  const contextValue = useMemo(
    () => ({ activeIndex, setActiveIndex }),
    [activeIndex, setActiveIndex],
  );

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const renderTabScreen = (
    descriptor: TabsDescriptor,
    { isFocused, loaded }: TabsSlotRenderOptions,
  ): React.ReactElement | null => {
    if (!loaded && !isFocused) {
      return null;
    }

    // Use route name to get visual index (expo-router index is alphabetical by filename)
    const visualIndex = TAB_INDEX_MAP[descriptor.route.name] ?? 0;

    return (
      <AnimatedScreen
        key={descriptor.route.key}
        index={visualIndex}
        isFocused={isFocused}
        width={width}
      >
        {descriptor.render()}
      </AnimatedScreen>
    );
  };

  return (
    <TabBarContext.Provider value={contextValue}>
      <View className="flex-1">
        <Tabs>
          <TabSlot renderFn={renderTabScreen} detachInactiveScreens={false} />
          <TabList style={{ display: 'none' }}>
            <TabTrigger name="index" href="/" />
            <TabTrigger name="journal" href="/journal" />
            <TabTrigger name="routine" href="/routine" />
          </TabList>
          <FloatingTabBar />
        </Tabs>
      </View>
    </TabBarContext.Provider>
  );
}

type AnimatedScreenProps = {
  index: number;
  isFocused: boolean;
  width: number;
  children: React.ReactNode;
};

function AnimatedScreen({
  index,
  isFocused,
  width,
  children,
}: AnimatedScreenProps): React.ReactElement {
  const { activeIndex, setActiveIndex } = useTabBarContext();

  useEffect(() => {
    if (isFocused) {
      setActiveIndex(index);
    }
  }, [isFocused, index, setActiveIndex]);

  const animatedStyle = useAnimatedStyle(() => {
    const offset = (index - activeIndex.value) * width;
    return {
      transform: [{ translateX: offset }],
    };
  });

  return <Animated.View style={[styles.screen, animatedStyle]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
  },
});
