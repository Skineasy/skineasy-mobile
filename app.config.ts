import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: process.env.APP_NAME ?? 'Skin Easy',
  slug: 'skineasy',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#F4E9E0',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: process.env.BUNDLE_ID ?? 'com.skineasy.app',
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      NSHealthShareUsageDescription:
        'SkinEasy uses your health data to track sleep, activity, and nutrition for skin health insights.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#F4E9E0',
    },
    package: process.env.BUNDLE_ID ?? 'com.skineasy.app',
    edgeToEdgeEnabled: true,
    softwareKeyboardLayoutMode: 'pan',
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  extra: {
    apiUrl: process.env.API_URL ?? 'https://api.skineasy.com',
    typeformId: process.env.TYPEFORM_ID ?? '',
    prestashopUrl: process.env.PRESTASHOP_URL ?? 'https://skineasy.com',
    devLoginSecret: process.env.DEV_LOGIN_SECRET ?? '',
    sentryDsn: process.env.SENTRY_DSN,
    eas: {
      projectId: 'dfbff412-fc10-4a77-b170-eb432c2969b9',
    },
  },
  scheme: 'skineasy',
  updates: {
    enabled: true,
    checkAutomatically: 'WIFI_ONLY',
    fallbackToCacheTimeout: 30000,
    url: 'https://u.expo.dev/dfbff412-fc10-4a77-b170-eb432c2969b9',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-localization',
    'expo-font',
    '@react-native-community/datetimepicker',
    [
      '@sentry/react-native/expo',
      {
        url: 'https://sentry.io/',
        project: 'skineasy',
        organization: 'aurelien-vandaele',
      },
    ],
    'react-native-health',
  ],
});
