import { supabase } from '@lib/supabase';

interface AppConfig {
  minimumVersion: string;
  storeUrls: {
    ios: string;
    android: string;
  };
}

export const appConfigService = {
  getConfig: async (): Promise<AppConfig> => {
    const { data, error } = await supabase
      .from('app_config')
      .select('key, value')
      .in('key', ['minimum_version', 'store_urls']);

    if (error) throw new Error('common.error');

    const rows = data ?? [];
    const configMap = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    return {
      minimumVersion: (configMap['minimum_version'] as string) ?? '0.0.0',
      storeUrls: (configMap['store_urls'] as AppConfig['storeUrls']) ?? { ios: '', android: '' },
    };
  },
};
