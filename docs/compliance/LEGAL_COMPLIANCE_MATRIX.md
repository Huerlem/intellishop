# Legal and Platform Compliance Matrix — IntelliShop V2 (UK launch)

| | |
|---|---|
| Version | 0.2 (draft; corrections from owner review of v0.1) |
| Date | 28 October 2026 |
| Scope | Consumer iOS app distributed through the UK App Store; free and paid (Apple In-App Purchase) tiers; Firebase backend; planned server-side generative AI |
| Code basis | `feature/v2-production-rebuild` at `c836629` |
| Status | **Not legal advice, and not a certification of compliance.** This is an evidence-based self-assessment prepared without external counsel. Items marked *legal review* need a qualified UK lawyer when budget allows. |

**Status values.**
- **PASS**: verified by a check that actually ran, with the evidence named.
- **FAIL**: required, and the current code or documents do not meet it.
- **BLOCKED**: cannot progress without owner input, an external provider or law not yet made.
- **NOT TESTED**: implemented or designed, but not verified.
- **N/A (assessed)**: assessed as not applicable to the UK launch, with reasons given.

**Type.**
- **LAW**: legal obligation.
- **APPLE**: platform policy or contract.
- **REC**: recommended practice, not legally required.

---

## 0. Corrections in v0.2 (owner review of v0.1)

| # | v0.1 statement | Correction | Evidence |
|---|---|---|---|
| C-1 | "A full DPIA is required before AI and dietary features" (single categorical conclusion) | Split: **required** for AI combined with special category data (two WP29 criteria); **precautionary** for AI without it (one criterion, good practice); not required for core lists and pantry | S-38 (accessed 28 Oct 2026) |
| C-2 | Subscription regulations "would come into force on 1 January 2027" | Verified: draft laid 19 Oct 2026, **not yet approved**; DMCCA s.254 still prospective; applies only to contracts entered into on or after commencement; app-store sales do not shift responsibility from the contracting business | S-17, S-18, S-19 |
| C-3 | "Treat the whole preference set as special category" | Context-specific analysis per data type (DP-05). A single explicit-consent flow is kept as a voluntary, stricter safeguard | S-01 Art. 9; S-37 |
| C-4 | Obligation types mixed in some rows | Every row and every document now separates LAW / APPLE / REC. Public documents attribute the AI permission prompt to Apple's rules, not to UK GDPR (lawful basis remains contract) | S-20, S-21 |
| C-5 | Consumer remedies summarised from memory | Verified section by section: CRA ss.42–47, 49/57, 65 | S-43 |

## 1. Source register

"Reviewed" means the page was opened and read in this session (28 October 2026). "Canonical" means an official legislation.gov.uk path cited without being re-read today. "Secondary" means a law-firm or practitioner summary, used only for dates and status and never as the authority for an obligation.

