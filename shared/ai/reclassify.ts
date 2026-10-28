/**
 * Server-side reclassification of model ingredients against the user's real data
 * (AI_ARCHITECTURE.md §8 step 2). The model's claims about availability are never trusted.
 */
import { normaliseItemName } from '../domain/items';
import { coverage, normaliseUnit } from '../domain/units';
import type { IngredientInput, IngredientStatus, ModelIngredient } from './recipeTypes';

export type ClassifiedIngredient = ModelIngredient & {
  status: IngredientStatus;
  shortfall?: { amount: number; unit: import('../domain/units').CanonicalUnit };
};

/** Staples the model may assume; shown as missing unless the user has them, then confirmable. */
export const ASSUMED_STAPLES = new Set(['salt', 'pepper', 'black pepper', 'water', 'oil', 'olive oil', 'vegetable oil']);

export function reclassifyIngredient(ing: ModelIngredient, inputs: IngredientInput[]): ClassifiedIngredient {
  const byRef = ing.sourceRef ? inputs.find((i) => i.ref === ing.sourceRef) : undefined;
  // A reference is accepted only if it points to an input with a matching name; otherwise the
  // model may have mislabelled it, so fall back to name matching.
  const nameKey = normaliseItemName(ing.name);
  const input =
    byRef && namesMatch(byRef.normalizedName, nameKey)
      ? byRef
      : inputs.find((i) => namesMatch(i.normalizedName, nameKey));

  if (!input) return { ...ing, sourceRef: null, status: 'missing' };

  const unit = normaliseUnit(ing.unit);
  const need = ing.quantity !== null && unit ? { amount: ing.quantity, unit } : null;

  const fromPantry = input.pantryQuantity;
  const fromList = input.listQuantity;

  if (input.source === 'list') return { ...ing, sourceRef: input.ref, status: 'fromList' };

  // Pantry or merged: compare quantities when both sides are known and comparable.
  if (!need || !fromPantry) return { ...ing, sourceRef: input.ref, status: 'available' };
  const c = coverage(fromPantry, need);
  if (c.kind === 'enough' || c.kind === 'incomparable') return { ...ing, sourceRef: input.ref, status: 'available' };
  // Partly covered by the pantry; the list may cover the rest.
  if (fromList) {
    const listCovers = coverage(fromList, c.missing);
    if (listCovers.kind === 'enough') return { ...ing, sourceRef: input.ref, status: 'fromList' };
  }
  return { ...ing, sourceRef: input.ref, status: 'partial', shortfall: c.missing };
}

/** True when two normalised names refer to the same ingredient (exact, or one contains the other as whole words). */
export function namesMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const wa = ` ${a} `;
  const wb = ` ${b} `;
  // "chicken breast" ↔ "chicken" — allow containment only when the shorter name has ≥ 4 letters
  // to avoid "egg" matching "eggplant"-style false positives via substrings.
  const [short, long] = a.length <= b.length ? [wa, wb] : [wb, wa];
  return short.trim().length >= 4 && long.includes(short);
}

export function isReadyToCook(ingredients: { status: IngredientStatus }[]): boolean {
  return ingredients.every((i) => i.status === 'available');
}
