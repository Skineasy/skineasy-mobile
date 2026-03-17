import { describe, it, expect } from 'vitest';

import type {
  MealEntry,
  ObservationEntry,
  SleepEntry,
  SportEntry,
  StressEntry,
} from '@shared/types/journal.types';

import {
  calculateActivityScore,
  calculateDayScore,
  calculateNutritionScore,
  calculateObservationScore,
  calculateSleepScore,
} from '@features/dashboard/utils/score';

const makeSleepEntry = (hours: number, quality: 1 | 2 | 3 | 4 | 5): SleepEntry => ({
  id: 1,
  customer_id: 1,
  date: '2025-01-15T00:00:00.000Z',
  hours,
  quality,
  created_at: '2025-01-15T00:00:00.000Z',
});

const makeSportEntry = (duration: number, intensity: 1 | 2 | 3 | 4 | 5): SportEntry => ({
  id: 1,
  customer_id: 1,
  date: '2025-01-15T00:00:00.000Z',
  sport_type_id: 1,
  sportType: { id: 1, name: 'running', created_at: '2025-01-15T00:00:00.000Z' },
  duration,
  intensity,
  note: null,
  created_at: '2025-01-15T00:00:00.000Z',
});

const makeMealEntry = (
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null,
  hasDetails = false,
): MealEntry => ({
  id: 1,
  customer_id: 1,
  date: '2025-01-15T00:00:00.000Z',
  photo_url: hasDetails ? 'https://example.com/photo.jpg' : null,
  food_name: hasDetails ? 'Salad' : null,
  note: null,
  meal_type: mealType,
  created_at: '2025-01-15T00:00:00.000Z',
});

const makeStressEntry = (level: 1 | 2 | 3 | 4 | 5): StressEntry => ({
  id: 1,
  customer_id: 1,
  date: '2025-01-15T00:00:00.000Z',
  level,
  note: null,
  created_at: '2025-01-15T00:00:00.000Z',
});

describe('calculateSleepScore', () => {
  it('returns 0 for undefined entry', () => {
    expect(calculateSleepScore(undefined)).toBe(0);
  });

  it('returns max score for optimal sleep (8h, quality 5)', () => {
    const entry = makeSleepEntry(8, 5);
    expect(calculateSleepScore(entry)).toBe(100);
  });

  it('returns 100 for 7h with quality 5', () => {
    const entry = makeSleepEntry(7, 5);
    expect(calculateSleepScore(entry)).toBe(100);
  });

  it('returns 100 for 9h with quality 5', () => {
    const entry = makeSleepEntry(9, 5);
    expect(calculateSleepScore(entry)).toBe(100);
  });

  it('reduces score for less than 7h sleep', () => {
    const entry = makeSleepEntry(5, 5);
    const score = calculateSleepScore(entry);
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThan(0);
  });

  it('reduces score for more than 9h sleep', () => {
    const entry = makeSleepEntry(11, 5);
    const score = calculateSleepScore(entry);
    expect(score).toBeLessThan(100);
  });

  it('reduces score for low quality', () => {
    const entry = makeSleepEntry(8, 1);
    const score = calculateSleepScore(entry);
    expect(score).toBeLessThan(100);
    expect(score).toBe(60 + 20 * 0.4); // 100 * 0.6 + 20 * 0.4
  });
});

describe('calculateActivityScore', () => {
  it('returns 0 for empty entries', () => {
    expect(calculateActivityScore([])).toBe(0);
  });

  it('returns 100 for 30min at intensity 3', () => {
    const entries = [makeSportEntry(30, 3)];
    expect(calculateActivityScore(entries)).toBe(100);
  });

  it('caps score at 100 for long duration', () => {
    const entries = [makeSportEntry(120, 3)];
    expect(calculateActivityScore(entries)).toBe(100);
  });

  it('applies intensity bonus for intensity > 3', () => {
    const entries = [makeSportEntry(30, 5)];
    const score = calculateActivityScore(entries);
    expect(score).toBe(100); // capped at 100
  });

  it('sums duration from multiple entries', () => {
    const entries = [makeSportEntry(15, 3), makeSportEntry(15, 3)];
    expect(calculateActivityScore(entries)).toBe(100);
  });

  it('returns proportional score for less than 30min', () => {
    const entries = [makeSportEntry(15, 3)];
    expect(calculateActivityScore(entries)).toBe(50);
  });
});

