/**
 * Account deletion (L2-06), data export (L2-08), AI consent and dietary preferences (L3-01, L3-03).
 */
import { ALLERGEN_CODES, DIET_CODES } from '../../../shared/food/allergens';
import { cleanDisplayName, MAX_ITEM_NAME_LENGTH } from '../../../shared/domain/items';
import { HandlerError, type AuthAdmin, type CallerContext, type Clock, type Doc, type FileStore, type Hasher, type Logger, type Store } from '../ports';

export const REAUTH_WINDOW_SECONDS = 5 * 60;

export type DeleteDeps = {
  store: Store;
  auth: AuthAdmin;
  files: FileStore;
  clock: Clock;
  hash: Hasher;
  logger: Logger;
  /** Deletes the customer at the subscription provider; null until RevenueCat is configured (M6). */
  deleteSubscriber: ((uid: string) => Promise<void>) | null;
};

/**
 * Deletes the account and all associated data. Idempotent: safe to retry after a partial failure.
 * Order: data first, then the sign-in account last, so a failure never leaves orphaned data
 * behind an account that no longer exists.
 */
export async function deleteAccount(ctx: CallerContext, input: unknown, deps: DeleteDeps) {
  if (!input || (input as { confirm?: unknown }).confirm !== true) {
    throw new HandlerError('invalid-argument', 'CONFIRMATION_REQUIRED', 'Deletion must be confirmed.');
  }
  const nowSec = Math.floor(deps.clock.now() / 1000);
  if (!ctx.authTime || nowSec - ctx.authTime > REAUTH_WINDOW_SECONDS) {
    throw new HandlerError('failed-precondition', 'REAUTH_REQUIRED', 'Please enter your password again to delete your account.');
  }

  const uidHash = deps.hash(`deletion:${ctx.uid}`);
  const steps: Record<string, number | string> = {};
  const logPath = `deletionLog/${uidHash}`;
  await deps.store.set(logPath, { requestedAt: deps.clock.now(), status: 'in_progress' }, { merge: true });

  await deps.store.recursiveDelete(`users/${ctx.uid}`);
  steps.userData = 'deleted';
  await deps.store.delete(`entitlements/${ctx.uid}`);
  await deps.store.delete(`usage/${ctx.uid}`);
  steps.serverRecords = 'deleted';
  steps.files = await deps.files.deletePrefix(`profile_images/${ctx.uid}/`);

  if (deps.deleteSubscriber) {
    await deps.deleteSubscriber(ctx.uid);
    steps.subscriptionProvider = 'deleted';
  } else {
    steps.subscriptionProvider = 'not_configured';
  }

  await deps.auth.deleteUser(ctx.uid);
  steps.auth = 'deleted';

  const completedAt = deps.clock.now();
  // Minimal record: one-way hash of the UID, timestamps and step outcomes. No email or name.
  await deps.store.set(logPath, { completedAt, status: 'completed', steps }, { merge: true });
  deps.logger.info('account_deleted', { uidHash, steps });
  return { deleted: true as const, completedAt };
}

const EXPORT_COLLECTIONS = ['lists', 'pantry', 'trips', 'favourites', 'consents', 'private'] as const;

/** Right of access / portability: everything stored about the user, as JSON. */
export async function exportUserData(ctx: CallerContext, deps: { store: Store; clock: Clock }) {
  const base = `users/${ctx.uid}`;
  const profile = await deps.store.get(base);
  const out: Record<string, unknown> = { profile };
  for (const name of EXPORT_COLLECTIONS) {
    const docs = await deps.store.list(`${base}/${name}`);
    if (name === 'lists') {
      out.lists = await Promise.all(
        docs.map(async (d) => ({ id: d.id, ...d.data, items: (await deps.store.list(`${base}/lists/${d.id}/items`)).map((i) => ({ id: i.id, ...i.data })) }))
      );
    } else {
      out[name] = docs.map((d) => ({ id: d.id, ...d.data }));
    }
  }
  out.entitlement = await deps.store.get(`entitlements/${ctx.uid}`);
  out.aiUsage = await deps.store.get(`usage/${ctx.uid}`);
  return { exportedAt: deps.clock.now(), data: out };
}

