/**
 * Recipe ideas — "Use What I Have" (Figma P10 entry; recipe flow is clarification C5).
 * Every request goes to the server (functions/src/handlers/generateRecipes.ts). There are no
 * built-in or fallback recipes: failures are shown with the server's reason. Nothing is added
 * to a list without the user choosing it.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import type { Recipe, RecipeMode } from '@/shared/ai/recipeTypes';
import { normaliseUnit } from '@/shared/domain/units';
import { generateRecipes, RECIPE_ERROR_COPY, recipeErrorReason, saveFavourite, subscribeFavourites, type FavouriteRecipe, type GenerateResponse } from '@/src/data/recipesService';
import { RecipeCard } from '@/src/features/recipes/RecipeCard';
import { ROUTES } from '@/src/navigation/routes';
import { useAuth } from '@/hooks/useAuth';
import { useAppData } from '@/src/state/AppDataProvider';
import { errorMessage, useListItems, useLists, usePlan } from '@/src/state/hooks';
import { useLiveQuery } from '@/src/state/liveQuery';
import { Alert, AppText, Button, ChoiceChips, Header, IconButton, InfoCard, MultiChips, Screen, SectionHeader, SettingsRow, RowGroup, Sheet, Stepper } from '@/src/ui';

const NO_FAVOURITES: FavouriteRecipe[] = [];

const MODES = [
  { value: 'pantry', label: 'My Pantry' },
  { value: 'list', label: 'A list' },
  { value: 'both', label: 'Pantry + list' },
] as const;

export default function RecipesScreen() {
  const router = useRouter();
  const auth = useAuth();
  const data = useAppData();
  const plan = usePlan();
  const lists = useLists();
  const [mode, setMode] = useState<RecipeMode>('pantry');
  const [listId, setListId] = useState<string | null>(null);
  const [servings, setServings] = useState(2);
  const [usePrefs, setUsePrefs] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [failure, setFailure] = useState<ReturnType<typeof recipeErrorReason> | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [addFor, setAddFor] = useState<Recipe | null>(null);
  const [toAdd, setToAdd] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const targetList = useListItems(listId ?? undefined);

  const favourites = useLiveQuery<FavouriteRecipe[]>(data.uid ? `fav:${data.uid}` : null, (ok, fail) => subscribeFavourites(data.uid!, ok, fail), NO_FAVOURITES).data;

  const back = () => (router.canGoBack() ? router.back() : router.replace(ROUTES.pantry));
  const consented = data.aiConsent.data.granted;
  const access = plan.aiRecipes;
  const prefs = data.preferences.data;
  const needsList = mode !== 'pantry';

  const generate = async () => {
    setBusy(true);
    setFailure(null);
    setNotice(null);
    try {
      const r = await generateRecipes({ mode, listId: needsList ? (listId ?? undefined) : undefined, servings, useDietaryPreferences: usePrefs && prefs.consented });
      setResult(r);
    } catch (e) {
      setResult(null);
      setFailure(recipeErrorReason(e));
    } finally {
      setBusy(false);
    }
  };

  const save = async (recipe: Recipe) => {
    setSavingId(recipe.id);
    try {
      await saveFavourite(data.uid!, recipe);
    } catch (e) {
      setNotice(errorMessage(e));
    } finally {
      setSavingId(null);
    }
  };

  const addMissing = async () => {
    if (!addFor) return;
    const chosen = addFor.ingredients.filter((i) => toAdd.includes(i.name));
    try {
      for (const ing of chosen) {
        const unit = normaliseUnit(ing.unit);
        const amount = ing.shortfall?.amount ?? ing.quantity ?? 1;
        await targetList.add({ name: ing.name, quantity: unit ? amount : 1, unit: ing.shortfall?.unit ?? unit ?? 'unit' });
      }
      setNotice(`Added ${chosen.length} ${chosen.length === 1 ? 'item' : 'items'} to your list.`);
      setAddFor(null);
    } catch (e) {
      setNotice(errorMessage(e));
    }
  };

  const blocked = !consented || !access.allowed || (needsList && !listId);
  const copy = failure ? RECIPE_ERROR_COPY[failure] : null;

  return (
    <Screen testID="recipes-screen" header={<Header left={<IconButton kind="back" onPress={back} />} title="Recipe ideas" />}>
      <AppText variant="bodySmall" tone="secondary">
        Get recipe ideas from what you already have. Recipes are suggestions created by AI — check them before cooking.
      </AppText>

      {!consented ? (
        <InfoCard withIcon title="Permission needed" body="Recipe ideas use an AI provider. Review what is sent before allowing it." testID="recipes-consent-needed">
          <Button title="Review and allow" variant="secondary" onPress={() => router.push(ROUTES.aiConsent)} />
        </InfoCard>
      ) : !access.allowed ? (
        access.code === 'EMAIL_NOT_VERIFIED' ? (
          <Alert tone="warning" title="Verify your email" detail="Free AI recipes are available once your email address is verified." actionTitle="Resend" onAction={() => auth.resendVerification()} testID="recipes-verify" />
        ) : access.code === 'TRIAL_EXHAUSTED' ? (
          <Alert tone="info" title="Free AI recipes used" detail="You have used your 3 free AI recipe generations. Premium includes AI recipes within fair-use limits." actionTitle="Plans" onAction={() => router.push(ROUTES.plans)} testID="recipes-trial-used" />
        ) : (
          <Alert tone="info" title="Not available on your plan" actionTitle="Plans" onAction={() => router.push(ROUTES.plans)} />
        )
      ) : (
        <AppText variant="caption" tone="muted" testID="recipes-allowance">
          {plan.plan === 'premium' ? `${plan.premiumUsedThisMonth} of ${plan.premiumMonthlyLimit} used this month` : `${plan.introRemaining} of 3 free generations left. A generation is only counted when recipes are shown.`}
        </AppText>
      )}

      <ChoiceChips label="Use ingredients from" options={MODES} value={mode} onChange={setMode} />
      {needsList ? (
        lists.active.length ? (
          <ChoiceChips label="List" options={lists.active.map((l) => ({ value: l.id, label: l.name }))} value={listId} onChange={setListId} />
        ) : (
          <AppText variant="bodySmall" tone="secondary">You have no active lists.</AppText>
        )
      ) : null}
      <Stepper label="Servings" value={servings} onChange={setServings} min={1} max={8} />
      <RowGroup>
        <SettingsRow
          title="Use my allergies & diets"
          detail={prefs.consented ? 'Suggestions are checked against them' : 'None saved — suggestions will not take allergies into account'}
          value={prefs.consented && usePrefs}
          disabled={!prefs.consented}
          onValueChange={setUsePrefs}
        />
        {!prefs.consented ? <SettingsRow title="Add allergies & diets" onPress={() => router.push(ROUTES.dietary)} /> : null}
      </RowGroup>

      <Button title="Get recipe ideas" onPress={generate} loading={busy} loadingTitle="Creating recipes…" disabled={blocked} testID="generate-recipes" />

      {copy ? <Alert tone={failure === 'SERVICE_PAUSED' || failure === 'NOT_CONFIGURED' ? 'info' : 'error'} title={copy.title} detail={copy.body} actionTitle={copy.retry ? 'Try again' : undefined} onAction={copy.retry ? generate : undefined} testID="recipes-error" /> : null}
      {notice ? <Alert tone="info" title={notice} /> : null}

      {result ? (
        <>
          {!result.preferencesApplied && usePrefs && prefs.consented ? <Alert tone="warning" title="Your allergies and diets were not applied" detail="Check every ingredient yourself." /> : null}
          {result.discardedCount ? <AppText variant="caption" tone="muted">{result.discardedCount} suggestion(s) were removed because they conflicted with your preferences or failed our checks.</AppText> : null}
          {result.excludedExpired.length ? <AppText variant="caption" tone="muted">Not used because they are past their use-by date: {result.excludedExpired.join(', ')}.</AppText> : null}
          <View style={{ gap: 12 }}>
            {result.recipes.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                saved={favourites.some((f) => f.id === r.id)}
                busy={savingId === r.id}
                onSave={() => save(r)}
                onAddMissing={listId ? () => { setAddFor(r); setToAdd(r.ingredients.filter((i) => i.status === 'missing' || i.status === 'partial').map((i) => i.name)); } : undefined}
              />
            ))}
          </View>
        </>
      ) : null}

      {favourites.length ? (
        <>
          <SectionHeader title="Saved recipes" count={favourites.length} />
          <View style={{ gap: 12 }}>
            {favourites.map((r) => (
              <RecipeCard key={r.id} recipe={r} saved onSave={() => {}} />
            ))}
          </View>
        </>
      ) : null}

      <Sheet visible={!!addFor} title="Add missing ingredients" onClose={() => setAddFor(null)} footer={<Button title={`Add ${toAdd.length} to list`} disabled={!toAdd.length} onPress={addMissing} testID="add-missing-confirm" />}>
        {addFor ? (
          <MultiChips
            label={`Choose what to add to ${lists.all.find((l) => l.id === listId)?.name ?? 'your list'}`}
            options={addFor.ingredients.filter((i) => i.status === 'missing' || i.status === 'partial').map((i) => ({ value: i.name, label: i.name }))}
            values={toAdd}
            onChange={setToAdd}
          />
        ) : null}
      </Sheet>
    </Screen>
  );
}
