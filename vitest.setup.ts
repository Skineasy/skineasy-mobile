import { vi } from 'vitest';

// Mock react-native modules
vi.mock('react-native', async () => {
  return {
    Platform: {
      OS: 'ios',
      select: vi.fn((obj) => obj.ios),
    },
    StyleSheet: {
      create: (styles: Record<string, unknown>) => styles,
    },
  };
});

// Mock expo-secure-store
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

// Mock expo-localization
vi.mock('expo-localization', () => ({
  locale: 'en-US',
  locales: ['en-US'],
  getLocales: vi.fn(() => [{ languageCode: 'en', regionCode: 'US' }]),
}));

// Global test utilities - __DEV__ is already declared by React Native types
Object.defineProperty(global, '__TEST__', { value: true, writable: true });
Object.defineProperty(global, '__DEV__', { value: true, writable: true });
