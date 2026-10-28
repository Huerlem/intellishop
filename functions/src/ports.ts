/**
 * Ports used by the handlers. Production adapters (adapters/*.ts) wrap firebase-admin and the AI
 * provider; tests use in-memory fakes. Handlers never import firebase-admin directly.
 */

export type Doc = Record<string, unknown>;

export interface Tx {
  get(path: string): Promise<Doc | null>;
  set(path: string, data: Doc, options?: { merge?: boolean }): void;
  delete(path: string): void;
}

export interface Store {
  get(path: string): Promise<Doc | null>;
  set(path: string, data: Doc, options?: { merge?: boolean }): Promise<void>;
  delete(path: string): Promise<void>;
  /** Documents directly inside a collection (no subcollections). */
  list(collectionPath: string): Promise<{ id: string; data: Doc }[]>;
  /** Deletes a document and every subcollection below it. */
  recursiveDelete(docPath: string): Promise<void>;
  transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
}

export interface AuthAdmin {
  deleteUser(uid: string): Promise<void>;
}

export interface FileStore {
  deletePrefix(prefix: string): Promise<number>;
}

export interface Logger {
  info(event: string, fields: Record<string, unknown>): void;
  warn(event: string, fields: Record<string, unknown>): void;
  error(event: string, fields: Record<string, unknown>): void;
}

export type ProviderRequest = {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  maxOutputTokens: number;
  timeoutMs: number;
};

export type ProviderResponse = {
  json: unknown;
  model: string;
  stopReason: string | null;
  usage: { inputTokens: number; outputTokens: number };
};

export interface AiProvider {
  readonly name: string;
  generate(req: ProviderRequest): Promise<ProviderResponse>;
}

export class ProviderError extends Error {
  constructor(
    public readonly kind: 'timeout' | 'unavailable' | 'rate_limited' | 'refused' | 'truncated' | 'bad_response' | 'auth',
    message: string
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

/** Mirrors the HTTPS error codes of firebase-functions; `reason` is the app-level code. */
export type ErrorCode =
  | 'invalid-argument'
  | 'failed-precondition'
  | 'permission-denied'
  | 'resource-exhausted'
  | 'unauthenticated'
  | 'unavailable'
  | 'internal'
  | 'not-found'
  | 'aborted'
  | 'deadline-exceeded';

export class HandlerError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly reason: string,
    message: string,
    public readonly details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'HandlerError';
  }
}

export type CallerContext = {
  uid: string;
  emailVerified: boolean;
  /** Seconds since epoch of the last sign-in (ID token `auth_time`). */
  authTime: number;
};

export interface Clock {
  now(): number;
}

export interface Ids {
  next(): string;
}

/** SHA-256 hex, injected so handlers stay platform-independent. */
export type Hasher = (input: string) => string;
