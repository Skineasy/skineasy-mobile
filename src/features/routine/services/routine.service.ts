import type { RoutineApiResponse, RoutineDto } from '@features/routine/types/routine.types';
import { api } from '@shared/services/api';
import type { RoutineResponse } from '@shared/types/routine.types';

interface ApiResponse<T> {
  data: T;
}

export const routineService = {
  /**
   * Get routine by response ID (rspid) from Typeform
   * Used for web embed (iframe)
   */
  getByRspid: async (rspid: string): Promise<RoutineResponse> => {
    const response = await api.get<ApiResponse<RoutineResponse>>(`/api/v1/routine/${rspid}`);
    return response.data;
  },

  /**
   * Get the authenticated user's last routine
   * Used for main app (requires auth token)
   */
  getLastRoutine: async (): Promise<RoutineDto> => {
    const response = await api.get<RoutineApiResponse>('/api/v1/routine/last');
    return response.data;
  },
};
