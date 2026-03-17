/**
 * Sport List Screen
 *
 * Shows:
 * - Semi-circular progress toward daily goal
 * - List of logged activities
 * - Add button to create new activity
 */

import { parseISO } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, Dumbbell } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { DateNavigation } from '@features/dashboard/components/DateNavigation';
import { useSportEntries } from '@features/journal/hooks/useJournal';
import { Button } from '@shared/components/button';
import { Card } from '@shared/components/card';
import { CircleProgress } from '@shared/components/circle-progress';
import { Pressable } from '@shared/components/pressable';
import { ScreenHeader } from '@shared/components/screen-header';
import type { SportEntry } from '@shared/types/journal.types';
import { toUTCDateString } from '@shared/utils/date';
import { getSportGoal } from '@shared/utils/storage';
import { colors } from '@theme/colors';

const CIRCLE_SIZE = 250;
const CIRCLE_STROKE = 20;

export default function SportListScreen(): React.ReactElement {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (params.date) {
      return parseISO(params.date);
    }
    return new Date();
  });

  const [goalMinutes, setGoalMinutes] = useState(120);

  useEffect(() => {
    getSportGoal().then(setGoalMinutes);
  }, []);

  const dateString = toUTCDateString(selectedDate);
  const { data: sportEntries = [] } = useSportEntries(dateString);

  const totalMinutes = sportEntries.reduce((sum, entry) => sum + entry.duration, 0);
  const progress = Math.min((totalMinutes / goalMinutes) * 100, 100);
  const goalHours = goalMinutes / 60;

  const handleDateChange = (date: Date): void => {
    setSelectedDate(date);
  };

  const handleActivityPress = (entry: SportEntry): void => {
    router.push({
      pathname: '/journal/sport/[id]',
      params: { id: String(entry.id), date: dateString },
    });
  };

  const handleAddPress = (): void => {
    router.push({
      pathname: '/journal/sport/new',
      params: { date: dateString },
    });
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} ${t('journal.sport.minutes')}`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };

  return (
    <ScreenHeader title={t('journal.sport.listTitle')} icon={Dumbbell} childrenClassName="gap-6">
      {/* Date Navigation */}
      <DateNavigation selectedDate={selectedDate} onDateChange={handleDateChange} />

      {/* Progress Circle */}
      <View className="items-center py-4">
        <View
          className="relative items-center justify-center"
          style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
        >
          <CircleProgress
            size={CIRCLE_SIZE}
            strokeWidth={CIRCLE_STROKE}
            progress={progress}
            color={{ start: colors.primary, end: colors.brownDark }}
            backgroundColor={colors.creamMuted}
          />
          <View className="absolute items-center justify-center">
            <Text className="text-base text-text-muted mb-2">{t('journal.sport.time')}</Text>
            <Text className="text-4xl font-bold text-brown-dark">
              {formatDuration(totalMinutes)}
            </Text>
            <Text className="text-sm text-text-muted">
              {t('journal.sport.goalFormat', { hours: goalHours })}
            </Text>
          </View>
        </View>
      </View>

      {/* Activity List */}
      <View className="gap-3">
        {sportEntries.map((entry) => (
          <Pressable key={entry.id} onPress={() => handleActivityPress(entry)} haptic="light">
            <Card padding="md" className="flex-row items-center justify-between">
              <View className="gap-1">
                <Text className="text-sm text-text-muted">{t('journal.sport.title')}</Text>
                <Text className="text-lg font-semibold text-text">
                  {t(`journal.sport.activities.${entry.sportType.name}`)} ({entry.duration}{' '}
                  {t('journal.sport.minutes')})
                </Text>
              </View>
              <ChevronRight size={24} color={colors.textMuted} />
            </Card>
          </Pressable>
        ))}
      </View>

      {/* Add Button */}
      <Button title={t('journal.sport.add')} onPress={handleAddPress} />
    </ScreenHeader>
  );
}
