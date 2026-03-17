import { api } from '@shared/services/api';
import type { LoginResponse, RegisterResponse, MeResponse } from '@shared/types/api.types';
import type { LoginInput, RegisterApiInput } from '@features/auth/schemas/auth.schema';

export const authService = {
  login: (data: LoginInput): Promise<LoginResponse> => {
    return api.post<LoginResponse>('/api/v1/auth/login', data, { skipAuth: true });
  },

  register: (data: RegisterApiInput): Promise<RegisterResponse> => {
    return api.post<RegisterResponse>('/api/v1/auth/register', data, { skipAuth: true });
  },

  getMe: (): Promise<MeResponse> => {
    return api.get<MeResponse>('/api/v1/auth/me');
  },
};
