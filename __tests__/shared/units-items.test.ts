import {
  addQuantities,
  areComparable,
  convert,
  coverage,
  formatQuantity,
  normaliseUnit,
  validateQuantity,
} from '@/shared/domain/units';
import {
  formatPence,
  normaliseCategory,
  normaliseItemName,
  parsePriceToPence,
  validateItemName,
  validateListName,
} from '@/shared/domain/items';

describe('units', () => {
  it('normalises aliases and refuses to guess unknown units', () => {
    expect(normaliseUnit('Grams')).toBe('g');
    expect(normaliseUnit(' litres ')).toBe('l');
    expect(normaliseUnit('tbsp.')).toBe('tbsp');
    expect(normaliseUnit('pcs')).toBe('unit');
    expect(normaliseUnit('')).toBe('unit');
    expect(normaliseUnit('handful')).toBeNull();
  });

  it('converts within a family only', () => {
    expect(convert({ amount: 1.5, unit: 'kg' }, 'g')).toEqual({ amount: 1500, unit: 'g' });
    expect(convert({ amount: 2, unit: 'tbsp' }, 'ml')).toEqual({ amount: 30, unit: 'ml' });
    expect(convert({ amount: 1, unit: 'kg' }, 'l')).toBeNull();
    expect(areComparable('tin', 'jar')).toBe(false);
    expect(areComparable('tin', 'tin')).toBe(true);
  });

  it('adds quantities in the first unit and avoids floating-point noise', () => {
    expect(addQuantities({ amount: 0.1, unit: 'l' }, { amount: 200, unit: 'ml' })).toEqual({ amount: 0.3, unit: 'l' });
    expect(addQuantities({ amount: 2, unit: 'unit' }, { amount: 1, unit: 'dozen' })).toEqual({ amount: 14, unit: 'unit' });
    expect(addQuantities({ amount: 1, unit: 'tin' }, { amount: 1, unit: 'jar' })).toBeNull();
  });

  it('reports coverage and shortfall in the needed unit', () => {
    expect(coverage({ amount: 1, unit: 'kg' }, { amount: 500, unit: 'g' })).toEqual({ kind: 'enough' });
    expect(coverage({ amount: 200, unit: 'g' }, { amount: 0.5, unit: 'kg' })).toEqual({ kind: 'shortfall', missing: { amount: 0.3, unit: 'kg' } });
    expect(coverage({ amount: 2, unit: 'unit' }, { amount: 100, unit: 'g' })).toEqual({ kind: 'incomparable' });
  });

  it('validates quantities', () => {
    expect(validateQuantity(1)).toBeNull();
    expect(validateQuantity(0)).toMatch(/more than zero/);
    expect(validateQuantity(Number.NaN)).toMatch(/number/);
    expect(validateQuantity('2')).toMatch(/number/);
    expect(validateQuantity(1e9)).toMatch(/too large/);
  });

  it('formats quantities for display', () => {
    expect(formatQuantity({ amount: 1, unit: 'unit' })).toBe('1 item');
    expect(formatQuantity({ amount: 3, unit: 'tin' })).toBe('3 tins');
    expect(formatQuantity({ amount: 500, unit: 'g' })).toBe('500 g');
  });
});

describe('items', () => {
  it('normalises names for matching (case, accents, punctuation, plurals)', () => {
    expect(normaliseItemName('  Tomatoes ')).toBe('tomato');
    expect(normaliseItemName('Blueberries')).toBe('blueberry');
    expect(normaliseItemName('Crème Fraîche')).toBe('creme fraiche');
    expect(normaliseItemName('Free-range EGGS')).toBe('free range egg');
    expect(normaliseItemName('Rice')).toBe('rice');
    expect(normaliseItemName('Cheese')).toBe('cheese');
    expect(normaliseItemName('Peaches')).toBe('peach');
  });

  it('maps legacy V1 categories', () => {
    expect(normaliseCategory('dairy')).toBe('dairy_eggs');
    expect(normaliseCategory('grains')).toBe('cupboard');
    expect(normaliseCategory('frozen')).toBe('frozen');
    expect(normaliseCategory('unknown-thing')).toBe('other');
  });

  it('validates names', () => {
    expect(validateItemName('Milk')).toBeNull();
    expect(validateItemName('   ')).toMatch(/Enter a name/);
    expect(validateItemName('x'.repeat(61))).toMatch(/60 characters/);
    expect(validateListName('Weekly shop')).toBeNull();
    expect(validateListName('')).toMatch(/list name/);
  });

  it('parses user-entered prices to integer pence and never accepts junk', () => {
    expect(parsePriceToPence('£1.25')).toBe(125);
    expect(parsePriceToPence('2')).toBe(200);
    expect(parsePriceToPence('0.5')).toBe(50);
    expect(parsePriceToPence('1.255')).toBeNull();
    expect(parsePriceToPence('-1')).toBeNull();
    expect(parsePriceToPence('abc')).toBeNull();
    expect(formatPence(125)).toBe('£1.25');
  });
});
