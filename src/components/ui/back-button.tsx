import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Pressable } from '@shared/components/pressable';
import { colors } from '@theme/colors';

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

type BackButtonProps = {
  onPress?: () => void;
  color?: string;
  size?: number;
};

export function BackButton({
  onPress,
  color = colors.text,
  size = 28,
}: BackButtonProps): React.ReactElement {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      accessibilityLabel={t('common.back')}
      accessibilityRole="button"
      hitSlop={HIT_SLOP}
      haptic="light"
    >
      <ArrowLeft size={size} color={color} />
    </Pressable>
  );
}
