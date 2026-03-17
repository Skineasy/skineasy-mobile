import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { profileService } from '@features/profile/services/profile.service';
import { toast } from '@lib/toast';
import { useAuthStore } from '@shared/stores/auth.store';
import { useUserStore } from '@shared/stores/user.store';
import { logger } from '@shared/utils/logger';

export function useDeleteAccount() {
  const { t } = useTranslation();
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const clearUser = useUserStore((state) => state.clearUser);

  return useMutation({
    mutationFn: async () => {
      logger.info('[useDeleteAccount] Deleting account...');
      await profileService.deleteAccount();
      logger.info('[useDeleteAccount] Account deleted successfully');
    },
    onSuccess: async () => {
      await clearAuth();
      clearUser();
      toast.success(t('profile.deleteAccountSuccess'), t('profile.deleteAccountSuccessMessage'));
      router.replace('/(auth)/login');
    },
    onError: (error: Error) => {
      logger.error('[useDeleteAccount] Error:', error);
      toast.error(t('common.error'), t('profile.deleteAccountError'));
    },
  });
}
