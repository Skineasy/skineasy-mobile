import { Platform } from 'react-native';
import {
  CategoryValueSleepAnalysis,
  isHealthDataAvailable,
  queryCategorySamples,
  queryQuantitySamples,
  queryWorkoutSamples,
  requestAuthorization,
} from '@kingstinct/react-native-healthkit';

import type {
  HealthKitHeartSample,
  HealthKitNutrition,
  HealthKitSleepSample,
  HealthKitWorkout,
  ProcessedNutritionData,
  ProcessedSleepData,
  ProcessedStressData,
  ProcessedWorkoutData,
  SleepValue,
} from '@shared/types/healthkit.types';
import type {
  SleepQuality,
  SportIntensity,
  SportType,
  StressLevel,
} from '@shared/types/journal.types';
import { logger } from '@shared/utils/logger';

// Maps HKWorkoutActivityType numeric values to our SportType.
// See @kingstinct/react-native-healthkit `WorkoutActivityType` enum.
const WORKOUT_TYPE_MAP: Record<number, SportType> = {
  13: 'cycling',
  14: 'dancing',
  20: 'strength', // functionalStrengthTraining
  24: 'hiking',
  37: 'running',
  46: 'swimming',
  50: 'strength', // traditionalStrengthTraining
  57: 'yoga',
  66: 'pilates',
  73: 'cardio', // mixedCardio
  77: 'dancing', // cardioDance
  78: 'dancing', // socialDance
};

const READ_PERMISSIONS = [
  'HKCategoryTypeIdentifierSleepAnalysis',
  'HKWorkoutTypeIdentifier',
  'HKQuantityTypeIdentifierDietaryEnergyConsumed',
  'HKQuantityTypeIdentifierDietaryProtein',
  'HKQuantityTypeIdentifierDietaryCarbohydrates',
  'HKQuantityTypeIdentifierDietaryFatTotal',
  'HKQuantityTypeIdentifierHeartRate',
  'HKQuantityTypeIdentifierRestingHeartRate',
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
] as const;

function isAvailable(): boolean {
  return Platform.OS === 'ios' && isHealthDataAvailable();
}

async function requestAuthorizationWrapper(): Promise<boolean> {
  if (!isAvailable()) return false;
  try {
    return await requestAuthorization({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toRead: READ_PERMISSIONS as any,
    });
  } catch (error) {
    logger.error('[HealthKit] requestAuthorization caught:', error);
    return false;
  }
}

interface NativeProbeResult {
  platform: string;
  moduleLoaded: boolean;
  moduleType: string;
  hasInitFn: boolean;
  initError: string | null;
  initErrorRaw: unknown;
}

async function probeNative(): Promise<NativeProbeResult> {
  const result: NativeProbeResult = {
    platform: Platform.OS,
    moduleLoaded: typeof requestAuthorization === 'function',
    moduleType: typeof requestAuthorization,
    hasInitFn: typeof requestAuthorization === 'function',
    initError: null,
    initErrorRaw: null,
  };
  if (!result.hasInitFn) {
    result.initError = 'requestAuthorization is not a function — native module is not linked.';
    return result;
  }
  try {
    const ok = await requestAuthorizationWrapper();
    if (!ok) {
      result.initError = 'requestAuthorization returned false';
    }
  } catch (error) {
    result.initErrorRaw = error;
    result.initError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  }
  return result;
}

function sleepValueToString(value: number): SleepValue {
  switch (value) {
    case CategoryValueSleepAnalysis.inBed:
      return 'INBED';
    case CategoryValueSleepAnalysis.awake:
      return 'AWAKE';
    case CategoryValueSleepAnalysis.asleepCore:
      return 'CORE';
    case CategoryValueSleepAnalysis.asleepDeep:
      return 'DEEP';
    case CategoryValueSleepAnalysis.asleepREM:
      return 'REM';
    default:
      return 'ASLEEP';
  }
}

