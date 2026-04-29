import { create } from 'zustand';

import { storage } from '@lib/storage';
import type { SyncReport } from '@shared/types/healthkit.types';

const HEALTHKIT_STORAGE_KEY = 'healthkit_state';

interface HealthKitPersistedState {
  isAuthorized: boolean;
  lastSyncDate: string | null;
  lastReport: SyncReport | null;
}

interface HealthKitState extends HealthKitPersistedState {
  syncInProgress: boolean;
  setAuthorized: (authorized: boolean) => Promise<void>;
  setLastSyncDate: (date: string) => Promise<void>;
  setLastReport: (report: SyncReport) => Promise<void>;
  resetLastSyncDate: () => Promise<void>;
  setSyncInProgress: (inProgress: boolean) => void;
  loadPersistedState: () => Promise<void>;
}

function persistState(state: HealthKitPersistedState): void {
  storage.set(HEALTHKIT_STORAGE_KEY, JSON.stringify(state));
}

export const useHealthKitStore = create<HealthKitState>((set, get) => ({
  isAuthorized: false,
  lastSyncDate: null,
  lastReport: null,
  syncInProgress: false,

  setAuthorized: async (authorized) => {
    set({ isAuthorized: authorized });
    persistState({
      isAuthorized: authorized,
      lastSyncDate: get().lastSyncDate,
      lastReport: get().lastReport,
    });
  },

  setLastSyncDate: async (date) => {
    set({ lastSyncDate: date });
    persistState({
      isAuthorized: get().isAuthorized,
      lastSyncDate: date,
      lastReport: get().lastReport,
    });
  },

  setLastReport: async (report) => {
    set({ lastReport: report });
    persistState({
      isAuthorized: get().isAuthorized,
      lastSyncDate: get().lastSyncDate,
      lastReport: report,
    });
  },

  resetLastSyncDate: async () => {
    set({ lastSyncDate: null });
    persistState({
      isAuthorized: get().isAuthorized,
      lastSyncDate: null,
      lastReport: get().lastReport,
    });
  },

  setSyncInProgress: (inProgress) => {
    set({ syncInProgress: inProgress });
  },

  loadPersistedState: async () => {
    const stored = storage.getString(HEALTHKIT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<HealthKitPersistedState>;
      set({
        isAuthorized: parsed.isAuthorized ?? false,
        lastSyncDate: parsed.lastSyncDate ?? null,
        lastReport: parsed.lastReport ?? null,
      });
    }
  },
}));
