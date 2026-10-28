# Figma V2 → Code Implementation Matrix

Figma file: `VZj2AU8kOJqYvyjp8AvWQa` (IntelliShop — Product Redesign 2026) · Code baseline: `main` @ `0e26321` · Audited 2026-10-27
Method: Figma read via the Figma MCP (plugin API, **read-only**; no edits made to the file) and static inspection of the repository. Figma frame exports to disk were **BLOCKED** (environment proxy returned HTTP 403 for `figma.com` asset URLs); screens were inspected inline instead.

> **Update 2026-10-28 (Package C):** sections 2–8 below are the **baseline audit of V1** and are kept for history. The current implementation status is **§10**, which supersedes the "Existing code" and "Classification" columns above.

Classification: **Compliant** = implemented and compliant · **Modify** = implemented but requiring modification · **Missing** · **Clarify** = design clarification required.

## 1. Sources verified

| Figma page | What was verified | Result |
|---|---|---|
| 03 — Product Reframing + IA | Product decisions A–D, approved 18 Aug 2026; non-goals | AI contextual (no tab); Recipes contextual from Pantry; collect only essential data at sign-up; never hide uncertainty |
| 12 — Final Tokens V2 | Variable collection "IntelliShop V2 — Foundations", 1 mode, 41 variables (23 colour, 18 number); 10 text styles; 1 effect style | Matches handoff counts; values in §2 |
| 13 — Component System V2 | 14 component sets and all variant names | §4 |
| 19 — Prototype V2 | 10 frames (390×812), 27 navigation reactions, 1 flow start | §3 |
| 20 — Prototype QA | Navigation QA passed; list of intentionally static controls | §5 |
| 21 — Device Adaptation QA | 440×956, 402×874, 393×852 all PASS on 8 checkpoints | Responsive rule: flex layout + safe areas, no per-device screens |
| 22 — Prototype V2 — 440×956 | Canonical 10 frames at 440×956, 27 reactions, 2 flow starts | Canonical reference for implementation |
| 23 — Final Design Handoff | Status "Product/UX/UI complete · Implementation not started"; system summary | §2 notes |

Not re-inspected in this pass: 07 Low-Fidelity Approval, 09 Visual Foundations V2, 15/17 High-Fidelity slices (Prototype QA states pages 15 and 17 are the clean sources for page 19/22). They are consistent with page 23's summary; a frame-level pass will be done per screen during implementation.

## 2. Design tokens (exact Figma values)

### 2.1 Colour (23)

| Token | Value | Token | Value |
|---|---|---|---|
| color/action/primary | #4338CA | color/status/success | #15803D |
| color/action/pressed | #3730A3 | color/status/success/subtle | #ECFDF5 |
| color/action/subtle | #EEF2FF | color/status/warning | #B45309 |
| color/intelligence/base | #0891B2 | color/status/warning/subtle | #FFFBEB |
| color/intelligence/subtle | #ECFEFF | color/status/error | #B91C1C |
| color/brand/accent | #7C3AED | color/status/error/subtle | #FEF2F2 |
| color/brand/subtle | #F5F3FF | color/status/error/pressed | #991B1B |
| color/content/primary | #0F172A | color/status/information | #2563EB |
| color/content/secondary | #475569 | color/status/information/subtle | #EFF6FF |
| color/content/muted | #64748B | color/surface/canvas | #F8FAFC |
| color/content/subtle | #F1F5F9 | color/surface/card | #FFFFFF |
| color/border/default | #CBD5E1 | | |

The 17 colours in `design-handoff/tokens_and_provenance.json` all match. The JSON omits 6 Figma tokens (`content/subtle`, four `status/*/subtle`, `status/error/pressed`); the code token map will include all 23.

### 2.2 Number (18)

spacing 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 — radius xs 4 · md 8 · lg 12 · full 999 — border/width default 1 · focus 2 — icon/size default 20 · large 24 — touch/min 44 · touch/shopping-row 56.

### 2.3 Typography (10 text styles, Inter, letter-spacing 0)

