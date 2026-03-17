import { useQuery } from '@tanstack/react-query';
import { isSameDay, parseISO, subDays } from 'date-fns';

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

import { calculateDayScore } from '@features/dashboard/utils/score';

type DayScore = {
  date: Date;
  score: number;
};

function filterByDate<T extends { date: string }>(entries: T[], targetDate: Date): T[] {
  return entries.filter((e) => isSameDay(parseISO(e.date), targetDate));
}

export function useWeekScores(): DayScore[] {
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
  const startDate = toUTCDateString(weekDays[0]);
  const endDate = toUTCDateString(weekDays[6]);

  const { data } = useQuery({
    queryKey: queryKeys.journalEntriesRange(startDate, endDate),
    queryFn: () => journalService.entries.getByDateRange(startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });

  const sleeps: SleepEntry[] = data?.sleeps ?? [];
  const meals: MealEntry[] = data?.meals ?? [];
  const sports: SportEntry[] = data?.sports ?? [];
  const stresses: StressEntry[] = data?.stresses ?? [];
  const observations: ObservationEntry[] = data?.observations ?? [];

  return weekDays.map((date) => {
    const daySleeps = filterByDate(sleeps, date);
    const dayMeals = filterByDate(meals, date);
    const daySports = filterByDate(sports, date);
    const dayStress = filterByDate(stresses, date);
    const dayObservations = filterByDate(observations, date);

    return {
      date,
      score: calculateDayScore(daySleeps[0], dayMeals, daySports, dayStress[0], dayObservations[0]),
    };
  });
}
