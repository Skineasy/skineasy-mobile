const { withNativeWind } = require('nativewind/metro');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const path = require('path');

const config = getSentryExpoConfig(__dirname);

// Add resolver config for path aliases
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    '@assets': path.resolve(__dirname, 'assets'),
  },
};

module.exports = withNativeWind(config, {
  input: './src/global.css',
});
