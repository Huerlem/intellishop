/**
 * Food-safety tests from FOOD_SAFETY_TECHNICAL_SPEC.md §6 that can run without a provider
 * (FT-01…FT-07). FT-08…FT-11 need the server function and UI; FT-12 needs a live provider.
 */
import { ALLERGEN_CODES, ALLERGEN_LABELS, allergenHits, LEXICON } from '@/shared/food/allergens';
import { containsForbiddenClaim, screenRecipe, stripClaims, type SafetyPreferences } from '@/shared/food/recipeSafety';
import type { ModelRecipe } from '@/shared/ai/recipeTypes';

const recipe = (ingredients: string[], steps: string[] = ['Cook everything.'], patch: Partial<ModelRecipe> = {}): ModelRecipe => ({
  title: 'Test dish',
  description: 'A test recipe.',
  servings: 2,
  prepMinutes: 5,
  cookMinutes: 10,
  difficulty: 'easy',
  ingredients: ingredients.map((name) => ({ name, quantity: 1, unit: 'unit', sourceRef: null })),
  steps: steps.map((text, i) => ({ order: i + 1, text })),
  equipment: [],
  reason: 'Test.',
  usesSoonExpiring: [],
  dietaryTags: [],
  ...patch,
});

const prefs = (patch: Partial<SafetyPreferences>): SafetyPreferences => ({ consented: true, allergens: [], diets: [], avoid: [], severity: 'avoid', ...patch });

describe('lexicon', () => {
  it('covers exactly the 14 UK regulated allergens with FSA labels', () => {
    expect(ALLERGEN_CODES).toHaveLength(14);
    for (const code of ALLERGEN_CODES) {
      expect(ALLERGEN_LABELS[code]).toBeTruthy();
      expect(LEXICON[code].contains.length).toBeGreaterThan(0);
    }
  });

  it('applies exceptions before matching', () => {
    expect(allergenHits('Coconut milk').find((h) => h.allergen === 'milk')).toBeUndefined();
    expect(allergenHits('Peanut butter').map((h) => h.allergen)).toEqual(expect.arrayContaining(['peanuts']));
    expect(allergenHits('Peanut butter').find((h) => h.allergen === 'milk')).toBeUndefined();
    expect(allergenHits('Butternut squash')).toEqual([]);
    expect(allergenHits('Nutmeg')).toEqual([]);
    expect(allergenHits('Buckwheat noodles').find((h) => h.allergen === 'gluten' && h.term === 'wheat')).toBeUndefined();
  });
});

