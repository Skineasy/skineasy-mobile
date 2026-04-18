import { mapSupabaseError } from '@lib/error-mapper';
import { supabase } from '@lib/supabase';
import type { Database } from '@lib/supabase.types';
import type { CreateObservationEntryDto, ObservationEntry } from '@shared/types/journal.types';

import { getUserId } from '@features/journal/data/utils';

export async function getObservationsByDate(date: string): Promise<ObservationEntry[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('observation_entries')
    .select()
    .eq('user_id', userId)
    .eq('date', date);
  if (error) throw mapSupabaseError(error);
  return data as ObservationEntry[];
}

export async function upsertObservations(
  dto: CreateObservationEntryDto,
): Promise<ObservationEntry> {
  const userId = await getUserId();
  const insertData: Database['public']['Tables']['observation_entries']['Insert'] = {
    ...dto,
    user_id: userId,
  };
  const { data, error } = await supabase
    .from('observation_entries')
    .upsert(insertData, { onConflict: 'user_id,date' })
    .select()
    .single();
  if (error) throw mapSupabaseError(error);
  return data as ObservationEntry;
}

export async function deleteObservations(id: string): Promise<void> {
  const { error } = await supabase.from('observation_entries').delete().eq('id', id);
  if (error) throw mapSupabaseError(error);
}
