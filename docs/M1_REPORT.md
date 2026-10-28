# M1 — Secure, Buildable Baseline — Report

Branch: `feature/v2-production-rebuild` · Date: 2026-10-28 · Authorised by owner on 2026-10-27 (conditional approval)
Scope: `docs/IMPLEMENTATION_ROADMAP.md` §2. Out of scope and not started: M2, paywall, production AI providers.

## Status: **IMPLEMENTED — NOT YET PASS**

M1 is not PASS until the new dependency graph is installed from the official npm registry, `package-lock.json` is committed, and the GitHub Actions `CI` workflow succeeds on that commit (owner's conditions of 2026-10-28). Neither can happen from this environment: the npm registry is blocked by the egress proxy (re-confirmed 2026-10-28 07:39, E403) and this session has no write access to `Huerlem/intellishop`. The branch is delivered as a verified Git bundle; publication and the first CI run need the owner (`OWNER_ACTIONS_BEFORE_M2.md` §A).

### Commits on the branch (oldest first, after V1 `0e26321`)

| Commit | Content |
|---|---|
| `8b4e852` | Design handoff package and AI recipe requirement audit (docs) |
| `3e8a9b0` | Credentials removed from `eas.json`; `.gitignore`, `.env.example`, gitleaks config |
| `92ad1ea` | Monetisation, subscription, roadmap docs |
| `e7b52ea` | **M1 implementation** (files listed in §1) |
| `4924919` | Line-ending normalisation only (`.gitattributes`); `git diff --ignore-cr-at-eol` shows no content change |
| `948e059` | Fix password reset; restore `react-dom` (required peer); EAS project link; CRUD regression tests |
| `e7824ca` | CI hardening: lockfile workflow, `npm ci` only, audit gate, verified gitleaks, static checks |
| `9ecbd27` | No on-device error-log persistence; legacy keys cleared; `expo-application` removed; dependency and snapshot reports |
| `b9f39d5` | Doc correction |
| *(this commit)* | Reports and validation logs updated |

**Reviewing `e7b52ea`:** the M1 commit mixed real changes with CRLF→LF conversion of some files. Use `git diff --ignore-cr-at-eol 92ad1ea e7b52ea` (semantic change: 2,074 insertions, 31,189 deletions) or review from `4924919` onwards, where all text files are LF.

### Response to the M1 technical review (2026-10-28)

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Bundle with exact M1 commit `e7b52ea` and full ancestry, verified | Done — bundle head is the latest branch commit; `e7b52ea` is an ancestor; `git bundle verify` passes | `intellishop-feature-v2.bundle-verify.log` (delivered with the bundle; produced after the final commit) |
| 1 | Windows publication instructions without touching `main` | Done | `OWNER_ACTIONS_BEFORE_M2.md` §A |
| 1 | Run GitHub Actions and fix failures | **BLOCKED** — needs the branch on GitHub | — |
| 2 | Validate SDK 58 graph on the official registry; commit lockfile; `npm ci` thereafter | **BLOCKED** here; automated by the new *Generate lockfile* workflow; CI now *requires* the lockfile and only uses `npm ci` | `.github/workflows/lockfile.yml`, `ci.yml` |
| 2 | Compatibility of React Native, Firebase Auth persistence, Expo Router, Reanimated, Gesture Handler, Jest, RNTL | Verified against upstream sources; two real defects found and fixed (`react-dom` peer; GH3 `Swipeable`) | `DEPENDENCY_MIGRATION_REPORT.md` §3 |
| 3 | `expo-doctor`, `npm audit` results with exit codes | **BLOCKED** (registry). Static `expo-doctor` emulation: no issues. CI gate fails on high/critical production advisories | `DEPENDENCY_MIGRATION_REPORT.md` §3.11, §4 |
| 4 | Auth, registration, profile, list CRUD, pantry CRUD operational | Logic verified by executed tests on the archived SDK 53 toolchain (9/9) against an in-memory Firestore; **password reset was broken since V1 — fixed**; no device run yet | `08_proxy_jest_crud_sdk53.log`, `10_static_regression_checks.log` |
| 4 | No broken links after removing AI/price routes | 19/19 navigation targets resolve; 0 references to removed routes | `10_static_regression_checks.log` |
| 5 | Snapshot preserved and analysed | Preserved; not merged; one improvement adopted | `WIP_SNAPSHOT_ANALYSIS.md` |
| 6 | Workflow URLs, job results, lockfile, CI logs | **Pending owner push** | — |

## 1. Files

Lists below describe commit `e7b52ea`. Added by later commits: `.gitattributes`, `.gitleaksignore`, `.github/workflows/lockfile.yml`, `scripts/check-lockfile-registry.mjs`, `scripts/audit/check_{imports,named_imports,contracts,routes}.py`, `test-utils/memoryFirestore.ts`, `__tests__/shoppingList.crud.test.tsx`, `__tests__/pantry.crud.test.tsx`, `docs/DEPENDENCY_MIGRATION_REPORT.md`, `docs/WIP_SNAPSHOT_ANALYSIS.md`, `docs/validation/06–13`. Modified by later commits: `app/(public)/forgot-password.jsx`, `app.config.ts`, `package.json`, `errors/errorHandler.jsx`, `context/AuthContext.jsx`, `.github/workflows/ci.yml`, `.github/workflows/secret-scan.yml`, `__tests__/auth.context.test.tsx`.

### Removed (50)
| Group | Files |
|---|---|
| Client-side AI (embedded keys) | `lib/gemini.js`, `lib/apiKeys.js`, `lib/openai.js-backup`, `services/geminiService.js`, `services/recipeApiService.js`, `services/smartShoppingService.js`, `services/notifications.js`, `services/openai.js-BACKUP`, `context/AIContext.jsx`, `context/RecipeContext.jsx`, `hooks/useAIFeatures.js`, `hooks/useRecipes.js`, `hooks/useSmartShopping.js`, `components/ai/AIGreeting.jsx`, `components/ai/RecipeSuggestion.jsx` |
| Fabricated prices / scraping | `services/priceComparison.js`, `services/freeAPIsPrice.js`, `hooks/usePriceComparison.js`, `components/PriceComparison/ProductPriceCard.jsx`, `components/PriceComparison/StoreComparison.jsx`, `app/(auth)/Price-Comparison.jsx`, `app/(auth)/SmartShoppingListScreen.jsx`, `components/shopping/SmartShoppingItem.jsx`, `components/shopping/SmartShoppingSummary.jsx` |
| Mock / fallback recipes (rebuilt in M3 with the secure backend) | `app/(auth)/RecipeSuggestionScreen.jsx`, `app/(auth)/recipe/[id].jsx`, `app/(auth)/recipe/_layout.jsx`, `app/(auth)/FavoriteRecipes.jsx`, `components/recipes/RecipeSuggestion.jsx` |
| Outside V2 IA | `app/(auth)/SupermarketListsScreen.jsx`, `hooks/useSupermarketLists.js`, `components/navigation/TabBar.jsx` (5-tab, never mounted) |
| Non-functional UI | `components/auth/SocialLoginButtons.tsx` (buttons only called `console.log`) |
| Dead code / broken routing | `App.js`, `index.js`, `app/index.tsx`, `app/(public)/Index.jsx`, `app/(auth)/index.jsx`, `app/(auth)/_layout.jsx`, `app/_layout.jsx` (→ `.tsx`), `app/not-found.jsx` (→ `+not-found.tsx`), `firebase/firestoreHelpers.js`, `firebase/batch.js`, `hooks/useNotifications.js`, `utils/analytics.js` (empty), `utils/jsonUtils.js`, `utils/iconMapper.js`, `utils/globalErrorHandler.js` |
| Replaced | `app.json` (→ `app.config.ts`), `package-lock.json` (SDK 53 lock; regenerated by CI from the official registry — see §2) |

### Moved (4)
`app/(auth)/HomeScreen.jsx → src/screens/HomeScreen.jsx`, `app/(auth)/Shopping_list.jsx → src/screens/ListsScreen.jsx`, `app/(auth)/StockScreen.jsx → src/screens/PantryScreen.jsx`, `app/(auth)/ProfileScreen.jsx → src/screens/ProfileScreen.jsx` — retained V1 screens mounted as tab roots until their Figma rebuild in M4.

### Created (26)
| Area | Files |
|---|---|
| Navigation | `app/_layout.tsx`, `app/+not-found.tsx`, `app/(app)/_layout.tsx`, `app/(app)/(tabs)/_layout.tsx`, `app/(app)/(tabs)/index.tsx`, `app/(app)/(tabs)/lists.tsx`, `app/(app)/(tabs)/pantry.tsx`, `app/(app)/profile.tsx`, `src/navigation/RootStack.tsx`, `src/navigation/TabsLayout.tsx`, `src/navigation/routes.ts` |
| Design foundation | `src/theme/tokens.ts`, `src/theme/typography.ts`, `src/theme/index.ts` |
| Configuration | `app.config.ts`, `tsconfig.json`, `eslint.config.js`, `context/AuthContext.types.ts`, `src/screens/ConfigurationErrorScreen.tsx` |
| CI / tooling | `.github/workflows/ci.yml`, `scripts/scan-bundle-for-secrets.mjs` |
| Tests | `__tests__/theme.tokens.test.ts`, `__tests__/navigation.test.tsx`, `__tests__/auth.context.test.tsx`, `__tests__/security.static.test.ts` |
| Evidence | `docs/validation/05_m1_local_checks.log` |

### Modified (37) — main changes
| File | Change |
|---|---|
| `package.json` | Expo SDK 58 versions; packages removed, added and pinned as listed in `DEPENDENCY_MIGRATION_REPORT.md` (final graph after the later commits: 39 packages, 37 V1 packages removed, `react-dom` kept at 19.3.0) |
| `babel.config.js`, `metro.config.js` | Metro uses `expo/metro-config` defaults (V1 custom resolver removed) |
| `firebase/config.js` | No hard-coded project config; reads public `EXPO_PUBLIC_FIREBASE_*` per environment; exposes `isFirebaseConfigured` |
| `firebase/authHelpers.js` | `useAuthState` → `subscribeToAuthState` (not a hook); email no longer logged |
| `context/AuthContext.jsx`, `hooks/useAuth.js` | Listener now unsubscribed; `initialising` state for the guard; out-of-scope `result` and wrong `error` fixed; UID no longer written to AsyncStorage (legacy key cleared); typed via JSDoc |
| `app/(public)/LoginScreen.jsx` | **Removed logging of email and password**; redirect handled by the guard |
| `app/(public)/RegisterScreen.jsx` | Password no longer copied into `userData` state; fake social buttons removed |
| `src/screens/HomeScreen.jsx` | AI greeting and links to removed features removed; plain greeting; routes to tabs; avatar → Profile; accessibility labels |
| `src/screens/ListsScreen.jsx`, `src/screens/PantryScreen.jsx` | Price-comparison and fake share actions removed; tab-safe navigation; Pantry naming |
| `src/screens/ProfileScreen.jsx` | Calls the real `updateProfile` and checks its result (V1 called a non-existent `updateUser` and always showed "success"); AI toggle removed; image-picker options fixed (`allowsEditing`, `mediaTypes: ['images']`) |
| `components/shopping/ShoppingListItem.jsx` | `Swipeable` (no longer exported by gesture-handler 3) → `ReanimatedSwipeable`; compare-price button only with a handler |
| `components/shopping/ShoppingListCard.jsx` | Compare and share buttons only when a real handler exists |
| `errors/ErrorBoundary.jsx` | No `expo-updates` dependency; "Try again" resets the boundary |
| `errors/errorHandler.jsx` | Stores only mapped messages (raw messages can contain emails) |
| `context/ShoppingListContext.jsx`, `firebase/models.js`, `firebase/storageHelpers.js` | `uuid` → `expo-crypto` `randomUUID()` (no polyfill needed) |
| 22 UI files | `Poppins_*` → `Inter_*` faces; V1 primary `#4B0082` → approved `#4338CA` |
| `.env.example`, security & subscription docs | Corrected Firebase key guidance; owner decisions D1–D11 recorded |

## 2. Dependency versions

See `DEPENDENCY_MIGRATION_REPORT.md` (V1 vs M1 for all 77 packages, reasons, compatibility evidence). Summary of the declared M1 graph (39 packages): expo ~58.0.20, react 19.3.0, react-dom 19.3.0, react-native 0.88.0, expo-router ~58.0.27, react-native-reanimated 4.7.1 + react-native-worklets 0.13.0, react-native-gesture-handler ~3.3.0, firebase 11.10.0, typescript ~6.0.3, jest ^30.5.2 + jest-expo ~58.0.12, @testing-library/react-native ^14.1.0, eslint ^9.39.5 + eslint-config-expo ~58.0.4. **Resolved** versions will come from the CI-generated lockfile; none are claimed before that.

## 3. Tests and results

| Suite | SDK 58 (CI) | Executed here (archived SDK 53 toolchain — proxy evidence) |
|---|---|---|
| `theme.tokens.test.ts` (32 tests: 23 colours, 18 numbers, 10 Inter styles vs Figma) | NOT TESTED | PASS — part of 46/46 (`07_proxy_jest_sdk53.log`) |
| `security.static.test.ts` (14 tests) | NOT TESTED | PASS — part of 46/46 |
| `auth.context.test.tsx` (4 tests: initial state, listener unsubscribe, update failure, legacy data cleared) | NOT TESTED | PASS with local Testing Library shim (`08_proxy_jest_crud_sdk53.log`); mutation check proves the unsubscribe test fails on the V1 bug (`09_mutation_check_auth_listener.log`) |
| `shoppingList.crud.test.tsx` (3 tests) | NOT TESTED | PASS with shim |
| `pantry.crud.test.tsx` (2 tests) | NOT TESTED | PASS with shim |
| `navigation.test.tsx` (5 tests: 3 tabs only, guard, tab switching, contextual Profile, sign-out) | NOT TESTED | Not runnable here (needs expo-router 58 testing library + RNTL 14) |
| Static checks: imports (317), named imports (106), context contracts, routes (19) | NOT TESTED (added to CI) | PASS (`10_static_regression_checks.log`) |
| `tsc --noEmit` | NOT TESTED | 17 diagnostics, all caused by packages absent from the archive (`06_proxy_tsc_sdk53.log`) |
| Babel compile of every source file | — | PASS, 69/69 (`13_proxy_babel_parse_sdk53.log`) |
| ESLint, `expo install --check`, `expo-doctor`, `npm audit`, iOS bundle export + credential scan | NOT TESTED | BLOCKED (registry) |
| gitleaks full history / new commits / tree | CI | Run here with verified binary: historical findings only in `0e26321`; 0 after; synthetic new key detected (`11_gitleaks.log`) |
| actionlint + shellcheck on workflows | — | PASS (`12_actionlint.log`) |
| iOS development build / device | BLOCKED (Apple Developer + Expo accounts; no macOS) | — |

## 4. GitHub Actions status

| Workflow | Trigger | Status |
|---|---|---|
| `CI` (`ci.yml`) | push, PR, manual | **Not run** — branch not on GitHub. Requires `package-lock.json`; fails fast with instructions if missing |
| `Generate lockfile` (`lockfile.yml`) | manual only; refuses `main` | **Not run** — resolves from registry.npmjs.org, commits the lockfile, then starts CI and Secret scan |
| `Secret scan` (`secret-scan.yml`) | push, PR, manual | **Not run** — same scan already executed locally with the same gitleaks version and ignore file: exit 0 |

No workflow URL can be reported until the owner publishes the branch.

## 5. Security remediation progress

| Item | Status |
|---|---|
| Credentials removed from `eas.json` (S4) | Done (commit `3e8a9b0`) |
| `.gitignore`, `.env.example`, gitleaks config (S3, S6) | Done; first GitHub run pending |
| Client-side AI code and `@google/generative-ai` / `openai` dependencies removed (S5, A2) | Done in source — **A2 PASS pending CI** (bundle scan + tests) |
| Hard-coded Firebase configuration removed from source | Done (still in Git history of `main`) |
| Password and email logging removed; raw error messages no longer persisted; UID no longer stored in AsyncStorage | Done |
| Revocation / rotation of C1–C6 (S1) | **BLOCKED — owner action** (instructions: `OWNER_ACTIONS_BEFORE_M2.md` §B) |
| Firebase project decision (S2) | Owner decision recorded: keep `intellishop-1f62f` as provisional legacy source, subject to ownership/security verification |
| History rewrite / force-push (S7) | Not done (not approved) |
| Secret Manager functions, Rules, App Check (S8, S9) | M2–M3 |
| On-device error-log persistence removed; V1 `errorLogs` and `userToken` keys cleared at start-up | Done (`9ecbd27`), covered by a test |
| Secret scanning: verified gitleaks 8.30.1, full history, historical findings baselined by fingerprint (no values) | Done; local run exit 0; synthetic new key detected |
| Owner's local `.env` (same five credentials, committed in local-only history) | Owner to delete after revocation |

## 6. Figma conformance progress

| Area | Status |
|---|---|
| Tokens: 23 colours, 18 numbers, 1 elevation, 10 text styles | Implemented in `src/theme` with exact Figma values (unit tests pending CI) |
| Inter typography | Loaded (`@expo-google-fonts/inter`); all 44 Poppins references replaced; 0 remain |
| Bottom navigation | Exactly Home \| Lists \| Pantry, tokenised, standard accessible tab bar |
| Profile | Contextual from the avatar, not a tab |
| Legacy colours | 53 distinct hard-coded colours remain in V1 screens/components (V1 had 83); V1 primary replaced by `#4338CA` |
| Screens P01–P10 | Not yet conformant — V1 layouts retained as tab roots; rebuild in M4 |
| Accessibility | `accessibilityLabel` occurrences 6 → 16; full audit in M8 |

## 7. Known limitations introduced or kept deliberately

- **Recipes, AI suggestions and price comparison are unavailable on this branch** until M3/M7 rebuild them on the secure backend with real data. They were removed because they used embedded keys, fabricated prices or mock recipes; no placeholder was substituted.
- Terms and Privacy Policy links on the registration screen still have no destination (no published URLs yet — owner action O11).
- Registration still collects phone and address (data-minimisation change is M2).
- **Lint debt:** React Compiler lint rules (`react-hooks/static-components`, `set-state-in-effect`, …) are warnings, not errors, for V1 `.js/.jsx` files only; they are errors for all TypeScript. Count will be reported from the first CI lint log and must reach zero in the M4 rebuild.
- The app needs the public Firebase web configuration per environment (`.env.example`); without it, it shows a configuration screen instead of crashing.
- Retained V1 contexts still log user IDs and list names to the console (`console.log`); cleanup with the data-model rewrite in M2.
- The archived toolchain checks are proxy evidence on SDK 53 (React 19.0, RN 0.79); SDK 58 behaviour is confirmed only by CI.

## 8. Unexplained working-tree snapshot

Preserved on `wip/unverified-uncommitted-snapshot` (`fe42954`), included in the bundle, not merged. Full comparison and recommendation: `WIP_SNAPSHOT_ANALYSIS.md` (an earlier, incomplete attempt at the same scope; its error-logging privacy change was adopted).

## 9. Owner's local project (uploaded archive, 2026-10-28)

| Finding | Detail | Action |
|---|---|---|
| Same source as GitHub | 100 files identical to GitHub `main` after normalising line endings; the 93 "modified" files in local `git status` are CRLF-only | GitHub `main` remains the baseline |
| Separate local Git history | Branch `master`, 6 commits (2025-05-27 → 2025-06-06), **no remote** | Not imported; nothing in it is missing from the branch |
| Local-only files | `.env`, `.gitignore`, `.vscode/settings.json`, `app.config.js`, `polyfills.js`, `tsconfig.json`, plus generated `android/` and `.expo/` | See below |
| `.env` committed in local history (`31db6b7`) | Contains the **same five** credentials already exposed in GitHub `eas.json` (compared by value, not printed); no additional credential | Delete the local `.env` after revocation (§B of owner actions); never push the local repository |
| `app.config.js` | EAS project ID `ad1df46f-…` with slug `intellishop`; also put `OPENAI_API_KEY` into `extra` (would ship in the app manifest) | Project ID and slug adopted in `app.config.ts`; `extra` secrets not carried over |
| `polyfills.js` | `crypto.getRandomValues` implemented with `Math.random` (not secure); not imported | Not carried over; M1 uses `expo-crypto` |
| `node_modules` (SDK 53) | Used only for the proxy checks in §3 | — |
