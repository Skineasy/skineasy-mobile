import * as Device from 'expo-device';
import { formatDistanceToNowStrict } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { Activity } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, Text, View } from 'react-native';

import { toast } from '@lib/toast';

import { HealthKitDebugSheet } from '@features/healthkit/components/HealthKitDebugSheet';
import { useHealthKitSync } from '@features/healthkit/hooks/useHealthKitSync';
import { Pressable } from '@shared/components/pressable';
import { colors } from '@theme/colors';

export function HealthKitSyncButton(): React.ReactElement | null {
  const { t, i18n } = useTranslation();
  const {
    sync,
    isSyncing,
    lastSyncDate,
    lastReport,
    isAuthorized,
    requestAuthorization,
    resetLastSyncDate,
  } = useHealthKitSync();
  const [debugOpen, setDebugOpen] = useState(false);

  if (Platform.OS !== 'ios') {
    return null;
  }

  const handlePress = async (): Promise<void> => {
    if (!Device.isDevice) {
      toast.error(t('healthkit.simulatorError'));
      return;
    }

    if (!isAuthorized) {
      const authorized = await requestAuthorization();
      if (authorized) {
        await sync();
      }
    } else {
      await sync();
    }
  };

  const handleLongPress = (): void => {
    if (__DEV__) setDebugOpen(true);
  };

  const formatLastSyncShort = (): string | null => {
    if (!lastSyncDate) return null;
    const locale = i18n.language === 'fr' ? fr : enUS;
    return formatDistanceToNowStrict(new Date(lastSyncDate), { addSuffix: true, locale });
  };

  const label = !isAuthorized
    ? t('healthkit.connectButton')
    : isSyncing
      ? t('healthkit.syncingShort')
      : t('healthkit.syncButton');

  const trailing = isAuthorized ? formatLastSyncShort() : null;

  return (
    <>
      <Pressable
        onPress={handlePress}
        onLongPress={__DEV__ ? handleLongPress : undefined}
        haptic="medium"
        disabled={isSyncing}
        className="flex-row items-center justify-between p-4"
      >
        <View className="flex-row items-center gap-3 flex-1">
          <Activity size={20} color={colors.primary} />
          <Text className="text-base text-text">{label}</Text>
        </View>
        {isSyncing ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : trailing ? (
          <Text className="text-xs text-textMuted">{trailing}</Text>
        ) : null}
      </Pressable>
      {__DEV__ && (
        <HealthKitDebugSheet
          visible={debugOpen}
          onClose={() => setDebugOpen(false)}
          report={lastReport}
          isAuthorized={isAuthorized}
          isSyncing={isSyncing}
          onResync={(days) => sync(days)}
          onResetLastSyncDate={resetLastSyncDate}
        />
      )}
    </>
  );
}
