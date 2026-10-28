/**
 * Static checks that the app follows the approved V2 design system and IA:
 * - only Figma token colours (no V1 colours) in app UI code;
 * - no icon fonts (icons come from the Figma components);
 * - exactly three permanent tabs;
 * - removed V1 modules stay removed.
 */
import fs from 'fs';
import path from 'path';

import { colors } from '@/src/theme/tokens';
import { PERMANENT_TABS } from '@/src/navigation/routes';

const ROOT = path.resolve(__dirname, '../..');
const UI_DIRS = ['app', 'src', 'errors', 'context', 'hooks'];

function listFiles(dir: string): string[] {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((e) => {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) return listFiles(rel);
    return /\.(jsx?|tsx?)$/.test(e.name) ? [rel] : [];
  });
}

const files = UI_DIRS.flatMap(listFiles).filter((f) => !f.endsWith('documents.generated.ts'));
const read = (f: string) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const TOKEN_COLOURS = new Set(Object.values(colors).flatMap((g) => Object.values(g)).map((c) => c.toUpperCase()));

describe('V2 design system compliance', () => {
  it('uses only approved token colours outside the token file', () => {
    const offenders: string[] = [];
    for (const f of files) {
      if (f === path.join('src', 'theme', 'tokens.ts')) continue;
      for (const m of read(f).matchAll(/#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b/g)) {
        if (!TOKEN_COLOURS.has(m[0].toUpperCase())) offenders.push(`${f}: ${m[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('does not use icon fonts (icons come from the Figma components)', () => {
    const offenders = files.filter((f) => /@expo\/vector-icons|Ionicons|MaterialIcons/.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it('has exactly three permanent tabs: Home | Lists | Pantry', () => {
    expect(PERMANENT_TABS.map((t) => t.title)).toEqual(['Home', 'Lists', 'Pantry']);
    const tabFiles = fs.readdirSync(path.join(ROOT, 'app', '(app)', '(tabs)')).filter((f) => f !== '_layout.tsx').sort();
    expect(tabFiles).toEqual(['index.tsx', 'lists.tsx', 'pantry.tsx']);
  });

  it('keeps V1 screens, contexts and components removed', () => {
    const removed = [
      'context/ShoppingListContext.jsx',
      'context/StockContext.jsx',
      'hooks/useShoppingList.js',
      'hooks/useStock.js',
      'components',
      'src/screens/HomeScreen.jsx',
      'src/screens/ListsScreen.jsx',
      'src/screens/PantryScreen.jsx',
      'src/screens/ProfileScreen.jsx',
      'firebase/models.js',
      'constants/stockConstants.js',
    ];
    expect(removed.filter((f) => fs.existsSync(path.join(ROOT, f)))).toEqual([]);
  });

  it('contains no hard-coded prices in UI code (prices come from the user or from Apple) — LS-03', () => {
    const offenders = files.filter((f) => /£\s?\d/.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it('does not ask for phone numbers or addresses at registration', () => {
    const src = read(path.join('src', 'screens', 'auth', 'AuthScreens.tsx'));
    expect(src).not.toMatch(/phoneNumber|postcode|street|textContentType="(telephoneNumber|fullStreetAddress|postalCode)"/);
  });
});
