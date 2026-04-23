import { useQuery } from '@tanstack/react-query';
import { Droplets, Dumbbell, Moon, Plus, Search, Utensils, Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, Text, View } from 'react-native';

import { getEntriesByDateRange } from '@features/journal/data/entries.api';
import { Button } from '@shared/components/button';
import { Card } from '@shared/components/card';
import { queryKeys } from '@shared/config/queryKeys';
import type {
  MealEntry,
  ObservationEntry,
  SleepEntry,
  SportEntry,
  StressEntry,
} from '@shared/types/journal.types';
import { colors } from '@theme/colors';

interface CalendarDayDetailProps {
  date: string;
  onAddEntry?: () => void;
}

const STRESS_LEVEL_KEYS: Record<number, string> = {
  1: 'minimal',
  2: 'mild',
  3: 'moderate',
  4: 'high',
  5: 'intense',
};

function SleepDetail({ entry }: { entry?: SleepEntry }): React.ReactElement | null {
  const { t } = useTranslation();

  if (!entry) return null;

  const hours = Math.floor(entry.hours);
  const minutes = Math.round((entry.hours % 1) * 60);
  const timeStr = `${hours}h${minutes.toString().padStart(2, '0')}`;

  return (
    <Card padding="md" className="gap-2">
      <View className="flex-row items-center gap-2">
        <Moon size={20} color={colors.brownDark} />
        <Text className="font-semibold text-brown-dark">{t('journal.sectionSleep')}</Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-text">{t('journal.sleep.hours')}</Text>
        <Text className="text-lg font-bold text-text">{timeStr}</Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-text">{t('journal.sleep.quality.label')}</Text>
        <Text className="text-lg font-bold text-text">{entry.quality}/5</Text>
      </View>
    </Card>
  );
}

function MealsDetail({ entries }: { entries: MealEntry[] }): React.ReactElement | null {
  const { t } = useTranslation();

  if (entries.length === 0) return null;

  return (
    <Card padding="md" className="gap-3">
      <View className="flex-row items-center gap-2">
        <Utensils size={20} color={colors.brownDark} />
        <Text className="font-semibold text-brown-dark">{t('journal.sectionNutrition')}</Text>
        <Text className="text-text-muted">({entries.length})</Text>
      </View>
      {entries.map((meal) => (
        <View key={meal.id} className="gap-2 border-t border-border pt-2">
          <View className="flex-row items-center justify-between">
            <Text className="font-medium text-text">
              {meal.food_name || t('journal.nutrition.meal')}
            </Text>
            {meal.meal_type && (
              <Text className="text-sm text-text-muted">
                {t(`dashboard.summary.mealType.${meal.meal_type}`)}
              </Text>
            )}
          </View>
          {meal.photo_url && (
            <Image
              source={{ uri: meal.photo_url }}
              className="w-full h-32 rounded-lg"
              resizeMode="cover"
            />
          )}
          {meal.note && <Text className="text-sm text-text-muted">{meal.note}</Text>}
        </View>
      ))}
    </Card>
  );
}

function SportsDetail({ entries }: { entries: SportEntry[] }): React.ReactElement | null {
  const { t } = useTranslation();

  if (entries.length === 0) return null;

  return (
    <Card padding="md" className="gap-3">
      <View className="flex-row items-center gap-2">
        <Dumbbell size={20} color={colors.brownDark} />
        <Text className="font-semibold text-brown-dark">{t('journal.sectionSport')}</Text>
        <Text className="text-text-muted">({entries.length})</Text>
      </View>
      {entries.map((sport) => (
        <View
          key={sport.id}
          className="flex-row items-center justify-between border-t border-border pt-2"
        >
          <View className="gap-1">
            <Text className="font-medium text-text">
              {t(`journal.sport.activities.${sport.sportType?.name || 'other'}`)}
            </Text>
            <Text className="text-sm text-text-muted">
              {t('journal.sport.intensity.label')}: {sport.intensity}/5
            </Text>
          </View>
          <Text className="text-lg font-bold text-text">{sport.duration} min</Text>
        </View>
      ))}
    </Card>
  );
}

