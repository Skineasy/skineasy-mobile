import { mapSupabaseError } from '@lib/error-mapper';
import { supabase } from '@lib/supabase';
import { logger } from '@shared/utils/logger';

export interface ResolvedRoutine {
  id: string;
  user_id: string;
  status: string;
  algorithm_version: string | null;
  created_at: string;
}

export type ResolveRoutineResult =
  | { status: 'ready'; routine: ResolvedRoutine }
  | { status: 'response_found_generation_pending' }
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
