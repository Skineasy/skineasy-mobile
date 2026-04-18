/**
 * Journal TanStack Query Hooks
 *
 * Re-exports all journal hooks for backwards compatibility.
 * Prefer importing from the specific hook files directly.
 */

export { useSleepEntries, useUpsertSleep, useDeleteSleep } from '@features/journal/hooks/useSleep';

export {
  useSportTypes,
  useSportEntries,
  useCreateSport,
  useUpdateSport,
  useDeleteSport,
} from '@features/journal/hooks/useSport';

export {
  useMealEntries,
  useCreateMeal,
  useUpdateMeal,
  useDeleteMeal,
  useUploadMealPhoto,
} from '@features/journal/hooks/useMeal';

export {
  useStressEntries,
  useUpsertStress,
  useDeleteStress,
} from '@features/journal/hooks/useStress';
