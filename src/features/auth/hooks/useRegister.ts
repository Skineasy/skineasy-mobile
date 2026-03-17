import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { authService } from '@features/auth/services/auth.service';
import type { RegisterInput } from '@features/auth/schemas/auth.schema';
import { toast } from '@lib/toast';
import { useAuthStore } from '@shared/stores/auth.store';
import { useUserStore } from '@shared/stores/user.store';

export function useRegister() {
  const { t } = useTranslation();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useUserStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      // Strip confirmPassword - it's only for client-side validation
      // Also remove empty birthday
      const { confirmPassword: _, birthday, ...rest } = data;
      const registerData = {
        ...rest,
        ...(birthday ? { birthday } : {}),
      };
      const registerResponse = await authService.register(registerData);
      const { accessToken, refreshToken, user } = registerResponse.data;
      await setTokens(accessToken, refreshToken);
      return user;
    },
    onSuccess: (user) => {
      setUser(user);
      toast.success(t('auth.registerSuccess'));
    },
    onError: () => {
      toast.error(t('common.error'), t('auth.registerError'));
    },
  });
}
