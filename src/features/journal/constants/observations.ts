import type { LucideIcon } from 'lucide-react-native';
import {
  Activity,
  AlertCircle,
  AlignCenter,
  Circle,
  CircleDot,
  CircleOff,
  Cloud,
  Droplet,
  Droplets,
  Flame,
  Grid3X3,
  Leaf,
  ShieldAlert,
  Sun,
  Waves,
} from 'lucide-react-native';

export const POSITIVE_OBSERVATIONS = [
  'skinHydrated',
  'fewerPimples',
  'glowingSkin',
  'smootherSkin',
] as const;

export const NEGATIVE_OBSERVATIONS = [
  'acne',
  'excessSebum',
  'atopicSkin',
  'roughTexture',
  'redness',
  'blackheads',
  'drySkin',
  'hyperpigmentation',
  'sensitiveSkin',
  'wrinkles',
  'dullComplexion',
] as const;

export type PositiveObservation = (typeof POSITIVE_OBSERVATIONS)[number];
export type NegativeObservation = (typeof NEGATIVE_OBSERVATIONS)[number];

export const POSITIVE_OBSERVATION_ICONS: Record<PositiveObservation, LucideIcon> = {
  skinHydrated: Droplet,
  fewerPimples: CircleOff,
  glowingSkin: Sun,
  smootherSkin: AlignCenter,
};

export const NEGATIVE_OBSERVATION_ICONS: Record<NegativeObservation, LucideIcon> = {
  acne: CircleDot,
  excessSebum: Flame,
  atopicSkin: AlertCircle,
  roughTexture: Waves,
  redness: Droplets,
  blackheads: Grid3X3,
  drySkin: Leaf,
  hyperpigmentation: Circle,
  sensitiveSkin: ShieldAlert,
  wrinkles: Activity,
  dullComplexion: Cloud,
};
