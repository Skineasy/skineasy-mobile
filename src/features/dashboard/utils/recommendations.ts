import type { LucideIcon } from 'lucide-react-native';
import {
  Activity,
  GlassWater,
  HeartHandshake,
  Moon,
  Salad,
  ShieldAlert,
} from 'lucide-react-native';

import type {
  MealEntry,
  ObservationEntry,
  SleepEntry,
  SportEntry,
  StressEntry,
} from '@shared/types/journal.types';

export interface Recommendation {
  id: string;
  icon: LucideIcon;
  labelKey: string;
}

interface BuildInput {
  sleepYesterday: SleepEntry | undefined;
  stressYesterday: StressEntry | undefined;
  sportYesterday: SportEntry[];
  mealYesterday: MealEntry[];
  observationToday: ObservationEntry | undefined;
}

const IRRITANT_OBSERVATIONS = ['sensitiveSkin', 'redness', 'drySkin'];
const MAX_RECOMMENDATIONS = 3;

export function buildRecommendations({
  sleepYesterday,
  stressYesterday,
  sportYesterday,
  mealYesterday,
  observationToday,
}: BuildInput): Recommendation[] {
  const negatives = observationToday?.negatives ?? [];
  const all: Recommendation[] = [];

  if (negatives.includes('drySkin')) {
    all.push({
      id: 'drinkWater',
      icon: GlassWater,
      labelKey: 'dashboard.recommendations.drinkWater',
    });
  }
  if (negatives.some((n) => IRRITANT_OBSERVATIONS.includes(n))) {
    all.push({
      id: 'avoidIrritants',
      icon: ShieldAlert,
      labelKey: 'dashboard.recommendations.avoidIrritants',
    });
  }
  if (sleepYesterday && sleepYesterday.quality <= 2) {
    all.push({
      id: 'sleepEarlier',
      icon: Moon,
      labelKey: 'dashboard.recommendations.sleepEarlier',
    });
  }
  if (stressYesterday && stressYesterday.level >= 4) {
    all.push({
      id: 'takeTimeForYou',
      icon: HeartHandshake,
      labelKey: 'dashboard.recommendations.takeTimeForYou',
    });
  }
  const totalSport = sportYesterday.reduce((sum, s) => sum + s.duration, 0);
  if (totalSport < 30) {
    all.push({ id: 'move20min', icon: Activity, labelKey: 'dashboard.recommendations.move20min' });
  }
  const rated = mealYesterday.filter(
    (m): m is MealEntry & { quality: number } => m.quality != null,
  );
  if (rated.length > 0) {
    const avg = rated.reduce((sum, m) => sum + m.quality, 0) / rated.length;
    if (avg < 3) {
      all.push({
        id: 'reduceSugarFat',
        icon: Salad,
        labelKey: 'dashboard.recommendations.reduceSugarFat',
      });
    }
  }

  return all.slice(0, MAX_RECOMMENDATIONS);
}
