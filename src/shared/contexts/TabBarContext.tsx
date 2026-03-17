import { createContext, useContext } from 'react';
import { SharedValue } from 'react-native-reanimated';

type TabBarContextValue = {
  activeIndex: SharedValue<number>;
  setActiveIndex: (index: number) => void;
};

export const TabBarContext = createContext<TabBarContextValue | null>(null);

export function useTabBarContext(): TabBarContextValue {
  const context = useContext(TabBarContext);
  if (!context) {
    throw new Error('useTabBarContext must be used within TabBarProvider');
  }
  return context;
}
