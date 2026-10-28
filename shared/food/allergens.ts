/**
 * Deterministic allergen and diet lexicon (FOOD_SAFETY_TECHNICAL_SPEC.md §2).
 *
 * The 14 allergen codes are the UK regulated allergens listed by the FSA (matrix S-40).
 * The lexicon is a SCREENING AID: conservative, versioned, never described as complete.
 *   - `contains`: the ingredient name indicates the allergen is present.
 *   - `mayContain`: the ingredient often contains the allergen depending on brand/recipe.
 *   - `exceptions`: phrases removed before matching (e.g. "coconut milk" is not milk).
 * Terms are written in the singular; matching uses normaliseItemName() and whole words.
 */
import { normaliseItemName } from '../domain/items';

export const LEXICON_VERSION = '2026-10-28.1';

export const ALLERGEN_CODES = [
  'gluten',
  'crustaceans',
  'eggs',
  'fish',
  'peanuts',
  'soybeans',
  'milk',
  'tree_nuts',
  'celery',
  'mustard',
  'sesame',
  'sulphites',
  'lupin',
  'molluscs',
] as const;
export type AllergenCode = (typeof ALLERGEN_CODES)[number];

/** FSA wording (S-40). */
export const ALLERGEN_LABELS: Record<AllergenCode, string> = {
  gluten: 'Cereals containing gluten',
  crustaceans: 'Crustaceans',
  eggs: 'Eggs',
  fish: 'Fish',
  peanuts: 'Peanuts',
  soybeans: 'Soybeans',
  milk: 'Milk',
  tree_nuts: 'Nuts (almond, hazelnut, walnut, cashew, pecan, Brazil nut, pistachio, macadamia)',
  celery: 'Celery',
  mustard: 'Mustard',
  sesame: 'Sesame seeds',
  sulphites: 'Sulphur dioxide and sulphites',
  lupin: 'Lupin',
  molluscs: 'Molluscs',
};

export const ALLERGEN_SHORT_LABELS: Record<AllergenCode, string> = {
  gluten: 'gluten',
  crustaceans: 'crustaceans',
  eggs: 'eggs',
  fish: 'fish',
  peanuts: 'peanuts',
  soybeans: 'soya',
  milk: 'milk',
  tree_nuts: 'tree nuts',
  celery: 'celery',
  mustard: 'mustard',
  sesame: 'sesame',
  sulphites: 'sulphites',
  lupin: 'lupin',
  molluscs: 'molluscs',
};

export const DIET_CODES = ['vegetarian', 'vegan', 'pescatarian', 'gluten_free', 'dairy_free', 'halal', 'kosher'] as const;
export type DietCode = (typeof DIET_CODES)[number];

export const DIET_LABELS: Record<DietCode, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  pescatarian: 'Pescatarian',
  gluten_free: 'Avoid gluten',
  dairy_free: 'Avoid dairy',
  halal: 'Halal',
  kosher: 'Kosher',
};

/**
 * `exceptions`: phrases that are not the allergen even though they contain a term ("coconut milk").
 * `qualifiers`: product qualifiers ("gluten free", "vegan", "plant based"). In an ingredient NAME
 * they describe the rest of the name ("gluten-free plain flour", "vegan cheddar cheese"), so the
 * text from the qualifier to the end of the name is ignored. Words before it still count.
 * `modifiers`: descriptive words ("bean", "mushroom") that only describe the NEXT word
 * ("bean burger"). "Mushroom and chicken pie" still matches chicken.
 * In method text both remove only "qualifier/modifier + next word".
 */
type Entry = { contains: string[]; mayContain: string[]; exceptions: string[]; qualifiers?: string[]; modifiers?: string[] };

