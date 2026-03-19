import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { authService } from '@features/auth/services/auth.service';
import { routineService } from '@features/routine/services/routine.service';
import { queryKeys } from '@shared/config/queryKeys';
import { useAuthStore } from '@shared/stores/auth.store';
import { useUserStore } from '@shared/stores/user.store';
import { logger } from '@shared/utils/logger';
import { routineStorage } from '@shared/utils/routineStorage';

/**
 * Hook to initialize user data on app start
 * Fetches user profile from /me endpoint when authenticated
 */
export function useInitializeUser() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const setRoutineStatus = useUserStore((state) => state.setRoutineStatus);
  const user = useUserStore((state) => state.user);

  logger.info('[useInitializeUser] Hook state:', {
    isAuthenticated,
    isAuthLoading,
    hasUser: !!user,
    userId: user?.id,
  });

  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch: refetchUser,
  } = useQuery({
    queryKey: queryKeys.user,
    queryFn: async () => {
      logger.info('[useInitializeUser] Fetching user data from /me endpoint');
      const result = await authService.getMe();
      logger.info('[useInitializeUser] /me response:', result);
      return result;
    },
    enabled: isAuthenticated && !isAuthLoading,
    retry: 1,
    staleTime: Infinity, // User data doesn't change often
  });

  const hasRoutineAccess = useUserStore((state) => state.hasRoutineAccess);

  // Fetch routine to determine status (skip if no routine access)
  const { data: routineData, isLoading: isRoutineLoading } = useQuery({
    queryKey: queryKeys.routineLast(),
    queryFn: async () => {
      logger.info('[useInitializeUser] Fetching routine from /routine/last');
      try {
        const result = await routineService.getLastRoutine();
        logger.info('[useInitializeUser] /routine/last response:', result);
        return result;
      } catch (err) {
        logger.warn('[useInitializeUser] Routine fetch failed:', err);
        return null;
      }
    },
    enabled: isAuthenticated && !isAuthLoading && hasRoutineAccess,
    staleTime: 5 * 60 * 1000,
  });

  logger.info('[useInitializeUser] Query state:', {
    isLoading,
    isFetching,
    hasData: !!data,
    hasError: !!error,
    errorMessage: error?.message,
  });

  useEffect(() => {
    if (data) {
      logger.info('[useInitializeUser] Setting user data in store:', data.data);
      setUser(data.data);
    }
  }, [data, setUser]);

  useEffect(() => {
    if (error) {
      logger.info('[useInitializeUser] Error fetching user, clearing user data:', error);
      // If /me fails, clear user data (likely token is invalid)
      clearUser();
    }
  }, [error, clearUser]);

  // Sync routine status to store
  useEffect(() => {
    async function syncRoutineStatus(): Promise<void> {
      if (!isAuthenticated) return;

      if (!hasRoutineAccess) {
        logger.info('[useInitializeUser] No routine access, setting status to none');
        setRoutineStatus('none');
        return;
      }

      if (isRoutineLoading) return;

      if (!routineData) {
        logger.info('[useInitializeUser] No routine, setting status to none');
        setRoutineStatus('none');
        return;
      }

      const readyAt = await routineStorage.getReadyAt();
      if (readyAt && new Date() < readyAt) {
        logger.info('[useInitializeUser] Routine processing until:', readyAt);
        setRoutineStatus('processing');
      } else {
        logger.info('[useInitializeUser] Routine ready');
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
