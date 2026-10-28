# Legal Implementation Checklist — engineering tasks by milestone

| | |
|---|---|
| Version | 0.2 (draft) |
| Date | 28 October 2026 |
| Links | Matrix IDs from `LEGAL_COMPLIANCE_MATRIX.md`; data IDs from `DATA_FLOW_INVENTORY.md`; food tests from `FOOD_SAFETY_TECHNICAL_SPEC.md` |
| Rule | A task is ticked only when its **acceptance test** has run and the log is in `docs/validation/`. Text describing a protection does not count. |

## M1 (in validation) — no new legal scope

M1 is accepted on its own executable criteria (CI). Legal work runs in parallel as documentation only.

## M2 — Privacy architecture, minimisation, account deletion

| # | Task | Matrix | Acceptance test |
|---|---|---|---|
| L2-01 | Remove phone number and address fields from registration, profile, `AuthContext.types.ts` and `registerUser`. Do not delete existing stored values without owner approval and a verified backup; stop writing them immediately | DP-04, AP-06 | RNTL: registration submits with only name, email and password; unit test: `registerUser` writes no `phoneNumber` or `address` |
| L2-02 | Registration: Terms checkbox **enforced**; privacy notice linked as information ("Read how we use your data"), not as something to agree to; no pre-ticked boxes; store `termsVersion` and `termsAcceptedAt` | DP-06, DP-07 | RNTL: "Create account" disabled until Terms are ticked; Firestore record contains the version |
| L2-03 | Firestore and Storage Security Rules with ownership by path; emulator tests | DP-16 | `@firebase/rules-unit-testing`: user A cannot read, write or list user B's data; unauthenticated access denied |
| L2-04 | Data model migration to `users/{uid}/…` subcollections | DP-16 | Migration dry-run on an emulator copy; owner-approved run only after a backup |
| L2-05 | Production logging: remove or guard `console.log` with identifiers and content (98 console calls) | DP-13 | Static check in CI: no `console.log` outside `__DEV__` guards in `context/`, `firebase/`, `src/` |
| L2-06 | **Account deletion**: Settings → Account → Delete account. Confirmation screen states what is deleted, what is kept and why, and the timescale. Callable `deleteAccount` (re-authentication required) deletes the Auth user, `users/{uid}/**`, lists, pantry, Storage `profile_images/{uid}/**` and the AI cache; writes a minimal deletion log (UID hash, timestamp; no email) | DP-10, AP-05 | Emulator integration test: after deletion, zero documents or files for the UID; Auth user absent; second call is idempotent |
| L2-07 | Deletion with an active subscription (subscription milestone dependency): notice "Billing continues through Apple until you cancel"; button opens `showManageSubscriptions`; RevenueCat customer deletion | AP-05 | Sandbox test with an active subscription |
| L2-08 | **Data export**: Settings → Privacy → Download my data. Callable returns JSON (profile, lists, pantry, preferences, consents, favourites) through the share sheet | DP-08 | Integration test: export contains all seeded records and no other user's data |
| L2-09 | Profile photo: delete the previous file on replacement; limit size and type in Storage rules; remove the full-library permission request; use the system picker | DF-5, AP-04 | Device test: the picker opens with no permission prompt; Storage contains one file per user |
| L2-10 | Consent records `users/{uid}/consents/{type}` (version, granted, timestamps); server helper `hasConsent(uid, type, minVersion)` | DP-06, DP-05 | Unit tests on the helper |
| L2-11 | Settings → **Legal & Privacy** section skeleton with links to hosted pages; versions shown | AP-01 | RNTL: every link resolves to a configured URL (no `console.log` handlers) |
| L2-12 | Data protection complaints and rights-request entry point (Settings → Help → "Privacy request or complaint") opening a form or `mailto:` to the support address | DP-21 | RNTL: entry visible; destination configured |

## M3 — AI transparency and food-safety safeguards

