/**
 * Adapter: ResolvedRoutine (Supabase Edge Function payload) → RoutineDto (legacy NestJS UI contract).
 *
 * V1 scope:
 * - No server-side weekly schedule yet, so we synthesize a 7-day schedule where every day has the
 *   same morning/evening steps inferred from the product category.
 * - No type_content / fiches éducatives (V2).
 * - No brand cohesion flag computed (always false).
 * - skinStates labels are derived from internal codes via a local map.
 */

import type {
  ResolvedRoutine,
  ResolvedRoutineProduct,
} from '@features/routine/data/resolve-routine.api';
import type {
  DailyRoutineDto,
  ProductCategory,
  ProductDto,
  ProductSelectionProducts,
  RoutineDto,
  RoutineStepDto,
  SkinStateType,
  SkinType,
} from '@features/routine/types/routine.types';

const STORAGE_PUBLIC_BASE =
  'https://lyhhipvipgbqsytfqwdw.supabase.co/storage/v1/object/public/product-images/';

const SKIN_TYPE_LABELS: Record<string, string> = {
  tres_seche: 'Très sèche',
  seche: 'Sèche',
  normale: 'Normale',
  normale_mixte: 'Normale à mixte',
  mixte_seche_grasse: 'Mixte (sèche et grasse)',
  mixte_normale_grasse: 'Mixte (normale et grasse)',
  grasse: 'Grasse',
  tres_grasse: 'Très grasse',
  generique: 'Classique',
};

const SKIN_STATE_LABELS: Record<SkinStateType, string> = {
  sensible: 'Peau sensible',
  tres_sensible: 'Peau très sensible',
  mature: 'Peau mature',
  atopique: 'Peau atopique',
  deshydratee: 'Peau déshydratée',
  acneique: 'Peau acnéique',
  acne_hormonale: 'Acné hormonale',
};

// Step order mirrors backend config/product-category.ts. Lower = applied earlier.
const CATEGORY_STEP_PRIORITY: Record<ProductCategory, number> = {
  demaquillant: 1,
  nettoyant: 2,
  tonique: 3,
  serum: 4,
  exfoliant: 4,
  contour_yeux: 5,
  creme_jour: 6,
  creme_nuit: 6,
  creme_solaire: 7,
  masque: 3,
  huile: 7,
  brume: 8,
  baume: 8,
  gadgets: 9,
  complements: 9,
};

// Which categories appear in which routine time-of-day.
const MORNING_CATEGORIES: ProductCategory[] = [
  'nettoyant',
  'tonique',
  'serum',
  'contour_yeux',
  'creme_jour',
  'creme_solaire',
];

const EVENING_CATEGORIES: ProductCategory[] = [
  'demaquillant',
  'nettoyant',
  'tonique',
  'serum',
  'contour_yeux',
  'creme_nuit',
  'huile',
];

const STEP_TIME_ESTIMATES: Partial<Record<ProductCategory, number>> = {
  demaquillant: 2,
  nettoyant: 2,
  tonique: 1,
  serum: 1,
  masque: 15,
  contour_yeux: 1,
  creme_jour: 1,
  creme_nuit: 1,
  creme_solaire: 1,
};

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const ALL_CATEGORIES: ProductCategory[] = [
  'demaquillant',
  'nettoyant',
  'tonique',
  'exfoliant',
  'serum',
  'contour_yeux',
  'creme_jour',
  'creme_nuit',
  'creme_solaire',
  'masque',
  'huile',
  'brume',
  'baume',
  'gadgets',
  'complements',
];

function buildTypeContent(p: NonNullable<ResolvedRoutineProduct['product']>) {
  const hasAny = p.type || p.application || p.actifs;
  if (!hasAny) return null;
  return {
    title: p.name,
    subtitle: p.type ?? '',
    description: '',
    howToUse: '',
    application: p.application ?? '',
    frequency: '',
    badge: '',
    keyIngredient: p.actifs ?? '',
    irritationPotential: '',
  };
}

function toProductDto(rp: ResolvedRoutineProduct): ProductDto | null {
  if (!rp.product) return null;
  const p = rp.product;
  const illustrationUrl = p.illustration ? `${STORAGE_PUBLIC_BASE}${p.illustration}` : '';
  return {
    id: p.id,
    name: p.name,
    price: p.price ?? 0,
    brand: p.brand,
    type: p.type,
    illustration: p.illustration,
    illustrationUrl,
    feature: p.feature,
    url: p.url,
    contenance: p.contenance,
    typeContent: buildTypeContent(p),
  };
}

