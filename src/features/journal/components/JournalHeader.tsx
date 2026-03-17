import { format, parseISO } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { CalendarDays } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Pressable } from '@shared/components/pressable';
import { colors } from '@theme/colors';

interface JournalHeaderProps {
  selectedDate: string;
  onOpenCalendar: () => void;
}

export function JournalHeader({
  selectedDate,
  onOpenCalendar,
}: JournalHeaderProps): React.ReactElement {
  const { t, i18n } = useTranslation();

  const locale = i18n.language === 'fr' ? fr : enUS;
  const dateObj = parseISO(selectedDate);
  const formattedDate = format(dateObj, 'EEEE, MMMM d', { locale });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <Text className="text-xl font-bold text-brown-dark">{capitalizedDate}</Text>
      <Pressable
        onPress={onOpenCalendar}
        haptic="medium"
        className="flex-row items-center gap-2 rounded-full bg-surface px-4 py-2"
      >
        <CalendarDays size={18} color={colors.brownDark} />
        <Text className="text-sm font-medium text-brown-dark">{t('journal.openCalendar')}</Text>
      </Pressable>
    </View>
  );
}
