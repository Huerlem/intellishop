/**
 * Functional regression test for pantry CRUD (retained V1 StockContext, shown as "Pantry").
 * Runs the real provider against an in-memory Firestore and asserts persisted data.
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useContext, type ReactNode } from 'react';

import { AuthContext } from '@/context/AuthContext';
import { StockContext, StockProvider } from '@/context/StockContext';
import { memoryStore, MemoryTimestamp } from '../test-utils/memoryFirestore';

jest.mock('firebase/firestore', () => require('../test-utils/memoryFirestore').firestoreModule);
jest.mock('@/firebase/config', () => ({ db: {}, auth: null, storage: null, isFirebaseConfigured: true, missingFirebaseConfigKeys: [] }));
jest.mock('@/firebase/authHelpers', () => ({
  subscribeToAuthState: jest.fn(() => () => {}),
  getUserData: jest.fn(),
  updateUserProfile: jest.fn(),
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  logoutUser: jest.fn(),
  resetPassword: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/errors/errorHandler', () => ({
  handleError: (error: { message?: string } | undefined) => ({ message: error?.message ?? 'error', code: 'TEST' }),
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => require('crypto').randomUUID() }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PantryApi = Record<string, any>;

const DAY = 24 * 60 * 60 * 1000;
const signedIn = { user: { uid: 'user-1' }, isAuthenticated: true };

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={signedIn as never}>
      <StockProvider>{children}</StockProvider>
    </AuthContext.Provider>
  );
}

const usePantry = () => useContext(StockContext) as PantryApi;

beforeEach(() => {
  memoryStore.reset();
});

it('adds, updates and removes pantry items, persisting each step', async () => {
  const { result } = await renderHook(usePantry, { wrapper: Wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));

  // Add (minimum quantity defaults to 20% of quantity, at least 1)
  let added: PantryApi = {};
  await act(async () => {
    added = await result.current.addStockItem('Rice', 10, 'kg', undefined, 'grains');
  });
  expect(added.success).toBe(true);
  const id: string = added.item.id;
  const stored = memoryStore.get('stockItems', id)!;
  expect(stored).toMatchObject({ userId: 'user-1', name: 'Rice', quantity: 10, unit: 'kg', minQuantity: 2, category: 'grains' });
  expect(stored.createdAt).toBeInstanceOf(MemoryTimestamp);
  expect(result.current.lowStockItems).toHaveLength(0);

  // Update: quantity changes; owner and creation date cannot be overwritten through the update
  await act(async () => {
    await result.current.updateStockItem(id, { quantity: 1, userId: 'someone-else', createdAt: new Date(0) });
  });
  const updated = memoryStore.get('stockItems', id)!;
  expect(updated.quantity).toBe(1);
  expect(updated.userId).toBe('user-1');
  expect((updated.createdAt as MemoryTimestamp).toDate().getTime()).not.toBe(0);
  await waitFor(() => expect(result.current.lowStockItems.map((i: PantryApi) => i.id)).toEqual([id]));

  // Remove
  await act(async () => {
    await result.current.removeStockItem(id);
  });
  expect(memoryStore.get('stockItems', id)).toBeUndefined();
  expect(result.current.stockItems).toEqual([]);
});

it("loads only the signed-in user's items and flags items expiring within 7 days", async () => {
  const now = Date.now();
  memoryStore.seed('stockItems', 'milk', {
    userId: 'user-1', name: 'Milk', quantity: 1, minQuantity: 1, unit: 'l', category: 'dairy',
    expiryDate: new Date(now + 3 * DAY), createdAt: new Date(now), updatedAt: new Date(now),
  });
  memoryStore.seed('stockItems', 'pasta', {
    userId: 'user-1', name: 'Pasta', quantity: 5, minQuantity: 1, unit: 'pack', category: 'grains',
    expiryDate: new Date(now + 30 * DAY), createdAt: new Date(now), updatedAt: new Date(now),
  });
  memoryStore.seed('stockItems', 'not-mine', {
    userId: 'user-2', name: 'Cheese', quantity: 1, minQuantity: 1, unit: 'unit', category: 'dairy',
    expiryDate: new Date(now + DAY), createdAt: new Date(now), updatedAt: new Date(now),
  });

  const { result } = await renderHook(usePantry, { wrapper: Wrapper });
  await waitFor(() => expect(result.current.stockItems).toHaveLength(2));

  expect(result.current.stockItems.map((i: PantryApi) => i.name).sort()).toEqual(['Milk', 'Pasta']);
  expect(result.current.stockItems[0].expiryDate).toBeInstanceOf(Date);
  expect(result.current.getExpiringItems().map((i: PantryApi) => i.id)).toEqual(['milk']);
  expect(result.current.getLowStockItems().map((i: PantryApi) => i.id)).toEqual(['milk']);
});