const RAW: Record<AllergenCode, Entry> = {
  gluten: {
    contains: [
      'wheat', 'barley', 'rye', 'oat', 'oats', 'spelt', 'kamut', 'semolina', 'couscous', 'bulgur', 'bulgar', 'seitan', 'durum', 'farro',
      'freekeh', 'flour', 'bread', 'breadcrumb', 'pasta', 'spaghetti', 'penne', 'fusilli', 'macaroni', 'lasagne', 'lasagna', 'tagliatelle',
      'linguine', 'orzo', 'noodle', 'tortilla', 'wrap', 'pitta', 'pita', 'naan', 'bagel', 'croissant', 'pastry', 'filo', 'cracker',
      'biscuit', 'cake', 'crumpet', 'muffin', 'pizza base', 'beer', 'ale', 'malt', 'gnocchi', 'dumpling', 'roll', 'baguette', 'brioche',
      'ciabatta', 'focaccia', 'sourdough', 'crouton', 'udon', 'ramen', 'panko',
    ],
    mayContain: ['soy sauce', 'stock', 'stock cube', 'gravy', 'sauce', 'soup', 'sausage', 'burger', 'worcestershire sauce', 'baking powder', 'curry paste', 'seasoning', 'spice mix', 'batter', 'granola', 'muesli', 'cereal'],
    qualifiers: ['gluten free'],
    exceptions: ['rice noodle', 'rice flour', 'corn tortilla', 'cornflour', 'corn flour', 'gram flour', 'chickpea flour', 'almond flour', 'coconut flour', 'buckwheat', 'potato flour', 'tapioca flour', 'rice cake', 'tamari'],
  },
  crustaceans: {
    contains: ['prawn', 'shrimp', 'crab', 'lobster', 'crayfish', 'langoustine', 'scampi', 'shrimp paste', 'krill'],
    mayContain: ['seafood', 'seafood mix', 'paella mix', 'fish sauce', 'bouillabaisse'],
    exceptions: [],
  },
  eggs: {
    contains: ['egg', 'mayonnaise', 'mayo', 'meringue', 'aioli', 'hollandaise', 'custard', 'quiche', 'brioche', 'egg noodle', 'eggnog'],
    mayContain: ['fresh pasta', 'pasta', 'noodle', 'cake', 'batter', 'pancake', 'waffle', 'dressing', 'tartare sauce', 'biscuit', 'muffin', 'mousse', 'ice cream', 'bread'],
    qualifiers: ['egg free', 'vegan'],
    exceptions: ['eggplant'],
  },
  fish: {
    contains: [
      'fish', 'salmon', 'tuna', 'cod', 'haddock', 'mackerel', 'sardine', 'anchovy', 'trout', 'plaice', 'sole', 'pollock', 'hake',
      'sea bass', 'bass', 'tilapia', 'kipper', 'herring', 'monkfish', 'halibut', 'swordfish', 'fish sauce', 'worcestershire sauce', 'caviar', 'roe',
    ],
    mayContain: ['caesar dressing', 'seafood', 'stock', 'pesto', 'puttanesca sauce', 'thai curry paste', 'curry paste'],
    qualifiers: ['fish free', 'vegan'],
    exceptions: [],
  },
  peanuts: {
    contains: ['peanut', 'groundnut', 'peanut butter', 'satay', 'monkey nut', 'arachis oil'],
    mayContain: ['mixed nut', 'nut', 'curry paste', 'chocolate', 'cereal bar', 'granola', 'praline', 'nut oil'],
    exceptions: ['nutmeg'],
  },
  soybeans: {
    contains: ['soy', 'soya', 'tofu', 'edamame', 'tempeh', 'miso', 'soy sauce', 'soya sauce', 'tamari', 'soya milk', 'soy milk', 'natto', 'textured vegetable protein'],
    mayContain: ['lecithin', 'vegetable protein', 'meat substitute', 'stock cube', 'bread', 'chocolate', 'teriyaki sauce', 'hoisin sauce', 'black bean sauce'],
    exceptions: [],
  },
  milk: {
    contains: [
      'milk', 'butter', 'cream', 'cheese', 'cheddar', 'mozzarella', 'parmesan', 'feta', 'halloumi', 'ricotta', 'mascarpone', 'yoghurt',
      'yogurt', 'ghee', 'whey', 'casein', 'lactose', 'creme fraiche', 'buttermilk', 'custard', 'ice cream', 'paneer', 'quark', 'kefir',
      'condensed milk', 'evaporated milk', 'bechamel', 'brie', 'camembert', 'gruyere', 'stilton', 'gouda', 'cream cheese', 'sour cream',
      'double cream', 'single cream', 'clotted cream', 'milk powder', 'skyr', 'labneh',
    ],
    mayContain: ['chocolate', 'biscuit', 'cake', 'sauce', 'pesto', 'bread', 'pastry', 'mashed potato', 'naan', 'brioche', 'gravy', 'margarine', 'soup'],
    exceptions: [
      'coconut milk', 'coconut cream', 'oat milk', 'almond milk', 'soya milk', 'soy milk', 'rice milk', 'cashew milk', 'oat cream', 'soya cream',
      'cocoa butter', 'peanut butter', 'almond butter', 'cashew butter', 'nut butter', 'butter bean', 'shea butter', 'cream of tartar',
      'butternut', 'butternut squash',
    ],
    qualifiers: ['dairy free', 'milk free', 'vegan', 'plant based'],
    modifiers: ['plant'],
  },
  tree_nuts: {
    contains: [
      'almond', 'hazelnut', 'walnut', 'cashew', 'pecan', 'brazil nut', 'pistachio', 'macadamia', 'praline', 'marzipan', 'frangipane',
      'almond milk', 'almond butter', 'cashew butter', 'cashew milk', 'gianduja', 'nut butter', 'amaretto',
    ],
    mayContain: ['nut', 'mixed nut', 'pesto', 'pine nut', 'granola', 'muesli', 'chocolate', 'cereal bar', 'nougat', 'nut oil', 'curry paste', 'baklava'],
    exceptions: ['nutmeg', 'coconut', 'butternut', 'butternut squash', 'water chestnut', 'peanut', 'peanut butter'],
    qualifiers: ['nut free'],
  },
  celery: {
    contains: ['celery', 'celeriac', 'celery salt', 'celery seed', 'celery leaf'],
    mayContain: ['stock', 'stock cube', 'bouillon', 'soup', 'gravy', 'seasoning', 'spice mix', 'curry powder'],
    exceptions: [],
  },
  mustard: {
    contains: ['mustard', 'dijon', 'mustard seed', 'mustard powder', 'piccalilli', 'mustard leaf'],
    mayContain: ['mayonnaise', 'mayo', 'dressing', 'vinaigrette', 'curry powder', 'curry paste', 'sauce', 'chutney', 'relish', 'seasoning', 'spice mix'],
    exceptions: [],
  },
  sesame: {
    contains: ['sesame', 'tahini', 'hummus', 'sesame oil', 'sesame seed', 'halva', 'gomasio', 'za atar'],
    mayContain: ['bagel', 'seeded bread', 'seeded roll', 'bread', 'burger bun', 'cracker', 'dressing', 'falafel'],
    exceptions: [],
  },
  sulphites: {
    contains: ['wine', 'sulphite', 'sulfite', 'sulphur dioxide', 'dried apricot', 'sultana', 'raisin', 'cider', 'prosecco', 'sherry', 'port', 'vermouth', 'perry'],
    mayContain: ['dried fruit', 'vinegar', 'sausage', 'burger', 'beer', 'lime juice', 'lemon juice', 'pickle', 'gherkin', 'jam', 'mixed peel', 'glace cherry'],
    exceptions: [],
  },
  lupin: {
    contains: ['lupin', 'lupine', 'lupin flour'],
    mayContain: ['gluten free flour', 'gluten free bread', 'gluten free pasta'],
    exceptions: [],
  },
  molluscs: {
    contains: ['mussel', 'clam', 'oyster', 'scallop', 'squid', 'calamari', 'octopus', 'cockle', 'whelk', 'snail', 'escargot', 'oyster sauce', 'cuttlefish', 'abalone'],
    mayContain: ['seafood', 'seafood mix', 'paella mix', 'fish sauce'],
    exceptions: [],
  },
};

