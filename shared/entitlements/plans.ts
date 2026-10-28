/**
 * Plans, limits and entitlement decisions — shared by the app (UX gating) and the server
 * (authoritative checks). The server never trusts a plan value sent by the client.
 *
 * Values marked PROVISIONAL await owner approval (decisions D1, D3) and App Store Connect
 * configuration. Changing approved plan entitlements is an owner checkpoint.
 */

export type PlanId = 'free' | 'standard' | 'premium';

export type SubscriptionStatus =
  | 'none'
  | 'active'
  | 'in_grace_period'
  | 'in_billing_retry'
  | 'cancelled_active'
  | 'expired'
  | 'refunded';

export const PLAN_LIMITS = {
  free: { activeLists: 2, itemsPerList: 20, pantryItems: 30 }, // PROVISIONAL
  standard: { activeLists: Infinity, itemsPerList: Infinity, pantryItems: Infinity },
  premium: { activeLists: Infinity, itemsPerList: Infinity, pantryItems: Infinity },
} as const satisfies Record<PlanId, { activeLists: number; itemsPerList: number; pantryItems: number }>;

export const INTRODUCTORY_AI_CREDITS = 3;

/** PROVISIONAL fair-use quotas for Premium AI (decision D3). */
export const PREMIUM_AI_QUOTA = { perMonth: 100, perHour: 10 } as const;

export type EntitlementState = {
  plan: PlanId;
  status: SubscriptionStatus;
  expiresAt: number | null; // epoch ms
  introCreditsGranted: number; // 0 or 3
  introCreditsConsumed: number; // 0..granted
  updatedAt: number;
};

export const DEFAULT_ENTITLEMENT: EntitlementState = {
  plan: 'free',
  status: 'none',
  expiresAt: null,
  introCreditsGranted: INTRODUCTORY_AI_CREDITS,
  introCreditsConsumed: 0,
  updatedAt: 0,
};

export function introCreditsRemaining(e: Pick<EntitlementState, 'introCreditsGranted' | 'introCreditsConsumed'>): number {
  return Math.max(0, e.introCreditsGranted - e.introCreditsConsumed);
}

export type LimitDecision = { allowed: true } | { allowed: false; code: 'FREE_LIMIT_REACHED'; limit: number };

const decide = (count: number, limit: number): LimitDecision =>
  count < limit ? { allowed: true } : { allowed: false, code: 'FREE_LIMIT_REACHED', limit };

export const canCreateList = (plan: PlanId, activeLists: number) => decide(activeLists, PLAN_LIMITS[plan].activeLists);
export const canAddListItem = (plan: PlanId, itemsInList: number) => decide(itemsInList, PLAN_LIMITS[plan].itemsPerList);
export const canAddPantryItem = (plan: PlanId, pantryItems: number) => decide(pantryItems, PLAN_LIMITS[plan].pantryItems);

export type Feature = 'ai_recipes' | 'ai_optimisation' | 'ai_substitutions' | 'price_lookup' | 'shopping_history';

export type FeatureDecision =
  | { allowed: true; source: 'plan' | 'introductory_credit' }
  | { allowed: false; code: 'PLAN_REQUIRED' | 'TRIAL_EXHAUSTED' | 'EMAIL_NOT_VERIFIED' | 'NOT_AVAILABLE'; requiredPlan?: PlanId };

/**
 * Feature access per the approved entitlement matrix (SUBSCRIPTION_ENTITLEMENTS.md §1).
 * `priceLookupAvailable` is false until a licensed price provider is live (decision D8).
 */
export function featureAccess(
  feature: Feature,
  e: EntitlementState,
  ctx: { emailVerified: boolean; priceLookupAvailable?: boolean }
): FeatureDecision {
  switch (feature) {
    case 'ai_recipes':
      if (e.plan === 'premium') return { allowed: true, source: 'plan' };
      if (!ctx.emailVerified) return { allowed: false, code: 'EMAIL_NOT_VERIFIED' };
      return introCreditsRemaining(e) > 0
        ? { allowed: true, source: 'introductory_credit' }
        : { allowed: false, code: 'TRIAL_EXHAUSTED', requiredPlan: 'premium' };
    case 'ai_optimisation':
    case 'ai_substitutions':
      return e.plan === 'premium' ? { allowed: true, source: 'plan' } : { allowed: false, code: 'PLAN_REQUIRED', requiredPlan: 'premium' };
    case 'price_lookup':
      if (!ctx.priceLookupAvailable) return { allowed: false, code: 'NOT_AVAILABLE' };
      return e.plan === 'premium' ? { allowed: true, source: 'plan' } : { allowed: false, code: 'PLAN_REQUIRED', requiredPlan: 'premium' };
    case 'shopping_history':
      return e.plan === 'free' ? { allowed: false, code: 'PLAN_REQUIRED', requiredPlan: 'standard' } : { allowed: true, source: 'plan' };
    default:
      return { allowed: false, code: 'NOT_AVAILABLE' };
  }
}

// ---------------------------------------------------------------------------------------
// Subscription state from verified store events (server side; RevenueCat webhook or sync)
// ---------------------------------------------------------------------------------------

/** One verified subscription as reported by the store (via RevenueCat). */
export type StoreSubscription = {
  productPlan: Exclude<PlanId, 'free'>;
  status: Exclude<SubscriptionStatus, 'none'>;
  expiresAt: number | null;
};

const PAID_ACCESS: ReadonlySet<SubscriptionStatus> = new Set(['active', 'in_grace_period', 'cancelled_active']);

/** Precedence rules §4: any premium with access → premium; else standard; else free. */
export function resolvePlan(subscriptions: StoreSubscription[], now: number): { plan: PlanId; status: SubscriptionStatus; expiresAt: number | null } {
  const withAccess = subscriptions.filter((s) => PAID_ACCESS.has(s.status) && (s.expiresAt === null || s.expiresAt > now || s.status === 'in_grace_period'));
  for (const plan of ['premium', 'standard'] as const) {
    const match = withAccess.filter((s) => s.productPlan === plan).sort((a, b) => (b.expiresAt ?? Infinity) - (a.expiresAt ?? Infinity))[0];
    if (match) return { plan, status: match.status, expiresAt: match.expiresAt };
  }
  const latest = [...subscriptions].sort((a, b) => (b.expiresAt ?? 0) - (a.expiresAt ?? 0))[0];
  return { plan: 'free', status: latest ? latest.status : 'none', expiresAt: latest?.expiresAt ?? null };
}

/**
 * Applies a verified store snapshot to the stored entitlement. Introductory credits are never
 * granted or replenished here (E2–E13): only consumed by successful generations.
 */
export function applyStoreSnapshot(current: EntitlementState, subscriptions: StoreSubscription[], now: number): EntitlementState {
  const resolved = resolvePlan(subscriptions, now);
  return {
    ...current,
    plan: resolved.plan,
    status: resolved.status,
    expiresAt: resolved.expiresAt,
    updatedAt: now,
  };
}

/** Over-limit after downgrade: existing data is never deleted; only new additions are blocked (E7, D5). */
export function overLimitSummary(plan: PlanId, counts: { activeLists: number; pantryItems: number; itemsPerList: Record<string, number> }) {
  const limits = PLAN_LIMITS[plan];
  return {
    listsOver: Math.max(0, counts.activeLists - limits.activeLists),
    pantryOver: Math.max(0, counts.pantryItems - limits.pantryItems),
    listsWithTooManyItems: Object.entries(counts.itemsPerList)
      .filter(([, n]) => n > limits.itemsPerList)
      .map(([id]) => id),
  };
}
