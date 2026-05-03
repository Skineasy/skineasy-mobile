import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { storage } from '@lib/storage';
import { useHealthKitStore } from '@shared/stores/healthkit.store';

const DISMISS_KEY = 'hk_nudge_dismissed';
type DismissValue = 'later' | 'never';

export function useHealthBannerVisible(): {
  visible: boolean;
  dismissLater: () => void;
  dismissNever: () => void;
} {
  const isAuthorized = useHealthKitStore((s) => s.isAuthorized);
  const lastSyncDate = useHealthKitStore((s) => s.lastSyncDate);
  const [dismissed, setDismissed] = useState<boolean>(true);

  useEffect(() => {
    const value = storage.getString(DISMISS_KEY) as DismissValue | undefined;
    if (value === 'later') {
      storage.remove(DISMISS_KEY);
      setDismissed(false);
    } else if (value === 'never') {
      setDismissed(true);
    } else {
      setDismissed(false);
    }
  }, []);

  const visible = Platform.OS === 'ios' && !isAuthorized && lastSyncDate === null && !dismissed;

  const dismissLater = (): void => {
    storage.set(DISMISS_KEY, 'later');
    setDismissed(true);
  };

  const dismissNever = (): void => {
    storage.set(DISMISS_KEY, 'never');
    setDismissed(true);
  };

  return { visible, dismissLater, dismissNever };
}
