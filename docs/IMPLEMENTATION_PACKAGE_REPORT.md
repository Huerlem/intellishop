# Accelerated Development Execution — Consolidated Report (Packages A–G)

| | |
|---|---|
| Date | 28 October 2026 |
| Branch | `feature/v2-production-rebuild` (local). `main` untouched at `0e26321` (remote verified) |
| Since last delivered bundle (`b75702c`) | 239 files changed; app/server/test code +11 808 / −6 427 lines |
| Publication | The owner published the branch: GitHub confirms `feature/v2-production-rebuild` at `9404c9e` (`b75702c` + owner's SDK 58 `package-lock.json`, 28 Oct 15:02 UTC). The newer commits in this report are a **fast-forward** on top of it but are **not on GitHub yet**: push from this environment returns 403 and push access cannot be attached. Delivered as a verified Git bundle |
| M1 | **Not PASS** — no CI run has happened (needs the branch on GitHub) |

## Status words

**PASS** = check executed and passed with evidence in `docs/validation/` · **IMPLEMENTED** = code written and tested only on the local proxy toolchain (archived Expo SDK 53, jest 29, RNTL shim) — not CI, not SDK 58, not emulator, not device · **FAIL** · **BLOCKED** = needs owner action, account or infrastructure · **NOT TESTED** · **NOT IMPLEMENTED**.

## 1. Work packages

| Package | Item | Status | Evidence |
|---|---|---|---|
| **A** Close M1 via CI | Publish branch | PASS for `9404c9e` (owner push, confirmed by `git ls-remote`); newer commits BLOCKED (no write access) | — |
| | Lockfiles, CI, Secret scan | **NOT TESTED** here — run results are not visible to this environment (GitHub API/web blocked) | `lockfile.yml` now runs on every push to `feature/**` and syncs both lockfiles with `package.json` (`npm install --package-lock-only`), commits only if changed, then dispatches CI and Secret scan; actionlint exit 0. `tsconfig` pins `types: [jest, node]` (TypeScript 6 no longer includes `@types/*` automatically) |
| **B** Secure core | User-scoped data model, repositories, counters for Free limits | IMPLEMENTED | `src/data/*`; `__tests__/data/repositories.test.ts` 9/9 (proxy) |
| | Firestore/Storage Security Rules + emulator tests | IMPLEMENTED / emulator **NOT TESTED** | `firestore.rules`, `storage.rules`, `rules-tests/*` (new: finished-trip `pantryApplied` rule) — runs only in CI job `firebase` |
| | Cloud Functions: deletion, export, consents, recipes, entitlements | IMPLEMENTED / build **NOT TESTED** | `functions/src/*`; handler tests 30/30 (proxy). `firebase-admin` types not installable here |
| | Auth: minimal registration, Terms, verification, re-auth | IMPLEMENTED | `firebase/authHelpers.js`, `context/AuthContext.jsx`; UI tests |
| | Offline / error handling | IMPLEMENTED (with limitation) | Offline-aware commits (`commitBatch`): writes queued offline no longer block screens; a queued write later rejected is reported and rolled back. **Limitation:** the Firebase JS SDK on React Native has only a memory cache — queued changes are lost if the app is closed before reconnecting (copy says so). Durable offline needs React Native Firebase (owner decision, §6) |
| **C** Figma V2 UI | Component library (page 13) | IMPLEMENTED | `src/ui/*`; `__tests__/ui/components.test.tsx` |
| | Screens P01, P02, P03, P07, P08, P09, P10 + Lists, Profile/Settings, consent, dietary, deletion, export, plans, recipes, legal, auth | IMPLEMENTED | `src/screens/*`; `__tests__/ui/screens.test.tsx` (end-to-end journey over in-memory Firestore); renders in `docs/validation/ui-preview/` (react-native-web, **not iOS**) |
| | P04 Optimisation | **NOT IMPLEMENTED** (honest unavailable screen) | No server endpoint; screen changes nothing and sells nothing |
| | P05 Recommended Store, P06 Compare Stores | **NOT IMPLEMENTED** — BLOCKED by data | No licensed price source (D8) |
| | Exactly 3 tabs, Inter + tokens, no V1 colours | IMPLEMENTED | `__tests__/ui/v2-compliance.test.ts` (token colours only, no icon fonts, three tabs, no `£` literals); `__tests__/navigation.test.tsx` |
| | V1 removal | IMPLEMENTED | V1 screens, contexts, components, dead helpers removed; unused deps removed (`@expo/vector-icons`, `expo-image-picker` + photo permission, `expo-linear-gradient`, `expo-crypto`, `formik`, `yup`) |
| | iOS visual/interaction acceptance, VoiceOver, Dynamic Type | **NOT TESTED** | No simulator/device here |
| **D** AI recipe foundation | Server pipeline, schema, safety, usage accounting, Anthropic adapter, UI | IMPLEMENTED | Tests 30 (functions) + 59 (shared) on proxy. `AI_PAUSED=true` by default; adapter **not activated** (no key; Secret Manager is an owner checkpoint). **No end-to-end AI claim** |
| | "Report" on AI results (L3-08) | NOT IMPLEMENTED | Drafts mark it pending |
| **E** Subscriptions | Plans/entitlements logic, server webhook + sync, paywall, Restore/Manage/Refund UI | IMPLEMENTED (no purchases) | `UnavailableSubscriptionService`: no prices shown, purchases report "not available yet". RevenueCat SDK not installed; App Store products not created (owner checkpoints) |
| **F** Legal V0.2 | 10 drafts, site builder, QA register, gate, plan, checklist | IMPLEMENTED (drafts) | `docs/legal/*`, `docs/compliance/*` v0.2. Nothing published |
| **G** Automated QA | Unit / integration / UI / device split | see §2 | — |

## 2. Test results (this environment)

| Suite | Kind | Result | Notes |
|---|---|---|---|
| `__tests__/shared/*` | Unit | 59/59 pass (proxy) | units, items, entitlements, AI schema/normalise/reclassify, food safety FT-01…FT-14, pantry update, legal parser |
| `__tests__/functions/*` | Unit (handlers with in-memory store) | 30/30 pass (proxy) | deletion, export, consents, recipes pipeline, entitlements, Anthropic adapter with fake fetch |
| `__tests__/data/repositories.test.ts` | Integration (repositories ↔ in-memory Firestore) | 9/9 pass (proxy) | |
| `__tests__/ui/presenters.test.ts` | Unit | pass (proxy) | |
| `__tests__/ui/components.test.tsx` | UI | pass (proxy) | roles, states, labels, colours |
| `__tests__/ui/screens.test.tsx` | UI integration | pass (proxy) | Home, Lists, List Detail, Add Items, Optimise, Shopping Mode → Finish → Pantry Update (incl. undo), Pantry editor, Plans, Registration, Recipes gating, Profile, Deletion |
| `__tests__/ui/v2-compliance.test.ts`, `security.static`, `theme.tokens`, `auth.context` | Static/unit | pass (proxy) | |
| `__tests__/navigation.test.tsx` | UI | 3/5 pass, **2 fail on the proxy only** | Failures are shim limitations (no host `parent`, no `toHavePathname`); CI result **NOT TESTED** |
| **Total (proxy)** | | **196 / 198** | `docs/validation/14_package_c_proxy_jest.log` |
| `tsc --noEmit` (TS 5.8 proxy) | Static | 0 errors in project code; 20 errors all from packages missing in the archived toolchain | `15_package_c_tsc_proxy.log` |
| `rules-tests/*` | Emulator | **NOT TESTED** | CI job `firebase` |
| functions `tsc` build | Static | **NOT TESTED** | CI job `firebase` |
| ESLint (incl. React Compiler rules) | Static | **NOT TESTED** (ESLint not installable) | Code written to avoid setState-in-effect, render-time `Date.now()`, rule suppressions |
| gitleaks (tree + 18-commit branch history) / actionlint | Security / CI config | no leaks / exit 0 | `16_package_c_gitleaks_actionlint.log` |
| Legal: `--check-app` / `--release` | Static | up to date / fails with 133 markers (intended) | |
| SDK 58 install, expo-doctor, iOS export, EAS build, simulator, device, TestFlight | — | **NOT TESTED / BLOCKED** | registry blocked; no macOS; no Apple/EAS access |

## 3. Decisions taken under the routine-decision authorisation

| # | Decision | Why | Reversible |
|---|---|---|---|
| R1 | Writes are "queued" after 1.5 s offline instead of blocking screens; late server rejections shown to the user | Firestore JS `commit()` never resolves offline | Yes |
| R2 | Pantry Update applies high-confidence changes automatically, records each on the trip (`pantryApplied`) and offers Undo; rule allows only that field on finished trips | Figma P09 + "no silent destructive updates" | Yes |
| R3 | Profile photo not offered in V2.0; `expo-image-picker` and photo permission removed | No Figma design; removes a permission prompt | Yes (owner can request) |
| R4 | Figma icon glyphs with broken strokes drawn as intended (D-ICON-1) | Exports render disconnected strokes | Designer to confirm |
| R5 | "Past Their Date" section on Pantry when needed | Expired food must never be hidden | Design review |
| R6 | Shopping Mode groups by category; header shows list name | No aisle or store data | Until P05 |
| R7 | Consent screen names "Anthropic (Claude)" | It is the implemented server adapter (Apple 5.1.2(i)) | Changing provider = new consent version |
| R8 | App Check stays off | The Firebase JS SDK cannot use App Attest; enforcing would block real users | Needs React Native Firebase (§6) |

No mandatory checkpoint was crossed: no production data touched, no Firebase project or billing created, no Apple products, no hosting, no publication, `main` untouched, no history rewrite.

## 4. Blockers

1. **GitHub write access and Actions visibility** (B-L17) → this environment cannot push the new commits or read workflow results, so no CI evidence, no M1 PASS.
2. **npm registry blocked** in this environment → SDK 58 toolchain cannot be installed locally.
3. **No macOS / Xcode / simulator / device / Apple Developer / EAS access** → no iOS build, no device testing.
4. **Owner facts and decisions**: B-L01 identity, B-L02 ICO fee, B-L03 credential revocation, B-L07 domain, B-L08 processor terms (incl. AI provider), B-L12 prices/quotas, B-L14 minimum age, B-L18 trip retention, UI-B1…B4 design items, legal review items.
5. **Licensed price data** for P05/P06 (D8).

## 5. Exact owner actions (in order)

1. **Fast-forward the published branch** (Windows PowerShell, in the clone you pushed from; the bundle and its SHA-256 are in the delivery message). No force-push and no change to `main`:
   ```powershell
   cd <your intellishop clone>
   $b = "$HOME\Downloads\intellishop-feature-v2-<HEAD>.bundle"
   (Get-FileHash $b -Algorithm SHA256).Hash      # must equal the SHA-256 in the delivery message
   git bundle verify $b
   git fetch origin
   git switch feature/v2-production-rebuild
   git pull --ff-only origin feature/v2-production-rebuild   # brings your clone to 9404c9e
   git fetch $b feature/v2-production-rebuild:refs/remotes/bundle/v2
   git merge --ff-only bundle/v2                 # fails safely if it is not a fast-forward
   git log --oneline -1                          # expect <HEAD>
   git push origin feature/v2-production-rebuild
   git ls-remote origin feature/v2-production-rebuild   # must show <HEAD>
   ```
2. On GitHub → **Actions**: the push starts **CI**, **Secret scan** and **Generate lockfile**. The lockfile workflow updates `package-lock.json` (dependencies removed/added in Package C) and creates `functions/package-lock.json`, commits them and starts CI and Secret scan again. The first CI run on your push is expected to fail at `npm ci` (lockfile out of sync) — the second one is the meaningful run. Send me the run URLs or the failed logs (or grant this environment access: claude.ai → Settings → Connectors → GitHub, allow `Huerlem/intellishop`), and I will fix every failure.
3. Revoke the exposed V1 credentials (B-L03) in Google Cloud / Firebase / third-party consoles — never paste values into chat or commits.
4. Provide the owner facts listed in `docs/compliance/LEGAL_RELEASE_GATE.md` §2 and decide UI-B1…B4 (`docs/FIGMA_IMPLEMENTATION_MATRIX.md` §10.3).
5. When ready (checkpoints): create the Firebase project(s) in `europe-west2`, Apple Developer / App Store Connect app and products, EAS access — I will then wire secrets via Secret Manager, never via commits.

## 6. Recommended next package

**Package H — CI green + native foundation** (after the branch is on GitHub):
1. Make CI fully green on SDK 58 (lockfile, typecheck, ESLint with React Compiler rules, all jest suites, rules emulator, functions build, iOS bundle export, audits) and mark M1 PASS with run URLs.
2. Owner decision: adopt **React Native Firebase** (native SDK) for durable offline persistence and App Check with App Attest — this changes the data layer's transport but not its API (`src/data/*` keeps its interface).
3. First EAS development build + simulator smoke test of the full journey; VoiceOver and Dynamic Type pass; fix visual deltas against Figma on a 440×956 device.
4. Then Package I: Recommendation Card + server optimisation endpoint (Premium, AI paused by default), Report button (L3-08), trip-history retention (after B-L18).
