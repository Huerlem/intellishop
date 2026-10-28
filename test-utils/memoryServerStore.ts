/**
 * In-memory implementation of the server `Store` port (functions/src/ports.ts) for handler tests.
 * TEST USE ONLY. Transactions are serialised and applied atomically (all-or-nothing).
 */
import type { Doc, Store, Tx } from '../functions/src/ports';

// Server documents in tests hold only JSON values (numbers, strings, arrays, maps, null).
const clone = <T,>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

export function createMemoryServerStore(seed: Record<string, Doc> = {}) {
  const docs = new Map<string, Doc>(Object.entries(seed).map(([k, v]) => [k, clone(v)]));
  let chain: Promise<unknown> = Promise.resolve();

  const children = (collection: string) => {
    const prefix = `${collection}/`;
    return [...docs.keys()].filter((k) => k.startsWith(prefix) && !k.slice(prefix.length).includes('/'));
  };

  const store: Store & { dump(): Record<string, Doc>; paths(): string[] } = {
    async get(path) {
      const d = docs.get(path);
      return d ? clone(d) : null;
    },
    async set(path, data, options) {
      const prev = docs.get(path);
      docs.set(path, clone(options?.merge && prev ? { ...prev, ...data } : data));
    },
    async delete(path) {
      docs.delete(path);
    },
    async list(collection) {
      return children(collection).map((k) => ({ id: k.slice(collection.length + 1), data: clone(docs.get(k)!) }));
    },
    async recursiveDelete(docPath) {
      for (const k of [...docs.keys()]) if (k === docPath || k.startsWith(`${docPath}/`)) docs.delete(k);
    },
    async transaction(fn) {
      const run = async () => {
        const staged = new Map<string, Doc | null>();
        const tx: Tx = {
          async get(path) {
            if (staged.has(path)) return clone(staged.get(path)) ?? null;
            const d = docs.get(path);
            return d ? clone(d) : null;
          },
          set(path, data, options) {
            const prev = staged.has(path) ? staged.get(path) : docs.get(path);
            staged.set(path, clone(options?.merge && prev ? { ...prev, ...data } : data));
          },
          delete(path) {
            staged.set(path, null);
          },
        };
        const result = await fn(tx); // throws → nothing applied
        for (const [p, d] of staged) {
          if (d === null) docs.delete(p);
          else docs.set(p, d);
        }
        return result;
      };
      const next = chain.then(run, run);
      chain = next.catch(() => undefined);
      return next;
    },
    dump() {
      return Object.fromEntries([...docs.entries()].map(([k, v]) => [k, clone(v)]));
    },
    paths() {
      return [...docs.keys()].sort();
    },
  };
  return store;
}

export function captureLogger() {
  const entries: { level: string; event: string; fields: Record<string, unknown> }[] = [];
  return {
    entries,
    info: (event: string, fields: Record<string, unknown>) => entries.push({ level: 'info', event, fields }),
    warn: (event: string, fields: Record<string, unknown>) => entries.push({ level: 'warn', event, fields }),
    error: (event: string, fields: Record<string, unknown>) => entries.push({ level: 'error', event, fields }),
  };
}
