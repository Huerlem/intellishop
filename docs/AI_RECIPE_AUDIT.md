# AI Recipe Generation — Baseline Audit

Requirement: [`docs/requirements/AI_RECIPE_GENERATION_REQUIREMENT.md`](requirements/AI_RECIPE_GENERATION_REQUIREMENT.md)
Baseline: `main` @ `0e26321` (GitHub, 2 commits, 2025-06-06)
Branch: `feature/v2-production-rebuild`
Audit date: 2026-10-27
Method: static source inspection only. **No code was executed** — dependency installation has not yet been completed in this environment, so nothing below is marked PASS.

## Verdict

The original recipe feature **does not meet the requirement**. The main recipe screen ignores the user's pantry and shopping lists entirely, every AI call is made from the client with a key that is committed to a public repository, and four separate code paths silently substitute invented recipes or deals when the AI response fails.

## Findings

| # | Location | Finding | Requirement violated | Severity |
|---|----------|---------|----------------------|----------|
| R1 | `app/(auth)/RecipeSuggestionScreen.jsx` `generateOpenRecipes` | Prompt asks for "6 diverse and popular recipes from around the world". No pantry or list data is sent. Pantry is only used afterwards to mark matches. | §1 A/B/C, §2 | Critical |
| R2 | Same file, JSON-parse fallback | On malformed AI output, builds up to 5 fake recipes with placeholder ingredients ("Main ingredient", "Seasoning") and generic steps, displayed as real results. | §6 Scenario 6, §5 | Critical |
| R3 | Same file + `services/recipeApiService.js`, `smartShoppingService.js`, `priceComparison.js`, `notifications.js`, `lib/gemini.js` | Gemini called directly from the app with `EXPO_PUBLIC_GEMINI_API_KEY`. That key (and four other provider keys) is committed in `eas.json`; a different Google key is in `firebase/config.js`. Repository is public. | §6 | Critical |
| R4 | `services/recipeApiService.js` `generateRecipeSuggestions` parse-failure branch | Returns hardcoded "Quick Meal with Available Ingredients" with fixed nutrition (300 kcal etc.). | §5, Scenario 6 | High |
| R5 | `services/recipeApiService.js` outer catch | On any error returns cached recipes or a hardcoded "Simple Meal" (250 kcal). | §5, Scenario 6 | High |
| R6 | `services/recipeApiService.js` cache key | `ingredients.sort().join('_')` on objects produces `[object object]_[object object]…`. Any two pantries of the same size share a cache entry for 24 h. Verified with Node. Also mutates the caller's array. | Scenario 5 | High |
| R7 | `app/(auth)/recipe/[id].jsx` | `MOCK_RECIPES` ("Pasta Carbonara") loaded as priority 2 with a fake 800 ms delay when no recipe data is passed. | §5 | High |
| R8 | `app/(auth)/recipe/[id].jsx` `handleAddToFavorites` | Favourite stored only in component state (`useState(new Set())`); success alert shown, nothing persisted. | §4 Save favourite | Medium |
| R9 | Favourites storage | Three unrelated keys: `@favorite_recipes` (FavoriteRecipes screen), `@recipes:favorites` (service, IDs only), and the in-memory Set above. Service favourites store IDs only, so content is lost when the 24 h cache expires. Device-local only; not tied to the account. | §4 | Medium |
| R10 | `services/geminiService.js` | Misnamed: contains a copy of a `RecipeSuggestionScreen` component, not a service. Imports `generateRecipesWithAI` from itself and exports only a default component. | §5 | High |
| R11 | `context/AIContext.jsx` | Imports `generateGreeting`, `generateSmartShoppingList`, `generateRecipesWithAI`, `generateFriendlyErrorMessage` from `services/geminiService.js`, which exports none of them. Every `AIContext` AI function receives `undefined`. Provider is mounted at the app root. | §5 | High |
| R12 | `services/smartShoppingService.js` `generatePersonalizedDeals` | On parse failure returns a hardcoded "Weekly Essentials Bundle — 10% savings" deal. | §5 (mock as live output), no-invented-prices rule | High |
| R13 | Ingredient matching (`RecipeSuggestionScreen`, `generateRecipesWithAI`) | Bidirectional substring match (`"egg".includes` / `includes("egg")`) — "oil" matches "boil", "rice" matches "price". No quantities, units or expiry considered. | §1 A/C, §3 | Medium |
| R14 | Prompts | Shopping list not used as a source; no allergies, equipment, servings, expiry or budget passed; nutrition requested as fact, not labelled as estimate; no allergen disclaimer. | §1 B/C, §2, §3 | High |
| R15 | Output validation | `JSON.parse` after regex stripping of code fences and trailing commas. No schema; fields like `instructions`/`steps`, `prepTime`/`cookingTime` are inconsistent between paths. | §3 | High |
| R16 | Rate limiting | Per-device in-memory counters (`setInterval` reset), duplicated in five modules, trivially bypassed, no per-user quota or cost tracking. | §6 | High |
| R17 | Missing-ingredient flow | Alert + list-picker modal exists before `addMultipleItems`. This is a reusable confirmation pattern, but it adds *all* items flagged `!inStock` based on R13 matching, without a per-item review. | §4, Scenario 4 | Medium |
| R18 | Logging | Raw AI responses and prompts printed with `console.log` (includes pantry contents). | Phase 4/7 logging rule | Low |

