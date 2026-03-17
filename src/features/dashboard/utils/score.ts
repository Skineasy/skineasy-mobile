import { scoreConfig } from '@shared/config/scoreConfig';
import type {
  MealEntry,
  ObservationEntry,
  SleepEntry,
  SportEntry,
  StressEntry,
} from '@shared/types/journal.types';

const { weights, sleep, activity, nutrition } = scoreConfig;

export function calculateSleepScore(entry: SleepEntry | undefined): number {
  if (!entry) return 0;

  let hoursScore: number;
  if (entry.hours >= sleep.optimalHoursMin && entry.hours <= sleep.optimalHoursMax) {
    hoursScore = 100;
  } else if (entry.hours < sleep.optimalHoursMin) {
    hoursScore = Math.max(0, (entry.hours / sleep.optimalHoursMin) * 100);
  } else {
    hoursScore = Math.max(
      0,
      100 - (entry.hours - sleep.optimalHoursMax) * sleep.oversleepPenaltyPerHour,
    );
  }

  const qualityScore = entry.quality * 20;

  return hoursScore * sleep.hoursWeight + qualityScore * sleep.qualityWeight;
}

export function calculateActivityScore(entries: SportEntry[]): number {
  if (entries.length === 0) return 0;

  const totalMinutes = entries.reduce((sum, e) => sum + e.duration, 0);
  const avgIntensity = entries.reduce((sum, e) => sum + e.intensity, 0) / entries.length;

  const durationScore = Math.min(100, (totalMinutes / activity.targetMinutes) * 100);

  const intensityBonus = Math.max(0, avgIntensity - activity.intensityBonusThreshold);
  const intensityMultiplier = 1 + intensityBonus * activity.intensityBonusPerLevel;

  return Math.min(100, durationScore * intensityMultiplier);
}

export function calculateNutritionScore(entries: MealEntry[]): number {
  if (entries.length === 0) return 0;

  const mealTypes = new Set(entries.map((e) => e.meal_type).filter(Boolean));
  const typeScore = mealTypes.size * nutrition.pointsPerMealType;

  const detailedMeals = entries.filter((e) => e.photo_url || e.food_name).length;
  const detailBonus = Math.min(
    nutrition.maxDetailBonus,
    detailedMeals * nutrition.detailBonusPerMeal,
  );

  return Math.min(100, typeScore + detailBonus);
}

export function calculateStressScore(entry: StressEntry | undefined): number {
  if (!entry) return 0;

  const { stress } = scoreConfig;
  // Inverse relationship: lower stress level = higher score
  // Level 1 -> 100, Level 5 -> 20
  const scoreRange = stress.maxScore - stress.minScore;
  const levelRange = 4; // 5 - 1
  const scorePerLevel = scoreRange / levelRange;

  return stress.maxScore - (entry.level - 1) * scorePerLevel;
}

export function calculateObservationScore(entry: ObservationEntry | undefined): number {
  if (!entry) return 0;

  const { observations } = scoreConfig;
  const raw =
    observations.baseScore +
    entry.positives.length * observations.pointsPerPositive -
    entry.negatives.length * observations.pointsPerNegative +
    observations.trackingBonus;

  return Math.min(100, Math.max(0, raw));
}

export function calculateDayScore(
  sleepEntry: SleepEntry | undefined,
  mealEntries: MealEntry[],
  sportEntries: SportEntry[],
  stressEntry?: StressEntry,
  observationEntry?: ObservationEntry,
): number {
  const sleepScore = calculateSleepScore(sleepEntry);
  const nutritionScore = calculateNutritionScore(mealEntries);
  const activityScore = calculateActivityScore(sportEntries);
  const stressScore = calculateStressScore(stressEntry);
  const observationScore = calculateObservationScore(observationEntry);

  return Math.round(
    sleepScore * weights.sleep +
      nutritionScore * weights.nutrition +
      activityScore * weights.activity +
      stressScore * weights.stress +
      observationScore * weights.observations,
  );
}
