import * as Device from 'expo-device';
import { formatDistanceToNow } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { Activity } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Platform, Text, View } from 'react-native';

import { toast } from '@lib/toast';

import { HealthKitDebugSheet } from '@features/healthkit/components/HealthKitDebugSheet';
import { useHealthKitSync } from '@features/healthkit/hooks/useHealthKitSync';
import { Pressable } from '@shared/components/pressable';
import type { CategoryReport, SyncReport } from '@shared/types/healthkit.types';
import { colors } from '@theme/colors';

function summaryLine(report: SyncReport): string {
  const cats: Array<[string, CategoryReport]> = [
    ['Sleep', report.sleep],
    ['Workouts', report.workouts],
    ['Stress', report.stress],
    ['Nutrition', report.nutrition],
  ];
  return cats.map(([name, c]) => `${name} ${c.upserted}`).join(' · ');
}

function statusGlyph(report: SyncReport): string {
  const all = [report.sleep, report.workouts, report.stress, report.nutrition];
  if (all.some((c) => c.status === 'error')) return '⚠';
  if (all.every((c) => c.status === 'empty')) return '○';
  return '✓';
}

function isLikelyPermissionDenied(report: SyncReport): boolean {
  const cats = [report.sleep, report.workouts, report.stress, report.nutrition];
  return cats.every((c) => c.fetched === 0 && c.status !== 'error');
}

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
    setDebugOpen(true);
  };

  const formatLastSync = (): string => {
    if (!lastSyncDate) return t('healthkit.neverSynced');
    const date = new Date(lastSyncDate);
    const locale = i18n.language === 'fr' ? fr : enUS;
    return formatDistanceToNow(date, { addSuffix: true, locale });
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
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
            {lastReport && (
              <Text className="text-xs text-textMuted mt-0.5">
                {statusGlyph(lastReport)} {summaryLine(lastReport)}
              </Text>
            )}
            {(!isAuthorized || (lastReport && isLikelyPermissionDenied(lastReport))) && (
              <Text
                className="text-xs text-primary mt-1"
                onPress={() => Linking.openSettings()}
                suppressHighlighting
              >
                {t('healthkit.openSettings')}
              </Text>
            )}
          </View>
        </View>
        {isSyncing && <ActivityIndicator size="small" color={colors.primary} />}
      </Pressable>
      <HealthKitDebugSheet
        visible={debugOpen}
        onClose={() => setDebugOpen(false)}
        report={lastReport}
        isAuthorized={isAuthorized}
        isSyncing={isSyncing}
        onResync={(days) => sync(days)}
        onResetLastSyncDate={resetLastSyncDate}
      />
    </>
  );
}
