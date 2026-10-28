/**
 * Firestore Security Rules tests — run against the Firestore emulator:
 *   npx firebase-tools@15.34.1 emulators:exec --only firestore,storage --project demo-intellishop \
 *     "npx jest -c jest.rules.config.js"
 * (CI job "firebase-rules"). Uses @firebase/rules-unit-testing 4.x (peer firebase ^11).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const PROJECT = 'demo-intellishop';
const ts = () => firebase.firestore.FieldValue.serverTimestamp();
const inc = (n: number) => firebase.firestore.FieldValue.increment(n);

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: readFileSync(resolve(__dirname, '..', 'firestore.rules'), 'utf8') },
  });
});
afterAll(async () => env?.cleanup());
beforeEach(async () => env.clearFirestore());

const alice = () => env.authenticatedContext('alice', { email: 'alice@example.com', email_verified: true }).firestore();
const bob = () => env.authenticatedContext('bob', { email: 'bob@example.com' }).firestore();
const anon = () => env.unauthenticatedContext().firestore();

async function seed(path: string, data: Record<string, unknown>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(path).set(data);
  });
}

function createList(db: firebase.firestore.Firestore, uid: string, id: string, name = 'Weekly') {
  const batch = db.batch();
  batch.set(db.doc(`users/${uid}/lists/${id}`), { name, archived: false, itemCount: 0, lastItemOp: null, createdAt: ts(), updatedAt: ts() });
  batch.set(db.doc(`users/${uid}/meta/counters`), { activeLists: inc(1), lastOp: { type: 'listCreate', id }, updatedAt: ts() }, { merge: true });
  return batch.commit();
}

function addItem(db: firebase.firestore.Firestore, uid: string, listId: string, id: string, extra: Record<string, unknown> = {}) {
  const batch = db.batch();
  batch.set(db.doc(`users/${uid}/lists/${listId}/items/${id}`), {
    name: 'Milk', normalizedName: 'milk', quantity: 1, unit: 'l', category: 'dairy_eggs', notes: '', checked: false, pricePence: null, createdAt: ts(), updatedAt: ts(), ...extra,
  });
  batch.update(db.doc(`users/${uid}/lists/${listId}`), { itemCount: inc(1), lastItemOp: { type: 'add', id }, updatedAt: ts() });
  return batch.commit();
}

function addPantry(db: firebase.firestore.Firestore, uid: string, id: string) {
  const batch = db.batch();
  batch.set(db.doc(`users/${uid}/pantry/${id}`), {
    name: 'Rice', normalizedName: 'rice', quantity: 1, unit: 'kg', minQuantity: 0, category: 'cupboard', expiryDate: null, expiryKind: null, lastPurchasedAt: null, createdAt: ts(), updatedAt: ts(),
  });
  batch.set(db.doc(`users/${uid}/meta/counters`), { pantryItems: inc(1), lastOp: { type: 'pantryAdd', id }, updatedAt: ts() }, { merge: true });
  return batch.commit();
}

describe('profile (users/{uid})', () => {
  const profile = (extra: Record<string, unknown> = {}) => ({ displayName: 'Alice', email: 'alice@example.com', createdAt: ts(), termsVersion: '1.0.0', termsAcceptedAt: ts(), ...extra });

  it('owner can create a minimal profile; phone and address are rejected', async () => {
    await assertSucceeds(alice().doc('users/alice').set(profile()));
    await env.clearFirestore();
    await assertFails(alice().doc('users/alice').set(profile({ phoneNumber: '07123' })));
    await assertFails(alice().doc('users/alice').set(profile({ address: { postcode: 'AB1' } })));
  });

  it('email must match the signed-in account; others cannot read or write', async () => {
    await assertFails(alice().doc('users/alice').set(profile({ email: 'someone@else.com' })));
    await seed('users/alice', { displayName: 'Alice', email: 'alice@example.com' });
    await assertFails(bob().doc('users/alice').get());
    await assertFails(anon().doc('users/alice').get());
    await assertFails(bob().doc('users/alice').update({ displayName: 'x', updatedAt: ts() }));
  });

  it('only displayName/photoURL/terms fields can be updated; deletion is server-only', async () => {
    await seed('users/alice', { displayName: 'Alice', email: 'alice@example.com', termsVersion: '1.0.0' });
    await assertSucceeds(alice().doc('users/alice').update({ displayName: 'Al', updatedAt: ts() }));
    await assertFails(alice().doc('users/alice').update({ email: 'new@example.com', updatedAt: ts() }));
    await assertFails(alice().doc('users/alice').update({ plan: 'premium', updatedAt: ts() }));
    await assertFails(alice().doc('users/alice').delete());
  });
});

describe('lists and Free-plan limits', () => {
  it('owner can create lists via the counter batch; a list without the counter is rejected', async () => {
    await assertSucceeds(createList(alice(), 'alice', 'l1'));
    await assertFails(alice().doc('users/alice/lists/l2').set({ name: 'X', archived: false, itemCount: 0, lastItemOp: null, createdAt: ts(), updatedAt: ts() }));
  });

  it('Free plan: third active list is rejected; archiving frees capacity', async () => {
    const db = alice();
    await assertSucceeds(createList(db, 'alice', 'l1'));
    await assertSucceeds(createList(db, 'alice', 'l2'));
    await assertFails(createList(db, 'alice', 'l3'));

    const archive = db.batch();
    archive.update(db.doc('users/alice/lists/l1'), { archived: true, updatedAt: ts() });
    archive.set(db.doc('users/alice/meta/counters'), { activeLists: inc(-1), lastOp: { type: 'listArchive', id: 'l1' }, updatedAt: ts() }, { merge: true });
    await assertSucceeds(archive.commit());
    await assertSucceeds(createList(db, 'alice', 'l3'));
  });

  it('Premium (server-written entitlement): no list limit', async () => {
    await seed('entitlements/alice', { plan: 'premium' });
    const db = alice();
    for (const id of ['a', 'b', 'c', 'd']) await assertSucceeds(createList(db, 'alice', id));
  });

  it('counter cannot be decremented without deleting a list (no limit bypass)', async () => {
    const db = alice();
    await createList(db, 'alice', 'l1');
    await createList(db, 'alice', 'l2');
    await assertFails(db.doc('users/alice/meta/counters').set({ activeLists: inc(-1), lastOp: { type: 'listDelete', id: 'l1' }, updatedAt: ts() }, { merge: true }));
    await assertFails(db.doc('users/alice/meta/counters').set({ activeLists: 0, lastOp: { type: 'listDelete', id: 'nope' }, updatedAt: ts() }, { merge: true }));
  });

  it('client cannot write entitlements, usage, consents or dietary preferences', async () => {
    const db = alice();
    await assertFails(db.doc('entitlements/alice').set({ plan: 'premium' }));
    await assertFails(db.doc('usage/alice').set({ introCreditsConsumed: 0 }));
    await assertFails(db.doc('users/alice/consents/ai').set({ granted: true }));
    await assertFails(db.doc('users/alice/private/preferences').set({ allergens: [] }));
    await seed('entitlements/alice', { plan: 'free' });
    await assertSucceeds(db.doc('entitlements/alice').get());
    await assertFails(bob().doc('entitlements/alice').get());
  });

  it('active list delete must release its counter', async () => {
    const db = alice();
    await createList(db, 'alice', 'l1');
    await assertFails(db.doc('users/alice/lists/l1').delete());
    const batch = db.batch();
    batch.delete(db.doc('users/alice/lists/l1'));
    batch.set(db.doc('users/alice/meta/counters'), { activeLists: inc(-1), lastOp: { type: 'listDelete', id: 'l1' }, updatedAt: ts() }, { merge: true });
    await assertSucceeds(batch.commit());
  });
});

describe('list items', () => {
  it('Free plan: 21st item in a list is rejected', async () => {
    const db = alice();
    await createList(db, 'alice', 'l1');
    for (let i = 0; i < 20; i += 1) await assertSucceeds(addItem(db, 'alice', 'l1', `i${i}`));
    await assertFails(addItem(db, 'alice', 'l1', 'i20'));
  });

  it('validates item fields and blocks unknown fields (e.g. invented price data)', async () => {
    const db = alice();
    await createList(db, 'alice', 'l1');
    await assertFails(addItem(db, 'alice', 'l1', 'bad1', { quantity: -1 }));
    await assertFails(addItem(db, 'alice', 'l1', 'bad2', { unit: 'handful' }));
    await assertFails(addItem(db, 'alice', 'l1', 'bad3', { storePrice: 199 }));
    await assertFails(addItem(db, 'alice', 'l1', 'bad4', { pricePence: 1.5 }));
    await assertSucceeds(addItem(db, 'alice', 'l1', 'ok', { pricePence: 125 }));
  });

  it("other users cannot read or change someone's items", async () => {
    const db = alice();
    await createList(db, 'alice', 'l1');
    await addItem(db, 'alice', 'l1', 'i1');
    await assertFails(bob().doc('users/alice/lists/l1/items/i1').get());
    await assertFails(bob().doc('users/alice/lists/l1/items/i1').update({ checked: true, updatedAt: ts() }));
    await assertSucceeds(db.doc('users/alice/lists/l1/items/i1').update({ checked: true, updatedAt: ts() }));
  });
});

describe('pantry', () => {
  it('Free plan: 31st pantry item is rejected', async () => {
    const db = alice();
    for (let i = 0; i < 30; i += 1) await assertSucceeds(addPantry(db, 'alice', `p${i}`));
    await assertFails(addPantry(db, 'alice', 'p30'));
  });

  it('quantity may be zero but not negative', async () => {
    const db = alice();
    await addPantry(db, 'alice', 'p1');
    await assertSucceeds(db.doc('users/alice/pantry/p1').update({ quantity: 0, updatedAt: ts() }));
    await assertFails(db.doc('users/alice/pantry/p1').update({ quantity: -1, updatedAt: ts() }));
  });
});

describe('trips and favourites', () => {
  it('owner can start and finish a trip; finished trips are immutable', async () => {
    const db = alice();
    await assertSucceeds(db.doc('users/alice/trips/t1').set({ listId: 'l1', listName: 'Weekly', status: 'active', startedAt: ts(), finishedAt: null, lines: {}, actualTotalPence: null }));
    await assertSucceeds(db.doc('users/alice/trips/t1').update({ 'lines.i1': { outcome: 'collected', quantity: 1, unit: 'l' } }));
    await assertSucceeds(db.doc('users/alice/trips/t1').update({ status: 'finished', finishedAt: ts(), actualTotalPence: 2350 }));
    await assertFails(db.doc('users/alice/trips/t1').update({ actualTotalPence: 1 }));
  });

  it('favourites: create and delete own; no updates', async () => {
    const db = alice();
    await assertSucceeds(db.doc('users/alice/favourites/r1').set({ recipe: { id: 'r1', title: 'Soup' }, savedAt: ts() }));
    await assertFails(db.doc('users/alice/favourites/r1').update({ savedAt: ts() }));
    await assertFails(bob().doc('users/alice/favourites/r1').get());
    await assertSucceeds(db.doc('users/alice/favourites/r1').delete());
  });

  it('legacy V1 top-level collections and unknown paths are closed', async () => {
    await seed('shoppingLists/x', { userId: 'alice' });
    await assertFails(alice().doc('shoppingLists/x').get());
    await assertFails(alice().doc('aiCache/k').get());
    await assertFails(alice().doc('random/doc').set({ a: 1 }));
  });
});
