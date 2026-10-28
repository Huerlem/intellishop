/**
 * Server-authoritative entitlements (SUBSCRIPTION_ARCHITECTURE.md §3).
 *
 * Source of truth: Apple via RevenueCat. The webhook is only a trigger: on every event (and on
 * the `syncEntitlements` callable after a purchase or restore) the server fetches the subscriber
 * from RevenueCat's REST API and recomputes the plan. Webhook payload contents are never trusted
 * for the plan itself. Introductory AI credits are never granted or replenished here.
 *
 * STATUS: not active. Requires RevenueCat project, App Store products and secrets (owner
 * checkpoint, milestone M6). The response mapping must be re-verified against RevenueCat's
 * current API documentation before activation.
 */
import { applyStoreSnapshot, DEFAULT_ENTITLEMENT, type EntitlementState, type PlanId, type StoreSubscription } from '../../../shared/entitlements/plans';
import { HandlerError, type CallerContext, type Clock, type Doc, type Logger, type Store } from '../ports';

/** App Store product ID → plan. [OWNER TO CONFIRM: final product IDs in App Store Connect] */
export type ProductMap = Record<string, Exclude<PlanId, 'free'>>;

type RcSubscription = {
  expires_date?: string | null;
  grace_period_expires_date?: string | null;
  billing_issues_detected_at?: string | null;
  unsubscribe_detected_at?: string | null;
  refunded_at?: string | null;
  store?: string;
};

const ms = (iso: string | null | undefined) => (iso ? Date.parse(iso) : null);

export function mapRevenueCatSubscriber(body: unknown, products: ProductMap, now: number): StoreSubscription[] {
  const subs = ((body as { subscriber?: { subscriptions?: Record<string, RcSubscription> } })?.subscriber?.subscriptions ?? {}) as Record<string, RcSubscription>;
  const out: StoreSubscription[] = [];
  for (const [productId, s] of Object.entries(subs)) {
    const plan = products[productId];
    if (!plan) continue; // unknown products never grant access
    if (s.store && s.store !== 'app_store') continue; // iOS-only launch
    const expiresAt = ms(s.expires_date);
    const grace = ms(s.grace_period_expires_date);
    let status: StoreSubscription['status'];
    if (s.refunded_at) status = 'refunded';
    else if (expiresAt === null || expiresAt > now) status = s.unsubscribe_detected_at ? 'cancelled_active' : 'active';
    else if (grace !== null && grace > now) status = 'in_grace_period';
    else if (s.billing_issues_detected_at && !s.unsubscribe_detected_at) status = 'in_billing_retry';
    else status = 'expired';
    out.push({ productPlan: plan, status, expiresAt });
  }
  return out;
}

export type EntitlementDeps = {
  store: Store;
  clock: Clock;
  logger: Logger;
  products: ProductMap;
  /** GET subscriber from RevenueCat REST API (server-side secret key). */
  fetchSubscriber: (appUserId: string) => Promise<unknown>;
};

function asEntitlement(d: Doc | null): EntitlementState {
  if (!d) return DEFAULT_ENTITLEMENT;
  return { ...DEFAULT_ENTITLEMENT, ...(d as Partial<EntitlementState>) };
}

export async function recomputeEntitlement(uid: string, deps: EntitlementDeps): Promise<EntitlementState> {
  const body = await deps.fetchSubscriber(uid);
  const now = deps.clock.now();
  const subs = mapRevenueCatSubscriber(body, deps.products, now);
  const path = `entitlements/${uid}`;
  let next: EntitlementState = DEFAULT_ENTITLEMENT;
  await deps.store.transaction(async (tx) => {
    const current = asEntitlement(await tx.get(path));
    next = applyStoreSnapshot(current, subs, now);
    // Only plan/status fields are written; AI credits live in usage/{uid} and are untouched.
    tx.set(path, { plan: next.plan, status: next.status, expiresAt: next.expiresAt, updatedAt: now }, { merge: true });
  });
  deps.logger.info('entitlement_recomputed', { plan: next.plan, status: next.status, subscriptions: subs.length });
  return next;
}

/** Callable after purchase/restore: the app waits for this before unlocking (E2, E12). */
export async function syncEntitlements(ctx: CallerContext, deps: EntitlementDeps) {
  const e = await recomputeEntitlement(ctx.uid, deps);
  return { plan: e.plan, status: e.status, expiresAt: e.expiresAt };
}

/** Constant-time comparison for the webhook authorisation header. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** RevenueCat webhook: authenticate, extract the app user ID, recompute from the REST API. */
export async function handleRevenueCatWebhook(headers: Record<string, string | undefined>, body: unknown, expectedAuth: string, deps: EntitlementDeps) {
  const auth = headers.authorization ?? '';
  if (!expectedAuth || !safeEqual(auth, expectedAuth)) throw new HandlerError('unauthenticated', 'WEBHOOK_AUTH', 'Unauthorised');
  const event = (body as { event?: { app_user_id?: unknown; type?: unknown } })?.event;
  const uid = event?.app_user_id;
  if (typeof uid !== 'string' || !/^[\w-]{1,128}$/.test(uid) || uid.startsWith('$RCAnonymousID')) {
    // Anonymous or malformed IDs cannot be linked to an account; acknowledge without action.
    deps.logger.warn('webhook_ignored', { reason: 'no_app_user_id' });
    return { ok: true, ignored: true };
  }
  await recomputeEntitlement(uid, deps);
  return { ok: true, ignored: false };
}
