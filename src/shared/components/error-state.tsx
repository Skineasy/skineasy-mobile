import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from '@shared/components/button';

interface ErrorStateProps {
  messageKey: string;
  onRetry?: () => void;
}

export function ErrorState({ messageKey, onRetry }: ErrorStateProps): React.ReactElement {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center gap-4 px-6">
      <Text className="text-body text-center text-neutral-700">{t(messageKey)}</Text>
      {onRetry ? (
        <Button title={t('common.retry')} onPress={onRetry} variant="outline" haptic="medium" />
      ) : null}
    </View>
  );
}
