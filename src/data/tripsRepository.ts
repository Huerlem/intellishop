/**
 * Shopping trips (Figma P07 Shopping Mode → P08 Finish Shopping), stored per user:
 *   users/{uid}/trips/{tripId} { listId, listName, status, startedAt, finishedAt, lines, actualTotalPence }
 * `lines` is a map keyed by list-item ID with the in-store outcome. Ticking an item off in
 * Shopping Mode also marks the list item as checked, so the list stays in sync.
 * Trips are recorded on every plan; viewing history is a paid feature (decision D11).
 */
import { doc, onSnapshot, orderBy, query, serverTimestamp, where, writeBatch, collection, limit, deleteField } from 'firebase/firestore';

import { normaliseUnit, validateQuantity, type CanonicalUnit } from '@/shared/domain/units';
import { DataError, mapFirestoreError, num, refs, requireDb, str, toMillis, commitBatch } from './firestore';

export type TripOutcome = 'collected' | 'substituted' | 'unavailable';

export type TripLine = { outcome: TripOutcome; quantity: number; unit: CanonicalUnit; substituteName?: string; /** item name at the time of shopping */ name?: string };

/** What the Pantry Update step did with a trip line (stored on the finished trip; undoable). */
export type PantryAppliedEntry =
  | { status: 'applied'; via: 'auto' | 'review'; kind: 'increase'; pantryItemId: string; prevQuantity: number; prevUnit: CanonicalUnit; prevLastPurchasedAt: number | null }
  | { status: 'applied'; via: 'auto' | 'review'; kind: 'add'; pantryItemId: string }
  | { status: 'undone' | 'dismissed' };

export type Trip = {
  id: string;
  listId: string;
  listName: string;
  status: 'active' | 'finished';
  startedAt: number | null;
  finishedAt: number | null;
  lines: Record<string, TripLine>;
  actualTotalPence: number | null;
  pantryApplied: Record<string, PantryAppliedEntry>;
};

const tripsCol = (uid: string) => collection(requireDb(), 'users', uid, 'trips');
const tripDoc = (uid: string, id: string) => doc(requireDb(), 'users', uid, 'trips', id);

function mapLines(raw: unknown): Record<string, TripLine> {
  const out: Record<string, TripLine> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, v] of Object.entries(raw as Record<string, Record<string, unknown>>)) {
    const outcome = v?.outcome;
    if (outcome !== 'collected' && outcome !== 'substituted' && outcome !== 'unavailable') continue;
    out[id] = {
      outcome,
      quantity: num(v.quantity, 1),
      unit: normaliseUnit(str(v.unit)) ?? 'unit',
      ...(typeof v.substituteName === 'string' ? { substituteName: v.substituteName } : {}),
      ...(typeof v.name === 'string' ? { name: v.name } : {}),
    };
  }
  return out;
}

export function mapTrip(id: string, d: Record<string, unknown>): Trip {
  return {
    id,
    listId: str(d.listId),
    listName: str(d.listName),
    status: d.status === 'finished' ? 'finished' : 'active',
    startedAt: toMillis(d.startedAt),
    finishedAt: toMillis(d.finishedAt),
    lines: mapLines(d.lines),
    actualTotalPence: typeof d.actualTotalPence === 'number' ? d.actualTotalPence : null,
    pantryApplied: mapApplied(d.pantryApplied),
  };
}

function mapApplied(raw: unknown): Record<string, PantryAppliedEntry> {
  const out: Record<string, PantryAppliedEntry> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, v] of Object.entries(raw as Record<string, Record<string, unknown>>)) {
    if (!v || typeof v !== 'object') continue;
    if (v.status === 'undone' || v.status === 'dismissed') out[id] = { status: v.status };
    else if (v.status === 'applied' && v.kind === 'add' && typeof v.pantryItemId === 'string') out[id] = { status: 'applied', via: v.via === 'review' ? 'review' : 'auto', kind: 'add', pantryItemId: v.pantryItemId };
    else if (v.status === 'applied' && v.kind === 'increase' && typeof v.pantryItemId === 'string')
      out[id] = {
        status: 'applied',
        via: v.via === 'review' ? 'review' : 'auto',
        kind: 'increase',
        pantryItemId: v.pantryItemId,
        prevQuantity: num(v.prevQuantity, 0),
        prevUnit: normaliseUnit(str(v.prevUnit)) ?? 'unit',
        prevLastPurchasedAt: typeof v.prevLastPurchasedAt === 'number' ? v.prevLastPurchasedAt : null,
      };
  }
  return out;
}

