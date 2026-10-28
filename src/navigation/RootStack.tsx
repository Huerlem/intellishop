import { Stack } from 'expo-router';

type RootStackProps = {
  isAuthenticated: boolean;
};

/**
 * Top-level navigator with authentication guards (Expo Router protected routes).
 * - (app): signed-in area — Home | Lists | Pantry tabs and contextual screens.
 * - (public): welcome, sign-in, registration, password reset.
 * When the guard flips (sign-in / sign-out), Expo Router removes the now-protected
 * history and redirects to the first available screen.
 */
export function RootStack({ isAuthenticated }: RootStackProps) {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(public)" />
      </Stack.Protected>
    </Stack>
  );
}
