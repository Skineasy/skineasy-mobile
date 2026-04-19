import { Redirect, Stack, usePathname } from 'expo-router';

import { useAuthStore } from '@shared/stores/auth.store';
import { colors } from '@theme/colors';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const pathname = usePathname();

  if (isAuthenticated && pathname !== '/password-reset') {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
