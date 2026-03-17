import Constants from 'expo-constants';

export const ENV = {
  API_URL: (Constants.expoConfig?.extra?.apiUrl as string) ?? 'http://localhost:3000',
  TYPEFORM_ID: (Constants.expoConfig?.extra?.typeformId as string) ?? '',
  PRESTASHOP_URL: (Constants.expoConfig?.extra?.prestashopUrl as string) ?? 'https://skineasy.com',
  SENTRY_DSN: (Constants.expoConfig?.extra?.sentryDsn as string) ?? '',
  IS_DEV: __DEV__,
};
