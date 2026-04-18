import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authService } from '@features/auth/services/auth.service';
import type { LoginInput } from '@features/auth/schemas/auth.schema';
import { trackAuth } from '@lib/analytics';
import { queryKeys } from '@shared/config/queryKeys';
import { logger } from '@shared/utils/logger';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginInput): Promise<void> => {
      logger.info('[useLogin] Attempting login');
      await authService.login(data);
    },
    onSuccess: () => {
      trackAuth('login');
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
}
