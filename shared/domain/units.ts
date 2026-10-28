/**
 * Quantities and units for lists, pantry and recipe reconciliation.
 *
 * Units are grouped into families. Conversion happens only inside a family: mass,
 * volume, count. Kitchen measures (tsp, tbsp, cup) are volume. 'pack' and similar
 * container units are their own family, because their size varies by product.
 * Values that cannot be compared safely are reported as 'incomparable' rather than guessed.
 */

export type UnitFamily = 'mass' | 'volume' | 'count' | 'pack';

export type CanonicalUnit =
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'tsp'
  | 'tbsp'
  | 'cup'
  | 'unit'
  | 'dozen'
  | 'pack'
  | 'tin'
  | 'jar'
  | 'bottle'
  | 'bag'
  | 'box';

type UnitInfo = { family: UnitFamily; toBase: number; label: string; plural: string };

/** Base units: mass → g, volume → ml, count → unit. Pack-like units are not convertible. */
export const UNITS: Record<CanonicalUnit, UnitInfo> = {
  g: { family: 'mass', toBase: 1, label: 'g', plural: 'g' },
  kg: { family: 'mass', toBase: 1000, label: 'kg', plural: 'kg' },
  ml: { family: 'volume', toBase: 1, label: 'ml', plural: 'ml' },
  l: { family: 'volume', toBase: 1000, label: 'l', plural: 'l' },
  tsp: { family: 'volume', toBase: 5, label: 'tsp', plural: 'tsp' },
  tbsp: { family: 'volume', toBase: 15, label: 'tbsp', plural: 'tbsp' },
  cup: { family: 'volume', toBase: 250, label: 'cup', plural: 'cups' },
  unit: { family: 'count', toBase: 1, label: 'item', plural: 'items' },
  dozen: { family: 'count', toBase: 12, label: 'dozen', plural: 'dozen' },
  pack: { family: 'pack', toBase: 1, label: 'pack', plural: 'packs' },
  tin: { family: 'pack', toBase: 1, label: 'tin', plural: 'tins' },
  jar: { family: 'pack', toBase: 1, label: 'jar', plural: 'jars' },
  bottle: { family: 'pack', toBase: 1, label: 'bottle', plural: 'bottles' },
  bag: { family: 'pack', toBase: 1, label: 'bag', plural: 'bags' },
  box: { family: 'pack', toBase: 1, label: 'box', plural: 'boxes' },
};

const ALIASES: Record<string, CanonicalUnit> = {
  g: 'g', gram: 'g', grams: 'g', gr: 'g', grm: 'g',
  kg: 'kg', kgs: 'kg', kilo: 'kg', kilos: 'kg', kilogram: 'kg', kilograms: 'kg',
  ml: 'ml', millilitre: 'ml', millilitres: 'ml', milliliter: 'ml', milliliters: 'ml',
  l: 'l', lt: 'l', ltr: 'l', litre: 'l', litres: 'l', liter: 'l', liters: 'l',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  tbsp: 'tbsp', tbs: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  cup: 'cup', cups: 'cup',
  unit: 'unit', units: 'unit', item: 'unit', items: 'unit', pc: 'unit', pcs: 'unit', piece: 'unit',
  pieces: 'unit', x: 'unit', each: 'unit', ea: 'unit', '': 'unit',
  dozen: 'dozen', dz: 'dozen',
  pack: 'pack', packs: 'pack', packet: 'pack', packets: 'pack', pkt: 'pack',
  tin: 'tin', tins: 'tin', can: 'tin', cans: 'tin',
  jar: 'jar', jars: 'jar',
  bottle: 'bottle', bottles: 'bottle',
  bag: 'bag', bags: 'bag',
  box: 'box', boxes: 'box',
};

/** Maps free-text units to a canonical unit; returns null for unknown units (never guesses). */
export function normaliseUnit(raw: string | null | undefined): CanonicalUnit | null {
  const key = (raw ?? '').trim().toLowerCase().replace(/\.$/, '');
  return Object.prototype.hasOwnProperty.call(ALIASES, key) ? ALIASES[key] : null;
}

export type Quantity = { amount: number; unit: CanonicalUnit };

export const MAX_QUANTITY = 100000;

/** Validates a user-entered quantity. Returns an error message or null. */
export function validateQuantity(amount: unknown): string | null {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return 'Enter a number.';
  if (amount <= 0) return 'Quantity must be more than zero.';
  if (amount > MAX_QUANTITY) return 'Quantity is too large.';
  return null;
}

export function toBase(q: Quantity): { family: UnitFamily; amount: number; unit: CanonicalUnit } {
  const info = UNITS[q.unit];
  // Pack-like units keep their own unit: 2 tins and 2 jars must not be added together.
  return { family: info.family, amount: q.amount * info.toBase, unit: info.family === 'pack' ? q.unit : baseUnitOf(info.family) };
}

function baseUnitOf(family: UnitFamily): CanonicalUnit {
  return family === 'mass' ? 'g' : family === 'volume' ? 'ml' : 'unit';
}

export function areComparable(a: CanonicalUnit, b: CanonicalUnit): boolean {
  const fa = UNITS[a].family;
  const fb = UNITS[b].family;
  if (fa !== fb) return false;
  return fa !== 'pack' || a === b;
}

/** Rounds to at most 3 decimal places to avoid floating-point noise (0.1 + 0.2). */
export function roundQuantity(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** Converts `q` into `target` units when comparable; otherwise null. */
export function convert(q: Quantity, target: CanonicalUnit): Quantity | null {
  if (!areComparable(q.unit, target)) return null;
  const amount = (q.amount * UNITS[q.unit].toBase) / UNITS[target].toBase;
  return { amount: roundQuantity(amount), unit: target };
}

/** Adds b to a, expressed in a's unit. Returns null when the units are incomparable. */
export function addQuantities(a: Quantity, b: Quantity): Quantity | null {
  const converted = convert(b, a.unit);
  if (!converted) return null;
  return { amount: roundQuantity(a.amount + converted.amount), unit: a.unit };
}

export type Coverage =
  | { kind: 'enough' }
  | { kind: 'shortfall'; missing: Quantity }
  | { kind: 'incomparable' };

/** Does `have` cover `need`? Shortfall is expressed in `need`'s unit. */
export function coverage(have: Quantity, need: Quantity): Coverage {
  const haveInNeedUnit = convert(have, need.unit);
  if (!haveInNeedUnit) return { kind: 'incomparable' };
  if (haveInNeedUnit.amount + 1e-9 >= need.amount) return { kind: 'enough' };
  return { kind: 'shortfall', missing: { amount: roundQuantity(need.amount - haveInNeedUnit.amount), unit: need.unit } };
}

/** Human-readable quantity, e.g. "2 items", "500 g", "1.5 l". */
export function formatQuantity(q: Quantity): string {
  const info = UNITS[q.unit];
  const amount = Number.isInteger(q.amount) ? String(q.amount) : String(roundQuantity(q.amount));
  if (info.family === 'mass' || q.unit === 'ml' || q.unit === 'l') return `${amount} ${info.label}`;
  return `${amount} ${q.amount === 1 ? info.label : info.plural}`;
}
