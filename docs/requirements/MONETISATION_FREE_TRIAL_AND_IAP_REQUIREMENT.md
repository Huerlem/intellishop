# INTELLISHOP V2 — FINAL MONETISATION UPDATE
## Free AI Trial, Subscription Entitlements & Apple In-App Purchases

**Priority: P0 — Mandatory Product Requirement**

Vesper, incorporate the following approved changes into the existing IntelliShop V2 development roadmap and architecture.

Do not restart the project, discard approved Figma decisions, modify `main`, or implement an unrelated redesign.

This instruction supplements the previously approved subscription, cloud security and Apple In-App Purchase requirements.

## 1. Approved subscription structure

### FREE — £0

- Maximum 2 active shopping lists.
- Maximum 20 items per list.
- Maximum 30 pantry items.
- Basic manual shopping and inventory management.
- No ongoing AI access.
- No supermarket price lookup or comparison.
- **One-time introductory AI allowance: 3 dynamically generated recipes per account.**

The three-recipe allowance is an onboarding demonstration, not a recurring quota.

### STANDARD — £2.99/month (provisional)

- Unlimited shopping lists and list items.
- Unlimited Pantry management.
- Manual shopping and inventory functionality.
- Shopping history.
- No AI recipe generation.
- No AI optimisation.
- No supermarket price lookups or comparisons.

Standard does not automatically receive additional AI credits.

### PREMIUM — £6.99/month (provisional)

- All Standard functionality.
- AI recipe generation using Pantry, Shopping Lists or both.
- AI shopping-list optimisation.
- AI-powered substitutions and recommendations.
- Budget-aware suggestions.
- Real supermarket price comparisons, subject to verified provider availability.
- Access to all supported premium functionality.

Apply clearly disclosed fair-use quotas to cost-bearing AI and external API operations. Do not advertise unlimited AI requests unless the business can sustainably support them.

## 2. One-time AI demonstration — Free plan

Implement a secure introductory allowance of **3 successful AI recipe generations per account**.

Requirements:

1. New Free accounts receive 3 introductory recipe-generation credits.
2. Each successful recipe-generation request consumes 1 credit, regardless of the number of recipes returned.
3. Failed provider requests, timeouts or schema-validation failures must not consume a credit.
4. Requests must use real account data whenever available, respecting the existing Pantry, Shopping List and Combined recipe-generation requirements.
5. If the user has no stored ingredients, provide an onboarding flow to enter ingredients before generation.
6. Display the remaining credits clearly, such as "2 of 3 free AI recipes remaining".
7. After all credits are consumed, show a contextual Premium upgrade prompt.
8. Free credits do not renew daily or monthly.
9. Do not reset the allowance through reinstalling the app, logging out, clearing local storage or switching devices.
10. Store and enforce the allowance server-side, associated with the authenticated account.
11. Prevent concurrent requests from spending more credits than available.
12. Use atomic reservation/finalisation or an equivalent race-safe mechanism to avoid double charging or bypassing limits.
13. Apply authentication, App Check where supported, rate limiting and per-user cost controls.
14. Never expose AI provider credentials to the mobile client.
15. Saved recipes generated during the free trial must remain accessible after the credits are exhausted.
16. Preserve the user's existing recipe data when upgrading or downgrading subscription tiers.

Each successful generation counts as one request, not one individual recipe within the result.

The allowance must work through the production AI backend, not hardcoded responses or mock recipes.

## 3. Subscription and Apple payments

Use Apple auto-renewable In-App Purchases for the Standard and Premium plans.

The implementation must include:

- Subscription products configured in App Store Connect.
- A shared subscription group for Standard and Premium.
- StoreKit-compatible purchasing.
- Evaluation of RevenueCat as the subscription management layer.
- Secure purchase verification and backend entitlement enforcement.
- Subscription restoration.
- Upgrade and downgrade handling.
- Expired and cancelled subscription handling.
- Billing recovery.
- Account-level subscription state synchronisation.
- A Manage Subscription entry in Settings.
- Apple sandbox purchase testing before release.

Premium access must never be granted solely because a local client variable indicates an active subscription.

