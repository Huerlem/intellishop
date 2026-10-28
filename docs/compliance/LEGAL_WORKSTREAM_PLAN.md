# Legal, Privacy, AI Safety and App Store Compliance — Workstream Plan

| | |
|---|---|
| Requirement | `docs/requirements/LEGAL_PRIVACY_AI_SAFETY_COMPLIANCE_REQUIREMENT.md` (P0) |
| Version | 0.1 |
| Date | 28 October 2026 |
| Status | Compliance foundation written; public documents not yet drafted. **No legal certification is claimed.** |
| Language | Public documents in British English. Planning documents in English. |

This plan answers the seven items in requirement §12. Supporting detail:

| Document | Contents |
|---|---|
| `LEGAL_COMPLIANCE_MATRIX.md` | Obligations with sources and statuses |
| `DATA_FLOW_INVENTORY.md` | Personal data map |
| `DPIA_SCREENING.md` | DPIA screening |
| `APP_STORE_PRIVACY_MAPPING.md` | App Privacy answers |
| `FOOD_SAFETY_TECHNICAL_SPEC.md` | Enforced food-safety protections |
| `LEGAL_IMPLEMENTATION_CHECKLIST.md` | Engineering tasks by milestone |
| `LEGAL_RELEASE_GATE.md` | Release gate and blockers |

---

## 1. Legal deliverables inventory

| # | File | Purpose | Status | Depends on | Target |
|---|---|---|---|---|---|
| A | `docs/legal/PRIVACY_POLICY.md` | UK GDPR Arts. 13–14 notice; Apple 5.1.1(i) | **Not drafted** | Inventory (done, v0.1); owner info §3; processor terms | Draft first (P1) |
| B | `docs/legal/TERMS_AND_CONDITIONS.md` | Contract; CRA 2015-compliant liability; complaints; governing law | **Not drafted** | Owner info; age decision | P1 |
| C | `docs/legal/AI_TRANSPARENCY.md` | What the AI does, data sent, limits, controls; Apple 5.1.2(i) disclosure text | **Not drafted** | AI provider contract (name only once contracted) | P2 (with M3) |
| D | `docs/legal/FOOD_SAFETY_AND_ALLERGENS.md` | Disclaimer that mirrors the enforced spec | **Not drafted** | `FOOD_SAFETY_TECHNICAL_SPEC.md` (done, v0.1); decision FS-D1 | P2 |
| E | `docs/legal/SUBSCRIPTION_TERMS.md` | Plans, introductory credits, quotas, IAP billing, renewal, cancellation, refunds, statutory rights | **Not drafted** | Final prices and quotas; ASC products; subscription regulations | P3 (draft early with placeholders, finalise at M6) |
| F | `docs/legal/PRICING_DATA_DISCLAIMER.md` | Honest statement of price-data limits | **Not drafted** | Price-feature scope (decision D8: no live prices) | P1 (short; can be accurate now) |
| G | `docs/legal/ACCOUNT_DELETION_POLICY.md` | Deletion steps, timescale, retained records, billing notice | **Not drafted** | M2 deletion design (L2-06/07); backup retention decision | P1 (finalise when M2 deletion passes tests) |
| H | `docs/legal/ACCEPTABLE_USE.md` | Prohibited misuse, automation, limit bypass, attacks | **Not drafted** | — | P1 |
| — | Cookie notice | **Not required** if the legal site uses no non-essential storage (PE-02). A short "This site uses no cookies" statement goes in the Privacy Policy instead | Assessed | Hosting choice | — |
| — | Support and complaints page | Support URL for App Store Connect; DPA 2018 s.164A complaints route | **Not drafted** | Owner contact details | P1 |
| — | `docs/legal/CHANGELOG.md` | Version history of every public document | **Not created** | — | With the first draft |
| — | **LUFI reference** | Structure only. **The LUFI documents were not available**, so none of their wording was reviewed or reused | Limitation recorded | — | — |

Excluded on purpose: LUFI-specific Community Guidelines, Trust Manifesto and Crisis Protocol. IntelliShop has no user-to-user content, companion or emotional-support features. An Acceptable Use Policy covers misuse instead.

## 2. Compliance obligations and official sources

The full register (S-01…S-42) and per-obligation status are in `LEGAL_COMPLIANCE_MATRIX.md`. Key findings:

