---
title: Account & Data Deletion
slug: account-deletion
version: 0.2.0-draft
status: DRAFT — not published
effective: "[OWNER TO CONFIRM: effective date]"
last_updated: 2026-10-28
---

# Account & Data Deletion Policy

> **Draft for owner review — not published.** **In-app account deletion and data download are not built yet** ([PENDING IMPLEMENTATION: L2-06, L2-07, L2-08]). This page must not be published until they work as described and have passed their tests.

## 1. How to delete your account

1. **Optional:** download a copy of your data in **Settings → Privacy → Download my data**.
2. **If you have a paid subscription, cancel it first.** Deleting your IntelliShop account **does not cancel billing**: your subscription is managed by Apple and billing continues through Apple until you cancel. The deletion screen shows a **Manage subscription** button that opens Apple's subscription settings.
3. Go to **Settings → Account → Delete account**.
4. Read what will be deleted. For your security, enter your password again.
5. Tap **Delete my account permanently**.

You do not need to email, phone or chat with us to delete your account.

If you cannot sign in, email **[OWNER TO CONFIRM: support email]** from the email address on your account and ask us to delete it. We may ask you to confirm the request before we act.

## 2. What we delete

When you confirm, we immediately start deleting, and remove from our live systems:

- your sign-in account (email address and password);
- your profile (name and photo);
- all your shopping lists and their items;
- all your pantry items;
- your shopping-trip history;
- your allergies, intolerances and dietary preferences, and the consent records for them;
- your saved recipes and any stored AI results linked to your account;
- your introductory AI generation balance and usage counters;
- your subscription status record in IntelliShop;
- your account record at our subscription service provider (RevenueCat) ([PENDING IMPLEMENTATION: M6]).

**How long it takes:** deletion from live systems normally completes within **[OWNER TO CONFIRM: e.g. a few minutes; at most 30 days]**. The app confirms when it is done. You will be signed out.

Deletion is permanent. We cannot restore a deleted account.

## 3. What we keep, and why

| Record | Why | How long |
|---|---|---|
| A minimal deletion record: a one-way coded version of your account ID and the date of deletion. **No** email address or name | To show that we carried out your request, and to complete deletion if a step needs retrying | **[OWNER TO CONFIRM: e.g. 3 years]** |
| Copies in **backups** | Backups protect against data loss; we cannot edit them | Until the backup expires: **[OWNER TO CONFIRM: backup retention]**. Google states that deleted sign-in accounts are removed from its backups within 180 days |
| Your **emails to us** and **complaint records** | To deal with any open request or complaint, and as required by data protection law | **[OWNER TO CONFIRM: e.g. 2 years after closure]** |
| **Transaction records** held by Apple and by our subscription provider | Tax and accounting obligations, and Apple's own records | Apple decides how long it keeps its records. Our own records are kept as long as tax law requires: **[OWNER TO CONFIRM with accountant]** |
| AI provider copies of past requests (no name, email or account ID) | Depends on the provider's terms | **[OWNER TO CONFIRM: from the AI provider contract]** |

We do **not** keep your email address after deletion to track you, and we do not create a "shadow" profile.

## 4. Subscriptions and refunds

- Your Apple subscription continues and Apple keeps charging you until you cancel it in your Apple settings, even after your IntelliShop account is deleted.
- If you have paid for time you will not use, you can ask Apple for a refund (see **Subscription & Billing Terms**, section 7). Apple decides refund requests.

## 5. Deleting individual items without deleting your account

You can delete any list, item, pantry item, saved recipe, photo or dietary preference at any time in the app. You can also withdraw permission for AI features and for dietary information in **Settings → Privacy**. Withdrawing permission for dietary information deletes the stored preferences.

## 6. Inactive accounts

**[OWNER TO CONFIRM: whether inactive accounts are deleted automatically, for example after 24 months without sign-in, with an email warning 30 days before.]**

## 7. If we close the Service

If we stop running IntelliShop, we will give notice, offer a way to download your data, and then delete accounts as described here.
