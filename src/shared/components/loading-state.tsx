import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';

import { colors } from '@theme/colors';

interface LoadingStateProps {
  labelKey?: string;
}

export function LoadingState({ labelKey }: LoadingStateProps): React.ReactElement {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center gap-3">
      <ActivityIndicator size="large" color={colors.primary} />
      {labelKey ? <Text className="text-body text-neutral-500">{t(labelKey)}</Text> : null}
    </View>
  );
}