function groupProducts(routine: ResolvedRoutine): ProductSelectionProducts {
  const empty: ProductSelectionProducts = ALL_CATEGORIES.reduce((acc, c) => {
    acc[c] = [];
    return acc;
  }, {} as ProductSelectionProducts);

  for (const rp of routine.routine_products ?? []) {
    const dto = toProductDto(rp);
    if (!dto) continue;
    const cat = rp.category as ProductCategory;
    if (!empty[cat]) empty[cat] = [];
    empty[cat].push(dto);
  }
  return empty;
}

function buildDaySteps(
  products: ProductSelectionProducts,
  categories: ProductCategory[],
): RoutineStepDto[] {
  const steps: RoutineStepDto[] = [];
  let order = 1;
  for (const cat of categories) {
    const items = products[cat] ?? [];
    for (let i = 0; i < items.length; i++) {
      steps.push({
        order: order++,
        category: cat,
        estimatedMinutes: STEP_TIME_ESTIMATES[cat] ?? 2,
      });
    }
  }
  // Sort by step-order priority (stable: preserves insertion order for same-priority categories).
  steps.sort((a, b) => {
    const pa = CATEGORY_STEP_PRIORITY[a.category] ?? 99;
    const pb = CATEGORY_STEP_PRIORITY[b.category] ?? 99;
    return pa - pb;
  });
  // Renumber after sort.
  return steps.map((s, i) => ({ ...s, order: i + 1 }));
}

function buildWeeklySchedule(products: ProductSelectionProducts): DailyRoutineDto[] {
  const morningSteps = buildDaySteps(products, MORNING_CATEGORIES);
  const eveningSteps = buildDaySteps(products, EVENING_CATEGORIES);
  const morningMinutes = morningSteps.reduce((s, x) => s + x.estimatedMinutes, 0);
  const eveningMinutes = eveningSteps.reduce((s, x) => s + x.estimatedMinutes, 0);

  return DAY_NAMES.map((name, idx) => ({
    dayOfWeek: idx,
    dayName: name,
    morning: { steps: morningSteps, estimatedMinutes: morningMinutes },
    evening: { steps: eveningSteps, estimatedMinutes: eveningMinutes },
  }));
}

export function resolvedRoutineToDto(routine: ResolvedRoutine): RoutineDto {
  const products = groupProducts(routine);
  const weeklySchedule = buildWeeklySchedule(products);

  const totalPrice = Object.values(products)
    .flat()
    .reduce((sum, p) => sum + (p.price ?? 0), 0);
  const productCount = Object.values(products).reduce((sum, arr) => sum + arr.length, 0);

  const skinStates = (routine.analysis?.skinStates ?? []) as SkinStateType[];
  const skinStateLabels = skinStates.map((s) => SKIN_STATE_LABELS[s] ?? s);

  const healthConditions = routine.analysis?.healthConditions as
    | Record<string, boolean>
    | undefined;
  const isPregnant = healthConditions?.isPregnant === true;
  const isUnder15 = healthConditions?.isUnder15 === true;
  const isAtopic = healthConditions?.isAtopic === true;
  const conditionsLabels: string[] = [];
  if (isPregnant) conditionsLabels.push('Grossesse');
  if (isUnder15) conditionsLabels.push('Moins de 15 ans');
  if (isAtopic) conditionsLabels.push('Peau atopique');

  return {
    id: routine.id,
    email: routine.email ?? '',
    createdAt: routine.created_at,
    analysis: {
      skinType: {
        primaryType: routine.skin_type as SkinType,
        label: SKIN_TYPE_LABELS[routine.skin_type] ?? routine.skin_type,
        confidence: 0,
      },
      skinStates: { states: skinStates, labels: skinStateLabels },
      healthConditions: {
        conditions: conditionsLabels,
        hasRestrictions: conditionsLabels.length > 0,
        isPregnancySafe: !isPregnant,
      },
    },
    productSelection: {
      products,
      totalPrice,
      productCount,
      brandCohesionApplied: routine.brand_cohesion_applied === true,
    },
    routinePlan: {
      weeklySchedule,
      productUsage: [],
    },
    summary: {
      skinTypeLabel: SKIN_TYPE_LABELS[routine.skin_type] ?? routine.skin_type,
      primaryConcerns: skinStateLabels.slice(0, 3),
      hasRestrictions: conditionsLabels.length > 0,
      totalProducts: productCount,
      totalPrice,
      averageDailyMinutes:
        weeklySchedule[0]?.morning.estimatedMinutes ??
        0 + (weeklySchedule[0]?.evening.estimatedMinutes ?? 0),
      brandCohesionApplied: routine.brand_cohesion_applied === true,
    },
  };
}
