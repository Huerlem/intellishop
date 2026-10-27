# Codebase Audit — IntelliShop V1 baseline

Baseline: GitHub `Huerlem/intellishop`, branch `main`, commit `0e26321` (2 commits, both 2025-06-06) · Audit branch: `feature/v2-production-rebuild` · Date: 2026-10-27

Status legend — **PASS**: a check ran and succeeded · **FAIL**: a check ran (static or executable) and found a defect · **BLOCKED**: could not run because of an external constraint · **NOT TESTED**: not yet exercised. No runtime feature is marked PASS: the app could not be installed or run in this environment (see `VALIDATION_REPORT.md`).

## 1. Baseline source comparison

| Source | Status | Notes |
|---|---|---|
| GitHub repository | Inspected — full history (2 commits, 101 tracked files) | Public repository |
| Local root directory supplied by the owner | **BLOCKED** | Not reachable from this session (conversation not linked to the owner's computer; no archive attached). Comparison pending; until then GitHub `main` is the development baseline. |

## 2. Stack and configuration

| Item | Value | Assessment |
|---|---|---|
| Framework | Expo SDK `~53.0.9`, React Native `0.79.2`, React `19.0.0`, Expo Router `~5.0.7`, New Architecture enabled | SDK 53 is now listed among *deprecated* changelogs; current SDK is 58 ([Expo upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough.md)). Upgrade required before release. |
| Language | JavaScript/JSX (3 TSX files); `typescript ~5.8.3` installed but no `tsconfig.json` | Migrate incrementally to TypeScript |
| Backend | Firebase JS SDK `^11.8.1` (Auth, Firestore, Storage), project `intellishop-1f62f` | Retain Firebase; no Security Rules in repo |
| Entry point | `package.json` `main: expo-router/entry` | `App.js` and `index.js` are dead (Expo template leftovers) |
| `app.json` | bundle ID `com.huerlem.intellishop`; `supportsTablet: true`; light mode only; slug `intellishop-new` | `supportsTablet` obliges iPad layouts and screenshots — recommend `false` for V2.0. No `ios.infoPlist` usage descriptions although `expo-image-picker` is used; no `expo-image-picker` plugin entry; no EAS `projectId`/`owner` |
| `eas.json` | profiles development / preview / production; `appVersionSource: remote`; production `env` holds 5 provider credentials | **FAIL** — secrets (see `SECURITY_REMEDIATION_PLAN.md`) |
| `babel.config.js` | `module-resolver` alias `@` → repo root | `react-native-dotenv` is a dependency but not configured, so `lib/apiKeys.js` (`import … from '@env'`) cannot resolve — that file is also unused |
| `.gitignore` | Absent | **FAIL** |
| Tests | Jest + `jest-expo` in devDependencies; no `test` script, no Jest config, **0 test files** | **FAIL** (no tests exist) |
| CI | None | — |

## 3. Findings by area

### 3.1 Navigation — FAIL
- No tab navigator exists. `components/navigation/TabBar.jsx` (5 tabs: Home, ShoppingList, Stock, AISuggestion, Profile) is not mounted anywhere.
- `app/(auth)` is a plain Stack of 10 screens; Home links to 6 of them. This contradicts the approved Home | Lists | Pantry architecture.
- Routes to non-existent paths (static evidence): `/(tabs)`, `/tabs/explore`, `/(auth)/RecipeSuggestions`, `/(auth)/SupermarketListDetail`, `/stock/{id}`; `not-found.jsx` calls `navigation.navigate('Home')` (no such route; Expo Router expects `+not-found`).
- `app/(public)/Index.jsx` duplicates the root redirect and routes to `/(tabs)`.
- Route guard: only `app/index.tsx` redirects by auth state; `(auth)` screens have no layout-level guard.
- `FavoriteRecipes.jsx` is unreachable.

### 3.2 Authentication — FAIL (static), runtime NOT TESTED
- Email/password via Firebase Auth (`firebase/authHelpers.js`) — reusable.
- `AuthContext`: `checkSession` is `async`, so the cleanup it returns is a Promise and the `onAuthStateChanged` listener is never unsubscribed. `updateProfile`'s catch references `result`, which is out of scope (TypeScript TS2304, confirmed). `logout`'s failure branch passes the `error` state value instead of the failure.
- Writes the user's UID to AsyncStorage as `userToken` (misleading; unnecessary).
- Logs the email address on login (`authHelpers.js:46`).
- Registration collects phone, street, city, postcode, country — contrary to the approved data-minimisation decision (Figma page 03).
- Google/Apple buttons only call `console.log` — non-functional.
- Terms and Privacy Policy "links" are plain text with no destination.
- **No account deletion** and no data export — App Store and UK GDPR blocker.

### 3.3 Shopping lists — FAIL (data integrity), runtime NOT TESTED
- Top-level `shoppingLists` collection, filtered by `userId`; items stored as an **array field** and rewritten in full from client state on each add/update/remove. Concurrent edits (two devices, or rapid taps) can silently lose items. No Security Rules in the repo to enforce ownership.
- Item IDs from `uuid` v4 — React Native needs a `crypto.getRandomValues` polyfill for `uuid` ≥ 9; none is installed. Risk of a runtime throw on add item: NOT TESTED.
- Reusable: list/item shape, category normalisation, duplicate detection by name, `addMultipleItems`.

### 3.4 Pantry / stock — Modify, runtime NOT TESTED
- `stockItems` top-level collection; model includes `quantity`, `unit`, `minQuantity`, `expiryDate`, `lastPurchaseDate`, `barcode`.
- Running-low (`minQuantity`) and expiring filters exist in `StockScreen.jsx`; "Recently Added" does not.
- `addListItemsToStock` provides the shopping → pantry bridge (approved by Figma page 03 to retain).

### 3.5 AI features — FAIL
Full detail in `AI_RECIPE_AUDIT.md`. Summary:
- Gemini called directly from the client in 6 modules with `EXPO_PUBLIC_GEMINI_API_KEY` (key committed, public).
- Main recipe screen ignores pantry and lists; 4 fallback paths fabricate recipes or deals; recipe detail loads `MOCK_RECIPES`.
- `services/geminiService.js` is a misplaced copy of a React screen. `context/AIContext.jsx` imports 4 functions from it that do not exist (TS2614 ×4, confirmed), so every `AIContext` AI call receives `undefined`.
- `services/notifications.js` (1,440 lines) also calls Gemini to write notification text.

### 3.6 Price comparison — FAIL (fabricated data, unauthorised sources)
- `services/priceComparison.js` prompts Gemini to *"Generate realistic UK supermarket prices"*; local fallback builds prices from a name hash × `Math.random()`, with `inStock: Math.random() > 0.1`.
- `services/freeAPIsPrice.js` attaches estimated prices from Open Food Facts / Spoonacular / USDA product data to named UK retailers (none of these sources provide UK retailer prices).
- ScrapeNinja is used to scrape Google search results; an Apify "supermarket-scraper" actor is invoked. Both are scraping, which the project rules prohibit.
- `services/smartShoppingService.js` asks Gemini for "estimated item price in GBP" and has hard-coded fallback items/prices.
- **Decision:** remove all of these paths. No price is shown unless it comes from a licensed source or the user.

### 3.7 Persistence and offline — FAIL / NOT TESTED
- No Firestore cache configuration; no offline queue. Behaviour offline is untested.
- Device-local AsyncStorage stores used for recipe cache, favourites (three different keys), supermarket lists and smart lists — not tied to the account, lost on reinstall, not covered by deletion/export.

### 3.8 Error handling and logging — Modify
- `errors/ErrorBoundary.jsx` mounted at root — reusable.
- `errors/errorHandler.jsx` provides error codes — reusable after review.
- 473 `console.*` calls, several printing prompts, AI responses and pantry contents.

### 3.9 Notifications — Remove/rebuild later
- `services/notifications.js` uses `expo-permissions` (deprecated) and Gemini; its only consumer `hooks/useNotifications.js` is itself unused and imports a non-existent named export (TS2614).

### 3.10 Accessibility — FAIL
- 6 `accessibilityLabel` occurrences in the whole app; 15 font sizes below 12; colour-only status badges. Dynamic Type behaviour NOT TESTED.

### 3.11 Visual system — FAIL
- 0 uses of approved Figma colour tokens; 83 distinct hard-coded hex colours; Poppins instead of Inter (see `FIGMA_IMPLEMENTATION_MATRIX.md` §2.5).

### 3.12 Other static defects (TypeScript, `docs/validation/02_tsc_static.log`)
- `app/(auth)/recipe/[id].jsx:184` references undeclared `currentList` → `ReferenceError` when adding a recipe to a list (optional chaining does not protect undeclared identifiers).
- `hooks/usePriceComparison.js` imports a non-existent named export (the service only has a default export).
- `firebase/batch.js` imports `./firebase`, which does not exist.
- `app/(auth)/SupermarketListsScreen.jsx:688` duplicate style key (TS1117).
- `services/notifications.js:1253` tests a `void` expression for truthiness (TS1345).

## 4. Module decisions

| Module | Decision | Reason |
|---|---|---|
| `firebase/config.js` | **Refactor** | Keep initialisation; move config to per-environment app config; add App Check |
| `firebase/authHelpers.js` | **Retain + extend** | Working pattern; add delete-account, reauth, email verification |
| `firebase/models.js` | **Refactor** into typed models | Useful field inventory |
| `firebase/firestoreHelpers.js` (1,005 lines) | **Remove** | Not imported anywhere |
| `firebase/batch.js` | **Remove** | Not imported; broken import |
| `firebase/storageHelpers.js` | **Retain** (profile image) | Used by Profile |
| `context/AuthContext.jsx`, `hooks/useAuth.js` | **Refactor** | Fix listener leak and scope bugs; merge duplicate `useAuth` |
| `context/ShoppingListContext.jsx`, `hooks/useShoppingList.js` | **Refactor** | Per-item documents, subcollections, offline-safe writes |
| `context/StockContext.jsx`, `hooks/useStock.js` | **Refactor** → Pantry | Keep fields and list → pantry bridge |
| `context/AIContext.jsx`, `hooks/useAIFeatures.js`, `context/RecipeContext.jsx`, `hooks/useRecipes.js`, `hooks/useSmartShopping.js` | **Replace** | Broken imports, client-side keys |
| `lib/gemini.js`, `services/*` (all 6), `lib/apiKeys.js`, `*-backup`/`*-BACKUP` | **Remove** | Client-side keys, fabricated data, scraping, dead code |
| `hooks/usePriceComparison.js`, `hooks/useNotifications.js`, `hooks/useSupermarketLists.js` | **Remove** | Unused or out of IA |
| `errors/ErrorBoundary.jsx`, `errors/errorHandler.jsx`, `utils/globalErrorHandler.js` | **Retain + review** | Root boundary works structurally; strip PII from logs |
| `utils/jsonUtils.js`, `utils/iconMapper.js`, `utils/WebCompatibleIcons.js`, `utils/analytics.js` (empty) | **Remove** | Superseded / empty |
| `components/ui/*` (Button, Card, Input, Modal) | **Refactor** to Figma components | Variant structure exists |
| `components/shopping/*` | **Refactor** (List Item, Add Items) / **Replace** (`SmartShopping*`) | — |
| `components/stock/*` | **Refactor** → Pantry Item | — |
| `components/recipes/*` | **Refactor** (RecipeCard, RecipeFilters, SelectListModal) / **Remove** (`recipes/RecipeSuggestion.jsx`, `ai/RecipeSuggestion.jsx` duplicates) | — |
| `components/PriceComparison/*` | **Remove** | Fabricated-data UI |
| `components/auth/*` | **Retain** PasswordStrengthIndicator, TermsCheckbox; **Rework** SocialLoginButtons (real Sign in with Apple or remove) | — |
| `components/common/*` | **Retain** ConfirmModal, LoadingSpinner (restyle) | — |
| `app/(public)/*` | **Refactor** | Reduce registration fields |
| `app/(auth)/*` | **Restructure** into `(tabs)` Home / Lists / Pantry + contextual stacks | — |
| `App.js`, `index.js`, `app/(public)/Index.jsx`, `app/(auth)/index.jsx` | **Remove** | Dead or broken redirects |

## 5. Dependencies (static review — `npm audit` BLOCKED)

| Group | Packages | Action |
|---|---|---|
| Not imported by any source file (25) | `@expo/metro-runtime`*, `@gorhom/bottom-sheet`, `@react-native-community/datetimepicker`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`, `@react-navigation/stack`, `expo-app-loading`, `expo-blur`, `expo-camera`, `expo-crypto`, `expo-haptics`, `expo-linking`*, `expo-location`, `expo-secure-store`, `expo-symbols`, `expo-web-browser`, `lottie-react-native`, `openai`, `react-native-chart-kit`, `react-native-dotenv`, `react-native-exception-handler`, `react-native-reanimated`*, `react-native-uuid`, `react-native-webview`, `zustand` | Remove unless a V2 feature needs them. *Some are peer/runtime requirements of Expo Router or gestures — keep those that `npx expo install --check` requires after the SDK upgrade. |
| Deprecated | `expo-app-loading`, `expo-permissions` | Remove |
| Security-sensitive | `@google/generative-ai`, `openai` (client-side AI) | Remove from the app |
| Unconfigured | `react-native-dotenv` | Remove |
| Duplicates | `uuid` + `react-native-uuid` | Keep one (with RN-safe random source) |

A full `npm audit` and `npx expo install --check` must run once the registry is reachable.

## 6. Reusable assets
- `assets/icon.png`, `assets/splash-icon.png`, `assets/adaptive-icon.png`, `assets/images/logo-100.png` — V1 branding. App icon/launch assets must be re-derived from the approved brand (Figma); provenance of the V1 PNGs is undocumented.
