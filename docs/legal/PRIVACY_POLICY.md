---
title: Privacy Policy
slug: privacy
version: 0.2.0-draft
status: DRAFT — not published
effective: "[OWNER TO CONFIRM: effective date]"
last_updated: 2026-10-28
---

# IntelliShop Privacy Policy

> **Draft for owner review — not published and not reviewed by a lawyer.**
> This draft describes IntelliShop as intended at its first public release. Text marked **[PENDING IMPLEMENTATION: …]** describes a feature or safeguard that is not yet built. It must not be published until the release gate confirms the feature works as described. Text marked **[OWNER TO CONFIRM: …]** needs information only the owner can provide.

## 1. Who we are

IntelliShop is a shopping-list, pantry and meal-planning app for iPhone.

The **controller** responsible for your personal information is **[OWNER TO CONFIRM: legal name of the individual or company operating IntelliShop, and trading status — e.g. "Jane Smith, a sole trader trading as IntelliShop" or "IntelliShop Ltd, company number …"]**.

- Postal address: **[OWNER TO CONFIRM: publishable postal address]**
- Email for privacy questions and requests: **[OWNER TO CONFIRM: privacy/support email]**
- ICO registration number: **[OWNER TO CONFIRM: ICO data protection fee registration number]**

We have not appointed a Data Protection Officer because the law does not require one for a service of our type and size. The privacy contact above deals with all privacy matters.

In this policy, "we", "us" and "our" mean the controller named above. "You" means a person who uses the IntelliShop app or our website.

## 2. Summary

| Question | Short answer |
|---|---|
| What do we collect? | Your name, email address and password, the shopping lists and pantry items you create and, only if you choose, a profile photo and dietary or allergy preferences |
| Do we sell your data or use it for advertising? | **No.** The app contains no advertising and no advertising or analytics tracking |
| Do we use AI? | Yes, for optional features such as recipe suggestions. We ask your permission before sending any of your information to an AI provider ([PENDING IMPLEMENTATION: AI consent, L3-01]) |
| Who else receives your data? | Service providers that run the app for us, mainly Google (Firebase). See section 7 |
| Is your data sent outside the UK? | Some of it, to the United States. See section 8 |
| Can you delete your account? | Yes, inside the app ([PENDING IMPLEMENTATION: account deletion, L2-06]) |
| How do you complain? | Contact us first (section 13). You can also complain to the Information Commissioner's Office (ICO) |

## 3. Information we collect

### 3.1 Information you give us

| Information | When | Required? |
|---|---|---|
| Name (the name you would like us to use) | When you create an account | Yes |
| Email address | When you create an account | Yes, for sign-in, password reset and service messages |
| Password | When you create an account | Yes. Our authentication provider stores it in a form we cannot read |
| Shopping lists: list names, items, quantities, units, categories, notes, whether an item is ticked, and any prices **you** type in | When you use Lists | To use the feature |
| Pantry items: names, quantities, units, categories, minimum quantities, expiry dates | When you use Pantry | To use the feature |
| Shopping trips: what you marked as bought, substituted or unavailable, and any total you type in ([PENDING IMPLEMENTATION: Shopping Mode and trip history, milestone M5]) | When you use Shopping Mode | To use the feature |
| Profile photo | Only if you choose one | No |
| **Allergies and intolerances**, and **dietary preferences** (for example vegetarian or halal) ([PENDING IMPLEMENTATION: L3-03]) | Only if you choose to add them, after a separate permission screen | No |
| Saved (favourite) recipes ([PENDING IMPLEMENTATION: M3]) | When you save a recipe | No |
| Messages you send to us | When you contact support or make a complaint | Only if you contact us |

**We do not ask for** your phone number, your home address, your date of birth or payment card details. [PENDING IMPLEMENTATION: removal of phone and address fields from registration, L2-01 — the current development version still asks for them.]

### 3.2 Information collected automatically

| Information | Collected by | Why |
|---|---|---|
| Your IP address and device or browser type when you sign in | Google Firebase Authentication | To keep accounts secure and prevent abuse |
| Your IP address when the app asks our servers to do something (for example, generate a recipe) | Google Cloud Functions | To deliver the request. Google keeps it only temporarily |
| A device-integrity check result from Apple ("App Attest") ([PENDING IMPLEMENTATION: App Check, M2–M3]) | Apple and Google Firebase App Check | To stop modified or automated copies of the app misusing paid and AI features |
| A sign-in session stored on your iPhone | The app | To keep you signed in |
| Records of AI feature use: feature used, date and time, amount of computing used, success or failure ([PENDING IMPLEMENTATION: M3]) | Our servers | To apply plan limits and fair-use quotas, control costs and prevent abuse. These records do **not** contain your ingredients, allergies or the recipes generated |

We do **not** use analytics, advertising, crash-reporting or tracking tools. We do not collect your location, contacts, browsing history or advertising identifier.

### 3.3 Information from other sources

