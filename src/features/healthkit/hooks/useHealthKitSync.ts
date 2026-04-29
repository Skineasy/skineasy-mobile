import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { toast } from '@lib/toast';
import { queryKeys } from '@shared/config/queryKeys';

import { createMeal } from '@features/journal/data/meal.api';
import { upsertSleep } from '@features/journal/data/sleep.api';
import { createSport, getSportTypes as fetchSportTypes } from '@features/journal/data/sport.api';
import { upsertStress } from '@features/journal/data/stress.api';
import { healthkitService } from '@shared/services/healthkit.service';
import { useHealthKitStore } from '@shared/stores/healthkit.store';
import { useUserStore } from '@shared/stores/user.store';
import type { CategoryReport, SyncReport } from '@shared/types/healthkit.types';
import type { SportType, SportTypeInfo } from '@shared/types/journal.types';
import { toISODateString } from '@shared/utils/date';
import { logger } from '@shared/utils/logger';

let sportTypesCache: SportTypeInfo[] | null = null;

async function getSportTypes(): Promise<SportTypeInfo[]> {
  if (!sportTypesCache) {
    sportTypesCache = await fetchSportTypes();
  }
  return sportTypesCache;
}

async function getSportTypeId(sportType: SportType): Promise<string> {
  const sportTypes = await getSportTypes();
  const found = sportTypes.find((st) => st.name === sportType);
  if (!found) {
    const other = sportTypes.find((st) => st.name === 'other');
    return other?.id ?? '';
  }
  return found.id;
}

function emptyReport(): CategoryReport {
  return { status: 'empty', fetched: 0, upserted: 0, failed: 0 };
}

function dateKeyFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildDateKeys(startDate: Date, endDate: Date): string[] {
  const out: string[] = [];
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(endDate);
  last.setHours(0, 0, 0, 0);
  while (cursor <= last) {
    out.push(dateKeyFromDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

interface UseHealthKitSyncReturn {
  sync: (daysBack?: number) => Promise<void>;
  isSyncing: boolean;
  lastSyncDate: string | null;
  lastReport: SyncReport | null;
  isAuthorized: boolean;
  requestAuthorization: () => Promise<boolean>;
  resetLastSyncDate: () => Promise<void>;
}

export function useHealthKitSync(): UseHealthKitSyncReturn {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const inFlightRef = useRef(false);
  const {
    isAuthorized,
    lastSyncDate,
    lastReport,
    setAuthorized,
    setLastSyncDate,
    setLastReport,
    resetLastSyncDate,
    setSyncInProgress,
  } = useHealthKitStore();

  const requestAuthorization = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'ios') return false;

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
      if (Platform.OS !== 'ios') return;
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      setIsSyncing(true);
      setSyncInProgress(true);
      const startedAt = new Date();

      try {
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

        const birthday = useUserStore.getState().user?.birthday ?? null;
        const age = healthkitService.calculateAge(birthday);

        logger.info('[HealthKit] Starting sync', { startDate, endDate, daysBack, age });

        const [sleep, workouts, stress, nutrition] = await Promise.all([
          syncSleepData(startDate, endDate),
          syncWorkoutData(startDate, endDate, age),
          syncStressData(startDate, endDate),
          syncNutritionData(endDate),
        ]);

        const finishedAt = new Date();
        const report: SyncReport = {
          startedAt: startedAt.toISOString(),
          finishedAt: finishedAt.toISOString(),
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          rangeDays: daysBack,
          age,
          sleep,
          workouts,
          stress,
          nutrition,
        };

        await setLastReport(report);
        await setLastSyncDate(finishedAt.toISOString());

        const totalUpserted =
          sleep.upserted + workouts.upserted + stress.upserted + nutrition.upserted;
        if (totalUpserted > 0) {
          await queryClient.invalidateQueries({ queryKey: queryKeys.journal });
        }

        const summary = formatSummary(report);
        const hasError =
          [sleep, workouts, stress, nutrition].some((c) => c.status === 'error') ||
          summary.failed > 0;
        if (hasError) {
          toast.error(`${t('healthkit.syncError')}\n${summary.line}`);
        } else {
          toast.success(`${t('healthkit.syncSuccess')}\n${summary.line}`);
        }

        logger.info('[HealthKit] Sync completed', report);
      } catch (error) {
        logger.error('[HealthKit] Sync error:', error);
        toast.error(t('healthkit.syncError'));
      } finally {
        inFlightRef.current = false;
        setIsSyncing(false);
        setSyncInProgress(false);
      }
    },
    [
      isAuthorized,
      queryClient,
      requestAuthorization,
      setLastSyncDate,
      setLastReport,
      setSyncInProgress,
      t,
    ],
  );

  return {
    sync,
    isSyncing,
    lastSyncDate,
    lastReport,
    isAuthorized,
    requestAuthorization,
    resetLastSyncDate,
  };
}

