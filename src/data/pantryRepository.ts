/**
 * Pantry, stored per user: users/{uid}/pantry/{itemId}. Counted in users/{uid}/meta/counters
 * (pantryItems) for the Free-plan limit — see listsRepository.ts for the counter pattern.
 */
import { deleteField, doc, onSnapshot, orderBy, query, serverTimestamp, Timestamp, writeBatch, increment } from 'firebase/firestore';
import type { DocumentData, UpdateData } from 'firebase/firestore';

import { cleanDisplayName, normaliseCategory, normaliseItemName, validateItemName } from '@/shared/domain/items';
import { normaliseUnit } from '@/shared/domain/units';
import { canAddPantryItem, type PlanId } from '@/shared/entitlements/plans';
import { DataError, mapFirestoreError, num, refs, requireDb, str, toMillis, commitBatch, type Data } from './firestore';
import type { PantryInput, PantryItem, Snapshot } from './types';
import type { PantryAppliedEntry } from './tripsRepository';
import type { CanonicalUnit } from '@/shared/domain/units';

export function mapPantryItem(id: string, d: Data): PantryItem {
  const expiryKind = d.expiryKind === 'use_by' || d.expiryKind === 'best_before' ? d.expiryKind : null;
  return {
    id,
    name: str(d.name),
    normalizedName: str(d.normalizedName) || normaliseItemName(str(d.name)),
    quantity: num(d.quantity, 0),
    unit: normaliseUnit(str(d.unit)) ?? 'unit',
    minQuantity: num(d.minQuantity, 0),
    category: normaliseCategory(str(d.category)),
    expiryDate: toMillis(d.expiryDate),
    expiryKind,
    lastPurchasedAt: toMillis(d.lastPurchasedAt),
    createdAt: toMillis(d.createdAt),
    updatedAt: toMillis(d.updatedAt),
  };
}

function validate(input: Partial<PantryInput>, partial: boolean) {
  if (!partial || input.name !== undefined) {
    const e = validateItemName(input.name);
    if (e) throw new DataError('VALIDATION', e, { field: 'name' });
  }
  if (!partial || input.quantity !== undefined) {
    // Pantry quantity may be 0 ("run out") but never negative.
    if (typeof input.quantity !== 'number' || !Number.isFinite(input.quantity) || input.quantity < 0 || input.quantity > 100000) {
      throw new DataError('VALIDATION', 'Enter a quantity of 0 or more.', { field: 'quantity' });
    }
  }
  if (input.minQuantity !== undefined && (typeof input.minQuantity !== 'number' || input.minQuantity < 0 || input.minQuantity > 100000)) {
    throw new DataError('VALIDATION', 'Enter a minimum of 0 or more.', { field: 'minQuantity' });
  }
}

export function subscribePantry(uid: string, onData: (s: Snapshot<PantryItem[]>) => void, onError: (e: DataError) => void): () => void {
  return onSnapshot(
    query(refs.pantry(uid), orderBy('name', 'asc')),
    { includeMetadataChanges: true },
    (snap) => onData({ data: snap.docs.map((d) => mapPantryItem(d.id, d.data())), sync: { fromCache: snap.metadata.fromCache, hasPendingWrites: snap.metadata.hasPendingWrites } }),
    (error) => onError(mapFirestoreError(error))
  );
}

const ts = (ms: number | null | undefined) => (ms == null ? null : Timestamp.fromMillis(ms));

