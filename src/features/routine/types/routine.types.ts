/**
 * Routine Feature Types
 *
 * Full API types for the routine endpoints based on ROUTINE_BACKEND_DOC.md
 */

// ============================================================================
// Enums & Constants
// ============================================================================

export type SkinType =
  | 'tres_seche'
  | 'seche'
  | 'normale'
  | 'mixte_normale_grasse'
  | 'mixte_seche_grasse'
  | 'grasse'
  | 'tres_grasse'
  | 'generique';

export type SkinStateType =
  | 'sensible'
  | 'tres_sensible'
  | 'mature'
  | 'atopique'
  | 'deshydratee'
  | 'acneique'
  | 'acne_hormonale';

export type ProductCategory =
  | 'demaquillant'
  | 'nettoyant'
  | 'tonique'
  | 'exfoliant'
  | 'serum'
  | 'contour_yeux'
  | 'creme_jour'
  | 'creme_nuit'
  | 'creme_solaire'
  | 'masque'
  | 'huile'
  | 'brume'
  | 'baume'
  | 'gadgets'
  | 'complements';

export type TimeOfDay = 'morning' | 'evening';

// ============================================================================
// Product Types
// ============================================================================

export interface TypeContentDto {
  title: string;
  subtitle: string;
  description: string;
  howToUse: string;
  application: string;
  frequency: string;
  badge: string;
  keyIngredient: string;
  irritationPotential: string;
}

export interface ProductDto {
  id: number;
  name: string;
  price: number;
  brand: string | null;
  type: string | null;
  illustration: string | null;
  illustrationUrl: string;
  feature: string | null;
  url: string | null;
  contenance: string | null;
  typeContent: TypeContentDto | null;
}

// ============================================================================
// Analysis Types
// ============================================================================

export interface SkinTypeDto {
  primaryType: SkinType;
  label: string;
  confidence: number;
}

export interface SkinStateDto {
  states: SkinStateType[];
  labels: string[];
}

export interface HealthConditionsDto {
  conditions: string[];
  hasRestrictions: boolean;
  isPregnancySafe: boolean;
}

export interface SkinAnalysisDto {
  skinType: SkinTypeDto;
  skinStates: SkinStateDto;
  healthConditions: HealthConditionsDto;
}

// ============================================================================
// Product Selection Types
// ============================================================================

/**
 * Products are now arrays per category (0 to 3 products each)
 * Empty categories will be empty arrays [], not null
 */
export type ProductSelectionProducts = Record<ProductCategory, ProductDto[]>;

export interface ProductSelectionDto {
  products: ProductSelectionProducts;
  totalPrice: number;
  productCount: number;
  brandCohesionApplied: boolean;
}

// ============================================================================
// Routine Plan Types
// ============================================================================

export interface RoutineStepDto {
  order: number;
  category: ProductCategory;
  estimatedMinutes: number;
}

export interface TimeRoutineDto {
  steps: RoutineStepDto[];
  estimatedMinutes: number;
}

export interface DailyRoutineDto {
  dayOfWeek: number; // 0 = Monday, 6 = Sunday
  dayName: string; // "Lundi", "Mardi", etc.
  morning: TimeRoutineDto;
  evening: TimeRoutineDto;
}

export interface ProductUsageDto {
  category: ProductCategory;
  timesPerWeek: number;
  usedInMorning: boolean;
  usedInEvening: boolean;
}

export interface RoutinePlanDto {
  weeklySchedule: DailyRoutineDto[];
  productUsage: ProductUsageDto[];
}

// ============================================================================
// Summary Types
// ============================================================================

export interface RoutineSummaryDto {
  skinTypeLabel: string;
  primaryConcerns: string[];
  hasRestrictions: boolean;
  totalProducts: number;
  totalPrice: number;
  averageDailyMinutes: number;
  brandCohesionApplied: boolean;
}

// ============================================================================
// Main Response Types
// ============================================================================

export interface RoutineDto {
  id: string;
  email: string;
  customerId?: number;
  createdAt: string;
  analysis: SkinAnalysisDto;
  productSelection: ProductSelectionDto;
  routinePlan: RoutinePlanDto;
  summary: RoutineSummaryDto;
}

export interface RoutineApiResponse {
  data: RoutineDto;
}

// ============================================================================
// Helper Types for UI
// ============================================================================

/**
 * A step combined with its products for easy rendering
 * A step can have 0-3 products (e.g., multiple serums)
 */
export interface RoutineStepWithProducts {
  step: RoutineStepDto;
  products: ProductDto[];
}

/**
 * Today's routine for morning or evening
 */
export interface TodayRoutine {
  dayName: string;
  morning: {
    steps: RoutineStepWithProducts[];
    estimatedMinutes: number;
  };
  evening: {
    steps: RoutineStepWithProducts[];
    estimatedMinutes: number;
  };
}

// ============================================================================
// Category Labels (French)
// ============================================================================

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  demaquillant: 'Démaquillant',
  nettoyant: 'Nettoyant',
  tonique: 'Tonique',
  exfoliant: 'Exfoliant',
  serum: 'Sérum',
  contour_yeux: 'Contour des yeux',
  creme_jour: 'Crème de jour',
  creme_nuit: 'Crème de nuit',
  creme_solaire: 'Protection solaire',
  masque: 'Masque',
  huile: 'Huile visage',
  brume: 'Brume',
  baume: 'Baume',
  gadgets: 'Accessoires',
  complements: 'Compléments',
};
