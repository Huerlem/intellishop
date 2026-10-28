# Cloud Secret Management — Implementation Record

Requirement: [`requirements/CLOUD_SECRET_MANAGEMENT_REQUIREMENT.md`](requirements/CLOUD_SECRET_MANAGEMENT_REQUIREMENT.md) (P0, release-blocking)
Related: [`SECURITY_REMEDIATION_PLAN.md`](SECURITY_REMEDIATION_PLAN.md) (exposure inventory), [`AI_ARCHITECTURE.md`](AI_ARCHITECTURE.md)
Updated: 2026-10-27 · Branch `feature/v2-production-rebuild`

## 1. Acceptance criteria — current status

| # | Criterion | Status | Evidence / reason |
|---|---|---|---|
| A1 | No private provider keys are embedded in iOS builds | **FAIL** (baseline) | `main` puts 5 provider keys in `eas.json` → `build.production.env` as `EXPO_PUBLIC_*`, which Expo inlines into the JS bundle. Repository-level fix prepared on this branch (§6); a built-bundle scan (§7, T1) is required to change this to PASS. |
| A2 | No mobile production path calls a private provider directly using an embedded credential | **FAIL** (baseline) | 6 modules call Gemini from the app (`lib/gemini.js`, `services/priceComparison.js`, `services/recipeApiService.js`, `services/smartShoppingService.js`, `services/notifications.js`, `app/(auth)/RecipeSuggestionScreen.jsx`). Removal scheduled in M1/M3. |
| A3 | Backend functions retrieve required secrets securely | **NOT TESTED** | Functions not yet implemented (M3). |
| A4 | Unauthenticated and unauthorised requests are rejected | **NOT TESTED** | Emulator tests specified (§7, T3–T5). |
| A5 | Secret rotation without a new mobile binary | **NOT TESTED** | Holds by design (secret lives only server-side); rotation drill specified (§7, T6). |
| A6 | End-to-end AI recipe feature operates through the secure backend | **NOT TESTED / BLOCKED** | Needs Firebase project access, Blaze plan, new provider key set by the owner. |

Nothing in this document is complete until the tests in §7 run and their logs are attached.

## 2. Key distinctions applied

