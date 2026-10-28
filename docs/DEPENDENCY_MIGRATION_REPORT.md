# Dependency Migration Report — Expo SDK 53 → 58

Branch: `feature/v2-production-rebuild` · Updated 2026-10-28 · Baseline: V1 `main` @ `0e26321` (identical to the owner's local project except for the files listed in `M1_REPORT.md` §9).

**Status: dependency graph declared and statically verified — NOT YET INSTALLED OR VALIDATED.** The npm registry is blocked in this environment (HTTP 403 from the egress proxy, re-confirmed 2026-10-28 07:39). Installation, `package-lock.json` generation, `npx expo install --check`, `npx expo-doctor`, ESLint, the full Jest suite with SDK 58, `npm audit --omit=dev` and the iOS bundle export run in GitHub Actions once the branch is published (`OWNER_ACTIONS_BEFORE_M2.md` §A). Nothing below is reported as PASS on behalf of those steps.

## 1. Method

- **Target:** Expo SDK 58 (latest SDK; SDK 53 is listed among deprecated SDK changelogs in the Expo upgrade guide).
- **Source of versions:** `packages/expo/bundledNativeModules.json` on branch `sdk-58` of `github.com/expo/expo` (the same data `npx expo install` uses), the SDK 58 project templates, and release tags of each upstream repository. The npm registry could not be queried.
- **Rule:** keep a package only if the code imports it, a kept package requires it as a peer, or tooling needs it. Do not move to `latest` majors unless required (Firebase stays on 11.x; ESLint on 9.x).
- **Verification performed here** (§4): static emulation of `expo-doctor` checks, peer-dependency analysis from upstream manifests, import/export resolution, and partial *executable* checks with the owner's archived SDK 53 `node_modules` (clearly labelled as proxy evidence).

## 2. Original and final versions

| Package | Type | V1 (main) | V2 M1 | Change | Reason / note |
|---|---|---|---|---|---|
| `@babel/core` | dev | ^7.27.3 | ^7.27.3 | unchanged |  |
| `@babel/plugin-transform-modules-commonjs` | dev | ^7.27.1 | — | removed | Unused (babel-preset-expo handles module transforms) |
| `@expo-google-fonts/inter` | dep | — | ^0.4.2 | added | Figma V2 typography (Inter) |
| `@expo-google-fonts/poppins` | dep | ^0.4.0 | — | removed | Replaced by @expo-google-fonts/inter (Figma V2 typography) |
| `@expo/metro-runtime` | dep | ~5.0.4 | ~58.0.15 | updated |  |
| `@expo/vector-icons` | dep | ^14.1.0 | ^15.0.2 | updated |  |
| `@google/generative-ai` | dep | ^0.24.1 | — | removed | Security: client-side AI with embedded key; AI moves to Cloud Functions (M3) |
| `@gorhom/bottom-sheet` | dep | ^5.1.5 | — | removed | Never imported |
| `@react-native-async-storage/async-storage` | dep | 2.1.2 | 2.2.0 | updated |  |
| `@react-native-community/datetimepicker` | dep | 8.3.0 | — | removed | Never imported |
| `@react-native/jest-preset` | dev | — | ^0.88.0 | added | Required peer of jest-expo 58 |
| `@react-navigation/bottom-tabs` | dep | ^7.3.13 | — | removed | Never imported; conflicts with expo-router (expo-doctor ExpoRouterReactNavigationCheck) |
| `@react-navigation/native` | dep | ^7.1.9 | — | removed | Only used for useNavigation in two removed/rewritten screens; expo-router provides navigation |
| `@react-navigation/native-stack` | dep | ^7.3.13 | — | removed | Never imported; expo-router dependency check |
| `@react-navigation/stack` | dep | ^7.3.2 | — | removed | Never imported; expo-router dependency check |
| `@testing-library/react-native` | dev | — | ^14.1.0 | added | Component, hook and router tests (expo-router/testing-library peer) |
| `@types/jest` | dev | ^29.5.14 | ^30.0.0 | updated |  |
| `@types/react` | dev | ~19.0.10 | ~19.3.0 | updated |  |
| `@types/react-test-renderer` | dev | ^19.1.0 | — | removed | react-test-renderer replaced by test-renderer (Testing Library 14) |
| `axios` | dep | ^1.9.0 | — | removed | Used only by removed scraping/price modules; banned in app code (ESLint) |
| `babel-plugin-module-resolver` | dev | ^5.0.2 | ^5.0.2 | unchanged |  |
| `eslint` | dev | — | ^9.39.5 | added | Linting (v9; eslint-plugin-import in eslint-config-expo does not target v10) |
| `eslint-config-expo` | dev | — | ~58.0.4 | added | Expo flat ESLint config for SDK 58 |
| `expo` | dep | ~53.0.9 | ~58.0.20 | updated |  |
| `expo-app-loading` | dep | ^2.1.1 | — | removed | Deprecated; flagged by expo-doctor DirectPackageInstallCheck; expo-splash-screen used instead |
| `expo-blur` | dep | ~14.1.4 | — | removed | Never imported |
| `expo-camera` | dep | ~16.1.7 | — | removed | Never imported (barcode scanning is out of approved scope) |
| `expo-constants` | dep | ~17.1.6 | ~58.0.13 | updated |  |
| `expo-crypto` | dep | ~14.1.4 | ~58.0.7 | updated |  |
| `expo-dev-client` | dep | ~5.1.8 | ~58.0.16 | updated |  |
| `expo-device` | dep | ~7.1.4 | — | removed | Used only by removed notifications service |
| `expo-font` | dep | ~13.3.1 | ~58.0.10 | updated |  |
| `expo-haptics` | dep | ~14.1.4 | — | removed | Never imported |
| `expo-image-picker` | dep | ~16.1.4 | ~58.0.10 | updated |  |
| `expo-linear-gradient` | dep | ~14.1.4 | ~58.0.3 | updated |  |
| `expo-linking` | dep | ~7.1.5 | ~58.0.14 | updated |  |
| `expo-location` | dep | ~18.1.5 | — | removed | Never imported |
| `expo-modules-core` | dep | ~2.4.0 | — | removed | Must not be installed directly (expo-doctor DirectPackageInstallCheck) |
| `expo-notifications` | dep | ~0.31.2 | — | removed | Used only by removed notifications service (rebuilt later with consent) |
| `expo-permissions` | dep | ^14.4.0 | — | removed | Deprecated; flagged by expo-doctor DirectPackageInstallCheck |
| `expo-router` | dep | ~5.0.7 | ~58.0.27 | updated |  |
| `expo-secure-store` | dep | ~14.2.3 | — | removed | Never imported |
| `expo-splash-screen` | dep | ~0.30.8 | ~58.0.11 | updated |  |
| `expo-status-bar` | dep | ~2.2.3 | ~58.0.4 | updated |  |
| `expo-symbols` | dep | ~0.4.4 | — | removed | Never imported |
| `expo-system-ui` | dep | ~5.0.7 | — | removed | Never imported; no expo-doctor rule requires it for an iOS-only light-mode app |
| `expo-updates` | dep | ~0.28.13 | — | removed | Only used by ErrorBoundary reload, which had no updates configuration; removed with that code path |
| `expo-web-browser` | dep | ~14.1.6 | — | removed | Never imported |
| `firebase` | dep | ^11.8.1 | 11.10.0 | updated | Pinned to final 11.x; RN auth persistence verified (see §3.1) |
| `formik` | dep | ^2.4.6 | ^2.4.6 | unchanged |  |
| `globals` | dev | — | ^16.0.0 | added | Node globals for scripts and config files in ESLint |
| `jest` | dev | ^29.7.0 | ^30.5.2 | updated |  |
| `jest-expo` | dev | ^53.0.5 | ~58.0.12 | updated |  |
| `lottie-react-native` | dep | ^7.2.2 | — | removed | Never imported |
| `openai` | dep | ^4.103.0 | — | removed | Security: client-side AI SDK |
| `react` | dep | 19.0.0 | 19.3.0 | updated |  |
| `react-dom` | dep | 19.0.0 | 19.3.0 | updated | Required peer of @radix-ui/react-tabs (expo-router 58 dependency); pinned to SDK 58 version |
| `react-native` | dep | 0.79.2 | 0.88.0 | updated |  |
| `react-native-chart-kit` | dep | ^6.12.0 | — | removed | Never imported |
| `react-native-dotenv` | dep | ^3.4.11 | — | removed | Never configured in Babel; its only importer (lib/apiKeys.js) was removed |
| `react-native-exception-handler` | dep | ^2.10.10 | — | removed | Never imported |
| `react-native-gesture-handler` | dep | ~2.24.0 | ~3.3.0 | updated |  |
| `react-native-reanimated` | dep | ^3.17.5 | 4.7.1 | updated |  |
| `react-native-safe-area-context` | dep | 5.4.0 | ~5.10.1 | updated |  |
| `react-native-screens` | dep | ~4.10.0 | ~4.30.0 | updated |  |
| `react-native-svg` | dep | ^15.12.0 | — | removed | Never imported |
| `react-native-uuid` | dep | ^2.0.3 | — | removed | Duplicate of uuid; replaced by expo-crypto randomUUID() |
| `react-native-web` | dep | ^0.20.0 | — | removed | Web is not a target; optional peer of expo and expo-router |
| `react-native-webview` | dep | 13.13.5 | — | removed | Never imported (optional peer of expo) |
| `react-native-worklets` | dep | — | 0.13.0 | added | Required by Reanimated 4 and imported by ReanimatedSwipeable |
| `react-test-renderer` | dev | ^19.0.0 | — | removed | Replaced by test-renderer, required by @testing-library/react-native 14 |
| `test-renderer` | dev | — | ^1.0.0 | added | Required peer of @testing-library/react-native 14 |
| `typescript` | dev | ~5.8.3 | ~6.0.3 | updated |  |
| `uuid` | dep | ^11.1.0 | — | removed | Replaced by expo-crypto randomUUID() (uuid >= 9 needs a crypto polyfill on React Native) |
| `yup` | dep | ^1.6.1 | ^1.6.1 | unchanged |  |
| `zustand` | dep | ^5.0.5 | — | removed | Never imported |


Totals: 68 packages in V1 → 39 in M1 (37 removed, 8 added, 27 updated, 4 unchanged). `expo-application` was added in the first M1 commit because `errors/errorHandler.jsx` imported it without declaring it; it was removed again when on-device error-log persistence was dropped (it is no longer imported). `expo-system-ui` is not retained: the earlier unverified snapshot added it, but no SDK 58 `expo-doctor` check requires it for an iOS-only, light-mode app (only a native-sync advisory for projects with committed `ios/`/`android/` folders, which this project does not have).

## 3. Compatibility findings (verified against upstream sources)

| # | Area | Finding | Evidence | Action |
|---|---|---|---|---|
| 3.1 | Firebase Auth persistence | `firebase/auth` re-exports `@firebase/auth`, whose `exports["."]` has a `react-native` condition (`dist/rn/index.js`) exporting `getReactNativePersistence`. Metro (package exports on, `react-native` condition) selects it. True for firebase 11.10.0, 12.19.0 and 13.1.0. All accept `@react-native-async-storage/async-storage` 2.x (SDK 58 ships 2.2.0); 12.x also documents v3. | `firebase-js-sdk` tags: `packages/firebase/auth/index.ts`, `packages/auth/package.json`, `packages/auth/index.rn.ts` | Keep 11.10.0 (smallest change from V1 ^11.8.1). Types for `getReactNativePersistence` are absent from the default typings; harmless because `firebase/config.js` is JavaScript. 12.19.0 is the evaluated upgrade candidate (M2). |
| 3.2 | expo-router 58 peers | Required peers: `@expo/log-box` (provided by `expo`), `@expo/metro-runtime`, `expo-constants`, `expo-linking`, `react-native-safe-area-context`, `react-native-screens` — all declared. Dependency `@radix-ui/react-tabs` 1.2.1 requires `react-dom` (non-optional peer). | `packages/expo-router/package.json` (sdk-58); `radix-ui/primitives` `packages/react/tabs/package.json` | **`react-dom` 19.3.0 restored** (M1 removed it in error). Without it npm would auto-install react-dom 19.3.1, whose peer `react ^19.3.1` conflicts with react 19.3.0 → `ERESOLVE`. |
| 3.3 | React / React Native | react 19.3.0, react-dom 19.3.0, react-native 0.88.0 exactly as SDK 58. `react-dom@19.3.0` peer `react ^19.3.0`. | `facebook/react` tag v19.3.0 | — |
| 3.4 | Reanimated 4 / Worklets | `react-native-reanimated` 4.7.1 + `react-native-worklets` 0.13.0 (SDK 58). `babel-preset-expo` 58.0.21 adds the Worklets plugin automatically. | `babel-preset-expo/src/index.ts` (sdk-58) | Both declared. |
| 3.5 | Gesture Handler 3 | `react-native-gesture-handler` 3.3.0 **no longer exports `Swipeable`** (only `ReanimatedSwipeable`, importing Reanimated and Worklets). V1 `ShoppingListItem` used `Swipeable` → would fail to render. | `software-mansion/react-native-gesture-handler` v3.3.0 `src/index.ts` | Migrated to `react-native-gesture-handler/ReanimatedSwipeable`; root wrapped in `GestureHandlerRootView`. |
| 3.6 | Jest | `jest-expo` 58.0.12 peers: `@react-native/jest-preset ^0.88.0` (declared), `jest ^29 \|\| ^30` (jest ^30.5.2). | `packages/jest-expo/package.json` (sdk-58) | — |
| 3.7 | Testing Library | `@testing-library/react-native` 14.1.0 peers `react >=19`, `react-native >=0.78`, `test-renderer ^1.0.0`. In v14 `render`, `renderHook`, `fireEvent.*` and `unmount` are **async**. `test-renderer` 1.3.0 → `react-reconciler` 0.34 (peer `react ^19.3.0`). | `callstack/react-native-testing-library` v14.1.0 `package.json`, `src/render.tsx`, `src/events/fire-event.ts`, `yarn.lock` | All tests use `await` for these calls. |
| 3.8 | TypeScript / ESLint | TypeScript ~6.0.3 (SDK 58 templates). `eslint-config-expo` 58.0.4 → `@typescript-eslint/*` ^8.59 (latest 8.72.1, peer `typescript >=4.8.4 <6.1.0`, `eslint ^8.57 \|\| ^9 \|\| ^10`). | `typescript-eslint` v8.72.1 manifests | Compatible. `react-hooks` v7 React Compiler rules are errors in the preset; legacy JS files downgraded to warnings until M4 (documented). |
| 3.9 | expo-image-picker | `MediaTypeOptions` is deprecated; option is `allowsEditing` (V1 used `allowEditing`, silently ignored). | SDK 58 docs and `ImagePicker.types.ts` | `mediaTypes: ['images']`, `allowsEditing: true`. |
| 3.10 | React Native 0.88 | `SafeAreaView` from `react-native` is deprecated with a runtime warning. Retained code imports it from `react-native-safe-area-context` (0 imports from `react-native`). | `react-native` v0.88.0 `index.js` | — |
| 3.11 | expo-doctor checks (static emulation) | V1 would fail `DirectPackageInstallCheck` (`expo-permissions`, `expo-app-loading`, `expo-modules-core`) and `ExpoRouterReactNavigationCheck` (`@react-navigation/*`). M1: none of these packages present; required native peers present; 9 SDK-managed packages match SDK 58 exactly; Metro config extends `expo/metro-config`. `LockfileCheck` will fail until `package-lock.json` is committed (expected). | `packages/expo-doctor/src/checks/*` (sdk-58) | Real `expo-doctor` output to be reviewed from CI. |
| 3.12 | Expo Go | `react-native-purchases` (M6) and dev builds require an EAS development build; Expo Go is not a supported validation target for IntelliShop. | RevenueCat Expo docs | `expo-dev-client` kept. |

## 4. Commands executed and results

### 4.1 In this environment

| Command | Exit | Result | Log (`docs/validation/`) |
|---|---|---|---|
| `npm ci` via proxy (TLS on, official registry) | — (stopped after 11 min of 403s) | BLOCKED | `01_npm_ci.log` |
| `npm view yup version` via proxy / direct | 1 / 1 | BLOCKED (E403 / ENOTFOUND) | `03_npm_registry_probe.log` |
| `npm view expo@58 version` (2026-10-28 07:39) | 1 | BLOCKED (E403) | — |
| Expo SDK 58 manifests (`git clone --sparse`, branch `sdk-58`) | 0 | expo 58.0.20 and bundled versions read | — |
| Static `expo-doctor` emulation (peers + SDK version alignment) | 0 | no issues | §3.11 |
| `scripts/audit/check_imports.py` | 0 | 317 import specifiers, 0 unresolved, 0 undeclared | `10_static_regression_checks.log` |
| `scripts/audit/check_named_imports.py` | 0 | 106 named imports, 0 missing exports | `10_static_regression_checks.log` |
| `scripts/audit/check_contracts.py` | 0 | all context/hook fields used by screens exist (found and fixed the V1 `resetPassword` defect first) | `10_static_regression_checks.log` |
| `scripts/audit/check_routes.py` | 0 | 19 navigation targets, 0 broken | `10_static_regression_checks.log` |
| `scripts/check-lockfile-registry.mjs` on the V1 lockfile | 0 | 1,196 entries, all from registry.npmjs.org | — |
| gitleaks 8.30.1 (verified binary) full history / new commits / tree / owner's local repo | 1 / 0 / 0 / 1 | historical findings only in `0e26321` (and owner's local `.env`); 0 after; synthetic new key detected | `11_gitleaks.log` |
| actionlint 1.7.12 + shellcheck 0.11.0 on all workflows | 0 | no findings | `12_actionlint.log` |

