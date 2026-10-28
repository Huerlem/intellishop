/**
 * In-memory stand-in for the parts of the `firebase/firestore` modular API used by the
 * IntelliShop contexts. TEST USE ONLY — never import from app code (ESLint and
 * __tests__/security.static.test.ts enforce this for app directories).
 *
 * Fidelity rules (mirroring Cloud Firestore behaviour the contexts depend on):
 * - `serverTimestamp()` and JS `Date` values are stored as Timestamp-like objects with `toDate()`.
 * - `updateDoc` on a missing document rejects (Firestore error code `not-found`).
 * - `getDocs` supports `where(field, '==', value)` and `orderBy`; any other operator throws,
 *   so a test cannot pass by silently ignoring a filter.
 * - Reads return deep copies, so callers cannot mutate stored data by reference.
 */

export class MemoryTimestamp {
  constructor(private readonly millis: number) {}
  toDate(): Date {
    return new Date(this.millis);
  }
  toMillis(): number {
    return this.millis;
  }
}

const SERVER_TIMESTAMP = { __serverTimestamp: true } as const;

type DocData = Record<string, unknown>;
type CollectionRef = { type: 'collection'; path: string };
type DocRef = { type: 'document'; collection: string; id: string; path: string };
type Constraint =
  | { type: 'where'; field: string; op: string; value: unknown }
  | { type: 'orderBy'; field: string; direction: 'asc' | 'desc' }
  | { type: 'limit'; count: number };
type Query = { type: 'query'; collection: string; constraints: Constraint[] };

const collections = new Map<string, Map<string, DocData>>();
let autoId = 0;

function toStored(value: unknown): unknown {
  if (value === SERVER_TIMESTAMP) return new MemoryTimestamp(Date.now());
  if (value instanceof Date) return new MemoryTimestamp(value.getTime());
  if (value instanceof MemoryTimestamp) return value;
  if (Array.isArray(value)) return value.map(toStored);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toStored(v)]));
  }
  return value;
}

function copy(value: unknown): unknown {
  if (value instanceof MemoryTimestamp) return value;
  if (Array.isArray(value)) return value.map(copy);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, copy(v)]));
  }
  return value;
}

function bucket(name: string): Map<string, DocData> {
  if (!collections.has(name)) collections.set(name, new Map());
  return collections.get(name)!;
}

function comparable(value: unknown): number | string {
  if (value instanceof MemoryTimestamp) return value.toMillis();
  return value as number | string;
}

function snapshotOf(collection: string, id: string) {
  const data = bucket(collection).get(id);
  return {
    id,
    ref: { type: 'document', collection, id, path: `${collection}/${id}` } as DocRef,
    exists: () => data !== undefined,
    data: () => (data === undefined ? undefined : (copy(data) as DocData)),
  };
}

/** Module replacement for `jest.mock('firebase/firestore', ...)`. */
export const firestoreModule = {
  collection: (_db: unknown, path: string): CollectionRef => ({ type: 'collection', path }),
  doc: (_db: unknown, collection: string, id: string): DocRef => ({
    type: 'document',
    collection,
    id,
    path: `${collection}/${id}`,
  }),
  query: (ref: CollectionRef, ...constraints: Constraint[]): Query => ({
    type: 'query',
    collection: ref.path,
    constraints,
  }),
  where: (field: string, op: string, value: unknown): Constraint => ({ type: 'where', field, op, value }),
  orderBy: (field: string, direction: 'asc' | 'desc' = 'asc'): Constraint => ({ type: 'orderBy', field, direction }),
  limit: (count: number): Constraint => ({ type: 'limit', count }),
  serverTimestamp: () => SERVER_TIMESTAMP,

  async addDoc(ref: CollectionRef, data: DocData) {
    autoId += 1;
    const id = `${ref.path}-${autoId}`;
    bucket(ref.path).set(id, toStored(data) as DocData);
    return { id, path: `${ref.path}/${id}` };
  },

  async setDoc(ref: DocRef, data: DocData) {
    bucket(ref.collection).set(ref.id, toStored(data) as DocData);
  },

  async updateDoc(ref: DocRef, data: DocData) {
    const store = bucket(ref.collection);
    const existing = store.get(ref.id);
    if (!existing) {
      const error = new Error(`No document to update: ${ref.path}`) as Error & { code: string };
      error.code = 'not-found';
      throw error;
    }
    store.set(ref.id, { ...existing, ...(toStored(data) as DocData) });
  },

  async deleteDoc(ref: DocRef) {
    bucket(ref.collection).delete(ref.id);
  },

  async getDoc(ref: DocRef) {
    return snapshotOf(ref.collection, ref.id);
  },

  async getDocs(target: Query | CollectionRef) {
    const collection = target.type === 'query' ? target.collection : target.path;
    const constraints = target.type === 'query' ? target.constraints : [];
    let ids = [...bucket(collection).keys()];

    for (const c of constraints) {
      if (c.type === 'where') {
        if (c.op !== '==') throw new Error(`memoryFirestore: unsupported where operator "${c.op}"`);
        ids = ids.filter((id) => bucket(collection).get(id)?.[c.field] === c.value);
      }
    }
    for (const c of constraints) {
      if (c.type === 'orderBy') {
        const sign = c.direction === 'desc' ? -1 : 1;
        ids.sort((a, b) => {
          const va = comparable(bucket(collection).get(a)?.[c.field]);
          const vb = comparable(bucket(collection).get(b)?.[c.field]);
          return va < vb ? -sign : va > vb ? sign : 0;
        });
      }
    }
    const limitC = constraints.find((c) => c.type === 'limit') as { count: number } | undefined;
    if (limitC) ids = ids.slice(0, limitC.count);

    const docs = ids.map((id) => snapshotOf(collection, id));
    return { docs, size: docs.length, empty: docs.length === 0, forEach: (cb: (d: (typeof docs)[number]) => void) => docs.forEach(cb) };
  },
};

/** Inspection and seeding helpers for tests. */
export const memoryStore = {
  reset() {
    collections.clear();
    autoId = 0;
  },
  seed(collection: string, id: string, data: DocData) {
    bucket(collection).set(id, toStored(data) as DocData);
  },
  get(collection: string, id: string): DocData | undefined {
    const data = bucket(collection).get(id);
    return data === undefined ? undefined : (copy(data) as DocData);
  },
  all(collection: string): { id: string; data: DocData }[] {
    return [...bucket(collection).entries()].map(([id, data]) => ({ id, data: copy(data) as DocData }));
  },
};