| ID | Source | URL | Kind |
|---|---|---|---|
| S-01 | UK GDPR | https://www.legislation.gov.uk/eur/2016/679/contents | Canonical |
| S-02 | Data Protection Act 2018 | https://www.legislation.gov.uk/ukpga/2018/12/contents | Canonical |
| S-03 | Data (Use and Access) Act 2025 | https://www.legislation.gov.uk/ukpga/2025/18/contents | Canonical |
| S-04 | ICO, *Statement on the commencement of the DUAA* (Feb 2026): most remaining data protection provisions in force 5 Feb 2026; complaints requirement 19 June 2026 | https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2026/02/statement-on-the-commencement-of-the-data-use-and-access-act-duaa | Reviewed |
| S-05 | Wiggin, *Key provisions of the DUAA come into force* (recognised legitimate interests, ADM, PECR statistics and appearance exemptions) | https://www.wiggin.co.uk/insight/key-provisions-of-the-data-use-and-access-act-2025-come-into-force/ | Secondary |
| S-06 | Mayer Brown, *DUAA complaints procedure requirement* (acknowledge within 30 days; electronic form) | https://www.mayerbrown.com/en/insights/publications/2026/02/preparing-for-the-data-use-and-access-act-2025-upcoming-complaints-procedure-requirement | Secondary |
| S-07 | ICO, *Examples of processing likely to result in high risk* (DPIA list) | https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/examples-of-processing-likely-to-result-in-high-risk | Reviewed |
| S-08 | ICO, *Guidance on AI and data protection* | https://www.ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/guidance-on-ai-and-data-protection | Located, **not reviewed in full** |
| S-09 | Wiggin summary of ICO guidance *"Likely to be accessed by children"* | https://www.wiggin.co.uk/insight/the-ico-publishes-final-guidance-on-likely-to-be-accessed-by-children-factors-to-consider-for-uk-age-appropriate-design-code/ | Secondary |
| S-10 | PECR 2003; DSIT *DUAA factsheet: PEC Regulations* | https://www.legislation.gov.uk/uksi/2003/2426/contents ; https://www.gov.uk/government/publications/data-use-and-access-act-2025-factsheets/data-use-and-access-act-factsheet-pec-regulations | Canonical; Reviewed |
| S-11 | ICO data protection fee: £52 / £78 / £3,763 since 17 Feb 2025; £5 direct-debit discount | https://www.lewissilkin.com/insights/2025/02/06/fee-payable-to-the-ico-to-increase-in-february-102jzb9 ; https://www.barcouncilethics.co.uk/wp-content/uploads/2019/11/Data-Protection-Fees-payable-to-the-ICO-July-2026.pdf ; ICO self-assessment: https://ico.org.uk/for-organisations/data-protection-fee/self-assessment/ | Secondary (owner to confirm on the ICO site) |
| S-12 | Consumer Rights Act 2015 | https://www.legislation.gov.uk/ukpga/2015/15/contents | Canonical |
| S-13 | Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, reg. 37 | https://www.legislation.gov.uk/uksi/2013/3134/regulation/37 | Reviewed |
| S-14 | Digital Markets, Competition and Consumers Act 2024 | https://www.legislation.gov.uk/ukpga/2024/13/contents | Canonical |
| S-15 | Draft *Consumer Subscription Contracts (Cancellation and Information) Regulations 2026*: reg. 1(2) in force 1 Jan 2027; reg. 2(2) contracts on or after commencement; reg. 7 digital content; regs. 32–35 exit, reminder and end-of-contract notices | https://www.legislation.gov.uk/ukdsi/2026/9780348287912/pdfs/ukdsi_9780348287912_en.pdf | Reviewed (draft, laid 19 Oct 2026, subject to approval) |
| S-16 | DMCCA status: Wiggin tracker (updated 20 Oct 2026); TLT (21 Oct 2026); Alston & Bird (Oct 2026) | https://www.wiggin.co.uk/insight/digital-markets-competition-and-consumer-act-tracker/ ; https://www.tlt.com/insights-and-events/insight/dmcca-subscriptions-regime-are-you-ready-for-1-january ; https://www.alston.com/en/insights/publications/2026/10/uk-subscription-rules-dmcca | Secondary |
| S-17 | Baker McKenzie, *New UK consumer subscription rules confirmed for January 2027* (22 Oct 2026): regulations still draft and need Parliament's approval; not retrospective; "the business with which the consumer contracts remains responsible" when sold through an app store | https://connectontech.bakermckenzie.com/new-uk-consumer-subscription-rules-confirmed-for-january-2027-what-businesses-need-to-do-now/ | Secondary (reviewed 28 Oct 2026) |
| S-18 | DBT, *Draft Guidance on Consumer Subscription Contracts* (Oct 2026): §4.4 reminders once every 6 months for monthly contracts; §6.2.3 digital content waiver needs express consent + acknowledgement + durable-medium confirmation, not inferred from accepting general terms; §1–2 applies to contracts entered on or after 1 Jan 2027 | https://assets.publishing.service.gov.uk/media/6acf97da2de3184ccf8b814e/subscription-contracts-rules-guidance.pdf | Reviewed 28 Oct 2026 (draft; excerpt truncated after §8.1) |
| S-19 | DMCCA 2024 s.254 (meaning of subscription contract) — shown as **prospective / not in force** (legislation.gov.uk, up to date to 25 Oct 2026) | https://www.legislation.gov.uk/ukpga/2024/13/section/254 | Reviewed 28 Oct 2026 |
| S-20 | Apple, *App Review Guidelines* (§§1.4.1, 2.1, 3.1.1, 3.1.2, 5.1.1, 5.1.2, 5.1.3) | https://developer.apple.com/app-store/review/guidelines/ | Reviewed |
| S-21 | Guideline 5.1.2(i): "You must clearly disclose where personal data will be shared with third parties, including with third-party AI, and obtain explicit permission before doing so." Change reported 13 Nov 2025 | S-20 ; https://techcrunch.com/2025/11/13/apples-new-app-review-guidelines-clamp-down-on-apps-sharing-personal-data-with-third-party-ai | Reviewed (S-20) |
| S-22 | Apple, *Offering account deletion in your app* | https://developer.apple.com/support/offering-account-deletion-in-your-app | Reviewed |
| S-23 | Apple Developer Program License Agreement, Schedule 2 (UK English): §1.1 agent or commissionaire; §1.3 developer as principal; §3.8(b) subscription disclosures; §3.10; §5.4 developer responsible for consumer-law compliance; §6.3 refunds | https://developer.apple.com/support/downloads/terms/schedules/Schedule-2-and-3-English-UK.pdf | Reviewed |
| S-24 | Apple, *App privacy details on the App Store* | https://developer.apple.com/support/app-privacy-on-the-app-store/ | Reviewed |
| S-25 | Expo, *Apple privacy manifest* guide | https://docs.expo.dev/guides/apple-privacy/ | Reviewed |
| S-30 | Firebase, *Privacy and Security in Firebase* (Authentication run only from US data centres; retention; DPF UK Extension) | https://firebase.google.com/support/privacy | Reviewed |
| S-31 | Data Protection (Adequacy) (United States of America) Regulations 2023 (UK–US data bridge) | https://www.legislation.gov.uk/uksi/2023/1028/contents | Canonical |
| S-32 | Anthony Collins, *UK-US transfers safe again — for now* (Latombe dismissed 3 Sep 2025) | https://www.anthonycollins.com/blog/102l35k/uk-us-transfers-safe-again-for-now/ | Secondary |
| S-33 | Anthropic, *API and data retention* | https://platform.claude.com/docs/en/manage-claude/api-and-data-retention | Reviewed |
| S-34 | Anthropic, *Data residency* (`inference_geo`: `us` or `global` only) | https://platform.claude.com/docs/en/manage-claude/data-residency | Reviewed |
| S-35 | RevenueCat, *Data and compliance* (DPA part of standard terms) | https://www.revenuecat.com/docs/welcome/set-up-revenuecat/data-and-compliance | Reviewed |
| S-36 | RevenueCat, *GDPR* (processor; deletion requests by contact) | https://www.revenuecat.com/gdpr | Reviewed |
| S-40 | FSA, *Allergen information for non-prepacked foods* (14 regulated allergens) | https://www.gov.uk/government/publications/allergen-information-for-non-prepacked-foods-best-practice/allergen-information-for-non-prepacked-foods-best-practice | Reviewed |
| S-41 | FSA, *How to chill, freeze and defrost food safely* (fridge 0–5 °C; leftovers within 48 hours) | https://www.gov.uk/government/publications/how-to-chill-freeze-and-defrost-food-safely/how-to-chill-freeze-and-defrost-food-safely | Reviewed |
| S-42 | Winston Taylor, *Chatbots and the UK's Online Safety Act* (24 May 2026) | https://www.winstontaylor.com/insights/chatbots-and-the-uk-s-online-safety-act-to-what-extent-are-they-in-scope | Secondary |
| S-37 | ICO, *What is special category data?* — inferences: special category if the processing "intends to make an inference" or to "treat someone differently on the basis of inferred information" | https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/special-category-data/what-is-special-category-data | Reviewed 28 Oct 2026 |
| S-38 | ICO, *When do we need to do a DPIA?* — Art. 35(3) three mandatory types; ICO list; nine WP29 criteria; "In most cases, a combination of two of these factors indicates the need for a DPIA"; one factor: "good practice" | https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/when-do-we-need-to-do-a-dpia | Reviewed 28 Oct 2026 |
| S-43 | Consumer Rights Act 2015: ss.42–45 digital content remedies; s.46 device damage; s.47 non-excludable (ss.34–37, 41); s.57 services (s.49 reasonable care and skill, price recovery); s.65 negligence causing death or personal injury | https://www.legislation.gov.uk/ukpga/2015/15/part/1/chapter/3/crossheading/what-remedies-are-there-if-statutory-rights-under-a-digital-content-contract-are-not-met ; https://www.legislation.gov.uk/ukpga/2015/15/section/46 ; https://www.legislation.gov.uk/ukpga/2015/15/part/1/chapter/3/crossheading/can-a-trader-contract-out-of-statutory-rights-and-remedies-under-a-digital-content-contract ; https://www.legislation.gov.uk/ukpga/2015/15/part/1/chapter/4/crossheading/can-a-trader-contract-out-of-statutory-rights-and-remedies-under-a-services-contract ; https://www.legislation.gov.uk/ukpga/2015/15/section/65/data.htm | Reviewed 28 Oct 2026 |
| S-44 | FSA, *Cooking your food* (steaming hot; poultry, pork, burgers, sausages, rolled joints cooked through; 70 °C for 2 minutes; reheat once) | https://www.gov.uk/government/publications/cooking-your-food/cooking-your-food | Reviewed 28 Oct 2026 |

