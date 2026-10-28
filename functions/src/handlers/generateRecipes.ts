/**
 * Server-side AI recipe generation (AI_ARCHITECTURE.md; FOOD_SAFETY_TECHNICAL_SPEC.md §3).
 *
 * Order of checks — nothing costs a credit until the provider returns a SAFE, VALID result:
 *  1. input validation  2. AI consent  3. load real pantry/list  4. normalise (NO_INGREDIENTS)
 *  5. global pause / spend cap  6. cache  7. reserve credit/quota (transaction)
 *  8. provider call with timeout  9. schema validation  10. safety screen per recipe
 *  11. reclassification against real data  12. commit (transaction) or release on any failure.
 * There is no fallback content anywhere: every failure is returned as a typed error.
 * Logs contain a hashed UID, counts, tokens and outcome codes — never ingredients, allergies
 * or recipe text.
 */
import { canonicalInputKey, normaliseIngredients, type ListItemRecord, type PantryRecord } from '../../../shared/ai/normalise';
import { isReadyToCook, reclassifyIngredient } from '../../../shared/ai/reclassify';
import { recipeJsonSchema, validateRecipeResult } from '../../../shared/ai/recipeSchema';
import type { Recipe, RecipeMode } from '../../../shared/ai/recipeTypes';
import { commitGeneration, newUsageDoc, releaseGeneration, reserveGeneration, usageSummary, type UsageDoc } from '../../../shared/ai/usage';
import { DEFAULT_ENTITLEMENT, type PlanId } from '../../../shared/entitlements/plans';
import { ALLERGEN_CODES, DIET_CODES, LEXICON_VERSION, type AllergenCode, type DietCode } from '../../../shared/food/allergens';
import { NO_PREFERENCES, screenRecipe, type SafetyPreferences } from '../../../shared/food/recipeSafety';
import { HandlerError, ProviderError, type AiProvider, type CallerContext, type Clock, type Doc, type Hasher, type Ids, type Logger, type Store } from '../ports';
import { buildUserPrompt, PROMPT_VERSION, SYSTEM_PROMPT } from './prompt';

export type RecipeConfig = {
  allowNutrition: boolean; // decision FS-D1 (default false)
  paused: boolean; // global kill switch
  monthlyBudgetUsd: number; // spend cap across all users
  costPerMTokUsd: { input: number; output: number };
  cacheTtlMs: number;
  timeoutMs: number;
  maxOutputTokens: number;
  recipeCount: number;
};

export type RecipeDeps = { store: Store; provider: AiProvider; clock: Clock; ids: Ids; hash: Hasher; logger: Logger; config: RecipeConfig };

type Input = { mode: RecipeMode; listId?: string; servings: number; useDietaryPreferences: boolean };

function parseInput(raw: unknown): Input {
  const i = (raw ?? {}) as Record<string, unknown>;
  const mode = i.mode;
  if (mode !== 'pantry' && mode !== 'list' && mode !== 'both') throw new HandlerError('invalid-argument', 'INVALID_INPUT', 'mode must be pantry, list or both.');
  if ((mode === 'list' || mode === 'both') && (typeof i.listId !== 'string' || !/^[\w-]{1,128}$/.test(i.listId))) {
    throw new HandlerError('invalid-argument', 'INVALID_INPUT', 'Choose a shopping list.');
  }
  const servings = i.servings;
  if (typeof servings !== 'number' || !Number.isInteger(servings) || servings < 1 || servings > 12) throw new HandlerError('invalid-argument', 'INVALID_INPUT', 'servings must be 1–12.');
  return { mode, listId: typeof i.listId === 'string' ? i.listId : undefined, servings, useDietaryPreferences: i.useDietaryPreferences === true };
}

const toMs = (v: unknown): number | null => (typeof v === 'number' ? v : v && typeof (v as { toMillis?: () => number }).toMillis === 'function' ? (v as { toMillis: () => number }).toMillis() : null);

