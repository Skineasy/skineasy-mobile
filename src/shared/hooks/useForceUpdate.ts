import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';

import { getAppConfig } from '@shared/data/app-config.api';
import { logger } from '@shared/utils/logger';

interface UseForceUpdateReturn {
  needsUpdate: boolean;
  openStore: () => void;
}

/**
 * Hook that checks if app version is below minimum required version.
 * If outdated, returns `needsUpdate: true` and `openStore` to redirect to store.
 * Fails open (continues normally) if check fails.
 */
export function useForceUpdate(): UseForceUpdateReturn {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [storeUrl, setStoreUrl] = useState<string | null>(null);

  useEffect(() => {
    const checkVersion = async (): Promise<void> => {
      try {
        const config = await getAppConfig();
        const currentVersion = Constants.expoConfig?.version ?? '0.0.0';

        if (compareVersions(currentVersion, config.minimumVersion) < 0) {
          logger.info('[ForceUpdate] Update required:', {
            current: currentVersion,
            minimum: config.minimumVersion,
          });
          setNeedsUpdate(true);
          setStoreUrl(Platform.OS === 'ios' ? config.storeUrls.ios : config.storeUrls.android);
        }
      } catch (error) {
        logger.error('[ForceUpdate] Failed to check version:', error);
        // Fail open - don't block if check fails
      }
    };

    checkVersion();
  }, []);

  const openStore = (): void => {
    if (storeUrl) {
      Linking.openURL(storeUrl);
    } else {
      Alert.alert(
        'An error occured',
        `Please open ${Platform.OS === 'ios' ? 'App Store' : 'Google Play Store'} to update the app to the latest version to continue.`,
      );
    }
  };

  return { needsUpdate, openStore };
}

/**
 * Compare two semver strings.
 * Returns -1 if a < b, 0 if a === b, 1 if a > b.
 */
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }

  return 0;
}