| # | Task | Matrix | Acceptance test |
|---|---|---|---|
| L3-01 | AI first-use disclosure and explicit-permission sheet; Settings toggle; server enforces the consent record | AP-07, AI-01 | RNTL + emulator: no provider call without consent; withdrawal blocks the next call |
| L3-02 | Request builder sends no name, email, address or UID; uses a pseudonymous request ID | AI-05 | Unit test on the serialised request body |
| L3-03 | Dietary and allergy screen with **explicit consent** (separate screen, unticked, plain-language purpose, withdraw = delete) | DP-05 | RNTL + emulator: preferences not saved without consent; withdrawal deletes the fields |
| L3-04 | Allergen lexicon, generation pipeline checks, UI banners and badges, human review before list changes | FS-01…FS-03, AI-02 | Tests FT-01…FT-12 (`FOOD_SAFETY_TECHNICAL_SPEC.md` §6) |
| L3-05 | Schema forbids price and availability; nutrition per decision FS-D1 | AI-03 | FT-07 |
| L3-06 | Full DPIA completed and signed by the owner before the M3 release | DP-18 | Signed DPIA in `docs/compliance/` |
| L3-07 | Processor terms recorded (provider DPA version, retention, location) | DP-15, AI-04 | Entry in `DATA_FLOW_INVENTORY.md` §1 |
| L3-08 | **Report** action on every AI result (recipe card): sends the recipe ID, prompt/lexicon versions and the user's reason to support — never to the AI provider — and confirms receipt. Referenced by AI Transparency §9 and Food Safety §8 | AI-02, FS-03 | RNTL: Report visible on each result; payload contains no pantry contents beyond the shown recipe; destination configured |

## M4 — Legal screens and approved visual integration

| # | Task | Matrix | Acceptance test |
|---|---|---|---|
| L4-01 | Native Legal screens rendering the bundled copy of each document (same version as the website) with version, effective date and "View online" | AP-01, AX-01 | RNTL snapshot of headings; VoiceOver labels; Dynamic Type at the largest accessibility size without truncation |
| L4-02 | Contextual links: registration, onboarding, paywall, AI sheet, dietary settings, account deletion, help | — | Navigation tests: each entry point opens the correct document |
| L4-03 | Terms re-acceptance on a **major** version change; privacy-policy change notice (information only) on update | DP-07 | Unit test on version comparison; RNTL prompt |

## Subscription milestone — Apple billing disclosures

| # | Task | Matrix | Acceptance test |
|---|---|---|---|
| LS-01 | Paywall shows the localised StoreKit price, period, renewal statement, what each plan includes, usage limits, and the introductory credit status; links to Terms, Privacy and Subscription Terms; **Restore Purchases** | AP-10…AP-14 | RNTL with mocked offerings; sandbox purchase on a device |
| LS-02 | Settings → Subscription: current plan, renewal date (from entitlement), **Manage subscription** (`showManageSubscriptions`), refund request route (`beginRefundRequest`) | AP-05, CL-04 | Sandbox device test |
| LS-03 | No hard-coded prices in code or copy; CI grep for `£` in UI source except the test fixtures | AP-14, CL-05 | CI static check |
| LS-04 | Subscription-regime readiness review against the made Regulations (if approved) before launch | CL-04 | Legal checklist signed off |
| LS-05 | **2027 subscription rules** (only if the Consumer Subscription Contracts Regulations are made): pre-contract key information, reminder notices before renewals (including the 6-monthly reminders for monthly contracts), renewal cooling-off, and easy exit — for subscriptions bought through the App Store as well. Server job reads the entitlement renewal dates; reminders by email/in-app | CL-04 | Unit tests on reminder scheduling; dry run with sandbox renewals; legal sign-off |
| LS-06 | **Cooling-off waiver decision** (Consumer Contracts Regs 2013 reg. 37): either (a) express consent + acknowledgement before the first purchase and a durable-medium confirmation, or (b) no waiver and honour 14-day cancellations through Apple refunds. Owner decides with legal advice; implement the chosen option | CL-03 | RNTL for (a) consent capture + confirmation email test; or documented (b) process |

