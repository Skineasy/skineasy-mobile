import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const HEALTHKIT_STORAGE_KEY = 'healthkit_state';

interface HealthKitPersistedState {
  isAuthorized: boolean;
  lastSyncDate: string | null;
}

interface HealthKitState extends HealthKitPersistedState {
  syncInProgress: boolean;
  setAuthorized: (authorized: boolean) => Promise<void>;
  setLastSyncDate: (date: string) => Promise<void>;
  setSyncInProgress: (inProgress: boolean) => void;
  loadPersistedState: () => Promise<void>;
}

async function persistState(state: HealthKitPersistedState): Promise<void> {
  await AsyncStorage.setItem(HEALTHKIT_STORAGE_KEY, JSON.stringify(state));
}

export const useHealthKitStore = create<HealthKitState>((set, get) => ({
  isAuthorized: false,
  lastSyncDate: null,
  syncInProgress: false,

  setAuthorized: async (authorized) => {
    set({ isAuthorized: authorized });
    await persistState({
      isAuthorized: authorized,
      lastSyncDate: get().lastSyncDate,
    });
  },

  setLastSyncDate: async (date) => {
    set({ lastSyncDate: date });
    await persistState({
      isAuthorized: get().isAuthorized,
      lastSyncDate: date,
    });
  },

  setSyncInProgress: (inProgress) => {
    set({ syncInProgress: inProgress });
  },

  loadPersistedState: async () => {
    const stored = await AsyncStorage.getItem(HEALTHKIT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as HealthKitPersistedState;
      set({
        isAuthorized: parsed.isAuthorized,
        lastSyncDate: parsed.lastSyncDate,
      });
    }
  },
}));