function StressDetail({ entry }: { entry?: StressEntry }): React.ReactElement | null {
  const { t } = useTranslation();

  if (!entry) return null;

  const levelKey = STRESS_LEVEL_KEYS[entry.level];

  return (
    <Card padding="md" className="gap-2">
      <View className="flex-row items-center gap-2">
        <Zap size={20} color={colors.brownDark} />
        <Text className="font-semibold text-brown-dark">{t('journal.sectionStress')}</Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-text">{t('journal.stress.level.label')}</Text>
        <Text className="text-lg font-bold text-text">{t(`journal.stress.level.${levelKey}`)}</Text>
      </View>
      {entry.note && <Text className="text-sm text-text-muted">{entry.note}</Text>}
    </Card>
  );
}

function ObservationsDetail({ entry }: { entry?: ObservationEntry }): React.ReactElement | null {
  const { t } = useTranslation();

  if (!entry) return null;

  const total = entry.positives.length + entry.negatives.length;
  if (total === 0) return null;

  return (
    <Card padding="md" className="gap-2">
      <View className="flex-row items-center gap-2">
        <Search size={20} color={colors.brownDark} />
        <Text className="font-semibold text-brown-dark">{t('journal.sectionObservations')}</Text>
      </View>
      {entry.positives.length > 0 && (
        <View className="flex-row flex-wrap gap-1">
          {entry.positives.map((key) => (
            <View key={key} className="bg-success/10 rounded-full px-3 py-1">
              <Text className="text-sm text-success">
                {t(`journal.observations.positive.${key}`)}
              </Text>
            </View>
          ))}
        </View>
      )}
      {entry.negatives.length > 0 && (
        <View className="flex-row flex-wrap gap-1">
          {entry.negatives.map((key) => (
            <View key={key} className="bg-error/10 rounded-full px-3 py-1">
              <Text className="text-sm text-error">
                {t(`journal.observations.negative.${key}`)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

function EmptyState({ onAddEntry }: { onAddEntry?: () => void }): React.ReactElement {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-20 h-20 rounded-full bg-surface items-center justify-center mb-6">
        <Droplets size={40} color={colors.primary} strokeWidth={1.5} />
      </View>
      <Text className="text-xl font-semibold text-brown-dark text-center mb-2">
        {t('journal.emptyTitle')}
      </Text>
      <Text className="text-base text-text-muted text-center mb-8">
        {t('journal.emptySubtitle')}
      </Text>
      {onAddEntry && (
        <Button title={t('journal.addEntry')} onPress={onAddEntry} iconLeft={Plus} fitContent />
      )}
    </View>
  );
}

export function CalendarDayDetail({
  date,
  onAddEntry,
}: CalendarDayDetailProps): React.ReactElement {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.journalEntriesRange(date, date),
    queryFn: () => getEntriesByDateRange(date, date),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-text-muted">...</Text>
      </View>
    );
  }

  const sleeps = data?.sleeps ?? [];
  const meals = data?.meals ?? [];
  const sports = data?.sports ?? [];
  const stresses = data?.stresses ?? [];
  const observations = data?.observations ?? [];

  const hasData =
    sleeps.length > 0 ||
    meals.length > 0 ||
    sports.length > 0 ||
    stresses.length > 0 ||
    observations.length > 0;

  if (!hasData) {
    return <EmptyState onAddEntry={onAddEntry} />;
  }

  return (
    <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
      <View className="gap-3 pb-32">
        <SleepDetail entry={sleeps[0]} />
        <MealsDetail entries={meals} />
        <SportsDetail entries={sports} />
        <StressDetail entry={stresses[0]} />
        <ObservationsDetail entry={observations[0]} />
      </View>
    </ScrollView>
  );
}