| Style | Weight | Size / line height |
|---|---|---|
| Display | Bold | 32 / 40 |
| H1 | Bold | 28 / 34 |
| H2 | Bold | 22 / 28 |
| H3 | Semi Bold | 18 / 24 |
| Body | Regular | 16 / 24 |
| Body Small | Regular | 14 / 20 |
| Label | Semi Bold | 14 / 20 |
| Caption | Medium | 12 / 16 |
| Button | Semi Bold | 15 / 20 |
| Data Large | Bold | 24 / 30 |

### 2.4 Elevation (1)
`Elevation/Overlay`: drop shadow, y 4, blur 16, spread 0, `#0F172A` at 12% — temporary/overlay surfaces only.

### 2.5 Token compliance of current code

| Check | Evidence | Status |
|---|---|---|
| Approved colour tokens used | 0 occurrences of #4338CA, #0891B2, #7C3AED, #0F172A, #F8FAFC in source; 83 distinct hard-coded hex values; most frequent `#4B0082` (110×) | FAIL |
| Typeface | Code loads Poppins (44 references); Figma specifies Inter throughout | FAIL |
| Spacing/radius tokens | No token module; values hard-coded per StyleSheet | FAIL |
| Dynamic Type | No `allowFontScaling={false}` found (good); fixed sizes, 15 occurrences of font size < 12 | NOT TESTED on device |
| Screen-reader labels | 6 `accessibilityLabel` occurrences in the whole app | FAIL |
| Dark mode | Figma defines one mode only; `app.json` forces light | Consistent — dark mode out of scope |

### 2.6 Token discrepancies needing a decision — Clarify

| # | Discrepancy | Proposed resolution |
|---|---|---|
| T1 | Page 23 text says focus ring is **1.5 px**; variable `border/width/focus` = **2** | Implement the variable (2 px); designer to confirm |
| T2 | All 41 variables use scope `ALL_SCOPES` and have no code syntax | No impact on code; optional Figma clean-up |
| T3 | `design-handoff/tokens_and_provenance.json` lists 17 of 23 colours | Code token map generated from Figma values (§2.1) |

## 3. Screens — approved scope (10 screens, canonical 440×956)

| ID | Figma frame (p.22) | Existing code | Classification | Gap summary |
|---|---|---|---|---|
| P01 | Home `136:3` — greeting + avatar, Resume Shopping (progress), active list card, Today's Signals, Create new list, bottom nav | `app/(auth)/HomeScreen.jsx` | **Modify** | No tab bar mounted; AI greeting from broken `AIContext`; no Resume Shopping state (no shopping-trip model); signals must come from pantry data; avatar → Profile |
| P02 | List Detail `136:55` — summary card (items, estimate, budget, "in your Pantry", estimate caveat), Optimise List, Start Shopping, items with Confirmed/Estimated badges | `app/(auth)/Shopping_list.jsx`, `components/shopping/ShoppingListCard.jsx`, `ShoppingListItem.jsx` | **Modify** | Add budget/estimate card with provenance badges; Optimise and Start Shopping entry points; per-item writes instead of whole-array overwrite |
| P03 | Add Items `136:137` — search, Scan, Recent & Frequent with signals, results with "Already in Pantry"/"Already on list", custom item | `components/shopping/AddItemForm.jsx` | **Modify** | Search over history + pantry; duplicate signals; Scan is out of approved scope (static in prototype) |
| P04 | Optimisation Review `136:185` — Remove/Swap/Add cards with reason, accept/reject per item, Apply Changes, Keep Original List, undo note | `SmartShoppingListScreen.jsx` generates a new AI list with AI-invented prices and writes it directly | **Missing** | Build on `Recommendation Card` component and server AI (shared with recipes). Swap/savings copy requires real price data — see Clarify C3 |
| P05 | Recommended Store `136:249` — store, basket total, savings, availability, freshness + confidence, Why This Store, items available | none (V1 `Price-Comparison.jsx` is item-level and fabricated) | **Missing + Clarify** | Requires a licensed basket price source; no-data state not designed (C3) |
| P06 | Compare Stores `136:305` — basket totals per store, coverage, Select | `app/(auth)/Price-Comparison.jsx`, `components/PriceComparison/StoreComparison.jsx`, `ProductPriceCard.jsx` | **Missing + Clarify** | V1 data is generated by Gemini and `Math.random`; UI is item-level. Not reusable as-is |
| P07 | Shopping Mode `136:346` — progress, aisle/category rows, Substitute/Unavailable/Qty, Finish Shopping | none (list checkboxes only) | **Missing** | New trip model (`trips/{tripId}`), offline-first; aisle data not available from any source — show category only unless a source exists (C4) |
| P08 | Finish Shopping `136:397` — summary (purchased/substituted/unavailable), estimated vs actual total (entered at checkout), Needs Your Attention | none | **Missing** | Actual total is user-entered |
| P09 | Pantry Update `136:425` — Updated Automatically (high confidence) vs Needs Review | logic only: `StockContext.addListItemsToStock`, `toggleAddToStock` | **Missing** | Auto-updates must be additive and undoable; ambiguous items go to Review (no silent destructive changes) |
| P10 | Pantry `136:470` — search, Running Low, Use Soon, Recently Added, Use What I Have → Browse Recipes, All Items | `app/(auth)/StockScreen.jsx`, `components/stock/StockItemCard.jsx`, `LowStockAlert.js`, `AddStockItemForm.js` | **Modify** | Expiry and min-quantity fields exist; add Recently Added, sectioned layout, Use What I Have entry into recipes |
| Nav | Bottom Nav component, 3 destinations | `components/navigation/TabBar.jsx` (5 tabs, not mounted anywhere) | **Modify** | Rebuild as Expo Router `Tabs` with exactly Home / Lists / Pantry |