- **Apple:** if you subscribe, Apple tells us (through our subscription service provider, RevenueCat) whether your subscription is active, its type and its renewal or expiry date. We never receive your payment card details. [PENDING IMPLEMENTATION: subscriptions, milestone M6.]

## 4. How we use your information and our lawful bases

UK data protection law requires a **lawful basis** for each use of personal information.

| Purpose | Information | Lawful basis |
|---|---|---|
| Creating and running your account; signing you in; password resets | Name, email, password, session | **Contract**: necessary to provide the service you asked for |
| Providing lists, pantry, shopping mode and trip history | Lists, pantry, trips, prices you enter | **Contract** |
| Showing your profile photo | Photo | **Contract**: an optional feature you choose to use |
| Generating AI suggestions you ask for (recipes, list optimisation, substitutions) | Ingredient names, quantities, units, expiry dates, recipe mode, servings | **Contract**: you ask for the feature. **Plus your explicit permission** before any information is sent to the AI provider, as Apple's App Store rules require |
| Taking your allergies and dietary preferences into account | Allergies, intolerances, dietary preferences | **Explicit consent** (see section 6) |
| Applying plan limits, introductory AI credits and fair-use quotas | Plan status, usage counters | **Contract** |
| Managing subscriptions and restoring purchases | Subscription status from Apple via RevenueCat | **Contract** |
| Keeping the service secure and preventing abuse and fraud | IP address, device-integrity result, usage records | **Legitimate interests**: protecting users and the service. We have considered your interests and keep this information for short periods |
| Answering your messages, requests and complaints | Your message and contact details | **Legitimate interests**: helping you. **Legal obligation**: for data protection requests and complaints |
| Keeping records of consent, deletion and requests | Consent records, request log | **Legal obligation**: to show we comply with data protection law |
| Keeping financial records where the law requires it | Transaction records | **Legal obligation** |
| Sending service messages, such as password resets and important changes to these documents or your subscription | Email | **Contract** or **legal obligation**. We do not send marketing messages |

We do not make decisions about you that have legal or similarly significant effects based solely on automated processing. AI suggestions are only suggestions: nothing changes in your lists or pantry unless you accept it.

## 5. AI features

AI features are optional. Before the first use, the app explains what will be sent and to which provider, and asks for your permission. You can withdraw permission at any time in **Settings → Privacy → AI suggestions**. [PENDING IMPLEMENTATION: L3-01.]

When you ask for an AI suggestion, our servers send the AI provider only what the task needs: ingredient names, quantities, units, expiry dates, the type of request and, **only if you have separately agreed**, your allergies and dietary preferences.

We **never** send your name, email address, account identifier or photo. The provider returns a suggestion, which our servers check before showing it to you.

AI provider: **[OWNER TO CONFIRM: AI provider name, once a contract is in place and tested]**. Its role, what it may keep and for how long, and where it processes information are described in our **AI Transparency & Safety** page. We will only describe practices that are confirmed in our contract with the provider.

## 6. Allergies, intolerances and dietary preferences

- **Allergies and intolerances** are information about your health. UK data protection law treats health information as "special category" data, which needs extra protection.
- Some **dietary preferences**, such as halal or kosher, can reveal a religious or philosophical belief, which is also special category data.
- Preferences such as vegetarian are usually ordinary personal information. For simplicity and safety, we protect all dietary information in the same way.

We use this information only:
- with your **explicit consent**, given on a separate screen with nothing pre-selected;
- to filter and check recipe suggestions and show allergen warnings.

You can change or delete the information, or withdraw consent, at any time in Settings. When you withdraw consent, we **delete** the stored preferences rather than just hiding them. [PENDING IMPLEMENTATION: L3-03.]

The app works without this information. If you do not give it, recipe suggestions will not take allergies or diets into account, and the app will tell you so.

**Important:** the app's allergen checks are a helpful aid, not a guarantee. Please read our **Food Safety & Allergens** page.

## 7. Who we share information with

We do **not** sell your personal information, and we do not share it for advertising.

We use the following **service providers** ("processors"), which handle information only on our instructions and under data processing terms:

| Provider | What it does for us | Information |
|---|---|---|
| Google (Firebase Authentication, Cloud Firestore, Cloud Storage, Cloud Functions, App Check) | Sign-in, database, file storage, server functions, device-integrity checks | All account, list, pantry and preference information; IP addresses |
| **[OWNER TO CONFIRM: AI provider]** ([PENDING IMPLEMENTATION: M3]) | Generating AI suggestions | Only the request content described in section 5 |
| RevenueCat ([PENDING IMPLEMENTATION: M6]) | Checking and managing App Store subscription status | An account identifier, subscription and transaction details from Apple |
| **[OWNER TO CONFIRM: email/support provider]** | Receiving and answering support emails | Your messages and email address |

**Apple** processes your payment and subscription under its own terms and privacy policy, as an independent organisation, not as our processor. Apple also provides the App Attest device check.

