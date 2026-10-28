/**
 * Recipe safety screen (FOOD_SAFETY_TECHNICAL_SPEC.md §3.3–3.8). Runs on the server after
 * schema validation and before anything is shown or cached. Pure and deterministic.
 */
import { normaliseItemName } from '../domain/items';
import type { ModelRecipe } from '../ai/recipeTypes';
import {
  ALLERGEN_CODES,
  ALLERGEN_SHORT_LABELS,
  DIET_RULES,
  LEXICON,
  allergenHits,
  findTerm,
  type AllergenCode,
  type DietCode,
} from './allergens';

export type SafetyPreferences = {
  consented: boolean;
  allergens: AllergenCode[];
  diets: DietCode[];
  avoid: string[]; // free-text "ingredients to avoid"
  severity: 'avoid' | 'severe';
};

export const NO_PREFERENCES: SafetyPreferences = { consented: false, allergens: [], diets: [], avoid: [], severity: 'avoid' };

export type DiscardReason = 'ALLERGEN_CONFLICT' | 'DIET_CONFLICT' | 'AVOID_CONFLICT' | 'FORBIDDEN_TITLE' | 'CONTRADICTION';

export type IngredientSafety = { safety: 'ok' | 'check'; reasons: string[] };

export type SafetyResult =
  | { decision: 'discard'; reason: DiscardReason; detail: string }
  | {
      decision: 'show';
      recipe: ModelRecipe;
      ingredientSafety: IngredientSafety[];
      allergenWarnings: string[]; // e.g. "Contains milk (from: butter)", "May contain gluten (from: stock)"
      dietCautions: string[];
      removedClaims: number;
    };

/** "X-free" / safety claims the app must never show (FS-03, §3.8). */
const FORBIDDEN_CLAIMS: RegExp[] = [
  /\b(allergen|allergy|nut|peanut|gluten|dairy|milk|lactose|egg|soy|soya|sesame|shellfish|fish|celery|mustard|sulphite|lupin|wheat)[\s-]*free\b/i,
  /\bfree[\s-]from\b/i,
  /\bsafe\s+(for|to\s+eat\s+for)\b/i,
  /\bsuitable\s+for\s+(people\s+with\s+)?(allerg|coeliac|celiac|intoleran)/i,
  /\b(no|zero)\s+risk\b/i,
  /\bguarantee[ds]?\b/i,
  /\ballergy[\s-]friendly\b/i,
  /\bhypoallergenic\b/i,
];

export const containsForbiddenClaim = (text: string) => FORBIDDEN_CLAIMS.some((re) => re.test(text));

/** Removes whole sentences that contain a forbidden claim. */
export function stripClaims(text: string): { text: string; removed: number } {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const kept = sentences.filter((s) => !containsForbiddenClaim(s));
  return { text: kept.join(' ').trim(), removed: sentences.length - kept.length };
}

/** Lexicon words that are also common cooking verbs or parts of words in method text ("roll out", "cream the butter"). */
const METHOD_VERB_AMBIGUOUS = new Set(['roll', 'wrap', 'cream', 'port', 'sole', 'ale', 'bass', 'cake', 'roe']);

const ALLOWED_TAGS = new Set(['vegetarian', 'vegan', 'pescatarian', 'high protein', 'quick', 'one pot', 'budget', 'family', 'batch cook', 'spicy', 'mild']);

