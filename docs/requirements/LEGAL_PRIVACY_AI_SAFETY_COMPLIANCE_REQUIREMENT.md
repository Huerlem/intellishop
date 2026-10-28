# INTELLISHOP V2 — LEGAL, PRIVACY, AI SAFETY & APP STORE COMPLIANCE

**Priority: P0 — Mandatory Release Requirement**

Vesper, integrate a complete legal and regulatory compliance workstream into the existing IntelliShop V2 development roadmap.

This is an additional mandatory product requirement, not a request to restart the project.

Continue preserving the approved Figma V2 architecture, subscription strategy, secure cloud architecture and current M1 implementation.

M1 must still pass its existing executable acceptance criteria independently.

## 1. Objective

Prepare IntelliShop for commercial distribution through the Apple App Store, initially targeting consumers in the United Kingdom.

All public documents must use clear, professional British English.

We currently have no budget for external legal counsel. Therefore, create comprehensive, source-supported legal drafts and a documented compliance assessment without claiming that the documents have received professional legal certification.

Use official legislation, ICO guidance, Apple Developer documentation and relevant supplier agreements as primary sources.

Do not copy another company's terms or privacy policy.

## 2. Existing LUFI reference

Our previous LUFI application established a legal-document approach including:

- Privacy Policy
- Terms of Service
- AI Transparency
- Community Guidelines
- Trust Manifesto
- Crisis Protocol
- Versioned legal documents and accessible in-app links

Use this as a structural and UX reference only.

IntelliShop requires original documents tailored to shopping lists, pantry data, food safety, generative AI, price comparison and paid subscriptions.

Do not carry over LUFI-specific companion, emotional-support or crisis-related provisions unless genuinely relevant.

If the original LUFI legal documents are unavailable, record that limitation. Do not invent or claim to have reviewed their wording.

## 3. Required public documents

Prepare:

**A. Privacy Policy**

Cover controller identity, contact details, categories of collected data, purposes, UK GDPR lawful bases, Firebase processing, third-party processors, AI integrations, subscription-related data, international transfers, retention periods, deletion, user rights, security, children and changes to the policy.

**B. Terms & Conditions**

Cover account eligibility, permitted use, account responsibilities, shopping-list and pantry functionality, availability, user-provided content, intellectual property, service limitations, liability, service changes, termination, consumer statutory rights, complaints and governing law.

Do not use broad liability exclusions that conflict with mandatory consumer protection law.

**C. AI Transparency & Safety Policy**

Explain what the AI does, what data is transmitted, the limitations of generated information, the model/provider where confirmed, potential errors, human verification, personal-data processing and applicable controls.

**D. Food, Allergy & Nutrition Disclaimer**

Address inaccurate ingredients, allergen detection limitations, cross-contamination, dietary restrictions, food storage, cooking temperatures, nutrition estimates and the need for users to independently verify safety-critical information.

The disclaimer must supplement, not replace, technical safety protections.

**E. Subscription & Billing Terms**

Document Free, Standard and Premium, the one-time three-generation introductory AI allowance, usage quotas, Apple In-App Purchases, recurring billing, upgrades, downgrades, cancellation, refunds and applicable statutory consumer rights.

Do not present provisional prices or quotas as final until approved.

**F. Pricing & Supermarket Data Disclaimer**

Disclose data sources, price freshness, potential differences between online and in-store prices, delivery charges, availability and geographical limitations.

Do not imply partnerships or reliable real-time price coverage that have not been verified.

**G. Account & Data Deletion Policy**

Explain account deletion, retained records where legally necessary, subscription cancellation implications, backup retention and the process for handling requests.

**H. Acceptable Use Policy**

Cover prohibited misuse, automated abuse, attempts to bypass subscription limits, attacks on the service and abuse of third-party integrations.

Provide a cookie/tracking notice if the actual implementation requires one.

## 4. Compliance assessment

Create an evidence-based compliance matrix covering, as applicable:

- UK GDPR
- Data Protection Act 2018, as amended
- Data (Use and Access) Act 2025
- UK ICO transparency and accountability guidance
- ICO fee registration assessment
- PECR, where relevant
- Consumer Rights Act 2015
- Digital Markets, Competition and Consumers Act 2024
- Consumer Subscription Contracts (Cancellation and Information) Regulations 2026, including commencement and transition rules
- Apple App Review Guidelines
- Apple In-App Purchase requirements
- Apple account deletion requirements
- Apple App Privacy declarations
- AI-related transparency and privacy requirements
- International data transfer requirements
- Additional jurisdiction-specific requirements before expansion outside the UK

For every applicable obligation, identify the authoritative source, legal or platform requirement, implementation location, evidence, status and outstanding action.

Distinguish legal obligations, Apple policies and recommended product practices.

## 5. Data mapping and DPIA screening

Produce a detailed personal-data inventory and data-flow map.