1. **Data (Use and Access) Act 2025.** Most data-protection changes came into force on **5 February 2026**. The **complaints procedure** duty (DPA 2018 s.164A) applies from **19 June 2026**: controllers must facilitate complaints and acknowledge them within 30 days. IntelliShop has no complaints route yet (DP-21).
2. **Consumer Subscription Contracts (Cancellation and Information) Regulations 2026.** The draft was **laid on 19 October 2026** and would come into force on **1 January 2027**, subject to Parliament's approval. It applies to contracts made on or after that date. The draft contains **no app-store-specific provision**. Apple's Schedule 2 makes the developer the principal, responsible for consumer-law compliance of subscriptions (§§1.3, 3.10, 5.4). How reminder notices, cooling-off and exit duties work when Apple controls billing **needs legal review** (CL-04, B-L13). A launch after 1 January 2027 should be designed for compliance from day one.
3. **DMCCA unfair commercial practices** have been in force since **6 April 2025**, with CMA direct fines (first penalty May 2026). This is relevant to paywall copy, the absence of fake reviews, drip pricing and price-comparison claims (CL-05, CL-06).
4. **Apple 5.1.2(i)** now requires **explicit permission before sharing personal data with third-party AI**. This drives the M3 consent sheet (AP-07).
5. **Apple account deletion** must be in-app. If a subscription is active, the app must say that billing continues through Apple and point to Manage Subscriptions (AP-05).
6. **Allergies are health data** (Art. 9). Religious dietary choices can reveal belief. Explicit consent is needed, and a **full DPIA is required** before these features ship (DPIA screening).
7. **International transfers already happen today:** Firebase Authentication runs only from US data centres. AI inference for the provisional provider runs in the US or globally (DP-20).
8. **ICO fee:** Tier 1 is £52 (£47 by direct debit) per secondary sources. The owner must self-assess on the ICO site (DP-23).
9. **Online Safety Act:** a single-user AI tool appears out of scope. **Shared household lists would change this** (AI-06).
10. **Children:** adult-only terms alone do not settle the question. Recommended: an 18+ minimum (paid subscriptions, food-safety risk), a matching App Store age rating, and a documented "likely to be accessed" assessment (DP-22).

## 3. Missing owner information

Never send credential values. None of the items below is a secret.

| # | Information | Used in | Notes |
|---|---|---|---|
| O-L1 | Legal name of the controller and seller: you as a **sole trader**, or a **limited company** | Privacy Policy, Terms, App Store seller name | Apple individual enrolment shows your personal name as the seller. An organisation needs a legal entity and a D-U-N-S number (AP-20) |
| O-L2 | Trading name ("IntelliShop"?), and whether the name has been checked for conflicts | All documents | No trade-mark search has been made |
| O-L3 | **Publishable** geographic address | Terms (CL-07), Privacy Policy | A home address is not required if you use a service or virtual office address that can receive post |
| O-L4 | Contact email(s): support, privacy and complaints (one is enough) | All documents; App Store Support URL | A domain-based address is preferable |
| O-L5 | Domain name for public pages | Privacy Policy URL, Support URL | — |
| O-L6 | ICO registration: tier and reference number (after paying) | Privacy Policy | Pay before external TestFlight with real users |
| O-L7 | DPO: confirm **none appointed** (recommended; DP-19) and name the privacy contact | Privacy Policy | — |
| O-L8 | Minimum age: 18+ (recommended) or 13+ | Terms, App Store age rating | — |
| O-L9 | Firestore and Storage **location** of `intellishop-1f62f`, and the production project decision | Privacy Policy transfers | Firestore → Settings in the console |
| O-L10 | Processor terms accepted: Firebase Data Processing and Security Terms (console setting), AI provider account and plan, RevenueCat account | Privacy Policy, DPIA | Record dates and versions |
| O-L11 | Retention decisions: AI cache, favourites, shopping-trip history, usage logs, support emails, backups | Privacy Policy, Deletion Policy | Proposed defaults are in the inventory |
| O-L12 | Final plan names, prices, contents and quotas (D1, D3), and introductory credit wording | Subscription Terms, paywall | Currently provisional |
| O-L13 | Decisions DPIA-1, DPIA-2 (allergy storage model; religious diets at launch) and FS-D1 (nutrition) | Food Safety, AI Transparency | — |
| O-L14 | Governing law: England and Wales (recommended), with Scottish and Northern Irish consumers keeping their local rights | Terms | — |
| O-L15 | Storefront availability: UK only at launch (recommended) | App Store Connect | — |
| O-L16 | Whether any marketing email or push messages are planned | Privacy Policy (PECR) | Currently none |

## 4. Recommended public legal-page architecture

**Hosting.** A static site with **no cookies, no analytics and no third-party fonts or scripts**, so no cookie banner is needed (PE-02) and no visitor data reaches third parties.
- Recommended: **Firebase Hosting** in the production project, with the owner's custom domain. It sits under the same Google terms already in use; free-tier hosting quotas are to be confirmed when it is set up.
- Alternative: GitHub Pages from a separate public repository. Do not use the application repository.

**Single source.** Each document is written once in `docs/legal/*.md` with front matter:

```yaml
title: Privacy Policy
version: 1.0.0          # semver: major = material change (re-acceptance for Terms; notice for Privacy)
effective: 2026-12-01   # placeholder
last_updated: 2026-11-15
```

A build script renders accessible HTML (semantic headings, a skip link, 16 px+ base text, contrast checked) for the website. It also bundles the same Markdown into the app, so documents are readable offline and the version shown in the app matches the website.

**URLs** (domain placeholder `[DOMAIN]`):

