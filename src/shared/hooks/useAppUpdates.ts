import * as Sentry from '@sentry/react-native';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';

import { logger } from '@shared/utils/logger';

/**
 * Hook that checks for, downloads, and applies OTA updates.
 *
 * Behavior:
 * - On launch: App waits up to 30s for update (fallbackToCacheTimeout)
 * - If update downloaded while running: Auto-reload to apply immediately
 * - Skipped in __DEV__ mode
 * - Errors reported to Sentry
 * - WiFi-only check configured in app.config.ts
 */
export function useAppUpdates(): void {
  const { isUpdateAvailable, isUpdatePending } = Updates.useUpdates();

  // Auto-reload when update is ready
  useEffect(() => {
    if (__DEV__) {
      return;
    }

    if (isUpdatePending) {
      logger.info('[Updates] Update pending, reloading app...');
      Updates.reloadAsync().catch((error: unknown) => {
        logger.error('[Updates] Failed to reload:', error);
        Sentry.captureException(error, {
          tags: { feature: 'ota-updates' },
        });
      });
    }
  }, [isUpdatePending]);

  // Download available updates
  useEffect(() => {
    if (__DEV__) {
      return;
    }

    if (isUpdateAvailable && !isUpdatePending) {
      logger.info('[Updates] New update available, downloading...');
      Updates.fetchUpdateAsync()
        .then(() => {
          logger.info('[Updates] Update downloaded');
        })
        .catch((error: unknown) => {
          logger.error('[Updates] Failed to download update:', error);
          Sentry.captureException(error, {
            tags: { feature: 'ota-updates' },
          });
        });
    }
  }, [isUpdateAvailable, isUpdatePending]);
}

/**
 * Manually check for updates, download, and reload.
 * Intended for dev/debug use only.
 *
 * @returns Result message
 */
export async function checkAndApplyUpdate(): Promise<string> {
  try {
    logger.info('[Updates] Manual check triggered');
    const update = await Updates.checkForUpdateAsync();

    if (!update.isAvailable) {
      logger.info('[Updates] No update available');
      return 'No update available';
    }

    logger.info('[Updates] Update found, downloading...');
    await Updates.fetchUpdateAsync();

    logger.info('[Updates] Update downloaded, reloading...');
    await Updates.reloadAsync();

    return 'Update applied';
  } catch (error: unknown) {
    logger.error('[Updates] Manual check failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return `Update failed: ${message}`;
  }
}
