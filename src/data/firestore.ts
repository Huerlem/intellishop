/**
 * Thin helpers shared by the repositories: database access, paths, timestamp conversion and
 * typed errors. Every path is user-scoped (`users/{uid}/…`) so Security Rules can express
 * ownership by path (firestore.rules).
 */
import { collection, doc, type DocumentData, type Firestore, type WriteBatch } from 'firebase/firestore';

import { db } from '@/firebase/config';

export class DataError extends Error {
  constructor(
    public readonly code:
      | 'NOT_CONFIGURED'
      | 'NOT_SIGNED_IN'
      | 'VALIDATION'
      | 'FREE_LIMIT_REACHED'
      | 'NOT_FOUND'
      | 'PERMISSION_DENIED'
      | 'OFFLINE'
      | 'UNKNOWN',
    message: string,
    public readonly detail?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DataError';
  }
}

export function requireDb(): Firestore {
  if (!db) throw new DataError('NOT_CONFIGURED', 'The app is not connected to its database.');
  return db as Firestore;
}

export function requireUid(uid: string | null | undefined): string {
  if (!uid) throw new DataError('NOT_SIGNED_IN', 'Please sign in again.');
  return uid;
}

export const refs = {
  user: (uid: string) => doc(requireDb(), 'users', uid),
  counters: (uid: string) => doc(requireDb(), 'users', uid, 'meta', 'counters'),
  lists: (uid: string) => collection(requireDb(), 'users', uid, 'lists'),
  list: (uid: string, listId: string) => doc(requireDb(), 'users', uid, 'lists', listId),
  items: (uid: string, listId: string) => collection(requireDb(), 'users', uid, 'lists', listId, 'items'),
  item: (uid: string, listId: string, itemId: string) => doc(requireDb(), 'users', uid, 'lists', listId, 'items', itemId),
  pantry: (uid: string) => collection(requireDb(), 'users', uid, 'pantry'),
  pantryItem: (uid: string, itemId: string) => doc(requireDb(), 'users', uid, 'pantry', itemId),
  favourites: (uid: string) => collection(requireDb(), 'users', uid, 'favourites'),
  entitlement: (uid: string) => doc(requireDb(), 'entitlements', uid),
  usage: (uid: string) => doc(requireDb(), 'usage', uid),
};

/** Converts Firestore Timestamps, Dates and epoch numbers to epoch ms. */
export function toMillis(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  const v = value as { toMillis?: () => number; toDate?: () => Date };
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v.toDate === 'function') return v.toDate().getTime();
  return null;
}

export const num = (v: unknown, fallback = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
export const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

/** Maps Firebase error codes to user-facing data errors. Never includes data values. */
export function mapFirestoreError(error: unknown): DataError {
  if (error instanceof DataError) return error;
  const code = (error as { code?: string })?.code ?? '';
  if (code.endsWith('permission-denied')) return new DataError('PERMISSION_DENIED', 'You do not have permission to do that. If you are on the Free plan, you may have reached a limit.');
  if (code.endsWith('not-found')) return new DataError('NOT_FOUND', 'This item no longer exists.');
  if (code.endsWith('unavailable')) return new DataError('OFFLINE', 'You appear to be offline. Try again when you are connected.');
  return new DataError('UNKNOWN', 'Something went wrong. Please try again.');
}

export type Data = DocumentData;

// ---------------------------------------------------------------------------------------
// Offline-aware commits. With the Firestore JS SDK, `commit()` resolves only when the server
// acknowledges the write; offline it stays pending while the change already shows locally
// (latency compensation). Screens must not hang on that, so a commit counts as "queued" after
// a short wait. A queued write that the server later rejects is rolled back by Firestore and
// reported through `onLateWriteError` so the app can tell the user (AppDataProvider).
// ---------------------------------------------------------------------------------------

type LateWriteListener = (error: DataError) => void;
const lateWriteListeners = new Set<LateWriteListener>();

export function onLateWriteError(listener: LateWriteListener): () => void {
  lateWriteListeners.add(listener);
  return () => void lateWriteListeners.delete(listener);
}

export const QUEUED_WRITE_WAIT_MS = 1500;

export async function commitBatch(batch: WriteBatch, waitMs = QUEUED_WRITE_WAIT_MS): Promise<'confirmed' | 'queued'> {
  const pending = batch.commit();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const queued = new Promise<'queued'>((resolve) => {
    timer = setTimeout(() => resolve('queued'), waitMs);
  });
  try {
    const result = await Promise.race([pending.then(() => 'confirmed' as const), queued]);
    if (result === 'queued') {
      pending.catch((error) => {
        const mapped = mapFirestoreError(error);
        lateWriteListeners.forEach((l) => l(mapped));
      });
    }
    return result;
  } catch (error) {
    throw mapFirestoreError(error);
  } finally {
    clearTimeout(timer);
  }
}