| Path | Document |
|---|---|
| `/privacy` | Privacy Policy (current) |
| `/terms` | Terms & Conditions |
| `/ai` | AI Transparency & Safety |
| `/food-safety` | Food, Allergy & Nutrition |
| `/subscriptions` | Subscription & Billing Terms |
| `/pricing-data` | Pricing & Supermarket Data |
| `/account-deletion` | Account & Data Deletion (also describes in-app deletion steps) |
| `/acceptable-use` | Acceptable Use |
| `/support` | Contact, privacy requests, complaints (form or email), how to cancel through Apple, how to request a refund from Apple |
| `/legal/archive/<doc>/<version>` | Previous versions |
| `/legal/changes` | Changelog |

**In-app access (M2 skeleton, M4 final design):**

| Location | Links |
|---|---|
| Registration | Terms (checkbox, enforced) · Privacy Policy (information link, not consent) |
| Onboarding | AI explainer → AI Transparency |
| Settings → Legal & Privacy | All documents, with version and date |
| Settings → Privacy | AI suggestions toggle · Dietary consent · Download my data |
| Settings → Account | Delete account → Deletion Policy + billing notice |
| Paywall | Subscription Terms · Terms · Privacy · Restore Purchases · Manage Subscription |
| AI first use | Consent sheet → AI Transparency |
| Dietary settings | Explicit consent → Food Safety + Privacy |
| Recipe detail | Food-safety banner → Food Safety |
| Help | Support / complaints |

**App Store Connect:**
- Privacy Policy URL → `/privacy`.
- Support URL → `/support`.
- Description ends with links to Terms and Privacy.
- Licence agreement: decide between Apple's standard EULA plus IntelliShop Terms, or a custom EULA in App Store Connect that incorporates the Terms. *Legal review recommended*; the simplest consistent option is a custom EULA that points to the Terms.

**Version control.**
- Firestore `config/legal` holds the current versions.
- A **major** Terms change triggers re-acceptance at next launch.
- A Privacy Policy change shows an in-app notice. Privacy is information, so it is not re-accepted.
- Acceptance records are stored per user (L2-02, L4-03).

## 5. Implementation dependencies

```
Owner info O-L1…O-L5 ──► Privacy Policy, Terms, Support page ──► hosting + domain ──► ASC metadata
Firebase project + location (O-L9) ──► transfers section ──► Privacy Policy final
Processor terms (O-L10) ──► Privacy Policy, AI Transparency, DPIA
M2 deletion/export (L2-06…08) ──► Account Deletion Policy final ──► App Review 5.1.1(v)
M2 minimisation (L2-01/02) ──► Privacy Policy "what we collect" final; App Privacy answers
DPIA (L3-06) + food spec tests (L3-04) ──► AI Transparency + Food Safety final ──► M3 release
ASC products + final prices (O-L12) + Regulations status ──► Subscription Terms final ──► M6 paywall
EAS iOS build ──► privacy manifest + App Privacy verification (AP-15/16)
```

The roadmap is updated: legal screens skeleton in M2, final legal screens in M4, Privacy Policy no longer deferred to M8 (`IMPLEMENTATION_ROADMAP.md`).

## 6. Drafting priorities

| Priority | Documents | Why first | When final |
|---|---|---|---|
| **P1** | Privacy Policy · Terms & Conditions · Acceptable Use · Account Deletion Policy · Pricing Data Disclaimer · Support/complaints page | Needed before any external tester's data is collected and for App Store Connect metadata. They describe features that exist now or in M2. The pricing disclaimer can already be accurate (no live prices) | Draft now with `[OWNER TO CONFIRM]` placeholders. Final once owner info is in and M2 deletion passes tests |
| **P2** | AI Transparency · Food Safety & Allergens | Must mirror enforced behaviour; depend on the DPIA and provider terms | Draft with M3; final at M3 release |
| **P3** | Subscription & Billing Terms | Depends on App Store products, prices and the subscription regulations | Draft structure early; final at M6 |

Rules for every draft:
- original wording, not copied from another company's documents;
- explicit placeholders and no invented facts;
- states only implemented protections;
- every statutory statement linked to a source ID;
- each draft marked "Draft — not reviewed by a lawyer".

## 7. Legal and App Store release blockers

See `LEGAL_RELEASE_GATE.md` §2 (B-L01…B-L16). The ones on the critical path now:

1. **B-L03:** revoke the exposed V1 credentials (owner, now).
2. **B-L01, B-L07:** controller identity, contact details, domain.
3. **B-L02:** ICO fee, before external TestFlight.
4. **B-L04…B-L06:** Security Rules, account deletion and export, registration minimisation (engineering, M2).
5. **B-L09…B-L11:** DPIA, AI consent and food-safety enforcement (M3).
6. **B-L12, B-L13:** prices and products; subscription regulations and trader-role assessment (M6).

Current gate result: **NOT READY — 0 of 10 criteria PASS** (`LEGAL_RELEASE_GATE.md` §1).