const MEAT = [
  'chicken', 'beef', 'pork', 'lamb', 'mutton', 'bacon', 'ham', 'sausage', 'mince', 'steak', 'turkey', 'duck', 'goose', 'veal', 'venison',
  'rabbit', 'gelatine', 'gelatin', 'lard', 'suet', 'dripping', 'chorizo', 'salami', 'pepperoni', 'prosciutto', 'pancetta', 'liver',
  'kidney', 'black pudding', 'haggis', 'meatball', 'burger', 'gammon', 'brisket', 'oxtail', 'pheasant', 'pigeon', 'goat', 'meat',
];
const MEAT_QUALIFIERS = ['vegetarian', 'vegan', 'veggie', 'plant based', 'meat free', 'meatless', 'quorn'];
const MEAT_MODIFIERS = ['soya', 'soy', 'lentil', 'bean', 'nut', 'mushroom', 'vegetable', 'chickpea', 'tofu', 'halloumi', 'falafel'];
const MEAT_EXCEPTIONS = ['vegetable suet', 'kidney bean', 'butter bean', 'chicken pea'];
const PORK = ['pork', 'bacon', 'ham', 'lard', 'gammon', 'chorizo', 'salami', 'pepperoni', 'prosciutto', 'pancetta', 'black pudding', 'sausage', 'gelatine', 'gelatin'];
const ALCOHOL = ['wine', 'beer', 'ale', 'cider', 'rum', 'brandy', 'sherry', 'vodka', 'whisky', 'whiskey', 'gin', 'port', 'prosecco', 'champagne', 'vermouth', 'liqueur', 'amaretto', 'mirin', 'sake', 'kirsch'];

