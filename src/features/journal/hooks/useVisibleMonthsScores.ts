import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
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

function getScoreColor(score: number): string | null {
  if (score > 70) return colors.success;
  if (score > 30) return colors.warning;
  if (score > 0) return colors.error;
  return null; // No dot for score = 0
}

function filterByDate<T extends { date: string }>(entries: T[], targetDate: Date): T[] {
  return entries.filter((e) => isSameDay(parseISO(e.date), targetDate));
}

export function useVisibleMonthsScores(visibleMonths: { year: number; month: number }[]): {
  markedDates: MarkedDates;
  isLoading: boolean;
} {
  const queries = useQueries({
    queries: visibleMonths.map(({ year, month }) => {
      const monthStart = startOfMonth(new Date(year, month));
      const monthEnd = endOfMonth(monthStart);
      const startDate = toUTCDateString(monthStart);
      const endDate = toUTCDateString(monthEnd);

      return {
        queryKey: queryKeys.journalEntriesRange(startDate, endDate),
        queryFn: () => journalService.entries.getByDateRange(startDate, endDate),
        staleTime: 5 * 60 * 1000,
      };
    }),
  });

  const isLoading = queries.some((q) => q.isLoading);

  const markedDates = useMemo<MarkedDates>(() => {
    const result: MarkedDates = {};

    queries.forEach((query, index) => {
      if (!query.data) return;

      const { year, month } = visibleMonths[index];
      const monthStart = startOfMonth(new Date(year, month));
      const monthEnd = endOfMonth(monthStart);

      const sleeps: SleepEntry[] = query.data.sleeps ?? [];
      const meals: MealEntry[] = query.data.meals ?? [];
      const sports: SportEntry[] = query.data.sports ?? [];
      const stresses: StressEntry[] = query.data.stresses ?? [];
      const observations: ObservationEntry[] = query.data.observations ?? [];

      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

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
        const color = getScoreColor(score);

        if (color) {
          result[dateStr] = {
            dots: [{ color }],
          };
        }
      }
    });

    return result;
  }, [queries, visibleMonths]);

  return { markedDates, isLoading };
}