function requireVersion(v: unknown): string {
  if (typeof v !== 'string' || !/^\d+\.\d+\.\d+(-draft)?$/.test(v)) throw new HandlerError('invalid-argument', 'INVALID_VERSION', 'Unknown document version.');
  return v;
}

/** Records AI permission (Apple 5.1.2(i)). Withdrawing takes effect on the next request. */
export async function setAiConsent(ctx: CallerContext, input: unknown, deps: { store: Store; clock: Clock }) {
  const i = (input ?? {}) as { granted?: unknown; version?: unknown };
  if (typeof i.granted !== 'boolean') throw new HandlerError('invalid-argument', 'INVALID_INPUT', 'granted must be true or false.');
  const version = requireVersion(i.version);
  const now = deps.clock.now();
  await deps.store.set(
    `users/${ctx.uid}/consents/ai`,
    { granted: i.granted, version, updatedAt: now, ...(i.granted ? { grantedAt: now } : { withdrawnAt: now }) },
    { merge: true }
  );
  return { ok: true as const };
}

export type PreferencesInput = { consent: boolean; version: string; allergens: string[]; diets: string[]; avoid: string[]; severity: 'avoid' | 'severe' };

/**
 * Stores allergies/diets ONLY with explicit consent (UK GDPR Art. 9(2)(a); DP-05).
 * Withdrawing consent DELETES the stored preferences (Privacy Policy §6).
 */
export async function setDietaryPreferences(ctx: CallerContext, input: unknown, deps: { store: Store; clock: Clock }) {
  const i = (input ?? {}) as Partial<PreferencesInput>;
  if (typeof i.consent !== 'boolean') throw new HandlerError('invalid-argument', 'INVALID_INPUT', 'consent must be true or false.');
  const version = requireVersion(i.version);
  const now = deps.clock.now();
  const prefPath = `users/${ctx.uid}/private/preferences`;
  const consentPath = `users/${ctx.uid}/consents/dietary`;

  if (!i.consent) {
    await deps.store.delete(prefPath);
    await deps.store.set(consentPath, { granted: false, version, updatedAt: now, withdrawnAt: now }, { merge: true });
    return { ok: true as const };
  }

  const allergens = Array.isArray(i.allergens) ? i.allergens : [];
  const diets = Array.isArray(i.diets) ? i.diets : [];
  const avoidRaw = Array.isArray(i.avoid) ? i.avoid : [];
  if (allergens.some((a) => !(ALLERGEN_CODES as readonly string[]).includes(a))) throw new HandlerError('invalid-argument', 'INVALID_INPUT', 'Unknown allergen.');
  if (diets.some((d) => !(DIET_CODES as readonly string[]).includes(d))) throw new HandlerError('invalid-argument', 'INVALID_INPUT', 'Unknown diet.');
  if (avoidRaw.length > 20 || avoidRaw.some((a) => typeof a !== 'string' || !cleanDisplayName(a) || a.length > 40)) {
    throw new HandlerError('invalid-argument', 'INVALID_INPUT', 'Up to 20 ingredients to avoid, 40 characters each.');
  }
  const severity = i.severity === 'severe' ? 'severe' : 'avoid';
  const doc: Doc = {
    consent: { granted: true, version, grantedAt: now },
    allergens: [...new Set(allergens)],
    diets: [...new Set(diets)],
    otherAvoid: [...new Set(avoidRaw.map((a) => cleanDisplayName(a).slice(0, MAX_ITEM_NAME_LENGTH)))],
    severity,
    updatedAt: now,
  };
  await deps.store.set(prefPath, doc);
  await deps.store.set(consentPath, { granted: true, version, updatedAt: now, grantedAt: now }, { merge: true });
  return { ok: true as const };
}
