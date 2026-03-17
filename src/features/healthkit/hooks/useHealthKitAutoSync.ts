import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useHealthKitSync } from '@features/healthkit/hooks/useHealthKitSync';
import { useHealthKitStore } from '@shared/stores/healthkit.store';
import { logger } from '@shared/utils/logger';

/**
 * Hook to auto-sync HealthKit data when the app opens
 * Only syncs if:
 * - Platform is iOS
 * - User is authenticated
 * - HealthKit is authorized
 * - Not already syncing
 */
export function useHealthKitAutoSync(isAuthenticated: boolean): void {
  const { sync, isSyncing, isAuthorized } = useHealthKitSync();
  const lastSyncDate = useHealthKitStore((state) => state.lastSyncDate);
  const hasAttemptedSync = useRef(false);

  useEffect(() => {
    // Skip if not iOS
    if (Platform.OS !== 'ios') return;

    // Skip if not authenticated or not authorized
    if (!isAuthenticated || !isAuthorized) return;

    // Skip if already syncing or already attempted this session
    if (isSyncing || hasAttemptedSync.current) return;

    // Check if we should sync (once per app open, or if never synced)
    const shouldSync = !lastSyncDate || shouldSyncBasedOnTime(lastSyncDate);

    if (shouldSync) {
      logger.info('[HealthKit] Auto-syncing on app open');
      hasAttemptedSync.current = true;
      // Sync last 7 days of data
      void sync(7);
    }
  }, [isAuthenticated, isAuthorized, isSyncing, lastSyncDate, sync]);
}

/**
 * Determine if we should sync based on last sync time
 * Sync if more than 1 hour has passed since last sync
 */
function shouldSyncBasedOnTime(lastSyncDate: string): boolean {
  const lastSync = new Date(lastSyncDate);
  const now = new Date();
  const hoursSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
  return hoursSinceLastSync >= 1;
}