**Unavailable reference:** the LUFI legal documents (Privacy Policy, Terms of Service, AI Transparency, Community Guidelines, Trust Manifesto, Crisis Protocol). They are not in the repository, the uploaded files or this project, so their wording has **not** been reviewed. Only the document *structure* listed by the owner is used.

---

## 2. Data protection (UK GDPR, DPA 2018, DUAA 2025)

| ID | Obligation | Type | Source | Requirement (summary) | Implementation location | Evidence | Status | Outstanding action | Milestone |
|---|---|---|---|---|---|---|---|---|---|
| DP-01 | Transparency: privacy information at collection | LAW | S-01 Arts. 12–13 | Concise, intelligible notice at the point of collection, naming the controller, purposes, bases, recipients, transfers, retention and rights | Privacy Policy; registration screen; in-app Settings → Legal | `RegisterScreen.jsx` links call `console.log('Privacy clicked')`. No policy exists. | **FAIL** | Draft `PRIVACY_POLICY.md`; host it; wire the links | Draft now; M4 screens |
| DP-02 | Controller identity and contact details | LAW | S-01 Art. 13(1)(a) | Name and contact details of the controller | Privacy Policy, Terms, App Store metadata | — | **BLOCKED** | Owner: legal name, address, email | Owner |
| DP-03 | Lawful basis per purpose, documented | LAW | S-01 Arts. 5(2), 6 | Identify and record a basis for each purpose | `DATA_FLOW_INVENTORY.md` §2 | Draft bases proposed | **BLOCKED** | Owner review; legal review recommended for D14–D16 | Before policy final |
| DP-04 | Data minimisation | LAW | S-01 Art. 5(1)(c) | Collect only what is necessary | Registration and profile | Phone and full address collected; **postcode mandatory** with no feature using it (`RegisterScreen.jsx` `validateStep2`) | **FAIL** | DF-1: remove the fields; migrate existing data only with approval and a backup | M2 |
| DP-05 | Special category data: Art. 9 condition | LAW | S-01 Arts. 4(15), 9(1), 9(2)(a); S-37 | **Context-specific (corrected in v0.2):** (a) **allergies, intolerances and medical diets** recorded as such are data concerning health, so special category; (b) **religious diets** (halal, kosher) can reveal religious belief: treat as special category as a precaution (*legal review*); (c) **lifestyle diets** (vegetarian, vegan, pescatarian) are ordinary personal data unless processed to infer belief or health (S-37 intention test); (d) a neutral **'ingredients to avoid'** list with no health label and no intention to infer health is likely **not** special category, but this is borderline (*legal review*). Explicit consent is required for (a) and recommended for (b) | Allergy and Dietary screen; `users/{uid}/private/preferences`; consent record | Not built | **FAIL** (gate for M3) | One explicit-consent flow covering all dietary data (stricter than required for (c)); owner decision DPIA-1/2 | M3 |
| DP-06 | Conditions for consent | LAW | S-01 Arts. 4(11), 7 | Freely given; not bundled with Terms; no pre-ticked boxes; as easy to withdraw as to give; records kept | Consent UI; `users/{uid}/consents` | Current checkbox reads "Accept terms and privacy policy" (`TermsCheckbox.tsx`), which bundles acceptance with the privacy notice | **FAIL** | Replace with: Terms acceptance (contract) + privacy notice acknowledgement (information, not consent) + separate optional consents | M2 (registration), M3 (AI/diet) |
| DP-07 | Terms acceptance actually enforced | REC (contract formation) | S-12 Part 2 (transparency) | Users must see and accept Terms before the contract starts | Registration | `termsAccepted` state is **never checked** in `handleRegister`, so an account can be created without ticking it | **FAIL** | Enforce; record the accepted version and timestamp | M2 |
| DP-08 | Right of access and portability | LAW | S-01 Arts. 15, 20 | Provide a copy within one month; machine-readable export for data provided by the user | Settings → Export my data (callable function returns JSON) | Not built | **FAIL** | Implement the export function | M2 |
| DP-09 | Right to rectification | LAW | S-01 Art. 16 | Users can correct data | Profile, lists, pantry editing | Editing exists for profile, lists and pantry (CRUD tests in `__tests__/`) | **NOT TESTED** (logic tested on SDK 53 proxy; no device run) | Device test | M2 |
| DP-10 | Right to erasure; in-app account deletion | LAW + APPLE | S-01 Art. 17; S-20 5.1.1(v); S-22 | Delete account and associated data; tell users what is retained and how long deletion takes | Settings → Delete account; callable function | **No deletion code exists** | **FAIL** | DF-4 | M2 |
| DP-11 | Right to object; restriction | LAW | S-01 Arts. 18, 21 | Handle objections to legitimate-interests processing | Privacy Policy; support process | — | **FAIL** | Describe in policy; handle via the rights-request process | Draft now |
| DP-12 | Automated decision-making (Arts. 22A–22D as inserted by DUAA) | LAW | S-03; S-05 | Safeguards for significant decisions based solely on automated processing | — | AI suggestions are proposals the user accepts or rejects (no silent list mutation); no legal or similarly significant effects | **N/A (assessed)** | Re-assess if AI ever restricts access to a service | — |
| DP-13 | Data protection by design and default | LAW | S-01 Art. 25 | Privacy-protective defaults (optional consents off; minimum fields) | Whole app | Partly: no analytics or ads SDKs (`package.json`); error logs no longer persisted on device (M1) | **FAIL** | DF-1, DF-3, DF-5 | M2 |
| DP-14 | Records of processing | LAW | S-01 Art. 30 | Small organisations are exempt only if processing is occasional and involves no special category data. Neither condition holds here | `DATA_FLOW_INVENTORY.md` (basis for the record) | Draft exists | **NOT TESTED** | Owner confirms; keep updated per release | Ongoing |
| DP-15 | Processor contracts | LAW | S-01 Art. 28; S-30; S-33; S-35 | Written terms with each processor | Firebase DPST acceptance; Anthropic commercial terms and DPA; RevenueCat DPA | Not confirmed | **BLOCKED** | Owner accepts or signs; record versions in DF-8 | Before M3 / subscription |
| DP-16 | Security of processing | LAW | S-01 Art. 32 | Appropriate technical measures | Security Rules; App Check; server-side AI; secrets in Secret Manager | **No `firestore.rules` or `storage.rules` in the repository**; access control unverified. Credentials exposed in V1 history (S1 remediation pending revocation) | **FAIL** | DF-2; revoke C1–C6 (`OWNER_ACTIONS_BEFORE_M2.md` B) | M2; owner now |
| DP-17 | Breach detection and notification (72 hours to the ICO; tell users if high risk) | LAW | S-01 Arts. 33–34 | Procedure and log | `docs/compliance/BREACH_PROCEDURE.md` (to write) | None | **FAIL** | Write the procedure; include the V1 credential exposure in the breach log assessment (owner and legal) | Before beta |
| DP-18 | DPIA | LAW (when triggered) / REC (precautionary) | S-01 Art. 35; S-07; S-38 | **Required** where AI processing (WP29 'innovative technology') is combined with special category data (WP29 'sensitive data'): two criteria (S-38). **Precautionary (good practice)** for AI without dietary data (one criterion). Not required for core lists and pantry (reasons documented) | `DPIA_SCREENING.md` v0.2 | Screening done | **FAIL** (DPIA for AI + dietary not done) | Complete before releasing the AI + dietary combination; recommended before any AI release | Before M3 release |
| DP-19 | DPO | LAW | S-01 Art. 37 | Mandatory only for large-scale regular and systematic monitoring or large-scale special category processing as a core activity | — | Launch scale is small; dietary data is optional | **N/A (assessed, provisional)** | Re-assess at scale; name a privacy contact instead | — |
| DP-20 | International transfers | LAW | S-01 Arts. 44–49; S-31; S-30; S-34 | Adequacy, or an appropriate safeguard (IDTA or Addendum) | `DATA_FLOW_INVENTORY.md` §4 | Firebase Auth runs in the US; AI inference US or global | **BLOCKED** | Confirm the mechanisms in processor terms; record in the policy | Before launch |
| DP-21 | Data protection complaints procedure | LAW | S-02 s.164A (inserted by S-03 s.103), in force 19 June 2026 (S-04); S-06 | Facilitate complaints (e.g. electronic form); acknowledge within 30 days; respond without undue delay | Public support page; in-app Help; support mailbox | None | **FAIL** | Build the complaint route and procedure | Before beta |
| DP-22 | Children | LAW | S-01 Art. 8 (UK age 13); ICO Children's Code; S-09 | If the service is likely to be accessed by children, apply the Code. Self-declaration alone is unlikely to be enough to show children do not use it (S-09) | Terms (eligibility); App Store age rating; likely-to-be-accessed assessment | No assessment | **BLOCKED** | Owner decides the minimum age (recommended **18+** because of paid subscriptions and food-safety risk); document the assessment | Before policy final |
| DP-23 | ICO data protection fee | LAW | Data Protection (Charges and Information) Regulations 2018; S-11 | Controllers processing personal data must pay unless exempt. Tier 1 £52 (£47 by direct debit) per S-11 | Owner registration | Not registered (unknown) | **BLOCKED** | Owner runs the ICO self-assessment and pays; add the registration number to the policy | **Before external TestFlight** |
| DP-24 | Accurate security claims | LAW (Art. 5(1)(a) fairness; DMCCA misleading actions) | S-01; S-14 | Do not claim protections that are not implemented | All public documents | Inventory notes that auth tokens are in AsyncStorage (not Keychain) and that no Security Rules exist yet | **NOT TESTED** | Check every public claim against code at release (gate item 3) | Release QA |

