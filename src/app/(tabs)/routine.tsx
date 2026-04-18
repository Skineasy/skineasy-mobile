import { AlertCircle, ShoppingCart } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Linking, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resolveRoutine } from '@features/routine/data/resolve-routine.api';
import { RoutineProcessingState } from '@features/routine/components/RoutineProcessingState';
import RoutineResultsScreen from '@features/routine/screens/RoutineResultsScreen';
import { Button } from '@shared/components/button';
import { ENV } from '@shared/config/env';
import { useUserStore } from '@shared/stores/user.store';
import { logger } from '@shared/utils/logger';
import { colors } from '@theme/colors';

function ResolutionShell({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 items-center justify-center px-6">{children}</View>
    </SafeAreaView>
  );
}

export default function RoutineTab(): React.ReactElement | null {
  const { t } = useTranslation();
  const routineResolution = useUserStore((state) => state.routineResolution);
  const setRoutineResolution = useUserStore((state) => state.setRoutineResolution);

  if (!routineResolution) return null;

  if (routineResolution.status === 'response_found_generation_pending') {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <RoutineProcessingState />
      </SafeAreaView>
    );
  }

  if (routineResolution.status === 'ready') {
    return <RoutineResultsScreen />;
  }

  if (routineResolution.status === 'needs_form') {
    return (
      <ResolutionShell>
        <Text className="text-2xl font-bold text-text text-center mb-3">
          {t('routine.resolution.needsForm.title')}
        </Text>
        <Text className="text-base text-textMuted text-center mb-8">
          {t('routine.resolution.needsForm.message')}
        </Text>
        <Button
          title={t('routine.resolution.needsForm.cta')}
          onPress={() => Linking.openURL(`https://form.typeform.com/to/${ENV.TYPEFORM_ID}`)}
          haptic="medium"
        />
      </ResolutionShell>
    );
  }

  if (routineResolution.status === 'needs_purchase') {
    return (
      <ResolutionShell>
        <ShoppingCart size={48} color={colors.primary} strokeWidth={1.5} />
        <Text className="text-2xl font-bold text-text text-center mt-6 mb-3">
          {t('routine.resolution.needsPurchase.title')}
        </Text>
        <Text className="text-base text-textMuted text-center mb-8">
          {t('routine.resolution.needsPurchase.message')}
        </Text>
        <Button
          title={t('routine.resolution.needsPurchase.cta')}
          onPress={() => Linking.openURL(ENV.PRESTASHOP_URL)}
          haptic="medium"
        />
      </ResolutionShell>
    );
  }

  // typeform_unavailable
  const handleRetry = (): void => {
    resolveRoutine()
      .then(setRoutineResolution)
      .catch((err: unknown) => logger.error('[RoutineTab] retry resolveRoutine failed:', err));
  };

  return (
    <ResolutionShell>
      <AlertCircle size={48} color={colors.error} strokeWidth={1.5} />
      <Text className="text-2xl font-bold text-text text-center mt-6 mb-3">
        {t('routine.resolution.typeformUnavailable.title')}
      </Text>
      <Text className="text-base text-textMuted text-center mb-8">
        {t('routine.resolution.typeformUnavailable.message')}
      </Text>
      <Button
        title={t('routine.resolution.typeformUnavailable.retry')}
        onPress={handleRetry}
        haptic="medium"
      />
    </ResolutionShell>
  );
}
