import { api } from '@shared/services/api';
import type { ApiResponse } from '@shared/types/api.types';

interface AppConfig {
  minimumVersion: string;
  storeUrls: {
    ios: string;
    android: string;
  };
}

export const appConfigService = {
  getConfig: async (): Promise<AppConfig> => {
    const response = await api.get<ApiResponse<AppConfig>>('/api/v1/app/config', {
      skipAuth: true,
    });
    return response.data;
  },
};
