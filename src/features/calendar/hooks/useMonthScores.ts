import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { eachDayOfInterval, endOfMonth, format, isSameDay, parseISO, startOfMonth } from 'date-fns';

import { calculateDayScore } from '@features/dashboard/utils/score';
import { journalService } from '@features/journal/services/journal.service';
import { queryKeys } from '@shared/config/queryKeys';
import type {
  MealEntry,
  ObservationEntry,
  SleepEntry,
  SportEntry,
  StressEntry,
} from '@shared/types/journal.types';
import { toUTCDateString } from '@shared/utils/date';
import { colors } from '@theme/colors';

type MarkedDates = Record<string, { dots: { color: string }[] }>;

function getScoreColor(score: number): string {
  if (score > 70) return colors.success;
  if (score > 30) return colors.warning;
  if (score > 0) return colors.error;
  return colors.textMuted;
}

function filterByDate<T extends { date: string }>(entries: T[], targetDate: Date): T[] {
  return entries.filter((e) => isSameDay(parseISO(e.date), targetDate));
}

export function useMonthScores(
  year: number,
  month: number,
): { markedDates: MarkedDates; isLoading: boolean } {
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(monthStart);
  const startDate = toUTCDateString(monthStart);
  const endDate = toUTCDateString(monthEnd);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.journalEntriesRange(startDate, endDate),
    queryFn: () => journalService.entries.getByDateRange(startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });

  const markedDates = useMemo<MarkedDates>(() => {
    if (!data) return {};

    const sleeps: SleepEntry[] = data.sleeps ?? [];
    const meals: MealEntry[] = data.meals ?? [];
    const sports: SportEntry[] = data.sports ?? [];
    const stresses: StressEntry[] = data.stresses ?? [];
    const observations: ObservationEntry[] = data.observations ?? [];

    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const result: MarkedDates = {};

    for (const day of days) {
      const dateStr = format(day, 'yyyy-MM-dd');
      const daySleeps = filterByDate(sleeps, day);
      const dayMeals = filterByDate(meals, day);
      const daySports = filterByDate(sports, day);
      const dayStress = filterByDate(stresses, day);
      const dayObservations = filterByDate(observations, day);

      const score = calculateDayScore(
        daySleeps[0],
        dayMeals,
        daySports,
        dayStress[0],
        dayObservations[0],
      );

      result[dateStr] = {
        dots: [{ color: getScoreColor(score) }],
      };
    }

    return result;
  }, [data, monthStart, monthEnd]);

  return { markedDates, isLoading };
}
