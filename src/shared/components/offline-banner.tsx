import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloudOff, Wifi, WifiOff } from 'lucide-react-native';

import { useNetworkStore } from '@shared/stores/network.store';
import { colors } from '@theme/colors';

const BANNER_HEIGHT = 44;
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
  mass: 0.8,
};

type BannerState = 'hidden' | 'offline' | 'back-online' | 'server-unavailable' | 'server-restored';

/**
 * Connection banner that slides down from the top when connectivity is lost
 * or server is unreachable. Auto-hides with a brief restore message.
 */
export function OfflineBanner() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isConnected = useNetworkStore((state) => state.isConnected);
  const isInternetReachable = useNetworkStore((state) => state.isInternetReachable);
  const isBackendReachable = useNetworkStore((state) => state.isBackendReachable);

  // Offline = device not connected or internet not reachable
  const isOnline = isConnected && isInternetReachable !== false;

  const [bannerState, setBannerState] = useState<BannerState>('hidden');
  const isFirstRender = useRef(true);
  const previousOnline = useRef<boolean | null>(null);
  const previousBackendReachable = useRef<boolean | null>(null);
  const progress = useSharedValue(0);

  // Handle network connectivity changes (device offline)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousOnline.current = isOnline;
      previousBackendReachable.current = isBackendReachable;
      if (!isOnline) {
        setBannerState('offline');
        progress.value = 1;
      } else if (!isBackendReachable) {
        setBannerState('server-unavailable');
        progress.value = 1;
      }
      return;
    }

    // Only react to actual changes
    if (previousOnline.current !== isOnline) {
      previousOnline.current = isOnline;

      if (!isOnline) {
        // Going offline takes priority over server status
        setBannerState('offline');
        progress.value = withSpring(1, SPRING_CONFIG);
      } else if (bannerState === 'offline') {
        // Coming back online
        setBannerState('back-online');
        progress.value = withDelay(
          1500,
          withSpring(0, SPRING_CONFIG, (finished) => {
            if (finished) {
              runOnJS(setBannerState)('hidden');
            }
          }),
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // Handle backend reachability changes (server unavailable)
  useEffect(() => {
    // Skip if offline (offline banner takes priority)
    if (!isOnline) return;
    // Skip first render (handled above)
    if (previousBackendReachable.current === null) {
      previousBackendReachable.current = isBackendReachable;
      return;
    }

    if (previousBackendReachable.current !== isBackendReachable) {
      previousBackendReachable.current = isBackendReachable;

      if (!isBackendReachable) {
        setBannerState('server-unavailable');
        progress.value = withSpring(1, SPRING_CONFIG);
      } else if (bannerState === 'server-unavailable') {
        setBannerState('server-restored');
        progress.value = withDelay(
          1500,
          withSpring(0, SPRING_CONFIG, (finished) => {
            if (finished) {
              runOnJS(setBannerState)('hidden');
            }
          }),
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBackendReachable, isOnline]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [-(BANNER_HEIGHT + insets.top), 0]);

    return {
      transform: [{ translateY }],
      opacity: progress.value,
    };
  });

  if (bannerState === 'hidden') {
    return null;
  }

  const getBannerConfig = () => {
    switch (bannerState) {
      case 'offline':
        return {
          backgroundColor: colors.error,
          Icon: WifiOff,
          message: t('common.offline'),
        };
      case 'back-online':
        return {
          backgroundColor: colors.success,
          Icon: Wifi,
          message: t('common.backOnline'),
        };
      case 'server-unavailable':
        return {
          backgroundColor: colors.warning,
          Icon: CloudOff,
          message: t('common.serverUnavailable'),
        };
      case 'server-restored':
        return {
          backgroundColor: colors.success,
          Icon: Wifi,
          message: t('common.serverRestored'),
        };
      default:
        return {
          backgroundColor: colors.error,
          Icon: WifiOff,
          message: '',
        };
    }
  };

  const { backgroundColor, Icon, message } = getBannerConfig();

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          paddingTop: insets.top,
          height: BANNER_HEIGHT + insets.top,
          backgroundColor,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 4,
        },
        animatedStyle,
      ]}
    >
      <Icon size={18} color="#FFFFFF" strokeWidth={2.5} />
      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>{message}</Text>
    </Animated.View>
  );
}