describe('calculateNutritionScore', () => {
  it('returns 0 for empty entries', () => {
    expect(calculateNutritionScore([])).toBe(0);
  });

  it('returns 25 for one meal type', () => {
    const entries = [makeMealEntry('breakfast')];
    expect(calculateNutritionScore(entries)).toBe(25);
  });

  it('returns 100 for all 4 meal types', () => {
    const entries = [
      makeMealEntry('breakfast'),
      makeMealEntry('lunch'),
      makeMealEntry('dinner'),
      makeMealEntry('snack'),
    ];
    expect(calculateNutritionScore(entries)).toBe(100);
  });

  it('adds detail bonus for meals with photo or food_name', () => {
    const entries = [makeMealEntry('breakfast', true)];
    expect(calculateNutritionScore(entries)).toBe(30); // 25 + 5
  });

  it('caps detail bonus at 20', () => {
    const entries = [
      makeMealEntry('breakfast', true),
      makeMealEntry('lunch', true),
      makeMealEntry('dinner', true),
      makeMealEntry('snack', true),
      makeMealEntry('snack', true),
    ];
    expect(calculateNutritionScore(entries)).toBe(100); // 100 + 20 capped at 100
  });

  it('ignores null meal types in unique count', () => {
    const entries = [makeMealEntry(null), makeMealEntry('breakfast')];
    expect(calculateNutritionScore(entries)).toBe(25);
  });
});

const makeObservationEntry = (positives: string[], negatives: string[]): ObservationEntry => ({
  id: 1,
  customer_id: 1,
  date: '2025-01-15T00:00:00.000Z',
  positives,
  negatives,
  created_at: '2025-01-15T00:00:00.000Z',
});

describe('calculateObservationScore', () => {
  it('returns 0 for undefined entry', () => {
    expect(calculateObservationScore(undefined)).toBe(0);
  });

  it('returns tracking bonus + base for empty arrays', () => {
    const entry = makeObservationEntry([], []);
    expect(calculateObservationScore(entry)).toBe(60); // 50 base + 10 tracking
  });

  it('adds points for positives', () => {
    const entry = makeObservationEntry(['skinHydrated', 'glowingSkin'], []);
    expect(calculateObservationScore(entry)).toBe(84); // 50 + 24 + 10
  });

  it('subtracts points for negatives', () => {
    const entry = makeObservationEntry([], ['acne', 'redness']);
    expect(calculateObservationScore(entry)).toBe(44); // 50 - 16 + 10
  });

  it('handles mix of positives and negatives', () => {
    const entry = makeObservationEntry(['skinHydrated'], ['acne', 'redness', 'drySkin']);
    expect(calculateObservationScore(entry)).toBe(48); // 50 + 12 - 24 + 10
  });

  it('clamps to 0 when heavily negative', () => {
    const entry = makeObservationEntry(
      [],
      ['acne', 'redness', 'drySkin', 'excessSebum', 'blackheads', 'roughTexture', 'wrinkles'],
    );
    expect(calculateObservationScore(entry)).toBe(4); // 50 - 56 + 10 = 4
  });

  it('clamps to 100 when all positives', () => {
    const entry = makeObservationEntry(
      ['skinHydrated', 'fewerPimples', 'glowingSkin', 'smootherSkin'],
      [],
    );
    expect(calculateObservationScore(entry)).toBe(100); // 50 + 48 + 10 = 108 -> clamped 100
  });
});

describe('calculateDayScore', () => {
  it('returns 0 for no data', () => {
    expect(calculateDayScore(undefined, [], [])).toBe(0);
  });

  it('returns 100 for all perfect scores', () => {
    const sleep = makeSleepEntry(8, 5); // 100
    const meals = [
      makeMealEntry('breakfast'),
      makeMealEntry('lunch'),
      makeMealEntry('dinner'),
      makeMealEntry('snack'),
    ]; // 100
    const sports = [makeSportEntry(30, 3)]; // 100
    const stress = makeStressEntry(1); // 100
    const observations = makeObservationEntry(
      ['skinHydrated', 'fewerPimples', 'glowingSkin', 'smootherSkin'],
      [],
    ); // 100 (clamped)

    expect(calculateDayScore(sleep, meals, sports, stress, observations)).toBe(100);
  });

  it('returns partial score when some data missing', () => {
    const sleep = makeSleepEntry(8, 5); // 100
    const score = calculateDayScore(sleep, [], []);
    // sleep(100) * 0.30 = 30
    expect(score).toBe(30);
  });

  it('includes observation weight in total', () => {
    const observations = makeObservationEntry(['skinHydrated'], []); // 72
    const score = calculateDayScore(undefined, [], [], undefined, observations);
    // observation(72) * 0.15 = 10.8 -> 11
    expect(score).toBe(11);
  });
});