## 3. Privacy and Electronic Communications (PECR)

| ID | Obligation | Type | Source | Requirement | Location | Evidence | Status | Action |
|---|---|---|---|---|---|---|---|---|
| PE-01 | Storage on and access to the device | LAW | S-10 reg. 6 and Schedule A1 (DUAA) | Consent unless an exception applies (strictly necessary; new statistics and appearance exceptions) | App | Only the Firebase auth session (strictly necessary) and removal of legacy keys (`AuthContext.jsx`) | **PASS** (static code review, 28 Oct 2026; no device run) | Re-assess when any SDK is added |
| PE-02 | Public legal website storage | LAW | S-10 | No banner is needed if the site sets no non-essential cookies or analytics | Legal pages host | Not built | **NOT TESTED** | Publish static pages with no cookies or analytics; verify with browser devtools |
| PE-03 | Electronic marketing | LAW | S-10 reg. 22 | Consent or soft opt-in, with an opt-out | — | No marketing email or push planned | **N/A (assessed)** | Re-assess before any marketing |
| PE-04 | Push notifications | APPLE + LAW | S-20 5.1.2(i) (system functionalities such as push must not be required); S-10 reg. 22 for marketing | Not required for functionality; marketing messages only with consent | — | No notification SDK in M1 | **N/A (assessed)** | Re-assess when notifications return (M5+) |