function formatSummary(report: SyncReport): { line: string; failed: number } {
  const parts = [
    `Sleep ${report.sleep.upserted}`,
    `Workouts ${report.workouts.upserted}`,
    `Stress ${report.stress.upserted}`,
    `Nutrition ${report.nutrition.upserted}`,
  ];
  const failed =
    report.sleep.failed + report.workouts.failed + report.stress.failed + report.nutrition.failed;
  return { line: parts.join(' · '), failed };
}

async function syncSleepData(startDate: Date, endDate: Date): Promise<CategoryReport> {
  const report = emptyReport();
  try {
    const sleepSamples = await healthkitService.getSleepSamples(startDate, endDate);
    report.fetched = sleepSamples.length;

    const samplesByDate = new Map<string, typeof sleepSamples>();
    for (const sample of sleepSamples) {
      const sampleEndDate = new Date(sample.endDate);
      const dateKey = toISODateString(dateKeyFromDate(sampleEndDate));
      const existing = samplesByDate.get(dateKey) || [];
      existing.push(sample);
      samplesByDate.set(dateKey, existing);
    }

    for (const [dateKey, samples] of samplesByDate) {
      const processed = healthkitService.processSleepData(samples, dateKey);
      if (!processed) continue;
      try {
        await upsertSleep({
          date: processed.date,
          hours: processed.hours,
          quality: processed.quality,
        });
        report.upserted += 1;
      } catch (error) {
        report.failed += 1;
        logger.warn('[HealthKit] Failed to sync sleep for date:', dateKey, error);
      }
    }
    report.status = report.upserted > 0 ? 'ok' : 'empty';
  } catch (error) {
    report.status = 'error';
    report.error = String(error instanceof Error ? error.message : error);
    logger.error('[HealthKit] Sleep sync error:', error);
  }
  return report;
}

interface WorkoutDetail {
  name: string;
  date: string;
  duration: number;
  hrSamples: number;
  avgHr: number;
  intensity: number;
}

async function syncWorkoutData(
  startDate: Date,
  endDate: Date,
  age: number | null,
): Promise<CategoryReport> {
  const report = emptyReport();
  const workoutDetails: WorkoutDetail[] = [];
  try {
    const workouts = await healthkitService.getWorkouts(startDate, endDate);
    report.fetched = workouts.length;

    const hrSamples =
      age !== null ? await healthkitService.getHeartRateSamples(startDate, endDate) : [];
    report.details = { hrSamplesAvailable: hrSamples.length, age };

    for (const workout of workouts) {
      if (workout.duration < 1) continue;

      const workoutDate = new Date(workout.startDate);
      const dateString = toISODateString(dateKeyFromDate(workoutDate));
      const processed = healthkitService.processWorkouts([workout], dateString);
      if (processed.length === 0) continue;

      const entry = processed[0];
      const intensity = healthkitService.computeWorkoutIntensity(workout, hrSamples, age);

      const start = new Date(workout.startDate).getTime();
      const end = new Date(workout.endDate).getTime();
      const inWindow = hrSamples.filter((s) => {
        const t = new Date(s.startDate).getTime();
        return t >= start && t <= end;
      });
      const avgHr =
        inWindow.length > 0
          ? Math.round(inWindow.reduce((sum, s) => sum + s.value, 0) / inWindow.length)
          : 0;
      workoutDetails.push({
        name: workout.activityName,
        date: dateString,
        duration: entry.duration,
        hrSamples: inWindow.length,
        avgHr,
        intensity,
      });

      try {
        const sportTypeId = await getSportTypeId(entry.sportType as SportType);
        await createSport({
          date: entry.date,
          sport_type_id: sportTypeId,
          duration: entry.duration,
          intensity,
          note: `Synced from Apple Health: ${workout.activityName}`,
        });
        report.upserted += 1;
      } catch (error) {
        report.failed += 1;
        logger.warn('[HealthKit] Failed to sync workout:', error);
      }
    }
    report.details = { ...report.details, workouts: workoutDetails };
    report.status = report.upserted > 0 ? 'ok' : 'empty';
  } catch (error) {
    report.status = 'error';
    report.error = String(error instanceof Error ? error.message : error);
    logger.error('[HealthKit] Workout sync error:', error);
  }
  return report;
}

