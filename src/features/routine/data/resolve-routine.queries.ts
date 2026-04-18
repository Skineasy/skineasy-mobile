import { useQuery, useQueryClient } from '@tanstack/react-query';

import { resolveRoutine } from '@features/routine/data/resolve-routine.api';
import { queryKeys } from '@shared/config/queryKeys';

export const routineResolutionKey = [...queryKeys.routine, 'resolution'] as const;

export function useResolveRoutine() {
  return useQuery({
    queryKey: routineResolutionKey,
    queryFn: resolveRoutine,
    staleTime: Infinity,
    retry: false,
    enabled: false,
  });
}

export function useInvalidateRoutineResolution(): () => Promise<void> {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: routineResolutionKey });
}