export function screenRecipe(recipe: ModelRecipe, prefs: SafetyPreferences): SafetyResult {
  if (containsForbiddenClaim(recipe.title)) {
    return { decision: 'discard', reason: 'FORBIDDEN_TITLE', detail: 'Title makes a free-from or safety claim' };
  }

  const active = prefs.consented ? prefs : NO_PREFERENCES;
  const avoidTerms = active.avoid.map(normaliseItemName).filter(Boolean);

  // Allergens to enforce: selected allergens plus those implied by selected diets.
  const enforced = new Set<AllergenCode>(active.allergens);
  for (const d of active.diets) for (const a of DIET_RULES[d].alsoAllergens) enforced.add(a);

  const ingredientSafety: IngredientSafety[] = [];
  const containsBy = new Map<AllergenCode, Set<string>>();
  const mayBy = new Map<AllergenCode, Set<string>>();
  const dietCautions = new Set<string>();

  for (const ing of recipe.ingredients) {
    const name = normaliseItemName(ing.name);
    const reasons: string[] = [];

    for (const hit of allergenHits(ing.name)) {
      const bucket = hit.certainty === 'contains' ? containsBy : mayBy;
      if (!bucket.has(hit.allergen)) bucket.set(hit.allergen, new Set());
      bucket.get(hit.allergen)!.add(ing.name);
      if (enforced.has(hit.allergen)) {
        if (hit.certainty === 'contains') {
          return { decision: 'discard', reason: 'ALLERGEN_CONFLICT', detail: `${ing.name} → ${hit.allergen}` };
        }
        reasons.push(`May contain ${ALLERGEN_SHORT_LABELS[hit.allergen]}`);
      }
    }

    for (const d of active.diets) {
      const rule = DIET_RULES[d];
      const forbidden = findTerm(name, rule.forbidden, rule);
      if (forbidden) return { decision: 'discard', reason: 'DIET_CONFLICT', detail: `${ing.name} → ${d}` };
      const caution = findTerm(name, rule.caution, rule);
      if (caution) reasons.push(`Check this is suitable (${d.replace('_', ' ')})`);
    }

    const avoidHit = avoidTerms.find((t) => (` ${name} `).includes(` ${t} `));
    if (avoidHit) return { decision: 'discard', reason: 'AVOID_CONFLICT', detail: `${ing.name} → ${avoidHit}` };

    ingredientSafety.push({ safety: reasons.length ? 'check' : 'ok', reasons });
  }

  // Contradiction (§3.7): the method mentions an enforced allergen, forbidden diet item or
  // avoided ingredient that is not visible in the ingredient list.
  const method = normaliseItemName(recipe.steps.map((s) => s.text).join(' '));
  for (const code of enforced) {
    const term = findTerm(method, LEXICON[code].contains.filter((t) => !METHOD_VERB_AMBIGUOUS.has(t)), LEXICON[code], 'text');
    if (term) return { decision: 'discard', reason: 'CONTRADICTION', detail: `method mentions ${term} (${code})` };
  }
  for (const d of active.diets) {
    const term = findTerm(method, DIET_RULES[d].forbidden, DIET_RULES[d], 'text');
    if (term) return { decision: 'discard', reason: 'CONTRADICTION', detail: `method mentions ${term} (${d})` };
  }
  for (const t of avoidTerms) {
    if ((` ${method} `).includes(` ${t} `)) return { decision: 'discard', reason: 'CONTRADICTION', detail: `method mentions ${t}` };
  }

  for (const d of active.diets) if (DIET_RULES[d].alwaysCheck) dietCautions.add(DIET_RULES[d].alwaysCheck!);

  // Informational allergen summary for everyone (with or without saved preferences).
  const allergenWarnings: string[] = [];
  for (const code of ALLERGEN_CODES) {
    const c = containsBy.get(code);
    if (c) allergenWarnings.push(`Contains ${ALLERGEN_SHORT_LABELS[code]} (from: ${[...c].join(', ')})`);
    else if (mayBy.get(code)) allergenWarnings.push(`May contain ${ALLERGEN_SHORT_LABELS[code]} (check: ${[...mayBy.get(code)!].join(', ')})`);
  }

  // Strip claims from free text; sanitise model dietary tags (§3.6).
  let removedClaims = 0;
  const clean = (t: string) => {
    const r = stripClaims(t);
    removedClaims += r.removed;
    return r.text;
  };
  const implied = new Set<string>();
  const tagContradicted = (tag: string): boolean => {
    const diet = tag as DietCode;
    if (!(diet in DIET_RULES)) return false;
    for (const ing of recipe.ingredients) {
      const n = normaliseItemName(ing.name);
      if (findTerm(n, DIET_RULES[diet].forbidden, DIET_RULES[diet])) return true;
      for (const a of DIET_RULES[diet].alsoAllergens) if (findTerm(n, LEXICON[a].contains, LEXICON[a])) return true;
    }
    return false;
  };
  const dietaryTags = recipe.dietaryTags
    .map((t) => t.trim().toLowerCase())
    .filter((t) => ALLOWED_TAGS.has(t) && !containsForbiddenClaim(t) && !tagContradicted(t))
    .filter((t) => (implied.has(t) ? false : (implied.add(t), true)));

  return {
    decision: 'show',
    recipe: {
      ...recipe,
      description: clean(recipe.description),
      reason: clean(recipe.reason),
      steps: recipe.steps
        .map((s) => ({ ...s, text: clean(s.text) }))
        .filter((s) => s.text.length > 0)
        .map((s, i) => ({ order: i + 1, text: s.text })),
      dietaryTags,
    },
    ingredientSafety,
    allergenWarnings,
    dietCautions: [...dietCautions],
    removedClaims,
  };
}
