import { mapSupabaseError } from '@lib/error-mapper';
import { supabase } from '@lib/supabase';
import { uploadFile } from '@lib/upload';
import { compressImage } from '@shared/utils/image';
import type {
  CreateMealEntryDto,
  CreateObservationEntryDto,
  CreateSleepEntryDto,
  CreateSportEntryDto,
  CreateStressEntryDto,
  JournalWeekResponse,
  MealEntry,
  ObservationEntry,
  SleepEntry,
  SportEntry,
  SportTypeInfo,
  StressEntry,
} from '@shared/types/journal.types';
import type { Database } from '@lib/supabase.types';

async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('common.sessionExpired');
  return user.id;
}

export const sleepService = {
  async getByDate(date: string): Promise<SleepEntry[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('sleep_entries')
      .select()
      .eq('user_id', userId)
      .eq('date', date);
    if (error) throw mapSupabaseError(error);
    return data as SleepEntry[];
  },

  async upsert(dto: CreateSleepEntryDto): Promise<SleepEntry> {
    const userId = await getUserId();
    const insertData: Database['public']['Tables']['sleep_entries']['Insert'] = {
      ...dto,
      user_id: userId,
    };
    const { data, error } = await supabase
      .from('sleep_entries')
      .upsert(insertData, { onConflict: 'user_id,date' })
      .select()
      .single();
    if (error) throw mapSupabaseError(error);
    return data as SleepEntry;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('sleep_entries').delete().eq('id', id);
    if (error) throw mapSupabaseError(error);
  },
};

export const sportService = {
  async getByDate(date: string): Promise<SportEntry[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('sport_entries')
      .select()
      .eq('user_id', userId)
      .eq('date', date);
    if (error) throw mapSupabaseError(error);
    return (data ?? []) as SportEntry[];
  },

  async create(dto: CreateSportEntryDto): Promise<SportEntry> {
    const userId = await getUserId();
    const insertData: Database['public']['Tables']['sport_entries']['Insert'] = {
      ...dto,
      user_id: userId,
    };
    const { data, error } = await supabase
      .from('sport_entries')
      .insert(insertData)
      .select()
      .single();
    if (error) throw mapSupabaseError(error);
    return data as SportEntry;
  },

  async update(id: string, dto: Partial<CreateSportEntryDto>): Promise<SportEntry> {
    const updateData: Database['public']['Tables']['sport_entries']['Update'] = dto;
    const { data, error } = await supabase
      .from('sport_entries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw mapSupabaseError(error);
    return data as SportEntry;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('sport_entries').delete().eq('id', id);
    if (error) throw mapSupabaseError(error);
  },
};

async function getMealSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from('meal-photos').createSignedUrl(path, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}

export const mealService = {
  async getByDate(date: string): Promise<MealEntry[]> {
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
  },

  async uploadPhoto(uri: string, date: string): Promise<string> {
    const userId = await getUserId();
    const compressed = await compressImage(uri);
    const path = `${userId}/${date}/${Date.now()}.jpg`;
    const { path: storagePath } = await uploadFile('meal-photos', path, compressed, {
      contentType: 'image/jpeg',
    });
    return storagePath;
  },

  async create(dto: CreateMealEntryDto): Promise<MealEntry> {
    const userId = await getUserId();
    const insertData: Database['public']['Tables']['meal_entries']['Insert'] = {
      ...dto,
      user_id: userId,
    };
    const { data, error } = await supabase
      .from('meal_entries')
      .insert(insertData)
      .select()
      .single();
    if (error) throw mapSupabaseError(error);
    return data as MealEntry;
  },

  async update(id: string, dto: Partial<CreateMealEntryDto>): Promise<MealEntry> {
    const updateData: Database['public']['Tables']['meal_entries']['Update'] = dto;
    const { data, error } = await supabase
      .from('meal_entries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw mapSupabaseError(error);
    return data as MealEntry;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('meal_entries').delete().eq('id', id);
    if (error) throw mapSupabaseError(error);
  },
};

export const sportTypesService = {
  async getAll(): Promise<SportTypeInfo[]> {
    const { data, error } = await supabase.from('sport_types').select();
    if (error) throw mapSupabaseError(error);
    return data as SportTypeInfo[];
  },
};

export const stressService = {
  async getByDate(date: string): Promise<StressEntry[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('stress_entries')
      .select()
      .eq('user_id', userId)
      .eq('date', date);
    if (error) throw mapSupabaseError(error);
    return data as StressEntry[];
  },

  async upsert(dto: CreateStressEntryDto): Promise<StressEntry> {
    const userId = await getUserId();
    const insertData: Database['public']['Tables']['stress_entries']['Insert'] = {
      ...dto,
      user_id: userId,
    };
    const { data, error } = await supabase
      .from('stress_entries')
      .upsert(insertData, { onConflict: 'user_id,date' })
      .select()
      .single();
    if (error) throw mapSupabaseError(error);
    return data as StressEntry;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('stress_entries').delete().eq('id', id);
    if (error) throw mapSupabaseError(error);
  },
};

export const observationsService = {
  async getByDate(date: string): Promise<ObservationEntry[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('observation_entries')
      .select()
      .eq('user_id', userId)
      .eq('date', date);
    if (error) throw mapSupabaseError(error);
    return data as ObservationEntry[];
  },

  async upsert(dto: CreateObservationEntryDto): Promise<ObservationEntry> {
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
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('observation_entries').delete().eq('id', id);
    if (error) throw mapSupabaseError(error);
  },
};

export const entriesService = {
  async getByDateRange(startDate: string, endDate: string): Promise<JournalWeekResponse> {
    const userId = await getUserId();

    const [sleeps, sports, meals, stresses, observations] = await Promise.all([
      supabase
        .from('sleep_entries')
        .select()
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate),
      supabase
        .from('sport_entries')
        .select()
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate),
      supabase
        .from('meal_entries')
        .select()
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate),
      supabase
        .from('stress_entries')
        .select()
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate),
      supabase
        .from('observation_entries')
        .select()
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate),
    ]);

    if (sleeps.error) throw mapSupabaseError(sleeps.error);
    if (sports.error) throw mapSupabaseError(sports.error);
    if (meals.error) throw mapSupabaseError(meals.error);
    if (stresses.error) throw mapSupabaseError(stresses.error);
    if (observations.error) throw mapSupabaseError(observations.error);

    return {
      sleeps: (sleeps.data ?? []) as SleepEntry[],
      sports: (sports.data ?? []) as SportEntry[],
      meals: (meals.data ?? []) as MealEntry[],
      stresses: (stresses.data ?? []) as StressEntry[],
      observations: (observations.data ?? []) as ObservationEntry[],
    };
  },
};

export const journalService = {
  sleep: sleepService,
  sport: sportService,
  meal: mealService,
  stress: stressService,
  observations: observationsService,
  sportTypes: sportTypesService,
  entries: entriesService,
};
