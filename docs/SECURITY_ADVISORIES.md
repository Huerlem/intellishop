# Production dependency advisories — assessment

| | |
|---|---|
| Date | 28 October 2026 |
| Lockfile assessed | `package-lock.json` from owner commit `9404c9e` (Expo SDK 58, 1 512 entries, all from registry.npmjs.org) |
| Method | `npm audit` cannot run in this environment (npm registry unreachable). The same data source, the **GitHub Advisory Database** (reviewed advisories, clone of `github/advisory-database` at its 28 Oct 2026 19:56 UTC head, 37 302 advisories), was matched offline against every non-dev package in the lockfile with `semver` ranges, mirroring `npm audit --omit=dev`. Script: `docs/validation/17_offline_audit.log` header. **This approximation is not a substitute for the CI gate**, which remains `npm audit --omit=dev --audit-level=high` |
| Result before remediation | 4 findings: **2 high**, 2 low |
| Result after remediation (simulated) | 1 low (no fix exists), **0 high/critical** |

## High

| Advisory | Package (installed) | Introduced by | Fixed in | Reachable in IntelliShop? | Remediation |
|---|---|---|---|---|---|
| GHSA-m9gg-hp2v-232j / CVE-2026-101916 — `getAuthContext` can report unauthorised client certificates as authorised when `requireClientCertificate` is `false` | `@grpc/grpc-js` 1.9.16 | `firebase` 11.10.0 → `@firebase/firestore` 4.8.0 (`"~1.9.0"`) | 1.13.6, 1.14.5 (no 1.9.x fix) | **No.** The flaw is in gRPC **server** credentials. The app uses Firestore's React Native build (WebChannel/fetch); grpc-js is loaded only by Firestore's Node build (used by `@firebase/rules-unit-testing` in CI) and never acts as a gRPC server | `overrides: { "@grpc/grpc-js": "1.14.6" }`. No upstream alternative: `@firebase/firestore` still pins `~1.9.0` on firebase-js-sdk `main` (checked 28 Oct, firebase 13.1.0), so upgrading Firebase would not help. Same major (1.x); the APIs Firestore uses (credentials, Metadata, loadPackageDefinition) are unchanged. Exercised by the CI rules tests against the emulator |
| GHSA-mrhx-c7xc-m3w5 / CVE-2023-54404 — Zod can exhaust memory validating oversized arrays | `zod` 3.25.76 (nested) | `expo` 58.0.20 → `@expo/cli` 58.1.16 (`"^3.25.76"`) | 4.6.6 (no 3.x fix) | **No production exposure.** `@expo/cli` is developer tooling (not in the iOS bundle). It uses Zod only to validate locally installed DevTools plugin manifests and plugin command output during `expo start` (`src/start/server/DevToolsPlugin.schema.ts`, `createMCPDevToolsExtensionSchema.ts`) — trusted local input | `overrides: { "@expo/cli": { "zod": "4.6.7" } }`, scoped to `@expo/cli` only. Every Zod call in those files (`object`, `string().min/url`, `enum`, `array().readonly`, `union`, `literal`, `optional`, `describe`, `number`, `boolean`, `safeParse`) exists with the same runtime behaviour in Zod 4. Upstream `@expo/cli` (sdk-58 branch 58.1.17 and `main`) still declares `^3.25.76`, so there is no non-override fix. CI's `expo export`, `expo install --check` and `expo-doctor` exercise the CLI with the override |

## Low (not gating; tracked)

| Advisory | Package | Note |
|---|---|---|
| GHSA-f596-whhp-79r4 | `@grpc/grpc-js` 1.9.16 | Server error messages forwarded to clients; also fixed by the override above |
| GHSA-gcqx-w48m-w2h4 | `deepmerge` 4.3.1 (via `@expo/config`, `formik`, `jest-config`) | No fixed version published. `formik` was removed from the app; remaining use is build-time config merging of trusted files |

## Rules applied

- No `npm audit fix --force`; no major upgrades of direct dependencies.
- Overrides are pinned to exact patched versions, scoped as narrowly as npm allows, and listed here with their justification. Remove each when the upstream range includes a fixed version.
- `package-lock.json` must be regenerated after any change to `package.json`: the "Generate lockfile" workflow does this automatically on each push to `feature/**` (official registry only, registry-origin check, `expo install --check`).
- The CI gate is unchanged: any high or critical production advisory still fails the build.

## Cloud Functions

`functions/package-lock.json` does not exist yet (created by the lockfile workflow). Direct dependencies `firebase-admin` 14.5.0 and `firebase-functions` 7.4.0 have no reviewed advisories; transitive results will come from the CI "Functions npm audit gate".
