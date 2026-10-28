/**
 * Prompt construction for recipe generation. Versioned so cached results and logs can be traced
 * to the instructions that produced them. Contains no user identity.
 */
import type { IngredientInput, RecipeMode } from '../../../shared/ai/recipeTypes';
import { ALLERGEN_LABELS, DIET_LABELS, type AllergenCode, type DietCode } from '../../../shared/food/allergens';

export const PROMPT_VERSION = 'recipes-2026-10-28.1';

export const SYSTEM_PROMPT = [
  'You suggest home-cooking recipes for a UK shopping and pantry app.',
  'Use British English and metric units.',
  'Work only from the ingredient list provided. Each ingredient has a reference like p1 (pantry), l1 (shopping list) or m1 (both).',
  'For every recipe ingredient, set sourceRef to the matching reference, or null if it is not in the list (it will be shown as missing).',
  'Prefer recipes that use ingredients marked as expiring soon, and say so in "reason".',
  'Never state prices, costs, savings, shop availability, stock levels or where to buy anything.',
  'Never give cooking temperatures, safe internal temperatures, or storage times; say "cook until steaming hot throughout" where relevant.',
  'Never claim a recipe is allergen-free, safe for anyone, or suitable for people with allergies or medical conditions.',
  'If constraints are given (ingredients or food groups to avoid), do not use those ingredients or anything containing them, including in sauces, stocks and garnishes.',
  'Keep steps short, numbered in order, and make sure every ingredient used in the steps appears in the ingredient list.',
  'Return only the requested JSON structure.',
].join('\n');

export function buildUserPrompt(input: {
  mode: RecipeMode;
  ingredients: IngredientInput[];
  servings: number;
  allergens: AllergenCode[];
  diets: DietCode[];
  avoid: string[];
  recipeCount: number;
}): string {
  const lines = input.ingredients.map((i) => {
    const qty = i.quantity !== null && i.unit ? ` — ${i.quantity} ${i.unit}` : '';
    const exp = i.expiresInDays !== null && i.expiresInDays <= 3 ? ` (expiring in ${Math.max(0, i.expiresInDays)} day${i.expiresInDays === 1 ? '' : 's'})` : '';
    return `${i.ref}: ${i.name}${qty}${exp}`;
  });
  const constraints: string[] = [];
  if (input.allergens.length) constraints.push(`Avoid these allergens completely: ${input.allergens.map((a) => ALLERGEN_LABELS[a]).join('; ')}.`);
  if (input.diets.length) constraints.push(`Dietary requirements: ${input.diets.map((d) => DIET_LABELS[d]).join(', ')}.`);
  if (input.avoid.length) constraints.push(`Do not use: ${input.avoid.join(', ')}.`);
  const source = input.mode === 'pantry' ? 'what is in the pantry' : input.mode === 'list' ? 'the shopping list' : 'the pantry and the shopping list together';
  return [
    `Suggest ${input.recipeCount} recipes for ${input.servings} serving${input.servings === 1 ? '' : 's'} using ${source}.`,
    'Ingredients:',
    ...lines,
    ...(constraints.length ? ['Constraints:', ...constraints] : ['Constraints: none provided by the user.']),
  ].join('\n');
}
