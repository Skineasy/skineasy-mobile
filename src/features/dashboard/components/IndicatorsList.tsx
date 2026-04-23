import { useRouter } from 'expo-router';
import {
  Dumbbell,
  Frown,
  type LucideIcon,
  Meh,
  Moon,
  Search,
  Smile,
  Utensils,
  Zap,
} from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  View,
} from 'react-native';

import { IndicatorCard } from '@features/dashboard/components/IndicatorCard';
import type {
  MealEntry,
  ObservationEntry,
  SleepEntry,
  SportEntry,
  StressEntry,
} from '@shared/types/journal.types';
import { colors } from '@theme/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = 16;
const GAP = 8;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GAP) / 2;
const SNAP_INTERVAL = CARD_WIDTH + GAP;

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

type IndicatorType = 'sleep' | 'nutrition' | 'sport' | 'stress' | 'observations';

interface IndicatorItem {
  key: IndicatorType;
  icon: LucideIcon;
  label: string;
  value: string;
  valueIcon?: LucideIcon;
  level: number;
  isEmpty: boolean;
}

const JOURNAL_PATHS: Record<IndicatorType, string> = {
  sleep: '/journal/sleep',
  nutrition: '/journal/nutrition',
  sport: '/journal/sport',
  stress: '/journal/stress',
  observations: '/journal/observations',
};

function formatSleep(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours % 1) * 60)
    .toString()
    .padStart(2, '0');
  return `${h}h${m}`;
}

function getNutritionSmileyIcon(avgQuality: number): LucideIcon {
  if (avgQuality >= 3.5) return Smile;
  if (avgQuality >= 2.5) return Meh;
  return Frown;
}

export function IndicatorsList({
  sleepEntries,
  mealEntries,
  sportEntries,
  stressEntries,
  observationEntries,
  date,
}: IndicatorsListProps): React.ReactElement {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  const sleepHours = sleepEntries[0]?.hours ?? 0;
  const sleepQuality = sleepEntries[0]?.quality ?? 0;

  const mealCount = mealEntries.length;
  const ratedMeals = mealEntries.filter((m) => m.quality != null);
  const avgMealQuality =
    ratedMeals.length > 0
      ? ratedMeals.reduce((sum, m) => sum + (m.quality as number), 0) / ratedMeals.length
      : 3;

  const totalSportMinutes = sportEntries.reduce((acc, e) => acc + (e.duration || 0), 0);
  const avgSportIntensity =
    sportEntries.length > 0
      ? Math.round(sportEntries.reduce((s, e) => s + e.intensity, 0) / sportEntries.length)
      : 0;

  const stressLevel = stressEntries[0]?.level ?? 0;

  const observation = observationEntries[0];
  const observationCount = observation
    ? observation.positives.length + observation.negatives.length
    : 0;

  const items = useMemo<IndicatorItem[]>(() => {
    const list: IndicatorItem[] = [
      {
        key: 'sleep',
        icon: Moon,
        label: t('dashboard.indicators.sleep'),
        value: sleepHours > 0 ? formatSleep(sleepHours) : '—',
        level: sleepQuality,
        isEmpty: sleepEntries.length === 0,
      },
      {
        key: 'nutrition',
        icon: Utensils,
        label: t('dashboard.indicators.nutrition'),
        value: mealCount > 0 ? '' : '—',
        valueIcon: mealCount > 0 ? getNutritionSmileyIcon(avgMealQuality) : undefined,
        level: Math.min(mealCount, 5),
        isEmpty: mealCount === 0,
      },
      {
        key: 'sport',
        icon: Dumbbell,
        label: t('dashboard.indicators.sport'),
        value: totalSportMinutes > 0 ? `${totalSportMinutes} min` : '—',
        level: avgSportIntensity,
        isEmpty: sportEntries.length === 0,
      },
      {
        key: 'stress',
        icon: Zap,
        label: t('dashboard.indicators.stress'),
        value: stressLevel > 0 ? t(`journal.stress.level.${STRESS_LEVEL_KEYS[stressLevel]}`) : '—',
        level: stressLevel,
        isEmpty: stressEntries.length === 0,
      },
      {
        key: 'observations',
        icon: Search,
        label: t('dashboard.indicators.observations'),
        value: observation ? `${observationCount}` : '—',
        level: Math.min(observationCount, 5),
        isEmpty: !observation,
      },
    ];
    return list.sort((a, b) => Number(a.isEmpty) - Number(b.isEmpty));
  }, [
    t,
    sleepHours,
    sleepQuality,
    sleepEntries.length,
    mealCount,
    avgMealQuality,
    totalSportMinutes,
    avgSportIntensity,
    sportEntries.length,
    stressLevel,
    stressEntries.length,
    observation,
    observationCount,
  ]);

  const navigateToJournal = (type: IndicatorType): void => {
    router.push({ pathname: JOURNAL_PATHS[type], params: { date } });
  };

  const columnCount = Math.ceil(items.length / 2);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const maxOffset = contentSize.width - layoutMeasurement.width;
      if (maxOffset <= 0) {
        setActiveIndex(0);
        return;
      }
      if (contentOffset.x >= maxOffset - 1) {
        setActiveIndex(columnCount - 1);
        return;
      }
      const idx = Math.round(contentOffset.x / SNAP_INTERVAL);
      setActiveIndex(Math.max(0, Math.min(columnCount - 1, idx)));
    },
    [columnCount],
  );

  const columns = useMemo<IndicatorItem[][]>(() => {
    const result: IndicatorItem[][] = [];
    for (let i = 0; i < items.length; i += 2) {
      result.push(items.slice(i, i + 2));
    }
    return result;
  }, [items]);

  return (
    <View>
      <FlatList
        data={columns}
        keyExtractor={(col, index) => `col-${index}-${col[0]?.key ?? ''}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item: column, index }) => (
          <View
            style={{
              width: CARD_WIDTH,
              marginRight: index === columns.length - 1 ? 0 : GAP,
              gap: GAP,
            }}
          >
            {column.map((item) => (
              <IndicatorCard
                key={item.key}
                icon={item.icon}
                label={item.label}
                value={item.value}
                valueIcon={item.valueIcon}
                level={item.level}
                isEmpty={item.isEmpty}
                onPress={() => navigateToJournal(item.key)}
              />
            ))}
          </View>
        )}
      />

      <View className="flex-row justify-center items-center gap-1.5 mt-3">
        {columns.map((column, index) => {
          const isActive = index === activeIndex;
          return (
            <View
              key={`dot-${index}-${column[0]?.key ?? ''}`}
              style={{
                width: isActive ? 16 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: isActive ? colors.brownDark : colors.textLight,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
