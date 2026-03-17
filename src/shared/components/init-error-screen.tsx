import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from '@shared/components/button';

type InitErrorScreenProps = {
  onRetry: () => void;
};

export function InitErrorScreen({ onRetry }: InitErrorScreenProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center px-6 bg-background">
      <Text className="text-xl font-bold text-text mb-2">{t('common.error')}</Text>
      <Text className="text-base text-textMuted text-center mb-6">
        {t('common.initErrorDescription')}
      </Text>
      <Button title={t('common.retry')} onPress={onRetry} haptic="medium" />
    </View>
  );
}
