import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { storage } from '@lib/storage';

const mmkvStorage = {
  getItem: (key: string): string | null => storage.getString(key) ?? null,
  setItem: (key: string, value: string): void => storage.set(key, value),
  removeItem: (key: string): void => {
    storage.remove(key);
  },
};

type TimeOfDay = 'morning' | 'evening';

interface RoutineCompletionState {
  // Key format: "YYYY-MM-DD_morning/evening_productId"
  completions: Record<string, boolean>;

  toggleProductCompletion: (date: string, timeOfDay: TimeOfDay, productId: string) => void;
  isProductCompleted: (date: string, timeOfDay: TimeOfDay, productId: string) => boolean;
  cleanupOldEntries: () => void;
}

const getKey = (date: string, timeOfDay: TimeOfDay, productId: string): string =>
  `${date}_${timeOfDay}_${productId}`;

export const useRoutineCompletionStore = create<RoutineCompletionState>()(
  persist(
    (set, get) => ({
      completions: {},

      toggleProductCompletion: (date, timeOfDay, productId) => {
        const key = getKey(date, timeOfDay, productId);
        set((state) => ({
          completions: {
            ...state.completions,
            [key]: !state.completions[key],
          },
        }));
      },

      isProductCompleted: (date, timeOfDay, productId) => {
        const key = getKey(date, timeOfDay, productId);
        return !!get().completions[key];
      },

      cleanupOldEntries: () => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoff = sevenDaysAgo.toISOString().split('T')[0];

        set((state) => {
          const newCompletions = { ...state.completions };
          Object.keys(newCompletions).forEach((key) => {
            const date = key.split('_')[0];
            if (date < cutoff) delete newCompletions[key];
          });
          return { completions: newCompletions };
        });
      },
    }),
    {
      name: 'routine-completion-storage',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
