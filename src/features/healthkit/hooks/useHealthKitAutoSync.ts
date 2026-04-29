import { useEffect, useRef } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { useHealthKitSync } from '@features/healthkit/hooks/useHealthKitSync';
import { useHealthKitStore } from '@shared/stores/healthkit.store';
import { logger } from '@shared/utils/logger';

/**
 * Auto-sync HealthKit data on app open and when returning to foreground.
 * Conditions: iOS, authenticated, HealthKit authorized, not already syncing,
 * and ≥1h since last sync (or never synced).
 */
export function useHealthKitAutoSync(isAuthenticated: boolean): void {
  const { sync, isSyncing, isAuthorized } = useHealthKitSync();
  const lastSyncDateRef = useRef<string | null>(useHealthKitStore.getState().lastSyncDate);
  const hasAttemptedSync = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    return useHealthKitStore.subscribe((state) => {
      lastSyncDateRef.current = state.lastSyncDate;
    });
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const tryAutoSync = (reason: string): void => {
      if (!isAuthenticated || !isAuthorized) return;
      if (isSyncing) return;

      const last = lastSyncDateRef.current;
      if (last && !shouldSyncBasedOnTime(last)) return;

      logger.info('[HealthKit] Auto-syncing', { reason });
      void sync(7);
    };

    if (!hasAttemptedSync.current) {
      hasAttemptedSync.current = true;
      tryAutoSync('app-open');
    }

    const subscription = AppState.addEventListener('change', (next) => {
      const previous = appStateRef.current;
      appStateRef.current = next;
      if (previous.match(/inactive|background/) && next === 'active') {
        tryAutoSync('foreground');
      }
    });

    return () => subscription.remove();
    // sync/isSyncing intentionally excluded — sync identity is unstable; the
    // 1h gate + isSyncing read inside `tryAutoSync` already prevent dupes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAuthorized]);
}

/** Sync if more than 1 hour has passed since last sync. */
function shouldSyncBasedOnTime(lastSyncDate: string): boolean {
  const lastSync = new Date(lastSyncDate);
  const now = new Date();
  const hoursSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
  return hoursSinceLastSync >= 1;
}
