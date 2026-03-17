import { Platform } from 'react-native';
import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
  HealthValue,
} from 'react-native-health';

import type {
  HealthKitNutrition,
  HealthKitSleepSample,
  HealthKitWorkout,
  ProcessedNutritionData,
  ProcessedSleepData,
  ProcessedWorkoutData,
  SleepValue,
} from '@shared/types/healthkit.types';
import type { SleepQuality, SportIntensity, SportType } from '@shared/types/journal.types';
import { logger } from '@shared/utils/logger';

// HealthKit workout type to our sport type mapping
const WORKOUT_TYPE_MAP: Record<number, SportType> = {
  13: 'cycling',
  37: 'running',
  46: 'swimming',
  52: 'hiking',
  20: 'dancing',
  50: 'yoga',
  63: 'pilates',
  25: 'cardio',
};

// Use string literals - the HealthPermission enum is TypeScript-only and undefined at runtime
const PERMISSIONS = {
  permissions: {
    read: ['SleepAnalysis', 'Workout', 'EnergyConsumed', 'Protein', 'Carbohydrates', 'FatTotal'],
    write: [],
  },
} as HealthKitPermissions;

function isAvailable(): boolean {
  return Platform.OS === 'ios';
}

function initHealthKit(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isAvailable()) {
      reject(new Error('HealthKit not available on this platform'));
      return;
    }

    AppleHealthKit.initHealthKit(PERMISSIONS, (error) => {
      if (error) {
        logger.error('[HealthKit] Init error:', error);
        reject(error);
      } else {
        logger.info('[HealthKit] Initialized successfully');
        resolve();
      }
    });
  });
}

async function requestAuthorization(): Promise<boolean> {
  try {
    await initHealthKit();
    return true;
  } catch {
    return false;
  }
}

interface SleepSampleResult {
  startDate: string;
  endDate: string;
  value: string;
}

function getSleepSamples(startDate: Date, endDate: Date): Promise<HealthKitSleepSample[]> {
  return new Promise((resolve, reject) => {
    const options: HealthInputOptions = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    AppleHealthKit.getSleepSamples(options, (error, results) => {
      if (error) {
        logger.error('[HealthKit] getSleepSamples error:', error);
        reject(error);
        return;
      }

      const samples: HealthKitSleepSample[] = (
        (results as unknown as SleepSampleResult[]) || []
      ).map((sample) => ({
        startDate: sample.startDate,
        endDate: sample.endDate,
        value: (sample.value || 'ASLEEP') as SleepValue,
      }));

      resolve(samples);
    });
  });
}

interface WorkoutResult {
  activityId?: number;
  activityName?: string;
  duration?: number;
  start?: string;
  end?: string;
  calories?: number;
  distance?: number;
}

function getWorkouts(startDate: Date, endDate: Date): Promise<HealthKitWorkout[]> {
  return new Promise((resolve, reject) => {
    const options: HealthInputOptions = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    AppleHealthKit.getAnchoredWorkouts(options, (error, results) => {
      if (error) {
        logger.error('[HealthKit] getWorkouts error:', error);
        reject(error);
        return;
      }

      const workoutResults = (results?.data as unknown as WorkoutResult[]) || [];
      const workouts: HealthKitWorkout[] = workoutResults.map((workout) => ({
        activityId: workout.activityId || 0,
        activityName: workout.activityName || 'Unknown',
        duration: Math.round((workout.duration || 0) / 60),
        startDate: workout.start || '',
        endDate: workout.end || '',
        calories: workout.calories,
        distance: workout.distance,
      }));

      resolve(workouts);
    });
  });
}

function getEnergyConsumed(date: Date): Promise<number> {
  return new Promise((resolve, reject) => {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const options: HealthInputOptions = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    AppleHealthKit.getEnergyConsumedSamples(options, (error: string, results: HealthValue[]) => {
      if (error) {
        logger.error('[HealthKit] getEnergyConsumed error:', error);
        reject(error);
        return;
      }

      const total = (results || []).reduce((sum, sample) => sum + (sample.value || 0), 0);
      resolve(Math.round(total));
    });
  });
}

