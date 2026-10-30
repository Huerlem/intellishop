/**
 * Integration tests for the V2 screens: real screens + AppDataProvider + repositories over the
 * in-memory Firestore. Asserts what is shown AND what is persisted.
 * Not covered here (needs a device or simulator): gestures, keyboard, VoiceOver, layout.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { memoryStore, MemoryTimestamp } from '../../test-utils/memoryFirestore';
import { auth, callable, resetHarness, router, setParams, UID, withData } from '../../test-utils/screenHarness';

import AddItemsScreen from '@/src/screens/AddItemsScreen';
import DeleteAccountScreen from '@/src/screens/DeleteAccountScreen';
import FinishShoppingScreen from '@/src/screens/FinishShoppingScreen';
import HomeScreen from '@/src/screens/HomeScreen';
import ListDetailScreen from '@/src/screens/ListDetailScreen';
import ListsScreen from '@/src/screens/ListsScreen';
import OptimiseScreen from '@/src/screens/OptimiseScreen';
import PantryScreen from '@/src/screens/PantryScreen';
import PantryUpdateScreen from '@/src/screens/PantryUpdateScreen';
import PlansScreen from '@/src/screens/PlansScreen';
import ProfileScreen from '@/src/screens/ProfileScreen';
import RecipesScreen from '@/src/screens/RecipesScreen';
import ShoppingModeScreen from '@/src/screens/ShoppingModeScreen';
import { RegisterScreen } from '@/src/screens/auth/AuthScreens';

jest.mock('firebase/firestore', () => require('../../test-utils/memoryFirestore').firestoreModule);
jest.mock('firebase/functions', () => require('../../test-utils/screenMocks').functionsModule);
jest.mock('@/firebase/config', () => require('../../test-utils/screenMocks').firebaseConfig);
jest.mock('@/hooks/useAuth', () => require('../../test-utils/screenMocks').authModule);
jest.mock('expo-router', () => require('../../test-utils/screenMocks').routerModule);
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: '2.0.0' } } }));

const U = `users/${UID}`;
type Rec = Record<string, Record<string, unknown>>;
const tripDoc = (id: string) => memoryStore.get(`${U}/trips`, id) as { lines: Rec; pantryApplied: Rec };
const ts = (ms: number) => new MemoryTimestamp(ms);
const DAY = 86400000;
const NOW = Date.now();

function seedList(id = 'l1', name = 'Weekly shop', items: Record<string, Record<string, unknown>> = {}) {
  memoryStore.seed(`${U}/lists`, id, { name, archived: false, itemCount: Object.keys(items).length, lastItemOp: null, createdAt: ts(NOW - DAY), updatedAt: ts(NOW - DAY) });
  for (const [itemId, d] of Object.entries(items)) {
    memoryStore.seed(`${U}/lists/${id}/items`, itemId, { normalizedName: String(d.name).toLowerCase(), quantity: 1, unit: 'unit', category: 'other', notes: '', checked: false, pricePence: null, createdAt: ts(NOW), updatedAt: ts(NOW), ...d });
  }
  memoryStore.seed(`${U}/meta`, 'counters', { activeLists: 1, pantryItems: 0 });
}

function seedPantry(id: string, d: Record<string, unknown>) {
  memoryStore.seed(`${U}/pantry`, id, { normalizedName: String(d.name).toLowerCase(), quantity: 1, unit: 'unit', minQuantity: 0, category: 'other', expiryDate: null, expiryKind: null, lastPurchasedAt: null, createdAt: ts(NOW - 30 * DAY), updatedAt: ts(NOW - 30 * DAY), ...d });
}

const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

beforeEach(() => {
  memoryStore.reset();
  resetHarness();
});

describe('P01 Home', () => {
  it('shows an empty state without lists and a pantry hint without signals', async () => {
    await render(withData(<HomeScreen />));
    await waitFor(() => expect(screen.getByTestId('home-empty-lists')).toBeTruthy());
    expect(screen.getByText(/^Good (morning|afternoon|evening), Peter$/)).toBeTruthy();
    expect(screen.getByTestId('no-signals')).toBeTruthy();
  });

  it('shows the active list, Pantry signals and Resume Shopping from real data', async () => {
    seedList('l1', 'Weekly shop', { a: { name: 'Milk' }, b: { name: 'Bread' } });
    seedPantry('p1', { name: 'Eggs', quantity: 1, minQuantity: 2 });
    memoryStore.seed(`${U}/trips`, 't1', { listId: 'l1', listName: 'Weekly shop', status: 'active', startedAt: ts(NOW), finishedAt: null, lines: { a: { outcome: 'collected', quantity: 1, unit: 'unit' } }, actualTotalPence: null });
    await render(withData(<HomeScreen />));
    await waitFor(() => expect(screen.getByTestId('active-list-card')).toBeTruthy());
    expect(screen.getByText('Eggs is running low')).toBeTruthy();
    expect(screen.getByTestId('resume-shopping').props.accessibilityLabel).toBe('Resume shopping, Weekly shop, 1 of 2 items done');
    await fireEvent.press(screen.getByTestId('resume-shopping'));
    expect(router.push).toHaveBeenCalledWith('/shop/t1');
    await fireEvent.press(screen.getByLabelText('Profile and settings'));
    expect(router.push).toHaveBeenCalledWith('/profile');
  });
});

describe('Lists (C6) and List Detail (P02)', () => {
  it('creates a list and enforces the Free limit of 2 active lists', async () => {
    await render(withData(<ListsScreen />));
    await waitFor(() => expect(screen.getByText('Create a list')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('lists-new'));
    await fireEvent.changeText(screen.getByTestId('create-list-name'), 'Weekly shop');
    await fireEvent.press(screen.getByTestId('create-list-submit'));
    await settle();
    const lists = memoryStore.all(`${U}/lists`);
    expect(lists.map((l) => l.data.name)).toEqual(['Weekly shop']);
    expect(router.push).toHaveBeenCalledWith(`/list/${lists[0].id}`);

    memoryStore.seed(`${U}/lists`, 'l2', { name: 'Party', archived: false, itemCount: 0, lastItemOp: null, createdAt: ts(NOW), updatedAt: ts(NOW) });
    await settle();
    await fireEvent.press(screen.getByTestId('lists-new'));
    expect(screen.getByText('The Free plan includes 2 active lists')).toBeTruthy();
    // The native modal hides the underlying screen from RNTL queries while it is open.
    await fireEvent.press(screen.getByLabelText('Dismiss'));
    await waitFor(() => expect(screen.getByTestId('lists-usage')).toHaveTextContent('2 of 2 active lists on the Free plan'));
  });

  it('shows the user-price estimate, items already in the Pantry, and starts a shopping trip', async () => {
    seedList('l1', 'Weekly shop', { a: { name: 'Milk', pricePence: 145 }, b: { name: 'Rice' } });
    seedPantry('p1', { name: 'Rice', quantity: 2, unit: 'kg' });
    setParams({ listId: 'l1' });
    await render(withData(<ListDetailScreen />));
    await waitFor(() => expect(screen.getByTestId('list-estimate')).toBeTruthy());
    expect(screen.getByText('Your prices: £1.45 for 1 of 2 items')).toBeTruthy();
    expect(screen.getByText('1 item is already in your Pantry')).toBeTruthy();
    expect(screen.getByText('Your price £1.45')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('start-shopping'));
    await settle();
    const trips = memoryStore.all(`${U}/trips`);
    expect(trips).toHaveLength(1);
    expect(trips[0].data).toMatchObject({ listId: 'l1', listName: 'Weekly shop', status: 'active' });
    expect(router.push).toHaveBeenCalledWith(`/shop/${trips[0].id}`);
  });

  it('ticks an item and edits it through the item editor', async () => {
    seedList('l1', 'Weekly shop', { a: { name: 'Milk' } });
    setParams({ listId: 'l1' });
    await render(withData(<ListDetailScreen />));
    await waitFor(() => expect(screen.getByLabelText('Milk, 1 item')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('Milk, 1 item'));
    await settle();
    expect(memoryStore.get(`${U}/lists/l1/items`, 'a')!.checked).toBe(true);

    await fireEvent.press(screen.getByLabelText('Edit Milk'));
    await fireEvent.changeText(screen.getByTestId('item-editor-qty'), '2');
    await fireEvent.changeText(screen.getByTestId('item-editor-price'), '2.10');
    await fireEvent.press(screen.getByTestId('item-editor-save'));
    await settle();
    expect(memoryStore.get(`${U}/lists/l1/items`, 'a')).toMatchObject({ quantity: 2, pricePence: 210 });
  });
});

describe('P03 Add Items', () => {
  it('adds a custom item and suggests items that ran out in the Pantry', async () => {
    seedList('l1', 'Weekly shop');
    seedPantry('p1', { name: 'Butter', quantity: 0 });
    setParams({ listId: 'l1' });
    await render(withData(<AddItemsScreen />));
    await waitFor(() => expect(screen.getByTestId('suggestion-p1')).toBeTruthy());
    expect(screen.getByText('Run out')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Add Butter'));
    await settle();
    await fireEvent.changeText(screen.getByTestId('add-items-search'), 'Oat milk');
    await fireEvent.press(screen.getByTestId('add-custom'));
    await settle();
    const names = memoryStore.all(`${U}/lists/l1/items`).map((i) => i.data.name).sort();
    expect(names).toEqual(['Butter', 'Oat milk']);
    expect(screen.getByText('Added Oat milk')).toBeTruthy();
  });
});

describe('P04 Optimisation', () => {
  it('is an honest unavailable state that changes nothing and sells nothing', async () => {
    setParams({ listId: 'l1' });
    await render(withData(<OptimiseScreen />));
    expect(screen.getByTestId('optimise-unavailable')).toBeTruthy();
    expect(screen.queryByText(/See plans|Premium|£/)).toBeNull();
  });
});

describe('P07 Shopping Mode → P08 Finish → P09 Pantry Update', () => {
  beforeEach(() => {
    seedList('l1', 'Weekly shop', { a: { name: 'Milk', unit: 'l', quantity: 2, category: 'dairy_eggs' }, b: { name: 'Bread', category: 'bakery' }, c: { name: 'Pasta', category: 'cupboard' } });
    seedPantry('p1', { name: 'Milk', quantity: 1, unit: 'l' });
    memoryStore.seed(`${U}/trips`, 't1', { listId: 'l1', listName: 'Weekly shop', status: 'active', startedAt: ts(NOW), finishedAt: null, lines: {}, actualTotalPence: null });
    setParams({ tripId: 't1' });
  });

  it('records collected and unavailable items and keeps the list in sync', async () => {
    await render(withData(<ShoppingModeScreen />));
    await waitFor(() => expect(screen.getByTestId('shop-item-a')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText(/^Milk, 2 l/));
    await settle();
    expect(tripDoc('t1').lines).toMatchObject({ a: { outcome: 'collected', quantity: 2, unit: 'l', name: 'Milk' } });
    expect(memoryStore.get(`${U}/lists/l1/items`, 'a')!.checked).toBe(true);

    const bread = screen.getByLabelText(/^Bread, 1 item/);
    bread.props.onAccessibilityAction({ nativeEvent: { actionName: 'longpress' } });
    await settle();
    await fireEvent.press(screen.getByLabelText('Mark Bread unavailable'));
    await settle();
    expect(tripDoc('t1').lines.b).toMatchObject({ outcome: 'unavailable' });
    expect(screen.getByTestId('shopping-progress').props.accessibilityLabel).toBe('2 done · 1 remaining');
  });

  it('finishes with a user-entered total, then applies only additive Pantry updates (undoable)', async () => {
    memoryStore.seed(`${U}/trips`, 't1', {
      listId: 'l1', listName: 'Weekly shop', status: 'active', startedAt: ts(NOW), finishedAt: null, actualTotalPence: null,
      lines: { a: { outcome: 'collected', quantity: 2, unit: 'l', name: 'Milk' }, b: { outcome: 'unavailable', quantity: 1, unit: 'unit', name: 'Bread' }, c: { outcome: 'substituted', quantity: 1, unit: 'unit', name: 'Pasta', substituteName: 'Fusilli' } },
    });
    await render(withData(<FinishShoppingScreen />));
    await waitFor(() => expect(screen.getByTestId('summary-purchased')).toBeTruthy());
    expect(screen.getByLabelText('Purchased: 1')).toBeTruthy();
    expect(screen.getByLabelText('Substituted: 1')).toBeTruthy();
    expect(screen.getByLabelText('Unavailable: 1')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('actual-total'), '23.50');
    await fireEvent.press(screen.getByTestId('confirm-finish'));
    await settle();
    expect(memoryStore.get(`${U}/trips`, 't1')).toMatchObject({ status: 'finished', actualTotalPence: 2350 });
    expect(router.replace).toHaveBeenCalledWith('/shop/t1/pantry-update');

    await render(withData(<PantryUpdateScreen />));
    await waitFor(() => expect(screen.getByTestId('auto-updated')).toBeTruthy());
    // Milk matched exactly one Pantry item with comparable units → automatic increase 1 l + 2 l.
    expect(memoryStore.get(`${U}/pantry`, 'p1')).toMatchObject({ quantity: 3, unit: 'l' });
    expect(tripDoc('t1').pantryApplied.a).toMatchObject({ status: 'applied', via: 'auto', kind: 'increase', prevQuantity: 1 });
    // The substitute needs review; nothing was added for it or for the unavailable bread.
    expect(screen.getByTestId('review-c')).toBeTruthy();
    expect(memoryStore.all(`${U}/pantry`)).toHaveLength(1);

    await fireEvent.press(screen.getByTestId('review-c'));
    await fireEvent.press(screen.getByTestId('review-add-new'));
    await settle();
    const added = memoryStore.all(`${U}/pantry`).find((p) => p.data.name === 'Fusilli');
    expect(added?.data).toMatchObject({ quantity: 1, unit: 'unit' });
    expect(memoryStore.get(`${U}/meta`, 'counters')).toMatchObject({ pantryItems: 1, lastOp: { type: 'pantryAdd', id: added!.id } });

    // Undo the automatic Milk update → quantity restored, recorded as undone (never re-applied).
    await fireEvent.press(screen.getByLabelText('Undo Pantry update for Milk'));
    await settle();
    expect(memoryStore.get(`${U}/pantry`, 'p1')).toMatchObject({ quantity: 1 });
    expect(tripDoc('t1').pantryApplied.a).toEqual({ status: 'undone' });
    await settle();
    expect(memoryStore.get(`${U}/pantry`, 'p1')).toMatchObject({ quantity: 1 });
  });
});

describe('P10 Pantry', () => {
  it('groups items into the Figma sections and adds an item with a use-by date', async () => {
    seedPantry('p1', { name: 'Milk', quantity: 1, minQuantity: 1 });
    seedPantry('p2', { name: 'Spinach', expiryDate: ts(NOW + DAY), expiryKind: 'use_by' });
    await render(withData(<PantryScreen />));
    await waitFor(() => expect(screen.getByText('Running Low')).toBeTruthy());
    expect(screen.getByTestId('pantry-item-p1').props.accessibilityLabel).toMatch(/Running low/);
    expect(screen.getByTestId('pantry-item-p2').props.accessibilityLabel).toMatch(/Use by tomorrow/);
    expect(screen.getByTestId('use-what-i-have')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('pantry-add'));
    await fireEvent.changeText(screen.getByTestId('pantry-editor-name'), 'Chicken thighs');
    await fireEvent.changeText(screen.getByTestId('pantry-editor-qty'), '0.5');
    await fireEvent.press(screen.getByLabelText('kg'));
    await fireEvent.press(screen.getByLabelText('Use by'));
    await fireEvent.changeText(screen.getByTestId('pantry-editor-date'), '31/12/2026');
    await fireEvent.press(screen.getByTestId('pantry-editor-save'));
    await settle();
    const chicken = memoryStore.all(`${U}/pantry`).find((p) => p.data.name === 'Chicken thighs')!;
    expect(chicken.data).toMatchObject({ quantity: 0.5, unit: 'kg', expiryKind: 'use_by' });
    expect((chicken.data.expiryDate as MemoryTimestamp).toMillis()).toBe(new Date(2026, 11, 31).getTime());
  });
});

describe('Plans (paywall)', () => {
  it('never shows a hard-coded price and says purchases are unavailable', async () => {
    await render(withData(<PlansScreen />));
    await waitFor(() => expect(screen.getByTestId('plans-unavailable')).toBeTruthy());
    expect(screen.queryByText(/£\d/)).toBeNull();
    expect(screen.queryByText(/Subscribe to/)).toBeNull();
    expect(screen.queryByText(/optimis|price comparison/i)).toBeNull();
  });
});

describe('C1 registration', () => {
  it('collects only name, email and password and requires accepting the Terms', async () => {
    await render(<RegisterScreen />);
    expect(screen.queryByTestId('register-phone')).toBeNull();
    await fireEvent.changeText(screen.getByTestId('register-name'), 'Peter');
    await fireEvent.changeText(screen.getByTestId('register-email'), 'peter@example.com');
    await fireEvent.changeText(screen.getByTestId('register-password'), 'correct horse');
    await fireEvent.press(screen.getByTestId('register-submit'));
    expect(auth.register).not.toHaveBeenCalled();
    expect(screen.getByText('You need to accept the Terms to create an account.')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('register-terms'));
    await fireEvent.press(screen.getByTestId('register-submit'));
    expect(auth.register).toHaveBeenCalledWith('peter@example.com', 'correct horse', { displayName: 'Peter', termsAccepted: true });
    await fireEvent.press(screen.getByTestId('register-read-privacy'));
    expect(router.push).toHaveBeenCalledWith('/legal/privacy');
  });
});

describe('Recipes (AI) gating', () => {
  it('asks for permission first and sends nothing without it', async () => {
    seedPantry('p1', { name: 'Rice' });
    await render(withData(<RecipesScreen />));
    await waitFor(() => expect(screen.getByTestId('recipes-consent-needed')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('generate-recipes'));
    expect(callable.calls).toEqual([]);
  });

  it('shows the server reason when AI is paused; never a fallback recipe', async () => {
    memoryStore.seed(`${U}/consents`, 'ai', { granted: true, version: '1.0.0', updatedAt: ts(NOW) });
    callable.handlers.generateRecipes = () => {
      throw Object.assign(new Error('paused'), { code: 'functions/failed-precondition', details: { reason: 'SERVICE_PAUSED' } });
    };
    await render(withData(<RecipesScreen />));
    await waitFor(() => expect(screen.getByTestId('recipes-allowance')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('generate-recipes'));
    await settle();
    expect(callable.calls.map((c) => c.name)).toEqual(['generateRecipes']);
    expect(screen.getByText('AI recipes are paused')).toBeTruthy();
    expect(screen.queryByTestId(/^recipe-/)).toBeNull();
  });
});

describe('C2 Profile & account deletion', () => {
  it('turns AI suggestions off through the server and links to deletion', async () => {
    memoryStore.seed(`${U}/consents`, 'ai', { granted: true, version: '1.0.0', updatedAt: ts(NOW) });
    callable.handlers.setAiConsent = () => ({ ok: true });
    await render(withData(<ProfileScreen />));
    await waitFor(() => expect(screen.getByLabelText('AI suggestions').props.value).toBe(true));
    await fireEvent(screen.getByLabelText('AI suggestions'), 'valueChange', false);
    await settle();
    expect(callable.calls).toEqual([{ name: 'setAiConsent', data: { granted: false, version: '1.0.0' } }]);
    await fireEvent.press(screen.getByTestId('delete-account'));
    expect(router.push).toHaveBeenCalledWith('/delete-account');
  });

  it('deletes the account only after confirmation and re-authentication', async () => {
    callable.handlers.deleteAccount = () => ({ deleted: true, completedAt: NOW });
    await render(withData(<DeleteAccountScreen />));
    await fireEvent.press(screen.getByTestId('confirm-delete-account'));
    expect(callable.calls).toEqual([]);
    await fireEvent.press(screen.getByTestId('delete-understood'));
    await fireEvent.changeText(screen.getByTestId('delete-password'), 'secret');
    await fireEvent.press(screen.getByTestId('confirm-delete-account'));
    await settle();
    expect(auth.reauthenticate).toHaveBeenCalledWith('secret');
    expect(callable.calls).toEqual([{ name: 'deleteAccount', data: { confirm: true } }]);
    expect(auth.logout).toHaveBeenCalled();
  });
});
