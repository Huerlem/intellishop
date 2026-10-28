/**
 * Server recipe generation with a PROVIDER MOCK (automated tests only). These tests prove the
 * control flow, credit accounting, validation and safety screens. They do NOT prove that real
 * AI generation works: that requires a configured provider (owner checkpoint) and FT-12.
 */
import { generateRecipes, type RecipeConfig, type RecipeDeps } from '@/functions/src/handlers/generateRecipes';
import { ProviderError, type AiProvider, type CallerContext, type ProviderRequest } from '@/functions/src/ports';
import { captureLogger, createMemoryServerStore } from '../../test-utils/memoryServerStore';

const NOW = Date.UTC(2026, 9, 28, 12);
const DAY = 86400000;

const config: RecipeConfig = {
  allowNutrition: false,
  paused: false,
  monthlyBudgetUsd: 20,
  costPerMTokUsd: { input: 1, output: 5 },
  cacheTtlMs: 30 * 60 * 1000,
  timeoutMs: 1000,
  maxOutputTokens: 4000,
  recipeCount: 3,
};

const user: CallerContext = { uid: 'u1', emailVerified: true, authTime: 0 };

const recipe = (title: string, ingredients: [string, number | null, string, string | null][], steps = ['Cook it.']) => ({
  title,
  description: 'Nice.',
  servings: 2,
  prepMinutes: 5,
  cookMinutes: 10,
  difficulty: 'easy',
  ingredients: ingredients.map(([name, quantity, unit, sourceRef]) => ({ name, quantity, unit, sourceRef })),
  steps: steps.map((text, i) => ({ order: i + 1, text })),
  equipment: [],
  reason: 'Uses your spinach before it goes off.',
  usesSoonExpiring: ['p2'],
  dietaryTags: [],
});

function provider(json: unknown | (() => unknown)): AiProvider & { calls: ProviderRequest[] } {
  const calls: ProviderRequest[] = [];
  return {
    name: 'mock',
    calls,
    async generate(req) {
      calls.push(req);
      const value = typeof json === 'function' ? (json as () => unknown)() : json;
      return { json: value, model: 'mock-model', stopReason: 'tool_use', usage: { inputTokens: 1000, outputTokens: 2000 } };
    },
  };
}

function setup(seed: Record<string, Record<string, unknown>> = {}, p: AiProvider = provider({ recipes: [recipe('Spinach pasta', [['Pasta', 200, 'g', 'p1'], ['Spinach', 1, 'bag', 'p2'], ['Garlic', 2, 'unit', null]])] })) {
  const store = createMemoryServerStore({
    'users/u1/consents/ai': { granted: true, version: '1.0.0' },
    'users/u1/pantry/a': { name: 'Pasta', quantity: 500, unit: 'g' },
    'users/u1/pantry/b': { name: 'Spinach', quantity: 1, unit: 'bag', expiryDate: NOW + DAY, expiryKind: 'use_by' },
    'users/u1/lists/l1': { name: 'Weekly' },
    'users/u1/lists/l1/items/x': { name: 'Parmesan', quantity: 1, unit: 'pack' },
    ...seed,
  });
  let id = 0;
  const logger = captureLogger();
  const deps: RecipeDeps = { store, provider: p, clock: { now: () => NOW }, ids: { next: () => `id${++id}` }, hash: fnv1a, logger, config };
  return { store, deps, logger, provider: p as AiProvider & { calls?: ProviderRequest[] } };
}

/** Test hash (FNV-1a, 32-bit): stable, distinct per input, reveals nothing readable. */
function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

const usage = async (store: ReturnType<typeof createMemoryServerStore>) => (await store.get('usage/u1')) as Record<string, unknown> | null;

