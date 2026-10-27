# Subscription and Free-Credit Test Plan

Status: planned — **no test has been executed**. Every result must be recorded with executable evidence (test output, logs, screen recording) in `docs/test-reports/SUBSCRIPTIONS.md`.

## 1. Environments

| Layer | Environment | Owner prerequisites |
|---|---|---|
| Entitlement logic, credit reservation, Rules | Firebase Emulator Suite + Jest (CI) | none |
| RevenueCat webhook handling | Emulator + recorded RevenueCat webhook payload shapes (test fixtures only) + staging with RevenueCat sandbox events | RevenueCat project |
| Real purchases | Physical iPhone, EAS **development build** (Expo Go cannot purchase), Apple sandbox tester account | O1–O2, O6, O8–O10 |
| Pre-release | TestFlight build with sandbox purchases | Same |

The owner has no Mac, so Xcode StoreKit configuration-file testing is not used; sandbox testing on a device covers purchase, renewal (accelerated sandbox renewals), cancellation and expiry.

## 2. Required acceptance tests (owner list)

| # | Test | Level | Procedure | Pass condition | Status |
|---|---|---|---|---|---|
| S1 | Free user receives exactly 3 credits | Emulator | Create user → read `aiCredits/{uid}` | `granted == 3`, `consumed == 0` | NOT TESTED |
| S2 | One successful generation consumes exactly 1 credit | Emulator (provider stub) + staging (real provider) | Generate once (4 recipes returned) | `consumed == 1`; ledger has 1 success entry | NOT TESTED |
| S3 | Provider failure does not consume | Emulator (stub returns 503 / timeout / invalid schema) | Generate 3 failing requests | `consumed == 0`; no active reservations | NOT TESTED |
| S4 | 4th request without Premium rejected | Emulator | 3 successes then 4th | 4th returns `TRIAL_EXHAUSTED`; no provider call made | NOT TESTED |
| S5 | Reinstall / other device does not reset | Staging device | Use 2 credits, delete app, reinstall, sign in on second device | Both show "1 of 3 remaining" | NOT TESTED |
| S6 | Concurrent requests cannot bypass | Emulator | 10 parallel calls with 1 credit left | Exactly 1 success, others `REQUEST_IN_PROGRESS` or `TRIAL_EXHAUSTED`; `consumed ≤ granted` | NOT TESTED |
| S7 | Standard cannot use Premium endpoints | Emulator | Set entitlement standard (server write), call `optimiseList` | `PLAN_REQUIRED` | NOT TESTED |
| S8 | Verified Premium can use AI | Staging sandbox | Purchase Premium → sync → generate | Success; Premium usage counter increments; trial counters unchanged | NOT TESTED |
| S9 | Expiry removes paid entitlements | Staging sandbox (accelerated renewal, auto-renew off) | Wait for expiry → webhook | Plan becomes `free`; AI rejected (or remaining trial credits only) | NOT TESTED |
| S10 | Downgrade preserves data | Emulator + sandbox | Premium user with 5 lists, 60 pantry items, 4 favourites → expire | All data readable and editable; new list creation blocked with clear message | NOT TESTED |
| S11 | Restore Purchases | Staging sandbox | Purchase, delete app, reinstall, restore | Server plan restored; no trial credits granted | NOT TESTED |
| S12 | Client spoofing impossible | Emulator + device | Modify local state / write `entitlements/{uid}` from client / replay old webhook / bad webhook auth header | Rules deny client write; webhook rejects bad auth; server plan unchanged | NOT TESTED |

## 3. Additional tests

| # | Test | Status |
|---|---|---|
| S13 | Upgrade Standard → Premium is immediate after webhook/sync | NOT TESTED |
| S14 | Downgrade Premium → Standard takes effect at renewal | NOT TESTED |
| S15 | Billing grace period keeps access; billing retry removes it; recovery restores it | NOT TESTED |
| S16 | Refund removes access | NOT TESTED |
| S17 | Webhook idempotency: same event twice → single state change | NOT TESTED |
| S18 | Missed webhook recovered by daily reconciliation job | NOT TESTED |
| S19 | Reservation expiry after simulated crash releases the credit | NOT TESTED |
| S20 | Premium usage never changes `aiCredits` | NOT TESTED |
| S21 | Free capacity Rules: 3rd active list, 21st item, 31st pantry item rejected; offline write rolled back on sync with user-visible message | NOT TESTED |
| S22 | Paywall shows Apple-localised price, period, billed amount most prominent, functional Privacy Policy and Terms links | NOT TESTED |
| S23 | Manage Subscription opens Apple subscription management | NOT TESTED |
| S24 | Account deletion flow warns about active Apple subscription | NOT TESTED |
| S25 | No purchase-related secrets in app bundle (RevenueCat secret key, webhook auth) | NOT TESTED |
| S26 | Metrics events contain no pantry/list/prompt/allergy content | NOT TESTED |
