# Subscription Architecture — Apple IAP, RevenueCat, Firebase

Status: proposal for owner approval — **not implemented**. Payments are not built and no production AI service is changed until the owner approves this document and `SUBSCRIPTION_ENTITLEMENTS.md`.
Date: 2026-10-27 · Related: `MONETISATION_STRATEGY.md`, `SUBSCRIPTION_ENTITLEMENTS.md`, `SUBSCRIPTION_TEST_PLAN.md`, `AI_ARCHITECTURE.md`, `SECURITY_CLOUD_SECRETS_IMPLEMENTATION.md`

## 1. StoreKit directly vs RevenueCat — recommendation

| Criterion | StoreKit 2 directly (e.g. `expo-iap` / `react-native-iap` + own server) | RevenueCat (`react-native-purchases`) |
|---|---|---|
| Purchase, restore, upgrades/downgrades in a group | Implement yourself on top of StoreKit | Provided |
| Server-side verification | Must implement App Store Server API calls and JWS verification | Done by RevenueCat; our backend reads the result via REST API |
| App Store Server Notifications v2 (renewal, expiry, billing retry, refund) | Must host endpoint, verify signed payloads, model state | RevenueCat ingests them; forwards normalised webhooks |
| Billing retry / grace period state | Must model | Exposed as entitlement state |
| Expo compatibility | Varies by library | Supported with an Expo **development build**; Expo Go only runs a mock "Preview API Mode" ([RevenueCat Expo docs](https://www.revenuecat.com/docs/getting-started/installation/expo)) |
| Cost | No vendor fee | Free up to $2,500 monthly tracked revenue, then 1% ([plans](https://www.revenuecat.com/plans/)) |
| Vendor dependency | None | Yes; mitigated because the source of truth for paid access is our Firestore entitlement doc, rebuilt from RevenueCat's REST API |
| Effort for a solo developer without a Mac | High (StoreKit testing in Xcode needs a Mac) | Lower; sandbox testing on a physical iPhone with an EAS development build |

**Recommendation: RevenueCat** for V2.0, with a server-authoritative entitlement mirror in Firestore. The UI (plan selection, comparison, locked states) is built with IntelliShop V2 components, not a vendor paywall template, to stay within the approved design system.

## 2. Components

```
iOS app                                  RevenueCat                 Apple
 react-native-purchases ─ purchase ─────▶ (SDK) ───────── StoreKit ─▶ App Store
   appUserID = Firebase UID                │  ◀── App Store Server Notifications v2
   public iOS SDK key (not secret)         │
                                           │ webhook (Authorization header)
 callable syncEntitlements ──┐             ▼
                             └──▶ Cloud Functions ── GET /subscribers/{uid} (secret key) ──▶ RevenueCat REST
                                    revenuecatWebhook, syncEntitlements
                                    write entitlements/{uid} (server-only)
                                         │
 generateRecipes / optimiseList ─────────┤ read entitlements/{uid} + aiCredits/{uid}
 Firestore Security Rules ───────────────┘ read entitlements/{uid} for Free capacity limits
```

### 2.1 App Store Connect (owner configures; Vesper provides exact values)
- Subscription group: **IntelliShop Plans** (single group so users switch between plans and Apple handles proration/timing).
- Levels (1 = highest): **Premium Monthly** level 1, **Standard Monthly** level 2. Moving to a higher level is an upgrade (immediate); to a lower level is a downgrade (at next renewal).
- Product IDs: `com.huerlem.intellishop.premium.monthly`, `com.huerlem.intellishop.standard.monthly`. Reserved for later: `…premium.annual`, `…standard.annual` (same group, same levels).
- Billing Grace Period: **on** (users keep access while Apple retries payment).
- App Store Server Notifications v2 URL: RevenueCat's endpoint for the app.
- In-App Purchase Key (.p8) uploaded to RevenueCat (never to Git).

### 2.2 RevenueCat
- Project with iOS app `com.huerlem.intellishop` (and dev/staging bundle IDs as separate apps in a non-production project).
- Entitlements: `standard` and `premium`. Product mapping: Standard product → `standard`; Premium product → `standard` + `premium`.
- Offering `default` with monthly packages; annual packages added later without app changes (offerings are remote).
- Webhook → `revenuecatWebhook` HTTPS function with a random Authorization header value stored in Secret Manager as `REVENUECAT_WEBHOOK_AUTH`.
- Secret REST API key stored as `REVENUECAT_SECRET_KEY` (server only). The app uses only the public iOS SDK key.

### 2.3 App
- `Purchases.configure({ apiKey: <public iOS key> })` at launch; `Purchases.logIn(firebaseUid)` after sign-in; `Purchases.logOut()` on sign-out.
- Prices and period text come from `StoreProduct` (localised by Apple); nothing is hard-coded.
- After any purchase or restore: call `syncEntitlements` and wait for the server-confirmed plan before unlocking. Until then the UI shows "Confirming your purchase…".
- **Restore Purchases** (Settings and paywall) → `Purchases.restorePurchases()` → `syncEntitlements`.
- **Manage Subscription** (Settings) → `Purchases.showManageSubscriptions()`; fallback opens Apple's subscriptions page.
- Client-side `CustomerInfo` is used only for display; it never unlocks a feature on its own.

### 2.4 Backend
- `revenuecatWebhook` (HTTPS, `secrets: [REVENUECAT_WEBHOOK_AUTH, REVENUECAT_SECRET_KEY]`): checks the Authorization header in constant time; ignores the event body as a source of truth and refetches the subscriber from RevenueCat's REST API; writes `entitlements/{uid}`; idempotent by event ID (`processedEvents/{eventId}` with TTL); records metric events.
- `syncEntitlements` (callable, Auth + App Check): same refetch for `request.auth.uid` only; rate-limited.
- Daily reconciliation job (scheduled) refetches subscribers whose `subscriptionExpiresAt` passed, as a safety net for missed webhooks.

## 3. Server-authoritative entitlement document

`entitlements/{uid}` — written **only** by Cloud Functions (Rules: `allow read: if request.auth.uid == uid; allow write: if false`).

```ts
{
  plan: 'free' | 'standard' | 'premium',     // effective plan now
  subscriptionStatus: 'none' | 'active' | 'in_grace_period' | 'in_billing_retry'
                    | 'cancelled_active'      // auto-renew off, still within period
                    | 'expired' | 'refunded',
  subscriptionProductId: string | null,
  subscriptionExpiresAt: Timestamp | null,
  willRenew: boolean,
  subscriptionProvider: 'app_store' | null,
  source: 'revenuecat',
  entitlementsUpdatedAt: Timestamp,
  rcLastEventId: string | null
}
```

Effective plan rule: `premium` if the RevenueCat `premium` entitlement is active (including grace period); else `standard` if `standard` is active; else `free`. Billing retry without grace → `free` with status `in_billing_retry` (data kept; UI shows "Update payment method" with Manage Subscription).

## 4. Enforcement points

| What | Where enforced | How |
|---|---|---|
| AI recipes, optimisation, substitutions, price lookup | Cloud Functions | Read `entitlements/{uid}` and `aiCredits/{uid}` inside the request; reject with `PERMISSION_DENIED / PLAN_REQUIRED` |
| Free capacity limits (2 lists, 20 items/list, 30 pantry items) | Firestore Security Rules + counters | Creates batch-update `users/{uid}/meta/counters`; Rules check counter consistency with `getAfter()` and the limit for the plan read from `entitlements/{uid}`. Works offline (validated on sync). |
| Shopping history | Rules (read) | Free cannot read `history/**`; data still written so it appears after upgrading (owner may decide otherwise) |
| UI locks | App | Cosmetic only; mirrors server state |

## 5. Free introductory AI credits — recommended implementation

### 5.1 Data
`aiCredits/{uid}` (server-only):
```ts
{ granted: 3, consumed: 0, reservations: { [requestId]: { expiresAt } }, ledger: [...last 10 entries], createdAt }
```
Created by an Auth `onCreate` trigger (or lazily on first AI request) **once per account**; never reset by reinstall, logout, device change or local storage because nothing lives on the device.

### 5.2 Race-safe reserve / finalise
1. **Reserve** (Firestore transaction): drop reservations past `expiresAt`; if plan is Premium → use the Premium quota path instead; `available = granted − consumed − activeReservations`; if `available ≤ 0` → `TRIAL_EXHAUSTED` (UI: upgrade prompt); if an active reservation exists → `REQUEST_IN_PROGRESS` (one concurrent free request per account); else add reservation `{requestId, expiresAt: now + 90 s}`.
2. **Generate** (provider call, validation — outside the transaction).
3. **Finalise on success** (transaction): remove reservation, `consumed += 1`, append ledger entry `{requestId, at, outcome: 'success'}`. Idempotent by `requestId`.
4. **Release on failure** (provider error, timeout, schema failure, allergen conflict): remove reservation; `consumed` unchanged.
5. **Crash between 1 and 3:** reservation expires after 90 s and stops counting — the user is not charged.

Because every request must hold a reservation, concurrent requests cannot spend more than `granted`: the transaction serialises them, and the second concurrent free request is refused while the first is in flight.

### 5.3 Interaction with plans
- Premium usage uses `aiUsage/{uid}/months/{yyyy-mm}` and never touches `aiCredits` — paid usage cannot replenish or consume trial credits.
- After Premium expires, the remaining trial credits (if any) are whatever was left; no re-grant.
- Restoring purchases never grants trial credits (credits are only granted at account creation).
- Standard users have no AI access; their remaining trial credits stay usable (they are an account allowance, not a plan feature). **Owner decision D10** — alternative is "trial credits only on Free plan".

### 5.4 Abuse controls
- Email verification required before the first credit is reserved.
- App Check enforced; per-account rate limits.
- ~~Optional HMAC email ledger kept after account deletion~~ — **not adopted** (owner decision D4, 2026-10-27): no persistent email tracking after deletion without a separate privacy review. Anti-abuse relies on account-level controls: email verification, App Check, per-account rate limits and the global spend cap. Residual risk: a user who deletes and re-creates an account receives a new allowance (cost ≈ $0.005 per occurrence).
- Optional: Apple DeviceCheck per-device bit "trial used" via a server function.

### 5.5 UI
"2 of 3 free AI recipes remaining" on the recipe entry point and result screen; after exhaustion, a contextual Premium prompt. If the user has no pantry items and no list, the recipe entry shows an onboarding step to add ingredients (saved to Pantry) before the first generation.

## 6. Account deletion and subscriptions
Deleting an IntelliShop account does not cancel an Apple subscription. The deletion flow must show the subscription status and a **Manage Subscription** button with a clear note before confirming. Entitlement, credits and metrics documents are deleted with the account (D4: nothing about the user is retained for anti-abuse).

## 7. Owner actions (Apple, banking, tax)

| # | Action | Where | Needed for |
|---|---|---|---|
| O1 | Active Apple Developer Program membership | developer.apple.com | Everything |
| O2 | Accept the **Paid Apps Agreement** | App Store Connect → Business | Any IAP, including sandbox |
| O3 | Bank account details | App Store Connect → Business | Payouts |
| O4 | Tax forms (including US tax information form) and UK VAT/tax details as prompted | App Store Connect → Business | Payouts |
| O5 | Enrol in the App Store Small Business Program | developer.apple.com | 15% commission |
| O6 | Create app record, subscription group, two products, localisations, review screenshot per product, prices | App Store Connect | Sandbox + review |
| O7 | Enable Billing Grace Period | App Store Connect | Billing recovery |
| O8 | Create In-App Purchase Key (.p8) and give it to RevenueCat directly | App Store Connect → Users and Access → Integrations | Server verification |
| O9 | Create sandbox tester accounts | App Store Connect → Users and Access → Sandbox | Testing |
| O10 | RevenueCat account and project; set webhook secret in Secret Manager (`firebase functions:secrets:set REVENUECAT_WEBHOOK_AUTH`) | RevenueCat / Firebase CLI | Entitlement sync |
| O11 | Publish Privacy Policy and Terms of Use (EULA) URLs | Website | App Review 3.1.2 |
| O12 | Legal review of subscription terms and UK consumer obligations | Adviser | Launch |

## 8. App Review checklist (subscriptions)
- In the binary: subscription title, length, price (billed amount most prominent), functional links to Privacy Policy and Terms of Use (EULA).
- In App Store Connect: Privacy Policy URL field; EULA link in the description or custom EULA.
- Restore Purchases available; Manage Subscription reachable; account deletion in-app.
- Each paid plan provides ongoing value; no feature advertised that is not available (see risk R1).
- Requirements summarised from an Apple rejection notice quoted in the [Apple Developer Forums](https://developer.apple.com/forums/thread/807082); the current App Review Guidelines must be re-read before submission.
