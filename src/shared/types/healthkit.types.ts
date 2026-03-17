/**
 * HealthKit Types
 * Types for Apple HealthKit data integration
 */

// Sleep analysis value types from HealthKit
export type SleepValue = 'INBED' | 'ASLEEP' | 'AWAKE' | 'CORE' | 'DEEP' | 'REM';

export interface HealthKitSleepSample {
  startDate: string;
  endDate: string;
  value: SleepValue;
}

export interface HealthKitWorkout {
  activityId: number;
  activityName: string;
  duration: number; // minutes
  startDate: string;
  endDate: string;
  calories?: number;
  distance?: number;
}

export interface HealthKitNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Processed data ready for journal entry creation
export interface ProcessedSleepData {
  date: string;
  hours: number;
  quality: 1 | 2 | 3 | 4 | 5;
}

export interface ProcessedWorkoutData {
  date: string;
  sportType: string;
  duration: number;
  intensity: 1 | 2 | 3 | 4 | 5;
}

export interface ProcessedNutritionData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// HealthKit permissions
export const HEALTHKIT_PERMISSIONS = {
  read: [
    'SleepAnalysis',
    'AppleExerciseTime',
    'Workout',
    'DietaryEnergyConsumed',
    'DietaryProtein',
    'DietaryCarbohydrates',
    'DietaryFatTotal',
  ],
  write: [] as string[],
} as const;
