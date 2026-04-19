import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';

import { ENV } from '@shared/config/env';

import { storage } from '@lib/storage';
import type { Database } from '@lib/supabase.types';
import { logger } from '@shared/utils/logger';

logger.info('[supabase] Initializing client', {
  url: ENV.SUPABASE_URL,
  keyPrefix: ENV.SUPABASE_PUBLISHABLE_KEY.slice(0, 16),
  keyLength: ENV.SUPABASE_PUBLISHABLE_KEY.length,
  keyLooksPublishable: ENV.SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_'),
});

const mmkvAdapter = {
  getItem: (key: string): string | null => storage.getString(key) ?? null,
  setItem: (key: string, value: string): void => {
    storage.set(key, value);
  },
  removeItem: (key: string): void => {
    storage.remove(key);
  },
};

export const supabase = createClient<Database>(ENV.SUPABASE_URL, ENV.SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: mmkvAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
