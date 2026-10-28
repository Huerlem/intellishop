/**
 * In-app account deletion (Apple Guideline 5.1.1(v); L2-06). Explains what is deleted, warns
 * that Apple subscriptions must be cancelled in the App Store, re-authenticates, then calls the
 * server, which deletes all data and the sign-in account (functions/src/handlers/account.ts).
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { accountApi } from '@/src/data/accountRepository';
import { getSubscriptionService } from '@/src/data/subscriptionService';
import { ROUTES, routeTo } from '@/src/navigation/routes';
import { errorMessage, usePlan } from '@/src/state/hooks';
import { Alert, AppText, Button, Card, CheckboxField, Header, IconButton, Screen, TextField } from '@/src/ui';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const auth = useAuth();
  const { plan } = usePlan();
  const [password, setPassword] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const back = () => (router.canGoBack() ? router.back() : router.replace(ROUTES.profile));

  const remove = async () => {
    if (!understood) return setError('Tick the box to confirm.');
    if (!password) return setError('Enter your password to confirm it is you.');
    setBusy(true);
    setError(null);
    try {
      const r = await auth.reauthenticate(password);
      if (!r.success) throw new Error(r.error ?? 'Your password was not accepted.');
      await accountApi.deleteAccount();
      await getSubscriptionService().reset();
      await auth.logout(); // the session is gone on the server; this clears the device
    } catch (e) {
      setError(e instanceof Error && !(e as { code?: string }).code ? e.message : errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      testID="delete-account-screen"
      header={<Header left={<IconButton kind="back" onPress={back} />} title="Delete account" />}
      footer={
        <>
          <Button title="Delete my account" variant="destructive" onPress={remove} loading={busy} loadingTitle="Deleting…" testID="confirm-delete-account" />
          <Button title="Cancel" variant="tertiary" onPress={back} />
        </>
      }
    >
      <Card accent="error">
        <AppText variant="label">This permanently deletes</AppText>
        <AppText variant="bodySmall">Your account and sign-in, all lists and items, your Pantry, shopping trips, saved recipes, allergies and diets, AI permission and usage records, and your profile photo.</AppText>
        <AppText variant="bodySmall" tone="secondary">It cannot be undone. Download your data first from Profile › Privacy if you want a copy.</AppText>
      </Card>
      {plan !== 'free' ? (
        <Alert
          tone="warning"
          title="Cancel your subscription in the App Store"
          detail="Deleting your account does not cancel an Apple subscription. Cancel it first so you are not charged again."
          actionTitle="Manage"
          onAction={() => getSubscriptionService().manageSubscriptions()}
          testID="delete-subscription-warning"
        />
      ) : (
        <AppText variant="caption" tone="muted">
          If you ever subscribed through the App Store, check your subscriptions there: deleting your account does not cancel them.
        </AppText>
      )}
      {error ? <Alert tone="error" title="Account not deleted" detail={error} testID="delete-account-error" /> : null}
      <CheckboxField checked={understood} onChange={setUnderstood} label="I understand my account and data will be permanently deleted." testID="delete-understood" />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" hint="For your security, confirm it is you." testID="delete-password" />
      <Button title="Read Account & Data Deletion Policy" variant="tertiary" align="start" onPress={() => router.push(routeTo.legal('account-deletion'))} />
    </Screen>
  );
}