## 4. Entitlement behaviour

Use a server-authoritative entitlement model.

Suggested fields:

- `plan`: free | standard | premium
- `subscriptionStatus`
- `subscriptionExpiresAt`
- `subscriptionProvider`
- `freeAiCreditsRemaining`
- `freeAiCreditsConsumed`
- `entitlementsUpdatedAt`

These are conceptual fields, not a mandatory final Firestore schema.

Important cases:

- Free → Premium: unlock Premium after verified purchase.
- Free → Standard: unlock unlimited manual management, but no ongoing AI.
- Standard → Premium: unlock Premium features.
- Premium → Standard: retain user data while removing Premium-only access.
- Paid → Free: preserve existing user data and apply Free limits to new additions.
- Premium expires: remaining introductory credits, if any, follow the original account allowance; paid usage must never replenish the lifetime introductory credits.
- Restored purchases: recognise valid Apple transactions without granting duplicated introductory credits.

Define and test the exact entitlement state transitions before implementation.

## 5. Design integration

Extend the approved IntelliShop Figma V2 system with:

- Subscription and plan-selection screen.
- Standard/Premium feature comparison.
- Free AI credit counter.
- Upgrade prompt after trial exhaustion.
- Premium-locked feature states.
- Subscription status in account settings.
- Restore Purchases.
- Manage Subscription.

Preserve the approved Indigo/Cyan/Violet visual language and existing Home | Lists | Pantry navigation.

Do not introduce a permanent AI navigation tab.

## 6. Commercial analytics and cost protection

Design a privacy-conscious event model to measure:

- Free account activations.
- First AI recipe generation.
- Introductory AI credit consumption.
- Free-to-Standard conversions.
- Free-to-Premium conversions.
- Standard-to-Premium upgrades.
- Subscription cancellations.
- Estimated cost per AI generation.
- Premium AI consumption.
- Revenue and cost per paying subscriber.

Do not log raw pantry contents, private recipe prompts, API keys or other sensitive user data as analytics events.

Do not introduce unnecessary advertising or third-party tracking without a separate privacy and product review.

## 7. Required acceptance tests

Test at minimum:

1. Free user receives exactly 3 introductory credits.
2. One successful generation consumes exactly 1 credit.
3. Provider failure does not consume a credit.
4. Fourth generation request without Premium is rejected.
5. Reinstalling or logging in on another device does not reset credits.
6. Concurrent requests cannot bypass the allowance.
7. Standard users cannot access Premium-only API endpoints.
8. Verified Premium users can use authorised AI features.
9. Expired subscriptions lose paid entitlements correctly.
10. Downgrades preserve saved lists, pantry data and recipes.
11. Restore Purchases correctly restores valid Apple entitlements.
12. Premium access cannot be spoofed by changing client-side state.

All test outcomes must be supported by executable evidence.

## 8. Required documentation updates

Update or create:

- `docs/MONETISATION_STRATEGY.md`
- `docs/SUBSCRIPTION_ARCHITECTURE.md`
- `docs/SUBSCRIPTION_ENTITLEMENTS.md`
- `docs/SUBSCRIPTION_TEST_PLAN.md`
- `docs/AI_ARCHITECTURE.md`
- `docs/FIGMA_IMPLEMENTATION_MATRIX.md`

Include the Free AI demonstration in the development roadmap and the requirements traceability matrix.

Do not treat the provisional £2.99 and £6.99 monthly prices as final App Store Connect pricing approval.

## 9. Next deliverable

Before implementing payments or changing production AI services, provide:

1. Updated subscription entitlement matrix.
2. Recommended Free AI credit implementation.
3. Apple StoreKit versus RevenueCat technical recommendation.
4. Expected operating costs and principal commercial risks.
5. Figma screen additions required.
6. Implementation sequence with dependencies.
7. Any decisions requiring owner approval.

**Objective:** Build a commercially sustainable IntelliShop V2 that introduces users to AI through a tightly controlled free demonstration and converts engaged users to paid subscriptions, with Apple-managed iOS payments and secure cloud-based integrations.