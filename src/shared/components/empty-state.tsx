import type { LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from '@shared/components/button';
import { colors } from '@theme/colors';

interface EmptyStateProps {
  icon?: LucideIcon;
  titleKey: string;
  descriptionKey?: string;
  actionKey?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  titleKey,
  descriptionKey,
  actionKey,
  onAction,
}: EmptyStateProps): React.ReactElement {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center gap-4 px-6">
      {Icon ? <Icon size={48} color={colors.textLight} /> : null}
      <Text className="text-h3 text-center text-neutral-700">{t(titleKey)}</Text>
      {descriptionKey ? (
        <Text className="text-body text-center text-neutral-500">{t(descriptionKey)}</Text>
      ) : null}
      {actionKey && onAction ? (
        <Button title={t(actionKey)} onPress={onAction} variant="primary" haptic="medium" />
      ) : null}
    </View>
  );
}
