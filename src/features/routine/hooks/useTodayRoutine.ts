import { useMemo } from 'react';

import type {
  ProductSelectionProducts,
  RoutineDto,
  RoutineStepWithProducts,
  TodayRoutine,
} from '@features/routine/types/routine.types';

/**
 * Get the day of week in our format (0 = Monday, 6 = Sunday)
 * JavaScript's getDay() returns 0 = Sunday, so we convert it
 */
function getTodayDayOfWeek(): number {
  const jsDay = new Date().getDay();
  // Convert: JS Sunday (0) -> Our Sunday (6), JS Monday (1) -> Our Monday (0), etc.
  return jsDay === 0 ? 6 : jsDay - 1;
}

/**
 * Get steps with their associated products
 * Products are distributed by occurrence when multiple steps share the same category
 * (e.g., 1st nettoyant step gets 1st nettoyant product, 2nd step gets 2nd product)
 */
function getStepsWithProducts(
  steps: { order: number; category: string; estimatedMinutes: number }[],
  products: ProductSelectionProducts,
): RoutineStepWithProducts[] {
  const categoryOccurrence = new Map<string, number>();

  return steps.map((step) => {
    const cat = step.category as keyof ProductSelectionProducts;
    const occurrence = (categoryOccurrence.get(cat) || 0) + 1;
    categoryOccurrence.set(cat, occurrence);

    const categoryProducts = products[cat] || [];
    // Distribute products: each step gets product at its occurrence index
    const stepProducts =
      categoryProducts.length > 1
        ? [categoryProducts[occurrence - 1]].filter(Boolean)
        : categoryProducts;

    return {
      step: step as RoutineStepWithProducts['step'],
      products: stepProducts,
    };
  });
}

/**
 * Hook to extract today's routine from the full routine data
 *
 * @param routine - The full routine data from useRoutine()
 * @returns Today's morning and evening routine with products, or null if no routine
 */
export function useTodayRoutine(routine: RoutineDto | null | undefined): TodayRoutine | null {
  return useMemo(() => {
    if (!routine) return null;

    const todayIndex = getTodayDayOfWeek();
    const todaySchedule = routine.routinePlan.weeklySchedule.find(
      (day) => day.dayOfWeek === todayIndex,
    );

    if (!todaySchedule) return null;

    const products = routine.productSelection.products;

    return {
      dayName: todaySchedule.dayName,
      morning: {
        steps: getStepsWithProducts(todaySchedule.morning.steps, products),
        estimatedMinutes: todaySchedule.morning.estimatedMinutes,
      },
      evening: {
        steps: getStepsWithProducts(todaySchedule.evening.steps, products),
        estimatedMinutes: todaySchedule.evening.estimatedMinutes,
      },
    };
  }, [routine]);
}

/**
 * Hook to get routine for a specific day
 *
 * @param routine - The full routine data
 * @param dayOfWeek - Day index (0 = Monday, 6 = Sunday)
 */
export function useRoutineForDay(
  routine: RoutineDto | null | undefined,
  dayOfWeek: number,
): TodayRoutine | null {
  return useMemo(() => {
    if (!routine) return null;

    const daySchedule = routine.routinePlan.weeklySchedule.find(
      (day) => day.dayOfWeek === dayOfWeek,
    );

    if (!daySchedule) return null;

    const products = routine.productSelection.products;

    return {
      dayName: daySchedule.dayName,
      morning: {
        steps: getStepsWithProducts(daySchedule.morning.steps, products),
        estimatedMinutes: daySchedule.morning.estimatedMinutes,
      },
      evening: {
        steps: getStepsWithProducts(daySchedule.evening.steps, products),
        estimatedMinutes: daySchedule.evening.estimatedMinutes,
      },
    };
  }, [routine, dayOfWeek]);
}
