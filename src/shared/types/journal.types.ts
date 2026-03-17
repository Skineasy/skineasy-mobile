/**
 * Journal Entry Types
 * Based on BACKEND_API.md specification
 */

// Sport Types (predefined enum from backend)
export type SportType =
  | 'yoga'
  | 'cardio'
  | 'swimming'
  | 'running'
  | 'cycling'
  | 'strength'
  | 'pilates'
  | 'hiking'
  | 'dancing'
  | 'other';

// Sport Type Info (from backend /api/v1/sport-types)
export interface SportTypeInfo {
  id: number;
  name: SportType;
  created_at: string;
}

// Meal Types (predefined enum from backend)
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// Sleep Quality (1-5 scale)
export type SleepQuality = 1 | 2 | 3 | 4 | 5;

// Sport Intensity (1-5 scale)
export type SportIntensity = 1 | 2 | 3 | 4 | 5;

// Stress Level (1-5 scale)
export type StressLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Sleep Entry
 * One entry per customer per day (unique constraint)
 */
export interface SleepEntry {
  id: number;
  customer_id: number;
  date: string; // ISO 8601 UTC format: "2025-01-15T00:00:00.000Z"
  hours: number; // 0-24
  quality: SleepQuality; // 1-5
  created_at: string; // ISO 8601
}

/**
 * Sport Entry
 * Multiple entries per day allowed
 */
export interface SportEntry {
  id: number;
  customer_id: number;
  date: string; // ISO 8601 UTC format: "2025-01-15T00:00:00.000Z"
  sport_type_id: number; // Foreign key to sport_types table
  sportType: SportTypeInfo; // Populated sport type object from backend
  duration: number; // minutes (min: 1)
  intensity: SportIntensity; // 1-5
  note: string | null; // Optional text note
  created_at: string; // ISO 8601
}

/**
 * Meal Entry
 * Multiple entries per day allowed
 */
export interface MealEntry {
  id: number;
  customer_id: number;
  date: string; // ISO 8601 UTC format: "2025-01-15T00:00:00.000Z"
  photo_url: string | null;
  food_name: string | null; // max 200 chars - Name/title of the meal
  note: string | null;
  meal_type: MealType | null;
  created_at: string; // ISO 8601
}

/**
 * Stress Entry
 * One entry per customer per day (unique constraint)
 */
export interface StressEntry {
  id: number;
  customer_id: number;
  date: string; // ISO 8601 UTC format: "2025-01-15T00:00:00.000Z"
  level: StressLevel; // 1-5
  note: string | null;
  created_at: string; // ISO 8601
}

/**
 * DTOs for creating/updating entries
 */

export interface CreateSleepEntryDto {
  date: string; // ISO 8601 UTC format: "2025-01-15T00:00:00.000Z"
  hours: number; // 0-24
  quality: SleepQuality; // 1-5
}

export interface CreateSportEntryDto {
  date: string; // ISO 8601 UTC format: "2025-01-15T00:00:00.000Z"
  sport_type_id: number; // Sport type ID from backend
  duration: number; // minutes (min: 1)
  intensity: SportIntensity; // 1-5
  note?: string | null; // Optional text note (max 500 chars)
}

export interface CreateMealEntryDto {
  date: string; // ISO 8601 UTC format: "2025-01-15T00:00:00.000Z"
  photo_url?: string | null;
  food_name?: string | null; // max 200 chars - Name/title of the meal
  note?: string | null;
  meal_type?: MealType | null;
}

export interface CreateStressEntryDto {
  date: string; // ISO 8601 UTC format: "2025-01-15T00:00:00.000Z"
  level: StressLevel; // 1-5
  note?: string | null;
}

/**
 * Sleep Upsert Response
 * Indicates whether a new entry was created or an existing one was updated
 */
export interface SleepUpsertResponse {
  data: SleepEntry;
  created: boolean; // true if new entry, false if updated existing
}

/**
 * Stress Upsert Response
 */
export interface StressUpsertResponse {
  data: StressEntry;
  created: boolean;
}

/**
 * Image Upload Response
 */
export interface ImageUploadResponse {
  url: string;
}

/**
 * Journal Entries Response (for GET requests)
 */
export interface JournalEntriesResponse {
  sleep: SleepEntry[];
  sport: SportEntry[];
  meals: MealEntry[];
}

/**
 * Journal Week Response (batch endpoint)
 */
export interface JournalWeekResponse {
  sleeps: SleepEntry[];
  sports: SportEntry[];
  meals: MealEntry[];
  stresses: StressEntry[];
  observations: ObservationEntry[];
}

/**
 * Observation Entry
 * One entry per customer per day (unique constraint)
 */
export interface ObservationEntry {
  id: number;
  customer_id: number;
  date: string; // ISO 8601 UTC: "2025-01-15T00:00:00.000Z"
  positives: string[]; // e.g. ["skinHydrated", "fewerPimples"]
  negatives: string[]; // e.g. ["acne", "excessSebum"]
  created_at: string;
}

export interface CreateObservationEntryDto {
  date: string; // ISO 8601 UTC
  positives: string[];
  negatives: string[];
}

export interface ObservationUpsertResponse {
  data: ObservationEntry;
  created: boolean;
}
