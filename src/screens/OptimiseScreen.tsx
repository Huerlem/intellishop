/**
 * P04 Optimisation Review (Figma 136:185) — honest unavailable state.
 * The server-side optimisation endpoint is not built yet (IMPLEMENTATION_PACKAGE_REPORT.md),
 * so the app explains how the feature will work, changes nothing, and does not sell it.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES, routeTo } from '@/src/navigation/routes';
import { Alert, AppText, Button, Header, IconButton, InfoCard, Screen } from '@/src/ui';

export default function OptimiseScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const router = useRouter();
  const back = () => (router.canGoBack() ? router.back() : router.replace(listId ? routeTo.list(listId) : ROUTES.lists));
  return (
    <Screen testID="optimise-screen" header={<Header left={<IconButton kind="back" onPress={back} />} title="Optimise List" />} footer={<Button title="Back to list" onPress={back} />}>
      <Alert tone="info" title="List optimisation isn't available yet" detail="Nothing on your list has been changed." testID="optimise-unavailable" />
      <InfoCard
        title="How it will work"
        body="IntelliShop will suggest items to add, remove or swap, with a reason for each. You accept or reject every suggestion — your list never changes on its own. Suggestions will not include store prices until a licensed price source is available."
      />
      <AppText variant="caption" tone="muted">
        Planned for a later version. It will use AI only after you give permission in Settings.
      </AppText>
    </Screen>
  );
}
