import { deleteAccount, exportUserData, REAUTH_WINDOW_SECONDS, setAiConsent, setDietaryPreferences } from '@/functions/src/handlers/account';
import type { CallerContext } from '@/functions/src/ports';
import { captureLogger, createMemoryServerStore } from '../../test-utils/memoryServerStore';

const NOW = Date.UTC(2026, 9, 28, 12);
const clock = { now: () => NOW };
const hash = (s: string) => Buffer.from(s).toString('hex'); // contains no readable UID
const alice: CallerContext = { uid: 'alice', emailVerified: true, authTime: Math.floor(NOW / 1000) - 60 };

function seededStore() {
  return createMemoryServerStore({
    'users/alice': { displayName: 'Alice', email: 'alice@example.com', phoneNumber: '07123 456789' },
    'users/alice/lists/l1': { name: 'Weekly' },
    'users/alice/lists/l1/items/i1': { name: 'Milk' },
    'users/alice/pantry/p1': { name: 'Rice' },
    'users/alice/private/preferences': { allergens: ['milk'] },
    'users/alice/consents/ai': { granted: true },
    'users/alice/aiCache/k1': { recipes: [] },
    'entitlements/alice': { plan: 'premium' },
    'usage/alice': { introCreditsConsumed: 1 },
    'users/bob': { displayName: 'Bob' },
    'users/bob/lists/l9': { name: 'Bob list' },
  });
}

describe('deleteAccount (L2-06)', () => {
  it('requires explicit confirmation and a recent sign-in', async () => {
    const store = seededStore();
    const deps = { store, auth: { deleteUser: jest.fn() }, files: { deletePrefix: jest.fn(async () => 0) }, clock, hash, logger: captureLogger(), deleteSubscriber: null };
    await expect(deleteAccount(alice, {}, deps)).rejects.toMatchObject({ reason: 'CONFIRMATION_REQUIRED' });
    const stale = { ...alice, authTime: Math.floor(NOW / 1000) - REAUTH_WINDOW_SECONDS - 1 };
    await expect(deleteAccount(stale, { confirm: true }, deps)).rejects.toMatchObject({ reason: 'REAUTH_REQUIRED' });
    expect(deps.auth.deleteUser).not.toHaveBeenCalled();
    expect(store.paths()).toContain('users/alice/lists/l1/items/i1');
  });

  it('deletes all of the user’s data, files, subscription record and sign-in account; keeps others', async () => {
    const store = seededStore();
    const order: string[] = [];
    const logger = captureLogger();
    const deps = {
      store,
      auth: { deleteUser: jest.fn(async () => void order.push('auth')) },
      files: { deletePrefix: jest.fn(async () => (order.push('files'), 2)) },
      clock,
      hash,
      logger,
      deleteSubscriber: jest.fn(async () => void order.push('revenuecat')),
    };
    const result = await deleteAccount(alice, { confirm: true }, deps);
    expect(result).toEqual({ deleted: true, completedAt: NOW });
    expect(store.paths().filter((p) => p.includes('alice'))).toEqual([]);
    expect(store.paths()).toEqual(expect.arrayContaining(['users/bob', 'users/bob/lists/l9']));
    expect(deps.files.deletePrefix).toHaveBeenCalledWith('profile_images/alice/');
    expect(order).toEqual(['files', 'revenuecat', 'auth']); // sign-in account deleted last

    // Minimal deletion record: hashed ID only, no email or name anywhere.
    const log = store.dump()[`deletionLog/${hash('deletion:alice')}`];
    expect(log).toMatchObject({ status: 'completed', completedAt: NOW, requestedAt: NOW });
    expect(JSON.stringify(store.dump())).not.toContain('alice@example.com');
    expect(JSON.stringify(logger.entries)).not.toContain('alice@example.com');
  });

  it('is idempotent (retry after a partial failure succeeds)', async () => {
    const store = seededStore();
    const deleteUser = jest.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValue(undefined);
    const deps = { store, auth: { deleteUser }, files: { deletePrefix: async () => 0 }, clock, hash, logger: captureLogger(), deleteSubscriber: null };
    await expect(deleteAccount(alice, { confirm: true }, deps)).rejects.toThrow('network');
    await expect(deleteAccount(alice, { confirm: true }, deps)).resolves.toMatchObject({ deleted: true });
    expect(store.dump()[`deletionLog/${hash('deletion:alice')}`]).toMatchObject({ steps: { subscriptionProvider: 'not_configured', auth: 'deleted' } });
  });
});

