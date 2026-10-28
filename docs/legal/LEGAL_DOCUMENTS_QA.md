# Legal Documents QA Register — v0.2 drafts

| | |
|---|---|
| Date | 28 October 2026 |
| Scope | The ten public documents in `docs/legal/` |
| Publication rule | `npm run legal:release` refuses to build while any document contains `[OWNER TO CONFIRM`, `[PENDING …` or `[LEGAL REVIEW` markers, or a `-draft` version. Owner approval is required before publishing (mandatory checkpoint). |
| Marker count | Counted by `npm run legal:report` at commit time (see §2) |
| Status values | **DRAFT**: complete text awaiting owner input and/or implementation. **PUBLISHABLE**: no markers, features verified, owner approved. No document is PUBLISHABLE today. |

Source IDs refer to `docs/compliance/LEGAL_COMPLIANCE_MATRIX.md` §1, accessed 28 October 2026.

## 1. Per-document record

### PRIVACY_POLICY.md — v0.2.0-draft — DRAFT

| Item | Record |
|---|---|
| Sources | S-01 (Arts. 5, 6, 9, 12–22, 44–49), S-02, S-03/S-04 (complaints), S-10, S-20/S-21 (5.1.1(i), 5.1.2(i)), S-24, S-30, S-31, S-37 |
| Owner placeholders | Controller identity and trading status; postal address; privacy email; ICO number; Firestore and Storage location; AI provider name, location and safeguard; RevenueCat location; support-mail provider; retention periods (trips, cache, usage logs, backups, support, requests, financial); minimum age; domain |
| Implemented now (code at `b75702c`) | Account with email and password; lists and pantry CRUD; optional profile photo; no analytics, ads or tracking SDKs; sign-in session on device; error logs not persisted |
| Planned (marked PENDING) | Removal of phone and address (L2-01); AI consent (L3-01); dietary consent and deletion on withdrawal (L3-03); Download my data (L2-08); Delete account (L2-06); Security Rules (L2-03); App Check; RevenueCat; trip history; complaint entry point |
| Dependencies | Processor terms (DP-15); data locations (O-L9); retention decisions (O-L11); DPIA (DP-18) |
| Release-blocking | **Yes**: Security Rules and deletion must exist; the policy currently describes protections that are not yet built |

### TERMS_AND_CONDITIONS.md — v0.2.0-draft — DRAFT

| Item | Record |
|---|---|
| Sources | S-12 ss.34–37, 41–47, 49, 57, 62, 65 (S-43); S-13; S-23 §§1.3, 4.3; S-20 |
| Owner placeholders | Legal name and trading status; address; email; minimum age; notice periods (changes, closure); governing law |
| Implemented now | Lists, pantry, account |
| Planned | Shopping Mode and trip features; AI; deletion; Terms re-acceptance (L4-03); Terms checkbox enforcement (L2-02) |
| Legal review | §8 Apple minimum EULA terms; §11.5 food-decision wording; overall fairness review under CRA Part 2 |
| Release-blocking | **Yes**: legal identity, plus legal review recommended before first publication |

### AI_TRANSPARENCY.md — v0.2.0-draft — DRAFT

| Item | Record |
|---|---|
| Sources | S-01 Arts. 13, 22A–D; S-08; S-20/S-21; S-33/S-34 (**not** used in the public text: provider not contracted) |
| Owner placeholders | Provider and model; processor role; location; retention; training terms; AUP link; nutrition decision FS-D1 |
| Implemented now | **None.** No AI feature exists in the app |
| Planned | All AI features (M3, M7); consent (L3-01); server checks (L3-04/05); Report button (L3-08) |
| Release-blocking | **Yes**: cannot be published until the provider is contracted and the M3 tests pass |

### FOOD_SAFETY_AND_ALLERGENS.md — v0.2.0-draft — DRAFT

| Item | Record |
|---|---|
| Sources | S-40 (14 allergens), S-41 and S-44 (chilling and cooking), `FOOD_SAFETY_TECHNICAL_SPEC.md` |
| Owner placeholders | FS-D1; support email |
| Implemented now | **None** of the allergen protections |
| Planned | L3-03, L3-04, L3-05, L3-08; tests FT-01…FT-14 |
| Release-blocking | **Yes**: must match enforced behaviour; publishable only with AI features |

