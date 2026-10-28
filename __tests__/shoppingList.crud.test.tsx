/**
 * Functional regression test for shopping-list CRUD (retained V1 ShoppingListContext).
 * Runs the real provider against an in-memory Firestore (test-utils/memoryFirestore) and
 * asserts what is persisted after every step, not only the React state.
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useContext, type ReactNode } from 'react';

import { AuthContext } from '@/context/AuthContext';
import { ShoppingListContext, ShoppingListProvider } from '@/context/ShoppingListContext';
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

// The context is plain JavaScript; its API is typed loosely here on purpose.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ListsApi = Record<string, any>;

const signedIn = { user: { uid: 'user-1' }, isAuthenticated: true };

function wrapperFor(auth: object) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AuthContext.Provider value={auth as never}>
        <ShoppingListProvider>{children}</ShoppingListProvider>
      </AuthContext.Provider>
    );
  };
}

const useLists = () => useContext(ShoppingListContext) as ListsApi;

beforeEach(() => {
  memoryStore.reset();
});

it('creates a list, adds, edits, completes and removes items, renames and deletes it — persisting every step', async () => {
  const { result } = await renderHook(useLists, { wrapper: wrapperFor(signedIn) });
  await waitFor(() => expect(result.current.loading).toBe(false));

  // Create
  let created: ListsApi = {};
  await act(async () => {
    created = await result.current.createShoppingList('Weekly Groceries');
  });
  expect(created.success).toBe(true);
  const listId: string = created.list.id;
  expect(memoryStore.get('shoppingLists', listId)).toMatchObject({ userId: 'user-1', name: 'Weekly Groceries', items: [] });
  expect(result.current.currentList?.id).toBe(listId);

  // Add item (name is trimmed)
  await act(async () => {
    await result.current.addItem('  Whole Milk ', 2, 'l', null, 'dairy', '');
  });
  let items = memoryStore.get('shoppingLists', listId)!.items as ListsApi[];
  expect(items).toHaveLength(1);
  expect(items[0]).toMatchObject({ name: 'Whole Milk', quantity: 2, unit: 'l', category: 'dairy', checked: false });
  const itemId: string = items[0].id;
  expect(typeof itemId).toBe('string');

  // Adding the same name again updates the quantity instead of duplicating
  await act(async () => {
    await result.current.addItem('whole milk', 3, 'l', null, 'dairy', '');
  });
  items = memoryStore.get('shoppingLists', listId)!.items as ListsApi[];
  expect(items).toHaveLength(1);
  expect(items[0].quantity).toBe(3);

  // Update
  await act(async () => {
    await result.current.updateItem(itemId, { quantity: 4 });
  });
  expect((memoryStore.get('shoppingLists', listId)!.items as ListsApi[])[0].quantity).toBe(4);

  // Complete
  await act(async () => {
    await result.current.toggleItemChecked(itemId, true);
  });
  expect((memoryStore.get('shoppingLists', listId)!.items as ListsApi[])[0].checked).toBe(true);

  // Rename list
  await act(async () => {
    await result.current.updateList(listId, { name: 'Weekly Shop' });
  });
  expect(memoryStore.get('shoppingLists', listId)!.name).toBe('Weekly Shop');
  expect(result.current.lists.find((l: ListsApi) => l.id === listId)?.name).toBe('Weekly Shop');

  // Remove item
  await act(async () => {
    await result.current.removeItem(itemId);
  });
  expect(memoryStore.get('shoppingLists', listId)!.items).toEqual([]);

  // Delete list
  await act(async () => {
    await result.current.deleteList(listId);
  });
  expect(memoryStore.get('shoppingLists', listId)).toBeUndefined();
  expect(result.current.lists).toEqual([]);
  expect(result.current.currentList).toBeNull();
});

it("loads only the signed-in user's lists and converts timestamps", async () => {
  memoryStore.seed('shoppingLists', 'mine', {
    userId: 'user-1',
    name: 'Mine',
    items: [{ id: 'i1', name: 'Eggs', quantity: 12, unit: 'unit', checked: false }],
    createdAt: new Date('2026-10-01T10:00:00Z'),
    updatedAt: new Date('2026-10-02T10:00:00Z'),
  });
  memoryStore.seed('shoppingLists', 'someone-else', {
    userId: 'user-2',
    name: 'Not mine',
    items: [],
    createdAt: new Date('2026-10-01T10:00:00Z'),
    updatedAt: new Date('2026-10-03T10:00:00Z'),
  });
  expect(memoryStore.get('shoppingLists', 'mine')!.updatedAt).toBeInstanceOf(MemoryTimestamp);

  const { result } = await renderHook(useLists, { wrapper: wrapperFor(signedIn) });
  await waitFor(() => expect(result.current.lists).toHaveLength(1));

  expect(result.current.lists[0]).toMatchObject({ id: 'mine', name: 'Mine' });
  expect(result.current.lists[0].updatedAt).toBeInstanceOf(Date);
  expect(result.current.currentList?.id).toBe('mine');
  expect(result.current.currentList.items).toHaveLength(1);
});

it('does not load or keep lists when signed out', async () => {
  memoryStore.seed('shoppingLists', 'mine', { userId: 'user-1', name: 'Mine', items: [], updatedAt: new Date() });
  const { result } = await renderHook(useLists, { wrapper: wrapperFor({ user: null, isAuthenticated: false }) });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.lists).toEqual([]);
  expect(result.current.currentList).toBeNull();
});