### 4.2 Proxy checks with the owner's archived SDK 53 `node_modules` (not acceptance evidence)

| Command | Exit | Result | Log |
|---|---|---|---|
| `tsc --noEmit -p tsconfig.json` (TS 5.8.3, RN 0.79, expo-router 5) | 2 | 17 diagnostics, **all** caused by packages absent from the archive (`@testing-library/react-native`, `@expo-google-fonts/inter`) and their matchers; 0 others | `06_proxy_tsc_sdk53.log` |
| `jest` tokens + static security tests (jest 29.7, jest-expo 53) | 0 | 46/46 passed | `07_proxy_jest_sdk53.log` |
| `jest` CRUD + auth regression tests with a local Testing Library shim | 0 | 9/9 passed (4 auth, 3 lists, 2 pantry) | `08_proxy_jest_crud_sdk53.log` |
| Mutation check: V1 auth-listener bug reintroduced | 1 (expected) | regression test fails as intended | `09_mutation_check_auth_listener.log` |
| Babel (`babel-preset-expo` 53) compile of every source file | 0 | 69 files, 0 failures | `13_proxy_babel_parse_sdk53.log` |

### 4.3 To run in CI (pending)
`npm install` + lockfile (Generate lockfile workflow) → `npm ci` → `npx expo install --check` → `npx expo-doctor` → `npm run typecheck` → `npm run lint` → `npm test` → static checks → `npx expo export --platform ios` → bundle credential scan → `npm audit --omit=dev` (report) and `--audit-level=high` (gate). EAS iOS development build: after Apple Developer and Expo account setup (owner).

