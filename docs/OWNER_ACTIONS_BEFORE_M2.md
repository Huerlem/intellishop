# Owner Actions — to close M1 and before M2

Date: 2026-10-28. Never paste credential values into chat, commits, issues or documents. Where a step creates a new credential, keep it in the provider console or Secret Manager only.

## A. Run CI on the branch (required for M1 PASS)

1. **Publish the branch** (from your local clone of `Huerlem/intellishop`, on Windows PowerShell or Git Bash):
   ```
   git fetch <path>\intellishop-feature-v2.bundle feature/v2-production-rebuild:feature/v2-production-rebuild
   git push origin feature/v2-production-rebuild
   ```
   This creates only the development branch; `main` is unchanged.
2. **Allow the workflows to run**: GitHub → repository → **Settings → Actions → General** → *Actions permissions*: allow GitHub actions and the actions used here (`actions/checkout`, `actions/setup-node`, `actions/upload-artifact`, `gitleaks/gitleaks-action`), or "Allow all actions".
3. The push starts **CI** and **Secret scan**. The first CI run is a *bootstrap* run because the old SDK 53 lockfile was removed:
   - open the run → **Artifacts** → download `package-lock` → put `package-lock.json` at the repository root → commit and push it (`git add package-lock.json && git commit -m "chore: lockfile for Expo SDK 58" && git push`). Every later run uses `npm ci`.
   - alternatively, if Node 22 is installed on your PC: `npm install` in the project folder, then commit the generated `package-lock.json`.
4. **Send me the evidence**: the run URL(s) and the `ci-logs` artifact zip from the run on the commit that contains the lockfile. I will fix any failure and send a new bundle; M1 is reported PASS only when all blocking steps succeed.
5. Optional but recommended: **Settings → Code security** → enable *Secret scanning* and *Push protection*.

## B. Revoke or rotate the exposed credentials (S1) — do this now

These keys are public in commit `0e26321` of the public repository. Revoking them is what removes the risk; editing Git history would not.

| ID | Provider | Steps | After |
|---|---|---|---|
| C1 | Google Gemini key (was `EXPO_PUBLIC_GEMINI_API_KEY`) | Google Cloud console → select the project that owns the key → **APIs & Services → Credentials** → find the key (the list shows only its first characters) → **Delete**. If you used Google AI Studio, the same key also appears under **Get API key** there. Then **Billing → Reports**, filter by *Generative Language API*, to check for usage you did not make. | Do not create a replacement in that project. IntelliShop AI will use a new provider key stored in Secret Manager (M3). |
| C2 | Firebase web API key (`intellishop-1f62f`) | Google Cloud console → project `intellishop-1f62f` → **APIs & Services → Enabled APIs & services**: if *Generative Language API* is enabled, **Disable** it. Then **Credentials** → the key named like *Browser key (auto created by Firebase)* → **API restrictions → Restrict key** → keep only the Firebase APIs the app uses (Identity Toolkit API, Token Service API, Cloud Firestore API, Cloud Storage for Firebase API, Firebase Installations API, Firebase App Check API) → **Save**. **Do not** set an *iOS apps* application restriction on this key — the Firebase JS SDK does not send the iOS bundle header and sign-in would stop working. Test sign-in with a test key first if you can. | Firebase documents these keys as public by design; protection comes from restrictions, Security Rules and App Check ([Firebase](https://firebase.google.com/docs/projects/api-keys)). Rotation (new key, then delete old) can follow once builds read the key from environment configuration (done in M1). |
| C3 | RapidAPI key | [Developer Dashboard](https://rapidapi.com/developer/dashboard) → select the app → **Authorization** → delete the exposed key (RapidAPI's rotation guide: add a new authorization, then delete the compromised one — [docs](https://docs.rapidapi.com/docs/keys-and-key-rotation)). Unsubscribe from the supermarket price API plan if subscribed. | Not reused: provider dropped (no verified licence). |
| C4 | Apify API token | [Apify Console](https://console.apify.com) → **Settings → API & Integrations** → revoke/delete the exposed token ([docs](https://docs.apify.com/account/settings.md)). Check **Actors → Runs** and **Billing** for activity you did not start. | Not reused: provider dropped (scraping). |
| C5 | Spoonacular API key | Spoonacular **food-api console → Profile** → regenerate the API key. *(Exact button label not verified against the current console; if no regenerate option is shown, contact Spoonacular support to deactivate the key.)* | Not used in the app any more. |
| C6 | USDA FoodData Central key (api.data.gov) | Request a new key on the FoodData Central API key signup page and ask api.data.gov support to deactivate the old one. *(Self-service revocation not verified.)* | Not used in the app any more; low risk (free, rate-limited). |

Also check: any build you distributed (Expo Go share, internal or TestFlight) used these keys from `eas.json`; nothing further is needed once they are revoked.

When done, reply with "C1–C6 revoked/rotated" (no values). I will mark S1 complete in `SECURITY_REMEDIATION_PLAN.md`.

## C. Firebase decisions and preparation (before M2)

1. **Confirm ownership and access** to `intellishop-1f62f` (you are Owner in Firebase console → Project settings → Users and permissions).
2. **Confirm whether `intellishop-1f62f` is the Google Cloud project that was suspended**, or a different one.
3. **Export the current Security Rules** (Firestore → Rules, Storage → Rules) and send them as text (rules contain no secrets), or confirm none are set.
4. **Backup before any migration** (required before M2 moves data to per-user collections): Firestore → **Import/Export** → export to a Cloud Storage bucket. This requires the **Blaze** plan; M2–M3 also need Blaze for Cloud Functions. Decide whether to upgrade now. No user data will be migrated or deleted without your approval and a verified backup.
5. **New environments**: approve creating `intellishop-dev` and `intellishop-staging` (exact IDs may need a suffix if taken). New projects will use **London `europe-west2`** for Firestore and Functions. Note: the location of an existing Firestore database cannot be changed — check `intellishop-1f62f`'s location under Firestore → Settings; if it is not London, production stays where it is unless you approve a later migration.
6. **Web app config per environment**: for each project, Firebase console → Project settings → *Your apps* → add/select a **Web app** and keep its config ready; it goes into EAS environment variables (public values) — I will give exact variable names and commands in M2.

## D. Device testing (needed before TestFlight; not needed for M1 CI)

1. **Apple Developer Program** membership (O1). Without it there is no way to install a development build on your iPhone from Windows.
2. **Expo account** for EAS Build; then `npx eas-cli login` and `npx eas-cli init` in the project (links the EAS project; no secrets in Git).
3. EAS cloud builds replace the need for a Mac.

## E. Decide on the unexplained snapshot branch

Local branch `wip/unverified-uncommitted-snapshot` (in the bundle) holds 79 uncommitted changes found in the workspace at 2026-10-27 23:45 that I cannot attribute to any recorded action. They were not used for M1. Choose: **discard** (recommended — M1 re-implemented the same scope with verification) or **review**.
