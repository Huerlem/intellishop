/**
 * Shopping lists and items, stored per user:
 *   users/{uid}/lists/{listId}                 { name, archived, itemCount, lastItemOp, createdAt, updatedAt }
 *   users/{uid}/lists/{listId}/items/{itemId}  { name, normalizedName, quantity, unit, category, notes, checked, pricePence, … }
 *   users/{uid}/meta/counters                  { activeLists, pantryItems, lastOp, updatedAt }
 *
 * Counters exist so Security Rules can enforce Free-plan limits. Every counter change is made
 * in the same atomic batch as the document it counts, and records `lastOp` so the rules can
 * check that the counter moved by exactly one for a real create/delete/archive.
 */
import {
  deleteField,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import type { DocumentData, UpdateData } from 'firebase/firestore';

import { cleanDisplayName, normaliseCategory, normaliseItemName, validateItemName, validateListName, MAX_NOTES_LENGTH } from '@/shared/domain/items';
import { normaliseUnit, validateQuantity } from '@/shared/domain/units';
import { canAddListItem, canCreateList, type PlanId } from '@/shared/entitlements/plans';
import { DataError, mapFirestoreError, num, refs, requireDb, str, toMillis, commitBatch, type Data } from './firestore';
import type { ItemInput, ListItem, ShoppingList, Snapshot } from './types';

export function mapList(id: string, d: Data): ShoppingList {
  return {
    id,
    name: str(d.name, 'Untitled list'),
    archived: d.archived === true,
    itemCount: num(d.itemCount),
    createdAt: toMillis(d.createdAt),
    updatedAt: toMillis(d.updatedAt),
  };
}

export function mapItem(id: string, d: Data): ListItem {
  return {
    id,
    name: str(d.name),
    normalizedName: str(d.normalizedName) || normaliseItemName(str(d.name)),
    quantity: num(d.quantity, 1),
    unit: normaliseUnit(str(d.unit)) ?? 'unit',
    category: normaliseCategory(str(d.category)),
    notes: str(d.notes),
    checked: d.checked === true,
    pricePence: typeof d.pricePence === 'number' ? d.pricePence : null,
    createdAt: toMillis(d.createdAt),
    updatedAt: toMillis(d.updatedAt),
  };
}

function validateItem(input: ItemInput) {
  const nameError = validateItemName(input.name);
  if (nameError) throw new DataError('VALIDATION', nameError, { field: 'name' });
  const qtyError = validateQuantity(input.quantity);
  if (qtyError) throw new DataError('VALIDATION', qtyError, { field: 'quantity' });
  if (input.notes && input.notes.length > MAX_NOTES_LENGTH) throw new DataError('VALIDATION', `Notes must be ${MAX_NOTES_LENGTH} characters or fewer.`, { field: 'notes' });
  if (input.pricePence != null && (!Number.isInteger(input.pricePence) || input.pricePence < 0 || input.pricePence > 1_000_000)) {
    throw new DataError('VALIDATION', 'Enter a valid price.', { field: 'price' });
  }
}

export function subscribeLists(uid: string, onData: (s: Snapshot<ShoppingList[]>) => void, onError: (e: DataError) => void): () => void {
  return onSnapshot(
    query(refs.lists(uid), orderBy('updatedAt', 'desc')),
    { includeMetadataChanges: true },
    (snap) => onData({ data: snap.docs.map((d) => mapList(d.id, d.data())), sync: { fromCache: snap.metadata.fromCache, hasPendingWrites: snap.metadata.hasPendingWrites } }),
    (error) => onError(mapFirestoreError(error))
  );
}

export function subscribeItems(uid: string, listId: string, onData: (s: Snapshot<ListItem[]>) => void, onError: (e: DataError) => void): () => void {
  return onSnapshot(
    query(refs.items(uid, listId), orderBy('createdAt', 'asc')),
    { includeMetadataChanges: true },
    (snap) => onData({ data: snap.docs.map((d) => mapItem(d.id, d.data())), sync: { fromCache: snap.metadata.fromCache, hasPendingWrites: snap.metadata.hasPendingWrites } }),
    (error) => onError(mapFirestoreError(error))
  );
}

/** Writes are not awaited for server acknowledgement when offline: Firestore queues them. */
async function commit(batch: ReturnType<typeof writeBatch>) {
  await commitBatch(batch);
}

export async function createList(uid: string, name: string, ctx: { plan: PlanId; activeLists: number }): Promise<string> {
  const error = validateListName(name);
  if (error) throw new DataError('VALIDATION', error, { field: 'name' });
  const limit = canCreateList(ctx.plan, ctx.activeLists);
  if (!limit.allowed) throw new DataError('FREE_LIMIT_REACHED', `The Free plan includes up to ${limit.limit} active lists.`, { limit: limit.limit, kind: 'lists' });
  const db = requireDb();
  const listRef = doc(refs.lists(uid));
  const batch = writeBatch(db);
  batch.set(listRef, { name: cleanDisplayName(name), archived: false, itemCount: 0, lastItemOp: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  batch.set(refs.counters(uid), { activeLists: increment(1), lastOp: { type: 'listCreate', id: listRef.id }, updatedAt: serverTimestamp() }, { merge: true });
  await commit(batch);
  return listRef.id;
}

export async function renameList(uid: string, listId: string, name: string): Promise<void> {
  const error = validateListName(name);
  if (error) throw new DataError('VALIDATION', error, { field: 'name' });
  const batch = writeBatch(requireDb());
  batch.update(refs.list(uid, listId), { name: cleanDisplayName(name), updatedAt: serverTimestamp() });
  await commit(batch);
}

export async function setListArchived(uid: string, list: ShoppingList, archived: boolean, ctx: { plan: PlanId; activeLists: number }): Promise<void> {
  if (list.archived === archived) return;
  if (!archived) {
    const limit = canCreateList(ctx.plan, ctx.activeLists);
    if (!limit.allowed) throw new DataError('FREE_LIMIT_REACHED', `The Free plan includes up to ${limit.limit} active lists.`, { limit: limit.limit, kind: 'lists' });
  }
  const batch = writeBatch(requireDb());
  batch.update(refs.list(uid, list.id), { archived, updatedAt: serverTimestamp() });
  batch.set(refs.counters(uid), { activeLists: increment(archived ? -1 : 1), lastOp: { type: archived ? 'listArchive' : 'listUnarchive', id: list.id }, updatedAt: serverTimestamp() }, { merge: true });
  await commit(batch);
}

const BATCH_CHUNK = 400;

export async function deleteList(uid: string, list: ShoppingList): Promise<void> {
  const db = requireDb();
  try {
    const items = await getDocs(refs.items(uid, list.id));
    const ids = items.docs.map((d) => d.id);
    // Items first (in chunks), then the list and its counter in one final batch.
    for (let i = 0; i < ids.length; i += BATCH_CHUNK) {
      const batch = writeBatch(db);
      for (const id of ids.slice(i, i + BATCH_CHUNK)) batch.delete(refs.item(uid, list.id, id));
      await batch.commit();
    }
    const batch = writeBatch(db);
    batch.delete(refs.list(uid, list.id));
    if (!list.archived) {
      batch.set(refs.counters(uid), { activeLists: increment(-1), lastOp: { type: 'listDelete', id: list.id }, updatedAt: serverTimestamp() }, { merge: true });
    }
    await batch.commit();
  } catch (error) {
    throw mapFirestoreError(error);
  }
}

export async function addItem(uid: string, listId: string, input: ItemInput, ctx: { plan: PlanId; itemsInList: number }): Promise<string> {
  validateItem(input);
  const limit = canAddListItem(ctx.plan, ctx.itemsInList);
  if (!limit.allowed) throw new DataError('FREE_LIMIT_REACHED', `The Free plan includes up to ${limit.limit} items per list.`, { limit: limit.limit, kind: 'items' });
  const db = requireDb();
  const itemRef = doc(refs.items(uid, listId));
  const name = cleanDisplayName(input.name);
  const batch = writeBatch(db);
  batch.set(itemRef, {
    name,
    normalizedName: normaliseItemName(name),
    quantity: input.quantity,
    unit: input.unit,
    category: input.category ?? 'other',
    notes: input.notes?.trim() ?? '',
    checked: false,
    pricePence: input.pricePence ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.update(refs.list(uid, listId), { itemCount: increment(1), lastItemOp: { type: 'add', id: itemRef.id }, updatedAt: serverTimestamp() });
  await commit(batch);
  return itemRef.id;
}

export type ItemPatch = Partial<Pick<ListItem, 'name' | 'quantity' | 'unit' | 'category' | 'notes' | 'checked' | 'pricePence'>>;

export async function updateItem(uid: string, listId: string, itemId: string, patch: ItemPatch): Promise<void> {
  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.name !== undefined) {
    const e = validateItemName(patch.name);
    if (e) throw new DataError('VALIDATION', e, { field: 'name' });
    data.name = cleanDisplayName(patch.name);
    data.normalizedName = normaliseItemName(patch.name);
  }
  if (patch.quantity !== undefined) {
    const e = validateQuantity(patch.quantity);
    if (e) throw new DataError('VALIDATION', e, { field: 'quantity' });
    data.quantity = patch.quantity;
  }
  if (patch.unit !== undefined) data.unit = patch.unit;
  if (patch.category !== undefined) data.category = patch.category;
  if (patch.notes !== undefined) {
    if (patch.notes.length > MAX_NOTES_LENGTH) throw new DataError('VALIDATION', `Notes must be ${MAX_NOTES_LENGTH} characters or fewer.`);
    data.notes = patch.notes.trim();
  }
  if (patch.checked !== undefined) data.checked = patch.checked;
  if (patch.pricePence !== undefined) data.pricePence = patch.pricePence === null ? deleteField() : patch.pricePence;
  const batch = writeBatch(requireDb());
  batch.update(refs.item(uid, listId, itemId), data as UpdateData<DocumentData>);
  await commit(batch);
}

export async function removeItem(uid: string, listId: string, itemId: string): Promise<void> {
  const batch = writeBatch(requireDb());
  batch.delete(refs.item(uid, listId, itemId));
  batch.update(refs.list(uid, listId), { itemCount: increment(-1), lastItemOp: { type: 'remove', id: itemId }, updatedAt: serverTimestamp() });
  await commit(batch);
}
