/**
 * AI permission (L3-01; Apple Guideline 5.1.2(i)): explains exactly what is sent, to whom and
 * why, before anything is sent. Nothing is pre-selected; "Not now" is equally prominent.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { accountApi } from '@/src/data/accountRepository';
import { AI_CONSENT_VERSION, AI_PROVIDER_DISPLAY_NAME } from '@/src/legal/versions';
import { ROUTES, routeTo } from '@/src/navigation/routes';
import { errorMessage } from '@/src/state/hooks';
import { Alert, AppText, Button, Card, Header, IconButton, Screen } from '@/src/ui';

export const AI_CONSENT_POINTS = {
  sent: 'Ingredient names, quantities, units and expiry dates from your Pantry or list, and the type of request.',
  optional: 'Your allergies and diets — only if you have saved them separately and choose to use them.',
  never: 'Your name, email address, account ID or photo.',
};

export default function AiConsentScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const close = () => (router.canGoBack() ? router.back() : router.replace(ROUTES.profile));

  const allow = async () => {
    setBusy(true);
    setError(null);
    try {
      await accountApi.setAiConsent(true, AI_CONSENT_VERSION);
      close();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      testID="ai-consent-screen"
      header={<Header left={<IconButton kind="close" onPress={close} />} title="Allow AI suggestions?" />}
      footer={
        <>
          <Button title="Allow AI suggestions" onPress={allow} loading={busy} testID="ai-consent-allow" />
          <Button title="Not now" variant="secondary" onPress={close} testID="ai-consent-decline" />
        </>
      }
    >
      <AppText variant="bodySmall" tone="secondary">
        Recipe ideas are created by an AI service run by {AI_PROVIDER_DISPLAY_NAME}. To create them, our server sends that provider some of your information. The app never contacts the provider directly.
      </AppText>
      {error ? <Alert tone="error" title="Could not save your choice" detail={error} /> : null}
      <Card>
        <AppText variant="label">What is sent</AppText>
        <AppText variant="bodySmall">{AI_CONSENT_POINTS.sent}</AppText>
        <AppText variant="bodySmall">{AI_CONSENT_POINTS.optional}</AppText>
      </Card>
      <Card>
        <AppText variant="label">What is never sent</AppText>
        <AppText variant="bodySmall">{AI_CONSENT_POINTS.never}</AppText>
      </Card>
      <Card>
        <AppText variant="label">Good to know</AppText>
        <AppText variant="bodySmall">AI suggestions can be wrong. Always check ingredients, allergens and cooking instructions yourself. Nothing changes in your lists or Pantry unless you accept it.</AppText>
        <AppText variant="bodySmall">You can turn this off at any time in Profile › Privacy.</AppText>
      </Card>
      <Button title="Read AI Transparency & Safety" variant="tertiary" align="start" onPress={() => router.push(routeTo.legal('ai'))} />
    </Screen>
  );
}