type DietEntry = { forbidden: string[]; caution: string[]; exceptions: string[]; qualifiers?: string[]; modifiers?: string[]; alsoAllergens: AllergenCode[]; alwaysCheck?: string };

const DIETS_RAW: Record<DietCode, DietEntry> = {
  vegetarian: {
    forbidden: MEAT,
    caution: ['worcestershire sauce', 'parmesan', 'stock', 'gravy', 'pesto', 'gelatine', 'rennet', 'marshmallow', 'jelly'],
    exceptions: MEAT_EXCEPTIONS,
    qualifiers: MEAT_QUALIFIERS,
    modifiers: MEAT_MODIFIERS,
    alsoAllergens: ['fish', 'crustaceans', 'molluscs'],
  },
  vegan: {
    forbidden: [...MEAT, 'honey'],
    caution: ['worcestershire sauce', 'stock', 'gravy', 'pesto', 'chocolate', 'bread', 'pasta', 'sugar', 'wine', 'marshmallow', 'jelly'],
    exceptions: MEAT_EXCEPTIONS,
    qualifiers: MEAT_QUALIFIERS,
    modifiers: MEAT_MODIFIERS,
    alsoAllergens: ['fish', 'crustaceans', 'molluscs', 'milk', 'eggs'],
  },
  pescatarian: {
    forbidden: MEAT,
    caution: ['stock', 'gravy', 'gelatine'],
    exceptions: MEAT_EXCEPTIONS,
    qualifiers: MEAT_QUALIFIERS,
    modifiers: MEAT_MODIFIERS,
    alsoAllergens: [],
  },
  gluten_free: { forbidden: [], caution: [], exceptions: [], alsoAllergens: ['gluten'] },
  dairy_free: { forbidden: [], caution: [], exceptions: [], alsoAllergens: ['milk'] },
  halal: {
    forbidden: [...PORK, ...ALCOHOL],
    caution: ['chicken', 'beef', 'lamb', 'mutton', 'turkey', 'duck', 'mince', 'steak', 'meat', 'stock', 'vanilla extract', 'vinegar'],
    exceptions: ['halal gelatine', 'beef gelatine', 'wine vinegar', 'cider vinegar', 'malt vinegar'],
    qualifiers: ['vegetarian', 'vegan', 'plant based', 'alcohol free', 'non alcoholic'],
    alsoAllergens: [],
    alwaysCheck: 'Check halal certification on meat and processed products.',
  },
  kosher: {
    forbidden: PORK,
    caution: ['chicken', 'beef', 'lamb', 'turkey', 'duck', 'mince', 'steak', 'meat', 'stock', 'cheese', 'wine'],
    exceptions: ['kosher gelatine', 'fish gelatine'],
    qualifiers: ['vegetarian', 'vegan', 'plant based'],
    alsoAllergens: ['crustaceans', 'molluscs'],
    alwaysCheck: 'Check kosher certification, and whether meat and dairy are combined.',
  },
};