Review data involving:

- Authentication and profiles
- Shopping lists and pantry contents
- Dietary preferences and potential health-related information
- AI prompts and responses
- Recipe favourites
- Purchase history
- Subscription entitlements
- Device identifiers and App Check
- Usage analytics and diagnostics
- Customer support
- Account deletion and backups

Assess whether a Data Protection Impact Assessment is required, particularly in relation to dietary/allergy information and AI processing.

Document all confirmed processors, subprocessors, storage locations and transfer mechanisms.

Do not invent vendor contractual assurances.

## 6. Food safety implementation requirements

Create a technical safety specification linked to the legal disclaimers.

Include:

- Explicit allergy and dietary preference handling
- Structured validation of AI-generated recipe ingredients
- Allergen warnings and uncertainty handling
- No false guarantees that a recipe is allergen-free
- Clear labels for estimated nutritional data
- Food safety guidance and limitations
- Human review before adding ingredients to shopping lists
- Tests for unsafe and contradictory model outputs

These protections must be enforced by the application, not merely described in legal text.

## 7. Subscription and payment compliance

Use Apple In-App Purchase as the iOS subscription payment mechanism.

Ensure that:

- The paywall presents clear subscription conditions.
- Actual Apple product prices are used once configured.
- Users understand recurring charges and relevant usage limits.
- Manage Subscription and Restore Purchases are accessible.
- Account deletion does not misleadingly imply Apple billing is automatically cancelled.
- Refund handling and statutory rights are explained accurately.
- Pricing, cancellation and renewal disclosures comply with applicable UK law.

## 8. User experience implementation

Integrate legal access into:

- Registration
- Onboarding
- Settings / Profile
- Subscription paywall
- AI recipe generation
- Allergy and dietary preference configuration
- Account deletion
- Public support/legal pages
- App Store Connect metadata

Use the approved IntelliShop visual design system.

Provide versioning, effective dates, accessible typography and functional links.

Implement meaningful consent controls where consent is the applicable lawful basis.

Never use pre-ticked consent boxes for optional processing that requires affirmative consent.

Do not treat acceptance of Terms as consent to unrelated data processing.

## 9. Required repository deliverables

Create:

- `docs/legal/PRIVACY_POLICY.md`
- `docs/legal/TERMS_AND_CONDITIONS.md`
- `docs/legal/AI_TRANSPARENCY.md`
- `docs/legal/FOOD_SAFETY_AND_ALLERGENS.md`
- `docs/legal/SUBSCRIPTION_TERMS.md`
- `docs/legal/PRICING_DATA_DISCLAIMER.md`
- `docs/legal/ACCOUNT_DELETION_POLICY.md`
- `docs/legal/ACCEPTABLE_USE.md`
- `docs/compliance/LEGAL_COMPLIANCE_MATRIX.md`
- `docs/compliance/DATA_FLOW_INVENTORY.md`
- `docs/compliance/DPIA_SCREENING.md`
- `docs/compliance/APP_STORE_PRIVACY_MAPPING.md`
- `docs/compliance/LEGAL_IMPLEMENTATION_CHECKLIST.md`

Add a `LEGAL_RELEASE_GATE.md` identifying all blocking issues.

Use explicit placeholders for facts that require owner confirmation. Never invent registered companies, addresses, contact details, DPO appointments or supplier practices.

## 10. Release acceptance criteria

Legal documentation is not complete merely because files exist.

Require:

1. Source-supported drafts.
2. Accurate data-flow mapping.
3. No incorrect claims about implemented security.
4. Functional and accessible public URLs.
5. In-app policy access.
6. Working account deletion.
7. Subscription disclosures matching Apple product configuration.
8. User-facing AI and food safety warnings.
9. Privacy declarations matching the actual shipped code.
10. Compliance checks with documented evidence.

Use PASS / FAIL / BLOCKED / NOT TESTED.

Do not claim legal certification or guaranteed regulatory compliance.

## 11. Workstream sequencing

Create the legal documentation and compliance inventory in parallel with M1 validation.

Schedule engineering implementation for the relevant milestones:

- M2: Privacy architecture, data minimisation and account deletion.
- M3: AI transparency and food-safety safeguards.
- M4: Legal screens and approved visual integration.
- Subscription milestone: Apple billing disclosures and subscription management.
- Release QA: Full legal and App Store compliance gate.

Do not start unrelated implementation or modify `main` without authorisation.

## 12. Next response required

Provide:

1. Legal deliverables inventory.
2. Compliance obligations and official sources.
3. Missing owner information.
4. Recommended public legal-page architecture.
5. Implementation dependencies.
6. Drafting priorities.
7. Legal and App Store release blockers.

Our objective is a commercially viable, legally responsible, secure IntelliShop V2 launch, with complete user-facing legal transparency and no fabricated compliance claims.