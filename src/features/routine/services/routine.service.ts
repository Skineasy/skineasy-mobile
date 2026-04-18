import type { RoutineDto } from '@features/routine/types/routine.types';
import type { RoutineResponse } from '@shared/types/routine.types';

// Routine fetching will be migrated to Supabase in a later phase (Phase 8)
export const routineService = {
  getByRspid: async (_rspid: string): Promise<RoutineResponse> => {
    throw new Error('common.error');
  },

  getLastRoutine: async (): Promise<RoutineDto> => {
    throw new Error('common.error');
  },
};
