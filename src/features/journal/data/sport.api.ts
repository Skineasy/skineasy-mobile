import { mapSupabaseError } from '@lib/error-mapper';
import { supabase } from '@lib/supabase';
import type { Database } from '@lib/supabase.types';
import type { CreateSportEntryDto, SportEntry, SportTypeInfo } from '@shared/types/journal.types';

import { getUserId } from '@features/journal/data/utils';

export async function getSportByDate(date: string): Promise<SportEntry[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('sport_entries')
    .select()
    .eq('user_id', userId)
    .eq('date', date);
  if (error) throw mapSupabaseError(error);
  return (data ?? []) as SportEntry[];
}

export async function createSport(dto: CreateSportEntryDto): Promise<SportEntry> {
  const userId = await getUserId();
  const insertData: Database['public']['Tables']['sport_entries']['Insert'] = {
    ...dto,
    user_id: userId,
  };
  const { data, error } = await supabase.from('sport_entries').insert(insertData).select().single();
  if (error) throw mapSupabaseError(error);
  return data as SportEntry;
}

export async function updateSport(
  id: string,
  dto: Partial<CreateSportEntryDto>,
): Promise<SportEntry> {
  const updateData: Database['public']['Tables']['sport_entries']['Update'] = dto;
  const { data, error } = await supabase
    .from('sport_entries')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw mapSupabaseError(error);
  return data as SportEntry;
}

export async function deleteSport(id: string): Promise<void> {
  const { error } = await supabase.from('sport_entries').delete().eq('id', id);
  if (error) throw mapSupabaseError(error);
}

export async function getSportTypes(): Promise<SportTypeInfo[]> {
  const { data, error } = await supabase.from('sport_types').select();
  if (error) throw mapSupabaseError(error);
  return data as SportTypeInfo[];
}
