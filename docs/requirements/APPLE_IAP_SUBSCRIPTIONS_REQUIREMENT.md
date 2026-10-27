# INTELLISHOP V2 — APPLE APP STORE PAYMENTS (P0)

Received from the owner on 2026-10-27. Supplemented by `MONETISATION_FREE_TRIAL_AND_IAP_REQUIREMENT.md`.

All iOS Standard and Premium subscriptions must support Apple In-App Purchase using auto-renewable subscriptions.

Requirements:

1. Configure Standard and Premium subscription products in App Store Connect.
2. Create one subscription group supporting seamless upgrades and downgrades.
3. Use StoreKit-compatible subscription integration, evaluating RevenueCat as the preferred management abstraction.
4. Verify subscription entitlements securely and synchronise them with Firebase.
5. Implement purchase, restore purchases, cancellation handling, expiration, billing recovery and subscription status updates.
6. Include a Manage Subscription option in account settings.
7. Support monthly subscriptions initially and prepare the architecture for optional annual plans.
8. Use Apple sandbox testing before TestFlight and production release.
9. Ensure subscriptions are compliant with Apple's current App Review Guidelines.
10. Never unlock paid functionality solely from client-side subscription state.

Subscription prices remain provisional: Standard £2.99/month and Premium £6.99/month.
Document any Apple Developer agreements, banking, tax or App Store Connect configuration that requires action from the account owner.
