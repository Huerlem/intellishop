# Implementation Roadmap and Requirements Traceability

Branch: `feature/v2-production-rebuild` · 2026-10-27 · Baseline audit complete (`CODEBASE_AUDIT.md`, `FIGMA_IMPLEMENTATION_MATRIX.md`, `AI_RECIPE_AUDIT.md`, `SECURITY_REMEDIATION_PLAN.md`, `VALIDATION_REPORT.md`).

## 1. Milestones

Each milestone ends with: CI green (typecheck, lint, unit/integration tests, secret scan, iOS JS bundle export), evidence in `docs/test-reports/`, a commit series on this branch, and a short report. No milestone is reported done on static review alone.

| ID | Milestone | Depends on | Owner prerequisites | Exit criteria (evidence) |
|---|---|---|---|---|
| **M1** *(implemented 2026-10-28; awaiting CI evidence — see `M1_REPORT.md`)* | **Secure, buildable baseline** — remove client AI/price/mock code, dead code, unused deps; Expo SDK upgrade to current (58); TypeScript, lint, Jest, CI; design tokens; Home \| Lists \| Pantry tab shell with auth guard | Package registry access (here or CI) | S1 revocations (in parallel) | CI green; bundle scan T1/T2 PASS; tab shell runs in EAS development build on owner's iPhone; token unit tests |
| M2 | Backend foundations — dev/staging/prod projects, per-user Firestore model + migration, Security Rules + emulator tests, App Check, Functions codebase, auth fixes, minimal registration, **account deletion + data export**, entitlement doc (`free`), Free capacity counters | M1 | Firebase access + Blaze; decision S2 | Rules tests; deletion/export tests; T3–T5; legal tasks L2-01…L2-12 (`compliance/LEGAL_IMPLEMENTATION_CHECKLIST.md`) |
| M3 | AI recipes through secure backend — 3 modes, normalisation, structured output, reclassification, allergens, cache, favourites, reviewed list changes; **Free introductory credits (3)**; screens C5, M3, M4, M12 | M2; approval of `SUBSCRIPTION_*` docs (D3, D4, D10) | New AI provider key set in staging Secret Manager by owner | Recipe scenarios 1–6 (live, staging); S1–S7, S19–S20; A1–A6 of cloud-secrets doc; AI consent + food-safety tests FT-01…FT-12; signed DPIA (L3-01…L3-07) |
| M4 | Core V2 screens — Home P01, Lists root C6, List Detail P02, Add Items P03, Pantry P10, pantry management C7; offline behaviour for lists/pantry | M2 (M3 for "Use What I Have" link) | Design approval of C6/C7 proposals | Navigation regression tests; offline tests; visual comparison vs Figma at 440×956, 402×874, 393×852; legal screens L4-01…L4-03 |
| M5 | Shopping trip — Shopping Mode P07 (+ C8 exceptions), Finish Shopping P08, Pantry Update P09 (additive, reviewable, undoable) | M4 | Design approval of C8 | Journey test P01→P10; no silent destructive updates test |
| M6 | Subscriptions — RevenueCat, App Store products, webhook + sync + reconciliation, paywall and Settings screens M1–M11, Rules-based limits, downgrade behaviour | M2, M4 | O1–O12 (Apple agreements, banking, tax, products, sandbox testers, RevenueCat) | S1–S26 incl. sandbox purchases on device; billing disclosures LS-01…LS-04 |
| M7 | Premium AI — Optimisation Review P04, substitutions, budget-aware suggestions; Recommended Store / Compare Stores P05/P06 **only** with a licensed provider, otherwise honest no-data state (C3); `API_INTEGRATION_MATRIX.md` | M3, M6 | Provider contract (if any) | P04 accept/reject tests (no silent mutation); no-invented-price tests |
| M8 | Hardening — accessibility (VoiceOver, Dynamic Type, 44 pt targets, non-colour status), App Privacy labels verified against the binary (policy drafting moved earlier — see Legal workstream), logging redaction, performance, crash handling without content | M4–M7 | Privacy policy/EULA hosting | Accessibility checklist; T7; S26; `compliance/LEGAL_RELEASE_GATE.md` all criteria PASS |
| M9 | Release — icons/launch assets from approved brand, App Store metadata, screenshots from the real build, EAS production build, TestFlight, submission checklist | M8 | Apple account, App Store Connect access | TestFlight build installed and smoke-tested; **no publication without explicit owner approval** |

