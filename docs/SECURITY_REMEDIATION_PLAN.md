# Security Remediation Plan

Baseline: `main` @ `0e26321` · Branch: `feature/v2-production-rebuild` · Assessed: 2026-10-27
Credential values are **never** reproduced in this document, in logs, or in commits.

Status legend: **PASS** (check ran and succeeded) · **FAIL** (check ran and found a defect) · **BLOCKED** (needs access or action outside this environment) · **NOT TESTED**.

## 1. Exposure assessment

### 1.1 Method and evidence

| Check | Command / method | Result | Status |
|---|---|---|---|
| Repository visibility | Anonymous clone via proxy; `add_repo` tool reported "it is a public repository" | Public on GitHub | FAIL (exposure confirmed) |
| History scan | Every blob in `git rev-list --all --objects` (2 commits) scanned for Google `AIza…` keys, OpenAI/Anthropic `sk-` keys, GitHub tokens, private-key blocks, Firebase app IDs and generic `apiKey/secret/token/password = "…"` assignments; values masked | 2 Google keys + Firebase app ID matched; 3 generic matches were error-code constants (false positives) | FAIL |
| Manual review of `eas.json` | Values redacted when displayed | 5 provider credentials under `build.production.env`, all named `EXPO_PUBLIC_*` | FAIL |
| `.gitignore` present | `ls .gitignore` | Absent — any local `.env` would be committed | FAIL |
| Client-side AI calls | `grep EXPO_PUBLIC_GEMINI_API_KEY` | 6 modules call Gemini directly from the app | FAIL |

**Process note (disclosed for audit completeness):** during the first scan, my display-redaction filter covered Google-format keys only, so four `eas.json` values appeared unmasked in my private tool output inside this session. They were not written to any file, commit, report or message, and they were already public on GitHub. The filter was corrected for all later output.

### 1.2 Credential inventory

| ID | Provider / credential | Location (first commit) | Public since | Nature | Impact if abused | Required action |
|---|---|---|---|---|---|---|
| C1 | Google Gemini API key (`EXPO_PUBLIC_GEMINI_API_KEY`) | `eas.json` (`0e26321`) | 2025-06-06 | Secret, metered | Billed inference on the owning Google project; quota exhaustion; likely related to the reported suspension | **Revoke (delete key).** Do not re-enable or reuse the project for IntelliShop AI. Review that project's billing and usage history. |
| C2 | Google API key in `firebase/config.js` (Firebase web config for project `intellishop-1f62f`) | `firebase/config.js` (`0e26321`) | 2025-06-06 | Identifier by design, **but** Firebase browser keys are unrestricted by default and can call any API enabled in the same Google Cloud project | If the Generative Language API (or another paid API) is enabled in that project, this key can be used for billed calls. | **Restrict, then rotate.** Limit the key's *API restrictions* to the Firebase APIs the app uses, and make sure the Generative Language (Gemini) API is not in its allowlist and is disabled in this project. Do **not** add an iOS-app restriction to this key: the Firebase JS SDK used by the app does not send the iOS bundle header, so such a restriction would block sign-in (corrected 2026-10-28). Rotate by creating a new restricted key, shipping it through the environment configuration, then deleting the old key. Confirm whether this project is the suspended one. |
| C3 | RapidAPI key (`EXPO_PUBLIC_RAPID_API_KEY`) | `eas.json` | 2025-06-06 | Secret | Usage billed to the RapidAPI account | **Revoke** in the RapidAPI dashboard. Provider not retained (scraping-backed price endpoint). |
| C4 | Apify API token (`EXPO_PUBLIC_APIFY_KEY`) | `eas.json` | 2025-06-06 | Secret, full account token | Can run actors and read datasets billed to the account | **Revoke** in Apify → Integrations; review run history. Provider not retained. |
| C5 | Spoonacular API key | `eas.json` | 2025-06-06 | Secret, quota-based | Quota exhaustion / charges | **Rotate**; retain only if a later phase adopts Spoonacular, server-side only. |
| C6 | USDA FoodData Central key (api.data.gov) | `eas.json` | 2025-06-06 | Secret, free, rate-limited | Rate-limit abuse attributed to the account | **Rotate**; server-side only if retained. |
| C7 | Firebase `appId`, `messagingSenderId`, `measurementId`, project ID | `firebase/config.js` | 2025-06-06 | Public identifiers | None alone; abuse is controlled by Security Rules and App Check | No rotation. Enforce Firestore/Storage Rules + App Check (see §3). |

