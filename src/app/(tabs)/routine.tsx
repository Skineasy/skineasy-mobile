import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RoutineProcessingState } from '@features/routine/components/RoutineProcessingState';
import RoutineResultsScreen from '@features/routine/screens/RoutineResultsScreen';
import { useUserStore } from '@shared/stores/user.store';

export default function RoutineTab(): React.ReactElement | null {
  const { t } = useTranslation();
  const router = useRouter();
  const routineStatus = useUserStore((state) => state.routineStatus);

  useEffect(() => {
    if (routineStatus === 'none') {
      Alert.alert(t('routine.noRoutineTitle'), t('routine.noRoutineMessage'), [
        { text: t('common.ok'), onPress: () => router.replace('/diagnosis/quiz') },
      ]);
    }
  }, [routineStatus, t, router]);

  if (routineStatus === 'none') {
    return null;
  }

  if (routineStatus === 'processing') {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <RoutineProcessingState />
      </SafeAreaView>
    );
  }

  return <RoutineResultsScreen />;
}
