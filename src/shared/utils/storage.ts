import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  LOCALE: 'locale',
  SPORT_GOAL_MINUTES: 'sport_goal_minutes',
} as const;

const DEFAULT_SPORT_GOAL_MINUTES = 120; // 2 hours

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  } catch {
    return null;
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token);
}

export async function removeRefreshToken(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
}

export async function clearAllTokens(): Promise<void> {
  await Promise.all([removeToken(), removeRefreshToken()]);
}

export async function getLocale(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS.LOCALE);
  } catch {
    return null;
  }
}

export async function setLocale(locale: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.LOCALE, locale);
}

export async function getSportGoal(): Promise<number> {
  try {
    const value = await AsyncStorage.getItem(KEYS.SPORT_GOAL_MINUTES);
    return value ? Number(value) : DEFAULT_SPORT_GOAL_MINUTES;
  } catch {
    return DEFAULT_SPORT_GOAL_MINUTES;
  }
}