**Referenced but not committed** (status unknown → treat as exposed if they ever existed in a build): `EXPO_PUBLIC_OPENAI_API_KEY` (backup files), `SCRAPE_NINJA_KEY`, `EXPO_PUBLIC_TESCO_API_KEY`. Any value placed in an `EXPO_PUBLIC_*` variable is compiled into the JavaScript bundle of every build. If any build (Expo Go share, internal distribution, TestFlight) was distributed, rotate these as well.

### 1.3 Things this environment could not verify — BLOCKED

| Item | Why blocked | Owner action |
|---|---|---|
| Whether C1–C6 are still active | Testing a key would mean using a potentially compromised credential, which is prohibited | Check each provider dashboard; revoke regardless |
| Which Google Cloud project owns C1, and whether it is `intellishop-1f62f` | Needs Google Cloud console access | Confirm in console → APIs & Services → Credentials |
| Current Firestore / Storage Security Rules | No rules file in the repo; console access required | Export current rules, or confirm none are deployed |
| Firebase Auth configuration (enabled providers, email enumeration protection) | Console access | Screenshot or export settings |
| GitHub secret-scanning alerts | No GitHub API access for this repo in this session | Check repo → Security → Secret scanning |

## 2. Remediation sequence

| Step | Action | Who | Blocking for |
|---|---|---|---|
| S1 | Revoke C1, C3, C4 today; rotate C5, C6 | Owner | Any integration work |
| S2 | Confirm C1's project; if `intellishop-1f62f` is affected, decide: keep Firebase project (rotate C2, disable Generative Language API there) **or** create new Firebase projects | Owner | Backend setup (M2) |
| S3 | Add `.gitignore` (`.env*`, `node_modules`, `ios/`, `android/`, `*.p8`, `*.p12`, `*.mobileprovision`, `google-services.json`, `GoogleService-Info.plist`) | Vesper | Milestone M0 |
| S4 | Remove every credential from `eas.json`; replace with EAS environment variables for **non-secret** build config only | Vesper | M0 |
| S5 | Delete client-side AI code paths and the `@google/generative-ai` / `openai` dependencies | Vesper | M0 / M3 |
| S6 | Add secret scanning: `gitleaks` pre-commit config + CI job; enable GitHub secret scanning push protection | Vesper (config), Owner (GitHub setting) | M0 |
| S7 | History handling — **requires explicit approval, not done**. Options: (a) leave history, rely on revocation (sufficient once keys are dead); (b) make the repo private; (c) `git filter-repo` + force-push (rewrites history, breaks existing clones/forks; secrets may remain in forks and caches). Recommendation: (a) or (b) after S1. | Owner decision | — |
| S8 | Deploy server-side AI behind Cloud Functions with Secret Manager (§3) | Vesper | M3 |
| S9 | Write and deploy Firestore and Storage Security Rules with emulator tests | Vesper | M2 |

## 3. Secure backend replacement (target)

- **Inference:** Cloud Functions for Firebase (2nd gen) callable `generateRecipes` / `optimiseList`. Provider key stored with `defineSecret(...)` (Google Secret Manager) and bound via the function's `secrets` option. Never in the app, never in `EXPO_PUBLIC_*`, never in the repo. Cloud Functions production deployment requires the Blaze (pay-as-you-go) plan ([Firebase docs](https://firebase.google.com/docs/functions/oncallgenkit)).
- **Caller verification:** callable requires Firebase Auth (`request.auth` present) and App Check (`enforceAppCheck: true`; App Attest provider on iOS).
- **Authorisation:** the function reads the caller's own pantry/list with the Admin SDK and checks `ownerId == request.auth.uid`; the client never sends ingredient data it could forge.
- **Abuse controls:** per-user rate limit and daily quota in Firestore transactions; global daily spend cap; request size limits; provider timeout. Details in `docs/AI_ARCHITECTURE.md`.
- **Billing guard:** Google Cloud budget alerts on the Firebase project; spend limit configured in the AI provider console.
- **Logging:** token counts, latency, error codes, user ID hash. Never prompts, pantry contents, allergies or keys.
- **Client storage:** Firebase Auth persistence via AsyncStorage (SDK default for React Native) holds only the Firebase refresh token; the current code also writes the user's UID to AsyncStorage as `userToken` — removed (not a token, no purpose).

## 4. Credentials required from the owner (later, not now)

| Credential | Where it goes | When |
|---|---|---|
| AI provider API key (new account/project) | `firebase functions:secrets:set <NAME>` run by the owner, or Secret Manager console | M3 |
| Apple Developer Team ID, App Store Connect API key | EAS credentials (`eas credentials`), never the repo | M7 |
| Firebase project access (Editor) for staging and production | Firebase console IAM | M2 |

No credential should be pasted into chat.
