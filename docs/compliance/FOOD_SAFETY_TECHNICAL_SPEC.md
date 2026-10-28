# Food Safety Technical Specification — AI Recipes and Dietary Preferences

| | |
|---|---|
| Version | 0.1 (draft) |
| Date | 28 October 2026 |
| Linked documents | `docs/legal/FOOD_SAFETY_AND_ALLERGENS.md` (public disclaimer, to draft); `AI_ARCHITECTURE.md` §§5–9; `DPIA_SCREENING.md`; `LEGAL_COMPLIANCE_MATRIX.md` FS-01…FS-03, DP-05, AP-07–AP-09 |
| Milestone | M3 (AI) and M4 (screens) |
| Principle | **The application enforces these protections. Legal text only explains them.** If code and disclaimer disagree, the release gate fails. |
| Sources | S-xx IDs refer to `LEGAL_COMPLIANCE_MATRIX.md` §1 |

## 1. Data model

```ts
// users/{uid}/private/preferences  (server-readable; client-writable only via validated callable)
type DietaryPreferences = {
  consent: { granted: boolean; policyVersion: string; grantedAt: Timestamp; withdrawnAt?: Timestamp };
  allergens: AllergenCode[];          // closed list, see §2
  otherAvoid: string[];               // free text, max 20 items × 40 chars, normalised
  diets: DietCode[];                  // closed list: vegetarian | vegan | pescatarian | gluten_free | dairy_free | halal | kosher (DPIA-2 may remove the last two)
  severity: 'avoid' | 'severe';       // 'severe' = stronger warnings (§5)
  updatedAt: Timestamp;
};
type AllergenCode =
  | 'gluten' | 'crustaceans' | 'eggs' | 'fish' | 'peanuts' | 'soybeans' | 'milk'
  | 'tree_nuts' | 'celery' | 'mustard' | 'sesame' | 'sulphites' | 'lupin' | 'molluscs';
```

The 14 codes are the UK regulated allergens listed by the FSA (S-40). Display names follow the FSA wording, e.g. "Cereals containing gluten", "Nuts (almond, hazelnut, walnut, cashew, pecan, Brazil nut, pistachio, macadamia)".

Rules:
- Preferences are written **only after** explicit consent (DP-05), on a dedicated screen, with no pre-selected options.
- Withdrawing consent deletes `allergens`, `otherAvoid` and `diets` (it does not just hide them) and records `withdrawnAt`.
- Preferences are never logged, never sent to analytics (none exists) and never included in an AI request unless `consent.granted === true` at request time (checked on the server).

## 2. Deterministic allergen lexicon

`shared/food/allergenLexicon.ts` maps each `AllergenCode` to ingredient terms and derivatives. For example:
- **milk:** milk, butter, cream, cheese, ghee, yoghurt, whey, casein, lactose.
- **gluten:** wheat, barley, rye, oats, spelt, couscous, semolina, bulgur, seitan, most breads, pasta, soy sauce (usually wheat-based).

Requirements:
- Unit tests list each term and its source rationale.
- The lexicon is **conservative**: ambiguous terms (e.g. "stock", "sauce", "curry paste", "pesto", "Worcestershire sauce") are marked `may_contain` against the relevant allergens.
- It is versioned (`lexiconVersion`). The version is stored with every generated recipe.
- It is a **screening aid only**. The UI never describes it as complete.

## 3. Generation pipeline (server)

| Step | Rule | Failure behaviour |
|---|---|---|
| 3.1 Prompt | The system prompt states the constraints, forbids the words "allergen-free", "safe for" and "suitable for allergy sufferers", and requires a full ingredient list | — |
| 3.2 Schema | The response must match `recipeSchema`. **No** fields for price, store availability, cooking temperatures or storage times (they are not in the schema, so the model cannot supply them); `nutritionEstimate` only per decision FS-D1 (§4) | Invalid → `INVALID_OUTPUT` (no repair, no partial display, as in `AI_ARCHITECTURE.md` §8); no credit used; no recipe shown |
| 3.3 Ingredient check | Every ingredient line is normalised and matched against the lexicon for each selected allergen and diet | — |
| 3.4 Hard conflict | An ingredient matches a selected allergen or diet directly | **Recipe discarded**, logged as an outcome code only. One regeneration with a stronger constraint; if it fails again, `CONSTRAINT_CONFLICT`. The recipe is never shown with the offending ingredient |
| 3.5 Uncertain match | `may_contain` term present | Recipe shown with a **"Check this ingredient"** badge on that line and a banner (§5) |
| 3.6 Model claims | `dietaryTags` from the model are shown only as "Suggested as: vegetarian (AI suggestion — check ingredients)"; never as a verified label | Tags that contradict §3.3 are removed |
| 3.7 Contradictions | The model says an allergen is absent while the lexicon finds it, or the method mentions an ingredient missing from the list | Treated as a hard conflict (§3.4) |
| 3.8 Text scan | Output text containing a forbidden phrase ("allergen-free", "safe for", "no risk", "guaranteed") | Phrase removed or recipe discarded if it was in the title |

