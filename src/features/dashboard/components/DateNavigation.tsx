/**
 * Date Navigation Component
 *
 * Simple date navigation with:
 * - Left/right arrows to change day
 * - Smart label (Today, Yesterday, Tomorrow) + day number + month
 */

import { addDays, format, isToday, isTomorrow, isYesterday, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Pressable } from '@shared/components/pressable';
import { cn } from '@shared/utils/cn';
import { colors } from '@theme/colors';

interface DateNavigationProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  className?: string;
}

export function DateNavigation({
  selectedDate,
  onDateChange,
  className,
}: DateNavigationProps): React.ReactElement {
  const { t, i18n } = useTranslation();
  const isFrench = i18n.language === 'fr';

  const handlePrevDay = (): void => {
    onDateChange(subDays(selectedDate, 1));
  };

  const handleNextDay = (): void => {
    onDateChange(addDays(selectedDate, 1));
  };

  const getDateLabel = (): string => {
    if (isToday(selectedDate)) return t('dashboard.today');
    if (isYesterday(selectedDate)) return t('dashboard.yesterday');
    if (isTomorrow(selectedDate)) return t('dashboard.tomorrow');
    const dayName = format(selectedDate, 'EEEE', { locale: isFrench ? fr : undefined });
    return dayName.charAt(0).toUpperCase() + dayName.slice(1);
  };

  const dayNumber = format(selectedDate, 'd');
  const monthName = format(selectedDate, 'MMMM', { locale: isFrench ? fr : undefined });

  return (
    <View className={cn('flex-row items-center justify-between', className)}>
      {/* Previous Day */}
      <Pressable
        onPress={handlePrevDay}
        haptic="light"
        className="w-10 h-10 items-center justify-center"
        accessibilityLabel={t('dashboard.navigation.previousDay')}
      >
        <ChevronLeft size={24} color={colors.textMuted} />
      </Pressable>

      {/* Date Display */}
      <View className="flex-row items-baseline gap-2">
        <Text className="text-xl font-bold text-primaryDark">{getDateLabel()}</Text>
        <View className="flex-row items-baseline">
          <Text className="text-text-muted font-light">{dayNumber + ' ' + monthName}</Text>
        </View>
      </View>

      {/* Next Day - disabled if today */}
      <Pressable
        onPress={handleNextDay}
        haptic="light"
        disabled={isToday(selectedDate)}
        className={cn(
          'w-10 h-10 items-center justify-center',
          isToday(selectedDate) && 'opacity-30',
        )}
        accessibilityLabel={t('dashboard.navigation.nextDay')}
      >
        <ChevronRight size={24} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}