export function subscribeActiveTrips(uid: string, onData: (trips: Trip[]) => void, onError: (e: DataError) => void) {
  return onSnapshot(
    query(tripsCol(uid), where('status', '==', 'active'), orderBy('startedAt', 'desc'), limit(5)),
    (snap) => onData(snap.docs.map((d) => mapTrip(d.id, d.data()))),
    (error) => onError(mapFirestoreError(error))
  );
}

/** Last few finished trips (Home: "Pantry update waiting"). */
export function subscribeRecentFinishedTrips(uid: string, onData: (trips: Trip[]) => void, onError: (e: DataError) => void) {
  return onSnapshot(
    query(tripsCol(uid), where('status', '==', 'finished'), orderBy('finishedAt', 'desc'), limit(3)),
    (snap) => onData(snap.docs.map((d) => mapTrip(d.id, d.data()))),
    (error) => onError(mapFirestoreError(error))
  );
}

/** Lines of a finished trip that still need a Pantry decision (not applied, undone or dismissed). */
export function pendingPantryLines(trip: Trip): string[] {
  return Object.entries(trip.lines)
    .filter(([id, l]) => l.outcome !== 'unavailable' && !trip.pantryApplied[id])
    .map(([id]) => id);
}

export function subscribeTrip(uid: string, tripId: string, onData: (t: Trip | null) => void, onError: (e: DataError) => void) {
  return onSnapshot(
    tripDoc(uid, tripId),
    (snap) => onData(snap.exists() ? mapTrip(snap.id, snap.data()) : null),
    (error) => onError(mapFirestoreError(error))
  );
}

export async function startTrip(uid: string, list: { id: string; name: string }): Promise<string> {
  const ref = doc(tripsCol(uid));
  const batch = writeBatch(requireDb());
  batch.set(ref, { listId: list.id, listName: list.name, status: 'active', startedAt: serverTimestamp(), finishedAt: null, lines: {}, actualTotalPence: null });
  await commitBatch(batch);
  return ref.id;
}

/** Records an in-store outcome and keeps the list item's checked state in sync. */
export async function setLine(uid: string, trip: Trip, itemId: string, line: TripLine | null): Promise<void> {
  if (line) {
    const qErr = validateQuantity(line.quantity);
    if (qErr) throw new DataError('VALIDATION', qErr, { field: 'quantity' });
    if (line.outcome === 'substituted' && !line.substituteName?.trim()) throw new DataError('VALIDATION', 'Enter what you bought instead.', { field: 'substituteName' });
  }
  const batch = writeBatch(requireDb());
  batch.update(tripDoc(uid, trip.id), {
    [`lines.${itemId}`]: line
      ? {
          outcome: line.outcome,
          quantity: line.quantity,
          unit: line.unit,
          ...(line.substituteName ? { substituteName: line.substituteName.trim().slice(0, 60) } : {}),
          ...(line.name ? { name: line.name.slice(0, 60) } : {}),
        }
      : deleteField(),
  });
  batch.update(refs.item(uid, trip.listId, itemId), { checked: line !== null && line.outcome !== 'unavailable', updatedAt: serverTimestamp() });
  await commitBatch(batch);
}

export async function finishTrip(uid: string, trip: Trip, actualTotalPence: number | null): Promise<void> {
  if (actualTotalPence != null && (!Number.isInteger(actualTotalPence) || actualTotalPence < 0 || actualTotalPence > 10_000_000)) {
    throw new DataError('VALIDATION', 'Enter a valid total.', { field: 'total' });
  }
  const batch = writeBatch(requireDb());
  batch.update(tripDoc(uid, trip.id), { status: 'finished', finishedAt: serverTimestamp(), actualTotalPence });
  await commitBatch(batch);
}

export async function cancelTrip(uid: string, trip: Trip): Promise<void> {
  const batch = writeBatch(requireDb());
  batch.delete(tripDoc(uid, trip.id));
  await commitBatch(batch);
}

export function tripProgress(trip: Trip, itemIds: string[]) {
  const done = itemIds.filter((id) => trip.lines[id]).length;
  return { done, total: itemIds.length, ratio: itemIds.length ? done / itemIds.length : 0 };
}

/** Converts trip lines into the input of the Pantry Update planner (shared/shopping/pantryUpdate). */
export function tripLinesForPantry(trip: Trip, items: { id: string; name: string }[]) {
  const names = new Map(items.map((i) => [i.id, i.name]));
  return Object.entries(trip.lines)
    .map(([listItemId, l]) => ({ listItemId, name: l.name ?? names.get(listItemId) ?? '', outcome: l.outcome, quantity: l.quantity, unit: l.unit, substituteName: l.substituteName }))
    .filter((l) => l.name);
}

/** Re-exported for screens that only need ordering. */
export const tripsQueryOrder = orderBy;
