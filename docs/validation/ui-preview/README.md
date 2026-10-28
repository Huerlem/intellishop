# V2 UI preview renders (react-native-web proxy) — NOT iOS evidence

Generated 2026-10-28 from commit on `feature/v2-production-rebuild` (Package C).

**What these are:** the real V2 screen components (`src/screens/*`) rendered in Chromium through
react-native-web at the canonical Figma size **440 × 956**, using the archived Expo SDK 53
toolchain (the SDK 58 toolchain cannot be installed here: npm registry blocked). Data comes from
an in-memory Firestore seeded with sample lists/Pantry/trip (`tooling/seed.ts`); Firebase, the
router and sign-in are replaced by local shims (`tooling/*-shim.*`). Inter is loaded from the
system font files.

**What these are not:** iOS screenshots, App Store screenshots, or proof of on-device layout,
safe areas (insets are 0 on the web), gestures, VoiceOver or Dynamic Type. Status bar and the
tab bar are not shown (screens are rendered without the navigator). The web focus outline visible
on `add.png` is a browser artefact.

They exist so the owner and reviewers can compare the implementation with the Figma frames
(P01 `136:3`, P02 `136:55`, P03 `136:137`, P07 `136:346`, P08 `136:397`, P09 `136:425`,
P10 `136:470`) while device testing is blocked.

| File | Screen |
|---|---|
| home.png / home-trip.png / home-empty.png | P01 Home (signals; with active trip; empty) |
| lists.png | Lists tab root (C6) |
| list.png | P02 List Detail (user prices, Pantry match, Resume Shopping) |
| add.png | P03 Add Items |
| optimise.png | P04 honest unavailable state |
| shop.png | P07 Shopping Mode (collected / substituted / unavailable) |
| finish.png | P08 Finish Shopping |
| update.png | P09 Pantry Update (auto + needs review, undo) |
| pantry.png | P10 Pantry |
| profile.png, plans.png, recipes.png, consent.png, dietary.png, delete.png, legal.png | C2 / paywall / C5 / consent screens / legal |
| register.png, welcome.png | C1 |

Reproduce (local proxy only): `tooling/preview.sh` with the scratch layout described in the script.
