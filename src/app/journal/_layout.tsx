import { Stack } from 'expo-router';

export default function ScreenHeader() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