async function syncStressData(startDate: Date, endDate: Date): Promise<CategoryReport> {
  const report = emptyReport();
  try {
    const [hrvSamples, restingHrSamples] = await Promise.all([
      healthkitService.getHrvSamples(startDate, endDate),
      healthkitService.getRestingHeartRateSamples(startDate, endDate),
    ]);
    report.fetched = hrvSamples.length + restingHrSamples.length;

    const baselineHrv =
      hrvSamples.length > 0
        ? hrvSamples.reduce((sum, s) => sum + s.value, 0) / hrvSamples.length
        : 0;
    const baselineRestingHr =
      restingHrSamples.length > 0
        ? restingHrSamples.reduce((sum, s) => sum + s.value, 0) / restingHrSamples.length
        : 0;

    report.details = {
      hrvSamples: hrvSamples.length,
      restingHrSamples: restingHrSamples.length,
      baselineHrv: Math.round(baselineHrv * 10) / 10,
      baselineRestingHr: Math.round(baselineRestingHr * 10) / 10,
    };

    if (hrvSamples.length === 0 && restingHrSamples.length === 0) {
      return report;
    }

    const dateKeys = buildDateKeys(startDate, endDate);
    const processed = healthkitService.processStressData(hrvSamples, restingHrSamples, dateKeys);

    for (const entry of processed) {
      try {
        await upsertStress({ date: entry.date, level: entry.level });
        report.upserted += 1;
      } catch (error) {
        report.failed += 1;
        logger.warn('[HealthKit] Failed to sync stress for date:', entry.date, error);
      }
    }
    report.status = report.upserted > 0 ? 'ok' : 'empty';
  } catch (error) {
    report.status = 'error';
    report.error = String(error instanceof Error ? error.message : error);
    logger.error('[HealthKit] Stress sync error:', error);
  }
  return report;
}

async function syncNutritionData(date: Date): Promise<CategoryReport> {
  const report = emptyReport();
  try {
    const nutrition = await healthkitService.getNutrition(date);
    if (!nutrition) return report;
    report.fetched = 1;

    const dateString = toISODateString(dateKeyFromDate(date));
    const processed = healthkitService.processNutrition(nutrition, dateString);
    report.details = { ...processed };

    const noteLines = [];
    if (processed.calories > 0) noteLines.push(`Calories: ${processed.calories} kcal`);
    if (processed.protein > 0) noteLines.push(`Protein: ${processed.protein}g`);
    if (processed.carbs > 0) noteLines.push(`Carbs: ${processed.carbs}g`);
    if (processed.fat > 0) noteLines.push(`Fat: ${processed.fat}g`);

    if (noteLines.length === 0) return report;

    try {
      await createMeal({
        date: processed.date,
        food_name: 'HealthKit',
        note: noteLines.join('\n'),
        meal_type: null,
        quality: 3,
      });
      report.upserted += 1;
      report.status = 'ok';
    } catch (error) {
      report.failed += 1;
      report.status = 'error';
      report.error = String(error instanceof Error ? error.message : error);
      logger.warn('[HealthKit] Failed to sync nutrition:', error);
    }
  } catch (error) {
    report.status = 'error';
    report.error = String(error instanceof Error ? error.message : error);
    logger.error('[HealthKit] Nutrition sync error:', error);
  }
  return report;
}
