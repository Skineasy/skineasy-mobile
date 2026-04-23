import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { resolvedRoutineToDto } from '@features/routine/data/resolved-to-dto.adapter';
import type { RoutineDto } from '@features/routine/types/routine.types';
import { useUserStore } from '@shared/stores/user.store';

/**
 * V1: reads the routine payload from the user store (set by resolveRoutine on app open / login)
 * and adapts it to the legacy RoutineDto contract used by RoutineResultsScreen.
 *
 * No TanStack Query here — the source of truth is the Zustand store that resolve-routine hydrates.
 * Loading / error states are derived from the store.
 */
export function useRoutine(): {
  data: RoutineDto | null;
  isLoading: boolean;
  isError: boolean;
} {
  const routineResolution = useUserStore((state) => state.routineResolution);
  const { i18n } = useTranslation();

  const data = useMemo<RoutineDto | null>(() => {
    if (!routineResolution || routineResolution.status !== 'ready') return null;
    return resolvedRoutineToDto(routineResolution.routine, i18n.language);
  }, [routineResolution, i18n.language]);

  return {
    data,
    isLoading: routineResolution === null,
    isError: routineResolution !== null && routineResolution.status === 'routine_generation_failed',
  };
}
