import { mapSupabaseError } from '@lib/error-mapper';
import { supabase } from '@lib/supabase';
import type {
  JournalWeekResponse,
  MealEntry,
  ObservationEntry,
  SleepEntry,
  SportEntry,
  StressEntry,
} from '@shared/types/journal.types';

import { getMealSignedUrl } from '@features/journal/data/meal.api';
import { getUserId } from '@features/journal/data/utils';

export async function getEntriesByDateRange(
  startDate: string,
  endDate: string,
): Promise<JournalWeekResponse> {
  const userId = await getUserId();

  const [sleeps, sports, meals, stresses, observations] = await Promise.all([
    supabase
      .from('sleep_entries')
      .select()
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate),
    supabase
      .from('sport_entries')
      .select()
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate),
    supabase
      .from('meal_entries')
      .select()
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate),
    supabase
      .from('stress_entries')
      .select()
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate),
    supabase
      .from('observation_entries')
      .select()
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate),
  ]);

  if (sleeps.error) throw mapSupabaseError(sleeps.error);
  if (sports.error) throw mapSupabaseError(sports.error);
  if (meals.error) throw mapSupabaseError(meals.error);
  if (stresses.error) throw mapSupabaseError(stresses.error);
  if (observations.error) throw mapSupabaseError(observations.error);

  const rawMeals = (meals.data ?? []) as MealEntry[];
  const signedMeals = await Promise.all(
    rawMeals.map(async (meal) => {
      if (!meal.photo_url) return meal;
      const signedUrl = await getMealSignedUrl(meal.photo_url);
      return signedUrl ? { ...meal, photo_url: signedUrl } : meal;
    }),
  );

  return {
    sleeps: (sleeps.data ?? []) as SleepEntry[],
    sports: (sports.data ?? []) as SportEntry[],
    meals: signedMeals,
    stresses: (stresses.data ?? []) as StressEntry[],
    observations: (observations.data ?? []) as ObservationEntry[],
  };
}
