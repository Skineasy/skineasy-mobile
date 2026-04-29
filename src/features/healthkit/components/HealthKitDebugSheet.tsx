import { useState } from 'react';
import { Linking, ScrollView, Share, Text, View } from 'react-native';

import { BottomSheet } from '@shared/components/bottom-sheet';
import { Pressable } from '@shared/components/pressable';
import { healthkitService } from '@shared/services/healthkit.service';
import type { CategoryReport, SyncReport } from '@shared/types/healthkit.types';
import { colors } from '@theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  report: SyncReport | null;
  isAuthorized: boolean;
  isSyncing: boolean;
  onResync: (days: number) => Promise<void>;
  onResetLastSyncDate: () => Promise<void>;
}

const STATUS_COLOR: Record<CategoryReport['status'], string> = {
  ok: colors.success,
  empty: colors.textMuted,
  error: colors.error,
};

const STATUS_GLYPH: Record<CategoryReport['status'], string> = {
  ok: '●',
  empty: '○',
  error: '×',
};

function CategoryRow({
  name,
  report,
}: {
  name: string;
  report: CategoryReport;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const hasDetails = !!report.details || !!report.error;
  return (
    <Pressable
      onPress={() => hasDetails && setOpen((v) => !v)}
      haptic="light"
      className="border-b border-border py-3"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1">
          <Text style={{ color: STATUS_COLOR[report.status] }} className="text-base font-bold">
            {STATUS_GLYPH[report.status]}
          </Text>
          <Text className="text-base text-text">{name}</Text>
        </View>
        <Text className="text-xs text-textMuted">
          fetched {report.fetched} · upserted {report.upserted}
          {report.failed > 0 ? ` · failed ${report.failed}` : ''}
        </Text>
      </View>
      {open && (
        <View className="mt-2 pl-6">
          {report.error && (
            <Text className="text-xs text-error mb-1" selectable>
              {report.error}
            </Text>
          )}
          {report.details && (
            <Text className="text-xs text-textMuted font-mono" selectable>
              {JSON.stringify(report.details, null, 2)}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

export function HealthKitDebugSheet({
  visible,
  onClose,
  report,
  isAuthorized,
  isSyncing,
  onResync,
  onResetLastSyncDate,
}: Props): React.ReactElement {
  const [probe, setProbe] = useState<Awaited<
    ReturnType<typeof healthkitService.probeNative>
  > | null>(null);
  const [probing, setProbing] = useState(false);

  const handleShare = async (): Promise<void> => {
    if (!report) return;
    await Share.share({ message: JSON.stringify(report, null, 2) });
  };

  const handleProbe = async (): Promise<void> => {
    setProbing(true);
    try {
      const result = await healthkitService.probeNative();
      setProbe(result);
    } finally {
      setProbing(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} height={620} scrollable>
      <ScrollView className="px-4 pb-8 pt-10">
        <Text className="text-lg font-bold text-text mb-2">Apple Health — Debug</Text>

        <View className="bg-surface rounded-md p-3 mb-3">
          <Text className="text-xs text-textMuted">
            Authorization: {isAuthorized ? 'granted' : 'not granted'}
          </Text>
          {report && (
            <>
              <Text className="text-xs text-textMuted">
                Last run: {new Date(report.startedAt).toLocaleString()} ({report.durationMs} ms)
              </Text>
              <Text className="text-xs text-textMuted">
                Range: {report.rangeDays} days · Age: {report.age ?? 'unknown'}
              </Text>
            </>
          )}
        </View>

        {report ? (
          <View className="bg-surface rounded-md px-3 mb-3">
            <CategoryRow name="Sleep" report={report.sleep} />
            <CategoryRow name="Workouts" report={report.workouts} />
            <CategoryRow name="Stress" report={report.stress} />
            <CategoryRow name="Nutrition" report={report.nutrition} />
          </View>
        ) : (
          <Text className="text-sm text-textMuted mb-3">No sync has run yet.</Text>
        )}

        {probe && (
          <View className="bg-surface rounded-md p-3 mb-3">
            <Text className="text-xs font-bold text-text mb-1">Native probe</Text>
            <Text className="text-xs text-textMuted" selectable>
              platform: {probe.platform}
            </Text>
            <Text
              className="text-xs"
              style={{ color: probe.moduleLoaded ? colors.success : colors.error }}
              selectable
            >
              moduleLoaded: {String(probe.moduleLoaded)} ({probe.moduleType})
            </Text>
            <Text
              className="text-xs"
              style={{ color: probe.hasInitFn ? colors.success : colors.error }}
              selectable
            >
              hasInitFn: {String(probe.hasInitFn)}
            </Text>
            <Text
              className="text-xs"
              style={{ color: probe.initError ? colors.error : colors.success }}
              selectable
            >
              initError: {probe.initError ?? 'none'}
            </Text>
          </View>
        )}

        <View className="gap-2">
          <Pressable
            onPress={() => onResync(7)}
            haptic="medium"
            disabled={isSyncing}
            className="bg-primary rounded-md p-3 items-center"
          >
            <Text className="text-white font-medium">Re-sync last 7 days</Text>
          </Pressable>
          <Pressable
            onPress={() => onResync(30)}
            haptic="medium"
            disabled={isSyncing}
            className="bg-primary/80 rounded-md p-3 items-center"
          >
            <Text className="text-white font-medium">Re-sync last 30 days</Text>
          </Pressable>
          <Pressable
            onPress={() => onResetLastSyncDate()}
            haptic="light"
            className="bg-surface border border-border rounded-md p-3 items-center"
          >
            <Text className="text-text">Reset last sync date</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openSettings()}
            haptic="light"
            className="bg-surface border border-border rounded-md p-3 items-center"
          >
            <Text className="text-text">Open iOS Settings → Health</Text>
          </Pressable>
          <Pressable
            onPress={handleProbe}
            haptic="medium"
            disabled={probing}
            className="bg-surface border border-border rounded-md p-3 items-center"
          >
            <Text className="text-text">
              {probing ? 'Probing native module…' : 'Run native probe'}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleShare}
            haptic="light"
            disabled={!report}
            className="bg-surface border border-border rounded-md p-3 items-center"
          >
            <Text className="text-text">Share report JSON</Text>
          </Pressable>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
