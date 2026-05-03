import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: process.env.APP_NAME ?? 'Skin Easy',
  slug: 'skineasy',
  version: '1.0.2',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#F4E9E0',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: process.env.BUNDLE_ID ?? 'com.skineasy.app',
    associatedDomains: ['applinks:skineasy.com', 'webcredentials:skineasy.com'],
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#F4E9E0',
    },
    package: process.env.BUNDLE_ID ?? 'com.skineasy.app',
    softwareKeyboardLayoutMode: 'pan',
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: 'https', host: 'skineasy.com', pathPrefix: '/password-reset' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  extra: {
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
    [
      '@kingstinct/react-native-healthkit',
      {
        NSHealthShareUsageDescription:
          'SkinEasy uses your health data to track sleep, activity, and nutrition for skin health insights.',
        NSHealthUpdateUsageDescription: false,
        background: false,
      },
    ],
    [
      'expo-notifications',
      {
        color: '#F4E9E0',
        iosDisplayInForeground: true,
      },
    ],
  ],
});
