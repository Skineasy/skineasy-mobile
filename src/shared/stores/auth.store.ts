import { create } from 'zustand';

import { useUserStore } from '@shared/stores/user.store';
import {
  getToken,
  getRefreshToken,
  setToken,
  setRefreshToken,
  clearAllTokens,
} from '@shared/utils/storage';
import { logger } from '@shared/utils/logger';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setTokens: (accessToken: string, refreshToken?: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadToken: () => Promise<void>;
  handleSessionExpiry: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setTokens: async (accessToken, refreshToken) => {
    logger.info('[authStore] setTokens - Saving tokens:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      refreshTokenLength: refreshToken?.length,
    });
    await setToken(accessToken);
    if (refreshToken) {
      await setRefreshToken(refreshToken);
      logger.info('[authStore] setTokens - Refresh token saved');

      const savedRefreshToken = await getRefreshToken();
      logger.info('[authStore] setTokens - Verification:', {
        wasSaved: !!savedRefreshToken,
        matchesOriginal: savedRefreshToken === refreshToken,
      });
    } else {
      logger.warn('[authStore] setTokens - No refresh token provided!');
    }
    set({ token: accessToken, isAuthenticated: true });
  },

  clearAuth: async () => {
    await clearAllTokens();
    set({ token: null, isAuthenticated: false });
    useUserStore.getState().clearUser();
  },

  handleSessionExpiry: async () => {
    await clearAllTokens();
    set({ token: null, isAuthenticated: false });
    useUserStore.getState().clearUser();
  },

  loadToken: async () => {
    logger.info('[authStore] loadToken - Starting...');
    try {
      const token = await getToken();
      logger.info('[authStore] loadToken - Token loaded:', !!token);
      set({
        token,
        isAuthenticated: !!token,
        isLoading: false,
      });
    } catch (error) {
      logger.info('[authStore] loadToken - Error:', error);
      set({
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