describe('generateRecipes — success path', () => {
  it('Scenario: pantry mode returns reclassified recipes and consumes exactly one introductory credit', async () => {
    const { deps, store, provider: p } = setup();
    const res = await generateRecipes(user, { mode: 'pantry', servings: 2, useDietaryPreferences: false }, deps);
    expect(res.cached).toBe(false);
    expect(res.recipes).toHaveLength(1);
    const r = res.recipes[0];
    expect(r.ingredients.map((i) => `${i.name}:${i.status}`)).toEqual(['Pasta:available', 'Spinach:available', 'Garlic:missing']);
    expect(r.readyToCook).toBe(false);
    expect(r).toMatchObject({ id: 'id2', mode: 'pantry', model: 'mock-model' });
    expect(res.usage.introRemaining).toBe(2);
    expect(await usage(store)).toMatchObject({ introCreditsConsumed: 1, inFlight: null });
    // The prompt lists soon-expiring items first, with refs; never the user's identity.
    // (The mock mislabels refs — p1 is Spinach — and reclassification still matches by name.)
    const prompt = (p as unknown as { calls: ProviderRequest[] }).calls[0].user;
    expect(prompt).toContain('p1: Spinach — 1 bag (expiring in 1 day)');
    expect(prompt).toContain('p2: Pasta — 500 g');
    expect(prompt).not.toContain('u1');
  });

  it('identical request within the cache window returns the same result without using a credit', async () => {
    const { deps, store } = setup();
    const first = await generateRecipes(user, { mode: 'pantry', servings: 2, useDietaryPreferences: false }, deps);
    const second = await generateRecipes(user, { mode: 'pantry', servings: 2, useDietaryPreferences: false }, deps);
    expect(second.cached).toBe(true);
    expect(second.recipes).toEqual(first.recipes);
    expect(await usage(store)).toMatchObject({ introCreditsConsumed: 1 });
  });

  it('both mode merges pantry and list; list ingredients are classified fromList', async () => {
    const p = provider({ recipes: [recipe('Pasta with parmesan', [['Pasta', 100, 'g', 'p1'], ['Parmesan', 30, 'g', 'l1']])] });
    const { deps } = setup({}, p);
    const res = await generateRecipes(user, { mode: 'both', listId: 'l1', servings: 2, useDietaryPreferences: false }, deps);
    expect(res.recipes[0].ingredients.map((i) => i.status)).toEqual(['available', 'fromList']);
  });
});

describe('generateRecipes — nothing is charged on failure', () => {
  it('requires AI consent before anything is sent (Apple 5.1.2(i))', async () => {
    const p = provider({ recipes: [] });
    const { deps } = setup({ 'users/u1/consents/ai': { granted: false } }, p);
    await expect(generateRecipes(user, { mode: 'pantry', servings: 2, useDietaryPreferences: false }, deps)).rejects.toMatchObject({ reason: 'AI_CONSENT_REQUIRED' });
    expect((p as unknown as { calls: unknown[] }).calls).toHaveLength(0);
  });

  it('NO_INGREDIENTS is checked before any reservation', async () => {
    const { deps, store } = setup({ 'users/u1/lists/empty': { name: 'Empty' } });
    await expect(generateRecipes(user, { mode: 'list', listId: 'empty', servings: 2, useDietaryPreferences: false }, deps)).rejects.toMatchObject({ reason: 'NO_INGREDIENTS' });
    expect(await usage(store)).toBeNull();
  });

  it('provider timeout → PROVIDER_UNAVAILABLE, credit and reservation released', async () => {
    const failing: AiProvider = { name: 'mock', generate: async () => Promise.reject(new ProviderError('timeout', 't')) };
    const { deps, store } = setup({}, failing);
    await expect(generateRecipes(user, { mode: 'pantry', servings: 2, useDietaryPreferences: false }, deps)).rejects.toMatchObject({ reason: 'PROVIDER_UNAVAILABLE', code: 'deadline-exceeded' });
    expect(await usage(store)).toMatchObject({ introCreditsConsumed: 0, inFlight: null });
  });

  it('invalid output (an invented price field) → INVALID_OUTPUT; never shown, nothing charged', async () => {
    const p = provider({ recipes: [{ ...recipe('X', [['Pasta', 1, 'g', 'p1']]), estimatedCost: 2.5 }] });
    const { deps, store } = setup({}, p);
    await expect(generateRecipes(user, { mode: 'pantry', servings: 2, useDietaryPreferences: false }, deps)).rejects.toMatchObject({ reason: 'INVALID_OUTPUT' });
    expect(await usage(store)).toMatchObject({ introCreditsConsumed: 0 });
    expect((await store.list('users/u1/aiCache')).length).toBe(0);
  });

  it('all recipes conflict with a consented allergy → ALL_DISCARDED; nothing charged', async () => {
    const p = provider({ recipes: [recipe('Peanut noodles', [['Peanut butter', 2, 'tbsp', null], ['Spinach', 1, 'bag', 'p2']])] });
    const { deps, store } = setup({ 'users/u1/private/preferences': { consent: { granted: true }, allergens: ['peanuts'], diets: [], otherAvoid: [], severity: 'severe' } }, p);
    await expect(generateRecipes(user, { mode: 'pantry', servings: 2, useDietaryPreferences: true }, deps)).rejects.toMatchObject({ reason: 'ALL_DISCARDED' });
    expect(await usage(store)).toMatchObject({ introCreditsConsumed: 0 });
  });

  it('partially unsafe output: unsafe recipe removed, safe one shown and counted', async () => {
    const p = provider({
      recipes: [recipe('Peanut noodles', [['Peanut butter', 2, 'tbsp', null]]), recipe('Spinach omelette', [['Spinach', 1, 'bag', 'p2'], ['Eggs', 2, 'unit', null]])],
    });
    const { deps } = setup({ 'users/u1/private/preferences': { consent: { granted: true }, allergens: ['peanuts'], diets: [], otherAvoid: [], severity: 'avoid' } }, p);
    const res = await generateRecipes(user, { mode: 'pantry', servings: 2, useDietaryPreferences: true }, deps);
    expect(res.recipes.map((r) => r.title)).toEqual(['Spinach omelette']);
    expect(res.discardedCount).toBe(1);
    expect(res.preferencesApplied).toBe(true);
    expect(res.recipes[0].allergenWarnings).toEqual(expect.arrayContaining([expect.stringMatching(/^Contains eggs/)]));
  });

  it('FT-08: preferences without consent are not applied and the response says so (UI-3)', async () => {
    const { deps } = setup({ 'users/u1/private/preferences': { consent: { granted: false }, allergens: ['peanuts'] } });
    const res = await generateRecipes(user, { mode: 'pantry', servings: 2, useDietaryPreferences: true }, deps);
    expect(res.preferencesApplied).toBe(false);
  });
});