## 4. Consumer law

| ID | Obligation | Type | Source | Requirement | Location | Evidence | Status | Action |
|---|---|---|---|---|---|---|---|---|
| CL-01 | Digital content quality rights | LAW | S-12 ss.34–36, 42–47 | Satisfactory quality, fit for purpose, as described; statutory remedies; liability for damage to the device cannot be excluded | Terms; Subscription Terms | No Terms exist | **FAIL** | Draft Terms without excluding statutory rights | Draft now |
| CL-02 | Unfair terms and transparency | LAW | S-12 Part 2 (ss.62, 65, 68) | Terms must be fair and transparent. Liability for death or personal injury caused by negligence cannot be excluded | Terms; all legal pages | — | **FAIL** | Draft accordingly; avoid blanket exclusions | Draft now |
| CL-03 | Pre-contract information and digital-content cancellation (current law) | LAW | S-13 reg. 37; S-18 §6.2.3 (same mechanism in the new regime) | Supply of digital content in the 14-day period ends the right to cancel **only** with express consent + acknowledgement + confirmation on a durable medium; not inferable from silence, a pre-ticked box or accepting general terms | Pre-purchase screen + confirmation email | Not built | **BLOCKED** (*legal review* + owner decision LS-06) | Apple is agent or commissionaire; the developer is principal and responsible for consumer-law compliance (S-23 §§1.1, 1.3, 5.4). If no valid waiver, a cancellation within 14 days must be honoured, but App Store refunds are decided by Apple: a structural risk to resolve with legal advice |
| CL-04 | Subscription contracts regime | LAW (prospective) | S-14 Part 4 Ch. 2; S-15; S-16; S-17; S-18; S-19 | **Status (verified 28 Oct 2026):** draft regulations laid 19 Oct 2026, **not yet approved** (S-17); s.254 still prospective (S-19); intended to apply to contracts **entered into on or after 1 Jan 2027**, not to earlier contracts or their renewals (S-17, S-18 §1). Duties: key information before commitment; reminder notices on a durable medium (monthly: once every 6 months — S-18 §4.4); 14-day initial and renewal cooling-off; easy exit; end-of-contract notices. Sale through an app store does **not** move responsibility: the business the consumer contracts with remains responsible (S-17); under Apple's Schedule 2 the developer is principal (S-23) | Paywall; Subscription Terms; reminder emails; Settings → Manage subscription | Not built | **BLOCKED** (not yet law; *legal review* of how reminders, cooling-off and refunds work when Apple controls billing and refunds) | LS-05, LS-06: design for compliance from day one if launch is after 1 Jan 2027 |
| CL-05 | Unfair commercial practices | LAW | S-14 Part 4 Ch. 1 (in force 6 April 2025; S-16) | No misleading actions or omissions; banned practices include fake reviews and drip pricing | Paywall, App Store copy, price features, marketing | No marketing yet. Removed V1 fabricated prices (M1) | **NOT TESTED** | Copy review at the release gate. No invented reviews or testimonials; show the full price; no false urgency |
| CL-06 | Price comparison claims | LAW | S-14 (misleading actions); S-12 | Do not imply live, complete or verified prices that are not available | Pricing features; `PRICING_DATA_DISCLAIMER.md` | Decision D8: no live-price advertising until a provider is licensed | **NOT TESTED** | Draft the disclaimer; label user-entered prices as such |
| CL-07 | Trader identity and geographic address | LAW | S-13 Sch. 2; Electronic Commerce (EC Directive) Regulations 2002 reg. 6 (canonical, not re-read) | Name, geographic address and email for the service provider | Terms; support page | — | **BLOCKED** | Owner: an address that can be published (a service address is possible) |
| CL-08 | Governing law and consumer jurisdiction | LAW | S-12 | Consumers keep the protection of the law where they live (Scotland and Northern Ireland) | Terms | — | **BLOCKED** | Owner confirms England and Wales as the governing law |

