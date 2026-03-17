import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { Calendar, type DateData } from 'react-native-calendars';

import { useMonthScores } from '@features/calendar/hooks/useMonthScores';
import { BottomSheet } from '@shared/components/bottom-sheet';
import { colors } from '@theme/colors';

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

export function CalendarModal({
  visible,
  onClose,
  selectedDate,
  onDateSelect,
}: CalendarModalProps): React.ReactElement {
  const todayDate = new Date();
  const today = format(todayDate, 'yyyy-MM-dd');
  const [visibleMonth, setVisibleMonth] = useState({
    year: todayDate.getFullYear(),
    month: todayDate.getMonth(),
  });

  const { markedDates } = useMonthScores(visibleMonth.year, visibleMonth.month);

  const finalMarkedDates = useMemo(() => {
    const result: Record<string, object> = {};

    // Convert multi-dot format to simple dot format and filter score=0
    for (const [date, value] of Object.entries(markedDates)) {
      const dots = (value as { dots: { color: string }[] }).dots;
      const dotColor = dots?.[0]?.color;
      if (dotColor && dotColor !== colors.textMuted) {
        result[date] = {
          marked: true,
          dotColor,
        };
      }
    }

    // Add selected date marker
    result[selectedDate] = {
      ...result[selectedDate],
      selected: true,
      selectedColor: colors.primary,
    };

    return result;
  }, [markedDates, selectedDate]);

  const handleDayPress = (day: DateData): void => {
    onDateSelect(day.dateString);
    onClose();
  };

  const handleMonthChange = (month: DateData): void => {
    setVisibleMonth({ year: month.year, month: month.month - 1 });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} backgroundColor={colors.background}>
      <Calendar
        current={selectedDate}
        onDayPress={handleDayPress}
        onMonthChange={handleMonthChange}
        maxDate={today}
        enableSwipeMonths
        markingType="dot"
        markedDates={finalMarkedDates}
        theme={{
          backgroundColor: colors.background,
          calendarBackground: colors.background,
          textSectionTitleColor: colors.textMuted,
          dayTextColor: colors.text,
          todayTextColor: colors.primary,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: colors.white,
          monthTextColor: colors.brownDark,
          textMonthFontWeight: 'bold',
          textDayFontSize: 14,
          textMonthFontSize: 17,
          textDisabledColor: colors.textMuted,
          arrowColor: colors.brownDark,
        }}
      />
    </BottomSheet>
  );
}
