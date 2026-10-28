# App Store Privacy Mapping — IntelliShop V2

| | |
|---|---|
| Version | 0.1 (draft) |
| Date | 28 October 2026 |
| Sources | Apple, *App privacy details on the App Store* (S-24); App Review Guidelines (S-20, S-21); Expo privacy manifest guide (S-25) |
| Rule | App Privacy answers in App Store Connect must describe **the build being submitted**, including third-party SDKs (S-24). This file is re-derived from the code at every release. **Never copy the "target" column into App Store Connect before the code ships.** |

Apple's definitions used here (S-24):
- **Collect:** data is transmitted off the device and kept longer than needed to service the request in real time.
- **Linked:** personal data, as defined by privacy law, counts as linked to the user.
- **Tracking:** linking with third-party data for advertising, or sharing with data brokers.

## 1. Current build (M1 code at `c836629`)

| Apple data type | Collected? | Linked to user? | Tracking? | Purpose (Apple category) | Evidence | Notes |
|---|---|---|---|---|---|---|
| Contact Info → Name | Yes | Yes | No | App Functionality | `users/{uid}.displayName` | — |
| Contact Info → Email Address | Yes | Yes | No | App Functionality | Firebase Auth; `users/{uid}.email` | — |
| Contact Info → Phone Number | Yes (optional field) | Yes | No | App Functionality | `users/{uid}.phoneNumber` | **To be removed in M2 (DF-1)**. If removed before submission, do not declare. |
| Contact Info → Physical Address | Yes (postcode mandatory) | Yes | No | App Functionality | `users/{uid}.address` | **To be removed in M2 (DF-1)** |
| User Content → Photos or Videos | Yes (optional profile photo) | Yes | No | App Functionality | Cloud Storage `profile_images/{uid}` | Keep or drop decided in M2 (DF-5) |
| User Content → Other User Content | Yes | Yes | No | App Functionality | `shoppingLists`, `stockItems` | Lists and pantry |
| Identifiers → User ID | Yes | Yes | No | App Functionality | Firebase UID stored with every record | — |
| Usage Data, Diagnostics, Location, Contacts, Financial Info, Browsing, Search History, Sensitive Info, Health | **No** | — | — | — | No SDK or code for these (`package.json`; code review) | — |
| Identifiers → Device ID | **To verify** | — | No | App Functionality (security) | Firebase Auth sends user agent and IP for abuse prevention (S-30); no advertising identifier | IP addresses alone are not an Apple "data type". Confirm on the first EAS build that no SDK reads IDFV or IDFA. |

**Tracking: No.** There is no ATT prompt and none is needed. No data is linked with third-party data for advertising, and none is shared with data brokers.

## 2. Target build (V2 with M2–M3 and subscriptions) — planned, not yet true

| Apple data type | Expected | Linked | Tracking | Purposes | Trigger |
|---|---|---|---|---|---|
| Contact Info → Name | Yes | Yes | No | App Functionality | Display name (consider making it optional) |
| Contact Info → Email Address | Yes | Yes | No | App Functionality | Account |
| Contact Info → Phone / Physical Address | **No** | — | — | — | Removed in M2 |
| Health & Fitness → Health | **Yes, if allergies and intolerances ship** | Yes | No | App Functionality | Apple: "any other user provided health or medical data" (S-24) |
| Sensitive Info | **Yes, if religious dietary preferences ship** | Yes | No | App Functionality | Apple lists "religious or philosophical beliefs" (S-24) |
| User Content → Other User Content | Yes | Yes | No | App Functionality | Lists, pantry, recipe favourites, AI request content sent to the provider |
| User Content → Customer Support | Yes, if support is handled in-app | Yes | No | App Functionality | Complaint or support form |
| Identifiers → User ID | Yes | Yes | No | App Functionality | Firebase UID; RevenueCat app user ID |
| Purchases → Purchase History | Yes | Yes | No | App Functionality | Subscription status and transactions via RevenueCat (S-24 definition: "An account's or individual's purchases") |
| Identifiers → Device ID | To verify | — | No | App Functionality | App Check / App Attest, and RevenueCat SDK behaviour, verified from the built binary and SDK documentation |
| Usage Data / Diagnostics | **No**, unless an SDK is added | — | — | — | Any analytics or crash SDK is a new decision requiring a policy update |

Shopping-trip purchase history (D13) is **user content**, not Apple "Purchases": it records the user's grocery purchases, not in-app purchases. Declare it under Other User Content. Revisit if Apple's definition is read otherwise; Apple's text is "purchases or purchase tendencies", which arguably covers it. Taking the cautious reading, **also declare Purchase History** when D13 ships.

## 3. Third-party AI disclosure (Guideline 5.1.2(i))

Apple requires apps to "clearly disclose where personal data will be shared with third parties, including with third-party AI, and obtain explicit permission before doing so" (S-21). Implementation (M3):

1. A first-use sheet before the first AI generation. It states the provider name (once contracted), what is sent (ingredient names, quantities, units, expiry dates, recipe mode and, only if separately consented, dietary and allergy constraints), what is never sent (name, email, address, account ID), and links to `AI_TRANSPARENCY`.
2. Buttons: **Allow AI suggestions** / **Not now**. There is no pre-selected state. "Not now" leaves all non-AI features working.
3. The consent record is stored (`users/{uid}/consents/ai`) with the policy version and timestamp.
4. Settings → Privacy → **AI suggestions** toggle to withdraw. Withdrawing blocks further calls immediately; the server checks the consent record too.
5. App Review notes explain where the sheet appears and give a demo account. One developer-forum thread is titled "Rejected a couple of time for 5.1.1/5.1.2 - AI consent screen not seen by reviewers" (https://developer.apple.com/forums/thread/820209; title seen in search, thread not reviewed). The review notes should therefore give exact steps to reach the sheet.

## 4. Privacy manifest (required-reason APIs)

- Expo SDK packages ship their own `PrivacyInfo.xcprivacy`. Expo notes that Apple does not always parse manifests from static CocoaPods dependencies, so reasons may need copying into `ios.privacyManifests` in `app.config.ts` (S-25).
- Firebase is used through the **JavaScript SDK** (no native Firebase pods), so Firebase contributes no native manifest.
- RevenueCat (`react-native-purchases`) will add native code. Check its manifest when it is added.
- Action: on the first EAS iOS build, extract the generated `PrivacyInfo.xcprivacy`, compare it with Apple's email feedback after upload, and record the result here. **Status: NOT TESTED** (no iOS build yet).

## 5. Permissions

| Permission | Current | Required? | Action |
|---|---|---|---|
| Photo library | Purpose string set; `requestMediaLibraryPermissionsAsync()` called before the picker | Probably **not**: the system picker runs out of process, and Apple asks apps to use it rather than request full access (S-20 5.1.1(iii)) | Remove the request in M2. Confirm on a device that the picker opens without a prompt. If confirmed, remove the purpose string |
| Camera, microphone | Disabled in config | No | — |
| Notifications | Not used | — | Re-assess in M5 |
| Location | Not used | — | A future store finder must use "When In Use" with a clear purpose |
| App Tracking Transparency | Not used | No (no tracking) | — |