**Legal & compliance workstream (P0, added 2026-10-28):** runs in parallel from now — `docs/compliance/LEGAL_WORKSTREAM_PLAN.md`. Public documents drafted P1 (now) → P2 (M3) → P3 (M6); engineering tasks folded into M2, M3, M4, M6; release gate in M9.

Visual reskin (green/cream concept) is tracked separately as a proposal and is not part of these milestones unless approved.

### 1.1 Status on 28 October 2026 (after the accelerated packages)

Code exists for most of M2–M6 on `feature/v2-production-rebuild`, tested only on the local proxy toolchain; **no milestone is PASS** because nothing has run in CI, on an emulator or on a device. Per-item status: `IMPLEMENTATION_PACKAGE_REPORT.md` §1 (M2 data/rules/functions, M3 recipe pipeline paused, M4/M5 screens, M6 interfaces without purchases). M7 (P04–P06) is not implemented. M1 remains open until CI runs.

## 2. First milestone — M1 detail

### 2.1 Steps
1. **Tooling:** `tsconfig.json`; ESLint (Expo config) with `no-restricted-imports` banning `@google/generative-ai`, `@google/genai`, `openai`, `@anthropic-ai/sdk`, `axios` in app code, and banning imports from `__tests__/fixtures`; Prettier; Jest (`jest-expo`); scripts `typecheck`, `lint`, `test`, `export:ios`.
2. **CI** `.github/workflows/ci.yml`: install with lockfile → typecheck → lint → test → `npx expo export --platform ios` → scan exported bundle for key patterns (T1) → upload logs. Secret scan workflow already added.
3. **Expo SDK upgrade** 53 → current (58) with `npx expo install expo@^58.0.0 --fix`, then `npx expo-doctor`; record outputs. Replace `uuid` usage with `expo-crypto` `randomUUID()`.
4. **Remove** insecure, fabricating and dead code (list in §2.2). Features that depended on them (recipes, price comparison, smart list) are temporarily unavailable on the branch until M3/M7 rebuild them properly.
5. **Environment config:** `app.config.ts` (reads `APP_ENV`, public Firebase config from env, bundle ID per env); `firebase/config.ts` reads from `expo-constants`/env instead of hard-coded values.
6. **Design tokens:** `src/theme/tokens.ts` (23 colours, 18 numbers, elevation — exact Figma values), `src/theme/typography.ts` (10 Inter styles), load Inter via `@expo-google-fonts/inter`, remove Poppins.
7. **Navigation shell:** Expo Router groups `(public)` and `(app)`; `(app)/_layout.tsx` guards on auth; `(app)/(tabs)/_layout.tsx` with exactly Home | Lists | Pantry using a tokenised Bottom Nav; existing Home/List/Stock screens mounted as tab roots pending M4; `+not-found.tsx`.
8. **Fix runtime defects** in retained files: `AuthContext` listener leak and out-of-scope `result`; remove AI greeting from Home and AI calls from Profile.
9. **Evidence:** CI logs, bundle-scan output, development build screenshots on device.

### 2.2 Files

