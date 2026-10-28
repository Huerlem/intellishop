# IntelliShop

AI-assisted grocery planning for iOS: shopping lists, pantry, shopping trips and (from M3) recipe suggestions generated from your own pantry and lists.

Status: V2 rebuild in progress on `feature/v2-production-rebuild`. See `docs/IMPLEMENTATION_ROADMAP.md` and the latest milestone report (`docs/M1_REPORT.md`).

## Stack
Expo SDK 58 · React Native 0.88 · Expo Router (tabs: **Home | Lists | Pantry**) · Firebase JS SDK (Auth, Firestore, Storage) · TypeScript for new code · Jest + Testing Library · ESLint (Expo config).

## Requirements
- Node.js 22
- An Expo account for EAS builds; an Apple Developer account to install builds on an iPhone (no Mac required — builds run on EAS)

## Setup
```bash
npm ci                      # uses package-lock.json
cp .env.example .env.local  # fill in the PUBLIC Firebase web app config for your environment
npm start
```
`.env.example` explains every variable. Only public configuration belongs in the app. **Private provider keys (AI, payments, data providers) never go in `.env*`, `eas.json` or EAS environment variables** — they live in Google Cloud Secret Manager and are used only by Cloud Functions (`docs/SECURITY_CLOUD_SECRETS_IMPLEMENTATION.md`).

Environments are selected with `APP_ENV` (`development`, `staging`, `production`), set per EAS build profile in `eas.json`; each has its own bundle identifier.

## Checks
```bash
npm run typecheck
npm run lint
npm test
npm run export:ios && npm run scan:bundle   # exported bundle must contain no credentials
```
The same checks run in GitHub Actions (`.github/workflows/ci.yml`), plus `expo install --check`, `expo-doctor`, `npm audit` and gitleaks secret scanning (`.github/workflows/secret-scan.yml`).

## Design
Implementation follows the approved Figma V2 file (tokens in `src/theme`, matrix in `docs/FIGMA_IMPLEMENTATION_MATRIX.md`).