// Normalise all terms once, with the same function used for ingredient names.
const norm = (list: string[]) => [...new Set(list.map(normaliseItemName).filter(Boolean))];

export const LEXICON: Record<AllergenCode, Entry> = Object.fromEntries(
  ALLERGEN_CODES.map((code) => [
    code,
    {
      contains: norm(RAW[code].contains),
      mayContain: norm(RAW[code].mayContain),
      exceptions: norm(RAW[code].exceptions),
      qualifiers: norm(RAW[code].qualifiers ?? []),
      modifiers: norm(RAW[code].modifiers ?? []),
    },
  ])
) as Record<AllergenCode, Entry>;

export const DIET_RULES: Record<DietCode, DietEntry> = Object.fromEntries(
  DIET_CODES.map((code) => [
    code,
    {
      ...DIETS_RAW[code],
      forbidden: norm(DIETS_RAW[code].forbidden),
      caution: norm(DIETS_RAW[code].caution),
      exceptions: norm(DIETS_RAW[code].exceptions),
      qualifiers: norm(DIETS_RAW[code].qualifiers ?? []),
      modifiers: norm(DIETS_RAW[code].modifiers ?? []),
    },
  ])
) as Record<DietCode, DietEntry>;

export type MatchRules = { exceptions: string[]; qualifiers?: string[]; modifiers?: string[] };

const escapeRe = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Returns the first whole-word term found (longest first), or null. See `Entry` for how
 * qualifiers and modifiers apply in 'item' (ingredient name) and 'text' (method) modes.
 */
export function findTerm(normalizedText: string, terms: string[], rules: MatchRules, mode: 'item' | 'text' = 'item'): string | null {
  let text = ` ${normalizedText} `;
  for (const q of rules.qualifiers ?? []) {
    const re = mode === 'item' ? new RegExp(` ${escapeRe(q)} .*$`) : new RegExp(` ${escapeRe(q)} [a-z0-9]+(?= )`, 'g');
    text = text.replace(re, ' ');
    if (!text.endsWith(' ')) text += ' ';
  }
  for (const m of rules.modifiers ?? []) text = text.replace(new RegExp(` ${escapeRe(m)} [a-z0-9]+(?= )`, 'g'), ' ');
  for (const ex of rules.exceptions) text = text.split(` ${ex} `).join(' ');
  for (const term of [...terms].sort((a, b) => b.length - a.length)) {
    if (text.includes(` ${term} `)) return term;
  }
  return null;
}

export type TermHit = { allergen: AllergenCode; term: string; certainty: 'contains' | 'may_contain' };

export function allergenHits(rawText: string): TermHit[] {
  const text = normaliseItemName(rawText);
  const hits: TermHit[] = [];
  for (const code of ALLERGEN_CODES) {
    const e = LEXICON[code];
    const direct = findTerm(text, e.contains, e);
    if (direct) {
      hits.push({ allergen: code, term: direct, certainty: 'contains' });
      continue;
    }
    const maybe = findTerm(text, e.mayContain, e);
    if (maybe) hits.push({ allergen: code, term: maybe, certainty: 'may_contain' });
  }
  return hits;
}
