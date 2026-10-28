# Figma V2 asset provenance

Exported on 2026-10-28 from Figma file `VZj2AU8kOJqYvyjp8AvWQa` (IntelliShop — Product Redesign 2026)
with the Figma plugin API (`exportAsync({ format: 'SVG_STRING' })`), because direct asset download
from figma.com is blocked in the build environment. Clip-path wrappers and inside-stroke masks were
flattened (a 3 × 3 square with a 3 px inside stroke is a filled square).

| File | Figma node | Used by |
|---|---|---|
| nav-home.svg | Bottom Nav `100:137` › Active=Home › Icon slot `100:100` | `src/ui/icons.tsx` `HomeIcon` |
| nav-lists.svg | Icon slot `100:104` | `ListsIcon` |
| nav-pantry.svg | Icon slot `100:108` | `PantryIcon` |
| back.svg | P02 `136:73` Touch Target — Back | `BackIcon` |
| search.svg | P03/P10 search input icon | `SearchIcon` |
| checkbox-checked.svg | List Item State=Checked `100:150` | `Checkbox` |

The app does not bundle `react-native-svg`; icons are drawn with React Native views using the
same geometry (`src/ui/icons.tsx`). The "More" (•••) and "Close" (×) touch targets are text glyphs
in Figma and are rendered as text.
