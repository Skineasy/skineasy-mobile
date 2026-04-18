import { create } from 'zustand';
import type { ResolveRoutineResult } from '@features/routine/data/resolve-routine.api';
import type { UserProfile } from '@shared/types/user.types';
import { logger } from '@shared/utils/logger';

export type RoutineStatus = 'none' | 'processing' | 'ready';

interface UserState {
  user: UserProfile | null;
  hasDiagnosis: boolean;
  rspid: string | null;
  routineStatus: RoutineStatus;
  hasRoutineAccess: boolean;
  routineResolution: ResolveRoutineResult | null;
  setUser: (user: UserProfile) => void;
  setHasDiagnosis: (value: boolean) => void;
  setRspid: (rspid: string) => void;
  setRoutineStatus: (status: RoutineStatus) => void;
  setHasRoutineAccess: (value: boolean) => void;
  setRoutineResolution: (result: ResolveRoutineResult | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  hasDiagnosis: false,
  rspid: null,
  routineStatus: 'none',
  hasRoutineAccess: false,
  routineResolution: null,

  setUser: (user) => {
    logger.info('[userStore] setUser called with:', user);
    set({ user, hasRoutineAccess: user.has_routine_access ?? false });
  },

  setHasDiagnosis: (value) => {
    logger.info('[userStore] setHasDiagnosis called with:', value);
    set({ hasDiagnosis: value });
  },

  setRspid: (rspid) => {
    logger.info('[userStore] setRspid called with:', rspid);
    set({ rspid, routineStatus: 'processing' });
  },

  setRoutineStatus: (routineStatus) => {
    logger.info('[userStore] setRoutineStatus called with:', routineStatus);
    set({ routineStatus });
  },

  setHasRoutineAccess: (hasRoutineAccess) => {
    logger.info('[userStore] setHasRoutineAccess called with:', hasRoutineAccess);
    set({ hasRoutineAccess });
  },

  setRoutineResolution: (routineResolution) => {
    logger.info('[userStore] setRoutineResolution called with status:', routineResolution?.status);
    set({ routineResolution });
  },

  clearUser: () => {
    logger.info('[userStore] clearUser called');
    set({
      user: null,
      hasDiagnosis: false,
      rspid: null,
      routineStatus: 'none',
      hasRoutineAccess: false,
      routineResolution: null,
    });
  },
}));
