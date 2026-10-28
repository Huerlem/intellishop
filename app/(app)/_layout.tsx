import { Stack } from 'expo-router';

import { colors } from '@/src/theme';

/** Signed-in area. Access is controlled by the guard in src/navigation/RootStack.tsx. */
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface.canvas },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