## 5. Apple platform requirements

| ID | Requirement | Type | Source | Location | Evidence | Status | Action | Milestone |
|---|---|---|---|---|---|---|---|---|
| AP-01 | Privacy policy link in App Store Connect **and** in the app | APPLE | S-20 5.1.1(i) | ASC metadata; Settings → Legal; registration | Dead links | **FAIL** | Host the policy; wire the links | M4 (links), draft now |
| AP-02 | Policy content: what is collected, how, all uses; third parties give equal protection; retention and deletion; how to revoke consent | APPLE | S-20 5.1.1(i) | Privacy Policy | — | **FAIL** | Cover these in the draft | Draft now |
| AP-03 | Consent and withdrawal; paid functionality not dependent on granting data access | APPLE | S-20 5.1.1(ii) | AI and diet consent; paywall | — | **FAIL** (gate M3) | Premium must work without dietary consent (recipes simply ignore allergies, with a warning) | M3 |
| AP-04 | Data minimisation; use the out-of-process picker | APPLE | S-20 5.1.1(iii) | Profile photo | `ProfileScreen.jsx` calls `requestMediaLibraryPermissionsAsync()` **before** opening the picker, so it asks for photo-library access the system picker does not need | **FAIL** | Remove the permission request; check Expo SDK 58 picker behaviour on device | M2 |
| AP-05 | In-app account deletion; tell users how long it takes; billing-through-Apple notice and Manage Subscriptions link | APPLE | S-20 5.1.1(v); S-22 | Settings → Delete account | Not built | **FAIL** | DF-4, plus: "billing will continue through Apple — cancel first" with `showManageSubscriptions` | M2 (+ subscription notice at the subscription milestone) |
| AP-06 | No personal information required unless relevant to core functionality | APPLE | S-20 5.1.1(v) | Registration | Mandatory postcode | **FAIL** | DF-1 | M2 |
| AP-07 | Explicit permission before sharing personal data with third-party AI | APPLE | S-21 | Pre-generation disclosure and consent sheet; Settings toggle | Not built | **FAIL** (gate M3) | A just-in-time sheet naming the provider and the data sent; recorded consent; revocable | M3 |
| AP-08 | Health data: no use for advertising or data mining; not stored in iCloud | APPLE | S-20 5.1.3(i)–(ii) | Allergy data | HealthKit not used; Firebase storage | **NOT TESTED** | Keep allergy data out of any analytics; document | M3 |
| AP-09 | Health and medical accuracy claims | APPLE | S-20 1.4.1 | Recipe and nutrition screens | — | **NOT TESTED** | No medical claims; "estimated" labels; advise checking with a doctor or dietitian for medical diets | M3 |
| AP-10 | In-App Purchase for digital features | APPLE | S-20 3.1.1 | Paywall | Planned (RevenueCat + StoreKit) | **NOT TESTED** | Subscription milestone | Sub |
| AP-11 | Restore purchases mechanism | APPLE | S-20 3.1.1 | Paywall and Settings | — | **FAIL** | Add Restore Purchases | Sub |
| AP-12 | Subscription value, period of at least 7 days, works across devices | APPLE | S-20 3.1.2(a) | Plans | Monthly plans planned (D9) | **NOT TESTED** | — | Sub |
| AP-13 | Before subscribing: clearly describe what users get; title, length, price (and price per unit); Terms and Privacy links in the app | APPLE | S-20 3.1.2(c); S-23 §3.8(b) | Paywall | — | **FAIL** | Paywall spec in `SUBSCRIPTION_TERMS.md` (to draft) | Sub |
| AP-14 | Prices shown from StoreKit product data, not hard-coded | APPLE + LAW | S-23 §3.8(b); S-14 | Paywall | Prices provisional (D1) | **BLOCKED** | Configure products in ASC; read localised prices at runtime | Sub |
| AP-15 | App Privacy details accurate (including SDK practices) | APPLE | S-24 | ASC | `APP_STORE_PRIVACY_MAPPING.md` | **NOT TESTED** | Re-derive from the shipped build | Release QA |
| AP-16 | Privacy manifest and required-reason APIs | APPLE | S-25 | EAS build output (`PrivacyInfo.xcprivacy`) | No iOS build yet | **NOT TESTED** | Inspect the generated manifest on the first EAS build; add reasons in `app.config.ts` `ios.privacyManifests` | First EAS build |
| AP-17 | Purpose strings | APPLE | S-20 5.1.1(ii) | `app.config.ts` | Photo string present: "IntelliShop uses your photo library only when you choose a new profile picture." Camera and microphone disabled | **NOT TESTED** | Remove if AP-04 makes it unnecessary | M2 |
| AP-18 | Review access (demo account) and complete metadata | APPLE | S-20 2.1 | ASC review notes | — | **BLOCKED** | Reviewer account with seeded data; sandbox purchase notes | Release |
| AP-19 | Developer responsible for consumer-law compliance of subscriptions | APPLE (contract) | S-23 §§3.10, 5.4 | Subscription terms and UX | — | **BLOCKED** (*legal review*) | See CL-03, CL-04 | Sub |
| AP-20 | Seller name shown on the App Store | APPLE | Apple Developer Program enrolment | ASC | — | **BLOCKED** | Owner: individual enrolment shows the personal legal name; an organisation requires a legal entity and D-U-N-S number. Decide before enrolment | Owner |

