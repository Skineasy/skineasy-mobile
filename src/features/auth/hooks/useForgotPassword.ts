import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { authService } from '@features/auth/services/auth.service';
import type { ForgotPasswordInput } from '@features/auth/schemas/auth.schema';
import { toast } from '@lib/toast';
import { haptic } from '@shared/utils/haptic';
import { logger } from '@shared/utils/logger';

export function useForgotPassword(): UseMutationResult<void, Error, ForgotPasswordInput> {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (data: ForgotPasswordInput): Promise<void> => {
      logger.info('[useForgotPassword] requesting reset', { email: data.email });
      await authService.requestPasswordReset({ email: data.email });
    },
    onSuccess: () => {
      haptic.success();
    },
    onError: () => {
      toast.error(t('common.error'), t('auth.passwordRecovery.error'));
    },
  });
}
