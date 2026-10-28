/**
 * Repository regression tests (user-scoped data model) against the in-memory Firestore.
 * Asserts what is PERSISTED, including the counters Security Rules rely on.
 * Security Rules themselves are tested against the emulator (rules-tests/, CI job "firebase").
 */
import { memoryStore, MemoryTimestamp } from '../../test-utils/memoryFirestore';
import { DataError } from '@/src/data/firestore';
import * as lists from '@/src/data/listsRepository';
import * as pantry from '@/src/data/pantryRepository';
import * as trips from '@/src/data/tripsRepository';

jest.mock('firebase/firestore', () => require('../../test-utils/memoryFirestore').firestoreModule);
jest.mock('@/firebase/config', () => ({ db: {}, auth: null, storage: null, functions: null, isFirebaseConfigured: true, missingFirebaseConfigKeys: [] }));

const U = 'user-1';
const listsPath = `users/${U}/lists`;
const counters = () => memoryStore.get(`users/${U}/meta`, 'counters');

beforeEach(() => memoryStore.reset());

function nextSnapshot<T>(subscribe: (cb: (v: T) => void) => () => void): Promise<T> {
  return new Promise((resolve) => {
    const unsub = subscribe((v) => {
      unsub();
      resolve(v);
    });
  });
}

describe('lists', () => {
  it('creates, renames, archives, unarchives and deletes lists with matching counters', async () => {
    const id = await lists.createList(U, '  Weekly   shop ', { plan: 'free', activeLists: 0 });
    expect(memoryStore.get(listsPath, id)).toMatchObject({ name: 'Weekly shop', archived: false, itemCount: 0, lastItemOp: null });
    expect(memoryStore.get(listsPath, id)!.createdAt).toBeInstanceOf(MemoryTimestamp);
    expect(counters()).toMatchObject({ activeLists: 1, lastOp: { type: 'listCreate', id } });

    await lists.renameList(U, id, 'Big shop');
    expect(memoryStore.get(listsPath, id)!.name).toBe('Big shop');

    const snap = await nextSnapshot<{ data: { id: string; archived: boolean; name: string; itemCount: number; createdAt: number | null; updatedAt: number | null }[] }>((cb) =>
      lists.subscribeLists(U, cb as never, () => {})
    );
    expect(snap.data).toEqual([expect.objectContaining({ id, name: 'Big shop', archived: false })]);
    const list = snap.data[0];

    await lists.setListArchived(U, list, true, { plan: 'free', activeLists: 1 });
    expect(counters()).toMatchObject({ activeLists: 0, lastOp: { type: 'listArchive', id } });
    await lists.setListArchived(U, { ...list, archived: true }, false, { plan: 'free', activeLists: 0 });
    expect(counters()).toMatchObject({ activeLists: 1, lastOp: { type: 'listUnarchive', id } });

    await lists.addItem(U, id, { name: 'Milk', quantity: 1, unit: 'l' }, { plan: 'free', itemsInList: 0 });
    await lists.deleteList(U, { ...list, archived: false });
    expect(memoryStore.paths(`users/${U}/lists`)).toEqual([]);
    expect(counters()).toMatchObject({ activeLists: 0, lastOp: { type: 'listDelete', id } });
  });

  it('enforces the Free list limit before writing and validates names', async () => {
    await expect(lists.createList(U, 'Third', { plan: 'free', activeLists: 2 })).rejects.toMatchObject({ code: 'FREE_LIMIT_REACHED' });
    await expect(lists.createList(U, '   ', { plan: 'free', activeLists: 0 })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(lists.createList(U, 'x'.repeat(41), { plan: 'premium', activeLists: 0 })).rejects.toBeInstanceOf(DataError);
    await expect(lists.createList(U, 'Fine', { plan: 'standard', activeLists: 500 })).resolves.toEqual(expect.any(String));
    expect(memoryStore.paths(listsPath).length).toBe(1);
  });
});

describe('list items', () => {
  it('adds, updates, ticks, prices and removes items; list itemCount tracks adds and removals', async () => {
    const listId = await lists.createList(U, 'Weekly', { plan: 'free', activeLists: 0 });
    const itemId = await lists.addItem(U, listId, { name: ' Whole  Milk ', quantity: 2, unit: 'l', category: 'dairy_eggs' }, { plan: 'free', itemsInList: 0 });
    const itemsPath = `${listsPath}/${listId}/items`;
    expect(memoryStore.get(itemsPath, itemId)).toMatchObject({ name: 'Whole Milk', normalizedName: 'whole milk', quantity: 2, unit: 'l', checked: false, pricePence: null });
    expect(memoryStore.get(listsPath, listId)).toMatchObject({ itemCount: 1, lastItemOp: { type: 'add', id: itemId } });

    await lists.updateItem(U, listId, itemId, { quantity: 3, checked: true, pricePence: 145 });
    expect(memoryStore.get(itemsPath, itemId)).toMatchObject({ quantity: 3, checked: true, pricePence: 145 });
    await lists.updateItem(U, listId, itemId, { pricePence: null });
    expect(memoryStore.get(itemsPath, itemId)).not.toHaveProperty('pricePence');

    await lists.removeItem(U, listId, itemId);
    expect(memoryStore.get(itemsPath, itemId)).toBeUndefined();
    expect(memoryStore.get(listsPath, listId)).toMatchObject({ itemCount: 0, lastItemOp: { type: 'remove', id: itemId } });
  });

  it('rejects invalid input and the 21st Free item', async () => {
    const listId = await lists.createList(U, 'Weekly', { plan: 'free', activeLists: 0 });
    await expect(lists.addItem(U, listId, { name: '', quantity: 1, unit: 'unit' }, { plan: 'free', itemsInList: 0 })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(lists.addItem(U, listId, { name: 'Eggs', quantity: 0, unit: 'unit' }, { plan: 'free', itemsInList: 0 })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(lists.addItem(U, listId, { name: 'Eggs', quantity: 1, unit: 'unit', pricePence: -5 }, { plan: 'free', itemsInList: 0 })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(lists.addItem(U, listId, { name: 'Eggs', quantity: 1, unit: 'unit' }, { plan: 'free', itemsInList: 20 })).rejects.toMatchObject({ code: 'FREE_LIMIT_REACHED' });
    expect(memoryStore.paths(`${listsPath}/${listId}/items`)).toEqual([]);
  });

  it('maps write failures to a friendly offline error and applies nothing (atomic batch)', async () => {
    const listId = await lists.createList(U, 'Weekly', { plan: 'free', activeLists: 0 });
    memoryStore.failNextWrite('unavailable');
    await expect(lists.addItem(U, listId, { name: 'Bread', quantity: 1, unit: 'unit' }, { plan: 'free', itemsInList: 0 })).rejects.toMatchObject({ code: 'OFFLINE' });
    expect(memoryStore.get(listsPath, listId)).toMatchObject({ itemCount: 0 });
  });
});

describe('pantry', () => {
  it('adds, updates (including run-out and expiry) and removes with counters', async () => {
    const expiry = Date.UTC(2026, 10, 2);
    const id = await pantry.addPantryItem(U, { name: 'Rice', quantity: 1, unit: 'kg', minQuantity: 0.5, category: 'cupboard', expiryDate: expiry, expiryKind: 'best_before' }, { plan: 'free', pantryItems: 0 });
    const stored = memoryStore.get(`users/${U}/pantry`, id)!;
    expect(stored).toMatchObject({ name: 'Rice', quantity: 1, unit: 'kg', minQuantity: 0.5, expiryKind: 'best_before' });
    expect((stored.expiryDate as MemoryTimestamp).toMillis()).toBe(expiry);
    expect(counters()).toMatchObject({ pantryItems: 1, lastOp: { type: 'pantryAdd', id } });

    await pantry.updatePantryItem(U, id, { quantity: 0, expiryDate: null });
    expect(memoryStore.get(`users/${U}/pantry`, id)).toMatchObject({ quantity: 0, expiryDate: null, expiryKind: null });
    await expect(pantry.updatePantryItem(U, id, { quantity: -1 })).rejects.toMatchObject({ code: 'VALIDATION' });

    await pantry.removePantryItem(U, id);
    expect(memoryStore.get(`users/${U}/pantry`, id)).toBeUndefined();
    expect(counters()).toMatchObject({ pantryItems: 0, lastOp: { type: 'pantryRemove', id } });
  });

  it('enforces the Free pantry limit', async () => {
    await expect(pantry.addPantryItem(U, { name: 'Oats', quantity: 1, unit: 'bag' }, { plan: 'free', pantryItems: 30 })).rejects.toMatchObject({ code: 'FREE_LIMIT_REACHED' });
  });

  it('computes Running Low, Use Soon, expired and Recently Added signals', () => {
    const now = Date.UTC(2026, 9, 28, 12);
    const day = 86400000;
    const base = { normalizedName: '', unit: 'unit' as const, category: 'other' as const, expiryKind: null, createdAt: now - 30 * day, updatedAt: null, lastPurchasedAt: null };
    const s = pantry.pantrySignals(
      [
        { ...base, id: 'low', name: 'Milk', quantity: 1, minQuantity: 1, expiryDate: null },
        { ...base, id: 'soon', name: 'Spinach', quantity: 1, minQuantity: 0, expiryDate: now + day },
        { ...base, id: 'old', name: 'Yoghurt', quantity: 1, minQuantity: 0, expiryDate: now - 2 * day },
        { ...base, id: 'new', name: 'Pasta', quantity: 3, minQuantity: 0, expiryDate: null, lastPurchasedAt: now - day },
      ],
      now
    );
    expect(s.runningLow.map((i) => i.id)).toEqual(['low']);
    expect(s.useSoon.map((i) => i.id)).toEqual(['soon']);
    expect(s.expired.map((i) => i.id)).toEqual(['old']);
    expect(s.recentlyAdded.map((i) => i.id)).toEqual(['new']);
  });
});

describe('shopping trips', () => {
  it('starts a trip, records outcomes (ticking the list item), and finishes with a user-entered total', async () => {
    const listId = await lists.createList(U, 'Weekly', { plan: 'free', activeLists: 0 });
    const milk = await lists.addItem(U, listId, { name: 'Milk', quantity: 1, unit: 'l' }, { plan: 'free', itemsInList: 0 });
    const bread = await lists.addItem(U, listId, { name: 'Bread', quantity: 1, unit: 'unit' }, { plan: 'free', itemsInList: 1 });
    const tripId = await trips.startTrip(U, { id: listId, name: 'Weekly' });
    const trip = trips.mapTrip(tripId, memoryStore.get(`users/${U}/trips`, tripId)!);
    expect(trip).toMatchObject({ listId, status: 'active', lines: {} });

    await trips.setLine(U, trip, milk, { outcome: 'collected', quantity: 1, unit: 'l' });
    await trips.setLine(U, trip, bread, { outcome: 'unavailable', quantity: 1, unit: 'unit' });
    const itemsPath = `${listsPath}/${listId}/items`;
    expect(memoryStore.get(itemsPath, milk)!.checked).toBe(true);
    expect(memoryStore.get(itemsPath, bread)!.checked).toBe(false);
    await expect(trips.setLine(U, trip, bread, { outcome: 'substituted', quantity: 1, unit: 'unit' })).rejects.toMatchObject({ code: 'VALIDATION' });

    const stored = trips.mapTrip(tripId, memoryStore.get(`users/${U}/trips`, tripId)!);
    expect(stored.lines).toEqual({ [milk]: { outcome: 'collected', quantity: 1, unit: 'l' }, [bread]: { outcome: 'unavailable', quantity: 1, unit: 'unit' } });
    expect(trips.tripProgress(stored, [milk, bread])).toEqual({ done: 2, total: 2, ratio: 1 });

    await trips.finishTrip(U, stored, 2350);
    expect(memoryStore.get(`users/${U}/trips`, tripId)).toMatchObject({ status: 'finished', actualTotalPence: 2350 });
    await expect(trips.finishTrip(U, stored, -1)).rejects.toMatchObject({ code: 'VALIDATION' });
  });
});
