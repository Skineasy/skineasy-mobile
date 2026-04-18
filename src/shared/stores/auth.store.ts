import { create } from 'zustand';

import { supabase } from '@lib/supabase';
import { unregisterCurrentToken } from '@shared/data/push-tokens.api';
import { useUserStore } from '@shared/stores/user.store';
import { logger } from '@shared/utils/logger';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuthenticated: (value: boolean) => void;
  clearAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,

  setAuthenticated: (value) => {
    logger.info('[authStore] setAuthenticated:', value);
    set({ isAuthenticated: value, isLoading: false });
  },

  clearAuth: async () => {
    logger.info('[authStore] clearAuth');
    await unregisterCurrentToken().catch((err: unknown) => {
      logger.warn('[authStore] Failed to unregister push token:', err);
    });
    await supabase.auth.signOut();
    set({ isAuthenticated: false });
    useUserStore.getState().clearUser();
  },
}));
