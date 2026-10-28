# Legal Release Gate — IntelliShop V2

| | |
|---|---|
| Version | 0.1 |
| Date | 28 October 2026 |
| Overall status | **NOT READY** — 0 of 10 criteria PASS |
| Rule | The App Store submission (and external TestFlight, where marked) does not proceed while any **blocking** item is FAIL or BLOCKED. Passing this gate is **not** a legal certification and does not guarantee regulatory compliance. |

## 1. Acceptance criteria (requirement §10)

| # | Criterion | Status | Evidence / reason |
|---|---|---|---|
| G1 | Source-supported drafts of all public documents | **FAIL** | Source register and compliance matrix exist; the 8 public documents are not drafted yet |
| G2 | Accurate data-flow mapping | **NOT TESTED** | `DATA_FLOW_INVENTORY.md` v0.1 written from code review of `c836629`; owner review and re-check against the release build pending |
| G3 | No incorrect claims about implemented security | **NOT TESTED** | No public documents yet; check required at release (DP-24) |
| G4 | Functional and accessible public URLs | **BLOCKED** | No domain or hosting decision (owner) |
| G5 | In-app policy access | **FAIL** | Registration links are `console.log` stubs (`RegisterScreen.jsx`) |
| G6 | Working account deletion | **FAIL** | Not implemented (DP-10) |
| G7 | Subscription disclosures match Apple product configuration | **BLOCKED** | Products not configured in App Store Connect; prices provisional (D1) |
| G8 | User-facing AI and food-safety warnings | **FAIL** | AI features not built (M3) |
| G9 | Privacy declarations match the shipped code | **NOT TESTED** | Mapping drafted; no iOS build exists yet |
| G10 | Compliance checks with documented evidence | **FAIL** | Matrix lists the checks; most are not yet executed |

## 2. Blocking issues

| ID | Blocker | Owner | Blocks | Type |
|---|---|---|---|---|
| B-L01 | Controller identity: legal name, trading name, publishable postal address, contact email | Owner | Privacy Policy, Terms, support page, App Store seller | Owner info |
| B-L02 | ICO data protection fee self-assessment and payment (likely Tier 1) | Owner | External TestFlight with real users; launch | Legal |
| B-L03 | Exposed V1 credentials revoked (C1–C6); breach-assessment decision recorded | Owner | Beta and launch (security claims, DP-16/17) | Security |
| B-L04 | Firestore and Storage Security Rules written and tested | Engineering (M2) | Any external tester data | Security |
| B-L05 | Account deletion and data export | Engineering (M2) | App Review 5.1.1(v); UK GDPR rights | Apple + law |
| B-L06 | Registration minimisation; enforced Terms acceptance; working legal links | Engineering (M2) | App Review 5.1.1(i), (v) | Apple + law |
| B-L07 | Domain and hosting for public legal pages and the Support URL | Owner | App Store Connect metadata | Apple |
| B-L08 | Processor terms accepted and recorded (Firebase DPST, AI provider DPA, RevenueCat DPA) and transfer mechanisms confirmed | Owner | Privacy Policy accuracy | Law |
| B-L09 | Full DPIA for AI and dietary processing | Owner + engineering | M3 release | Law |
| B-L10 | Third-party AI explicit-permission flow | Engineering (M3) | App Review 5.1.2(i) | Apple |
| B-L11 | Food-safety enforcement and tests FT-01…FT-12 | Engineering (M3) | Release of AI recipes | Safety |
| B-L12 | Final prices, plan contents and quotas; App Store Connect products | Owner | Subscription Terms; paywall | Apple + law |
| B-L13 | Subscription regulations approval status and the app-store trader-role assessment | Owner (legal review when possible) | Subscription Terms | Law (prospective, 1 Jan 2027) |
| B-L14 | Minimum age decision and children assessment | Owner | Terms; App Store age rating | Law |
| B-L15 | Data protection complaints route (DPA 2018 s.164A) | Owner + engineering | Launch | Law |
| B-L16 | App Privacy answers and privacy manifest checked against the built binary | Engineering (release) | Submission | Apple |

## 3. Non-blocking (track)

- Expansion beyond the UK storefront (EX-01…EX-03): restrict availability to the UK.
- Online Safety Act re-assessment before any sharing feature (AI-06).
- DPO re-assessment at scale (DP-19).
- Data bridge status re-check before launch (S-32).
