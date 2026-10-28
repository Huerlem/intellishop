/**
 * In-memory stand-in for the parts of the `firebase/firestore` modular API used by IntelliShop.
 * TEST USE ONLY — never import from app code (ESLint and __tests__/security.static.test.ts
 * enforce this for app directories).
 *
 * Fidelity rules (mirroring Cloud Firestore behaviour the app depends on):
 * - Documents are addressed by full path; subcollections are supported (`users/u1/lists/l1/items/i1`).
 * - `serverTimestamp()` and JS `Date` values are stored as Timestamp-like objects with `toDate()`.
 * - `increment(n)` and `deleteField()` are applied on write.
 * - `updateDoc` and batch `update` on a missing document reject (code `not-found`); a failed batch
 *   applies nothing (atomic).
 * - Queries support `where(field, '==', value)`, `orderBy` and `limit`; any other operator throws,
 *   so a test cannot pass by silently ignoring a filter.
 * - `onSnapshot` delivers an initial snapshot and then one per committed change, with
 *   `metadata.fromCache = false` and `hasPendingWrites = false`.
 * - Reads return deep copies, so callers cannot mutate stored data by reference.
 * - `memoryStore.failNextWrite(code)` makes the next write fail, to test error handling.
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
const DELETE_FIELD = { __deleteField: true } as const;
type Increment = { __increment: number };

type DocData = Record<string, unknown>;
type CollectionRef = { type: 'collection'; path: string; id: string };
type DocRef = { type: 'document'; path: string; id: string; parent: CollectionRef; collection: string };
type Constraint =
  | { type: 'where'; field: string; op: string; value: unknown }
  | { type: 'orderBy'; field: string; direction: 'asc' | 'desc' }
  | { type: 'limit'; count: number };
type Query = { type: 'query'; collection: string; constraints: Constraint[] };

const docs = new Map<string, DocData>(); // full doc path → data
let autoId = 0;
let pendingFailure: string | null = null;
const listeners = new Set<() => void>();

const isIncrement = (v: unknown): v is Increment => !!v && typeof v === 'object' && '__increment' in (v as object);

function toStored(value: unknown, previous?: unknown): unknown {
  if (value === SERVER_TIMESTAMP) return new MemoryTimestamp(Date.now());
  if (value instanceof Date) return new MemoryTimestamp(value.getTime());
  if (value instanceof MemoryTimestamp) return value;
  if (isIncrement(value)) return (typeof previous === 'number' ? previous : 0) + value.__increment;
  if (Array.isArray(value)) return value.map((v) => toStored(v));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toStored(v)]));
  }
  return value;
}

function merge(existing: DocData, patch: DocData, dottedPaths = false): DocData {
  const next: DocData = copy(existing) as DocData;
  for (const [k, v] of Object.entries(patch)) {
    // update()/updateDoc() treat "a.b" as a field path; set() treats it as a literal key.
    const path = dottedPaths ? k.split('.') : [k];
    let target = next;
    for (const seg of path.slice(0, -1)) {
      if (!target[seg] || typeof target[seg] !== 'object' || target[seg] instanceof MemoryTimestamp) target[seg] = {};
      target = target[seg] as DocData;
    }
    const leaf = path[path.length - 1];
    if (v === DELETE_FIELD) delete target[leaf];
    else target[leaf] = toStored(v, target[leaf]);
  }
  return next;
}

function copy(value: unknown): unknown {
  if (value instanceof MemoryTimestamp) return value;
  if (Array.isArray(value)) return value.map(copy);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, copy(v)]));
  }
  return value;
}

function comparable(value: unknown): number | string {
  if (value instanceof MemoryTimestamp) return value.toMillis();
  return value as number | string;
}

function joinPath(segments: unknown[]): string {
  return segments
    .flatMap((s) => (typeof s === 'string' ? s.split('/') : []))
    .filter(Boolean)
    .join('/');
}

function makeCollection(path: string): CollectionRef {
  return { type: 'collection', path, id: path.split('/').pop()! };
}

function makeDoc(path: string): DocRef {
  const parts = path.split('/');
  const id = parts.pop()!;
  const parentPath = parts.join('/');
  return { type: 'document', path, id, parent: makeCollection(parentPath), collection: parentPath };
}

function snapshotOf(path: string) {
  const data = docs.get(path);
  return {
    id: path.split('/').pop()!,
    ref: makeDoc(path),
    exists: () => data !== undefined,
    data: () => (data === undefined ? undefined : (copy(data) as DocData)),
    metadata: { fromCache: false, hasPendingWrites: false },
  };
}

function childIds(collection: string): string[] {
  const prefix = `${collection}/`;
  const ids: string[] = [];
  for (const key of docs.keys()) {
    if (key.startsWith(prefix) && !key.slice(prefix.length).includes('/')) ids.push(key.slice(prefix.length));
  }
  return ids;
}

function runQuery(target: Query | CollectionRef) {
  const collection = target.type === 'query' ? target.collection : target.path;
  const constraints = target.type === 'query' ? target.constraints : [];
  let ids = childIds(collection);
  const get = (id: string) => docs.get(`${collection}/${id}`);
  for (const c of constraints) {
    if (c.type === 'where') {
      if (c.op !== '==') throw new Error(`memoryFirestore: unsupported where operator "${c.op}"`);
      ids = ids.filter((id) => get(id)?.[c.field] === c.value);
    }
  }
  for (const c of constraints) {
    if (c.type === 'orderBy') {
      const sign = c.direction === 'desc' ? -1 : 1;
      ids.sort((a, b) => {
        const va = comparable(get(a)?.[c.field]);
        const vb = comparable(get(b)?.[c.field]);
        return va < vb ? -sign : va > vb ? sign : 0;
      });
    }
  }
  const limitC = constraints.find((c) => c.type === 'limit') as { count: number } | undefined;
  if (limitC) ids = ids.slice(0, limitC.count);
  const list = ids.map((id) => snapshotOf(`${collection}/${id}`));
  return {
    docs: list,
    size: list.length,
    empty: list.length === 0,
    metadata: { fromCache: false, hasPendingWrites: false },
    forEach: (cb: (d: (typeof list)[number]) => void) => list.forEach(cb),
  };
}

function takeFailure() {
  if (!pendingFailure) return;
  const error = new Error(`memoryFirestore: injected failure (${pendingFailure})`) as Error & { code: string };
  error.code = pendingFailure;
  pendingFailure = null;
  throw error;
}

function notFound(path: string) {
  const error = new Error(`No document to update: ${path}`) as Error & { code: string };
  error.code = 'not-found';
  return error;
}

function emit() {
  for (const l of [...listeners]) l();
}

type BatchOp = { kind: 'set' | 'update' | 'delete'; ref: DocRef; data?: DocData; merge?: boolean };

/** Module replacement for `jest.mock('firebase/firestore', ...)`. */
export const firestoreModule = {
  getFirestore: () => ({}),
  collection: (_db: unknown, ...segments: string[]): CollectionRef => makeCollection(joinPath(segments)),
  doc: (parentOrDb: unknown, ...segments: string[]): DocRef => {
    if (parentOrDb && (parentOrDb as CollectionRef).type === 'collection') {
      const parent = parentOrDb as CollectionRef;
      if (segments.length === 0) {
        autoId += 1;
        return makeDoc(`${parent.path}/auto-${autoId}`);
      }
      return makeDoc(joinPath([parent.path, ...segments]));
    }
    return makeDoc(joinPath(segments));
  },
  query: (ref: CollectionRef, ...constraints: Constraint[]): Query => ({ type: 'query', collection: ref.path, constraints }),
  where: (field: string, op: string, value: unknown): Constraint => ({ type: 'where', field, op, value }),
  orderBy: (field: string, direction: 'asc' | 'desc' = 'asc'): Constraint => ({ type: 'orderBy', field, direction }),
  limit: (count: number): Constraint => ({ type: 'limit', count }),
  serverTimestamp: () => SERVER_TIMESTAMP,
  deleteField: () => DELETE_FIELD,
  increment: (n: number): Increment => ({ __increment: n }),
  Timestamp: {
    fromMillis: (ms: number) => new MemoryTimestamp(ms),
    fromDate: (d: Date) => new MemoryTimestamp(d.getTime()),
    now: () => new MemoryTimestamp(Date.now()),
  },

  async addDoc(ref: CollectionRef, data: DocData) {
    takeFailure();
    autoId += 1;
    const id = `${ref.id}-${autoId}`;
    const path = `${ref.path}/${id}`;
    docs.set(path, toStored(data) as DocData);
    emit();
    return makeDoc(path);
  },

  async setDoc(ref: DocRef, data: DocData, options?: { merge?: boolean }) {
    takeFailure();
    const existing = docs.get(ref.path);
    docs.set(ref.path, options?.merge && existing ? merge(existing, data) : merge({}, data));
    emit();
  },

  async updateDoc(ref: DocRef, data: DocData) {
    takeFailure();
    const existing = docs.get(ref.path);
    if (!existing) throw notFound(ref.path);
    docs.set(ref.path, merge(existing, data, true));
    emit();
  },

  async deleteDoc(ref: DocRef) {
    takeFailure();
    docs.delete(ref.path);
    emit();
  },

  async getDoc(ref: DocRef) {
    return snapshotOf(ref.path);
  },

  async getDocs(target: Query | CollectionRef) {
    return runQuery(target);
  },

  writeBatch: () => {
    const ops: BatchOp[] = [];
    const batch = {
      set(ref: DocRef, data: DocData, options?: { merge?: boolean }) {
        ops.push({ kind: 'set', ref, data, merge: options?.merge });
        return batch;
      },
      update(ref: DocRef, data: DocData) {
        ops.push({ kind: 'update', ref, data });
        return batch;
      },
      delete(ref: DocRef) {
        ops.push({ kind: 'delete', ref });
        return batch;
      },
      async commit() {
        takeFailure();
        // Validate first, then apply: a failing batch changes nothing.
        const staged = new Map<string, DocData | undefined>();
        const read = (p: string) => (staged.has(p) ? staged.get(p) : docs.get(p));
        for (const op of ops) {
          const existing = read(op.ref.path);
          if (op.kind === 'delete') staged.set(op.ref.path, undefined);
          else if (op.kind === 'update') {
            if (!existing) throw notFound(op.ref.path);
            staged.set(op.ref.path, merge(existing, op.data!, true));
          } else staged.set(op.ref.path, op.merge && existing ? merge(existing, op.data!) : merge({}, op.data!));
        }
        for (const [p, data] of staged) {
          if (data === undefined) docs.delete(p);
          else docs.set(p, data);
        }
        emit();
      },
    };
    return batch;
  },

  onSnapshot(target: DocRef | Query | CollectionRef, ...rest: unknown[]) {
    const fns = rest.filter((r) => typeof r === 'function') as [(snap: unknown) => void, ((e: unknown) => void)?];
    const [next] = fns;
    const deliver = () => {
      const snap = target.type === 'document' ? snapshotOf(target.path) : runQuery(target);
      next(snap);
    };
    listeners.add(deliver);
    // Deliver asynchronously, like the real SDK.
    Promise.resolve().then(() => listeners.has(deliver) && deliver());
    return () => listeners.delete(deliver);
  },
};

/** Inspection and seeding helpers for tests. Paths are collection paths (e.g. 'users/u1/lists'). */
export const memoryStore = {
  reset() {
    docs.clear();
    autoId = 0;
    pendingFailure = null;
    listeners.clear();
  },
  seed(collection: string, id: string, data: DocData) {
    docs.set(`${collection}/${id}`, toStored(data) as DocData);
    emit();
  },
  get(collection: string, id: string): DocData | undefined {
    const data = docs.get(`${collection}/${id}`);
    return data === undefined ? undefined : (copy(data) as DocData);
  },
  all(collection: string): { id: string; data: DocData }[] {
    return childIds(collection).map((id) => ({ id, data: copy(docs.get(`${collection}/${id}`)) as DocData }));
  },
  paths(prefix = ''): string[] {
    return [...docs.keys()].filter((k) => k.startsWith(prefix)).sort();
  },
  failNextWrite(code = 'unavailable') {
    pendingFailure = code;
  },
};
