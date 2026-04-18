import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { authService } from '@features/auth/services/auth.service';
import type { RegisterInput } from '@features/auth/schemas/auth.schema';
import { trackAuth } from '@lib/analytics';
import { toast } from '@lib/toast';
import { logger } from '@shared/utils/logger';

export function useRegister() {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (data: RegisterInput): Promise<void> => {
      const { confirmPassword: _, birthday, ...rest } = data;
      const registerData = { ...rest, ...(birthday ? { birthday } : {}) };
      logger.info('[useRegister] Attempting registration');
      await authService.register(registerData);
    },
    onSuccess: () => {
      trackAuth('signup');
      toast.success(t('auth.registerSuccess'));
    },
  });
}
