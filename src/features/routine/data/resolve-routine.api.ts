import { mapSupabaseError } from '@lib/error-mapper';
import { supabase } from '@lib/supabase';

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
  const { data, error } = await supabase.functions.invoke<ResolveRoutineResult>('resolve-routine');

  if (error) throw mapSupabaseError(error);
  if (!data) throw new Error('common.error');

  return data;
}
