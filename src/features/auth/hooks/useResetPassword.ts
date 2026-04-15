import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { authService } from '@features/auth/services/auth.service';
import { toast } from '@lib/toast';
import { haptic } from '@shared/utils/haptic';
import { logger } from '@shared/utils/logger';

interface ResetPasswordVariables {
  token: string;
  password: string;
}

export function useResetPassword(): UseMutationResult<void, Error, ResetPasswordVariables> {
  const { t } = useTranslation();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: ResetPasswordVariables): Promise<void> => {
      logger.info('[useResetPassword] resetting password');
      await authService.resetPassword(data);
    },
    onSuccess: () => {
      haptic.success();
      router.replace('/(auth)/login');
    },
    onError: () => {
      toast.error(t('common.error'), t('auth.passwordReset.error'));
    },
  });
}