- **Firebase client configuration is not a private key.** `apiKey`, `appId`, `projectId` etc. identify the project; they are shipped in the app by design. Protection comes from Security Rules, App Check and **API-key API restrictions** (Firebase APIs only; never the Gemini API). Firebase documents these keys as public by design ([Firebase](https://firebase.google.com/docs/projects/api-keys)). iOS application restrictions are not used because the Firebase JS SDK does not send the iOS bundle header. It is still kept out of source and supplied per environment, so dev/staging/prod cannot be mixed up.
- **EAS environment variables do not protect anything compiled into the app.** Any `EXPO_PUBLIC_*` value, and any value read by app code at build time, ends up readable in the shipped bundle. EAS secret-visibility variables are used only for **build-time** credentials (none currently needed). Private provider keys never go to EAS.
- **Private provider keys exist in exactly one place:** Google Cloud Secret Manager of the matching Firebase project, read by the Cloud Function bound to it.

## 3. Architecture

```
iOS app (no private keys)                    Firebase project per environment
  Firebase client config (public)               (dev / staging / prod)
  App Check token (App Attest)  ──HTTPS──▶  Cloud Functions v2 (europe-west2)
  Firebase ID token                            generateRecipes   secrets: [AI_PROVIDER_API_KEY]
                                               optimiseList      secrets: [AI_PROVIDER_API_KEY]
                                               revenuecatWebhook secrets: [REVENUECAT_WEBHOOK_AUTH]
                                               (future) priceLookup secrets: [<price provider key>]
                                                    │ runtime SA has secretAccessor
                                                    ▼ on *only* its bound secrets
                                            Secret Manager
```

Implementation pattern (Cloud Functions v2):

```ts
import { defineSecret } from 'firebase-functions/params';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

const AI_PROVIDER_API_KEY = defineSecret('AI_PROVIDER_API_KEY');

export const generateRecipes = onCall(
  { region: 'europe-west2', secrets: [AI_PROVIDER_API_KEY], enforceAppCheck: true,
    timeoutSeconds: 30, memory: '512MiB', maxInstances: 20 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
    // entitlement + credit/quota check, then provider call using AI_PROVIDER_API_KEY.value()
  });
```

A secret is bound only to functions listed with it in `secrets`; other functions cannot read it. `firebase deploy` grants the runtime service account access to the bound secrets.

## 4. Affected services and migration

| Service | Before (V1) | After (V2) | Secret name |
|---|---|---|---|
| Gemini (recipes, smart lists, notifications, price "estimates") | Client SDK with `EXPO_PUBLIC_GEMINI_API_KEY` | Removed. AI goes through `generateRecipes` / `optimiseList` with a new provider key | `AI_PROVIDER_API_KEY` |
| OpenAI | Backup files referencing `EXPO_PUBLIC_OPENAI_API_KEY` | Removed | — |
| RapidAPI price endpoint | Client with `EXPO_PUBLIC_RAPID_API_KEY` | Removed (no verified licence) | — |
| Apify supermarket scraper | Client with `EXPO_PUBLIC_APIFY_KEY` | Removed (scraping) | — |
| ScrapeNinja (Google results scraping) | Client | Removed (scraping) | — |
| Spoonacular | Client with `EXPO_PUBLIC_SPOONACULAR_API_KEY` | Removed now; server-side only if adopted later | (future) |
| USDA FoodData Central | Client with `EXPO_PUBLIC_FOODDATA_API_KEY` | Removed now; server-side only if adopted later | (future) |
| RevenueCat | — | App uses RevenueCat **public SDK key** (designed to be public); webhook authorisation header value and REST secret key server-side only | `REVENUECAT_WEBHOOK_AUTH`, `REVENUECAT_SECRET_KEY` |
| Firebase client config | Hard-coded in `firebase/config.js` | Per-environment app config, key restricted | — (public) |

Migration steps (in order):
1. **Owner revokes/rotates** C1–C6 (see remediation plan). Replacement keys are created only after revocation and never sent via chat or Git.
2. Branch: add `.gitignore`, `.env.example`, remove credentials from `eas.json`, add secret-scanning CI (§6 — done on this branch, pending review).
3. M1: delete client AI/price modules and their dependencies.
4. M2: create environments, Functions codebase, Security Rules, App Check.
5. M3: implement `generateRecipes`; owner sets `AI_PROVIDER_API_KEY` in staging with `firebase functions:secrets:set AI_PROVIDER_API_KEY --project <staging>`; run §7 tests.
6. Production: same, in the production project, after staging passes.

## 5. Environments and IAM

| Environment | Firebase project (to be created or confirmed) | App variant | Secrets |
|---|---|---|---|
| development | `intellishop-dev` (+ Emulator Suite locally) | bundle ID `com.huerlem.intellishop.dev`, App Check debug provider | dev-only provider key with low spend limit, or emulator stubs |
| staging | `intellishop-staging` | `com.huerlem.intellishop.staging`, TestFlight internal | staging key, low spend limit |
| production | existing `intellishop-1f62f` **or** new `intellishop-prod` (owner decision S2) | `com.huerlem.intellishop` | production key |

Selection: `APP_ENV` set per EAS build profile → `app.config.ts` selects the public Firebase config, bundle ID and display name. `.firebaserc` aliases `dev`, `staging`, `prod` for deploys.

IAM (least privilege):
- **Function runtime identity:** dedicated service account per codebase (e.g. `fn-ai@…`), with `roles/datastore.user` and `roles/secretmanager.secretAccessor` granted **on the specific secrets** only — not project-wide Editor.
- **Deploy identity:** CI deploys with Workload Identity Federation (GitHub OIDC), no JSON keys; roles limited to Functions developer, Service Account User on the runtime SA, Firebase Rules admin, Secret Manager viewer (not accessor).
- **People:** owner keeps Owner. No standing access for collaborators; Secret Manager *accessor* is never granted to humans in staging/prod.
- **API keys:** the Firebase key used by the app has API restrictions limited to the Firebase APIs it needs (Identity Toolkit, Token Service, Cloud Firestore, Cloud Storage for Firebase, Firebase Installations, Firebase App Check). No iOS-app restriction (the JS SDK does not send the bundle header). The Generative Language API is never in its allowlist and is disabled in Firebase projects; a server-only AI key, if ever needed, is a separate key in Secret Manager.

Abuse controls (shared with AI architecture): Auth required, App Check enforced (App Attest), entitlement check, race-safe credit reservation for Free, per-user rate limit, Premium fair-use quota, global daily spend cap, request size limits, provider timeout, typed errors without internals.

## 6. Repository changes on this branch (configuration only)

| Change | Purpose |
|---|---|
| `.gitignore` | Excludes `.env*` (except `.env.example`), native folders, build output, Apple/Google credential files, service-account JSON |
| `.env.example` | Documents the only app-side variables: `APP_ENV` and public Firebase client config; states that private keys must never appear here |
| `eas.json` | All five credential entries removed from `build.production.env`; `APP_ENV` set per profile |
| `.gitleaks.toml` + `.github/workflows/secret-scan.yml` | Secret scanning on every push/PR over full history; owner should also enable GitHub push protection |

History is **not** rewritten and nothing is force-pushed (requires explicit approval; see remediation plan S7).

## 7. Test plan and evidence

| ID | Test | Method | Status |
|---|---|---|---|
| T1 | Built iOS JS bundle contains no provider key patterns or `EXPO_PUBLIC_*_API_KEY` values | `npx expo export --platform ios` then gitleaks/grep over output; repeat on the EAS production artefact | NOT TESTED (BLOCKED: install) |
| T2 | No import of AI/price provider SDKs in the app | lint rule + `grep` in CI | NOT TESTED |
| T3 | Callable without ID token → `unauthenticated` | Emulator + Jest | NOT TESTED |
| T4 | Callable without valid App Check token → rejected | Emulator / staging | NOT TESTED |
| T5 | User A requests list owned by user B → `not-found`; direct Firestore read denied by Rules | Rules unit tests | NOT TESTED |
| T6 | Rotation drill: add new secret version, redeploy functions, disable old version, app keeps working without a new binary | Staging | NOT TESTED |
| T7 | Logs contain no secrets, prompts, pantry contents or allergies | Inspect Cloud Logging for a test session; log-redaction unit tests | NOT TESTED |
| T8 | Git history scan in CI reports no new leaks; known historical findings baselined, not suppressed | gitleaks CI | NOT TESTED (workflow added, not yet run on GitHub) |
| T9 | Free/Standard user cannot call Premium endpoints; spoofed client entitlement ignored | Emulator | NOT TESTED |

## 8. Credential rotation status

| ID | Credential | Status |
|---|---|---|
| C1 | Gemini key | Awaiting owner revocation — **BLOCKED** |
| C2 | Firebase browser key (`intellishop-1f62f`) | Awaiting owner restriction/rotation — **BLOCKED** |
| C3 | RapidAPI | Awaiting owner revocation — **BLOCKED** |
| C4 | Apify | Awaiting owner revocation — **BLOCKED** |
| C5 | Spoonacular | Awaiting owner rotation — **BLOCKED** |
| C6 | USDA FDC | Awaiting owner rotation — **BLOCKED** |

## 9. Outstanding risks

1. Keys remain readable in public Git history until revoked (history rewrite not approved and not sufficient on its own).
2. Unknown whether any distributed build embedded additional `EXPO_PUBLIC_*` keys from a local `.env`.
3. Unknown current Firestore/Storage Rules on `intellishop-1f62f`.
4. Cost of abuse if App Check is not enforced in production (debug tokens must never ship).
5. Third-party SDKs added later (crash reporting, analytics) could capture sensitive content — each needs a privacy review and scrubbing configuration.
6. The development environment cannot currently install packages (see `VALIDATION_REPORT.md`), so none of §7 can run here yet.
