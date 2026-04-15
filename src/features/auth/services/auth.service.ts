import { api } from '@shared/services/api';
import type { LoginResponse, RegisterResponse, MeResponse } from '@shared/types/api.types';
import type { LoginInput, RegisterApiInput } from '@features/auth/schemas/auth.schema';
import { logger } from '@shared/utils/logger';

const MOCK_DELAY_MS = 800;

const mockDelay = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

export const authService = {
  login: (data: LoginInput): Promise<LoginResponse> => {
    return api.post<LoginResponse>('/api/v1/auth/login', data, { skipAuth: true });
  },

  devLogin: (data: { email: string; devSecret: string }): Promise<LoginResponse> => {
    return api.post<LoginResponse>('/api/v1/auth/dev-login', data, { skipAuth: true });
  },

  register: (data: RegisterApiInput): Promise<RegisterResponse> => {
    return api.post<RegisterResponse>('/api/v1/auth/register', data, { skipAuth: true });
  },

  getMe: (): Promise<MeResponse> => {
    return api.get<MeResponse>('/api/v1/auth/me');
  },

  // TODO: wire to Supabase when backend lands. Mocked for now.
  requestPasswordReset: async (data: { email: string }): Promise<void> => {
    logger.info('[authService] mock requestPasswordReset', { email: data.email });
    await mockDelay();
  },

  // TODO: wire to Supabase when backend lands. Mocked for now.
  resetPassword: async (data: { token: string; password: string }): Promise<void> => {
    logger.info('[authService] mock resetPassword', { hasToken: !!data.token });
    if (!data.token) {
      throw new Error('INVALID_TOKEN');
    }
    await mockDelay();
  },
};
