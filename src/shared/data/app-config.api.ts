import { mapSupabaseError } from '@lib/error-mapper';
import { supabase } from '@lib/supabase';

export interface AppConfig {
  minimumVersion: string;
  storeUrls: {
    ios: string;
    android: string;
  };
}

export async function getAppConfig(): Promise<AppConfig> {
  const { data, error } = await supabase
    .from('app_config')
    .select('key, value')
    .in('key', ['minimum_version', 'store_urls']);

  if (error) throw mapSupabaseError(error);

  const rows = data ?? [];
  const configMap = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    minimumVersion: (configMap['minimum_version'] as string) ?? '0.0.0',
    storeUrls: (configMap['store_urls'] as AppConfig['storeUrls']) ?? { ios: '', android: '' },
  };
}
