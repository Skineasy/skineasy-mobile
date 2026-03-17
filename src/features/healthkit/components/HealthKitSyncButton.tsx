import * as Device from 'expo-device';
import { formatDistanceToNow } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { Activity } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, Text, View } from 'react-native';

import { toast } from '@lib/toast';

import { useHealthKitSync } from '@features/healthkit/hooks/useHealthKitSync';
import { Pressable } from '@shared/components/pressable';
import { colors } from '@theme/colors';

export function HealthKitSyncButton(): React.ReactElement | null {
  const { t, i18n } = useTranslation();
  const { sync, isSyncing, lastSyncDate, isAuthorized, requestAuthorization } = useHealthKitSync();

  // Only show on iOS
  if (Platform.OS !== 'ios') {
    return null;
  }

  const handlePress = async (): Promise<void> => {
    // Check if running in simulator
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

  const formatLastSync = (): string => {
    if (!lastSyncDate) return t('healthkit.neverSynced');
    const date = new Date(lastSyncDate);
    const locale = i18n.language === 'fr' ? fr : enUS;
    return formatDistanceToNow(date, { addSuffix: true, locale });
  };

  return (
    <Pressable
      onPress={handlePress}
      haptic="medium"
      disabled={isSyncing}
      className="flex-row items-center justify-between p-4"
    >
      <View className="flex-row items-center gap-3 flex-1">
        <Activity size={20} color={colors.primary} />
        <View className="flex-1">
          <Text className="text-base text-text">{t('healthkit.syncButton')}</Text>
          <Text className="text-xs text-textMuted">
            {isAuthorized ? formatLastSync() : t('healthkit.notAuthorized')}
          </Text>
        </View>
      </View>
      {isSyncing && <ActivityIndicator size="small" color={colors.primary} />}
    </Pressable>
  );
}
