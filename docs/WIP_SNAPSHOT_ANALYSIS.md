# Analysis of `wip/unverified-uncommitted-snapshot`

Branch preserved, not merged, not discarded. Commit `fe42954`, parent `92ad1ea` (the same parent as M1 commit `e7b52ea`). It records 79 uncommitted working-tree changes found at 2026-10-27 23:45 whose author is not identifiable from this session.

## 1. Size of the change (semantic, ignoring CRLF/LF)

| Compared with `92ad1ea` | Files | Insertions | Deletions |
|---|---|---|---|
| Snapshot | 89 | 1,254 | 31,570 |
| M1 `e7b52ea` | 122 | 2,074 | 31,189 |

Both remove the same V1 modules (client-side AI, fabricated prices, mocks, dead code) and introduce the same structure (tokens, Home | Lists | Pantry tabs, `(app)`/`(public)` groups, env-driven Firebase config). The snapshot is an earlier, **parallel and incomplete** attempt at the same M1 scope.

## 2. Snapshot vs M1 — what differs

| Item | Snapshot | M1 (current branch) | Assessment |
|---|---|---|---|
| Build/test tooling | No `tsconfig.json`, no ESLint config, no tests, no CI workflow; `package.json` scripts call `scripts/check-imports.mjs` and `scripts/scan-bundle-for-secrets.mjs`, **which do not exist** in the snapshot | All present and exercised | Snapshot is not buildable as delivered (`npm run lint`, `verify:*` would fail) |
| `react-dom` | Missing | 19.3.0 | Snapshot would hit the same `ERESOLVE` M1 had before the fix (required peer of `@radix-ui/react-tabs`) |
| Password reset | Still calls non-existent `resetPassword` | Fixed (`forgotPassword`) | M1 better |
| Firebase config | `firebase/config.ts` **throws at import** when config is missing → app crashes at start | Shows a configuration screen naming missing keys | M1 better |
| Firebase version | `^12.0.0` (unpinned major) | 11.10.0 pinned; 12.19.0 evaluated as candidate | Snapshot choice is plausible but unverified; see `DEPENDENCY_MIGRATION_REPORT.md` §3.1 |
| `expo-system-ui` | Added | Not used | Not required by any SDK 58 doctor check for this app |
| EAS link | `slug: 'intellishop'`; projectId from `EAS_PROJECT_ID` env var | `slug: 'intellishop'`; projectId from the owner's local `app.config.js` | Equivalent intent; M1 uses the verified ID |
| Error logging | Stops persisting error messages on the device; production logs the code only | **Adopted** in M1 (re-implemented, plus clearing the V1 `errorLogs` key) | Valuable — taken |
| `Button` | Restyled with tokens; variants primary/secondary/tertiary/destructive + non-Figma `outline`/`success`; `secondary` uses `action.subtle` fill | V1 Button with token colour | Useful starting point for M4, but **not verified against Figma component 100:56** (Figma has no `success` variant; the outlined "Optimise List" button on P02 suggests Secondary is an outline style — to be confirmed from the component) |
| `ErrorBoundary` | Restyled with tokens | Functional changes only | Cosmetic; M4 |
| Auth typing | `context/AuthContext.tsx` (TypeScript) | `AuthContext.jsx` + `AuthContext.types.ts` (JSDoc-typed) | Equivalent; M1 version is covered by tests |
| Auth helper name | `useAuthState` (not a hook) kept | Renamed `subscribeToAuthState` | M1 better |
| `tokens.ts` | Same values; exported as `color` | Exported as `colors` | Equivalent (M1 values verified by 32 token tests) |
| Screens | `ShoppingListScreen.jsx` name; Home/Pantry/Profile changes similar to M1 | `ListsScreen.jsx` | Equivalent |
| Credentials | 0 secret patterns; no hard-coded Firebase project (gitleaks full-history scan includes this branch: 0 findings) | Same | Clean |

## 3. Recommendation

- **Do not merge** the snapshot: it is incomplete (missing referenced scripts and all tooling), keeps two defects M1 fixed (password reset, crash on missing config), and lacks `react-dom`.
- **Already taken from it:** the error-logging privacy improvement (on-device error persistence removed).
- **Keep for reference until M4**, then delete: its token-based `Button.jsx` and `ErrorBoundary.jsx` can inform the M4 component rebuild after checking each variant against the Figma component set.
- No unique data, credentials or user-facing features are lost by not merging it.

Deleting the branch requires the owner's approval (not done).
