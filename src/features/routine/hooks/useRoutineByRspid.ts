import { useQuery } from '@tanstack/react-query';

import { routineService } from '@features/routine/services/routine.service';
import { queryKeys } from '@shared/config/queryKeys';
import { useUserStore } from '@shared/stores/user.store';
import { logger } from '@shared/utils/logger';

/**
 * Hook to fetch routine by response ID (rspid)
 * Updates the user store routineStatus based on the response
 */
export function useRoutineByRspid(rspid: string | null) {
  const setRoutineStatus = useUserStore((state) => state.setRoutineStatus);

  return useQuery({
    queryKey: queryKeys.routineByRspid(rspid || ''),
    queryFn: async () => {
      if (!rspid) {
        throw new Error('No rspid provided');
      }

      const response = await routineService.getByRspid(rspid);
      logger.info('[useRoutineByRspid] Response:', response);

      // Update routine status in store based on response
      if (response.status === 'ready') {
        setRoutineStatus('ready');
      }

      return response;
    },
    enabled: !!rspid,
    staleTime: 30 * 1000, // 30 seconds - allow frequent refetches when processing
    refetchInterval: (query) => {
      // If still processing, refetch every 30 seconds
      if (query.state.data?.status === 'processing') {
        return 30 * 1000;
      }
      return false;
    },
  });
}
