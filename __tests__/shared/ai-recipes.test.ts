import { validateRecipeResult, recipeJsonSchema } from '@/shared/ai/recipeSchema';
import { canonicalInputKey, normaliseIngredients, MAX_INGREDIENTS } from '@/shared/ai/normalise';
import { isReadyToCook, namesMatch, reclassifyIngredient } from '@/shared/ai/reclassify';
import type { ModelRecipe } from '@/shared/ai/recipeTypes';

const NOW = Date.UTC(2026, 9, 28, 12);
const DAY = 86400000;

const baseRecipe = (patch: Partial<ModelRecipe> = {}): ModelRecipe => ({
  title: 'Tomato pasta',
  description: 'A quick weeknight pasta.',
  servings: 2,
  prepMinutes: 5,
  cookMinutes: 15,
  difficulty: 'easy',
  ingredients: [
    { name: 'Pasta', quantity: 200, unit: 'g', sourceRef: 'p1' },
    { name: 'Tomatoes', quantity: 4, unit: 'unit', sourceRef: 'p2' },
  ],
  steps: [
    { order: 1, text: 'Boil the pasta.' },
    { order: 2, text: 'Add the tomatoes.' },
  ],
  equipment: ['Saucepan'],
  reason: 'Uses tomatoes that need eating soon.',
  usesSoonExpiring: ['p2'],
  dietaryTags: ['vegetarian'],
  ...patch,
});

describe('recipe schema (strict structured output)', () => {
  it('accepts a valid result', () => {
    const r = validateRecipeResult({ recipes: [baseRecipe()] });
    expect(r.ok).toBe(true);
  });

  it('FT-07: rejects price, availability and other invented fields anywhere', () => {
    const withPrice = { recipes: [{ ...baseRecipe(), estimatedCost: 3.5 }] };
    const r1 = validateRecipeResult(withPrice);
    expect(r1.ok).toBe(false);
    if (!r1.ok) expect(r1.issues).toContainEqual({ path: '$.recipes[0].estimatedCost', message: 'unexpected field' });

    const withStock = { recipes: [baseRecipe({ ingredients: [{ name: 'Milk', quantity: 1, unit: 'l', sourceRef: null, inStock: true } as never] })] };
    expect(validateRecipeResult(withStock).ok).toBe(false);
  });

  it('FT-07: rejects nutrition unless nutrition estimates are enabled (FS-D1)', () => {
    const withNutrition = { recipes: [{ ...baseRecipe(), nutritionEstimate: { perServing: { kcal: 500, proteinG: 20, carbsG: 60, fatG: 10 }, isEstimate: true } }] };
    expect(validateRecipeResult(withNutrition).ok).toBe(false);
    expect(validateRecipeResult(withNutrition, { allowNutrition: true }).ok).toBe(true);
    const notEstimate = { recipes: [{ ...baseRecipe(), nutritionEstimate: { perServing: { kcal: 500, proteinG: 20, carbsG: 60, fatG: 10 }, isEstimate: false } }] };
    expect(validateRecipeResult(notEstimate, { allowNutrition: true }).ok).toBe(false);
  });

  it('enforces ranges, lengths, step order and reference format', () => {
    const bad = validateRecipeResult({
      recipes: [
        baseRecipe({
          servings: 0,
          title: 'x'.repeat(81),
          steps: [{ order: 2, text: 'Out of order' }],
          ingredients: [{ name: 'Milk', quantity: -1, unit: 'l', sourceRef: 'zz9' }],
        }),
      ],
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      const paths = bad.issues.map((i) => i.path);
      expect(paths).toEqual(expect.arrayContaining(['$.recipes[0].servings', '$.recipes[0].title', '$.recipes[0].steps[0].order', '$.recipes[0].ingredients[0].quantity', '$.recipes[0].ingredients[0].sourceRef']));
    }
    expect(validateRecipeResult({ recipes: [] }).ok).toBe(false);
    expect(validateRecipeResult('not json').ok).toBe(false);
  });

  it('provider JSON schema forbids additional properties and omits nutrition unless enabled', () => {
    const schema = recipeJsonSchema(false) as { additionalProperties: boolean; properties: { recipes: { items: { properties: Record<string, unknown> } } } };
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.recipes.items.properties).not.toHaveProperty('nutritionEstimate');
    expect((recipeJsonSchema(true) as typeof schema).properties.recipes.items.properties).toHaveProperty('nutritionEstimate');
  });
});

