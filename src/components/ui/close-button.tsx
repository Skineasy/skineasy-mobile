import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Pressable } from '@shared/components/pressable';
import { colors } from '@theme/colors';

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

type CloseButtonProps = {
  onPress: () => void;
  color?: string;
  size?: number;
};

export function CloseButton({
  onPress,
  color = colors.text,
  size = 24,
}: CloseButtonProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={t('common.close')}
      accessibilityRole="button"
      hitSlop={HIT_SLOP}
      haptic="light"
    >
      <X size={size} color={color} />
    </Pressable>
  );
}