describe('FT-01…FT-07', () => {
  it('FT-01: peanut allergy + "peanut butter" → recipe discarded, never displayed', () => {
    const r = screenRecipe(recipe(['Peanut butter', 'Bread']), prefs({ allergens: ['peanuts'] }));
    expect(r).toMatchObject({ decision: 'discard', reason: 'ALLERGEN_CONFLICT' });
  });

  it('FT-02: milk allergy + "ghee" (derivative) → hard conflict', () => {
    expect(screenRecipe(recipe(['Ghee', 'Rice']), prefs({ allergens: ['milk'] }))).toMatchObject({ decision: 'discard', reason: 'ALLERGEN_CONFLICT' });
  });

  it('FT-03: gluten allergy + "soy sauce" → shown with a "check" badge and warning', () => {
    const r = screenRecipe(recipe(['Rice', 'Soy sauce']), prefs({ allergens: ['gluten'] }));
    expect(r.decision).toBe('show');
    if (r.decision !== 'show') return;
    expect(r.ingredientSafety[1]).toEqual({ safety: 'check', reasons: ['May contain gluten'] });
    expect(r.allergenWarnings).toEqual(expect.arrayContaining([expect.stringMatching(/^May contain gluten/)]));
  });

  it('FT-04: title "Allergen-free brownies" → discarded', () => {
    expect(screenRecipe(recipe(['Cocoa'], ['Bake.'], { title: 'Allergen-free brownies' }), prefs({}))).toMatchObject({
      decision: 'discard',
      reason: 'FORBIDDEN_TITLE',
    });
  });

  it('FT-05: model claims "vegan" but uses honey → tag removed (recipe still shown when vegan not selected)', () => {
    const r = screenRecipe(recipe(['Oats', 'Honey'], ['Mix.'], { dietaryTags: ['vegan', 'quick'] }), prefs({}));
    expect(r.decision).toBe('show');
    if (r.decision === 'show') expect(r.recipe.dietaryTags).toEqual(['quick']);
  });

  it('FT-05b: vegan selected + honey → discarded', () => {
    expect(screenRecipe(recipe(['Oats', 'Honey']), prefs({ diets: ['vegan'] }))).toMatchObject({ decision: 'discard', reason: 'DIET_CONFLICT' });
  });

  it('FT-06: method mentions prawns that are missing from the ingredient list → contradiction', () => {
    const r = screenRecipe(recipe(['Rice', 'Peas'], ['Fry the rice.', 'Add the prawns and stir.']), prefs({ allergens: ['crustaceans'] }));
    expect(r).toMatchObject({ decision: 'discard', reason: 'CONTRADICTION' });
  });

  it('FT-06b: cooking verbs in the method do not cause false contradictions ("roll out", "cream the sugar")', () => {
    const r = screenRecipe(recipe(['Gluten-free flour', 'Sugar', 'Vegan butter'], ['Cream the sugar and vegan butter.', 'Roll out the dough.']), prefs({ allergens: ['gluten', 'milk'] }));
    expect(r.decision).toBe('show');
  });

  it('free-from and safety claims are removed from free text', () => {
    const r = screenRecipe(
      recipe(['Rice'], ['Cook the rice. This dish is safe for people with allergies.'], { description: 'Tasty. Totally nut-free!' }),
      prefs({})
    );
    expect(r.decision).toBe('show');
    if (r.decision !== 'show') return;
    expect(r.recipe.description).toBe('Tasty.');
    expect(r.recipe.steps).toEqual([{ order: 1, text: 'Cook the rice.' }]);
    expect(r.removedClaims).toBe(2);
    expect(containsForbiddenClaim('Gluten free bread')).toBe(true);
    expect(stripClaims('No allergens. Guaranteed safe.').text).toBe('No allergens.');
  });

  it('avoid list (free text) discards matching recipes', () => {
    expect(screenRecipe(recipe(['Coriander', 'Rice']), prefs({ avoid: ['coriander'] }))).toMatchObject({ decision: 'discard', reason: 'AVOID_CONFLICT' });
  });

  it('without consent, saved preferences are ignored (informational warnings only)', () => {
    const r = screenRecipe(recipe(['Peanut butter']), prefs({ consented: false, allergens: ['peanuts'] }));
    expect(r.decision).toBe('show');
    if (r.decision === 'show') expect(r.allergenWarnings).toEqual([expect.stringMatching(/^Contains peanuts/)]);
  });

  it('halal and kosher always add a certification check; pork is a conflict', () => {
    expect(screenRecipe(recipe(['Bacon']), prefs({ diets: ['halal'] }))).toMatchObject({ decision: 'discard', reason: 'DIET_CONFLICT' });
    const r = screenRecipe(recipe(['Chicken', 'Rice']), prefs({ diets: ['kosher'] }));
    expect(r.decision).toBe('show');
    if (r.decision === 'show') {
      expect(r.dietCautions[0]).toMatch(/kosher certification/);
      expect(r.ingredientSafety[0].safety).toBe('check');
    }
  });

  it('vegetarian: meat-free alternatives are not conflicts', () => {
    expect(screenRecipe(recipe(['Vegetarian sausages', 'Beans']), prefs({ diets: ['vegetarian'] })).decision).toBe('show');
    expect(screenRecipe(recipe(['Pork sausages']), prefs({ diets: ['vegetarian'] })).decision).toBe('discard');
  });
});

describe('qualifiers and modifiers (no false negatives on mixed dishes)', () => {
  it('product qualifiers cover the rest of the name; words before them still count', () => {
    expect(allergenHits('Gluten-free plain flour').find((h) => h.allergen === 'gluten')).toBeUndefined();
    expect(allergenHits('Vegan cheddar cheese').find((h) => h.allergen === 'milk')).toBeUndefined();
    expect(allergenHits('Butter and vegan cheese').find((h) => h.allergen === 'milk')?.certainty).toBe('contains');
  });

  it('descriptive modifiers only cover the next word', () => {
    const veg = prefs({ diets: ['vegetarian'] });
    expect(screenRecipe(recipe(['Bean burgers']), veg).decision).toBe('show');
    expect(screenRecipe(recipe(['Mushroom and chicken pie']), veg)).toMatchObject({ decision: 'discard', reason: 'DIET_CONFLICT' });
    expect(screenRecipe(recipe(['Beef and bean chilli']), veg)).toMatchObject({ decision: 'discard', reason: 'DIET_CONFLICT' });
    expect(screenRecipe(recipe(['Vegetable stock']), veg).decision).toBe('show');
  });

  it('method text: "vegan butter" is removed but later allergen words still count', () => {
    const milk = prefs({ allergens: ['milk'] });
    expect(screenRecipe(recipe(['Rice'], ['Melt the vegan butter, then stir in the cheese.']), milk)).toMatchObject({ decision: 'discard', reason: 'CONTRADICTION' });
  });
});
