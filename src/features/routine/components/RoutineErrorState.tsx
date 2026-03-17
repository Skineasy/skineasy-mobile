import { AlertCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { colors } from '@theme/colors';

export function RoutineErrorState() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center px-4 py-20">
      <View className="bg-error/10 rounded-full p-6 mb-6">
        <AlertCircle size={48} color={colors.error} />
      </View>
      <Text className="text-xl font-bold text-text text-center mb-2">{t('common.error')}</Text>
      <Text className="text-base text-textMuted text-center">{t('routine.loadError')}</Text>
    </View>
  );
}
