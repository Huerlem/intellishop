/**
 * Subscribes to a live data source identified by `key` and exposes it as a Resource with an
 * explicit status. State is tagged with the key it belongs to, so changing the key (another
 * user, list or retry) shows "loading" immediately without resetting state inside an effect.
 */
import { useEffect, useRef, useState } from 'react';

import type { DataError } from '@/src/data/firestore';
import type { SyncState } from '@/src/data/types';

export type LoadStatus = 'loading' | 'ready' | 'error';
export type Resource<T> = { status: LoadStatus; data: T; error: DataError | null; sync: SyncState };

export const NO_SYNC: SyncState = { fromCache: false, hasPendingWrites: false };

type Start<T> = (ok: (data: T, sync?: SyncState) => void, fail: (error: DataError) => void) => () => void;
type Tagged<T> = Resource<T> & { key: string };

export function useLiveQuery<T>(key: string | null, start: Start<T>, initial: T): Resource<T> {
  const [state, setState] = useState<Tagged<T> | null>(null);
  const startRef = useRef(start);
  const initialRef = useRef(initial);
  useEffect(() => {
    startRef.current = start;
    initialRef.current = initial;
  });

  useEffect(() => {
    if (!key) return undefined;
    let active = true;
    const ok = (data: T, sync?: SyncState) => {
      if (active) setState({ key, status: 'ready', data, error: null, sync: sync ?? NO_SYNC });
    };
    const fail = (error: DataError) => {
      if (active) setState((prev) => ({ key, status: 'error', data: prev?.key === key ? prev.data : initialRef.current, error, sync: NO_SYNC }));
    };
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = startRef.current(ok, fail);
    } catch (e) {
      // e.g. not configured: report asynchronously, like a subscription error.
      Promise.resolve().then(() => fail(e as DataError));
    }
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [key]);

  if (state && state.key === key) return state;
  return { status: 'loading', data: initial, error: null, sync: NO_SYNC };
}