**Delete**
```
App.js, index.js
app/(public)/Index.jsx, app/(auth)/index.jsx, app/not-found.jsx (→ app/+not-found.tsx)
app/(auth)/Price-Comparison.jsx, app/(auth)/SmartShoppingListScreen.jsx, app/(auth)/SupermarketListsScreen.jsx
app/(auth)/RecipeSuggestionScreen.jsx, app/(auth)/recipe/[id].jsx, app/(auth)/recipe/_layout.jsx, app/(auth)/FavoriteRecipes.jsx   (rebuilt in M3)
lib/gemini.js, lib/apiKeys.js, lib/openai.js-backup
services/geminiService.js, services/recipeApiService.js, services/smartShoppingService.js,
services/priceComparison.js, services/freeAPIsPrice.js, services/notifications.js, services/openai.js-BACKUP
context/AIContext.jsx, context/RecipeContext.jsx
hooks/useAIFeatures.js, hooks/useRecipes.js, hooks/useSmartShopping.js, hooks/usePriceComparison.js,
hooks/useNotifications.js, hooks/useSupermarketLists.js
components/ai/AIGreeting.jsx, components/ai/RecipeSuggestion.jsx, components/recipes/RecipeSuggestion.jsx
components/PriceComparison/ProductPriceCard.jsx, components/PriceComparison/StoreComparison.jsx
components/shopping/SmartShoppingItem.jsx, components/shopping/SmartShoppingSummary.jsx
firebase/firestoreHelpers.js, firebase/batch.js
utils/analytics.js, utils/jsonUtils.js, utils/iconMapper.js
```
(`utils/WebCompatibleIcons.js` stays until M4 because `Shopping_list.jsx`, `ShoppingListItem.jsx` and `StockItemCard.jsx` use it.)

**Modify**
```
package.json, package-lock.json        SDK upgrade, remove unused/insecure deps, scripts
app.json → app.config.ts               env-driven config, supportsTablet false, usage descriptions
babel.config.js                        keep alias; remove dotenv assumptions
firebase/config.js → firebase/config.ts env-driven public config
app/_layout.jsx                        remove AIProvider/RecipeProvider; load Inter; route groups
app/(auth)/_layout.jsx → app/(app)/_layout.tsx (+ (tabs)/_layout.tsx)
app/(auth)/HomeScreen.jsx              remove AIContext/AIGreeting/SmartShopping links
app/(auth)/ProfileScreen.jsx           remove AIContext usage
components/navigation/TabBar.jsx       3 tabs, tokens, accessibility
context/AuthContext.jsx, hooks/useAuth.js   listener cleanup, scope bug, single hook
firebase/authHelpers.js                remove email logging
```

**Create**
```
tsconfig.json, eslint.config.js, .prettierrc, jest.config.js
.github/workflows/ci.yml
src/theme/tokens.ts, src/theme/typography.ts, src/theme/index.ts
app/(app)/(tabs)/_layout.tsx, app/(app)/(tabs)/index.tsx (Home), lists.tsx, pantry.tsx
app/+not-found.tsx
__tests__/theme.tokens.test.ts, __tests__/navigation.tabs.test.tsx, __tests__/no-provider-imports.test.ts
scripts/scan-bundle-for-secrets.mjs
```

## 3. Requirements traceability

