/**
 * Pantry, stored per user: users/{uid}/pantry/{itemId}. Counted in users/{uid}/meta/counters
 * (pantryItems) for the Free-plan limit — see listsRepository.ts for the counter pattern.
 */
import { deleteField, doc, onSnapshot, orderBy, query, serverTimestamp, Timestamp, writeBatch, increment } from 'firebase/firestore';

import { cleanDisplayName, normaliseCategory, normaliseItemName, validateItemName } from '@/shared/domain/items';
import { normaliseUnit } from '@/shared/domain/units';
import { canAddPantryItem, type PlanId } from '@/shared/entitlements/plans';
import { DataError, mapFirestoreError, num, refs, requireDb, str, toMillis, type Data } from './firestore';
import type { PantryInput, PantryItem, Snapshot } from './types';

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
  try {
    await batch.commit();
  } catch (error) {
    throw mapFirestoreError(error);
  }
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
  batch.update(refs.pantryItem(uid, itemId), data);
  try {
    await batch.commit();
  } catch (error) {
    throw mapFirestoreError(error);
  }
}

export async function removePantryItem(uid: string, itemId: string): Promise<void> {
  const batch = writeBatch(requireDb());
  batch.delete(refs.pantryItem(uid, itemId));
  batch.set(refs.counters(uid), { pantryItems: increment(-1), lastOp: { type: 'pantryRemove', id: itemId }, updatedAt: serverTimestamp() }, { merge: true });
  try {
    await batch.commit();
  } catch (error) {
    throw mapFirestoreError(error);
  }
}

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Pantry signals for Home and Pantry screens (Figma P01 "Today's Signals", P10 sections). */
export function pantrySignals(items: PantryItem[], now: number) {
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const t0 = startToday.getTime();
  const runningLow = items.filter((i) => i.minQuantity > 0 && i.quantity <= i.minQuantity);
  const expired = items.filter((i) => i.expiryDate != null && i.expiryDate < t0);
  const useSoon = items
    .filter((i) => i.expiryDate != null && i.expiryDate >= t0 && i.expiryDate < t0 + 4 * DAY_MS)
    .sort((a, b) => (a.expiryDate ?? 0) - (b.expiryDate ?? 0));
  const recentlyAdded = items
    .filter((i) => (i.lastPurchasedAt ?? i.createdAt ?? 0) >= now - 7 * DAY_MS)
    .sort((a, b) => (b.lastPurchasedAt ?? b.createdAt ?? 0) - (a.lastPurchasedAt ?? a.createdAt ?? 0));
  return { runningLow, useSoon, expired, recentlyAdded };
}

export function daysUntil(expiry: number, now: number): number {
  const a = new Date(now);
  a.setHours(0, 0, 0, 0);
  const b = new Date(expiry);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}
