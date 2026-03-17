import { format, isSameDay } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { DayProgressCircle } from '@features/dashboard/components/DayProgressCircle';
import { useWeekScores } from '@features/dashboard/hooks/useWeekScores';
import { Pressable } from '@shared/components/pressable';

interface DayProgressDotsProps {
  onDateSelect?: (date: Date) => void;
}

export function DayProgressDots({ onDateSelect }: DayProgressDotsProps): React.ReactElement {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'fr' ? fr : enUS;
  const currentDay = new Date();
  const weekScores = useWeekScores();

  return (
    <View className="flex-row justify-between px-4 py-2">
      {weekScores.map(({ date, score }, index) => {
        const isToday = isSameDay(date, currentDay);
        const dayLabel = format(date, 'EEEEE', { locale });

        return (
          <Pressable
            key={index}
            onPress={() => onDateSelect?.(date)}
            haptic="light"
            className="items-center gap-1"
          >
            <DayProgressCircle score={score} isToday={isToday} />
            <Text className="text-xs font-medium text-text-muted">{dayLabel.toUpperCase()}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