## 4. Nutrition

There is a tension between two requirements:
- The AI recipe requirement allows "optional nutritional estimates, clearly labelled as estimates".
- The project rule says AI "must never independently fabricate … nutritional facts".

**Owner decision FS-D1:**

| Option | Behaviour | Assessment |
|---|---|---|
| A (recommended for launch) | No nutrition shown. The `nutritionEstimate` field stays behind the flag `ai.nutritionEstimates = false`; the server strips it | No risk of numbers being read as fact; simplest disclaimer |
| B | Model estimate shown, labelled **"AI estimate — not verified. Values vary by product and portion."** No health or diet claims derived from it. Hidden for users with `severity: 'severe'` | Meets the AI requirement; needs the disclaimer section and tests FT-13 and FT-14 |
| C (later) | Values computed from a licensed nutrition database per ingredient, labelled "Estimated from [source]" | Most reliable; needs a provider decision (API matrix) |

Under every option, the model's numbers are never shown as fact. The schema already marks `isEstimate: true` as a constant.

## 5. User interface requirements

| ID | Requirement | Where |
|---|---|---|
| UI-1 | A persistent banner on every AI recipe: "AI-generated. Check every ingredient and product label for allergens before cooking. IntelliShop cannot guarantee a recipe is free from any allergen." Links to the Food Safety page | Recipe detail |
| UI-2 | Severity `severe`: the banner cannot be collapsed, and adding the recipe's ingredients to a list needs an extra confirmation ("I will check labels for [allergens]") | Recipe → Add to list |
| UI-3 | No preferences set: banner variant "Recipes do not take allergies into account. Set allergies in Settings." | Recipe detail |
| UI-4 | "Check this ingredient" badges are text + icon, not colour alone; VoiceOver reads "Check: may contain milk" | Ingredient rows |
| UI-5 | **Human review before list changes:** recipe ingredients go to a review sheet with per-item toggles (default **unchecked** for items already in the pantry, **checked** for missing items). Nothing is added until the user taps "Add selected". No silent mutation (project rule) | Recipe → List |
| UI-6 | Cooking guidance: a fixed, vetted footer, "Cook food until it is steaming hot throughout. Follow the cooking instructions on product packaging." No model-generated temperatures or times for meat, poultry, eggs, fish or rice safety. Wording to be checked against current FSA consumer guidance before release | Recipe detail |
| UI-7 | Storage guidance only from vetted text consistent with FSA guidance (fridge 0–5 °C; eat leftovers within 48 hours or freeze — S-41). Otherwise omitted | Recipe detail |
| UI-8 | Pantry expiry: "Use by" vs "Best before" distinction in item editing; expired "use by" items are excluded from AI ingredient input by default | Pantry; AI normalisation (`AI_ARCHITECTURE.md` §5) |

## 6. Tests (must exist and pass before M3 PASS)

| Test | Input | Expected |
|---|---|---|
| FT-01 | Allergen `peanuts`; model returns a recipe with "peanut butter" | Recipe discarded; regeneration; never displayed |
| FT-02 | Allergen `milk`; ingredient "ghee" | Hard conflict (lexicon derivative) |
| FT-03 | Allergen `gluten`; ingredient "soy sauce" | `may_contain` badge + banner |
| FT-04 | Model title "Allergen-free brownies" | Recipe discarded (forbidden phrase in title) |
| FT-05 | Model claims "vegan" with "honey" in ingredients | Tag removed |
| FT-06 | Method mentions "add the prawns", ingredient list lacks prawns, allergen `crustaceans` | Contradiction → hard conflict |
| FT-07 | Model output includes a `price` or `availability` field; or `nutritionEstimate` while `ai.nutritionEstimates = false` | Schema rejection / field stripped by the server |
| FT-08 | Consent withdrawn between screen load and request | Server ignores preferences, returns `CONSENT_REQUIRED` for constraint use; UI-3 banner |
| FT-09 | Severity `severe`; add to list | Extra confirmation required (UI-2) |
| FT-10 | Recipe → list | No list change until "Add selected"; pantry items unchecked by default |
| FT-11 | VoiceOver labels on badges and banners | Accessible names present (RNTL `getByLabelText`) |
| FT-12 | 30-case evaluation set (`AI_ARCHITECTURE.md` §6.3) incl. 10 allergy cases | 0 displayed hard conflicts; results recorded in `docs/validation/` |
| FT-13 | Option B only: recipe with `nutritionEstimate` | Values shown only with the label "AI estimate — not verified…"; never in titles, tags or health claims |
| FT-14 | Option B only: user with `severity: 'severe'` | Nutrition hidden |

## 7. Disclaimer linkage

The public `FOOD_SAFETY_AND_ALLERGENS.md` must describe exactly the behaviour above:
- the lexicon screening and its limits;
- cross-contamination, which is not detectable from ingredient names;
- product recipes that change;
- nutrition handling per decision FS-D1 (none shown under Option A);
- cooking and storage guidance limited to fixed text;
- the user's responsibility to read labels and seek medical advice.

Any behaviour change updates both files in the same commit.
