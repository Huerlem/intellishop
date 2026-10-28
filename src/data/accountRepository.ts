/**
 * Account-level data and server operations.
 *  - entitlements/{uid}, usage/{uid}: written ONLY by Cloud Functions (firestore.rules), read here.
 *  - users/{uid}/private/preferences, users/{uid}/consents/*: written only by Cloud Functions
 *    after validation and consent checks; readable by the owner.
 *  - Account deletion and data export run on the server (callable functions).
 */
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/config';
import { DEFAULT_ENTITLEMENT, INTRODUCTORY_AI_CREDITS, type EntitlementState, type PlanId, type SubscriptionStatus } from '@/shared/entitlements/plans';
import { ALLERGEN_CODES, DIET_CODES, type AllergenCode, type DietCode } from '@/shared/food/allergens';
import { DataError, mapFirestoreError, num, refs, requireDb, toMillis } from './firestore';

const PLANS: PlanId[] = ['free', 'standard', 'premium'];
const STATUSES: SubscriptionStatus[] = ['none', 'active', 'in_grace_period', 'in_billing_retry', 'cancelled_active', 'expired', 'refunded'];

export function mapEntitlement(d: Record<string, unknown> | undefined): EntitlementState {
  if (!d) return DEFAULT_ENTITLEMENT;
  return {
    plan: PLANS.includes(d.plan as PlanId) ? (d.plan as PlanId) : 'free',
    status: STATUSES.includes(d.status as SubscriptionStatus) ? (d.status as SubscriptionStatus) : 'none',
    expiresAt: toMillis(d.expiresAt),
    introCreditsGranted: num(d.introCreditsGranted, INTRODUCTORY_AI_CREDITS),
    introCreditsConsumed: num(d.introCreditsConsumed, 0),
    updatedAt: toMillis(d.updatedAt) ?? 0,
  };
}

export type UsageView = { introCreditsGranted: number; introCreditsConsumed: number; premiumMonth: string; premiumMonthCount: number };

export function mapUsage(d: Record<string, unknown> | undefined): UsageView {
  return {
    introCreditsGranted: num(d?.introCreditsGranted, INTRODUCTORY_AI_CREDITS),
    introCreditsConsumed: num(d?.introCreditsConsumed, 0),
    premiumMonth: typeof d?.premiumMonth === 'string' ? d.premiumMonth : '',
    premiumMonthCount: num(d?.premiumMonthCount, 0),
  };
}

export function subscribeEntitlement(uid: string, onData: (e: EntitlementState) => void, onError: (e: DataError) => void) {
  return onSnapshot(
    refs.entitlement(uid),
    (snap) => onData(mapEntitlement(snap.exists() ? snap.data() : undefined)),
    (error) => onError(mapFirestoreError(error))
  );
}

export function subscribeUsage(uid: string, onData: (u: UsageView) => void, onError: (e: DataError) => void) {
  return onSnapshot(
    refs.usage(uid),
    (snap) => onData(mapUsage(snap.exists() ? snap.data() : undefined)),
    (error) => onError(mapFirestoreError(error))
  );
}

export type DietaryPreferences = {
  consented: boolean;
  allergens: AllergenCode[];
  diets: DietCode[];
  avoid: string[];
  severity: 'avoid' | 'severe';
};

export const EMPTY_PREFERENCES: DietaryPreferences = { consented: false, allergens: [], diets: [], avoid: [], severity: 'avoid' };

export function mapPreferences(d: Record<string, unknown> | undefined): DietaryPreferences {
  if (!d) return EMPTY_PREFERENCES;
  const consent = d.consent as { granted?: boolean } | undefined;
  return {
    consented: consent?.granted === true,
    allergens: Array.isArray(d.allergens) ? (d.allergens.filter((a) => (ALLERGEN_CODES as readonly string[]).includes(a as string)) as AllergenCode[]) : [],
    diets: Array.isArray(d.diets) ? (d.diets.filter((x) => (DIET_CODES as readonly string[]).includes(x as string)) as DietCode[]) : [],
    avoid: Array.isArray(d.otherAvoid) ? d.otherAvoid.filter((x): x is string => typeof x === 'string') : [],
    severity: d.severity === 'severe' ? 'severe' : 'avoid',
  };
}

