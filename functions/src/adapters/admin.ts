/**
 * Production adapters over firebase-admin. Kept thin; behaviour lives in the handlers.
 */
import { createHash, randomUUID } from 'node:crypto';

import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as logger from 'firebase-functions/logger';

import type { AuthAdmin, Clock, Doc, FileStore, Hasher, Ids, Logger, Store, Tx } from '../ports';

if (getApps().length === 0) initializeApp();

const db: Firestore = getFirestore();

export const store: Store = {
  async get(path) {
    const snap = await db.doc(path).get();
    return snap.exists ? (snap.data() as Doc) : null;
  },
  async set(path, data, options) {
    await db.doc(path).set(data, { merge: options?.merge === true });
  },
  async delete(path) {
    await db.doc(path).delete();
  },
  async list(collectionPath) {
    const snap = await db.collection(collectionPath).get();
    return snap.docs.map((d) => ({ id: d.id, data: d.data() as Doc }));
  },
  async recursiveDelete(docPath) {
    await db.recursiveDelete(db.doc(docPath));
  },
  async transaction(fn) {
    return db.runTransaction(async (t) => {
      const tx: Tx = {
        async get(path) {
          const snap = await t.get(db.doc(path));
          return snap.exists ? (snap.data() as Doc) : null;
        },
        set(path, data, options) {
          t.set(db.doc(path), data, { merge: options?.merge === true });
        },
        delete(path) {
          t.delete(db.doc(path));
        },
      };
      return fn(tx);
    });
  },
};

export const authAdmin: AuthAdmin = {
  async deleteUser(uid) {
    try {
      await getAuth().deleteUser(uid);
    } catch (e) {
      // Already deleted (retry after partial failure) is success.
      if ((e as { code?: string }).code !== 'auth/user-not-found') throw e;
    }
  },
};

export const files: FileStore = {
  async deletePrefix(prefix) {
    const bucket = getStorage().bucket();
    const [found] = await bucket.getFiles({ prefix });
    await Promise.all(found.map((f) => f.delete({ ignoreNotFound: true })));
    return found.length;
  },
};

export const clock: Clock = { now: () => Date.now() };
export const ids: Ids = { next: () => randomUUID() };
export const sha256: Hasher = (input) => createHash('sha256').update(input).digest('hex');

/** Structured logs only; callers must never pass user content (ingredients, allergies, text). */
export const log: Logger = {
  info: (event, fields) => logger.info(event, { event, ...fields }),
  warn: (event, fields) => logger.warn(event, { event, ...fields }),
  error: (event, fields) => logger.error(event, { event, ...fields }),
};
