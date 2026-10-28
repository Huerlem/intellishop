# Dependency Installation and Executable Validation Report

Date: 2026-10-27 · Branch: `feature/v2-production-rebuild` · Environment: Linux cloud workspace, Node `v22.23.4`, npm `10.9.9`, TypeScript `7.0.2` (global), no Xcode / macOS / iOS simulator.
Raw logs with real command output and exit statuses: [`docs/validation/`](validation/).

Owner authorisation (2026-10-27 19:04): install via the environment's trusted proxy, TLS verification on, no untrusted registry, lockfile respected, no exposed credentials used.

## 1. Results

| # | Check | Command | Exit status | Result | Log |
|---|---|---|---|---|---|
| V0 | Secret scan, all blobs in history, masked | `python3 -I scan.py <repo>` | 0 (scan ran) | **FAIL** — 2 Google keys, 5 `EXPO_PUBLIC_*` credential values in `eas.json`, Firebase app ID; 3 false positives | `00_secret_scan.log` |
| V1a | Pre-flight: registry pinning | inspect `package-lock.json` | — | **PASS** — all 1,195 resolved URLs are `registry.npmjs.org`; `strict-ssl=true`; lockfileVersion 3 | — |
| V1 | Locked install | `npm ci --no-audit --no-fund` via proxy, `cafile=/root/.ccr/ca-bundle.crt`, `strict-ssl=true` | none from npm — process terminated by operator after ~11 min of continuous `connect_rejected`; background wrapper reported 144 (signal) | **BLOCKED** | `01_npm_ci.log` |
| V1b | Deterministic reproduction | `npm view yup version --fetch-retries=0` (via proxy) | **1** — `E403 403 Forbidden - GET https://registry.npmjs.org/yup` | **BLOCKED** | `03_npm_registry_probe.log` |
| V1c | Direct (no proxy) | same, direct | **1** — `ENOTFOUND registry.npmjs.org` | **BLOCKED** | `03_npm_registry_probe.log` |
| V1d | Proxy diagnostics | `curl $HTTPS_PROXY/__agentproxy/status` | 0 | 20 recent `connect_rejected` for `registry.npmjs.org:443` — gateway answered 403 to CONNECT ("policy denial") | `03_npm_registry_probe.log` |
| V2 | Static type/import analysis (no `node_modules`) | `tsc -p tsconfig.audit.json` (`allowJs`, `checkJs`, `noEmit`) | **1** | **FAIL** — 1,757 diagnostics. 285 are "cannot find module" for third-party packages (expected without install) and most others are implicit-`any`/typing noise. Real defects extracted: 7 missing named exports (TS2614), 2 undeclared identifiers that throw at runtime (TS2304: `currentList`, `result`), broken local import `./firebase`, duplicate object key (TS1117), `void` truthiness (TS1345). False positives: PNG module typings, RN globals (`__DEV__`, `global`, `__dirname`). | `02_tsc_static.log`, `tsconfig.audit.json` |
| V3 | Vulnerability audit | `npm audit` | not run | **BLOCKED** — requires registry | — |
| V3b | Alternative vulnerability source | `curl -X POST https://api.osv.dev/v1/query` | curl 56 — `CONNECT tunnel failed, response 403` | **BLOCKED** | (inline in this report) |
| V4 | Expo compatibility | `npx expo install --check`, `npx expo-doctor` | not run | **BLOCKED** — requires installed packages | — |
| V5 | JS bundle build | `npx expo export --platform ios` | not run | **BLOCKED** | — |
| V6 | Unit / integration tests | `npx jest` | not run | **NOT TESTED** — repository contains 0 test files, no test script | — |
| V7 | iOS build / simulator | `eas build` / Xcode | not run | **BLOCKED** — no macOS here; owner has no Mac (EAS cloud build required); EAS/Apple credentials not provided | — |
| V8 | Figma frame export to disk | `curl` of Figma MCP asset URLs | curl 22 — HTTP 403 ×10 | **BLOCKED** (inspected inline instead) | — |

A partial `node_modules` (681 empty or incomplete package directories, 5.4 MB, without `expo`, `react-native`, `firebase`) was left by the interrupted install and was deleted to avoid misleading later runs.

## 2. What unblocks the executable checks

The egress policy of this session does not allow `registry.npmjs.org`. The proxy message states that allowed domains are configured on claude.ai in a web browser: on an individual paid plan by the account holder under **Settings → Capabilities**; on Team/Enterprise by an admin under **Organization settings → Capabilities**; on the Free plan only package managers can be allowed. Enabling the npm registry (package managers) would unblock V1, V3, V4, V5 and V6. `api.osv.dev` is optional.

Alternative that does not depend on this environment: run the same commands in GitHub Actions (macOS runner for iOS) or EAS Build, with logs attached to the PR. This is planned for milestone M0 anyway, because the owner has no Mac.

## 3. Interpretation rules applied

- No feature is reported as working: nothing was executed at runtime.
- Static findings are labelled FAIL only where the tool output or the source proves the defect.
- The `npm ci` exit status is reported as "none from npm" because the process was stopped by the operator; the reproducible exit status comes from V1b.

## M1 update (2026-10-28)

The npm registry is still blocked in this environment (`npm view yup version` via proxy → E403, re-checked 2026-10-27 23:45). As authorised, installation, typecheck, lint, tests, iOS bundle export and the bundle secret scan now run in GitHub Actions (`.github/workflows/ci.yml`); M1 is not PASS until that run succeeds. Checks that could run here are recorded in `docs/validation/05_m1_local_checks.log`:

| Check | Result |
|---|---|
| Bundle secret scanner self-test (4 cases, expected exit codes 0/1/1/2) | PASS |
| Python replica of the Jest static-security and token assertions | 17/17 passed (replica, not the Jest run) |
| TypeScript 7.0.2 syntax / local-import pass over all sources (no `node_modules`) | 0 syntax errors, 0 unresolved local imports, 0 missing exports; one real typing defect found and fixed |
| `node --check` on JS configs; JSON/YAML parse | PASS |

Expo SDK 58 versions were read from `github.com/expo/expo` branch `sdk-58` (`packages/expo/bundledNativeModules.json`) because the npm registry is unreachable; resolved versions will come from the CI-generated lockfile.
