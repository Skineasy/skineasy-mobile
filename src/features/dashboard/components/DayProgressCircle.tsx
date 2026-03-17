import { Check } from 'lucide-react-native';
import { View } from 'react-native';

import { CircleProgress } from '@shared/components/circle-progress';
import { colors } from '@theme/colors';

const SIZE = 32;
const STROKE_WIDTH = 6;
const ICON_SIZE = 14;
const DOT_SIZE = 6;

type DayProgressCircleProps = {
  score: number; // 0-100
  isToday: boolean;
};

export function DayProgressCircle({ score, isToday }: DayProgressCircleProps): React.ReactElement {
  const isFullScore = score === 100;

  return (
    <View className="items-center justify-center">
      <CircleProgress
        size={SIZE}
        strokeWidth={STROKE_WIDTH}
        progress={score}
        color={{ start: colors.primary, end: !isToday ? colors.brownLight : colors.brownDark }}
        backgroundColor={colors.creamMuted}
      />
      <View className="absolute items-center justify-center">
        {isFullScore ? (
          <Check size={ICON_SIZE} color={colors.brownDark} strokeWidth={3} />
        ) : isToday ? (
          <View
            className="rounded-full bg-brown-dark"
            style={{ width: DOT_SIZE, height: DOT_SIZE }}
          />
        ) : null}
      </View>
    </View>
  );
}
