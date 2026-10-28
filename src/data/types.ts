import type { ItemCategory } from '@/shared/domain/items';
import type { CanonicalUnit } from '@/shared/domain/units';

export type ShoppingList = {
  id: string;
  name: string;
  archived: boolean;
  itemCount: number;
  createdAt: number | null; // epoch ms (null while the server timestamp is pending)
  updatedAt: number | null;
};

export type ListItem = {
  id: string;
  name: string;
  normalizedName: string;
  quantity: number;
  unit: CanonicalUnit;
  category: ItemCategory;
  notes: string;
  checked: boolean;
  pricePence: number | null; // entered by the user; never fetched or generated
  createdAt: number | null;
  updatedAt: number | null;
};

export type ExpiryKind = 'use_by' | 'best_before';

export type PantryItem = {
  id: string;
  name: string;
  normalizedName: string;
  quantity: number;
  unit: CanonicalUnit;
  minQuantity: number;
  category: ItemCategory;
  expiryDate: number | null;
  expiryKind: ExpiryKind | null;
  lastPurchasedAt: number | null;
  createdAt: number | null;
  updatedAt: number | null;
};

export type Counters = { activeLists: number; pantryItems: number };

export type UserProfile = {
  displayName: string;
  email: string;
  photoURL: string | null;
  termsVersion: string | null;
  termsAcceptedAt: number | null;
};

/** Sync state of a live query, for offline indicators. */
export type SyncState = { fromCache: boolean; hasPendingWrites: boolean };

export type Snapshot<T> = { data: T; sync: SyncState };

export type ItemInput = {
  name: string;
  quantity: number;
  unit: CanonicalUnit;
  category?: ItemCategory;
  notes?: string;
  pricePence?: number | null;
};

export type PantryInput = {
  name: string;
  quantity: number;
  unit: CanonicalUnit;
  minQuantity?: number;
  category?: ItemCategory;
  expiryDate?: number | null;
  expiryKind?: ExpiryKind | null;
};
