import { mapSupabaseError } from '@lib/error-mapper';
import { supabase } from '@lib/supabase';
import { logger } from '@shared/utils/logger';

export interface ResolvedRoutineProduct {
  id: string;
  routine_id: string;
  product_id: string;
  category: string;
  priority: number;
  created_at: string;
  product: {
    id: string;
    name: string;
    brand: string | null;
    price: number | null;
    url: string | null;
    illustration: string | null;
    feature: string | null;
    type: string | null;
    contenance: string | null;
    application: string | null;
    actifs: string | null;
  } | null;
}

export interface ResolvedRoutine {
  id: string;
  user_id: string;
  email: string | null;
  status: string;
  skin_type: string;
  algorithm_version: string | null;
  analysis: {
    skinStates?: string[];
    healthConditions?: Record<string, unknown>;
    matchedSkinTypeRuleId?: string | null;
  } | null;
  brand_cohesion_applied: boolean | null;
  created_at: string;
  updated_at: string;
  routine_products: ResolvedRoutineProduct[];
}

export type ResolveRoutineResult =
  | { status: 'ready'; routine: ResolvedRoutine }
  | { status: 'routine_generation_failed'; questionnaire_response_id: string }
  | { status: 'needs_form' }
  | { status: 'needs_purchase' }
  | { status: 'typeform_unavailable' };

export async function resolveRoutine(): Promise<ResolveRoutineResult> {
  logger.info('[resolveRoutine] Invoking resolve-routine function');
  const { data, error } = await supabase.functions.invoke<ResolveRoutineResult>('resolve-routine');

  if (error) {
    const ctx = (error as { context?: Response }).context;
    let responseBody: unknown = null;
    if (ctx && typeof ctx.text === 'function') {
      try {
        const text = await ctx.clone().text();
        try {
          responseBody = JSON.parse(text);
        } catch {
          responseBody = text;
        }
      } catch (readErr) {
        logger.warn('[resolveRoutine] could not read error context body', { readErr });
      }
    }
    logger.error('[resolveRoutine] function invoke error', {
      name: error.name,
      message: error.message,
      status: ctx?.status,
      statusText: ctx?.statusText,
      responseBody,
    });
    throw mapSupabaseError(error);
  }
  if (!data) {
    logger.error('[resolveRoutine] function returned no data');
    throw new Error('common.error');
  }

  logger.info('[resolveRoutine] success', { status: data.status });
  return data;
}
