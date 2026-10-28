/**
 * Deterministic input normalisation before any model call (AI_ARCHITECTURE.md §5).
 *
 * Builds the bounded ingredient list from the user's real pantry and/or list. Runs before
 * credit reservation, so an empty input never costs a credit (NO_INGREDIENTS).
 */
import { cleanDisplayName, normaliseItemName } from '../domain/items';
import { addQuantities, normaliseUnit, type CanonicalUnit } from '../domain/units';
import type { IngredientInput, RecipeMode } from './recipeTypes';

export const MAX_INGREDIENTS = 120;
export const MAX_INGREDIENT_NAME = 60;
const DAY = 24 * 60 * 60 * 1000;

export type PantryRecord = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate?: number | null; // epoch ms
  expiryKind?: 'use_by' | 'best_before' | null;
};

export type ListItemRecord = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  checked?: boolean;
};

export type NormaliseResult =
  | { ok: true; inputs: IngredientInput[]; omittedCount: number; excludedExpired: string[] }
  | { ok: false; code: 'NO_INGREDIENTS' };

const NON_FOOD = /\b(bin bag|kitchen roll|toilet|washing|detergent|shampoo|toothpaste|soap|bleach|nappies|foil|cling film|batteries|light bulb|tissues|sponge)\b/i;

function quantityOf(amount: number, unit: string): { amount: number; unit: CanonicalUnit } | null {
  const u = normaliseUnit(unit);
  if (!u || !Number.isFinite(amount) || amount <= 0) return null;
  return { amount, unit: u };
}

export function normaliseIngredients(
  mode: RecipeMode,
  pantry: PantryRecord[],
  listItems: ListItemRecord[],
  now: number
): NormaliseResult {
  const excludedExpired: string[] = [];
  type Acc = {
    name: string;
    normalizedName: string;
    pantry: { amount: number; unit: CanonicalUnit } | null;
    list: { amount: number; unit: CanonicalUnit } | null;
    inPantry: boolean;
    inList: boolean;
    expiresInDays: number | null;
  };
  const byName = new Map<string, Acc>();

  const take = (rawName: string) => {
    const name = cleanDisplayName(rawName).slice(0, MAX_INGREDIENT_NAME);
    const key = normaliseItemName(name);
    if (!key || NON_FOOD.test(name)) return null;
    let acc = byName.get(key);
    if (!acc) {
      acc = { name, normalizedName: key, pantry: null, list: null, inPantry: false, inList: false, expiresInDays: null };
      byName.set(key, acc);
    }
    return acc;
  };

  if (mode === 'pantry' || mode === 'both') {
    for (const p of pantry) {
      // "Use by" dates are about safety: expired items are excluded by default (UI-8).
      if (p.expiryKind === 'use_by' && p.expiryDate != null && p.expiryDate < startOfDay(now)) {
        excludedExpired.push(cleanDisplayName(p.name));
        continue;
      }
      const acc = take(p.name);
      if (!acc) continue;
      acc.inPantry = true;
      const q = quantityOf(p.quantity, p.unit);
      if (q) acc.pantry = acc.pantry ? (addQuantities(acc.pantry, q) ?? acc.pantry) : q;
      if (p.expiryDate != null) {
        const days = Math.floor((p.expiryDate - startOfDay(now)) / DAY);
        acc.expiresInDays = acc.expiresInDays === null ? days : Math.min(acc.expiresInDays, days);
      }
    }
  }
  if (mode === 'list' || mode === 'both') {
    for (const item of listItems) {
      const acc = take(item.name);
      if (!acc) continue;
      acc.inList = true;
      const q = quantityOf(item.quantity, item.unit);
      if (q) acc.list = acc.list ? (addQuantities(acc.list, q) ?? acc.list) : q;
    }
  }

  const all = [...byName.values()];
  if (all.length === 0) return { ok: false, code: 'NO_INGREDIENTS' };

  // Soon-expiring first (so they survive the bound), then alphabetical for stable prompts.
  all.sort((a, b) => {
    const ea = a.expiresInDays ?? Infinity;
    const eb = b.expiresInDays ?? Infinity;
    return ea !== eb ? ea - eb : a.normalizedName.localeCompare(b.normalizedName);
  });
  const kept = all.slice(0, MAX_INGREDIENTS);
  let p = 0;
  let l = 0;
  let m = 0;
  const inputs: IngredientInput[] = kept.map((acc) => {
    const source: IngredientInput['source'] = acc.inPantry && acc.inList ? 'merged' : acc.inPantry ? 'pantry' : 'list';
    const ref = source === 'merged' ? `m${++m}` : source === 'pantry' ? `p${++p}` : `l${++l}`;
    const primary = acc.pantry ?? acc.list;
    return {
      ref,
      name: acc.name,
      normalizedName: acc.normalizedName,
      quantity: primary?.amount ?? null,
      unit: primary?.unit ?? null,
      source,
      pantryQuantity: acc.pantry,
      listQuantity: acc.list,
      expiresInDays: acc.expiresInDays,
    };
  });
  return { ok: true, inputs, omittedCount: all.length - kept.length, excludedExpired };
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

/** Canonical string for cache keys and idempotency (sorted, no volatile fields). */
export function canonicalInputKey(mode: RecipeMode, inputs: IngredientInput[], constraints: { allergens: string[]; diets: string[]; avoid: string[]; servings: number }): string {
  const ing = inputs
    .map((i) => `${i.normalizedName}|${i.source}|${i.pantryQuantity ? `${i.pantryQuantity.amount}${i.pantryQuantity.unit}` : ''}|${i.listQuantity ? `${i.listQuantity.amount}${i.listQuantity.unit}` : ''}|${i.expiresInDays ?? ''}`)
    .sort()
    .join(';');
  const c = `${[...constraints.allergens].sort().join(',')}#${[...constraints.diets].sort().join(',')}#${[...constraints.avoid].map(normaliseItemName).sort().join(',')}#${constraints.servings}`;
  return `v1:${mode}:${ing}:${c}`;
}
