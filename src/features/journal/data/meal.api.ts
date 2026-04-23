import { mapSupabaseError } from '@lib/error-mapper';
import { supabase } from '@lib/supabase';
import type { Database } from '@lib/supabase.types';
import { uploadFile } from '@lib/upload';
import type { CreateMealEntryDto, MealEntry } from '@shared/types/journal.types';
import { compressImage } from '@shared/utils/image';

import { getUserId } from '@features/journal/data/utils';

export async function getMealSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from('meal-photos').createSignedUrl(path, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function getMealByDate(date: string): Promise<MealEntry[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('meal_entries')
    .select()
    .eq('user_id', userId)
    .eq('date', date);
  if (error) throw mapSupabaseError(error);
  const entries = (data ?? []) as MealEntry[];
  return Promise.all(
    entries.map(async (entry) => {
      if (!entry.photo_url) return entry;
      const signedUrl = await getMealSignedUrl(entry.photo_url);
      return signedUrl ? { ...entry, photo_url: signedUrl } : entry;
    }),
  );
}

export async function uploadMealPhoto(uri: string, date: string): Promise<string> {
  const userId = await getUserId();
  const compressed = await compressImage(uri);
  const path = `${userId}/${date}/${Date.now()}.jpg`;
  const { path: storagePath } = await uploadFile('meal-photos', path, compressed, {
    contentType: 'image/jpeg',
  });
  return storagePath;
}

export async function createMeal(dto: CreateMealEntryDto): Promise<MealEntry> {
  const userId = await getUserId();
  const insertData: Database['public']['Tables']['meal_entries']['Insert'] = {
    ...dto,
    user_id: userId,
  };
  const { data, error } = await supabase.from('meal_entries').insert(insertData).select().single();
  if (error) throw mapSupabaseError(error);
  return data as MealEntry;
}

export async function updateMeal(id: string, dto: Partial<CreateMealEntryDto>): Promise<MealEntry> {
  const updateData: Database['public']['Tables']['meal_entries']['Update'] = dto;
  const { data, error } = await supabase
    .from('meal_entries')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw mapSupabaseError(error);
  return data as MealEntry;
}

export async function deleteMeal(id: string): Promise<void> {
  const { error } = await supabase.from('meal_entries').delete().eq('id', id);
  if (error) throw mapSupabaseError(error);
}
