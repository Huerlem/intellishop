/**
 * Item names: validation and normalisation for duplicate detection and matching.
 */

export const MAX_ITEM_NAME_LENGTH = 60;
export const MAX_LIST_NAME_LENGTH = 40;
export const MAX_NOTES_LENGTH = 200;

export const ITEM_CATEGORIES = [
  'fruit_veg',
  'meat_fish',
  'dairy_eggs',
  'bakery',
  'cupboard',
  'frozen',
  'drinks',
  'household',
  'personal_care',
  'other',
] as const;
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  fruit_veg: 'Fruit & veg',
  meat_fish: 'Meat & fish',
  dairy_eggs: 'Dairy & eggs',
  bakery: 'Bakery',
  cupboard: 'Food cupboard',
  frozen: 'Frozen',
  drinks: 'Drinks',
  household: 'Household',
  personal_care: 'Health & beauty',
  other: 'Other',
};

/** V1 stored free-text categories; map the known ones, everything else becomes 'other'. */
const LEGACY_CATEGORY_MAP: Record<string, ItemCategory> = {
  fruits: 'fruit_veg', fruit: 'fruit_veg', vegetables: 'fruit_veg', produce: 'fruit_veg',
  meat: 'meat_fish', fish: 'meat_fish', seafood: 'meat_fish',
  dairy: 'dairy_eggs', eggs: 'dairy_eggs',
  bakery: 'bakery', bread: 'bakery',
  grains: 'cupboard', pantry: 'cupboard', canned: 'cupboard', snacks: 'cupboard', spices: 'cupboard', condiments: 'cupboard',
  frozen: 'frozen',
  beverages: 'drinks', drinks: 'drinks',
  household: 'household', cleaning: 'household',
  hygiene: 'personal_care', personal: 'personal_care',
};

export function normaliseCategory(raw: string | null | undefined): ItemCategory {
  const key = (raw ?? '').trim().toLowerCase();
  if ((ITEM_CATEGORIES as readonly string[]).includes(key)) return key as ItemCategory;
  return LEGACY_CATEGORY_MAP[key] ?? 'other';
}

/** Collapses whitespace and trims; keeps the user's capitalisation for display. */
export function cleanDisplayName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

/**
 * Normalised key for matching: lower case, accents removed, punctuation removed,
 * simple English plurals reduced ("tomatoes" → "tomato", "berries" → "berry").
 */
export function normaliseItemName(raw: string): string {
  const base = cleanDisplayName(raw)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return base
    .split(' ')
    .map(singularise)
    .join(' ');
}

const INVARIANT = new Set(['rice', 'cheese', 'fish', 'sheep', 'hummus', 'couscous', 'asparagus', 'molasses', 'swiss', 'chips', 'grass', 'glass', 'gas', 'peas', 'oats', 'lentils', 'noodles', 'cress', 'bass', 'news']);

function singularise(word: string): string {
  if (word.length <= 3 || INVARIANT.has(word)) return word;
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith('oes')) return word.slice(0, -2);
  if (/(ches|shes|xes|sses|zes)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us')) return word.slice(0, -1);
  return word;
}

export function validateItemName(raw: unknown): string | null {
  if (typeof raw !== 'string' || !cleanDisplayName(raw)) return 'Enter a name.';
  if (cleanDisplayName(raw).length > MAX_ITEM_NAME_LENGTH) return `Use ${MAX_ITEM_NAME_LENGTH} characters or fewer.`;
  return null;
}

export function validateListName(raw: unknown): string | null {
  if (typeof raw !== 'string' || !cleanDisplayName(raw)) return 'Enter a list name.';
  if (cleanDisplayName(raw).length > MAX_LIST_NAME_LENGTH) return `Use ${MAX_LIST_NAME_LENGTH} characters or fewer.`;
  return null;
}

/** Prices are stored as integer pence entered by the user. */
export function parsePriceToPence(raw: string): number | null {
  const cleaned = raw.trim().replace(/^£/, '');
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(cleaned)) return null;
  const [pounds, pence = ''] = cleaned.split('.');
  return Number(pounds) * 100 + Number(pence.padEnd(2, '0'));
}

export function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}