We may also disclose information:
- if the law requires it, or to respond to a valid legal request;
- to protect the rights, safety or property of users, the public or us;
- to a buyer or successor if the IntelliShop business is transferred, in which case this policy continues to apply.

## 8. International transfers

Some of our providers process information outside the UK:

- **Google Firebase Authentication** runs only from data centres in the United States. Google states that it relies on the UK Extension to the EU–US Data Privacy Framework. The UK has adequacy regulations for transfers to US organisations certified under it (the "UK–US data bridge").
- **Cloud Firestore and Cloud Storage** store data in **[OWNER TO CONFIRM: database and storage location of the production Firebase project, e.g. London (europe-west2)]**.
- **AI provider:** **[OWNER TO CONFIRM: processing location and transfer safeguard, from the signed contract]**.
- **RevenueCat:** **[OWNER TO CONFIRM: processing location and transfer safeguard, from RevenueCat's data processing addendum]**.

Where a transfer is not covered by UK adequacy regulations, we use the safeguards UK law requires, such as the International Data Transfer Agreement or the UK Addendum to the EU standard contractual clauses. You can ask us for more information about these safeguards.

## 9. How long we keep information

| Information | How long |
|---|---|
| Account, lists, pantry, photo, preferences, saved recipes | Until you delete them or your account |
| Shopping-trip history | **[OWNER TO CONFIRM: e.g. 24 months, or until you delete it]** |
| AI results cache (to avoid repeating the same request) | **[OWNER TO CONFIRM: e.g. 30 days]** |
| AI usage records (no content) | **[OWNER TO CONFIRM: e.g. 13 months]** |
| Security sign-in records (IP address) kept by Google | A few weeks, according to Google |
| Backups | **[OWNER TO CONFIRM: backup retention, e.g. 35 days]**. Deleted information may remain in backups until they expire. Google states that deleted sign-in accounts are removed from its backup systems within 180 days |
| Support messages and complaints | **[OWNER TO CONFIRM: e.g. 2 years after the matter is closed]** |
| Records of privacy requests and consent | **[OWNER TO CONFIRM: e.g. 3 years]**, to show we complied with the law |
| Financial records | As long as tax law requires **[OWNER TO CONFIRM with accountant]** |

When you delete your account, see our **Account & Data Deletion Policy** for exactly what is deleted and what is kept.

## 10. Security

We take steps to protect your information, including:

- Information travels between the app and our providers over encrypted connections. Google encrypts stored data.
- Secret keys for AI and other paid services are kept on our servers in a secrets manager, never inside the app. [PENDING IMPLEMENTATION: server functions, M2–M3.]
- Database access rules allow each account to reach only its own data. [PENDING IMPLEMENTATION: security rules and tests, L2-03 — must be in place before release.]
- We do not record your ingredients, allergies or AI results in our technical logs.
- Your sign-in session is kept in the app's private storage on your iPhone. Use a device passcode to protect it.

No system is completely secure. If a personal data breach is likely to put you at high risk, we will tell you without undue delay.

## 11. Your rights

You have the right to:

- **access** your information and receive a copy;
- **correct** inaccurate information;
- **delete** your information;
- **restrict** how we use it in some circumstances;
- **object** to uses based on legitimate interests;
- **data portability**: receive the information you gave us in a machine-readable format;
- **withdraw consent** at any time, without affecting what we did before you withdrew it.

You can do most of this yourself in the app:
- edit or delete lists, pantry items and preferences;
- **Settings → Privacy → Download my data** ([PENDING IMPLEMENTATION: L2-08]);
- **Settings → Account → Delete account** ([PENDING IMPLEMENTATION: L2-06]).

Or email **[OWNER TO CONFIRM: privacy/support email]**. We may need to confirm your identity. We will respond within one month, which can be extended by two further months for complex requests, in which case we will tell you why.

## 12. Children

IntelliShop is intended for people aged **[OWNER TO CONFIRM: minimum age — 18 recommended]** and over. If you believe a child has created an account, please contact us and we will delete it.

## 13. Complaints

If you are unhappy with how we have handled your information, please contact us first at **[OWNER TO CONFIRM: privacy/support email]** or through **Help → Privacy request or complaint** in the app. We will acknowledge your complaint within 30 days and respond without undue delay. See **Support & Complaints**.

You can also complain to the **Information Commissioner's Office (ICO)**: ico.org.uk, telephone 0303 123 1113.

## 14. Storage on your device

The app stores your sign-in session on your iPhone so you stay signed in. This is strictly necessary for the service you asked for. The app does not use cookies, advertising identifiers or other tracking technologies.

Our website **[OWNER TO CONFIRM: domain]** does not set cookies or use analytics.

## 15. Changes to this policy

We will update this policy when our practices change. The version number and date at the top show the current version, and previous versions are available at **[OWNER TO CONFIRM: domain]/legal/archive/privacy**. If a change is significant, we will tell you in the app before it takes effect.
