import { useRouter } from 'expo-router';
import { Dumbbell, Moon, Search, Smile, Utensils } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Dimensions, Text, View } from 'react-native';

import { IndicatorCard } from '@features/dashboard/components/IndicatorCard';
import { appConfig } from '@shared/config/appConfig';
import { colors } from '@theme/colors';
import type {
  MealEntry,
  ObservationEntry,
  SleepEntry,
  SportEntry,
  StressEntry,
} from '@shared/types/journal.types';

type IndicatorStatus = 'empty' | 'partial' | 'complete';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = 16;
const GAP = 8;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GAP) / 2;

interface IndicatorsListProps {
  sleepEntries: SleepEntry[];
  mealEntries: MealEntry[];
  sportEntries: SportEntry[];
  stressEntries: StressEntry[];
  observationEntries: ObservationEntry[];
  date: string;
}

const STRESS_LEVEL_KEYS: Record<number, string> = {
  1: 'minimal',
  2: 'mild',
  3: 'moderate',
  4: 'high',
  5: 'intense',
};

const STRESS_EMOJIS: Record<number, string> = {
  1: '😌',
  2: '🙂',
  3: '😐',
  4: '😟',
  5: '😰',
};

export function IndicatorsList({
  sleepEntries,
  mealEntries,
  sportEntries,
  stressEntries,
  observationEntries,
  date,
}: IndicatorsListProps): React.ReactElement {
  const layout = appConfig.ui.indicatorLayout;
  const { t } = useTranslation();
  const router = useRouter();

  // Calculate values from entries
  const sleepHours = sleepEntries.length > 0 ? sleepEntries[0].hours : 0;
  const sleepValue =
    sleepHours > 0
      ? `${Math.floor(sleepHours)}h${Math.round((sleepHours % 1) * 60)
          .toString()
          .padStart(2, '0')}`
      : '-';

  const mealCount = mealEntries.length;
  const mealValue = mealCount > 0 ? `${mealCount}/4` : '-';

  const totalSportMinutes = sportEntries.reduce((acc, entry) => acc + (entry.duration || 0), 0);
  const sportValue = totalSportMinutes > 0 ? `${totalSportMinutes} min` : '-';

  const stressLevel = stressEntries.length > 0 ? stressEntries[0].level : 0;
  const stressValue =
    stressLevel > 0 ? t(`journal.stress.level.${STRESS_LEVEL_KEYS[stressLevel]}`) : '-';

  const navigateToJournal = (
    type: 'sleep' | 'nutrition' | 'sport' | 'stress' | 'observations',
  ): void => {
    const paths = {
      sleep: '/journal/sleep',
      nutrition: '/journal/nutrition',
      sport: '/journal/sport',
      stress: '/journal/stress',
      observations: '/journal/observations',
    };
    router.push({ pathname: paths[type], params: { date } });
  };

  // Compute status for each card
  const sleepStatus: IndicatorStatus = sleepEntries.length > 0 ? 'complete' : 'empty';
  const nutritionStatus: IndicatorStatus =
    mealCount >= 3 ? 'complete' : mealCount > 0 ? 'partial' : 'empty';
  const sportStatus: IndicatorStatus = sportEntries.length > 0 ? 'complete' : 'empty';
  const stressStatus: IndicatorStatus = stressEntries.length > 0 ? 'complete' : 'empty';
  const observationStatus: IndicatorStatus = observationEntries.length > 0 ? 'complete' : 'empty';

  const observation = observationEntries[0];
  const observationValue = observation
    ? `${observation.positives.length + observation.negatives.length}`
    : '-';

  // Display value for nutrition partial state
  const nutritionValue =
    nutritionStatus === 'partial'
      ? t('dashboard.indicators.mealsEntered', { count: mealCount })
      : mealValue;

  // Sleep: quality stars ★★★☆☆
  const sleepQuality = sleepEntries[0]?.quality ?? 0;
  const sleepVisual =
    sleepQuality > 0 ? '★'.repeat(sleepQuality) + '☆'.repeat(5 - sleepQuality) : undefined;

  // Nutrition: meal types as secondary text, first photo as thumbnail
  const mealTypes = [...new Set(mealEntries.map((m) => m.meal_type).filter(Boolean))] as string[];
  const nutritionSecondary =
    mealTypes.length > 0
      ? mealTypes.map((type) => t(`dashboard.summary.mealType.${type}`)).join(', ')
      : undefined;
  const nutritionThumbnail = mealEntries.find((m) => m.photo_url)?.photo_url ?? undefined;

  // Sport: activity name as secondary, intensity dots as visual
  const activityCount = sportEntries.length;
  const avgIntensity =
    activityCount > 0
      ? Math.round(sportEntries.reduce((sum, s) => sum + s.intensity, 0) / activityCount)
      : 0;
  const sportVisual =
    activityCount > 0 ? '●'.repeat(avgIntensity) + '○'.repeat(5 - avgIntensity) : undefined;
  const sportNames = [
    ...new Set(sportEntries.map((s) => s.sportType?.name).filter(Boolean)),
  ] as string[];
  const sportSecondary =
    sportNames.length > 0
      ? sportNames.map((name) => t(`journal.sport.activities.${name}`)).join(', ')
      : undefined;

  // Stress: emoji as visual, note as secondary
  const stressVisual = stressEntries[0] ? STRESS_EMOJIS[stressEntries[0].level] : undefined;
  const stressSecondary = stressEntries[0]?.note?.substring(0, 40) ?? undefined;

  const MAX_CHIPS = 3;
  const observationChips = observation
    ? [
        ...observation.positives.map((key) => ({
          key,
          label: t(`journal.observations.positive.${key}`),
          type: 'positive' as const,
        })),
        ...observation.negatives.map((key) => ({
          key,
          label: t(`journal.observations.negative.${key}`),
          type: 'negative' as const,
        })),
      ]
    : [];
  const visibleChips = observationChips.slice(0, MAX_CHIPS);
  const overflowCount = observationChips.length - MAX_CHIPS;

  const observationCustomContent =
    observationChips.length > 0 ? (
      <View className="flex-row flex-wrap items-center gap-1.5">
        {visibleChips.map(({ key, label, type }) => (
          <View
            key={key}
            className="rounded-full px-2.5 py-1"
            style={{
              backgroundColor: type === 'positive' ? `${colors.success}18` : `${colors.error}18`,
            }}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: type === 'positive' ? colors.success : colors.error }}
            >
              {label}
            </Text>
          </View>
        ))}
        {overflowCount > 0 && (
          <Text className="text-xs text-text-muted">
            {t('dashboard.indicators.andMore', { count: overflowCount })}
          </Text>
        )}
      </View>
    ) : undefined;

  // Only show cards with data
  const showSleep = sleepEntries.length > 0;
  const showNutrition = mealEntries.length > 0;
  const showSport = sportEntries.length > 0;
  const showStress = stressEntries.length > 0;
  const showObservations = observationEntries.length > 0;

  if (layout === 'grid') {
    return (
      <View className="px-4 gap-2">
        {/* Top row: Sleep + Nutrition */}
        <View className="flex-row gap-2">
          <View style={{ width: CARD_WIDTH }}>
            <IndicatorCard
              icon={Moon}
              label={t('dashboard.indicators.sleep')}
              value={sleepValue}
              onPress={() => navigateToJournal('sleep')}
              status={sleepStatus}
              layout="grid"
            />
          </View>
          <View style={{ width: CARD_WIDTH }}>
            <IndicatorCard
              icon={Utensils}
              label={t('dashboard.indicators.nutrition')}
              value={nutritionValue}
              onPress={() => navigateToJournal('nutrition')}
              status={nutritionStatus}
              layout="grid"
            />
          </View>
        </View>

        {/* Middle row: Sport + Stress */}
        <View className="flex-row gap-2">
          <View style={{ width: CARD_WIDTH }}>
            <IndicatorCard
              icon={Dumbbell}
              label={t('dashboard.indicators.sport')}
              value={sportValue}
              onPress={() => navigateToJournal('sport')}
              status={sportStatus}
              layout="grid"
            />
          </View>
          <View style={{ width: CARD_WIDTH }}>
            <IndicatorCard
              icon={Smile}
              label={t('dashboard.indicators.stress')}
              value={stressValue}
              onPress={() => navigateToJournal('stress')}
              status={stressStatus}
              layout="grid"
            />
          </View>
        </View>

        {/* Bottom row: Observations */}
        <View className="flex-row gap-2">
          <View style={{ width: CARD_WIDTH }}>
            <IndicatorCard
              icon={Search}
              label={t('dashboard.indicators.observations')}
              value={observationValue}
              onPress={() => navigateToJournal('observations')}
              status={observationStatus}
              layout="grid"
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="px-4 gap-3">
      {showSleep && (
        <IndicatorCard
          icon={Moon}
          label={t('dashboard.indicators.sleep')}
          value={sleepValue}
          visualIndicator={sleepVisual}
          onPress={() => navigateToJournal('sleep')}
          status={sleepStatus}
          layout="list"
        />
      )}
      {showNutrition && (
        <IndicatorCard
          icon={Utensils}
          label={t('dashboard.indicators.nutrition')}
          value={nutritionValue}
          secondaryText={nutritionSecondary}
          thumbnailUrl={nutritionThumbnail}
          onPress={() => navigateToJournal('nutrition')}
          status={nutritionStatus}
          layout="list"
        />
      )}
      {showSport && (
        <IndicatorCard
          icon={Dumbbell}
          label={t('dashboard.indicators.sport')}
          value={sportValue}
          secondaryText={sportSecondary}
          visualIndicator={sportVisual}
          onPress={() => navigateToJournal('sport')}
          status={sportStatus}
          layout="list"
        />
      )}
      {showStress && (
        <IndicatorCard
          icon={Smile}
          label={t('dashboard.indicators.stress')}
          value={stressValue}
          secondaryText={stressSecondary}
          visualIndicator={stressVisual}
          onPress={() => navigateToJournal('stress')}
          status={stressStatus}
          layout="list"
        />
      )}
      {showObservations && (
        <IndicatorCard
          icon={Search}
          label={t('dashboard.indicators.observations')}
          value={observationValue}
          customContent={observationCustomContent}
          onPress={() => navigateToJournal('observations')}
          status={observationStatus}
          layout="list"
        />
      )}
    </View>
  );
}
