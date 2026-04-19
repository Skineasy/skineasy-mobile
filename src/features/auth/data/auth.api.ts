import { mapSupabaseError } from '@lib/error-mapper';
import { supabase } from '@lib/supabase';
import type { RegisterApiInput } from '@features/auth/schemas/auth.schema';
import type { Database } from '@lib/supabase.types';
import { logger } from '@shared/utils/logger';

export type ClientRow = Database['public']['Tables']['clients']['Row'];

export async function login(data: { email: string; password: string }): Promise<void> {
  logger.info('[authApi.login] Calling signInWithPassword', { email: data.email });
  const { data: result, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });
  if (error) {
    logger.error('[authApi.login] Supabase returned error', {
      email: data.email,
      name: error.name,
      message: error.message,
      status: (error as { status?: number }).status,
      code: (error as { code?: string }).code,
      raw: error,
    });
    throw mapSupabaseError(error);
  }
  logger.info('[authApi.login] signInWithPassword ok', {
    email: data.email,
    userId: result.user?.id,
    hasSession: Boolean(result.session),
  });
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

export async function devLogin(data: { email: string; devSecret: string }): Promise<void> {
  logger.info('[authApi.devLogin] Invoking dev-login function', { email: data.email });
  const { data: result, error: fnError } = await supabase.functions.invoke<{
    email: string;
    token_hash: string;
  }>('dev-login', {
    body: { email: data.email, devSecret: data.devSecret },
  });
  if (fnError || !result?.token_hash) {
    logger.error('[authApi.devLogin] dev-login function failed', {
      email: data.email,
      error: fnError,
      result,
    });
    throw new Error('auth.invalidCredentials');
  }
  logger.info('[authApi.devLogin] Got token_hash, verifying OTP', { email: result.email });
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: result.token_hash,
  });
  if (verifyError) {
    logger.error('[authApi.devLogin] verifyOtp failed', {
      email: result.email,
      name: verifyError.name,
      message: verifyError.message,
      status: (verifyError as { status?: number }).status,
      code: (verifyError as { code?: string }).code,
    });
    throw mapSupabaseError(verifyError);
  }
  logger.info('[authApi.devLogin] verifyOtp ok, session established', { email: result.email });
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw mapSupabaseError(error);
}

export async function requestPasswordReset(data: { email: string }): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: 'https://skineasy.com/password-reset',
  });
  if (error) throw mapSupabaseError(error);
}

export async function exchangeRecoveryCode(code: string): Promise<void> {
  if (!code) throw new Error('auth.invalidCredentials');
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw mapSupabaseError(error);
}

export async function resetPassword(data: { password: string }): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: data.password });
  if (error) throw mapSupabaseError(error);
}
