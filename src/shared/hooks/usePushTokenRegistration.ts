import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { registerToken } from '@shared/data/push-tokens.api';
import { logger } from '@shared/utils/logger';

async function registerPushToken(): Promise<void> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const { data: token } = await Notifications.getExpoPushTokenAsync();
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  await registerToken(token, platform);
  logger.info('[usePushTokenRegistration] Token registered');
}

export function usePushTokenRegistration(isAuthenticated: boolean): void {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!isAuthenticated) return;

    registerPushToken().catch((err: unknown) => {
      logger.warn('[usePushTokenRegistration] Failed to register token:', err);
    });

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current !== 'active' && nextState === 'active' && isAuthenticated) {
        registerPushToken().catch((err: unknown) => {
          logger.warn('[usePushTokenRegistration] Foreground re-register failed:', err);
        });
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [isAuthenticated]);
}
