import { z } from 'zod';

/**
 * Sport Types Enum (matching backend)
 */
export const sportTypeSchema = z.enum([
  'yoga',
  'cardio',
  'swimming',
  'running',
  'cycling',
  'strength',
  'pilates',
  'hiking',
  'dancing',
  'other',
]);

/**
 * Meal Types Enum (matching backend)
 */
export const mealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);

/**
 * Sleep Quality (1-5 scale matching backend)
 */
export const sleepQualitySchema = z.number().int().min(1).max(5);

/**
 * Sport Intensity (1-5 scale matching backend)
 */
export const sportIntensitySchema = z.number().int().min(1).max(5);

/**
 * Stress Level (1-5 scale matching backend)
 */
export const stressLevelSchema = z.number().int().min(1).max(5);

/**
 * Sleep Entry Schema (API DTO)
 */
export const sleepEntrySchema = z.object({
  hours: z
    .number()
    .min(0, 'journal.sleep.hoursMin')
    .max(24, 'journal.sleep.hoursMax')
    .refine((val) => Number.isFinite(val), {
      message: 'journal.sleep.hoursInvalid',
    }),
  quality: sleepQualitySchema,
});

export type SleepEntryInput = z.infer<typeof sleepEntrySchema>;

/**
 * Sport Entry Schema (API DTO)
 */
export const sportEntrySchema = z.object({
  type: sportTypeSchema,
  duration: z.number().int().min(1, 'journal.sport.durationMin'),
  intensity: sportIntensitySchema,
});

export type SportEntryInput = z.infer<typeof sportEntrySchema>;

/**
 * Meal Entry Schema (API DTO)
 */
export const mealEntrySchema = z.object({
  photo_url: z.url().nullable().optional(),
  food_name: z
    .string()
    .min(1, 'journal.nutrition.foodNameRequired')
    .max(200, 'journal.nutrition.foodNameMaxLength'),
  note: z.string().max(500, 'journal.nutrition.noteMaxLength').nullable().optional(),
  meal_type: mealTypeSchema,
});

export type MealEntryInput = z.infer<typeof mealEntrySchema>;

/**
 * Form Schemas (for React Hook Form)
 * These include UI-specific fields before conversion to API DTOs
 */

export const sleepFormSchema = z.object({
  minutes: z.number().min(0).max(840), // 0-14 hours in minutes
  quality: sleepQualitySchema,
});

export type SleepFormInput = z.infer<typeof sleepFormSchema>;

export const sportFormSchema = z.object({
  type: sportTypeSchema,
  duration: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
    message: 'journal.sport.durationMin',
  }),
  intensity: sportIntensitySchema,
  note: z.string().max(500, 'journal.sport.noteMaxLength').nullable().optional(),
});

export type SportFormInput = z.infer<typeof sportFormSchema>;

export const mealFormSchema = z.object({
  imageUri: z.string().nullable().optional(), // Local image URI before upload
  food_name: z
    .string()
    .min(1, 'journal.nutrition.foodNameRequired')
    .max(200, 'journal.nutrition.foodNameMaxLength'),
  note: z.string().max(500, 'journal.nutrition.noteMaxLength').nullable().optional(),
  meal_type: mealTypeSchema,
});

export type MealFormInput = z.infer<typeof mealFormSchema>;

export const stressFormSchema = z.object({
  level: stressLevelSchema,
});

export type StressFormInput = z.infer<typeof stressFormSchema>;

/**
 * Observation Form Schema
 * At least one positive or negative observation required
 */
export const observationFormSchema = z
  .object({
    positives: z.array(z.string()),
    negatives: z.array(z.string()),
  })
  .refine((data) => data.positives.length > 0 || data.negatives.length > 0, {
    message: 'journal.observations.atLeastOneRequired',
  });

export type ObservationFormInput = z.infer<typeof observationFormSchema>;

// Legacy exports for backward compatibility with existing code
export const sleepQualityEnum = z.enum(['bad', 'neutral', 'good']);
export const sportActivityEnum = sportTypeSchema;

export const sleepSchema = z.object({
  hours: z.number().min(0).max(24),
  quality: sleepQualityEnum,
  date: z.string().optional(),
});

export const nutritionSchema = z.object({
  imageUri: z.string(),
  note: z.string().optional(),
  date: z.string().optional(),
});

export const sportSchema = z.object({
  activity: sportActivityEnum,
  duration: z.number().min(1),
  note: z.string().optional(),
  date: z.string().optional(),
});

export const journalEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(),
  sleep: sleepSchema.optional(),
  nutrition: z.array(nutritionSchema).optional(),
  sport: z.array(sportSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SleepQuality = z.infer<typeof sleepQualityEnum>;
export type SleepEntry = z.infer<typeof sleepSchema>;
export type NutritionEntry = z.infer<typeof nutritionSchema>;
export type SportActivity = z.infer<typeof sportActivityEnum>;
export type SportEntry = z.infer<typeof sportSchema>;
export type JournalEntry = z.infer<typeof journalEntrySchema>;
