import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import 'firebase/compat/storage';

// UploadTask is PromiseLike but does not implement Promise.finally in Firebase 11.
const upload = (task: PromiseLike<unknown>): Promise<unknown> => Promise.resolve(task);

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-intellishop',
    storage: { rules: readFileSync(resolve(__dirname, '..', 'storage.rules'), 'utf8') },
  });
});
afterAll(async () => env?.cleanup());

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('storage: profile photos only, owner only', () => {
  it('owner can upload a small image to their own folder', async () => {
    const storage = env.authenticatedContext('alice').storage();
    await assertSucceeds(upload(storage.ref('profile_images/alice/p.png').put(png, { contentType: 'image/png' })));
  });

  it('rejects other users, wrong types and other paths', async () => {
    await assertFails(upload(env.authenticatedContext('bob').storage().ref('profile_images/alice/p.png').put(png, { contentType: 'image/png' })));
    await assertFails(upload(env.authenticatedContext('alice').storage().ref('profile_images/alice/x.txt').put(png, { contentType: 'text/plain' })));
    await assertFails(upload(env.authenticatedContext('alice').storage().ref('anything/else.png').put(png, { contentType: 'image/png' })));
    await assertFails(env.unauthenticatedContext().storage().ref('profile_images/alice/p.png').getDownloadURL());
  });
});