describe('input normalisation (modes, merge, bounds, expiry)', () => {
  const pantry = [
    { id: 'a', name: 'Tomatoes', quantity: 4, unit: 'unit', expiryDate: NOW + 2 * DAY, expiryKind: 'best_before' as const },
    { id: 'b', name: 'Milk', quantity: 1, unit: 'l', expiryDate: NOW - 2 * DAY, expiryKind: 'use_by' as const },
    { id: 'c', name: 'Pasta', quantity: 500, unit: 'g' },
    { id: 'd', name: 'Kitchen roll', quantity: 2, unit: 'pack' },
  ];
  const list = [
    { id: 'x', name: 'tomato', quantity: 2, unit: 'unit' },
    { id: 'y', name: 'Basil', quantity: 1, unit: 'pack' },
  ];

  it('pantry mode excludes expired "use by" items and non-food items', () => {
    const r = normaliseIngredients('pantry', pantry, list, NOW);
    if (!r.ok) throw new Error();
    expect(r.inputs.map((i) => i.name)).toEqual(['Tomatoes', 'Pasta']);
    expect(r.excludedExpired).toEqual(['Milk']);
    expect(r.inputs[0]).toMatchObject({ ref: 'p1', source: 'pantry', expiresInDays: 2 });
  });

  it('list mode uses only the list', () => {
    const r = normaliseIngredients('list', pantry, list, NOW);
    if (!r.ok) throw new Error();
    expect(r.inputs.map((i) => `${i.ref}:${i.name}`)).toEqual(['l1:Basil', 'l2:tomato']);
  });

  it('both mode merges the same ingredient from pantry and list', () => {
    const r = normaliseIngredients('both', pantry, list, NOW);
    if (!r.ok) throw new Error();
    const tomato = r.inputs.find((i) => i.normalizedName === 'tomato')!;
    expect(tomato).toMatchObject({ source: 'merged', ref: 'm1', pantryQuantity: { amount: 4, unit: 'unit' }, listQuantity: { amount: 2, unit: 'unit' } });
  });

  it('NO_INGREDIENTS when nothing usable (checked before any credit is reserved)', () => {
    expect(normaliseIngredients('pantry', [], list, NOW)).toEqual({ ok: false, code: 'NO_INGREDIENTS' });
    expect(normaliseIngredients('list', pantry, [], NOW)).toEqual({ ok: false, code: 'NO_INGREDIENTS' });
  });

  it('bounds the prompt and keeps soon-expiring items', () => {
    const many = Array.from({ length: 150 }, (_, i) => ({ id: `i${i}`, name: `Item ${String(i).padStart(3, '0')} food`, quantity: 1, unit: 'unit' }));
    many.push({ id: 'soon', name: 'Spinach', quantity: 1, unit: 'bag', expiryDate: NOW + DAY, expiryKind: 'use_by' } as never);
    const r = normaliseIngredients('pantry', many, [], NOW);
    if (!r.ok) throw new Error();
    expect(r.inputs).toHaveLength(MAX_INGREDIENTS);
    expect(r.omittedCount).toBe(31);
    expect(r.inputs[0].name).toBe('Spinach');
  });

  it('cache key is stable regardless of input order and changes with constraints', () => {
    const r1 = normaliseIngredients('both', pantry, list, NOW);
    const r2 = normaliseIngredients('both', [...pantry].reverse(), [...list].reverse(), NOW);
    if (!r1.ok || !r2.ok) throw new Error();
    const c = { allergens: ['milk'], diets: [], avoid: [], servings: 2 };
    expect(canonicalInputKey('both', r1.inputs, c)).toBe(canonicalInputKey('both', r2.inputs, c));
    expect(canonicalInputKey('both', r1.inputs, c)).not.toBe(canonicalInputKey('both', r1.inputs, { ...c, allergens: ['eggs'] }));
  });
});

describe('reclassification against real data (model claims never trusted)', () => {
  const r = normaliseIngredients(
    'both',
    [
      { id: 'a', name: 'Pasta', quantity: 100, unit: 'g' },
      { id: 'b', name: 'Onions', quantity: 2, unit: 'unit' },
    ],
    [
      { id: 'x', name: 'Pasta', quantity: 500, unit: 'g' },
      { id: 'y', name: 'Parmesan', quantity: 1, unit: 'pack' },
    ],
    NOW
  );
  if (!r.ok) throw new Error();
  const inputs = r.inputs;

  it('available, fromList, partial with shortfall, and missing', () => {
    expect(reclassifyIngredient({ name: 'Onion', quantity: 1, unit: 'unit', sourceRef: 'p1' }, inputs).status).toBe('available');
    expect(reclassifyIngredient({ name: 'Parmesan', quantity: 30, unit: 'g', sourceRef: null }, inputs).status).toBe('fromList');
    // 300 g needed: pantry has 100 g; the list's 500 g covers the 200 g shortfall.
    expect(reclassifyIngredient({ name: 'Pasta', quantity: 300, unit: 'g', sourceRef: 'm1' }, inputs).status).toBe('fromList');
    const garlic = reclassifyIngredient({ name: 'Garlic', quantity: 2, unit: 'clove', sourceRef: 'p1' }, inputs);
    expect(garlic).toMatchObject({ status: 'missing', sourceRef: null }); // wrong ref is rejected
  });

  it('partial when pantry and list together do not cover the need', () => {
    const only = normaliseIngredients('pantry', [{ id: 'a', name: 'Rice', quantity: 100, unit: 'g' }], [], NOW);
    if (!only.ok) throw new Error();
    expect(reclassifyIngredient({ name: 'Rice', quantity: 0.25, unit: 'kg', sourceRef: 'p1' }, only.inputs)).toMatchObject({
      status: 'partial',
      shortfall: { amount: 0.15, unit: 'kg' },
    });
  });

  it('name matching avoids short-substring false positives', () => {
    expect(namesMatch('chicken breast', 'chicken')).toBe(true);
    expect(namesMatch('egg', 'eggplant')).toBe(false);
    expect(namesMatch('oil', 'olive oil')).toBe(false); // too short to match by containment
    expect(isReadyToCook([{ status: 'available' }, { status: 'fromList' }])).toBe(false);
  });
});
