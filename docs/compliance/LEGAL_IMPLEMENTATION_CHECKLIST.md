# Legal Implementation Checklist — engineering tasks by milestone

| | |
|---|---|
| Version | 0.1 (draft) |
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

## Release QA — legal and App Store gate

See `LEGAL_RELEASE_GATE.md`.
