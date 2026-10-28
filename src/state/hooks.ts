/**
 * Screen-facing hooks over the repositories. They add the plan and current counts the
 * repositories need for Free-limit checks, and turn errors into displayable messages.
 * Security Rules re-check every limit on the server.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { addQuantities, type CanonicalUnit } from '@/shared/domain/units';
import { normaliseItemName } from '@/shared/domain/items';
import { introCreditsRemaining, PREMIUM_AI_QUOTA, PLAN_LIMITS, featureAccess } from '@/shared/entitlements/plans';
import { useAuth } from '@/hooks/useAuth';
import { DataError } from '@/src/data/firestore';
import * as lists from '@/src/data/listsRepository';
import * as pantryRepo from '@/src/data/pantryRepository';
import type { ItemInput, ListItem, PantryInput, ShoppingList, SyncState } from '@/src/data/types';
import { useAppData, type LoadStatus } from './AppDataProvider';

function requireUid(uid: string | null): string {
  if (!uid) throw new DataError('NOT_SIGNED_IN', 'Please sign in again.');
  return uid;
}

export function usePlan() {
  const { entitlement, usage } = useAppData();
  const { emailVerified } = useAuth();
  const e = entitlement.data;
  const introRemaining = introCreditsRemaining({ introCreditsGranted: usage.data.introCreditsGranted, introCreditsConsumed: usage.data.introCreditsConsumed });
  return {
    plan: e.plan,
    status: e.status,
    expiresAt: e.expiresAt,
    limits: PLAN_LIMITS[e.plan],
    introRemaining,
    premiumUsedThisMonth: usage.data.premiumMonthCount,
    premiumMonthlyLimit: PREMIUM_AI_QUOTA.perMonth,
    aiRecipes: featureAccess('ai_recipes', { ...e, introCreditsGranted: usage.data.introCreditsGranted, introCreditsConsumed: usage.data.introCreditsConsumed }, { emailVerified }),
    optimisation: featureAccess('ai_optimisation', e, { emailVerified }),
    priceLookup: featureAccess('price_lookup', e, { emailVerified, priceLookupAvailable: false }),
    history: featureAccess('shopping_history', e, { emailVerified }),
  };
}

export function useLists() {
  const { uid, lists: res } = useAppData();
  const { plan } = usePlan();
  const active = useMemo(() => res.data.filter((l) => !l.archived), [res.data]);
  const archived = useMemo(() => res.data.filter((l) => l.archived), [res.data]);

  const create = useCallback((name: string) => lists.createList(requireUid(uid), name, { plan, activeLists: active.length }), [uid, plan, active.length]);
  const rename = useCallback((listId: string, name: string) => lists.renameList(requireUid(uid), listId, name), [uid]);
  const archive = useCallback((list: ShoppingList) => lists.setListArchived(requireUid(uid), list, true, { plan, activeLists: active.length }), [uid, plan, active.length]);
  const unarchive = useCallback((list: ShoppingList) => lists.setListArchived(requireUid(uid), list, false, { plan, activeLists: active.length }), [uid, plan, active.length]);
  const remove = useCallback((list: ShoppingList) => lists.deleteList(requireUid(uid), list), [uid]);

  return { status: res.status, error: res.error, sync: res.sync, all: res.data, active, archived, create, rename, archive, unarchive, remove, canCreate: active.length < PLAN_LIMITS[plan].activeLists };
}

export type ItemsState = { status: LoadStatus; items: ListItem[]; error: DataError | null; sync: SyncState };

export function useListItems(listId: string | undefined) {
  const { uid } = useAppData();
  const { plan } = usePlan();
  const [state, setState] = useState<ItemsState>({ status: 'loading', items: [], error: null, sync: { fromCache: false, hasPendingWrites: false } });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!uid || !listId) return;
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      return lists.subscribeItems(
        uid,
        listId,
        (snap) => setState({ status: 'ready', items: snap.data, error: null, sync: snap.sync }),
        (error) => setState((s) => ({ ...s, status: 'error', error }))
      );
    } catch (e) {
      setState((s) => ({ ...s, status: 'error', error: e as DataError }));
      return undefined;
    }
  }, [uid, listId, attempt]);

  const items = state.items;

  /**
   * Adds an item. If an item with the same name is already on the list and the units are
   * comparable, its quantity is increased instead (Figma P03 "Already on list").
   */
  const add = useCallback(
    async (input: ItemInput): Promise<{ id: string; merged: boolean }> => {
      const id = requireUid(uid);
      if (!listId) throw new DataError('NOT_FOUND', 'List not found.');
      const key = normaliseItemName(input.name);
      const existing = items.find((i) => i.normalizedName === key);
      if (existing) {
        const sum = addQuantities({ amount: existing.quantity, unit: existing.unit }, { amount: input.quantity, unit: input.unit });
        if (sum) {
          await lists.updateItem(id, listId, existing.id, { quantity: sum.amount, checked: false });
          return { id: existing.id, merged: true };
        }
      }
      const newId = await lists.addItem(id, listId, input, { plan, itemsInList: items.length });
      return { id: newId, merged: false };
    },
    [uid, listId, items, plan]
  );

  const update = useCallback((itemId: string, patch: lists.ItemPatch) => lists.updateItem(requireUid(uid), listId!, itemId, patch), [uid, listId]);
  const toggle = useCallback((item: ListItem) => lists.updateItem(requireUid(uid), listId!, item.id, { checked: !item.checked }), [uid, listId]);
  const remove = useCallback((itemId: string) => lists.removeItem(requireUid(uid), listId!, itemId), [uid, listId]);
  const setQuantity = useCallback((item: ListItem, quantity: number, unit?: CanonicalUnit) => lists.updateItem(requireUid(uid), listId!, item.id, { quantity, ...(unit ? { unit } : {}) }), [uid, listId]);

  return {
    ...state,
    retry: () => setAttempt((a) => a + 1),
    add,
    update,
    toggle,
    remove,
    setQuantity,
    canAdd: items.length < PLAN_LIMITS[plan].itemsPerList,
    limit: PLAN_LIMITS[plan].itemsPerList,
  };
}

export function usePantry() {
  const { uid, pantry: res } = useAppData();
  const { plan } = usePlan();
  const now = Date.now();
  const signals = useMemo(() => pantryRepo.pantrySignals(res.data, now), [res.data, Math.floor(now / 3_600_000)]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = useCallback((input: PantryInput) => pantryRepo.addPantryItem(requireUid(uid), input, { plan, pantryItems: res.data.length }), [uid, plan, res.data.length]);
  const update = useCallback((itemId: string, patch: Parameters<typeof pantryRepo.updatePantryItem>[2]) => pantryRepo.updatePantryItem(requireUid(uid), itemId, patch), [uid]);
  const remove = useCallback((itemId: string) => pantryRepo.removePantryItem(requireUid(uid), itemId), [uid]);

  return {
    status: res.status,
    error: res.error,
    sync: res.sync,
    items: res.data,
    signals,
    add,
    update,
    remove,
    canAdd: res.data.length < PLAN_LIMITS[plan].pantryItems,
    limit: PLAN_LIMITS[plan].pantryItems,
  };
}

/** User-facing message for any error thrown by the data layer. */
export function errorMessage(error: unknown): string {
  if (error instanceof DataError) return error.message;
  if (error instanceof Error && error.message) return 'Something went wrong. Please try again.';
  return 'Something went wrong. Please try again.';
}
