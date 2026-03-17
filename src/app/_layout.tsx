import { useReactQueryDevTools } from '@dev-plugins/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';

import assets from '@assets';
import { useInitializeUser } from '@features/auth/hooks/useInitializeUser';
import { useHealthKitAutoSync } from '@features/healthkit/hooks/useHealthKitAutoSync';
import * as Sentry from '@sentry/react-native';
import { ErrorBoundary } from '@shared/components/error-boundary';
import { ForceUpdateModal } from '@shared/components/force-update-modal';
import { InitErrorScreen } from '@shared/components/init-error-screen';
import { OfflineBanner } from '@shared/components/offline-banner';
import { queryClient } from '@shared/config/queryClient';
import { initSentry } from '@shared/config/sentry';
import { useAppUpdates } from '@shared/hooks/useAppUpdates';
import { useForceUpdate } from '@shared/hooks/useForceUpdate';
import { useNetworkStatus } from '@shared/hooks/useNetworkStatus';
import { useAuthStore } from '@shared/stores/auth.store';
import { useHealthKitStore } from '@shared/stores/healthkit.store';
import { logger } from '@shared/utils/logger';
import '@/global.css';
import '@/lib/i18n';

// Initialize Sentry before app starts
initSentry();

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const insets = useSafeAreaInsets();
  const loadToken = useAuthStore((state) => state.loadToken);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Initialize network status listener
  useNetworkStatus();

  // Silent OTA updates (production only)
  useAppUpdates();

  // Force update check for outdated app versions
  const { needsUpdate, openStore } = useForceUpdate();

  const [fontsLoaded] = useFonts({
    ChocolatesRegular: assets.ChocolatesRegular,
    ChocolatesMedium: assets.ChocolatesMedium,
    ChocolatesSemibold: assets.ChocolatesSemibold,
    ChocolatesBold: assets.ChocolatesBold,
  });

  // Initialize user data from /me endpoint
  const { isLoading: isUserLoading, error: userError, refetch } = useInitializeUser();

  // Load HealthKit persisted state
  const loadHealthKitState = useHealthKitStore((state) => state.loadPersistedState);

  // Auto-sync HealthKit on app open
  useHealthKitAutoSync(isAuthenticated);

  useEffect(() => {
    logger.info('[_layout] Loading token...');
    loadToken();
    // Load HealthKit state on iOS
    if (Platform.OS === 'ios') {
      loadHealthKitState();
    }
  }, [loadToken, loadHealthKitState]);

  useEffect(() => {
    logger.info('[_layout] State:', {
      fontsLoaded,
      isAuthLoading,
      isUserLoading,
      isAuthenticated,
    });
    if (fontsLoaded && !isAuthLoading && !isUserLoading) {
      logger.info('[_layout] All ready, hiding splash screen');
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isAuthLoading, isUserLoading, isAuthenticated]);

  logger.info(
    '[_layout] Render check - showing splash?',
    !fontsLoaded || isAuthLoading || isUserLoading,
  );

  if (!fontsLoaded || isAuthLoading || isUserLoading) {
    return null;
  }

  // Show blocking modal if app version is outdated
  if (needsUpdate) {
    return <ForceUpdateModal onUpdate={openStore} />;
  }

  // Show error screen if user initialization failed
  if (userError) {
    return <InitErrorScreen onRetry={refetch} />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="diagnosis" options={{ presentation: 'modal' }} />
        <Stack.Screen name="routine" />
      </Stack>
      <OfflineBanner />
      <Toaster position="top-center" offset={insets.top + 8} />
    </>
  );
}

export default Sentry.wrap(function RootLayout() {
  useReactQueryDevTools(queryClient);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <ErrorBoundary>
              <RootLayoutContent />
            </ErrorBoundary>
          </SafeAreaProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
});
