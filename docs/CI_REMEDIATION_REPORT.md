# CI remediation — first SDK 58 run (P0)

| | |
|---|---|
| Date | 28 October 2026 |
| Failing run | CI https://github.com/Huerlem/intellishop/actions/runs/40711942376 on `9404c9e` (owner) — TypeScript, ESLint, Jest and production audit failed; install, `expo install --check`, expo-doctor, static checks, iOS export and bundle scan passed (as reported by the owner) |
| Logs | **Not accessible from this environment.** The `ci-logs` artifact and the Actions API return 403 (repository not attached to this session; push/API access refused). Root causes below are therefore marked **REPRODUCED** (re-created here with the same tool version or data) or **INFERRED** (from the SDK 58 dependency graph in the lockfile and upstream sources, not from the logs) |
| Code under test in that run | `9404c9e` = M1 code (`b75702c`) + lockfile. It does **not** contain Packages B–C. The fixes below are made on the current branch head, which includes them |
| M1 | **Not PASS** |

## 1. Root causes and fixes

| Gate | Root cause | Evidence | Fix | Status |
|---|---|---|---|---|
| **TypeScript** | TypeScript **6.0** no longer includes `@types/*` packages automatically (`types` defaults to `[]`). `tsconfig.json` did not list `types`, so `describe`, `it`, `expect`, `jest`, `__dirname` were undefined in every test file | **REPRODUCED** with TypeScript 6.0.2: old `tsconfig.json` → 912 errors (549 `expect`, 187 `it`, 62 `describe`, 51 `jest`, 4 `__dirname`, …); new `tsconfig.json` → 0 errors in project code (`docs/validation/18_tsc6_before_after.log`) | `compilerOptions.types: ["jest", "node"]` (commit `b5cf1b2`) | Fixed; CI confirmation pending |
| **npm audit (prod, high)** | Two high advisories in transitive production dependencies: `@grpc/grpc-js` 1.9.16 (GHSA-m9gg-hp2v-232j) via Firebase Firestore, and `zod` 3.25.76 (GHSA-mrhx-c7xc-m3w5) via `@expo/cli` | **REPRODUCED** offline against the GitHub Advisory Database (the data source of `npm audit`): 2 high, 2 low (`docs/validation/17_offline_audit.log`) | Narrow npm `overrides` to patched versions in the same major line (grpc-js 1.14.6; zod 4.6.7 for `@expo/cli` only). No upstream release fixes either range. Full assessment: `docs/SECURITY_ADVISORIES.md`. Simulated result: 0 high/critical | Fixed; real `npm audit` pending in CI |
| **ESLint** | Not visible. Most likely, from the Expo flat config (`eslint-config-expo` 58.0.4, read from the expo/expo `sdk-58` source) and `eslint-plugin-react-hooks` 7: (a) React Compiler rule `react-hooks/globals` — tests wrote to module variables during render (`auth.context.test.tsx` `latest = useAuth()`, `navigation.test.tsx` `auth = useState(true)`); (b) `import/named` on `firebase/config.js` — `getReactNativePersistence` exists only in `@firebase/auth`'s React Native build, not in the typings the resolver reads; (c) after Package B: `import/no-unresolved` for `functions/src` imports (`firebase-admin`, `firebase-functions`) because the app job does not install the functions package | **INFERRED** | (a) tests now capture values in effects / an external store (`useSyncExternalStore`); (b) documented single-line `eslint-disable-next-line import/named` on that import only; (c) `functions/**` excluded from the app lint and linted in the "firebase" job after `npm ci --prefix functions` with `eslint.functions.config.js` (same Expo rules + Node globals). New V2 code was written to avoid the React Compiler rules (no setState in effects, no render-time `Date.now()`, no rule suppressions) | Needs CI confirmation |
| **Jest** | Not visible. Under the SDK 58 graph: RNTL **14.1.0** (async `render`/`fireEvent`/`act`, `test-renderer` 1.3.1 — host elements only, strict text-in-`<Text>` validation), jest 30.5.2, jest-expo 58.0.12, React 19.3. Candidate causes in the M1 tests are the same render-time mutations as in ESLint (a), and the two removed V1 CRUD tests (`shoppingList.crud`, `pantry.crud`) that exercised V1 contexts | **INFERRED**; RNTL 14 behaviour verified from its v14.1.0 source (`src/events/propagation.ts`, `is-enabled.ts`, migration guide) | Tests rewritten for RNTL 14 semantics (all APIs awaited; disabled controls pass `disabled` to `Pressable` so RNTL's responder check blocks presses; no composite-only queries); V1 CRUD tests replaced by repository/screen integration tests | Needs CI confirmation |

## 2. Files modified in this remediation pass

- `tsconfig.json` — `types: ["jest", "node"]`
- `package.json` — `overrides` (`@grpc/grpc-js` 1.14.6; `@expo/cli` → `zod` 4.6.7)
- `eslint.config.js` — ignore `functions/**` and `legal-site/dist/**` in the app lint
- `eslint.functions.config.js` (new) — lint config for the functions package
- `.github/workflows/ci.yml` — "Lint Cloud Functions" step in the firebase job; lockfile hint text
- `.github/workflows/lockfile.yml` — runs on every `feature/**` push and syncs both lockfiles (`npm install --package-lock-only`), commits only when changed, re-dispatches CI and Secret scan
- `firebase/config.js` — justified `import/named` suppression on one line
- `__tests__/auth.context.test.tsx`, `__tests__/navigation.test.tsx` — no writes to outer variables during render
- `scripts/audit/offline-npm-audit.cjs` (new) — offline audit used for the assessment
- `src/data/subscriptionService.ts` — comment without a `£` literal (LS-03 static test)
- Docs: this report, `docs/SECURITY_ADVISORIES.md`, validation logs 17–18

## 3. Dependency changes

| Change | Kind | Why |
|---|---|---|
| `@grpc/grpc-js` → 1.14.6 | override (transitive) | GHSA-m9gg-hp2v-232j |
| `zod` → 4.6.7 under `@expo/cli` | scoped override (transitive) | GHSA-mrhx-c7xc-m3w5 |
| Removed `@expo/vector-icons`, `expo-image-picker`, `expo-linear-gradient`, `expo-crypto`, `formik`, `yup` | direct (Package C) | unused after the V2 UI; removes the photo-library permission |
| Added `@firebase/rules-unit-testing` 4.0.1 (dev) | direct (Package B) | emulator rules tests |

`package-lock.json` must be regenerated for these: the lockfile workflow does it on the next push (this environment cannot reach the registry).

## 4. Tests executed here

| Check | Toolchain | Result |
|---|---|---|
| TypeScript 6.0.2, old vs new `tsconfig.json` | real TS 6, SDK 53 typings | 912 errors → 0 in project code (20 remaining are packages absent from the SDK 53 archive) |
| Jest, full suite | proxy (SDK 53, jest 29, RNTL shim) | 196/198; the 2 failures are shim limitations in `navigation.test.tsx` |
| Offline production audit | GitHub Advisory Database | before: 2 high, 2 low; after (simulated): 1 low |
| actionlint | 1.7.12 | 0 issues |
| gitleaks (tree + history) | 8.30.1 | no leaks |

**NOT RUN here:** `npm ci`, `expo install --check`, expo-doctor, ESLint, Jest on SDK 58, iOS export, real `npm audit` — all need the npm registry. They run in CI after the push.

## 5. What happens on the next push, and what I need

1. The push starts CI, Secret scan and Generate lockfile. **CI on the push itself will fail at `npm ci`** (lockfile out of date with `package.json`): expected.
2. Generate lockfile commits the synced lockfiles and dispatches CI + Secret scan again — **that** run is the one to read.
3. Please send me that run's URL **and** the `ci-logs` and `firebase-logs` artifacts (zip download from the run page, attached in chat), or give this environment GitHub access (claude.ai → Settings → Connectors → GitHub → allow `Huerlem/intellishop`). Any remaining ESLint/Jest failures will then be fixed from the actual logs, not inferred.
