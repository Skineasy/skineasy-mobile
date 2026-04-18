import { mapSupabaseError } from '@lib/error-mapper';
import { supabase } from '@lib/supabase';
import type { RegisterApiInput } from '@features/auth/schemas/auth.schema';
import type { Database } from '@lib/supabase.types';

export type ClientRow = Database['public']['Tables']['clients']['Row'];

export async function login(data: { email: string; password: string }): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });
  if (error) throw mapSupabaseError(error);
}

export async function register(data: RegisterApiInput): Promise<void> {
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { first_name: data.firstname, last_name: data.lastname },
    },
  });
  if (error) throw mapSupabaseError(error);
}

export async function getMe(): Promise<ClientRow> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('common.sessionExpired');
  const { data, error } = await supabase.from('clients').select().eq('user_id', user.id).single();
  if (error) throw mapSupabaseError(error);
  return data;
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw mapSupabaseError(error);
}

export async function requestPasswordReset(data: { email: string }): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(data.email);
  if (error) throw mapSupabaseError(error);
}

export async function resetPassword(data: { token: string; password: string }): Promise<void> {
  if (!data.token) throw new Error('auth.invalidCredentials');
  const { error } = await supabase.auth.updateUser({ password: data.password });
  if (error) throw mapSupabaseError(error);
}
