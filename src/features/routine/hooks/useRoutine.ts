import { useQuery } from '@tanstack/react-query';

import { routineService } from '@features/routine/services/routine.service';
import type { RoutineDto } from '@features/routine/types/routine.types';
import { queryKeys } from '@shared/config/queryKeys';
import { useAuthStore } from '@shared/stores/auth.store';

export function useRoutine() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<RoutineDto | null, Error>({
    queryKey: queryKeys.routineLast(),
    queryFn: async () => {
      try {
        return await routineService.getLastRoutine();
      } catch (error) {
        // 404 means no routine exists - return null instead of throwing
        if (error instanceof Error && error.message.includes('404')) {
          return null;
        }
        throw error;
      }
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