export async function addPantryItem(uid: string, input: PantryInput, ctx: { plan: PlanId; pantryItems: number }): Promise<string> {
  validate(input, false);
  const limit = canAddPantryItem(ctx.plan, ctx.pantryItems);
  if (!limit.allowed) throw new DataError('FREE_LIMIT_REACHED', `The Free plan includes up to ${limit.limit} Pantry items.`, { limit: limit.limit, kind: 'pantry' });
  const db = requireDb();
  const itemRef = doc(refs.pantry(uid));
  const name = cleanDisplayName(input.name);
  const batch = writeBatch(db);
  batch.set(itemRef, {
    name,
    normalizedName: normaliseItemName(name),
    quantity: input.quantity,
    unit: input.unit,
    minQuantity: input.minQuantity ?? 0,
    category: input.category ?? 'other',
    expiryDate: ts(input.expiryDate),
    expiryKind: input.expiryDate != null ? (input.expiryKind ?? 'best_before') : null,
    lastPurchasedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(refs.counters(uid), { pantryItems: increment(1), lastOp: { type: 'pantryAdd', id: itemRef.id }, updatedAt: serverTimestamp() }, { merge: true });
  await commitBatch(batch);
  return itemRef.id;
}

export async function updatePantryItem(uid: string, itemId: string, patch: Partial<PantryInput> & { lastPurchasedAt?: number | null }): Promise<void> {
  validate(patch, true);
  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.name !== undefined) {
    data.name = cleanDisplayName(patch.name);
    data.normalizedName = normaliseItemName(patch.name);
  }
  if (patch.quantity !== undefined) data.quantity = patch.quantity;
  if (patch.unit !== undefined) data.unit = patch.unit;
  if (patch.minQuantity !== undefined) data.minQuantity = patch.minQuantity;
  if (patch.category !== undefined) data.category = patch.category;
  if (patch.expiryDate !== undefined) {
    data.expiryDate = patch.expiryDate === null ? null : ts(patch.expiryDate);
    data.expiryKind = patch.expiryDate === null ? null : (patch.expiryKind ?? 'best_before');
  } else if (patch.expiryKind !== undefined) data.expiryKind = patch.expiryKind;
  if (patch.lastPurchasedAt !== undefined) data.lastPurchasedAt = patch.lastPurchasedAt === null ? deleteField() : ts(patch.lastPurchasedAt);
  const batch = writeBatch(requireDb());
  batch.update(refs.pantryItem(uid, itemId), data as UpdateData<DocumentData>);
  await commitBatch(batch);
}

export async function removePantryItem(uid: string, itemId: string): Promise<void> {
  const batch = writeBatch(requireDb());
  batch.delete(refs.pantryItem(uid, itemId));
  batch.set(refs.counters(uid), { pantryItems: increment(-1), lastOp: { type: 'pantryRemove', id: itemId }, updatedAt: serverTimestamp() }, { merge: true });
  await commitBatch(batch);
}

export { DAY_MS, daysUntil, pantrySignals } from './pantrySignals';

// ---------------------------------------------------------------------------------------
// Pantry Update after a shopping trip (Figma P09). Each change is written in ONE batch together
// with a record on the finished trip (`pantryApplied.{lineId}`), so a change is never applied
// twice and can be undone. Only additive changes exist here (shared/shopping/pantryUpdate.ts).
// ---------------------------------------------------------------------------------------


const tripRef = (uid: string, tripId: string) => doc(requireDb(), 'users', uid, 'trips', tripId);

export type TripPantryChange =
  | { kind: 'increase'; item: Pick<PantryItem, 'id' | 'quantity' | 'unit' | 'lastPurchasedAt'>; to: { amount: number; unit: CanonicalUnit } }
  | { kind: 'add'; input: PantryInput };

export async function applyTripPantryChange(
  uid: string,
  tripId: string,
  lineId: string,
  change: TripPantryChange,
  ctx: { plan: PlanId; pantryItems: number; now: number; via: 'auto' | 'review' }
): Promise<PantryAppliedEntry> {
  const db = requireDb();
  const batch = writeBatch(db);
  let entry: PantryAppliedEntry;
  if (change.kind === 'increase') {
    if (!(change.to.amount >= 0) || change.to.amount > 100000) throw new DataError('VALIDATION', 'Enter a quantity of 0 or more.', { field: 'quantity' });
    batch.update(refs.pantryItem(uid, change.item.id), {
      quantity: change.to.amount,
      unit: change.to.unit,
      lastPurchasedAt: Timestamp.fromMillis(ctx.now),
      updatedAt: serverTimestamp(),
    });
    entry = { status: 'applied', via: ctx.via, kind: 'increase', pantryItemId: change.item.id, prevQuantity: change.item.quantity, prevUnit: change.item.unit, prevLastPurchasedAt: change.item.lastPurchasedAt };
  } else {
    validate(change.input, false);
    const limit = canAddPantryItem(ctx.plan, ctx.pantryItems);
    if (!limit.allowed) throw new DataError('FREE_LIMIT_REACHED', `The Free plan includes up to ${limit.limit} Pantry items.`, { limit: limit.limit, kind: 'pantry' });
    const itemRef = doc(refs.pantry(uid));
    const name = cleanDisplayName(change.input.name);
    batch.set(itemRef, {
      name,
      normalizedName: normaliseItemName(name),
      quantity: change.input.quantity,
      unit: change.input.unit,
      minQuantity: change.input.minQuantity ?? 0,
      category: change.input.category ?? 'other',
      expiryDate: null,
      expiryKind: null,
      lastPurchasedAt: Timestamp.fromMillis(ctx.now),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(refs.counters(uid), { pantryItems: increment(1), lastOp: { type: 'pantryAdd', id: itemRef.id }, updatedAt: serverTimestamp() }, { merge: true });
    entry = { status: 'applied', via: ctx.via, kind: 'add', pantryItemId: itemRef.id };
  }
  batch.update(tripRef(uid, tripId), { [`pantryApplied.${lineId}`]: entry });
  await commitBatch(batch);
  return entry;
}

/** Reverts an applied change: restores the previous quantity, or removes an added item. */
export async function undoTripPantryChange(uid: string, tripId: string, lineId: string, entry: PantryAppliedEntry): Promise<void> {
  if (entry.status !== 'applied') return;
  const batch = writeBatch(requireDb());
  if (entry.kind === 'increase') {
    batch.update(refs.pantryItem(uid, entry.pantryItemId), {
      quantity: entry.prevQuantity,
      unit: entry.prevUnit,
      lastPurchasedAt: entry.prevLastPurchasedAt == null ? null : Timestamp.fromMillis(entry.prevLastPurchasedAt),
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.delete(refs.pantryItem(uid, entry.pantryItemId));
    batch.set(refs.counters(uid), { pantryItems: increment(-1), lastOp: { type: 'pantryRemove', id: entry.pantryItemId }, updatedAt: serverTimestamp() }, { merge: true });
  }
  batch.update(tripRef(uid, tripId), { [`pantryApplied.${lineId}`]: { status: 'undone' } });
  await commitBatch(batch);
}

/** Records that the user chose not to add a reviewed line to the Pantry. Changes no Pantry data. */
export async function dismissTripPantryLine(uid: string, tripId: string, lineId: string): Promise<void> {
  const batch = writeBatch(requireDb());
  batch.update(tripRef(uid, tripId), { [`pantryApplied.${lineId}`]: { status: 'dismissed' } });
  await commitBatch(batch);
}
