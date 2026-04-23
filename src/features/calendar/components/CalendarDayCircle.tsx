import { Text, View } from 'react-native';

import { CircleProgress } from '@shared/components/circle-progress';
import { Pressable } from '@shared/components/pressable';
import { cn } from '@shared/utils/cn';
import { colors } from '@theme/colors';

const SIZE = 40;
const STROKE_WIDTH = 5;
const ROW_PADDING = 0;

type CalendarDayCircleProps = {
  day: number;
  score: number;
  state: string;
  isSelected: boolean;
  onPress: () => void;
};

export function CalendarDayCircle({
  day,
  score,
  state,
  isSelected,
  onPress,
}: CalendarDayCircleProps): React.ReactElement {
  const isDisabled = state === 'disabled';
  const isToday = state === 'today';
  const showRing = score > 0 && !isDisabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      haptic={isDisabled ? false : 'light'}
      className="items-center justify-center"
      style={{
        width: SIZE,
        height: SIZE,
        paddingVertical: ROW_PADDING,
      }}
    >
      <View className="items-center justify-center" style={{ width: SIZE, height: SIZE }}>
        {isSelected ? (
          <View
            className="absolute rounded-full bg-primary"
            style={{ width: SIZE, height: SIZE }}
          />
        ) : null}

        {showRing ? (
          <View className="absolute">
            <CircleProgress
              size={SIZE}
              strokeWidth={STROKE_WIDTH}
              progress={score}
              color={{ start: colors.primary, end: colors.brownDark }}
              backgroundColor={colors.creamMuted}
            />
          </View>
        ) : null}

        <Text
          className={cn(
            'text-md',
            isSelected && 'text-white font-semibold',
            !isSelected && isToday && 'text-primary font-semibold',
            !isSelected && !isToday && !isDisabled && 'text-text',
            !isSelected && isDisabled && 'text-text-muted',
          )}
        >
          {day}
        </Text>
      </View>
    </Pressable>
  );
}
