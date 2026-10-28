/**
 * Live, user-scoped app data for the signed-in user: lists, pantry, active trips, entitlement,
 * AI usage, dietary preferences and AI consent. Each part has an explicit status so screens can
 * render loading, empty, error and offline states (Figma C9).
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_ENTITLEMENT, type EntitlementState } from '@/shared/entitlements/plans';
import {
  EMPTY_PREFERENCES,
  subscribeConsent,
  subscribeEntitlement,
  subscribePreferences,
  subscribeUsage,
  type ConsentState,
  type DietaryPreferences,
  type UsageView,
} from '@/src/data/accountRepository';
import type { DataError } from '@/src/data/firestore';
import { subscribeLists } from '@/src/data/listsRepository';
import { subscribePantry } from '@/src/data/pantryRepository';
import { subscribeActiveTrips, type Trip } from '@/src/data/tripsRepository';
import type { PantryItem, ShoppingList, SyncState } from '@/src/data/types';

export type LoadStatus = 'loading' | 'ready' | 'error';

export type Resource<T> = { status: LoadStatus; data: T; error: DataError | null; sync: SyncState };

const initial = <T,>(data: T): Resource<T> => ({ status: 'loading', data, error: null, sync: { fromCache: false, hasPendingWrites: false } });

export type AppData = {
  uid: string | null;
  lists: Resource<ShoppingList[]>;
  pantry: Resource<PantryItem[]>;
  trips: Resource<Trip[]>;
  entitlement: Resource<EntitlementState>;
  usage: Resource<UsageView>;
  preferences: Resource<DietaryPreferences>;
  aiConsent: Resource<ConsentState>;
  /** True when any live query is served from the device cache (offline or reconnecting). */
  offline: boolean;
  /** True while local changes are waiting to reach the server. */
  pendingWrites: boolean;
  retry: () => void;
};

const AppDataContext = createContext<AppData | null>(null);

const NO_CONSENT: ConsentState = { granted: false, version: null, updatedAt: null };
const NO_USAGE: UsageView = { introCreditsGranted: 3, introCreditsConsumed: 0, premiumMonth: '', premiumMonthCount: 0 };

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [generation, setGeneration] = useState(0);

  const [lists, setLists] = useState<Resource<ShoppingList[]>>(initial([]));
  const [pantry, setPantry] = useState<Resource<PantryItem[]>>(initial([]));
  const [trips, setTrips] = useState<Resource<Trip[]>>(initial([]));
  const [entitlement, setEntitlement] = useState<Resource<EntitlementState>>(initial(DEFAULT_ENTITLEMENT));
  const [usage, setUsage] = useState<Resource<UsageView>>(initial(NO_USAGE));
  const [preferences, setPreferences] = useState<Resource<DietaryPreferences>>(initial(EMPTY_PREFERENCES));
  const [aiConsent, setAiConsent] = useState<Resource<ConsentState>>(initial(NO_CONSENT));

  const mounted = useRef(true);
  useEffect(() => () => void (mounted.current = false), []);

  useEffect(() => {
    if (!uid) {
      setLists(initial([]));
      setPantry(initial([]));
      setTrips(initial([]));
      setEntitlement(initial(DEFAULT_ENTITLEMENT));
      setUsage(initial(NO_USAGE));
      setPreferences(initial(EMPTY_PREFERENCES));
      setAiConsent(initial(NO_CONSENT));
      return;
    }
    const ok = <T,>(set: (r: Resource<T>) => void) => (data: T, sync?: SyncState) =>
      mounted.current && set({ status: 'ready', data, error: null, sync: sync ?? { fromCache: false, hasPendingWrites: false } });
    const fail = <T,>(set: React.Dispatch<React.SetStateAction<Resource<T>>>) => (error: DataError) =>
      mounted.current && set((prev) => ({ ...prev, status: 'error', error }));

    const unsubs: (() => void)[] = [];
    const guard = (fn: () => () => void) => {
      try {
        unsubs.push(fn());
      } catch (e) {
        // Not configured / not signed in: surfaced through the resource error state.
        setLists((p) => ({ ...p, status: 'error', error: e as DataError }));
      }
    };
    guard(() => subscribeLists(uid, (s) => ok(setLists)(s.data, s.sync), fail(setLists)));
    guard(() => subscribePantry(uid, (s) => ok(setPantry)(s.data, s.sync), fail(setPantry)));
    guard(() => subscribeActiveTrips(uid, (t) => ok(setTrips)(t), fail(setTrips)));
    guard(() => subscribeEntitlement(uid, (e) => ok(setEntitlement)(e), fail(setEntitlement)));
    guard(() => subscribeUsage(uid, (u) => ok(setUsage)(u), fail(setUsage)));
    guard(() => subscribePreferences(uid, (p) => ok(setPreferences)(p), fail(setPreferences)));
    guard(() => subscribeConsent(uid, 'ai', (c) => ok(setAiConsent)(c), fail(setAiConsent)));
    return () => unsubs.forEach((u) => u());
  }, [uid, generation]);

  const retry = useCallback(() => setGeneration((g) => g + 1), []);

  const value = useMemo<AppData>(
    () => ({
      uid,
      lists,
      pantry,
      trips,
      entitlement,
      usage,
      preferences,
      aiConsent,
      offline: lists.sync.fromCache || pantry.sync.fromCache,
      pendingWrites: lists.sync.hasPendingWrites || pantry.sync.hasPendingWrites,
      retry,
    }),
    [uid, lists, pantry, trips, entitlement, usage, preferences, aiConsent, retry]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}

/** For tests and previews: provide a fixed AppData value. */
export const AppDataTestProvider = AppDataContext.Provider;