## Implementation status — 28 October 2026 (Packages B and C)

Statuses follow `LEGAL_RELEASE_GATE.md`: **IMPLEMENTED** = built and tested on the local proxy toolchain only (not CI, emulator or device). Nothing in this list is ticked as PASS yet.

| ID | Status | Evidence |
|---|---|---|
| L2-01 | IMPLEMENTED | `src/screens/auth/AuthScreens.tsx` (name, email, password); `firebase/authHelpers.js` writes no phone/address; `__tests__/ui/screens.test.tsx` "C1 registration", `__tests__/ui/v2-compliance.test.ts`. Existing V1 values untouched (owner decision) |
| L2-02 | IMPLEMENTED | Terms checkbox enforced (submit blocked with a message rather than a disabled button, so the reason is announced); Privacy Policy linked as information; `termsVersion`/`termsAcceptedAt` stored |
| L2-03 | IMPLEMENTED | `firestore.rules`, `storage.rules`, `rules-tests/*` — emulator run NOT TESTED (CI) |
| L2-04 | NOT IMPLEMENTED | Migration of V1 top-level data: owner-approved run only, after backup |
| L2-05 | IMPLEMENTED (M1) | — |
| L2-06 | IMPLEMENTED | `DeleteAccountScreen` + `functions/src/handlers/account.ts`; handler and screen tests |
| L2-07 | PARTIAL | Apple subscription notice + Manage link on the deletion screen; RevenueCat deletion hook exists but RevenueCat is not configured |
| L2-08 | IMPLEMENTED | Profile › Privacy › Download my data → `exportUserData` → share sheet (JSON) |
| L2-09 | NOT APPLICABLE in V2.0 | Profile photo feature removed from the first release (`expo-image-picker` and its permission removed); Privacy Policy row marked `[PENDING DECISION]` |
| L2-10 | IMPLEMENTED | `users/{uid}/consents/{ai|dietary}` written by the server with versions |
| L2-11 | IMPLEMENTED | Profile › Legal & Privacy (in-app documents; hosted URLs BLOCKED by domain) |
| L2-12 | IMPLEMENTED (entry) | Profile › Help › Privacy request or complaint → Support page; contact email is an owner fact |
| L3-01 | IMPLEMENTED | `AiConsentScreen` (names provider, what is and is never sent); Settings toggle; server refuses without consent (handler tests) |
| L3-02 | IMPLEMENTED | Prompt builder sends ingredient data only (`functions/src/handlers/prompt.ts`; tests) |
| L3-03 | IMPLEMENTED | `DietaryPreferencesScreen`: explicit unticked consent each save; withdrawal deletes |
| L3-04/05 | IMPLEMENTED | Lexicon, screening, strict schema; recipe card warnings |
| L3-06/07 | OPEN | Owner |
| L3-08 | NOT IMPLEMENTED | — |
| L4-01 | IMPLEMENTED | `LegalDocumentScreen` + `LegalMarkdown` (shared parser) |
| L4-02 | IMPLEMENTED | Links from registration, AI permission, allergies & diets, deletion, paywall, Profile |
| L4-03 | IMPLEMENTED | `TermsUpdateScreen` guard in `app/(app)/_layout.tsx` |
| LS-01 | PARTIAL | Paywall without prices or purchase while StoreKit is not configured; Restore present (reports "not available") |
| LS-02 | PARTIAL | Manage subscription and Request a refund open Apple's pages; renewal date shown only once entitlements exist |
| LS-03 | IMPLEMENTED | CI static test: no `£<digits>` literal in UI code |
| LS-04…06 | OPEN | Owner / legal |

## Release QA — legal and App Store gate

See `LEGAL_RELEASE_GATE.md`.