## Scenario status (baseline)

None of the six acceptance scenarios can be satisfied by the original code. None has been executed.

| Scenario | Baseline behaviour (from source) | Status |
|---|---|---|
| 1 Pantry only | Pantry not sent to the model (R1) | NOT IMPLEMENTED |
| 2 Shopping list only | Shopping list never used as a recipe source | NOT IMPLEMENTED |
| 3 Pantry + list | No combined mode | NOT IMPLEMENTED |
| 4 Add missing ingredient after confirmation | Confirmation exists but matching is unreliable (R13, R17) | PARTIAL — needs rework |
| 5 Suggestions reflect changed inventory | Cache collision (R6) can return stale recipes | NOT IMPLEMENTED |
| 6 Provider unavailable | Fake recipes shown instead of an error (R2, R4, R5) | NOT IMPLEMENTED |

## What to keep

- **UI components** (to be restyled to Figma V2 tokens, not rewritten from scratch): `components/recipes/RecipeCard.jsx`, `RecipeFilters.jsx`, `SelectListModal.jsx`; filter dimensions (difficulty, category, prep time).
- **Business logic**: the list-selection + confirm flow before `addMultipleItems`; availability-percentage idea.
- **Data shape ideas**: the recipe object fields are a reasonable starting point for the new schema.

## What to remove from production paths

`MOCK_RECIPES`; all fallback recipe/deal builders (R2, R4, R5, R12); every client-side Gemini import; `services/geminiService.js` (duplicate screen); `lib/openai.js-backup`, `services/openai.js-BACKUP`; the broken `AIContext` imports. Fixtures may be re-created only under `__tests__/fixtures/` and never imported by app code.

## Target design (to be confirmed in `docs/AI_ARCHITECTURE.md`)

1. **Server-side endpoint** reusing the existing Firebase project's backend (Cloud Functions callable), protected by Firebase Auth and App Check. The provider key lives only in server-side secret storage. The model and provider are not chosen yet: that decision will follow verification of current provider documentation, pricing and structured-output support (Phase 5).
2. **Server reads the data itself**: the endpoint receives `mode` (`pantry` | `list` | `both`), `listId`, and preferences; it loads the authenticated user's pantry and list from Firestore, so the client cannot spoof inputs and prompts always use current data.
3. **Deterministic pre-processing** before the model: merge pantry + list, deduplicate by normalised name, convert units where safe, rank by expiry.
4. **Structured output** enforced by the provider's schema feature *and* re-validated server-side and client-side against one shared schema (fields per requirement §3, including `availableIngredients`, `fromShoppingList`, `missingIngredients`, `reason`, `allergenWarnings`, and `nutritionEstimate` flagged `isEstimate: true`).
5. **Post-validation**: every ingredient the model labels "available" or "from list" is checked against the real pantry/list; mismatches are reclassified as missing.
6. **Failure is explicit**: timeout, provider error or schema failure returns a typed error; the UI shows an error state with Retry. No substitute content.
7. **Controls**: per-user daily quota and per-minute rate limit in Firestore, request size limits, timeout, token/cost logging without pantry contents.
8. **Cache key** = hash of (normalised inputs + preferences + mode), server-side, short TTL — so any pantry change produces new suggestions.
9. **Favourites** saved as full recipe snapshots under `users/{uid}/favouriteRecipes`, covered by account deletion and data export.
10. **Missing-ingredient flow**: per-item review sheet (choose items, list, quantities) → explicit confirm → write; no silent mutation.

## Acceptance evidence plan

Scenarios 1–6 will be run against a Firebase emulator (or staging project) with seeded test users and the real model endpoint, recording request inputs (without secrets), validated outputs and screenshots in `docs/test-reports/AI_RECIPES.md`. Scenario 6 will be run by forcing provider timeout/error. Automated tests will cover schema validation, reclassification of hallucinated "available" ingredients, cache-key changes on inventory change, and the no-fallback rule.
