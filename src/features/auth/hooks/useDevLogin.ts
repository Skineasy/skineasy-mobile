import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authService } from '@features/auth/services/auth.service';
import { toast } from '@lib/toast';
import { queryKeys } from '@shared/config/queryKeys';
import { useAuthStore } from '@shared/stores/auth.store';
import { useUserStore } from '@shared/stores/user.store';
import { haptic } from '@shared/utils/haptic';
import { logger } from '@shared/utils/logger';

interface DevLoginInput {
  email: string;
  devSecret: string;
}

export function useDevLogin() {
  const queryClient = useQueryClient();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useUserStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (data: DevLoginInput) => {
      logger.info('[useDevLogin] Attempting dev login:', { email: data.email });
      const response = await authService.devLogin(data);
      const { accessToken, refreshToken, user } = response.data;
      await setTokens(accessToken, refreshToken);
      return user;
    },
    onSuccess: (user) => {
      haptic.success();
      setUser(user);
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
    onError: () => {
      toast.error('Dev Login Error', 'Invalid secret or email');
    },
  });
}
