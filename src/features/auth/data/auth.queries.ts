import { useEffect } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import * as authApi from '@features/auth/data/auth.api';
import type { ClientRow } from '@features/auth/data/auth.api';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
} from '@features/auth/schemas/auth.schema';
import { routineService } from '@features/routine/services/routine.service';
import { trackAuth } from '@lib/analytics';
import { toast } from '@lib/toast';
import { queryKeys } from '@shared/config/queryKeys';
import { useAuthStore } from '@shared/stores/auth.store';
import { useUserStore } from '@shared/stores/user.store';
import type { UserProfile } from '@shared/types/user.types';
import { haptic } from '@shared/utils/haptic';
import { logger } from '@shared/utils/logger';
import { routineStorage } from '@shared/utils/routineStorage';

export type { ClientRow };

interface DevLoginInput {
  email: string;
  devSecret: string;
}

interface ResetPasswordVariables {
  token: string;
  password: string;
}

function mapClientToUserProfile(client: ClientRow): UserProfile {
  return {
    id: client.id,
    user_id: client.user_id,
    email: client.email ?? '',
    first_name: client.first_name ?? '',
    last_name: client.last_name ?? '',
    phone: client.phone ?? null,
    skin_type: client.skin_type ?? null,
    birthday: client.birthday ?? null,
    avatar_url: client.avatar_url ?? null,
    has_routine_access: client.has_routine_access,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginInput): Promise<void> => {
      logger.info('[useLogin] Attempting login');
      await authApi.login(data);
    },
    onSuccess: () => {
      trackAuth('login');
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
}

export function useRegister() {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (data: RegisterInput): Promise<void> => {
      const { confirmPassword: _, birthday, ...rest } = data;
      const registerData = { ...rest, ...(birthday ? { birthday } : {}) };
      logger.info('[useRegister] Attempting registration');
      await authApi.register(registerData);
    },
    onSuccess: () => {
      trackAuth('signup');
      toast.success(t('auth.registerSuccess'));
    },
  });
}

export function useInitializeUser() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const setRoutineStatus = useUserStore((state) => state.setRoutineStatus);

  const {
    data,
    error,
    isLoading,
    refetch: refetchUser,
  } = useQuery({
    queryKey: queryKeys.user,
    queryFn: async () => {
      logger.info('[useInitializeUser] Fetching user from clients table');
      const client = await authApi.getMe();
      return mapClientToUserProfile(client);
    },
    enabled: isAuthenticated && !isAuthLoading,
    retry: 1,
    staleTime: Infinity,
  });

  const hasRoutineAccess = useUserStore((state) => state.hasRoutineAccess);

  const { data: routineData, isLoading: isRoutineLoading } = useQuery({
    queryKey: queryKeys.routineLast(),
    queryFn: async () => {
      try {
        return await routineService.getLastRoutine();
      } catch (err) {
        logger.warn('[useInitializeUser] Routine fetch failed (expected during migration):', err);
        return null;
      }
    },
    enabled: isAuthenticated && !isAuthLoading && hasRoutineAccess,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data) {
      logger.info('[useInitializeUser] Setting user in store');
      setUser(data);
    }
  }, [data, setUser]);

  useEffect(() => {
    if (error) {
      logger.warn('[useInitializeUser] Error fetching user, clearing:', error);
      clearUser();
    }
  }, [error, clearUser]);

  useEffect(() => {
    async function syncRoutineStatus(): Promise<void> {
      if (!isAuthenticated || !hasRoutineAccess || isRoutineLoading) return;
      if (!routineData) {
        setRoutineStatus('none');
        return;
      }
      const readyAt = await routineStorage.getReadyAt();
      if (readyAt && new Date() < readyAt) {
        setRoutineStatus('processing');
      } else {
        setRoutineStatus('ready');
        await routineStorage.clear();
      }
    }
    syncRoutineStatus();
  }, [routineData, isRoutineLoading, isAuthenticated, hasRoutineAccess, setRoutineStatus]);

  return {
    isLoading: isAuthLoading || isLoading || (hasRoutineAccess && isRoutineLoading),
    error,
    refetch: refetchUser,
  };
}

export function useForgotPassword(): UseMutationResult<void, Error, ForgotPasswordInput> {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (data: ForgotPasswordInput): Promise<void> => {
      logger.info('[useForgotPassword] requesting reset', { email: data.email });
      await authApi.requestPasswordReset({ email: data.email });
    },
    onSuccess: () => {
      haptic.success();
    },
    onError: () => {
      toast.error(t('common.error'), t('auth.passwordRecovery.error'));
    },
  });
}

export function useResetPassword(): UseMutationResult<void, Error, ResetPasswordVariables> {
  const { t } = useTranslation();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: ResetPasswordVariables): Promise<void> => {
      logger.info('[useResetPassword] resetting password');
      await authApi.resetPassword(data);
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

export function useDevLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DevLoginInput): Promise<void> => {
      logger.info('[useDevLogin] Attempting dev login:', { email: data.email });
      await authApi.login({ email: data.email, password: data.devSecret });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
}