describe('generateRecipes — credits, quotas and cost controls', () => {
  it('Free: three successful generations, then TRIAL_EXHAUSTED', async () => {
    let n = 0;
    const p = provider(() => ({ recipes: [recipe(`Dish ${++n}`, [['Pasta', 100 + n, 'g', 'p1']])] }));
    const { deps, store } = setup({}, p);
    for (let i = 0; i < 3; i += 1) {
      // Change servings so each request is new (not served from cache).
      await generateRecipes(user, { mode: 'pantry', servings: i + 1, useDietaryPreferences: false }, deps);
    }
    expect(await usage(store)).toMatchObject({ introCreditsConsumed: 3 });
    await expect(generateRecipes(user, { mode: 'pantry', servings: 9, useDietaryPreferences: false }, deps)).rejects.toMatchObject({ reason: 'TRIAL_EXHAUSTED' });
  });

  it('introductory credits need a verified email', async () => {
    const { deps } = setup();
    await expect(generateRecipes({ ...user, emailVerified: false }, { mode: 'pantry', servings: 2, useDietaryPreferences: false }, deps)).rejects.toMatchObject({ reason: 'EMAIL_NOT_VERIFIED' });
  });

  it('Premium uses its quota, not introductory credits', async () => {
    const { deps, store } = setup({ 'entitlements/u1': { plan: 'premium' } });
    await generateRecipes(user, { mode: 'pantry', servings: 2, useDietaryPreferences: false }, deps);
    expect(await usage(store)).toMatchObject({ introCreditsConsumed: 0, premiumMonthCount: 1 });
  });

  it('global pause and monthly spend cap stop requests before the provider is called', async () => {
    const p = provider({ recipes: [] });
    const paused = setup({}, p);
    await expect(generateRecipes(user, { mode: 'pantry', servings: 2, useDietaryPreferences: false }, { ...paused.deps, config: { ...config, paused: true } })).rejects.toMatchObject({ reason: 'SERVICE_PAUSED' });
    const capped = setup({ 'aiSpend/2026-10': { usd: 25 } }, p);
    await expect(generateRecipes(user, { mode: 'pantry', servings: 2, useDietaryPreferences: false }, capped.deps)).rejects.toMatchObject({ reason: 'SERVICE_PAUSED' });
    expect((p as unknown as { calls: unknown[] }).calls).toHaveLength(0);
  });

  it('records estimated spend and logs no ingredient names, allergies or recipe text', async () => {
    const { deps, store, logger } = setup({ 'users/u1/private/preferences': { consent: { granted: true }, allergens: ['peanuts'], diets: [], otherAvoid: ['coriander'], severity: 'avoid' } });
    await generateRecipes(user, { mode: 'pantry', servings: 2, useDietaryPreferences: true }, deps);
    const spend = (await store.get('aiSpend/2026-10')) as { calls: number; usd: number };
    expect(spend.calls).toBe(1);
    expect(spend.usd).toBeCloseTo(0.011, 9);
    const logged = JSON.stringify(logger.entries);
    for (const secret of ['Pasta', 'Spinach', 'peanut', 'coriander', 'Spinach pasta', 'u1']) expect(logged).not.toContain(secret);
  });

  it('rejects malformed requests', async () => {
    const { deps } = setup();
    await expect(generateRecipes(user, { mode: 'everything', servings: 2 }, deps)).rejects.toMatchObject({ reason: 'INVALID_INPUT' });
    await expect(generateRecipes(user, { mode: 'list', servings: 2 }, deps)).rejects.toMatchObject({ reason: 'INVALID_INPUT' });
    await expect(generateRecipes(user, { mode: 'pantry', servings: 50 }, deps)).rejects.toMatchObject({ reason: 'INVALID_INPUT' });
    await expect(generateRecipes(user, { mode: 'list', listId: 'missing', servings: 2 }, deps)).rejects.toMatchObject({ reason: 'LIST_NOT_FOUND' });
  });
});
