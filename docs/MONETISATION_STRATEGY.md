# Monetisation Strategy — IntelliShop V2

Requirements: [`MONETISATION_FREE_TRIAL_AND_IAP_REQUIREMENT.md`](requirements/MONETISATION_FREE_TRIAL_AND_IAP_REQUIREMENT.md), [`APPLE_IAP_SUBSCRIPTIONS_REQUIREMENT.md`](requirements/APPLE_IAP_SUBSCRIPTIONS_REQUIREMENT.md)
Status: proposal for owner approval · 2026-10-27 · Prices are **provisional** and are not App Store Connect pricing approval.

## 1. Plans (as approved by the owner)

| | Free — £0 | Standard — £2.99/month | Premium — £6.99/month |
|---|---|---|---|
| Active shopping lists | 2 | Unlimited | Unlimited |
| Items per list | 20 | Unlimited | Unlimited |
| Pantry items | 30 | Unlimited | Unlimited |
| Manual shopping & pantry, Shopping Mode, Finish Shopping → Pantry update | ✓ | ✓ | ✓ |
| Shopping history | — | ✓ | ✓ |
| AI recipe generation (Pantry / List / Both) | **3 lifetime introductory generations** | — | ✓ fair use |
| AI list optimisation, substitutions, budget-aware suggestions | — | — | ✓ fair use |
| Supermarket price lookup / comparison | — | — | ✓ only when a verified, licensed provider is live |
| Saved recipes (incl. those generated during the trial) | Kept | Kept | Kept |

"Unlimited" for manual data means no plan limit; technical safeguards (e.g. maximum document sizes, anti-abuse write rates) still apply and are not marketed as limits.

### Premium fair use (proposal — owner decision D3)
- 100 AI generations per calendar month across recipes and optimisation, maximum 10 per hour.
- Shown in Settings as "AI usage this month: 12 of 100".
- Marketing copy must not say "unlimited AI".

## 2. Unit economics (estimates — to be replaced with measured data)

