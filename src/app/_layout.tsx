import { useReactQueryDevTools } from '@dev-plugins/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
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
import { useInitializeUser } from '@features/auth/data/auth.queries';
import { useHealthKitAutoSync } from '@features/healthkit/hooks/useHealthKitAutoSync';
import * as Sentry from '@sentry/react-native';
import { ErrorBoundary } from '@shared/components/error-boundary';
import { ForceUpdateModal } from '@shared/components/force-update-modal';
import { InitErrorScreen } from '@shared/components/init-error-screen';
import { OfflineBanner } from '@shared/components/offline-banner';
import { queryClient } from '@shared/config/queryClient';
import { queryPersister } from '@lib/query-persister';
import { initSentry } from '@shared/config/sentry';
import { useAppUpdates } from '@shared/hooks/useAppUpdates';
import { useForceUpdate } from '@shared/hooks/useForceUpdate';
import { useNetworkStatus } from '@shared/hooks/useNetworkStatus';
import { useAuthStore } from '@shared/stores/auth.store';
import { useHealthKitStore } from '@shared/stores/healthkit.store';
import { usePushTokenRegistration } from '@shared/hooks/usePushTokenRegistration';
import { logger } from '@shared/utils/logger';
import { supabase } from '@lib/supabase';
import '@/global.css';
import '@/lib/i18n';

initSentry();
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const insets = useSafeAreaInsets();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useNetworkStatus();
  useAppUpdates();

  const { needsUpdate, openStore } = useForceUpdate();

  const [fontsLoaded] = useFonts({
    ChocolatesRegular: assets.ChocolatesRegular,
    ChocolatesMedium: assets.ChocolatesMedium,
    ChocolatesSemibold: assets.ChocolatesSemibold,
    ChocolatesBold: assets.ChocolatesBold,
  });

  const { isLoading: isUserLoading, error: userError, refetch } = useInitializeUser();

  const loadHealthKitState = useHealthKitStore((state) => state.loadPersistedState);

  useHealthKitAutoSync(isAuthenticated);
  usePushTokenRegistration(isAuthenticated);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      logger.info('[_layout] Initial session:', !!session);
      setAuthenticated(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      logger.info('[_layout] Auth state changed:', _event, !!session);
      setAuthenticated(!!session);
    });

    if (Platform.OS === 'ios') {
      loadHealthKitState();
    }

    return () => subscription.unsubscribe();
  }, [setAuthenticated, loadHealthKitState]);

  useEffect(() => {
    if (fontsLoaded && !isAuthLoading && !isUserLoading) {
      logger.info('[_layout] All ready, hiding splash screen');
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isAuthLoading, isUserLoading]);

  if (!fontsLoaded || isAuthLoading || isUserLoading) {
    return null;
  }

  if (needsUpdate) {
    return <ForceUpdateModal onUpdate={openStore} />;
  }

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
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: queryPersister }}
        >
          <SafeAreaProvider>
            <ErrorBoundary>
              <RootLayoutContent />
            </ErrorBoundary>
          </SafeAreaProvider>
        </PersistQueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
});