export function subscribePreferences(uid: string, onData: (p: DietaryPreferences) => void, onError: (e: DataError) => void) {
  return onSnapshot(
    doc(requireDb(), 'users', uid, 'private', 'preferences'),
    (snap) => onData(mapPreferences(snap.exists() ? snap.data() : undefined)),
    (error) => onError(mapFirestoreError(error))
  );
}

export type ConsentState = { granted: boolean; version: string | null; updatedAt: number | null };

export function subscribeConsent(uid: string, type: 'ai' | 'dietary', onData: (c: ConsentState) => void, onError: (e: DataError) => void) {
  return onSnapshot(
    doc(requireDb(), 'users', uid, 'consents', type),
    (snap) => {
      const d = snap.exists() ? snap.data() : undefined;
      onData({ granted: d?.granted === true, version: typeof d?.version === 'string' ? d.version : null, updatedAt: toMillis(d?.updatedAt) });
    },
    (error) => onError(mapFirestoreError(error))
  );
}

// ---------------------------------------------------------------------------------------
// Callable functions (server). Error codes from functions/src are mapped to DataError.
// ---------------------------------------------------------------------------------------

export class ServerError extends Error {
  constructor(public readonly code: string, message: string, public readonly details?: Record<string, unknown>) {
    super(message);
    this.name = 'ServerError';
  }
}

function requireFunctions() {
  if (!functions) throw new DataError('NOT_CONFIGURED', 'The app is not connected to its server.');
  return functions;
}

const FRIENDLY: Record<string, string> = {
  unauthenticated: 'Please sign in again.',
  'permission-denied': 'You do not have permission to do that.',
  'failed-precondition': 'This action is not available right now.',
  'resource-exhausted': 'You have reached a limit. Please try again later.',
  unavailable: 'The service is unavailable. Check your connection and try again.',
  'deadline-exceeded': 'This took too long. Please try again.',
  internal: 'Something went wrong on our side. Please try again.',
};

export async function callFunction<Req, Res>(name: string, data: Req): Promise<Res> {
  try {
    const fn = httpsCallable<Req, Res>(requireFunctions(), name, { timeout: 70_000 });
    const result = await fn(data);
    return result.data;
  } catch (error) {
    if (error instanceof DataError) throw error;
    const e = error as { code?: string; message?: string; details?: { reason?: string } & Record<string, unknown> };
    const code = (e.code ?? 'internal').replace(/^functions\//, '');
    const reason = e.details?.reason;
    throw new ServerError(reason ?? code, FRIENDLY[code] ?? FRIENDLY.internal, e.details);
  }
}

export const accountApi = {
  /** Deletes the account and all associated data on the server (L2-06). Requires recent sign-in. */
  deleteAccount: () => callFunction<{ confirm: true }, { deleted: true; completedAt: number }>('deleteAccount', { confirm: true }),
  /** Returns a JSON export of the user's data (L2-08). */
  exportData: () => callFunction<Record<string, never>, { exportedAt: number; data: Record<string, unknown> }>('exportUserData', {}),
  setAiConsent: (granted: boolean, version: string) => callFunction<{ granted: boolean; version: string }, { ok: true }>('setAiConsent', { granted, version }),
  /** Explicit consent and the preferences are sent together; withdrawing deletes the preferences. */
  setDietaryPreferences: (input: { consent: boolean; version: string; allergens: AllergenCode[]; diets: DietCode[]; avoid: string[]; severity: 'avoid' | 'severe' }) =>
    callFunction<typeof input, { ok: true }>('setDietaryPreferences', input),
};