Assumptions: UK prices include 20% VAT; Apple Small Business Program commission of 15% on proceeds ([Apple](https://developer.apple.com/app-store/small-business-program/)); RevenueCat free up to $2,500 monthly tracked revenue, then 1% ([RevenueCat plans](https://www.revenuecat.com/plans/)); AI cost per generation ≈ $0.0018 with Claude Haiku 5.5 (see `AI_ARCHITECTURE.md` §6.4); exchange rate assumption £1 ≈ $1.28.

| Per subscriber per month | Standard | Premium |
|---|---|---|
| Price incl. VAT | £2.99 | £6.99 |
| Less VAT (÷1.2) | £2.49 | £5.83 |
| Apple commission 15% | −£0.37 | −£0.87 |
| **Developer proceeds** | **≈ £2.12** | **≈ £4.95** |
| AI cost at full fair use (100 × $0.0018) | £0 | ≈ £0.14 |
| AI cost, typical (≈ 20 generations) | £0 | ≈ £0.03 |
| Firebase (Firestore, Functions, Secret Manager) per active user | pennies; Secret Manager ≈ $0.06/secret version/month with 6 free ([pricing](https://cloud.google.com/secret-manager/pricing)) | same |
| Price data provider | — | **Unknown** (no licensed source verified yet) |

Free trial cost: 3 × $0.0018 ≈ **$0.005 per new account** (plus quota-free failures).
Fixed costs: Apple Developer Program membership (annual), Firebase Blaze plan (pay-as-you-go, no fixed fee), domain/hosting for privacy policy and terms.

## 3. Principal commercial risks

| Risk | Impact | Mitigation |
|---|---|---|
| R1 Premium promises "real supermarket price comparisons" but no licensed UK multi-retailer price API is verified | Premium value gap; misleading-claim risk; App Review 3.1.2 ("ongoing value") | Do not advertise price comparison until a provider is contracted; position Premium on AI features first |
| R2 Standard's only difference from Free is capacity + history | Low Free→Standard conversion | Validate with data; consider making Standard the annual-only or removing it later (owner decision) |
| R3 Trial farming via new accounts | AI cost, inflated metrics | Email verification before credits, App Check, optional HMAC-email trial ledger and Apple DeviceCheck (§SUBSCRIPTION_ARCHITECTURE 5.4) |
| R4 AI cost spikes or abuse | Margin loss | Server-side quotas, global spend cap, provider spend limit, budget alerts |
| R5 App Review rejection (subscription metadata, EULA/privacy links, billed amount prominence, account deletion) | Release delay | Paywall checklist in test plan; Apple-required elements (title, length, price, functional privacy/EULA links) |
| R6 UK consumer/subscription law obligations (e.g. pre-contract information, cancellation) | Legal exposure | Owner to obtain legal review; Apple handles billing and cancellation UI, but in-app disclosures remain the developer's responsibility |
| R7 Free limits feel punitive after downgrade | Churn, reviews | Never delete or hide data; limits only block *new* additions |
| R8 Provisional prices change | Rework of copy/screenshots | Prices loaded from the store at runtime, never hard-coded |

## 4. Privacy-conscious commercial metrics

No third-party analytics or advertising SDK is added. Events are written server-side by Cloud Functions (which already observe the relevant transitions) to a `metrics` dataset with:
- event name, timestamp, pseudonymous ID (HMAC of UID), plan, app version, coarse country;
- **never**: pantry/list contents, prompts, recipes, allergies, email, IP address, API keys.

| Event | Source |
|---|---|
| `account_activated` | Auth trigger |
| `ai_first_generation`, `ai_trial_credit_consumed` (n of 3), `ai_trial_exhausted` | `generateRecipes` |
| `ai_generation_cost` (tokens, est. cost, feature, plan) | provider adapter |
| `subscription_started`, `upgraded`, `downgraded`, `renewed`, `cancelled`, `expired`, `billing_issue`, `restored` | RevenueCat webhook handler |
| `paywall_viewed` (context: trial_exhausted / locked_feature / settings) | callable `logPaywallView` (no content) |

Derived: Free→Standard / Free→Premium / Standard→Premium conversion, cancellations, cost per AI generation, Premium AI consumption, revenue and cost per paying subscriber (revenue from RevenueCat; cost from the provider log). Users can opt out of non-essential metrics in Settings; App Store privacy labels must list "Purchases" and "Usage Data (product interaction)" accordingly.

## 5. Decisions requiring owner approval

| ID | Decision | Recommendation |
|---|---|---|
| D1 | Prices £2.99 / £6.99 and App Store price points | Keep provisional; confirm in App Store Connect |
| D2 | Introductory free trial *period* for Premium (Apple introductory offer) in addition to 3 AI credits? | Not at launch; revisit after data |
| D3 | Premium fair-use limits | 100 generations/month, 10/hour |
| D4 | Trial anti-abuse: keep an HMAC-hashed email ledger of trial use after account deletion (privacy-policy disclosure) and/or DeviceCheck | Yes to HMAC ledger; DeviceCheck optional |
| D5 | Downgrade behaviour above Free limits | Data kept and editable; only new lists/items/pantry entries blocked |
| D6 | Restore on a different IntelliShop account (RevenueCat transfer behaviour) | Transfer to the account performing the restore |
| D7 | RevenueCat as subscription layer | Yes (see architecture) |
| D8 | Premium price comparison marketing | Withhold until a licensed provider is live |
| D9 | Annual plans | Architecture-ready; launch monthly only |
| D10 | Can a Standard subscriber still use unused introductory AI credits? | Yes — credits are an account allowance, not a plan feature |
| D11 | Shopping history for Free users: not recorded, or recorded but hidden until upgrade | Recorded but hidden (visible immediately after upgrading) |
