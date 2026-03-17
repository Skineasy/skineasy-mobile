import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef } from 'react';

import { useNetworkStore } from '@shared/stores/network.store';
import { haptic } from '@shared/utils/haptic';
import { logger } from '@shared/utils/logger';

/**
 * Hook that subscribes to network state changes and updates the network store.
 * Should be called once at the app root level.
 *
 * Features:
 * - Subscribes to NetInfo on mount
 * - Updates network store on state changes
 * - Triggers haptic feedback on connectivity transitions
 */
export function useNetworkStatus() {
  const setNetworkState = useNetworkStore((state) => state.setNetworkState);
  const previousConnected = useRef<boolean | null>(null);

  useEffect(() => {
    logger.info('[Network] Subscribing to network state changes...');
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable;

      logger.info('[Network] State changed:', {
        isConnected,
        isInternetReachable,
        type: state.type,
      });

      // Trigger haptic feedback on connectivity change (after initial load)
      if (previousConnected.current !== null && previousConnected.current !== isConnected) {
        if (isConnected) {
          haptic.success();
        } else {
          haptic.error();
        }
      }

      previousConnected.current = isConnected;
      setNetworkState(isConnected, isInternetReachable);
    });

    return () => {
      unsubscribe();
    };
  }, [setNetworkState]);
}