describe('exportUserData (L2-08)', () => {
  it('exports everything stored about the user (including legacy fields) and nothing about others', async () => {
    const store = seededStore();
    const { data, exportedAt } = await exportUserData(alice, { store, clock });
    expect(exportedAt).toBe(NOW);
    expect(data.profile).toMatchObject({ phoneNumber: '07123 456789' }); // right of access covers legacy data
    expect(data.lists).toEqual([{ id: 'l1', name: 'Weekly', items: [{ id: 'i1', name: 'Milk' }] }]);
    expect(data.pantry).toEqual([{ id: 'p1', name: 'Rice' }]);
    expect(data.entitlement).toEqual({ plan: 'premium' });
    expect(JSON.stringify(data)).not.toContain('Bob');
  });
});

describe('consent and dietary preferences (L3-01, L3-03)', () => {
  it('records AI consent and withdrawal with versions and timestamps', async () => {
    const store = createMemoryServerStore();
    await setAiConsent(alice, { granted: true, version: '1.0.0' }, { store, clock });
    expect(await store.get('users/alice/consents/ai')).toEqual({ granted: true, version: '1.0.0', updatedAt: NOW, grantedAt: NOW });
    await setAiConsent(alice, { granted: false, version: '1.0.0' }, { store, clock });
    expect(await store.get('users/alice/consents/ai')).toMatchObject({ granted: false, withdrawnAt: NOW, grantedAt: NOW });
    await expect(setAiConsent(alice, { granted: 'yes', version: '1.0.0' }, { store, clock })).rejects.toMatchObject({ reason: 'INVALID_INPUT' });
  });

  it('stores preferences only with explicit consent; withdrawal deletes them', async () => {
    const store = createMemoryServerStore();
    await setDietaryPreferences(alice, { consent: true, version: '1.0.0', allergens: ['peanuts', 'peanuts'], diets: ['vegetarian'], avoid: [' coriander '], severity: 'severe' }, { store, clock });
    expect(await store.get('users/alice/private/preferences')).toMatchObject({ allergens: ['peanuts'], diets: ['vegetarian'], otherAvoid: ['coriander'], severity: 'severe', consent: { granted: true } });
    await setDietaryPreferences(alice, { consent: false, version: '1.0.0' }, { store, clock });
    expect(await store.get('users/alice/private/preferences')).toBeNull();
    expect(await store.get('users/alice/consents/dietary')).toMatchObject({ granted: false, withdrawnAt: NOW });
  });

  it('rejects unknown allergen or diet codes and oversized input', async () => {
    const store = createMemoryServerStore();
    const base = { consent: true, version: '1.0.0', diets: [], avoid: [], severity: 'avoid' };
    await expect(setDietaryPreferences(alice, { ...base, allergens: ['gluten', 'chocolate'] }, { store, clock })).rejects.toMatchObject({ reason: 'INVALID_INPUT' });
    await expect(setDietaryPreferences(alice, { ...base, allergens: [], diets: ['keto'] }, { store, clock })).rejects.toMatchObject({ reason: 'INVALID_INPUT' });
    await expect(setDietaryPreferences(alice, { ...base, allergens: [], avoid: Array(21).fill('x') }, { store, clock })).rejects.toMatchObject({ reason: 'INVALID_INPUT' });
    expect(store.paths()).toEqual([]);
  });
});