async function getSleepSamples(startDate: Date, endDate: Date): Promise<HealthKitSleepSample[]> {
  try {
    const samples = await queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', {
      limit: 0,
      ascending: true,
      filter: { date: { startDate, endDate } },
    });
    return samples.map((s) => ({
      startDate: new Date(s.startDate).toISOString(),
      endDate: new Date(s.endDate).toISOString(),
      value: sleepValueToString(s.value as unknown as number),
    }));
  } catch (error) {
    logger.error('[HealthKit] getSleepSamples error:', error);
    return [];
  }
}

async function getWorkouts(startDate: Date, endDate: Date): Promise<HealthKitWorkout[]> {
  try {
    const workouts = await queryWorkoutSamples({
      limit: 0,
      ascending: true,
      filter: { date: { startDate, endDate } },
    });
    return workouts.map((w) => ({
      activityId: w.workoutActivityType as unknown as number,
      activityName: String(w.workoutActivityType),
      duration: Math.round((w.duration?.quantity ?? 0) / 60),
      startDate: new Date(w.startDate).toISOString(),
      endDate: new Date(w.endDate).toISOString(),
      calories: w.totalEnergyBurned?.quantity,
      distance: w.totalDistance?.quantity,
    }));
  } catch (error) {
    logger.error('[HealthKit] getWorkouts error:', error);
    return [];
  }
}

async function sumQuantity(
  identifier:
    | 'HKQuantityTypeIdentifierDietaryEnergyConsumed'
    | 'HKQuantityTypeIdentifierDietaryProtein'
    | 'HKQuantityTypeIdentifierDietaryCarbohydrates'
    | 'HKQuantityTypeIdentifierDietaryFatTotal',
  unit: 'kcal' | 'g',
  date: Date,
): Promise<number> {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const samples = await queryQuantitySamples(identifier as any, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      unit: unit as any,
      limit: 0,
      ascending: true,
      filter: { date: { startDate, endDate } },
    });
    const total = samples.reduce((sum, s) => sum + (s.quantity ?? 0), 0);
    return Math.round(total);
  } catch (error) {
    logger.error(`[HealthKit] sumQuantity ${identifier} error:`, error);
    return 0;
  }
}

async function getNutrition(date: Date): Promise<HealthKitNutrition | null> {
  try {
    const [calories, protein, carbs, fat] = await Promise.all([
      sumQuantity('HKQuantityTypeIdentifierDietaryEnergyConsumed', 'kcal', date),
      sumQuantity('HKQuantityTypeIdentifierDietaryProtein', 'g', date),
      sumQuantity('HKQuantityTypeIdentifierDietaryCarbohydrates', 'g', date),
      sumQuantity('HKQuantityTypeIdentifierDietaryFatTotal', 'g', date),
    ]);
    if (calories === 0 && protein === 0 && carbs === 0 && fat === 0) return null;
    return { calories, protein, carbs, fat };
  } catch (error) {
    logger.error('[HealthKit] getNutrition error:', error);
    return null;
  }
}

async function getQuantitySamples(
  identifier:
    | 'HKQuantityTypeIdentifierHeartRate'
    | 'HKQuantityTypeIdentifierRestingHeartRate'
    | 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  unit: 'count/min' | 'ms',
  startDate: Date,
  endDate: Date,
): Promise<HealthKitHeartSample[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const samples = await queryQuantitySamples(identifier as any, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      unit: unit as any,
      limit: 0,
      ascending: true,
      filter: { date: { startDate, endDate } },
    });
    return samples.map((s) => ({
      startDate: new Date(s.startDate).toISOString(),
      endDate: new Date(s.endDate).toISOString(),
      value: s.quantity,
    }));
  } catch (error) {
    logger.error(`[HealthKit] getQuantitySamples ${identifier} error:`, error);
    return [];
  }
}

function getHeartRateSamples(startDate: Date, endDate: Date): Promise<HealthKitHeartSample[]> {
  return getQuantitySamples('HKQuantityTypeIdentifierHeartRate', 'count/min', startDate, endDate);
}

function getRestingHeartRateSamples(
  startDate: Date,
  endDate: Date,
): Promise<HealthKitHeartSample[]> {
  return getQuantitySamples(
    'HKQuantityTypeIdentifierRestingHeartRate',
    'count/min',
    startDate,
    endDate,
  );
}

