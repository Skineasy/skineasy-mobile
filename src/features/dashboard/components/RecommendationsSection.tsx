import { HeartHandshake } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { RecommendationPill } from '@features/dashboard/components/RecommendationPill';
import { buildRecommendations } from '@features/dashboard/utils/recommendations';
import { useMealEntries } from '@features/journal/data/meal.queries';
import { useSleepEntries } from '@features/journal/data/sleep.queries';
import { useSportEntries } from '@features/journal/data/sport.queries';
import { useStressEntries } from '@features/journal/data/stress.queries';
import { SectionHeader } from '@shared/components/section-header';
import type { ObservationEntry } from '@shared/types/journal.types';
import { toUTCDateString } from '@shared/utils/date';

interface RecommendationsSectionProps {
  selectedDate: Date;
  observationEntry: ObservationEntry | undefined;
}

export function RecommendationsSection({
  selectedDate,
  observationEntry,
}: RecommendationsSectionProps): React.ReactElement | null {
  const { t } = useTranslation();

  const { todayString, yesterdayString } = useMemo(() => {
    const now = new Date();
    return {
      todayString: toUTCDateString(now),
      yesterdayString: toUTCDateString(new Date(now.getTime() - 86400000)),
    };
  }, []);
  const isToday = toUTCDateString(selectedDate) === todayString;

  const { data: sleepEntries = [] } = useSleepEntries(yesterdayString);
  const { data: stressEntries = [] } = useStressEntries(yesterdayString);
  const { data: sportEntries = [] } = useSportEntries(yesterdayString);
  const { data: mealEntries = [] } = useMealEntries(yesterdayString);

  if (!isToday) return null;

  const recommendations = buildRecommendations({
    sleepYesterday: sleepEntries[0],
    stressYesterday: stressEntries[0],
    sportYesterday: sportEntries,
    mealYesterday: mealEntries,
    observationToday: observationEntry,
  });

  if (recommendations.length === 0) return null;

  return (
    <View>
      <SectionHeader
        className="px-4"
        icon={HeartHandshake}
        title={t('dashboard.recommendations.title')}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {recommendations.map((rec) => (
          <RecommendationPill key={rec.id} icon={rec.icon} label={t(rec.labelKey)} />
        ))}
      </ScrollView>
    </View>
  );
}