## 4. Components (14 families from page 13)

| Figma component set | Variants | Existing code | Classification |
|---|---|---|---|
| Button | Primary/Secondary/Tertiary/Destructive × Default/Pressed/Focused/Disabled/Loading (20) | `components/ui/Button.jsx` (primary/secondary/outline/ghost, loading, disabled) | Modify — map variants, add Destructive, focus state, tokens |
| Input | Input/Search × Default/Focused/Error/Disabled (8) | `components/ui/Input.jsx` (label, error) | Modify |
| Bottom Nav | Active = Home/Lists/Pantry | `components/navigation/TabBar.jsx` | Modify |
| List Item | Default/Checked/Quantity/Disabled/Badge | `components/shopping/ShoppingListItem.jsx` | Modify |
| Badge | Success/Warning/Neutral/Info/Rationale | none | Missing |
| Alert | Info/Warning/Success/Error | none (`LowStockAlert.js` is domain-specific) | Missing |
| Progress | InProgress/Complete | none | Missing |
| Avatar | Default/Notification | none | Missing |
| Shopping Mode Item | Pending/Collected/Exception | none | Missing |
| Recommendation Card | Remove/Swap/Add/Suggestion × Default/Accepted/Rejected (12) | `components/shopping/SmartShoppingItem.jsx` (different concept) | Missing |
| Info Card | Default/WithIcon | `components/ui/Card.jsx` | Modify |
| Store Decision | Default/Stale | none | Missing |
| Store Comparison | Default/Selected | `components/PriceComparison/StoreComparison.jsx` | Missing (data model incompatible) |
| Pantry Item | RunningLow/UseSoon/RecentlyAdded/Full/Out | `components/stock/StockItemCard.jsx` | Modify |

Reusable beyond the 14 families: `components/common/ConfirmModal.jsx` (restyle), `components/recipes/RecipeCard.jsx`, `RecipeFilters.jsx`, `SelectListModal.jsx` (restyle; used by the recipe flow).

## 5. Flows and prototype interactions

| Flow (page 19/22) | Code today | Status |
|---|---|---|
| P01 → active list → P02 | Home pushes `/(auth)/Shopping_list` | Modify |
| P02 → P03 / P04 / P05 | P03 partial; P04, P05 missing | Missing |
| P01 Resume Shopping → P07 | No trip state | Missing |
| P05 → P06 → P07; P05 → P07 | Missing | Missing |
| P07 → P08 → P09 → P10 | Missing | Missing |
| Permanent nav Home ↔ Lists ↔ Pantry | No tab navigator; Home links to 6 stack screens | FAIL |
| Back/close recovery (P02→P01, P03→P02, P04→P02, P05→P02, P06→P05, P07 close→P02) | n/a | Missing |