### SUBSCRIPTION_TERMS.md — v0.2.0-draft — DRAFT

| Item | Record |
|---|---|
| Sources | S-13 reg. 37; S-14 Part 4 Ch. 2; S-15/S-18 (draft regulations and guidance); S-17 (app-store responsibility); S-19 (s.254 prospective); S-20 3.1.1, 3.1.2; S-22; S-23 §3.8(b); `SUBSCRIPTION_ENTITLEMENTS.md` |
| Owner placeholders | Prices; quotas; supermarket-comparison availability; anti-abuse approach for credits |
| Implemented now | **None** (plan limits, credits and purchases are not in the app) |
| Planned | M6: purchases, restore, manage, refund request (LS-01…LS-02); cooling-off decision (LS-06); 2027 rules (LS-05) |
| Legal review | §8 cooling-off waiver with Apple IAP; §9 after the regulations are made |
| Release-blocking | **Yes** |

### PRICING_DATA_DISCLAIMER.md — v0.2.0-draft — DRAFT

| Item | Record |
|---|---|
| Sources | S-14 (misleading actions); project decision D8 |
| Owner placeholders | Comparison availability; partnerships (none) |
| Implemented now | No live prices anywhere (V1 fabricated prices removed in M1). User-entered price fields exist in V1 list items |
| Planned | "Your price" / "Estimated" labels and missing-price count (M4) |
| Release-blocking | Low. Accurate today except for the labels; can be finalised early |

### ACCOUNT_DELETION_POLICY.md — v0.2.0-draft — DRAFT

| Item | Record |
|---|---|
| Sources | S-01 Art. 17; S-20 5.1.1(v); S-22; S-30 (180-day purge) |
| Owner placeholders | Completion time; deletion-record retention; backups; support and complaint retention; financial records; AI provider retention; inactive accounts |
| Implemented now | **None** (no deletion code) |
| Planned | L2-06 / L2-07 / L2-08 (this package implements the server logic; see the implementation report) |
| Release-blocking | **Yes**: Apple requires working in-app deletion |

### ACCEPTABLE_USE.md — v0.2.0-draft — DRAFT

| Item | Record |
|---|---|
| Sources | S-20 (Apple rules), Terms §6 |
| Owner placeholders | Security email; AI provider AUP link |
| Implemented now | — (policy text) |
| Release-blocking | Low: only placeholders |

### SUPPORT_AND_COMPLAINTS.md — v0.2.0-draft — DRAFT

| Item | Record |
|---|---|
| Sources | S-02 s.164A via S-03/S-04/S-06 (30-day acknowledgement); S-01 Art. 12(3) (one month); S-22 (refund link) |
| Owner placeholders | Email; address; identity; response targets; ADR decision |
| Implemented now | — |
| Planned | In-app Help entry (L2-12); refund request (LS-02) |
| Release-blocking | **Yes**: the Support URL is required by App Store Connect |

### CHANGELOG.md — v0.2.0-draft — DRAFT

| Item | Record |
|---|---|
| Owner placeholders | Domain; first publication date |
| Release-blocking | No |

## 2. Marker counts (from `npm run legal:report`, 28 Oct 2026)

| Document | Markers |
|---|---|
| Privacy Policy | 42 |
| Terms & Conditions | 19 |
| AI Transparency | 14 |
| Food Safety & Allergens | 5 |
| Subscription Terms | 15 |
| Pricing Data | 4 |
| Account Deletion | 11 |
| Acceptable Use | 3 |
| Support & Complaints | 17 |
| Changelog | 2 |
| **Total** | **132** |

## 3. What can be published now

**Nothing.** Publishing is an owner checkpoint, and every document still has owner placeholders.

Once the owner information is supplied, the earliest candidates are:
- Acceptable Use Policy
- Pricing & Supermarket Data (after the M4 labels)
- Changelog
- Support & Complaints (needs only owner details and response targets)

Privacy, Terms and Account Deletion require the M2 features. AI Transparency, Food Safety and Subscription Terms require M3 and M6.