function monthKey(now: number) {
  const d = new Date(now);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function asUsage(d: Doc | null, now: number): UsageDoc {
  if (!d) return newUsageDoc(now);
  return {
    introCreditsGranted: typeof d.introCreditsGranted === 'number' ? d.introCreditsGranted : 3,
    introCreditsConsumed: typeof d.introCreditsConsumed === 'number' ? d.introCreditsConsumed : 0,
    inFlight: (d.inFlight as UsageDoc['inFlight']) ?? null,
    premiumMonth: typeof d.premiumMonth === 'string' ? d.premiumMonth : monthKey(now),
    premiumMonthCount: typeof d.premiumMonthCount === 'number' ? d.premiumMonthCount : 0,
    premiumRecent: Array.isArray(d.premiumRecent) ? (d.premiumRecent as number[]) : [],
    updatedAt: typeof d.updatedAt === 'number' ? d.updatedAt : now,
  };
}

function preferencesFrom(doc: Doc | null): SafetyPreferences {
  if (!doc) return NO_PREFERENCES;
  const consent = doc.consent as { granted?: boolean } | undefined;
  if (consent?.granted !== true) return NO_PREFERENCES;
  return {
    consented: true,
    allergens: (Array.isArray(doc.allergens) ? doc.allergens : []).filter((a): a is AllergenCode => (ALLERGEN_CODES as readonly string[]).includes(a as string)),
    diets: (Array.isArray(doc.diets) ? doc.diets : []).filter((d): d is DietCode => (DIET_CODES as readonly string[]).includes(d as string)),
    avoid: (Array.isArray(doc.otherAvoid) ? doc.otherAvoid : []).filter((a): a is string => typeof a === 'string'),
    severity: doc.severity === 'severe' ? 'severe' : 'avoid',
  };
}

export async function generateRecipes(ctx: CallerContext, raw: unknown, deps: RecipeDeps) {
  const input = parseInput(raw);
  const now = deps.clock.now();
  const uidHash = deps.hash(`log:${ctx.uid}`).slice(0, 16);
  const base = `users/${ctx.uid}`;

  // 2. Explicit permission before any personal data reaches third-party AI (Apple 5.1.2(i)).
  const consent = await deps.store.get(`${base}/consents/ai`);
  if (consent?.granted !== true) throw new HandlerError('failed-precondition', 'AI_CONSENT_REQUIRED', 'Allow AI suggestions to continue.');

  // 3. Real data only (no catalogue, no fixtures).
  const pantryDocs = input.mode === 'list' ? [] : await deps.store.list(`${base}/pantry`);
  let listDocs: { id: string; data: Doc }[] = [];
  if (input.listId) {
    const list = await deps.store.get(`${base}/lists/${input.listId}`);
    if (!list) throw new HandlerError('not-found', 'LIST_NOT_FOUND', 'That list no longer exists.');
    listDocs = await deps.store.list(`${base}/lists/${input.listId}/items`);
  }
  const pantry: PantryRecord[] = pantryDocs.map((d) => ({
    id: d.id,
    name: String(d.data.name ?? ''),
    quantity: Number(d.data.quantity ?? 0),
    unit: String(d.data.unit ?? 'unit'),
    expiryDate: toMs(d.data.expiryDate),
    expiryKind: d.data.expiryKind === 'use_by' || d.data.expiryKind === 'best_before' ? d.data.expiryKind : null,
  }));
  const items: ListItemRecord[] = listDocs.map((d) => ({ id: d.id, name: String(d.data.name ?? ''), quantity: Number(d.data.quantity ?? 1), unit: String(d.data.unit ?? 'unit'), checked: d.data.checked === true }));

  // 4. Before any reservation: empty input never costs anything.
  const normalised = normaliseIngredients(input.mode, pantry, items, now);
  if (!normalised.ok) throw new HandlerError('failed-precondition', 'NO_INGREDIENTS', 'Add a few ingredients first.');

  const prefs = input.useDietaryPreferences ? preferencesFrom(await deps.store.get(`${base}/private/preferences`)) : NO_PREFERENCES;

  // Entitlement (server-written) decides the path: Premium quota or introductory credit.
  const entDoc = await deps.store.get(`entitlements/${ctx.uid}`);
  const plan: PlanId = entDoc && (entDoc.plan === 'premium' || entDoc.plan === 'standard') ? entDoc.plan : DEFAULT_ENTITLEMENT.plan;

  // 5. Global kill switch and spend cap (cost control).
  const spendPath = `aiSpend/${monthKey(now)}`;
  if (deps.config.paused) throw new HandlerError('unavailable', 'SERVICE_PAUSED', 'AI recipes are paused.');
  const spend = await deps.store.get(spendPath);
  if (typeof spend?.usd === 'number' && spend.usd >= deps.config.monthlyBudgetUsd) {
    deps.logger.warn('ai_budget_reached', { month: monthKey(now) });
    throw new HandlerError('unavailable', 'SERVICE_PAUSED', 'AI recipes are paused.');
  }

  // 6. Cache: identical inputs within the TTL return the same safe result without a new charge.
  const constraintKey = { allergens: prefs.allergens, diets: prefs.diets, avoid: prefs.avoid, servings: input.servings };
  const cacheKey = deps.hash(`${PROMPT_VERSION}|${LEXICON_VERSION}|${deps.config.allowNutrition}|${canonicalInputKey(input.mode, normalised.inputs, constraintKey)}`);
  const cachePath = `${base}/aiCache/${cacheKey}`;
  const cached = await deps.store.get(cachePath);
  const usagePath = `usage/${ctx.uid}`;
  if (cached && typeof cached.expiresAt === 'number' && cached.expiresAt > now && Array.isArray(cached.recipes)) {
    const usage = asUsage(await deps.store.get(usagePath), now);
    deps.logger.info('ai_recipes_cache_hit', { uidHash, mode: input.mode });
    return {
      recipes: cached.recipes as Recipe[],
      discardedCount: Number(cached.discardedCount ?? 0),
      excludedExpired: normalised.excludedExpired,
      omittedCount: normalised.omittedCount,
      usage: summary(usage, plan, now),
      cached: true,
      preferencesApplied: prefs.consented,
    };
  }

  // 7. Reserve (transaction): one in-flight request per user; credits/quotas checked here.
  const reservationId = deps.ids.next();
  await deps.store.transaction(async (tx) => {
    const usage = asUsage(await tx.get(usagePath), now);
    const r = reserveGeneration(usage, { plan, emailVerified: ctx.emailVerified, now, reservationId });
    if (!r.ok) {
      if (r.code === 'TRIAL_EXHAUSTED') throw new HandlerError('resource-exhausted', 'TRIAL_EXHAUSTED', 'Free AI recipes used.');
      if (r.code === 'EMAIL_NOT_VERIFIED') throw new HandlerError('failed-precondition', 'EMAIL_NOT_VERIFIED', 'Verify your email first.');
      if (r.code === 'REQUEST_IN_PROGRESS') throw new HandlerError('aborted', 'REQUEST_IN_PROGRESS', 'A request is already in progress.');
      throw new HandlerError('resource-exhausted', 'QUOTA_EXCEEDED', 'Limit reached.', { resetAt: r.resetAt, window: r.window });
    }
    tx.set(usagePath, r.doc as unknown as Doc);
  });

  const release = async (reason: string) => {
    await deps.store.transaction(async (tx) => {
      const usage = asUsage(await tx.get(usagePath), deps.clock.now());
      tx.set(usagePath, releaseGeneration(usage, reservationId, deps.clock.now()) as unknown as Doc);
    });
    deps.logger.info('ai_recipes_released', { uidHash, reason });
  };

  // 8. Provider call.
  let response;
  const started = deps.clock.now();
  try {
    response = await deps.provider.generate({
      system: SYSTEM_PROMPT,
      user: buildUserPrompt({ mode: input.mode, ingredients: normalised.inputs, servings: input.servings, allergens: prefs.allergens, diets: prefs.diets, avoid: prefs.avoid, recipeCount: deps.config.recipeCount }),
      schema: recipeJsonSchema(deps.config.allowNutrition),
      maxOutputTokens: deps.config.maxOutputTokens,
      timeoutMs: deps.config.timeoutMs,
    });
  } catch (error) {
    const kind = error instanceof ProviderError ? error.kind : 'unavailable';
    await release(`provider_${kind}`);
    throw new HandlerError(kind === 'timeout' ? 'deadline-exceeded' : 'unavailable', 'PROVIDER_UNAVAILABLE', 'The AI service did not respond.');
  }

  // Record estimated spend for every provider call (even if the result is then rejected).
  const cost =
    (response.usage.inputTokens / 1e6) * deps.config.costPerMTokUsd.input + (response.usage.outputTokens / 1e6) * deps.config.costPerMTokUsd.output;
  await deps.store.transaction(async (tx) => {
    const s = await tx.get(spendPath);
    tx.set(spendPath, { usd: (typeof s?.usd === 'number' ? s.usd : 0) + cost, calls: (typeof s?.calls === 'number' ? s.calls : 0) + 1, updatedAt: deps.clock.now() });
  });

  // 9. Schema validation (strict; no repair, no partial display).
  const valid = validateRecipeResult(response.json, { allowNutrition: deps.config.allowNutrition });
  if (!valid.ok) {
    await release('invalid_output');
    deps.logger.warn('ai_recipes_invalid', { uidHash, issues: valid.issues.length, model: response.model, latencyMs: deps.clock.now() - started });
    throw new HandlerError('internal', 'INVALID_OUTPUT', 'The AI response did not pass our checks.');
  }

  // 10–11. Safety screen and reclassification against the user's real data.
  const recipes: Recipe[] = [];
  let discardedCount = 0;
  const discardReasons: string[] = [];
  for (const candidate of valid.value.recipes) {
    const screened = screenRecipe(candidate, prefs);
    if (screened.decision === 'discard') {
      discardedCount += 1;
      discardReasons.push(screened.reason);
      continue;
    }
    const ingredients = screened.recipe.ingredients.map((ing, idx) => ({
      ...reclassifyIngredient(ing, normalised.inputs),
      safety: screened.ingredientSafety[idx]?.safety ?? 'ok',
      safetyReasons: screened.ingredientSafety[idx]?.reasons ?? [],
    }));
    const { nutritionEstimate, ...rest } = screened.recipe;
    recipes.push({
      ...rest,
      ...(deps.config.allowNutrition && nutritionEstimate ? { nutritionEstimate } : {}),
      id: deps.ids.next(),
      ingredients,
      allergenWarnings: [...screened.allergenWarnings, ...screened.dietCautions],
      readyToCook: isReadyToCook(ingredients),
      generatedAt: deps.clock.now(),
      mode: input.mode,
      model: response.model,
      promptVersion: PROMPT_VERSION,
      lexiconVersion: LEXICON_VERSION,
    });
  }

  if (recipes.length === 0) {
    await release('all_discarded');
    deps.logger.warn('ai_recipes_all_discarded', { uidHash, discardReasons });
    throw new HandlerError('failed-precondition', 'ALL_DISCARDED', 'No suitable recipes.');
  }

  // 12. Commit: exactly one credit/quota unit for a successful, safe result.
  let finalUsage: UsageDoc = newUsageDoc(now);
  await deps.store.transaction(async (tx) => {
    const usage = asUsage(await tx.get(usagePath), deps.clock.now());
    const committed = commitGeneration(usage, reservationId, deps.clock.now());
    finalUsage = committed.doc;
    tx.set(usagePath, committed.doc as unknown as Doc);
  });

  await deps.store.set(cachePath, { recipes, discardedCount, createdAt: deps.clock.now(), expiresAt: deps.clock.now() + deps.config.cacheTtlMs });
  deps.logger.info('ai_recipes_ok', {
    uidHash,
    mode: input.mode,
    plan,
    recipes: recipes.length,
    discardedCount,
    discardReasons,
    model: response.model,
    inputTokens: response.usage.inputTokens,
    outputTokens: response.usage.outputTokens,
    costUsd: Number(cost.toFixed(6)),
    latencyMs: deps.clock.now() - started,
  });

  return {
    recipes,
    discardedCount,
    excludedExpired: normalised.excludedExpired,
    omittedCount: normalised.omittedCount,
    usage: summary(finalUsage, plan, now),
    cached: false,
    // False when the user asked to use preferences but has none or has withdrawn consent (UI-3).
    preferencesApplied: prefs.consented,
  };
}

function summary(usage: UsageDoc, plan: PlanId, now: number) {
  const s = usageSummary(usage, plan, now);
  return { introRemaining: s.introRemaining, premiumUsedThisMonth: s.premiumUsedThisMonth, premiumMonthlyLimit: s.premiumMonthlyLimit };
}