**Broken routes in current code** (static evidence): `/(tabs)` and `/tabs/explore` (no such routes; reached from `app/(auth)/index.jsx` and `app/(public)/Index.jsx`), `/(auth)/RecipeSuggestions`, `/(auth)/SupermarketListDetail`, `/stock/{id}`, `navigation.navigate('Home')` in `not-found.jsx`. `FavoriteRecipes.jsx` is unreachable (no route points to it).

## 6. Outside the approved 10-screen scope — Clarify

Page 20 marks these as intentionally static ("not designed/approved"). They are needed for a shippable app, so each needs a design decision. Proposed default: build with V2 tokens and components, following existing V2 patterns, and submit screenshots for approval before release.

| # | Needed screen / state | V1 code | Why needed | Proposed handling |
|---|---|---|---|---|
| C1 | Welcome, Sign in, Register, Forgot password | `app/(public)/*` | App entry | Restyle; reduce Register to name/email/password per page 03 ("collect only essential data") — V1 also asks phone, street, city, postcode, country |
| C2 | Profile & Settings (via avatar): account, dietary/allergy preferences + consent, notifications, privacy policy, data export, **account deletion**, sign out | `app/(auth)/ProfileScreen.jsx` (no deletion, no export) | App Store account-deletion requirement, UK GDPR | Design needed; Vesper to propose using Info Card / List Item / Button Destructive |
| C3 | Recommended Store / Compare Stores **without licensed price data** | — | No verified multi-retailer UK price source yet (Phase 6) | Honest state: "Store prices aren't available yet" + user-entered prices; savings/"High confidence" copy hidden unless backed by data |
| C4 | Shopping Mode aisle labels | — | No aisle data source | Group by category; show aisle only if user-provided |
| C5 | Recipes ("Use What I Have" → results → detail, favourites, missing-ingredient review sheet) | `RecipeSuggestionScreen.jsx`, `recipe/[id].jsx`, `FavoriteRecipes.jsx` | Mandatory AI recipe requirement | Design needed for mode selector (Pantry / List / Both), results, detail, review sheet |
| C6 | Create List, Rename/Delete list, All lists | parts in `Shopping_list.jsx` | Core list management | Design needed (Lists tab root) |
| C7 | Pantry All Items, add/edit item with expiry, Pantry Review detail | `AddStockItemForm.js` | Manual corrections | Design needed |
| C8 | Shopping Mode exception detail (Substitute / Unavailable / Qty) | — | P07 interactions | Design needed |
| C9 | Empty, loading, offline, error states per screen | partial | Handoff marks them mandatory | Use Alert + Info Card patterns |
| C10 | Scan (barcode) | none | Out of approved scope | Deferred; not in V2.0 |
| C11 | Lists tab root vs P02 | — | Prototype links Lists tab directly to P02 (single list) | Lists tab root = all lists; P02 = detail |

## 7. V1 screens with no V2 destination

| V1 file | Decision |
|---|---|
| `app/(auth)/SupermarketListsScreen.jsx` + `hooks/useSupermarketLists.js` (device-local lists per retailer) | Remove — conflicts with V2 IA |
| `app/(auth)/SmartShoppingListScreen.jsx` | Replace by P04 Optimisation Review |
| `app/(auth)/Price-Comparison.jsx` | Replace by P05/P06 once a data source exists |
| `services/geminiService.js` (a misplaced screen copy) | Remove |
| `App.js`, `index.js` (unused; entry is `expo-router/entry`) | Remove |

## 8. Monetisation additions (new requirement, 2026-10-27) — all **Missing + Clarify**

None of these exist in Figma V2 or in code. They must extend the approved Indigo/Cyan/Violet system and existing components, keep Home | Lists | Pantry as the only tabs, and be designed and approved before implementation.

