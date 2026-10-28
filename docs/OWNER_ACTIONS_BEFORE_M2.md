# Owner Actions — to close M1 and before M2

Date: 2026-10-28. Never paste credential values into chat, commits, issues or documents. Where a step creates a new credential, keep it in the provider console or Secret Manager only.

## A. Publish the branch and run CI (required for M1 PASS)

Requirements: Git for Windows (includes Git Credential Manager for GitHub sign-in). Node.js is **not** needed — the lockfile is generated on GitHub.

Your local `intellishop-new` folder has a different Git history (branch `master`, no remote). Do **not** use it for this; clone the bundle into a new folder instead.

### A1. Verify and clone the bundle (PowerShell)
```powershell
# Folder where you saved intellishop-feature-v2.bundle
cd $HOME\Downloads

# 1) Verify the bundle (must end with "The bundle records a complete history.")
git bundle verify .\intellishop-feature-v2.bundle

# 2) Show the branches inside it
git bundle list-heads .\intellishop-feature-v2.bundle

# 3) Clone the development branch into a NEW folder
git clone --branch feature/v2-production-rebuild .\intellishop-feature-v2.bundle C:\dev\intellishop-v2
cd C:\dev\intellishop-v2

# 4) Check the history: the first line is the latest commit; e7b52ea (M1) and 0e26321 (V1) must appear
git log --oneline -12
git merge-base --is-ancestor e7b52ea HEAD; if ($LASTEXITCODE -eq 0) { "e7b52ea is in this branch" } else { "MISSING e7b52ea - stop" }
```

### A2. Push only the development branch (PowerShell)
```powershell
# The clone's "origin" points at the bundle file; point it at GitHub instead
git remote set-url origin https://github.com/Huerlem/intellishop.git

# Before pushing: GitHub main must still be the V1 commit 0e2632144190c0fea8d12e29952bb98095fe174c
git ls-remote origin refs/heads/main

# Push ONLY the development branch (main is not touched; no force)
git push -u origin feature/v2-production-rebuild

# After pushing: main must be unchanged
git ls-remote origin refs/heads/main refs/heads/feature/v2-production-rebuild
```
A browser window may open to sign in to GitHub (Git Credential Manager).

Optional — also keep the unverified snapshot on GitHub (its CI run will fail at the lockfile step, which is expected; the branch is otherwise preserved inside the bundle file):
```powershell
git push origin refs/remotes/origin/wip/unverified-uncommitted-snapshot:refs/heads/wip/unverified-uncommitted-snapshot
```

### A3. Generate the lockfile and run CI (GitHub website)
1. Repository → **Actions**. If GitHub asks, click **"I understand my workflows, go ahead and enable them"**.
2. The push already started **CI** (it will fail at *Require package-lock.json* — expected on this first push) and **Secret scan** (should pass).
3. Actions → **Generate lockfile** → **Run workflow** → Branch: `feature/v2-production-rebuild` → **Run workflow**. It installs from registry.npmjs.org, checks every package source, commits `package-lock.json` to the branch and then starts **CI** and **Secret scan** on that commit.
4. If *Generate lockfile* fails with a permissions error at the commit step: Settings → **Actions → General → Workflow permissions** → *Read and write permissions* → Save, then run it again.

### A4. Send me the evidence
- The URLs of: the *Generate lockfile* run, and the **CI** and **Secret scan** runs on the lockfile commit.
- Artifacts from those runs: `ci-logs` (CI), `lockfile-and-logs` (Generate lockfile), `gitleaks-report` (Secret scan).
I will review every step, fix failures on the branch, and send a new bundle (or you can give this session push access). M1 is reported PASS only when all blocking CI steps succeed on a commit that contains the lockfile.

Optional: Settings → **Code security** → enable *Secret scanning* and *Push protection*.

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

**Your local project:** `intellishop-new\.env` holds the same five values and is also committed in that folder's local Git history (commit `31db6b7`). After revoking, delete `.env` and do not push that local repository anywhere.

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
4. **Confirm the EAS project**: `app.config.ts` now links EAS project `ad1df46f-81bc-491f-b80f-5a7c81e0eae2` with slug `intellishop` (taken from your local `app.config.js`). Check it at expo.dev → your account → Projects. If you prefer a fresh EAS project, tell me before the first EAS build.

## E. Unexplained snapshot branch

`wip/unverified-uncommitted-snapshot` is preserved in the bundle and analysed in `WIP_SNAPSHOT_ANALYSIS.md`: recommendation **do not merge**; its one valuable change has been adopted; keep it for reference until the M4 component rebuild, then delete (your approval needed).
