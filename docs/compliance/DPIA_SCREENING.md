# DPIA Screening — IntelliShop V2

| | |
|---|---|
| Version | 0.2 (draft; DPIA required vs precautionary distinguished) |
| Date | 28 October 2026 |
| Assessor | Prepared by the development assistant for the controller; **controller decision required** |
| Basis | `DATA_FLOW_INVENTORY.md` v0.1; UK GDPR Art. 35; ICO list of processing likely to result in high risk (S-07) |

## 1. Screening against the ICO list (S-07)

| ICO criterion | Applies? | Reasoning |
|---|---|---|
| Innovative technology (AI, machine learning) | **Yes** | Generative AI produces recipes, optimisation and substitution suggestions from the user's pantry, lists and (if consented) dietary data. The ICO lists AI as an example. |
| Denial of service (decisions on access based on automated processing or special category data) | No | Quotas and plan checks are contractual, not decisions about eligibility based on personal characteristics. |
| Large-scale profiling | No (at launch) | There is no profiling for marketing or scoring. Re-assess if personalised recommendations are built from purchase history. |
| Biometric data | No | — |
| Genetic data | No | — |
| Data matching | No | No combining of data from multiple sources. |
| Invisible processing | No | All data comes from the user. |
| Tracking (geolocation or behaviour) | No | No location; no analytics. Purchase history (D13, planned) is user-visible and for the user's own pantry. |
| Targeting children or vulnerable people for marketing | No | No marketing. The minimum-age decision is pending (DP-22). |
| Risk of physical harm if breached | **Partly** | A breach of allergy data would not itself cause physical harm. However, **incorrect AI output** about allergens could. That is a product-safety risk, which the DPIA should still cover under accuracy (Art. 5(1)(d)) and fairness. |

Additional factors from Art. 35(3) and (1):
- **Special category data:** allergies and intolerances (health), and dietary preferences that may reveal religious or philosophical belief (D14, D15). Optional, but processed on a regular basis for users who opt in.
- **International transfer** of AI request content to the provider (US or global inference — S-34).
- **New processor relationships** (AI provider, RevenueCat).

## 2. Conclusion (corrected in v0.2)

The ICO says that "in most cases, a combination of two" of the nine European (WP29) criteria indicates the need for a DPIA. A DPIA may still be needed with one criterion, and doing one is then "good practice" (S-38, accessed 28 Oct 2026).

| Processing | WP29 criteria met | DPIA status | Basis |
|---|---|---|---|
| Core account, lists, pantry, shopping mode (no AI, no dietary data) | None of significance | **Not required.** Reasons documented here (Art. 5(2) accountability) | S-38 |
| AI suggestions **without** dietary or allergy data | Innovative technology (1) | **Precautionary**: recommended, good practice | S-07, S-38 |
| AI suggestions **with** allergies or medical diets (health data) | Innovative technology + sensitive data (2) | **Required** before release | S-07 (innovative technology combined with another criterion), S-38 |
| AI with only religious-diet options (halal, kosher) | Innovative technology + (probably) sensitive data | **Treat as required** (precaution; *legal review*) | S-37 |
| Neutral 'ingredients to avoid' list (no health label; DPIA-1 alternative) | Innovative technology; sensitive-data criterion probably not met | **Precautionary** | S-37 intention test |
| Large-scale special category processing (Art. 35(3)(b)) | — | Not met at launch scale; re-assess as the user base grows | S-01 Art. 35(3) |

**Decision for the owner:** completing **one DPIA covering all AI processing** before M3 release satisfies the mandatory case and the precautionary case together. This remains the recommendation.

## 3. Scope of the full DPIA (to be completed before M3 release)

1. **Description:** data D14–D19 and their flows (inventory §3); the provider; retention; the transfer mechanism.
2. **Necessity and proportionality:**
   - Is health data necessary? A non-health alternative is "ingredients to avoid" with no medical label. The DPIA must decide whether storing an "allergy" label adds safety value, such as stronger warnings, compared with a neutral exclusion list.
   - Minimum data sent to the AI (AI-05).
3. **Risks to individuals:**
   - R1: allergen omitted or mis-named in a generated recipe, causing a reaction.
   - R2: unauthorised access to health or religious data (the Security Rules gap, DP-16).
   - R3: provider retention or secondary use beyond the contract.
   - R4: user believes the AI verified safety.
   - R5: dietary data inferred from pantry contents without consent. Pantry data is sent to the AI only for a requested generation; constraints are sent only with consent.
   - R6: transfer to a jurisdiction with weaker enforcement.
4. **Measures:**
   - Explicit consent with withdrawal.
   - Deterministic allergen validation (`FOOD_SAFETY` technical spec).
   - Warnings that cannot be dismissed permanently.
   - Human confirmation before list changes.
   - Security Rules with ownership by path.
   - App Check.
   - Server-only provider calls.
   - Logs with no content.
   - Retention limits.
   - Processor DPA.
   - Zero data retention, if available on the chosen plan (S-33).
5. **Residual risk and sign-off** by the controller.
6. **ICO prior consultation** (Art. 36) if a high residual risk remains. Not expected if the measures are implemented.

## 4. Owner decisions needed

| ID | Decision |
|---|---|
| DPIA-1 | Store allergies as health data with explicit consent (recommended for stronger safety handling), **or** offer only a neutral "ingredients to avoid" list |
| DPIA-2 | Whether religious dietary preferences (halal, kosher) are offered at all at launch |
| DPIA-3 | Provider and plan (zero data retention or standard retention) once contracted |
| DPIA-4 | Retention periods for the AI cache, favourites and usage logs |
