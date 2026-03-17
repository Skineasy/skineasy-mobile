import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type TimeOfDay = 'morning' | 'evening';

interface RoutineCompletionState {
  // Key format: "YYYY-MM-DD_morning/evening_stepOrder"
  completions: Record<string, boolean>;

  toggleCompletion: (date: string, timeOfDay: TimeOfDay, stepOrder: number) => void;
  isCompleted: (date: string, timeOfDay: TimeOfDay, stepOrder: number) => boolean;
  cleanupOldEntries: () => void;
}

const getKey = (date: string, timeOfDay: TimeOfDay, stepOrder: number): string =>
  `${date}_${timeOfDay}_${stepOrder}`;

export const useRoutineCompletionStore = create<RoutineCompletionState>()(
  persist(
    (set, get) => ({
      completions: {},

      toggleCompletion: (date, timeOfDay, stepOrder) => {
        const key = getKey(date, timeOfDay, stepOrder);
        set((state) => ({
          completions: {
            ...state.completions,
            [key]: !state.completions[key],
          },
        }));
      },

      isCompleted: (date, timeOfDay, stepOrder) => {
        const key = getKey(date, timeOfDay, stepOrder);
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
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
