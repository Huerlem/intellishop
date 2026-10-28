---
title: AI Transparency & Safety
slug: ai
version: 0.2.0-draft
status: DRAFT — not published
effective: "[OWNER TO CONFIRM: effective date]"
last_updated: 2026-10-28
---

# AI Transparency & Safety

> **Draft for owner review — not published.** **No AI feature is live yet.** Every AI feature described here is **[PENDING IMPLEMENTATION: milestone M3 (recipes) and M7 (list optimisation)]**. The AI provider and model are **not yet confirmed**. This page will describe only practices confirmed in our contract with the provider and verified in testing.

## 1. What the AI does in IntelliShop

IntelliShop uses a generative AI model, a computer system that writes text, for these optional features:

| Feature | What you get | Plan |
|---|---|---|
| **Recipe suggestions** from your Pantry, your Shopping List, or both | 1–5 recipe ideas, each showing which ingredients you already have, which are on your list and which are missing | Introductory credits on any plan; ongoing use on Premium |
| **List optimisation** ([PENDING IMPLEMENTATION: M7]) | Suggestions to add, remove or swap items, each with a reason | Premium |
| **Substitution ideas** ([PENDING IMPLEMENTATION: M7]) | Possible alternatives when an item is unavailable | Premium |

The AI **does not**:
- decide prices, supermarket stock, product availability or store locations; IntelliShop never asks the AI for these facts;
- change your lists or pantry by itself. Every suggestion is shown for you to accept or reject;
- make decisions about you that have legal or similarly significant effects.

## 2. Your permission

The first time you use an AI feature, the app shows:
- what will be sent;
- who will receive it;
- a link to this page.

It then asks for your permission, with **Allow AI suggestions** and **Not now** buttons and nothing pre-selected. You can change your choice at any time in **Settings → Privacy → AI suggestions**. If you withdraw permission, we stop sending your information immediately, and the rest of the app keeps working.

We ask for this permission because Apple's App Store rules require apps to get explicit permission before sharing personal data with third-party AI. Our lawful basis under data protection law is explained in the Privacy Policy.

[PENDING IMPLEMENTATION: L3-01.]

## 3. What is sent to the AI provider

| Sent | Never sent |
|---|---|
| Ingredient and item names, quantities, units and expiry dates from the pantry and/or list you choose | Your name or email address |
| The type of request (pantry, list or both) and number of servings | Your account identifier (we use a temporary request reference instead) |
| **Only if you have separately agreed:** your allergies, intolerances and dietary preferences | Your photo, IP address or device information |
| | Information from other lists or other users |

Our servers send the request. The app never contacts the AI provider directly, and no AI keys are stored in the app.

## 4. Who the provider is and what it does with the information

- **Provider and model:** **[OWNER TO CONFIRM: provider name and model, once contracted and tested]**.
- **Provider's role:** **[OWNER TO CONFIRM: processor under a data processing agreement]**.
- **Where it processes data:** **[OWNER TO CONFIRM: location and transfer safeguard from the contract]**.
- **How long it keeps requests and responses:** **[OWNER TO CONFIRM: retention period from the contract, including any exceptions such as safety review]**.
- **Training:** **[OWNER TO CONFIRM: contract terms on whether request content may be used to train models]**. **We** do not use your information to train AI models.

## 5. How we check AI results

Before you see an AI result, our servers check it **automatically**:

- **Structure:** the result must match a fixed format. Results that do not match are rejected, and we show an error instead of guessing. We never show made-up "fallback" recipes.
- **Your ingredients:** we work out which ingredients you have, which are on your list and which are missing from your actual pantry and list data, not from the AI's claims.
- **Allergens:** if you have saved allergies, we compare every ingredient against a list covering the 14 allergens identified by the UK Food Standards Agency and common ingredients that contain them.
  - A recipe that contains one of your allergens is discarded.
  - Ingredients that **might** contain an allergen are marked "Check this ingredient".
- **Wording:** we remove claims such as "allergen-free" or "safe for" from AI results. The AI cannot know how your products were made.
- **No invented facts:** the result format does not allow prices, stock levels, cooking temperatures or storage times.

These checks reduce risk but **cannot remove it**. See **Food Safety & Allergens**.

[PENDING IMPLEMENTATION: L3-04, L3-05; tests FT-01…FT-12 must pass before release.]

## 6. Known limitations

AI suggestions can:
- include mistakes, such as wrong quantities, steps in the wrong order, or ingredients missing from the method;
- misunderstand unusual item names or abbreviations;
- suggest combinations that do not suit your taste, equipment or skill;
- be similar to existing published recipes.

Always:
- read a recipe fully before you start;
- check product labels for allergens;
- cook food thoroughly;
- use your own judgement.

## 7. Nutrition information

**[OWNER TO CONFIRM: decision FS-D1.]**
- **If no nutrition is shown (recommended for launch):** "IntelliShop does not show nutrition values for AI recipes."
- **If AI estimates are shown:** "Nutrition values are AI estimates, not measurements. They are not verified and vary by product and portion. Do not rely on them for medical or dietary needs."

## 8. Limits, quotas and costs

AI features cost money to run, so they are limited:
- Free accounts get a small number of one-time introductory generations.
- Premium includes ongoing use within fair-use quotas.

A generation that fails because of a technical problem does not use up your credits or quota. Details are in the **Subscription & Billing Terms**.

## 9. Reporting a problem

If an AI result looks wrong, unsafe or offensive, use **Report** on the result ([PENDING IMPLEMENTATION]) or email **[OWNER TO CONFIRM: support email]**. Reports help us improve our checks. We do not send reports to the AI provider unless we tell you first.
