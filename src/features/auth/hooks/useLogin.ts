import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { authService } from '@features/auth/services/auth.service';
import type { LoginInput } from '@features/auth/schemas/auth.schema';
import { toast } from '@lib/toast';
import { queryKeys } from '@shared/config/queryKeys';
import { useAuthStore } from '@shared/stores/auth.store';
import { useUserStore } from '@shared/stores/user.store';
import { haptic } from '@shared/utils/haptic';
import { logger } from '@shared/utils/logger';

export function useLogin() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useUserStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      logger.info('[useLogin] Attempting login with:', { email: data.email });
      try {
        const loginResponse = await authService.login(data);
        logger.info('[useLogin] Full login response:', loginResponse);
        logger.info('[useLogin] Response type:', typeof loginResponse);
        logger.info('[useLogin] Response keys:', Object.keys(loginResponse));

        // API client automatically unwraps { data: T } wrapper
        const { accessToken, refreshToken, user } = loginResponse.data;
        logger.info('[useLogin] Extracted values:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          hasUser: !!user,
          accessTokenLength: accessToken?.length,
          refreshTokenLength: refreshToken?.length,
        });

        await setTokens(accessToken, refreshToken);
        logger.info('[useLogin] Tokens stored successfully');
        return user;
      } catch (error) {
        logger.error('[useLogin] Login error:', error);
        throw error;
      }
    },
    onSuccess: (user) => {
      haptic.success();
      setUser(user);
      // Invalidate user query to trigger refetch and keep cache in sync
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
    onError: () => {
      toast.error(t('common.error'), t('auth.invalidCredentials'));
    },
  });
}
