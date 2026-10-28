/**
 * Live, user-scoped app data for the signed-in user: lists, pantry, active trips, entitlement,
 * AI usage, dietary preferences and AI consent. Each part has an explicit status so screens can
 * render loading, empty, error and offline states (Figma C9).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

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
import { onLateWriteError, type DataError } from '@/src/data/firestore';
import { subscribeLists } from '@/src/data/listsRepository';
import { subscribePantry } from '@/src/data/pantryRepository';
import { subscribeActiveTrips, subscribeRecentFinishedTrips, type Trip } from '@/src/data/tripsRepository';
import type { PantryItem, ShoppingList } from '@/src/data/types';
import { useLiveQuery, type Resource } from './liveQuery';

export type { LoadStatus, Resource } from './liveQuery';

export type AppData = {
  uid: string | null;
  lists: Resource<ShoppingList[]>;
  pantry: Resource<PantryItem[]>;
  trips: Resource<Trip[]>;
  /** Up to 3 most recently finished trips (pending Pantry updates). */
  finishedTrips: Resource<Trip[]>;
  entitlement: Resource<EntitlementState>;
  usage: Resource<UsageView>;
  preferences: Resource<DietaryPreferences>;
  aiConsent: Resource<ConsentState>;
  /** True when any live query is served from the device cache (offline or reconnecting). */
  offline: boolean;
  /** True while local changes are waiting to reach the server. */
  pendingWrites: boolean;
  /** A change saved while offline that the server later rejected (Firestore rolled it back). */
  writeError: DataError | null;
  clearWriteError: () => void;
  retry: () => void;
};

const AppDataContext = createContext<AppData | null>(null);

const EMPTY: never[] = [];
const NO_CONSENT: ConsentState = { granted: false, version: null, updatedAt: null };
const NO_USAGE: UsageView = { introCreditsGranted: 3, introCreditsConsumed: 0, premiumMonth: '', premiumMonthCount: 0 };

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [generation, setGeneration] = useState(0);
  const key = uid ? `${uid}#${generation}` : null;

  const lists = useLiveQuery<ShoppingList[]>(key, (ok, fail) => subscribeLists(uid!, (s) => ok(s.data, s.sync), fail), EMPTY);
  const pantry = useLiveQuery<PantryItem[]>(key, (ok, fail) => subscribePantry(uid!, (s) => ok(s.data, s.sync), fail), EMPTY);
  const trips = useLiveQuery<Trip[]>(key, (ok, fail) => subscribeActiveTrips(uid!, ok, fail), EMPTY);
  const finishedTrips = useLiveQuery<Trip[]>(key, (ok, fail) => subscribeRecentFinishedTrips(uid!, ok, fail), EMPTY);
  const entitlement = useLiveQuery<EntitlementState>(key, (ok, fail) => subscribeEntitlement(uid!, ok, fail), DEFAULT_ENTITLEMENT);
  const usage = useLiveQuery<UsageView>(key, (ok, fail) => subscribeUsage(uid!, ok, fail), NO_USAGE);
  const preferences = useLiveQuery<DietaryPreferences>(key, (ok, fail) => subscribePreferences(uid!, ok, fail), EMPTY_PREFERENCES);
  const aiConsent = useLiveQuery<ConsentState>(key, (ok, fail) => subscribeConsent(uid!, 'ai', ok, fail), NO_CONSENT);

  const [writeError, setWriteError] = useState<DataError | null>(null);
  useEffect(() => onLateWriteError((e) => setWriteError(e)), []);
  const clearWriteError = useCallback(() => setWriteError(null), []);
  const retry = useCallback(() => setGeneration((g) => g + 1), []);

  const value = useMemo<AppData>(
    () => ({
      uid,
      lists,
      pantry,
      trips,
      finishedTrips,
      entitlement,
      usage,
      preferences,
      aiConsent,
      offline: lists.sync.fromCache || pantry.sync.fromCache,
      pendingWrites: lists.sync.hasPendingWrites || pantry.sync.hasPendingWrites,
      writeError,
      clearWriteError,
      retry,
    }),
    [uid, lists, pantry, trips, finishedTrips, entitlement, usage, preferences, aiConsent, writeError, clearWriteError, retry]
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
