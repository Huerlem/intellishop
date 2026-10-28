import { Stack } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { needsTermsAcceptance } from '@/src/legal/versions';
import { colors } from '@/src/theme';

/**
 * Signed-in area. Access is controlled by the guard in src/navigation/RootStack.tsx.
 * Only Home | Lists | Pantry are tabs; every other screen here is contextual.
 * Users who have not accepted the current Terms see only the Terms screen (L4-03); legal
 * documents stay readable (app/legal, outside this group).
 */
export default function AppLayout() {
  const { userData } = useAuth();
  const mustAccept = userData != null && needsTermsAcceptance(userData.termsVersion as string | null | undefined);
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface.canvas } }}>
      <Stack.Protected guard={!mustAccept}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="list/[listId]/index" />
        <Stack.Screen name="list/[listId]/add" options={{ presentation: 'modal' }} />
        <Stack.Screen name="list/[listId]/optimise" />
        <Stack.Screen name="shop/[tripId]/index" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="shop/[tripId]/finish" />
        <Stack.Screen name="shop/[tripId]/pantry-update" options={{ gestureEnabled: false }} />
        <Stack.Screen name="pantry-items" />
        <Stack.Screen name="recipes" />
        <Stack.Screen name="plans" />
        <Stack.Screen name="ai-consent" options={{ presentation: 'modal' }} />
        <Stack.Screen name="dietary" />
        <Stack.Screen name="delete-account" />
      </Stack.Protected>
      <Stack.Protected guard={mustAccept}>
        <Stack.Screen name="terms-update" options={{ gestureEnabled: false }} />
      </Stack.Protected>
    </Stack>
  );
}