| # | Screen / state | Entry points | Built from components | Notes |
|---|---|---|---|---|
| M1 | Plan selection / paywall (Standard vs Premium, monthly) | Upgrade prompts, Settings | Info Card, Badge (Rationale), Button Primary/Secondary | Apple-localised price and period; billed amount most prominent; Restore Purchases; Privacy Policy + Terms (EULA) links; annual toggle later |
| M2 | Feature comparison (Free / Standard / Premium) | Paywall "Compare plans" | List Item, Badge | Price comparison row shown only when a licensed provider is live |
| M3 | Free AI credit counter | Recipe entry point (Pantry "Use What I Have"), recipe results | Badge (Info), Caption | "2 of 3 free AI recipes remaining" |
| M4 | Trial-exhausted upgrade prompt | After 3rd successful generation; on next attempt | Alert (Info), Button | Contextual; saved recipes remain reachable |
| M5 | Premium-locked states | Optimise List (P02/P04), Compare Stores (P05/P06), substitutions | Recommendation Card disabled + lock, Info Card | Explains what Premium adds; no dead ends |
| M6 | Free capacity limit reached | Create list (3rd), add item (21st), add pantry item (31st) | Alert (Warning) | Data never hidden; offers archive/delete or upgrade |
| M7 | Subscription status in Settings | Profile via avatar | List Item, Badge (Success/Warning) | Plan, renewal/expiry date, billing issue state, AI usage this month |
| M8 | Restore Purchases | Settings, paywall | Button Tertiary + result Alert | Success / nothing to restore / error |
| M9 | Manage Subscription | Settings | Button Secondary | Opens Apple subscription management |
| M10 | Purchase confirming / failed / pending | After purchase | Progress, Alert | "Confirming your purchase…" until server entitlement is written |
| M11 | Account deletion with active subscription warning | Settings → Delete account | Alert (Error), Button Destructive | Explains that Apple subscriptions must be cancelled separately |
| M12 | First-recipe onboarding (no stored ingredients) | Recipe entry with empty Pantry and no list | Input Search, List Item, Button | Saves real Pantry items, then generates |

## 9. Visual direction (concept 07/08)

