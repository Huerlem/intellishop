import { memoryStore, MemoryTimestamp } from '../test-utils/memoryFirestore';

const U = 'users/user-1';
const now = Date.now();
const DAY = 86400000;
const ts = (ms: number) => new MemoryTimestamp(ms);
const item = (name: string, o: Record<string, unknown> = {}) => ({ name, normalizedName: name.toLowerCase(), quantity: 1, unit: 'unit', category: 'other', notes: '', checked: false, pricePence: null, createdAt: ts(now), updatedAt: ts(now), ...o });
const pantry = (name: string, o: Record<string, unknown> = {}) => ({ name, normalizedName: name.toLowerCase(), quantity: 1, unit: 'unit', minQuantity: 0, category: 'other', expiryDate: null, expiryKind: null, lastPurchasedAt: null, createdAt: ts(now - 30 * DAY), updatedAt: ts(now - 30 * DAY), ...o });

export function seed(kind: string) {
  memoryStore.reset();
  if (kind === 'empty') return;
  memoryStore.seed(`${U}/lists`, 'l1', { name: 'Weekly shop', archived: false, itemCount: 6, lastItemOp: null, createdAt: ts(now - DAY), updatedAt: ts(now) });
  memoryStore.seed(`${U}/lists`, 'l2', { name: 'Sunday roast', archived: false, itemCount: 3, lastItemOp: null, createdAt: ts(now - 3 * DAY), updatedAt: ts(now - 2 * DAY) });
  const items: [string, Record<string, unknown>][] = [
    ['Semi-skimmed milk', { quantity: 2, unit: 'l', category: 'dairy_eggs', pricePence: 165 }],
    ['Wholemeal bread', { category: 'bakery', pricePence: 140 }],
    ['Greek yoghurt', { category: 'dairy_eggs', checked: true }],
    ['Bananas', { quantity: 6, category: 'fruit_veg' }],
    ['Basmati rice', { quantity: 1, unit: 'kg', category: 'cupboard' }],
    ['Washing-up liquid', { category: 'household' }],
  ];
  items.forEach(([n, o], i) => memoryStore.seed(`${U}/lists/l1/items`, `i${i}`, item(n, o)));
  memoryStore.seed(`${U}/pantry`, 'p1', pantry('Eggs', { quantity: 2, minQuantity: 4, category: 'dairy_eggs' }));
  memoryStore.seed(`${U}/pantry`, 'p2', pantry('Spinach', { expiryDate: ts(now + DAY), expiryKind: 'use_by', category: 'fruit_veg' }));
  memoryStore.seed(`${U}/pantry`, 'p3', pantry('Rice', { quantity: 2, unit: 'kg', category: 'cupboard' }));
  memoryStore.seed(`${U}/pantry`, 'p4', pantry('Greek yoghurt', { quantity: 2, category: 'dairy_eggs', lastPurchasedAt: ts(now - DAY) }));
  memoryStore.seed(`${U}/pantry`, 'p5', pantry('Chopped tomatoes', { quantity: 0, unit: 'tin', category: 'cupboard' }));
  memoryStore.seed(`${U}/meta`, 'counters', { activeLists: 2, pantryItems: 5 });
  if (kind === 'trip' || kind === 'finished') {
    memoryStore.seed(`${U}/trips`, 't1', {
      listId: 'l1', listName: 'Weekly shop', status: kind === 'finished' ? 'finished' : 'active', startedAt: ts(now), finishedAt: kind === 'finished' ? ts(now) : null, actualTotalPence: null,
      lines: { i0: { outcome: 'collected', quantity: 2, unit: 'l', name: 'Semi-skimmed milk' }, i2: { outcome: 'collected', quantity: 1, unit: 'unit', name: 'Greek yoghurt' }, i1: { outcome: 'substituted', quantity: 1, unit: 'unit', name: 'Wholemeal bread', substituteName: 'Seeded bread' }, i5: { outcome: 'unavailable', quantity: 1, unit: 'unit', name: 'Washing-up liquid' } },
    });
  }
}
