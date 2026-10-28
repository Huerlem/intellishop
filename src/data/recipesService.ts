/**
 * Client for server-side AI recipe generation (functions/src/handlers/generateRecipes.ts).
 * The app never calls an AI provider directly and holds no AI keys.
 * There are no fallback recipes: every failure is shown as an error state with its reason.
 */
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';

import type { Recipe, RecipeMode } from '@/shared/ai/recipeTypes';
import { callFunction, ServerError } from './accountRepository';
import { mapFirestoreError, requireDb, toMillis, type DataError } from './firestore';

export type GenerateRequest = { mode: RecipeMode; listId?: string; servings: number; useDietaryPreferences: boolean };

export type GenerateResponse = {
  recipes: Recipe[];
  discardedCount: number; // recipes removed by safety checks
  excludedExpired: string[];
  omittedCount: number;
  usage: { introRemaining: number; premiumUsedThisMonth: number; premiumMonthlyLimit: number };
  cached: boolean;
  preferencesApplied: boolean;
};

/** Error reasons returned by the server (AI_ARCHITECTURE.md §9). */
export type RecipeErrorReason =
  | 'NO_INGREDIENTS'
  | 'AI_CONSENT_REQUIRED'
  | 'EMAIL_NOT_VERIFIED'
  | 'PLAN_REQUIRED'
  | 'TRIAL_EXHAUSTED'
  | 'REQUEST_IN_PROGRESS'
  | 'QUOTA_EXCEEDED'
  | 'SERVICE_PAUSED'
  | 'PROVIDER_UNAVAILABLE'
  | 'INVALID_OUTPUT'
  | 'ALL_DISCARDED'
  | 'NOT_CONFIGURED';

export const RECIPE_ERROR_COPY: Record<RecipeErrorReason, { title: string; body: string; retry: boolean }> = {
  NO_INGREDIENTS: { title: 'Add a few ingredients first', body: 'Recipes are made from what is in your Pantry or on your list. Add some items and try again.', retry: false },
  AI_CONSENT_REQUIRED: { title: 'Permission needed', body: 'Allow AI suggestions to send your ingredient names to our AI provider.', retry: false },
  EMAIL_NOT_VERIFIED: { title: 'Verify your email', body: 'Free AI recipes are available once your email address is verified. Check your inbox for the link.', retry: false },
  PLAN_REQUIRED: { title: 'Premium feature', body: 'This feature is included in Premium.', retry: false },
  TRIAL_EXHAUSTED: { title: 'Free AI recipes used', body: 'You have used your 3 free AI recipe generations. Premium includes AI recipes within fair-use limits.', retry: false },
  REQUEST_IN_PROGRESS: { title: 'Already working on it', body: 'A recipe request is still in progress. Please wait a moment.', retry: true },
  QUOTA_EXCEEDED: { title: 'Limit reached', body: 'You have reached your AI usage limit for now.', retry: false },
  SERVICE_PAUSED: { title: 'AI recipes are paused', body: 'AI recipes are temporarily unavailable. Please try again later. Nothing was used from your allowance.', retry: true },
  PROVIDER_UNAVAILABLE: { title: 'Could not create recipes', body: 'The AI service did not respond. Nothing was used from your allowance. Please try again.', retry: true },
  INVALID_OUTPUT: { title: 'Could not create recipes', body: 'The AI response did not pass our checks, so we have not shown it. Nothing was used from your allowance.', retry: true },
  ALL_DISCARDED: { title: 'No suitable recipes', body: 'The suggestions included ingredients you asked to avoid, so we removed them. Nothing was used from your allowance. Try again or change your ingredients.', retry: true },
  NOT_CONFIGURED: { title: 'Not available yet', body: 'AI recipes are not available in this version of the app.', retry: false },
};

export function recipeErrorReason(error: unknown): RecipeErrorReason {
  if (error instanceof ServerError && error.code in RECIPE_ERROR_COPY) return error.code as RecipeErrorReason;
  if ((error as DataError)?.code === 'NOT_CONFIGURED') return 'NOT_CONFIGURED';
  return 'PROVIDER_UNAVAILABLE';
}

export const generateRecipes = (req: GenerateRequest) => callFunction<GenerateRequest, GenerateResponse>('generateRecipes', req);

// Favourites: users/{uid}/favourites/{recipeId} — a saved copy of a generated recipe.

export type FavouriteRecipe = Recipe & { savedAt: number | null };

export function subscribeFavourites(uid: string, onData: (r: FavouriteRecipe[]) => void, onError: (e: DataError) => void) {
  return onSnapshot(
    query(collection(requireDb(), 'users', uid, 'favourites'), orderBy('savedAt', 'desc')),
    (snap) => onData(snap.docs.map((d) => ({ ...(d.data().recipe as Recipe), id: d.id, savedAt: toMillis(d.data().savedAt) }))),
    (error) => onError(mapFirestoreError(error))
  );
}

export async function saveFavourite(uid: string, recipe: Recipe): Promise<void> {
  try {
    await setDoc(doc(requireDb(), 'users', uid, 'favourites', recipe.id), { recipe, savedAt: serverTimestamp() });
  } catch (error) {
    throw mapFirestoreError(error);
  }
}

export async function removeFavourite(uid: string, recipeId: string): Promise<void> {
  try {
    await deleteDoc(doc(requireDb(), 'users', uid, 'favourites', recipeId));
  } catch (error) {
    throw mapFirestoreError(error);
  }
}