## 5. Security findings

- Removed client-side AI SDKs (`@google/generative-ai`, `openai`) and `axios` (used only for scraping/unlicensed price APIs); ESLint `no-restricted-imports` and a Jest test prevent their return.
- Removed `react-native-dotenv` (never configured) and its consumer that read keys from `@env`.
- The owner's local V1 `app.config.js` placed `OPENAI_API_KEY` in `extra` (would be embedded in the app manifest); not carried over.
- The owner's local `polyfills.js` implemented `crypto.getRandomValues` with `Math.random` (not cryptographically secure). Not imported anywhere and not carried over; M1 uses `expo-crypto`.
- Vulnerability audit: **not yet run** (`npm audit` needs the registry). CI gate fails on any high/critical production advisory; results will be assessed before M1 approval.

## 6. Breaking changes and code adjustments

| Change | Files |
|---|---|
| Gesture Handler 3: `Swipeable` → `ReanimatedSwipeable`; `GestureHandlerRootView` at root | `components/shopping/ShoppingListItem.jsx`, `app/_layout.tsx` |
| `uuid` (needs crypto polyfill on RN) → `expo-crypto` `randomUUID()` | `context/ShoppingListContext.jsx`, `firebase/models.js`, `firebase/storageHelpers.js` |
| `expo-updates` reload removed from ErrorBoundary | `errors/ErrorBoundary.jsx` |
| Poppins → Inter | `app/_layout.tsx` + 22 UI files |
| `app.json` → `app.config.ts` (env variants, EAS project link, image-picker plugin, iPhone only) | `app.config.ts` |
| Metro: default `expo/metro-config` (V1 used `@expo/metro-config` directly, flagged by expo-doctor) | `metro.config.js` |
| ESLint flat config, TypeScript strict, Jest preset, Testing Library async APIs | `eslint.config.js`, `tsconfig.json`, `package.json`, `__tests__/*` |
| expo-image-picker options | `src/screens/ProfileScreen.jsx` |

## 7. Remaining risks

1. **No real install yet**: transitive resolution can still fail in ways static analysis cannot predict (e.g., another required peer with a narrow range). Mitigation: CI logs; fix and re-run before approval.
2. **npm audit unknown**: high/critical advisories in production dependencies (Firebase, Expo, RN) would block M1 until fixed or assessed.
3. **expo-doctor** may report React Native Directory warnings for JS-only libraries (`formik`, `yup`); to be assessed from the CI log.
4. **Firebase 11.x** is no longer the current major; upgrade to 12.19.0 to be considered in M2 after a real-device auth persistence test.
5. **Proxy evidence ≠ SDK 58**: the executed tests ran on SDK 53 tooling; behaviour differences between React 19.0/19.3 and Testing Library shim vs v14 are possible.
6. **No device run**: no iOS simulator or device build has been executed (no macOS; EAS development build needs Apple Developer + Expo accounts).
