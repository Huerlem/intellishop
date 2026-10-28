/**
 * Profile & Settings (Figma clarification C2 — "design needed"; built from List Item, Info Card,
 * Alert and Button components). Reached from the Home avatar; never a tab.
 * Account, plan, privacy (AI consent, dietary preferences, data download), subscription
 * (restore, manage, refunds via Apple), help, legal documents, sign out and account deletion.
 */
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Share, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { PLAN_LIMITS } from '@/shared/entitlements/plans';
import { accountApi } from '@/src/data/accountRepository';
import { DataError } from '@/src/data/firestore';
import { getSubscriptionService } from '@/src/data/subscriptionService';
import { AI_CONSENT_VERSION } from '@/src/legal/versions';
import { PLAN_NAMES } from '@/src/features/presenters';
import { ROUTES, routeTo } from '@/src/navigation/routes';
import { useAppData } from '@/src/state/AppDataProvider';
import { errorMessage, usePlan } from '@/src/state/hooks';
import { Alert, AppText, Button, Header, IconButton, RowGroup, Screen, SectionHeader, SettingsRow, Sheet, TextField } from '@/src/ui';

const LEGAL_LINKS = [
  ['privacy', 'Privacy Policy'],
  ['terms', 'Terms & Conditions'],
  ['ai', 'AI Transparency & Safety'],
  ['food-safety', 'Food Safety & Allergens'],
  ['subscriptions', 'Subscription Terms'],
  ['pricing-data', 'Prices & Data Disclaimer'],
  ['account-deletion', 'Account & Data Deletion'],
  ['acceptable-use', 'Acceptable Use'],
  ['legal/changes', 'Changes to these documents'],
] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const auth = useAuth();
  const data = useAppData();
  const plan = usePlan();
  const [notice, setNotice] = useState<{ tone: 'success' | 'error' | 'info'; title: string; detail?: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState('');

  const back = () => (router.canGoBack() ? router.back() : router.replace(ROUTES.home));
  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setNotice(null);
    try {
      await fn();
    } catch (e) {
      setNotice({ tone: 'error', title: 'Something went wrong', detail: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const limits = PLAN_LIMITS[plan.plan];
  const planDetail =
    plan.plan === 'free'
      ? `${limits.activeLists} lists · ${limits.itemsPerList} items per list · ${limits.pantryItems} Pantry items · ${plan.introRemaining} of 3 free AI recipe generations left`
      : plan.plan === 'premium'
        ? `AI recipes: ${plan.premiumUsedThisMonth} of ${plan.premiumMonthlyLimit} used this month`
        : 'Unlimited lists and Pantry items';
  const aiOn = data.aiConsent.data.granted;
  const prefs = data.preferences.data;

  return (
    <Screen testID="profile-screen" header={<Header left={<IconButton kind="back" onPress={back} />} title="Profile & Settings" />}>
      {notice ? <Alert tone={notice.tone} title={notice.title} detail={notice.detail} testID="profile-notice" /> : null}

      {!auth.emailVerified ? (
        <Alert
          tone="warning"
          title="Verify your email address"
          detail={`We sent a link to ${auth.getEmail()}. Free AI recipes are available once it is verified.`}
          actionTitle="Resend"
          onAction={() => run('resend', async () => { const r = await auth.resendVerification(); setNotice(r.success ? { tone: 'success', title: 'Verification email sent' } : { tone: 'error', title: 'Could not send the email', detail: r.error }); })}
          testID="verify-email"
        />
      ) : null}

      <SectionHeader title="Account" />
      <RowGroup>
        <SettingsRow title="Name" detail={auth.getDisplayName() || 'Not set'} onPress={() => { setName(auth.getDisplayName()); setEditingName(true); }} trailing={<AppText variant="caption" tone="action">Edit</AppText>} />
        <SettingsRow title="Email" detail={`${auth.getEmail()}${auth.emailVerified ? ' · Verified' : ' · Not verified'}`} trailing={!auth.emailVerified ? <Button title="I've verified" variant="tertiary" compact onPress={() => run('refresh', async () => { await auth.refreshUser(); })} /> : undefined} />
      </RowGroup>

      <SectionHeader title="Plan" />
      <RowGroup>
        <SettingsRow title={`${PLAN_NAMES[plan.plan]} plan`} detail={planDetail} onPress={() => router.push(ROUTES.plans)} trailing={<AppText variant="caption" tone="action">Plans</AppText>} testID="plan-row" />
        <SettingsRow title="Restore purchases" onPress={() => run('restore', async () => { const r = await getSubscriptionService().restore(); setNotice(r.status === 'restored' ? { tone: 'success', title: 'Purchases restored' } : r.status === 'nothing_to_restore' ? { tone: 'info', title: 'No purchases to restore' } : { tone: 'info', title: 'Restore is not available', detail: r.message }); })} />
        <SettingsRow title="Manage subscription" detail="Opens your App Store subscriptions" onPress={() => run('manage', () => getSubscriptionService().manageSubscriptions())} />
        <SettingsRow title="Request a refund" detail="Refunds are handled by Apple" onPress={() => run('refund', () => getSubscriptionService().requestRefund())} />
      </RowGroup>

      <SectionHeader title="Privacy" />
      <RowGroup>
        <SettingsRow
          title="AI suggestions"
          detail={aiOn ? 'On — ingredient names can be sent to our AI provider when you ask for suggestions' : 'Off — nothing is sent to an AI provider'}
          value={aiOn}
          disabled={busy === 'ai' || data.aiConsent.status !== 'ready'}
          onValueChange={(v) => (v ? router.push(ROUTES.aiConsent) : run('ai', async () => { await accountApi.setAiConsent(false, AI_CONSENT_VERSION); setNotice({ tone: 'success', title: 'AI suggestions turned off' }); }))}
          testID="ai-consent-toggle"
        />
        <SettingsRow title="Allergies & diets" detail={prefs.consented ? `${prefs.allergens.length} allergens · ${prefs.diets.length} diets saved` : 'Not set — recipes will not take them into account'} onPress={() => router.push(ROUTES.dietary)} testID="dietary-row" />
        <SettingsRow
          title="Download my data"
          detail="A copy of everything stored about you, as JSON"
          disabled={busy === 'export'}
          onPress={() => run('export', async () => { const r = await accountApi.exportData(); await Share.share({ title: 'IntelliShop data export', message: JSON.stringify(r, null, 2) }); })}
          testID="export-data"
        />
      </RowGroup>

      <SectionHeader title="Help" />
      <RowGroup>
        <SettingsRow title="Help, feedback & complaints" onPress={() => router.push(routeTo.legal('support'))} />
      </RowGroup>

      <SectionHeader title="Legal & Privacy" />
      <RowGroup>
        {LEGAL_LINKS.map(([slug, title]) => (
          <SettingsRow key={slug} title={title} onPress={() => router.push(routeTo.legal(slug))} />
        ))}
      </RowGroup>

      <View style={{ gap: 8, marginTop: 8 }}>
        <Button title="Sign out" variant="secondary" loading={busy === 'logout'} onPress={() => run('logout', async () => { await getSubscriptionService().reset(); await auth.logout(); })} testID="sign-out" />
        <Button title="Delete account" variant="tertiary" onPress={() => router.push(ROUTES.deleteAccount)} testID="delete-account" />
      </View>
      <AppText variant="caption" tone="muted" style={{ textAlign: 'center' }}>
        IntelliShop {Constants.expoConfig?.version ?? ''}
      </AppText>

      <Sheet visible={editingName} title="Your name" onClose={() => setEditingName(false)} footer={<Button title="Save" loading={busy === 'name'} onPress={() => run('name', async () => { const r = await auth.updateProfile({ displayName: name.trim().slice(0, 50) }); if (!r.success) throw new DataError('UNKNOWN', r.error ?? 'Your name could not be saved.'); setEditingName(false); })} />}>
        <TextField label="Name" value={name} onChangeText={setName} maxLength={50} autoFocus hint="The name IntelliShop uses to greet you." />
      </Sheet>
    </Screen>
  );
}
