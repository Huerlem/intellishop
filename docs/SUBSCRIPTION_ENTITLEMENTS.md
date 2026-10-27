# Subscription Entitlements and State Transitions

Status: proposal for owner approval · 2026-10-27 · Source of truth at runtime: server-written `entitlements/{uid}` and `aiCredits/{uid}` (see `SUBSCRIPTION_ARCHITECTURE.md` §3, §5).

## 1. Entitlement matrix

| Capability | Free | Standard | Premium | Enforced by |
|---|---|---|---|---|
| Create list | while active lists < 2 | ✓ | ✓ | Rules + counters |
| Add list item | while items in that list < 20 | ✓ | ✓ | Rules + counters |
| Add pantry item | while pantry items < 30 | ✓ | ✓ | Rules + counters |
| Edit / delete / complete existing lists, items, pantry items | ✓ (always, even above limits) | ✓ | ✓ | Rules (ownership only) |
| Shopping Mode, Finish Shopping, Pantry Update | ✓ | ✓ | ✓ | — |
| Shopping history (view) | — (recorded, hidden — D11) | ✓ | ✓ | Rules |
| AI recipe generation | Lifetime introductory credits (3) | Remaining introductory credits only (D10) | ✓ fair use (D3) | `generateRecipes` |
| AI list optimisation / substitutions / budget-aware | — | — | ✓ fair use | `optimiseList` |
| Supermarket price lookup / comparison | — | — | ✓ when a licensed provider is live | `priceLookup` (future) |
| View/open saved favourite recipes | ✓ | ✓ | ✓ | Rules |
| Save new favourite from a generated recipe | ✓ | ✓ | ✓ | Rules |
| Restore Purchases, Manage Subscription | ✓ | ✓ | ✓ | App |

"Active list" = not archived. Archiving or deleting a list frees capacity.

## 2. Conceptual state

```
plan:                   free | standard | premium            (derived, server-written)
subscriptionStatus:     none | active | in_grace_period | in_billing_retry | cancelled_active | expired | refunded
subscriptionExpiresAt:  timestamp | null
subscriptionProvider:   app_store | null
freeAiCreditsGranted:   3 (once, at account creation)
freeAiCreditsConsumed:  0..3
entitlementsUpdatedAt:  timestamp
```

## 3. Transitions

| # | From → To | Trigger | Effective plan | Data | AI credits | Notes |
|---|---|---|---|---|---|---|
| E1 | (new account) → Free | Sign-up | free | — | granted = 3 (only here) | Credits usable after email verification |
| E2 | Free → Premium | Verified purchase (webhook or `syncEntitlements`) | premium | unchanged | unchanged (trial counters frozen) | Unlock only after server write |
| E3 | Free → Standard | Verified purchase | standard | unchanged | remaining trial credits usable (D10) | No ongoing AI |
| E4 | Standard → Premium | Upgrade in group (immediate) | premium | unchanged | unchanged | Apple prorates |
| E5 | Premium → Standard | Downgrade in group (effective at next renewal) | premium until renewal, then standard | unchanged | unchanged | Premium-only actions rejected after the switch; saved recipes kept |
| E6 | Paid → cancelled (auto-renew off) | User cancels in Apple settings | unchanged until expiry; status `cancelled_active` | unchanged | unchanged | UI shows end date |
| E7 | Paid → expired | Period ends without renewal | free | unchanged; Free limits apply to **new** additions only | remaining trial credits only; never replenished | — |
| E8 | Paid → billing problem with grace period | Renewal fails | unchanged; status `in_grace_period` | unchanged | unchanged | Prompt to update payment |
| E9 | Grace period ends, still failing | Billing retry | free; status `in_billing_retry` | unchanged | unchanged | Restored automatically on recovery (E10) |
| E10 | Billing retry → recovered | Apple charges successfully | previous paid plan | unchanged | unchanged | — |
| E11 | Paid → refunded | Apple refund | free; status `refunded` | unchanged | unchanged | Immediate removal of paid access |
| E12 | Restore on same account | Restore Purchases | per verified Apple state | unchanged | **no** grant | Idempotent |
| E13 | Restore on a different IntelliShop account | Restore Purchases | per D6 (transfer to restoring account) | unchanged on both accounts | **no** grant on either | Old account becomes free |
| E14 | Account deleted | User deletes account | — | deleted (export offered first) | deleted (HMAC trial ledger kept if D4 approved) | Apple subscription must be cancelled by the user; warned in the deletion flow |
| E15 | Client claims premium (tampered state) | — | unchanged (server state) | — | — | Server never reads plan from the client |

## 4. Precedence rules
1. If any Apple subscription granting `premium` is active or in grace period → `premium`.
2. Else if any granting `standard` is active or in grace period → `standard`.
3. Else → `free`.
4. Introductory credits are independent of 1–3 and are only ever decremented.