| Requirement | Source | Design doc | Milestone | Verification |
|---|---|---|---|---|
| Home \| Lists \| Pantry only; AI/Shopping Mode contextual | Project brief, Figma 03/23 | FIGMA matrix §3, §5 | M1, M4 | Navigation regression test |
| Primary journey P01→P10, Compare Stores optional | Brief Phase 3, Figma 19/22 | FIGMA matrix §3, §5 | M4, M5, M7 | Journey tests, visual comparison |
| Approved tokens and Inter typography | Figma 12/13 | FIGMA matrix §2 | M1 | Token unit tests, visual QA |
| No invented prices / availability | Brief, README | CODEBASE_AUDIT §3.6 | M1 (removal), M7 | Tests: no price without source |
| AI recipes from real Pantry / List / Both, no catalogue or fallbacks | AI recipe requirement | AI_ARCHITECTURE | M3 | Scenarios 1–6 (live, staging) |
| Structured, validated AI output; allergen disclaimers | AI recipe requirement §3 | AI_ARCHITECTURE §7–8 | M3 | Schema + reclassification + allergen tests |
| Add missing ingredients only after review | AI recipe requirement §4, Scenario 4 | AI_ARCHITECTURE §14 | M3 | UI test + Firestore assertion |
| Private keys only in Secret Manager via `defineSecret` | Cloud secrets requirement | SECURITY_CLOUD_SECRETS | M1 (removal), M2–M3 | A1–A6, T1–T9 |
| Credential revocation / rotation | Cloud secrets req. 5, 10 | SECURITY_REMEDIATION_PLAN | Owner (now) | Owner confirmation per C1–C6 |
| Dev / staging / prod separation | Cloud secrets req. 7 | SECURITY_CLOUD_SECRETS §5 | M1 (app), M2 (Firebase) | Build profile check |
| Automated secret scanning | Cloud secrets req. 8 | SECURITY_CLOUD_SECRETS §6 | Done on branch (pending first GitHub run) | `docs/validation/04_security_config_checks.log`, CI run |
| **Free AI demonstration: 3 lifetime credits, race-safe, server-side** | Monetisation requirement §2 | SUBSCRIPTION_ARCHITECTURE §5, AI_ARCHITECTURE §10 | M3 | S1–S7, S19, S20 |
| Free / Standard / Premium entitlements, server-authoritative | Monetisation §1, §4 | SUBSCRIPTION_ENTITLEMENTS | M2 (doc + limits), M6 | S7–S12, S21 |
| Apple auto-renewable subscriptions, one group, restore, manage, billing recovery | IAP requirement | SUBSCRIPTION_ARCHITECTURE §2, §7 | M6 | S8–S18, S22–S23 (sandbox) |
| Privacy-conscious commercial metrics | Monetisation §6 | MONETISATION_STRATEGY §4 | M6, M8 | S26 |
| Account deletion and data export | Brief Phase 7, App Store | CODEBASE_AUDIT §3.2 | M2 | Deletion/export tests; S24 |
| Accessibility (VoiceOver, Dynamic Type, targets, non-colour status) | Brief Phase 7, Figma 23 | FIGMA matrix §2.5 | M4–M8 | Accessibility checklist |
| TestFlight / App Store readiness, no auto-publish | Brief Phase 9 | — | M9 | Owner approval gate |
| Legal, privacy, AI-safety and App Store compliance (UK) | Legal compliance requirement (P0) | `compliance/LEGAL_WORKSTREAM_PLAN.md`, `LEGAL_COMPLIANCE_MATRIX.md` | Docs now; M2, M3, M4, M6, M9 | `LEGAL_RELEASE_GATE.md` G1–G10 |
| Enforced food-safety protections | Legal compliance requirement §6 | `compliance/FOOD_SAFETY_TECHNICAL_SPEC.md` | M3 | FT-01…FT-12 |

## 4. Open owner decisions blocking specific milestones

| Decision | Blocks |
|---|---|
| S1 revoke C1–C6; S2 Firebase project choice | M2, M3 |
| Enable package-registry access for this environment, or accept CI-only execution | M1 executable evidence |
| D3, D4, D10 (fair use, trial anti-abuse, Standard + credits) | M3 credit logic |
| D1, D5, D6, D11 and Apple items O1–O12 | M6 |
| Design approval for C1–C11 and M1–M12 screens | M4–M6 respective screens |
| Firestore region (London `europe-west2` proposed) | M2 |
| Legal owner information O-L1…O-L16 (`compliance/LEGAL_WORKSTREAM_PLAN.md` §3) | Final public documents; App Store metadata |
| DPIA-1, DPIA-2, FS-D1 (allergy storage, religious diets, nutrition estimates) | M3 |