## 6. AI-specific

| ID | Obligation | Type | Source | Requirement | Location | Status | Action |
|---|---|---|---|---|---|---|---|
| AI-01 | Transparency about AI processing | LAW + APPLE | S-01 Arts. 13–14; S-08; S-21 | Explain what the AI does, what data is sent, to whom, retention, limitations | `AI_TRANSPARENCY.md`; consent sheet | **FAIL** (not drafted) | Draft; name the provider only once contracted |
| AI-02 | Accuracy and human review | LAW (Art. 5(1)(d) accuracy) + REC | S-01; S-08 | Outputs may be wrong; the user reviews before any list change | Optimisation Review (accept or reject); recipe → list confirmation | **NOT TESTED** | M3 tests (see checklist) |
| AI-03 | No fabricated facts (prices, stock, nutrition, availability) | REC + LAW (misleading) | Project requirement; S-14 | Schema rejects price and availability fields from the model; availability computed by the server | `AI_ARCHITECTURE.md` §§7–8 | **NOT TESTED** | M3 validation tests |
| AI-04 | Provider terms: training use, retention, location | LAW (Arts. 28, 44) | S-33; S-34 | Confirm in the contract | Processor register | **BLOCKED** | Owner signs up; legal review of DPA |
| AI-05 | Minimise data sent to the provider | LAW | S-01 Art. 5(1)(c) | No name, email or user ID; pseudonymous request ID; bounded ingredients | `AI_ARCHITECTURE.md` §5 | **NOT TESTED** | Unit test on the request builder |
| AI-06 | Online Safety Act | LAW | S-42 | U2U and search services are in scope. A single-user generator with no sharing or web search appears out of scope | — | **N/A (assessed, provisional)** | **Re-assess before adding shared household lists or recipe sharing** (that would be user-to-user content) |