The concept boards are inspiration for food imagery and icon friendliness only (README priority 3). They are **not** applied in this matrix. A separate comparison/migration proposal (green/cream reskin vs approved indigo/cyan/violet) is a later deliverable and will not be presented as approved. Current instruction: implement the approved indigo/cyan/violet system. Note the concept screens show live-looking retailer prices and logos (Tesco, Sainsbury's, ASDA, Morrisons, Ocado); these must not appear in the product without licensed data and trademark clearance.


## 10. Implementation status after Package C (branch `feature/v2-production-rebuild`, 2026-10-28)

Evidence: source in `src/ui`, `src/screens`, `src/features`, `app/`; automated tests in `__tests__/ui`; react-native-web proxy renders in `docs/validation/ui-preview/` (see its README — not iOS screenshots). **No iOS simulator or device run has been possible in this environment**, so every row is at most "Implemented" — visual and interaction acceptance on iOS is **NOT TESTED**.

Classification here: **Compliant** = implemented following the Figma spec with no known deviation · **Modify** = implemented with a documented deviation or open item · **Missing** · **Clarify** = needs a design or owner decision.

### 10.1 Screens

| ID | Screen | Code | Status | Notes / deviations |
|---|---|---|---|---|
| P01 | Home `136:3` | `src/screens/HomeScreen.tsx` | Compliant | Greeting + avatar → Profile; Resume Shopping card with progress from the active trip; active list card; Today's Signals derived only from the user's Pantry; Create new list. Extra: "Pantry update waiting" card for finished trips with undecided items (supports P09 "handle later") |
| P02 | List Detail `136:55` | `src/screens/ListDetailScreen.tsx` | Modify | Estimate uses only prices the user typed (badge "Your price £x", caption explains); "N items already in your Pantry". **Budget line not shown**: no budget field exists in the data model yet (owner decision UI-B1). Figma "Confirmed/Estimated" price badges replaced by "Your price" (no price source — D8) |
| P03 | Add Items `136:137` | `src/screens/AddItemsScreen.tsx` | Modify | Search, "From your Pantry" suggestions (run out / running low) with rationale badges, results with "Already in Pantry" / "Already on list", custom item; duplicates merge quantities. **Scan omitted** (C10, out of scope). "Recent & Frequent" needs purchase history (Standard+ feature, not built) — suggestions come from the Pantry instead |
| P04 | Optimisation Review `136:185` | `src/screens/OptimiseScreen.tsx` | Missing (honest placeholder) | Server optimisation endpoint not built; screen says so, changes nothing and does not sell the feature. Recommendation Card component not built |
| P05 | Recommended Store `136:249` | — | Missing + Clarify (C3) | Requires a licensed multi-retailer price source (none verified). Not reachable from the UI |
| P06 | Compare Stores `136:305` | — | Missing + Clarify (C3) | As P05 |
| P07 | Shopping Mode `136:346` | `src/screens/ShoppingModeScreen.tsx` | Modify | Full-screen modal (not a tab); progress; items grouped by **category** (no aisle data — C4); tap to collect, long-press or VoiceOver action for Substitute / Unavailable / Qty; Finish Shopping. Header shows the list name (no store is chosen without P05). Cancel trip in "•••" |
| P08 | Finish Shopping `136:397` | `src/screens/FinishShoppingScreen.tsx` | Compliant | Purchased / Substituted / Unavailable, estimate from user prices, optional actual total entered at checkout, Needs Your Attention for unmarked items |
| P09 | Pantry Update `136:425` | `src/screens/PantryUpdateScreen.tsx` | Compliant | High-confidence matches applied automatically (additive only), each recorded on the trip and undoable; ambiguous items in Needs Review with Add to existing / Add as new / Don't add; nothing silently discarded |
| P10 | Pantry `136:470` | `src/screens/PantryScreen.tsx` | Modify | Search, Running Low, Use Soon, Recently Added, Use What I Have → Browse Recipes, All Items. Added **"Past Their Date"** section above Running Low when items are past their date (never hidden — clarification C7-a) |
| C1 | Welcome / Sign in / Register / Reset | `src/screens/auth/AuthScreens.tsx` | Modify | Rebuilt with V2 components. Register collects **name, email, password** + explicit Terms checkbox; Privacy Policy readable before sign-up. Uses the existing `logo-100.png` (V1 asset) — brand asset needs owner approval (UI-B2) |
| C2 | Profile & Settings | `src/screens/ProfileScreen.tsx` (+ AI consent, Allergies & diets, Delete account, Plans) | Clarify | No Figma design exists; built only from approved components. Needs design review |
| C3 | Store screens without data | — | Clarify | See P05/P06 |
| C5 | Recipes | `src/screens/RecipesScreen.tsx`, `src/features/recipes/RecipeCard.tsx` | Clarify | Mode (Pantry / list / both), servings, preferences toggle, server generation with typed errors, saved recipes, "Add missing to list" with user selection. No Figma design |
| C6 | Lists tab root, create/rename/archive/delete | `src/screens/ListsScreen.tsx`, `src/features/lists/ListSheets.tsx` | Clarify | Built from components; bottom sheets use the Elevation/Overlay token |
| C7 | Pantry All Items, add/edit with expiry | `src/screens/PantryAllScreen.tsx`, `src/features/pantry/PantryItemEditor.tsx` | Clarify | Explicit "Use by" vs "Best before" with explanatory text; quick dates + DD/MM/YYYY entry (no native date picker installed) |
| C8 | Shopping Mode exception detail | sheets in `ShoppingModeScreen.tsx` | Clarify | Substitute name / quantity bought |
| C9 | Empty, loading, error, offline | `src/ui/states.tsx`, `src/features/DataStatusBanner.tsx` | Modify | All data screens. Offline copy is honest about the JS SDK memory cache (queued changes survive only while the app is open) |
| C10 | Scan | — | Deferred | Out of approved scope |
| — | Legal documents in app | `src/screens/LegalDocumentScreen.tsx`, `src/components/legal/LegalMarkdown.tsx` | Implemented | Same Markdown and parser as the website; drafts carry a "Draft — not yet in force" banner |
| — | Terms re-acceptance | `TermsUpdateScreen` + guard in `app/(app)/_layout.tsx` | Implemented | Users without the current Terms version see only this screen |

### 10.2 Components (page 13)

| Figma component | Code | Status | Notes |
|---|---|---|---|
| Button `100:56` | `src/ui/Button.tsx` | Compliant | 4 variants; Default/Pressed/Disabled/Loading. **Focused** state not rendered (no keyboard focus ring on iOS touch; revisit for iPad keyboard) |
| Input `100:89` | `src/ui/TextField.tsx` | Compliant | Default/Focused (2 px)/Error/Disabled + search variant |
| Bottom Nav `100:137` | `src/navigation/TabsLayout.tsx` | Modify | Figma icons and colours on the standard tab bar (keeps VoiceOver "tab, n of 3"). Height follows the platform tab bar rather than a fixed 72 pt — verify on device |
| List Item `100:167` | `ListItemRow` in `src/ui/rows.tsx` | Compliant | Checkbox and edit are separate accessible controls |
| Badge `100:186` | `src/ui/Badge.tsx` | Compliant | + Error tone (used by Pantry Item "Out") |
| Alert `100:219` | `src/ui/Alert.tsx` | Compliant | Announces warnings/errors |
| Progress `100:236` | `src/ui/ProgressBar.tsx` | Modify | Track uses `border/default` at full opacity (component shows 8 % opacity; screen P01 shows a visible track). Clarify T4 |
| Avatar `100:250` | `Avatar` in `src/ui/controls.tsx` | Modify | Default only; Notification variant not used |
| Shopping Mode Item `102:29` | `ShoppingModeItem` in `src/ui/rows.tsx` | Compliant | Pending/Collected/Exception + Substituted/Unavailable outcome badges |
| Recommendation Card `102:146` | — | Missing | Needed for P04 |
| Info Card `102:164` | `InfoCard` in `src/ui/Card.tsx` | Compliant | Default / WithIcon |
| Store Decision `102:193` | — | Missing | Needs P05 data |
| Store Comparison `102:218` | — | Missing | Needs P06 data |
| Pantry Item `102:257` | `PantryItemRow` in `src/ui/rows.tsx` | Compliant | Status text from `pantryStatus()` |

### 10.3 Design clarifications raised by implementation

| # | Item | What the code does now | Decision needed |
|---|---|---|---|
| D-ICON-1 | The exported Figma geometry of the Home roof, Back arrow and checkbox tick has disconnected strokes (rendered exports in `assets/figma/`) | Draws the evident intent (closed roof, converging arrow, tick) | Designer to confirm or fix the Figma glyphs |
| A11Y-1 | Unchecked checkbox and card borders use `border/default` #CBD5E1 on white (≈1.5:1, below WCAG 1.4.11's 3:1 for component boundaries) | Follows Figma; checked state and "Done" text also convey state | Consider `content/muted` for checkbox outlines |
| T4 | Progress track opacity (8 % in component vs visible track on P01) | Full-opacity track | Confirm |
| UI-B1 | Budget on P02 | Not shown (no data field) | Add a per-list budget field? |
| UI-B2 | Brand logo on Welcome | Existing V1 `logo-100.png` | Provide approved V2 logo / app icon |
| UI-B3 | Shopping Mode header without a chosen store | Shows the list name | Confirm until P05 exists |
| UI-B4 | Profile, Recipes, Lists root, editors, paywall have no Figma frames | Built from approved components and tokens only | Design review |

### 10.4 Flows

| Flow | Status |
|---|---|
| Home → List Detail → Add Items → Start Shopping → Shopping Mode → Finish → Pantry Update → Pantry | Implemented; covered end-to-end by `__tests__/ui/screens.test.tsx` over the in-memory database (not on device) |
| List Detail → Optimise | Honest unavailable state |
| Recommended Store / Compare Stores | Missing (no licensed data) |
| Home avatar → Profile → Plans / AI consent / Allergies & diets / Delete account / Legal | Implemented |
| Pantry → Use What I Have → Recipes | Implemented (server generation is paused by default; see AI status) |
| Permanent navigation Home ↔ Lists ↔ Pantry | Implemented; `__tests__/navigation.test.tsx` + `__tests__/ui/v2-compliance.test.ts` |
