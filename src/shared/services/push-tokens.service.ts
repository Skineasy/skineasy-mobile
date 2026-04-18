import { mapSupabaseError } from '@lib/error-mapper';
import { supabase } from '@lib/supabase';

type Platform = 'ios' | 'android';

export const pushTokensService = {
  registerToken: async (token: string, platform: Platform, deviceId?: string): Promise<void> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) throw new Error('common.sessionExpired');

    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        { user_id: userId, token, platform, device_id: deviceId ?? null },
        { onConflict: 'user_id,token' },
      );

    if (error) throw mapSupabaseError(error);
  },

  unregisterToken: async (token: string): Promise<void> => {
    const { error } = await supabase.from('push_tokens').delete().eq('token', token);

    if (error) throw mapSupabaseError(error);
  },
};
