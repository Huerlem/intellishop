/**
 * Allergies & diets (L3-03). Special-category data: stored only with explicit consent given on
 * this screen (nothing pre-selected); withdrawing consent deletes the stored preferences.
 * Allergen names follow the FSA's 14 allergens (shared/food/allergens.ts).
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ALLERGEN_CODES, ALLERGEN_LABELS, DIET_CODES, DIET_LABELS, type AllergenCode, type DietCode } from '@/shared/food/allergens';
import { accountApi, type DietaryPreferences } from '@/src/data/accountRepository';
import { DIETARY_CONSENT_VERSION } from '@/src/legal/versions';
import { ROUTES, routeTo } from '@/src/navigation/routes';
import { useAppData } from '@/src/state/AppDataProvider';
import { errorMessage } from '@/src/state/hooks';
import { Alert, AppText, Button, CheckboxField, ChoiceChips, Header, IconButton, LoadingState, MultiChips, Screen, TextField } from '@/src/ui';

const ALLERGENS = ALLERGEN_CODES.map((c) => ({ value: c, label: ALLERGEN_LABELS[c] }));
const DIETS = DIET_CODES.map((c) => ({ value: c, label: DIET_LABELS[c] }));

export default function DietaryPreferencesScreen() {
  const router = useRouter();
  const { preferences } = useAppData();
  const back = () => (router.canGoBack() ? router.back() : router.replace(ROUTES.profile));
  if (preferences.status === 'loading') {
    return (
      <Screen testID="dietary-screen" header={<Header left={<IconButton kind="back" onPress={back} />} title="Allergies & diets" />}>
        <LoadingState />
      </Screen>
    );
  }
  // The form starts from the saved preferences; consent is never pre-ticked.
  return <DietaryForm saved={preferences.data} onBack={back} />;
}

function DietaryForm({ saved, onBack }: { saved: DietaryPreferences; onBack: () => void }) {
  const router = useRouter();
  const [allergens, setAllergens] = useState<AllergenCode[]>(saved.allergens);
  const [diets, setDiets] = useState<DietCode[]>(saved.diets);
  const [avoid, setAvoid] = useState(saved.avoid.join(', '));
  const [severity, setSeverity] = useState<'avoid' | 'severe'>(saved.severity);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'error' | 'success'; title: string; detail?: string } | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);
  const back = onBack;
  const avoidList = avoid.split(',').map((s) => s.trim()).filter(Boolean);

  const save = async () => {
    if (!consent) return setConsentError('Tick the box to allow IntelliShop to store this information.');
    if (avoidList.length > 20 || avoidList.some((a) => a.length > 40)) return setNotice({ tone: 'error', title: 'Too many foods to avoid', detail: 'Use up to 20 foods, each up to 40 characters.' });
    setBusy('save');
    setNotice(null);
    try {
      await accountApi.setDietaryPreferences({ consent: true, version: DIETARY_CONSENT_VERSION, allergens, diets, avoid: avoidList, severity });
      setNotice({ tone: 'success', title: 'Saved', detail: 'Recipe suggestions will be checked against these preferences when you choose to use them.' });
    } catch (e) {
      setNotice({ tone: 'error', title: 'Could not save', detail: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const withdraw = async () => {
    setBusy('withdraw');
    setNotice(null);
    try {
      await accountApi.setDietaryPreferences({ consent: false, version: DIETARY_CONSENT_VERSION, allergens: [], diets: [], avoid: [], severity: 'avoid' });
      setAllergens([]);
      setDiets([]);
      setAvoid('');
      setNotice({ tone: 'success', title: 'Preferences deleted', detail: 'Your allergies and diets have been deleted from IntelliShop.' });
    } catch (e) {
      setNotice({ tone: 'error', title: 'Could not delete', detail: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen
      testID="dietary-screen"
      header={<Header left={<IconButton kind="back" onPress={back} />} title="Allergies & diets" />}
      footer={
        <>
          <Button title="Save preferences" onPress={save} loading={busy === 'save'} testID="dietary-save" />
          {saved.consented ? <Button title="Delete my preferences" variant="tertiary" onPress={withdraw} loading={busy === 'withdraw'} testID="dietary-withdraw" /> : null}
        </>
      }
    >
      {notice ? <Alert tone={notice.tone} title={notice.title} detail={notice.detail} /> : null}
      <Alert tone="warning" title="A helpful check, not a guarantee" detail="IntelliShop cannot see product labels or recipes' exact ingredients. Always read labels, especially for severe allergies." />
      <AppText variant="bodySmall" tone="secondary">
        This is optional. If you save it, recipe suggestions you ask for can avoid these foods and show warnings. It is health information, so we only store it with your permission.
      </AppText>
      <MultiChips label="Allergies and intolerances" options={ALLERGENS} values={allergens} onChange={setAllergens} testID="allergen-chips" />
      <ChoiceChips label="How serious?" options={[{ value: 'avoid', label: 'I avoid these' }, { value: 'severe', label: 'Severe allergy' }] as const} value={severity} onChange={setSeverity} />
      <MultiChips label="Diets" options={DIETS} values={diets} onChange={setDiets} />
      <TextField label="Other foods to avoid (optional)" value={avoid} onChangeText={setAvoid} placeholder="e.g. coriander, mushrooms" hint="Separate with commas. Up to 20." />
      <CheckboxField
        checked={consent}
        onChange={(v) => {
          setConsent(v);
          setConsentError(null);
        }}
        label="I agree that IntelliShop may store this information and use it to check recipe suggestions. I can delete it at any time."
        error={consentError}
        testID="dietary-consent"
      />
      <Button title="Read Food Safety & Allergens" variant="tertiary" align="start" onPress={() => router.push(routeTo.legal('food-safety'))} />
    </Screen>
  );
}