## 7. Food safety

| ID | Obligation | Type | Source | Requirement | Location | Status | Action |
|---|---|---|---|---|---|---|---|
| FS-01 | Allergen taxonomy | REC | S-40 | Use the 14 UK regulated allergens as the structured list | Allergy settings; recipe validation | **FAIL** (not built) | M3 |
| FS-02 | Storage and leftovers guidance | REC | S-41 | Any storage advice must follow FSA guidance or be omitted | Recipe "Storage" field | **FAIL** (not built) | Restrict to vetted fixed text; do not let the model invent temperatures |
| FS-03 | No guarantee of allergen-free | LAW (misleading; negligence risk) + REC | S-14; S-12 s.65 | Never label a recipe "allergen-free" or "safe for X" | Recipe UI; AI schema | **FAIL** (not built) | Enforce in code and tests |
| FS-04 | Food business law | — | Food Information Regulations 2014 (not re-read) | Applies to food business operators. IntelliShop sells no food | — | **N/A (assessed, provisional)** | *Legal review* |

## 8. Accessibility (public pages and legal screens)

| ID | Obligation | Type | Source | Requirement | Status | Action |
|---|---|---|---|---|---|---|
| AX-01 | Accessible legal pages | LAW (Equality Act 2010 reasonable adjustments, canonical) + REC (WCAG 2.2 AA) | — | Readable, screen-reader friendly, Dynamic Type in app | **FAIL** (not built) | M4: native screens using the approved typography tokens; web pages pass an automated WCAG check plus a manual VoiceOver pass |

## 9. Before expanding beyond the UK

| ID | Area | Notes | Status |
|---|---|---|---|
| EX-01 | EU / EEA | EU GDPR; an Art. 27 EU representative if no EU establishment; EU consumer law (14-day withdrawal, digital content); EU AI Act transparency duties for AI-generated content (verify the application dates at the time) | **N/A for UK launch** — required before an EU storefront |
| EX-02 | United States | State privacy laws; COPPA if children; auto-renewal laws (state "click to cancel" rules) | **N/A for UK launch** |
| EX-03 | Other storefronts | Local privacy and consumer law; App Store price tiers and taxes | **N/A for UK launch** |

**Recommended:** limit App Store availability to the **United Kingdom** storefront until these are assessed.
