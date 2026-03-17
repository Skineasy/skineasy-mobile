import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { CircleProgress } from '@shared/components/circle-progress';
import { colors } from '@theme/colors';

const SIZE = 48;
const STROKE_WIDTH = 6;

interface JournalScoreBadgeProps {
  score: number;
}

export function JournalScoreBadge({ score }: JournalScoreBadgeProps): React.ReactElement {
  const { t } = useTranslation();
  const isFullScore = score === 100;

  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <View className="items-center justify-center">
        <CircleProgress
          size={SIZE}
          strokeWidth={STROKE_WIDTH}
          progress={score}
          color={{ start: colors.primary, end: colors.brownDark }}
          backgroundColor={colors.creamMuted}
        />
        <View className="absolute items-center justify-center">
          {isFullScore ? (
            <Check size={18} color={colors.brownDark} strokeWidth={3} />
          ) : (
            <Text className="text-sm font-bold text-brown-dark">{score}</Text>
          )}
        </View>
      </View>
      <Text className="text-sm text-text-muted">{t('journal.skinScore')}</Text>
    </View>
  );
}
