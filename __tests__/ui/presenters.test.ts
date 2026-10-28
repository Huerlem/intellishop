/**
 * Unit tests for V2 screen logic (src/features/presenters.ts, src/features/forms.ts).
 */
import { daysFromNow, formatUkDate, parseQuantity, parseUkDate, validateEmail, validateNewPassword } from '@/src/features/forms';
import { estimateLabel, greeting, groupByCategory, homeSignals, itemsInPantry, listEstimate, pantryMeta, pantryStatus, priceBadge, spokenQuantity } from '@/src/features/presenters';
import type { ListItem, PantryItem } from '@/src/data/types';

const NOW = new Date(2026, 9, 28, 19, 0).getTime(); // 28 Oct 2026, 19:00 local
const DAY = 86400000;

const item = (over: Partial<ListItem>): ListItem => ({ id: 'i', name: 'Milk', normalizedName: 'milk', quantity: 1, unit: 'unit', category: 'other', notes: '', checked: false, pricePence: null, createdAt: null, updatedAt: null, ...over });
const pantry = (over: Partial<PantryItem>): PantryItem => ({ id: 'p', name: 'Rice', normalizedName: 'rice', quantity: 1, unit: 'kg', minQuantity: 0, category: 'cupboard', expiryDate: null, expiryKind: null, lastPurchasedAt: null, createdAt: NOW - 30 * DAY, updatedAt: null, ...over });

describe('greeting', () => {
  it('uses the time of day and the first name', () => {
    expect(greeting(NOW, 'Peter Smith')).toBe('Good evening, Peter');
    expect(greeting(new Date(2026, 9, 28, 9).getTime(), '')).toBe('Good morning');
  });
});

describe('list estimate (user-entered prices only)', () => {
  it('is absent without prices and labelled partial when some items have none', () => {
    expect(estimateLabel(listEstimate([item({}), item({ id: 'b' })]))).toBeNull();
    expect(estimateLabel(listEstimate([item({ pricePence: 150 }), item({ id: 'b' })]))).toBe('Your prices: £1.50 for 1 of 2 items');
    expect(estimateLabel(listEstimate([item({ pricePence: 150 }), item({ id: 'b', pricePence: 99 })]))).toBe('Your prices: £2.49');
  });
  it('labels the per-item badge as the user’s own price', () => {
    expect(priceBadge(item({ pricePence: 120 }))).toEqual({ label: 'Your price £1.20', tone: 'neutral' });
    expect(priceBadge(item({}))).toBeUndefined();
  });
});

describe('pantry status and meta', () => {
  it('orders urgency: past use-by, expiring, out, running low, recently added, in stock', () => {
    expect(pantryStatus(pantry({ expiryDate: NOW - 2 * DAY, expiryKind: 'use_by' }), NOW)).toEqual({ label: 'Past use-by', tone: 'error' });
    expect(pantryStatus(pantry({ expiryDate: NOW - 2 * DAY, expiryKind: 'best_before' }), NOW)).toEqual({ label: 'Past best before', tone: 'warning' });
    expect(pantryStatus(pantry({ expiryDate: NOW + DAY, expiryKind: 'use_by' }), NOW).label).toBe('Use by tomorrow');
    expect(pantryStatus(pantry({ quantity: 0 }), NOW).label).toBe('Out');
    expect(pantryStatus(pantry({ quantity: 1, minQuantity: 1 }), NOW).label).toBe('Running low');
    expect(pantryStatus(pantry({ lastPurchasedAt: NOW - DAY }), NOW).label).toBe('Recently added');
    expect(pantryStatus(pantry({}), NOW)).toEqual({ label: 'In stock', tone: 'success' });
  });
  it('describes quantity and date kind', () => {
    expect(pantryMeta(pantry({ quantity: 0 }))).toBe('None left');
    expect(pantryMeta(pantry({ quantity: 2, unit: 'unit', expiryDate: new Date(2026, 9, 30).getTime(), expiryKind: 'use_by' }))).toBe('2 items remaining · Use by 30 Oct');
  });
});

describe('home signals come only from the Pantry', () => {
  it('lists expired use-by first, then use-soon, then running low; max 3', () => {
    const s = homeSignals(
      [
        pantry({ id: 'a', name: 'Chicken', expiryDate: NOW - 2 * DAY, expiryKind: 'use_by' }),
        pantry({ id: 'b', name: 'Spinach', expiryDate: NOW + DAY, expiryKind: 'best_before' }),
        pantry({ id: 'c', name: 'Milk', quantity: 1, minQuantity: 1 }),
        pantry({ id: 'd', name: 'Eggs', quantity: 1, minQuantity: 2 }),
      ],
      NOW
    );
    expect(s.map((x) => x.text)).toEqual(['Chicken is past its use-by date', 'Use Spinach by tomorrow', 'Milk is running low']);
    expect(homeSignals([], NOW)).toEqual([]);
  });
});

describe('matching and grouping', () => {
  it('finds list items already stocked in the Pantry (quantity above zero)', () => {
    const r = itemsInPantry([item({ id: 'x', name: 'Basmati rice' }), item({ id: 'y', name: 'Bread' })], [pantry({ name: 'Rice' }), pantry({ id: 'q', name: 'Bread', quantity: 0 })]);
    expect(r.map((i) => i.id)).toEqual(['x']);
  });
  it('groups by category in the given order', () => {
    const g = groupByCategory([{ category: 'frozen', n: 1 }, { category: 'bakery', n: 2 }, { category: 'frozen', n: 3 }], ['bakery', 'frozen']);
    expect(g.map((x) => [x.category, x.items.length])).toEqual([['bakery', 1], ['frozen', 2]]);
  });
  it('speaks units in full', () => {
    expect(spokenQuantity(2, 'l')).toBe('2 litres');
    expect(spokenQuantity(1, 'unit')).toBe('1 item');
  });
});

describe('form parsing', () => {
  it('parses quantities (comma decimals; zero only when allowed)', () => {
    expect(parseQuantity('1,5')).toBe(1.5);
    expect(parseQuantity('0')).toBeNull();
    expect(parseQuantity('0', true)).toBe(0);
    expect(parseQuantity('-1')).toBeNull();
    expect(parseQuantity('abc')).toBeNull();
    expect(parseQuantity('1000001')).toBeNull();
  });
  it('parses and formats UK dates; rejects impossible dates', () => {
    const d = parseUkDate('31/10/2026')!;
    expect(formatUkDate(d)).toBe('31/10/2026');
    expect(parseUkDate('31/02/2026')).toBeNull();
    expect(parseUkDate('2026-10-31')).toBeNull();
    expect(formatUkDate(daysFromNow(1, NOW))).toBe('29/10/2026');
  });
  it('validates sign-up input', () => {
    expect(validateEmail('')).toMatch(/Enter/);
    expect(validateEmail('a@b')).toMatch(/valid/);
    expect(validateEmail(' peter@example.com ')).toBeNull();
    expect(validateNewPassword('short')).toMatch(/8/);
    expect(validateNewPassword('long enough')).toBeNull();
  });
});
