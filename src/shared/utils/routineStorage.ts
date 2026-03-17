import AsyncStorage from '@react-native-async-storage/async-storage';

const ROUTINE_READY_AT_KEY = 'routine_ready_at';

export const routineStorage = {
  async setReadyAt(date: Date): Promise<void> {
    await AsyncStorage.setItem(ROUTINE_READY_AT_KEY, date.toISOString());
  },

  async getReadyAt(): Promise<Date | null> {
    const value = await AsyncStorage.getItem(ROUTINE_READY_AT_KEY);
    return value ? new Date(value) : null;
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(ROUTINE_READY_AT_KEY);
  },

  getNextMorning9am(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  },
};