function getHrvSamples(startDate: Date, endDate: Date): Promise<HealthKitHeartSample[]> {
  return getQuantitySamples(
    'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
    'ms',
    startDate,
    endDate,
  );
}

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

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function samplesForDate(samples: HealthKitHeartSample[], dateKey: string): HealthKitHeartSample[] {
  return samples.filter((s) => s.startDate.slice(0, 10) === dateKey);
}

const STRESS_LEVEL_BOUNDARIES: Array<{ score: number; level: StressLevel }> = [
  { score: 1.5, level: 5 },
  { score: 0.5, level: 4 },
  { score: -0.5, level: 3 },
  { score: -1.5, level: 2 },
];

function deriveStressLevel(score: number): StressLevel {
  for (const { score: threshold, level } of STRESS_LEVEL_BOUNDARIES) {
    if (score >= threshold) return level;
  }
  return 1;
}

function processStressForDate(
  dateKey: string,
  hrvSamples: HealthKitHeartSample[],
  restingHrSamples: HealthKitHeartSample[],
  baselineHrv: number,
  baselineRestingHr: number,
): ProcessedStressData | null {
  const dayHrv = average(samplesForDate(hrvSamples, dateKey).map((s) => s.value));
  const dayHr = average(samplesForDate(restingHrSamples, dateKey).map((s) => s.value));
  if (dayHrv === 0 && dayHr === 0) return null;
  if (baselineHrv === 0 && baselineRestingHr === 0) return null;

  let score = 0;
  let signals = 0;
  if (dayHrv > 0 && baselineHrv > 0) {
    score += (baselineHrv - dayHrv) / baselineHrv;
    signals += 1;
  }
  if (dayHr > 0 && baselineRestingHr > 0) {
    score += (dayHr - baselineRestingHr) / baselineRestingHr;
    signals += 1;
  }
  if (signals === 0) return null;
  const normalized = (score / signals) * 10;
  return { date: dateKey, level: deriveStressLevel(normalized) };
}

function processStressData(
  hrvSamples: HealthKitHeartSample[],
  restingHrSamples: HealthKitHeartSample[],
  dateKeys: string[],
): ProcessedStressData[] {
  const baselineHrv = average(hrvSamples.map((s) => s.value));
  const baselineRestingHr = average(restingHrSamples.map((s) => s.value));
  return dateKeys
    .map((dateKey) =>
      processStressForDate(dateKey, hrvSamples, restingHrSamples, baselineHrv, baselineRestingHr),
    )
    .filter((d): d is ProcessedStressData => d !== null);
}

function calculateAge(birthday: string | null | undefined): number | null {
  if (!birthday) return null;
  const birth = new Date(birthday);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

function intensityFromHrPercent(percent: number): SportIntensity {
  if (percent >= 0.9) return 5;
  if (percent >= 0.8) return 4;
  if (percent >= 0.7) return 3;
  if (percent >= 0.6) return 2;
  return 1;
}

function computeWorkoutIntensity(
  workout: HealthKitWorkout,
  hrSamples: HealthKitHeartSample[],
  age: number | null,
): SportIntensity {
  if (age === null) return 3;
  const start = new Date(workout.startDate).getTime();
  const end = new Date(workout.endDate).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 3;
  const inWindow = hrSamples.filter((s) => {
    const t = new Date(s.startDate).getTime();
    return t >= start && t <= end;
  });
  if (inWindow.length === 0) return 3;
  const avgHr = average(inWindow.map((s) => s.value));
  const maxHr = 220 - age;
  if (maxHr <= 0) return 3;
  return intensityFromHrPercent(avgHr / maxHr);
}

export const healthkitService = {
  isAvailable,
  requestAuthorization: requestAuthorizationWrapper,
  probeNative,
  getSleepSamples,
  getWorkouts,
  getNutrition,
  getHeartRateSamples,
  getRestingHeartRateSamples,
  getHrvSamples,
  processSleepData,
  processWorkouts,
  processNutrition,
  processStressData,
  computeWorkoutIntensity,
  calculateAge,
};