function getProtein(date: Date): Promise<number> {
  return new Promise((resolve) => {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const options: HealthInputOptions = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    AppleHealthKit.getProteinSamples(options, (error: string, results: HealthValue[]) => {
      if (error) {
        resolve(0);
        return;
      }

      const total = (results || []).reduce((sum, sample) => sum + (sample.value || 0), 0);
      resolve(Math.round(total));
    });
  });
}

function getCarbs(date: Date): Promise<number> {
  return new Promise((resolve) => {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const options: HealthInputOptions = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    AppleHealthKit.getCarbohydratesSamples(options, (error: string, results: HealthValue[]) => {
      if (error) {
        resolve(0);
        return;
      }

      const total = (results || []).reduce((sum, sample) => sum + (sample.value || 0), 0);
      resolve(Math.round(total));
    });
  });
}

function getFat(date: Date): Promise<number> {
  return new Promise((resolve) => {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const options: HealthInputOptions = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    AppleHealthKit.getTotalFatSamples(options, (error: string, results: HealthValue[]) => {
      if (error) {
        resolve(0);
        return;
      }

      const total = (results || []).reduce((sum, sample) => sum + (sample.value || 0), 0);
      resolve(Math.round(total));
    });
  });
}

async function getNutrition(date: Date): Promise<HealthKitNutrition | null> {
  try {
    const [calories, protein, carbs, fat] = await Promise.all([
      getEnergyConsumed(date),
      getProtein(date),
      getCarbs(date),
      getFat(date),
    ]);

    if (calories === 0 && protein === 0 && carbs === 0 && fat === 0) {
      return null;
    }

    return { calories, protein, carbs, fat };
  } catch (error) {
    logger.error('[HealthKit] getNutrition error:', error);
    return null;
  }
}

// Processing functions

function calculateSleepQuality(asleepHours: number, inBedHours: number): SleepQuality {
  if (inBedHours === 0) return 3;
  const efficiency = asleepHours / inBedHours;
  if (efficiency > 0.9) return 5;
  if (efficiency > 0.8) return 4;
  if (efficiency > 0.7) return 3;
  if (efficiency > 0.6) return 2;
  return 1;
}

function processSleepData(
  samples: HealthKitSleepSample[],
  date: string,
): ProcessedSleepData | null {
  if (samples.length === 0) return null;

  let asleepMinutes = 0;
  let inBedMinutes = 0;

  for (const sample of samples) {
    const start = new Date(sample.startDate);
    const end = new Date(sample.endDate);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    if (sample.value === 'INBED') {
      inBedMinutes += durationMinutes;
    } else if (
      sample.value === 'ASLEEP' ||
      sample.value === 'CORE' ||
      sample.value === 'DEEP' ||
      sample.value === 'REM'
    ) {
      asleepMinutes += durationMinutes;
      inBedMinutes += durationMinutes;
    }
  }

  const asleepHours = asleepMinutes / 60;
  const inBedHours = inBedMinutes / 60;

  if (asleepHours === 0) return null;

  return {
    date,
    hours: Math.round(asleepHours * 10) / 10,
    quality: calculateSleepQuality(asleepHours, inBedHours),
  };
}

function mapWorkoutType(activityId: number): SportType {
  return WORKOUT_TYPE_MAP[activityId] || 'other';
}

function processWorkouts(workouts: HealthKitWorkout[], date: string): ProcessedWorkoutData[] {
  return workouts
    .filter((w) => w.duration > 0)
    .map((workout) => ({
      date,
      sportType: mapWorkoutType(workout.activityId),
      duration: workout.duration,
      intensity: 3 as SportIntensity,
    }));
}

function processNutrition(nutrition: HealthKitNutrition, date: string): ProcessedNutritionData {
  return {
    date,
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
  };
}

export const healthkitService = {
  isAvailable,
  requestAuthorization,
  getSleepSamples,
  getWorkouts,
  getNutrition,
  processSleepData,
  processWorkouts,
  processNutrition,
};
