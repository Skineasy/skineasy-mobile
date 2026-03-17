import { create } from 'zustand';
import type { UserProfile } from '@shared/types/user.types';
import { logger } from '@shared/utils/logger';

export type RoutineStatus = 'none' | 'processing' | 'ready';

interface UserState {
  user: UserProfile | null;
  hasDiagnosis: boolean;
  rspid: string | null;
  routineStatus: RoutineStatus;
  setUser: (user: UserProfile) => void;
  setHasDiagnosis: (value: boolean) => void;
  setRspid: (rspid: string) => void;
  setRoutineStatus: (status: RoutineStatus) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  hasDiagnosis: false,
  rspid: null,
  routineStatus: 'none',

  setUser: (user) => {
    logger.info('[userStore] setUser called with:', user);
    set({ user });
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

  clearUser: () => {
    logger.info('[userStore] clearUser called');
    set({ user: null, hasDiagnosis: false, rspid: null, routineStatus: 'none' });
  },
}));
