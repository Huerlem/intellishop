# Legal Release Gate — IntelliShop V2

| | |
|---|---|
| Version | 0.2 |
| Date | 28 October 2026 |
| Overall status | **NOT READY** — 0 of 10 criteria PASS |
| Rule | The App Store submission (and external TestFlight, where marked) does not proceed while any **blocking** item is FAIL or BLOCKED. Passing this gate is **not** a legal certification and does not guarantee regulatory compliance. |
| Status words | **PASS** = acceptance check ran and passed, evidence in `docs/validation/` · **IMPLEMENTED** = built and unit/integration-tested on the local proxy toolchain only; not run in CI, on an emulator or on a device · **FAIL** · **BLOCKED** (needs owner, account or infrastructure) · **NOT TESTED** |

## 1. Acceptance criteria (requirement §10)

| # | Criterion | Status | Evidence / reason |
|---|---|---|---|
| G1 | Source-supported drafts of all public documents | **IMPLEMENTED** (drafts) | 10 documents v0.2.0-draft in `docs/legal/`, sources S-01…S-44 in the matrix; 133 publication markers remain (owner facts, pending features, legal review). Release build fails while markers remain (`npm run legal:release`) |
| G2 | Accurate data-flow mapping | **NOT TESTED** | `DATA_FLOW_INVENTORY.md` v0.2 updated for trips/Pantry Update; owner review and re-check against the release build pending |
| G3 | No incorrect claims about implemented security | **NOT TESTED** | Drafts mark unbuilt features `[PENDING IMPLEMENTATION]`; final check at release (DP-24) |
| G4 | Functional and accessible public URLs | **BLOCKED** | No domain or hosting decision (owner); static site builder ready (`npm run legal:build`) |
| G5 | In-app policy access | **IMPLEMENTED** | In-app legal screen renders the same Markdown as the website (`src/screens/LegalDocumentScreen.tsx`), reachable signed out (registration) and signed in (Profile › Legal & Privacy); drafts carry a "Draft — not yet in force" banner. RNTL test: registration opens the Privacy Policy. Not device-tested |
| G6 | Working account deletion | **IMPLEMENTED** | UI (`DeleteAccountScreen`: confirmation, re-authentication, Apple subscription notice) + server handler (`deleteAccount`: all user data, files, subscription record, Auth user last, hashed log, idempotent). Handler tests 3/3 and screen test pass on the proxy toolchain. **NOT TESTED** against the Firebase emulator (CI job) or a real project |
| G7 | Subscription disclosures match Apple product configuration | **BLOCKED** | Products not configured in App Store Connect; prices provisional (D1); purchases not enabled (paywall shows "not available yet", no hard-coded prices — CI static test LS-03) |
| G8 | User-facing AI and food-safety warnings | **IMPLEMENTED** | AI permission screen naming the provider and data sent; allergies & diets screen with explicit consent and "not a guarantee" warning; recipe cards show "AI-generated", allergen warnings, per-ingredient checks and a check-before-cooking notice; use-by vs best-before explained in the Pantry editor. AI generation is paused by default (`AI_PAUSED=true`); no end-to-end AI run |
| G9 | Privacy declarations match the shipped code | **NOT TESTED** | Mapping drafted; no iOS build exists |
| G10 | Compliance checks with documented evidence | **FAIL** | Many checks now automated (rules tests, handler tests, UI tests, static checks) but **none has run in CI**: the development branch is not on GitHub yet |

## 2. Blocking issues

| ID | Blocker | Owner | Blocks | Type | Status (28 Oct) |
|---|---|---|---|---|---|
| B-L01 | Controller identity: legal name, trading name, publishable postal address, contact email | Owner | Privacy Policy, Terms, support page, App Store seller | Owner info | Open |
| B-L02 | ICO data protection fee self-assessment and payment (likely Tier 1, £52; £47 by direct debit) | Owner | External TestFlight with real users; launch | Legal | Open |
| B-L03 | Exposed V1 credentials revoked (C1–C6); breach-assessment decision recorded | Owner | Beta and launch (security claims, DP-16/17) | Security | Open |
| B-L04 | Firestore and Storage Security Rules written and tested | Engineering | Any external tester data | Security | **IMPLEMENTED** (rules + emulator tests written); emulator run **NOT TESTED** (CI job `firebase`) |
| B-L05 | Account deletion and data export | Engineering | App Review 5.1.1(v); UK GDPR rights | Apple + law | **IMPLEMENTED**; emulator/device **NOT TESTED** |
| B-L06 | Registration minimisation; enforced Terms acceptance; working legal links | Engineering | App Review 5.1.1(i), (v) | Apple + law | **IMPLEMENTED**; device **NOT TESTED**. Existing V1 phone/address values: owner decision (no deletion without backup) |
| B-L07 | Domain and hosting for public legal pages and the Support URL | Owner | App Store Connect metadata | Apple | Open |
| B-L08 | Processor terms accepted and recorded (Firebase DPST, AI provider DPA, RevenueCat DPA) and transfer mechanisms confirmed | Owner | Privacy Policy accuracy | Law | Open. The consent screen names Anthropic (Claude) because that is the implemented adapter — confirm or change before release |
| B-L09 | Full DPIA for AI and dietary processing | Owner + engineering | AI release | Law | Open |
| B-L10 | Third-party AI explicit-permission flow | Engineering | App Review 5.1.2(i) | Apple | **IMPLEMENTED** (screen + server enforcement); device **NOT TESTED** |
| B-L11 | Food-safety enforcement and tests FT-01…FT-14 | Engineering | Release of AI recipes | Safety | **IMPLEMENTED**; tests pass on the proxy toolchain; CI **NOT TESTED** |
| B-L12 | Final prices, plan contents and quotas; App Store Connect products | Owner | Subscription Terms; paywall | Apple + law | Open |
| B-L13 | Subscription regulations approval status and the app-store trader-role assessment | Owner (legal review when possible) | Subscription Terms | Law (prospective, 1 Jan 2027) | Open (draft laid 19 Oct 2026, not yet approved) |
| B-L14 | Minimum age decision and children assessment | Owner | Terms; App Store age rating | Law | Open |
| B-L15 | Data protection complaints route (DPA 2018 s.164A) | Owner + engineering | Launch | Law | In-app entry **IMPLEMENTED** (Profile › Help › Privacy request or complaint → Support page); destination email is an owner fact |
| B-L16 | App Privacy answers and privacy manifest checked against the built binary | Engineering (release) | Submission | Apple | Open (no build) |
| B-L17 | Development branch published to GitHub so CI (lockfile, tests, rules emulator, secret scan) can run | Owner (repository access) | Every "NOT TESTED in CI" item above | Process | **BLOCKED** — this environment has no write access to `Huerlem/intellishop` |
| B-L18 | Retention period for shopping-trip history (`DATA_FLOW_INVENTORY.md` D13) | Owner | Privacy Policy §9; storage limitation | Law | Open — trips are now stored (needed for Shopping Mode and Pantry Update); no automatic deletion until a period is decided |

## 3. Non-blocking (track)

- Expansion beyond the UK storefront (EX-01…EX-03): restrict availability to the UK.
- Online Safety Act re-assessment before any sharing feature (AI-06).
- DPO re-assessment at scale (DP-19).
- Data bridge status re-check before launch (S-32).
- "Report" button on AI results (L3-08) referenced by AI Transparency and Food Safety drafts — **not implemented**; the drafts mark it `[PENDING IMPLEMENTATION]`.
