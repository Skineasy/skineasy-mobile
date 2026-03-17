import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { toast } from '@lib/toast';

import {
  mealService,
  sleepService,
  sportService,
  sportTypesService,
} from '@features/journal/services/journal.service';
import { healthkitService } from '@shared/services/healthkit.service';
import { useHealthKitStore } from '@shared/stores/healthkit.store';
import type { SportType, SportTypeInfo } from '@shared/types/journal.types';
import { toISODateString } from '@shared/utils/date';
import { logger } from '@shared/utils/logger';

// Cache sport types to avoid repeated API calls
let sportTypesCache: SportTypeInfo[] | null = null;

async function getSportTypes(): Promise<SportTypeInfo[]> {
  if (!sportTypesCache) {
    sportTypesCache = await sportTypesService.getAll();
  }
  return sportTypesCache;
}

async function getSportTypeId(sportType: SportType): Promise<number> {
  const sportTypes = await getSportTypes();
  const found = sportTypes.find((st) => st.name === sportType);
  // Default to 'other' if not found
  if (!found) {
    const other = sportTypes.find((st) => st.name === 'other');
    return other?.id ?? 1;
  }
  return found.id;
}

interface UseHealthKitSyncReturn {
  sync: (daysBack?: number) => Promise<void>;
  isSyncing: boolean;
  lastSyncDate: string | null;
  isAuthorized: boolean;
  requestAuthorization: () => Promise<boolean>;
}

export function useHealthKitSync(): UseHealthKitSyncReturn {
  const { t } = useTranslation();
  const [isSyncing, setIsSyncing] = useState(false);
  const { isAuthorized, lastSyncDate, setAuthorized, setLastSyncDate, setSyncInProgress } =
    useHealthKitStore();

  const requestAuthorization = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'ios') {
      logger.warn('[HealthKit] Not available on this platform');
      return false;
    }

    try {
      const authorized = await healthkitService.requestAuthorization();
      await setAuthorized(authorized);
      return authorized;
    } catch (error) {
      logger.error('[HealthKit] Authorization error:', error);
      return false;
    }
  }, [setAuthorized]);

  const sync = useCallback(
    async (daysBack = 7): Promise<void> => {
      if (Platform.OS !== 'ios') {
        logger.warn('[HealthKit] Sync not available on this platform');
        return;
      }

      if (isSyncing) {
        logger.warn('[HealthKit] Sync already in progress');
        return;
      }

      setIsSyncing(true);
      setSyncInProgress(true);

      try {
        // Ensure we have authorization
        if (!isAuthorized) {
          const authorized = await requestAuthorization();
          if (!authorized) {
            toast.error(t('healthkit.permissionDenied'));
            return;
          }
        }

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);

        logger.info('[HealthKit] Starting sync', { startDate, endDate });

        // Sync sleep data
        await syncSleepData(startDate, endDate);

        // Sync workouts
        await syncWorkoutData(startDate, endDate);

        // Sync nutrition (only today and yesterday typically have data)
        await syncNutritionData(endDate);

        const now = new Date().toISOString();
        await setLastSyncDate(now);

        toast.success(t('healthkit.syncSuccess'));

        logger.info('[HealthKit] Sync completed successfully');
      } catch (error) {
        logger.error('[HealthKit] Sync error:', error);
        toast.error(t('healthkit.syncError'));
      } finally {
        setIsSyncing(false);
        setSyncInProgress(false);
      }
    },
    [isSyncing, isAuthorized, requestAuthorization, setLastSyncDate, setSyncInProgress, t],
  );

  return {
    sync,
    isSyncing,
    lastSyncDate,
    isAuthorized,
    requestAuthorization,
  };
}

async function syncSleepData(startDate: Date, endDate: Date): Promise<void> {
  try {
    const sleepSamples = await healthkitService.getSleepSamples(startDate, endDate);

    // Group samples by date (sleep that ends on a given day belongs to that day)
    const samplesByDate = new Map<string, typeof sleepSamples>();

    for (const sample of sleepSamples) {
      const sampleEndDate = new Date(sample.endDate);
      const dateKey = toISODateString(
        `${sampleEndDate.getFullYear()}-${String(sampleEndDate.getMonth() + 1).padStart(2, '0')}-${String(sampleEndDate.getDate()).padStart(2, '0')}`,
      );

      const existing = samplesByDate.get(dateKey) || [];
      existing.push(sample);
      samplesByDate.set(dateKey, existing);
    }

    // Process each day's sleep data
    for (const [dateKey, samples] of samplesByDate) {
      const processed = healthkitService.processSleepData(samples, dateKey);
      if (processed) {
        try {
          await sleepService.upsert({
            date: processed.date,
            hours: processed.hours,
            quality: processed.quality,
          });
          logger.info('[HealthKit] Sleep synced for date:', dateKey);
        } catch (error) {
          logger.warn('[HealthKit] Failed to sync sleep for date:', dateKey, error);
        }
      }
    }
  } catch (error) {
    logger.error('[HealthKit] Sleep sync error:', error);
  }
}

async function syncWorkoutData(startDate: Date, endDate: Date): Promise<void> {
  try {
    const workouts = await healthkitService.getWorkouts(startDate, endDate);

    for (const workout of workouts) {
      if (workout.duration < 1) continue; // Skip very short workouts

      const workoutDate = new Date(workout.startDate);
      const dateString = toISODateString(
        `${workoutDate.getFullYear()}-${String(workoutDate.getMonth() + 1).padStart(2, '0')}-${String(workoutDate.getDate()).padStart(2, '0')}`,
      );

      const processed = healthkitService.processWorkouts([workout], dateString);
      if (processed.length === 0) continue;

      const entry = processed[0];
      try {
        const sportTypeId = await getSportTypeId(entry.sportType as SportType);
        await sportService.create({
          date: entry.date,
          sport_type_id: sportTypeId,
          duration: entry.duration,
          intensity: entry.intensity,
          note: `Synced from Apple Health: ${workout.activityName}`,
        });
        logger.info('[HealthKit] Workout synced:', workout.activityName);
      } catch (error) {
        logger.warn('[HealthKit] Failed to sync workout:', error);
      }
    }
  } catch (error) {
    logger.error('[HealthKit] Workout sync error:', error);
  }
}

async function syncNutritionData(date: Date): Promise<void> {
  try {
    const nutrition = await healthkitService.getNutrition(date);
    if (!nutrition) return;

    const dateString = toISODateString(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    );

    const processed = healthkitService.processNutrition(nutrition, dateString);

    // Create a synthetic meal entry with nutrition data in the note
    const noteLines = [];
    if (processed.calories > 0) noteLines.push(`Calories: ${processed.calories} kcal`);
    if (processed.protein > 0) noteLines.push(`Protein: ${processed.protein}g`);
    if (processed.carbs > 0) noteLines.push(`Carbs: ${processed.carbs}g`);
    if (processed.fat > 0) noteLines.push(`Fat: ${processed.fat}g`);

    if (noteLines.length === 0) return;

    try {
      await mealService.create({
        date: processed.date,
        food_name: 'HealthKit',
        note: noteLines.join('\n'),
        meal_type: null,
      });
      logger.info('[HealthKit] Nutrition synced for date:', dateString);
    } catch (error) {
      logger.warn('[HealthKit] Failed to sync nutrition:', error);
    }
  } catch (error) {
    logger.error('[HealthKit] Nutrition sync error:', error);
  }
}
