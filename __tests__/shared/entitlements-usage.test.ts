import {
  DEFAULT_ENTITLEMENT,
  PLAN_LIMITS,
  applyStoreSnapshot,
  canAddListItem,
  canAddPantryItem,
  canCreateList,
  featureAccess,
  introCreditsRemaining,
  overLimitSummary,
  resolvePlan,
  type EntitlementState,
} from '@/shared/entitlements/plans';
import { commitGeneration, newUsageDoc, releaseGeneration, reserveGeneration, RESERVATION_TTL_MS } from '@/shared/ai/usage';

const NOW = Date.UTC(2026, 9, 28, 12, 0, 0);
const DAY = 86400000;
const ent = (patch: Partial<EntitlementState>): EntitlementState => ({ ...DEFAULT_ENTITLEMENT, ...patch });

describe('plan limits (provisional values)', () => {
  it('Free: 2 lists, 20 items per list, 30 pantry items', () => {
    expect(PLAN_LIMITS.free).toEqual({ activeLists: 2, itemsPerList: 20, pantryItems: 30 });
    expect(canCreateList('free', 1)).toEqual({ allowed: true });
    expect(canCreateList('free', 2)).toEqual({ allowed: false, code: 'FREE_LIMIT_REACHED', limit: 2 });
    expect(canAddListItem('free', 19).allowed).toBe(true);
    expect(canAddListItem('free', 20).allowed).toBe(false);
    expect(canAddPantryItem('free', 30).allowed).toBe(false);
  });

  it('Standard and Premium have no list or pantry limits', () => {
    for (const plan of ['standard', 'premium'] as const) {
      expect(canCreateList(plan, 500).allowed).toBe(true);
      expect(canAddListItem(plan, 500).allowed).toBe(true);
      expect(canAddPantryItem(plan, 5000).allowed).toBe(true);
    }
  });

  it('downgrade never deletes data: over-limit is reported for new additions only', () => {
    expect(overLimitSummary('free', { activeLists: 5, pantryItems: 31, itemsPerList: { a: 25, b: 3 } })).toEqual({
      listsOver: 3,
      pantryOver: 1,
      listsWithTooManyItems: ['a'],
    });
  });
});

describe('feature access matrix', () => {
  it('Free: AI recipes only with verified email and remaining introductory credits', () => {
    expect(featureAccess('ai_recipes', ent({}), { emailVerified: false })).toEqual({ allowed: false, code: 'EMAIL_NOT_VERIFIED' });
    expect(featureAccess('ai_recipes', ent({}), { emailVerified: true })).toEqual({ allowed: true, source: 'introductory_credit' });
    expect(featureAccess('ai_recipes', ent({ introCreditsConsumed: 3 }), { emailVerified: true })).toEqual({
      allowed: false,
      code: 'TRIAL_EXHAUSTED',
      requiredPlan: 'premium',
    });
  });

  it('Standard: no ongoing AI, but keeps unused introductory credits (D10)', () => {
    expect(featureAccess('ai_recipes', ent({ plan: 'standard', introCreditsConsumed: 1 }), { emailVerified: true })).toEqual({
      allowed: true,
      source: 'introductory_credit',
    });
    expect(featureAccess('ai_optimisation', ent({ plan: 'standard' }), { emailVerified: true }).allowed).toBe(false);
  });

  it('Premium: AI by plan; supermarket lookups only when a licensed provider is live', () => {
    const premium = ent({ plan: 'premium', introCreditsConsumed: 3 });
    expect(featureAccess('ai_recipes', premium, { emailVerified: false })).toEqual({ allowed: true, source: 'plan' });
    expect(featureAccess('ai_optimisation', premium, { emailVerified: true }).allowed).toBe(true);
    expect(featureAccess('price_lookup', premium, { emailVerified: true })).toEqual({ allowed: false, code: 'NOT_AVAILABLE' });
    expect(featureAccess('price_lookup', premium, { emailVerified: true, priceLookupAvailable: true }).allowed).toBe(true);
    expect(featureAccess('price_lookup', ent({ plan: 'standard' }), { emailVerified: true, priceLookupAvailable: true }).allowed).toBe(false);
  });

  it('shopping history is hidden on Free (D11) and visible on paid plans', () => {
    expect(featureAccess('shopping_history', ent({}), { emailVerified: true }).allowed).toBe(false);
    expect(featureAccess('shopping_history', ent({ plan: 'standard' }), { emailVerified: true }).allowed).toBe(true);
  });
});

describe('store state → plan (precedence and transitions)', () => {
  it('premium beats standard; grace period keeps access; expiry and refund drop to free', () => {
    expect(resolvePlan([{ productPlan: 'standard', status: 'active', expiresAt: NOW + DAY }, { productPlan: 'premium', status: 'active', expiresAt: NOW + DAY }], NOW).plan).toBe('premium');
    expect(resolvePlan([{ productPlan: 'premium', status: 'in_grace_period', expiresAt: NOW - 1000 }], NOW).plan).toBe('premium');
    expect(resolvePlan([{ productPlan: 'premium', status: 'cancelled_active', expiresAt: NOW + DAY }], NOW).plan).toBe('premium');
    expect(resolvePlan([{ productPlan: 'premium', status: 'cancelled_active', expiresAt: NOW - 1 }], NOW).plan).toBe('free');
    expect(resolvePlan([{ productPlan: 'premium', status: 'expired', expiresAt: NOW - DAY }], NOW)).toEqual({ plan: 'free', status: 'expired', expiresAt: NOW - DAY });
    expect(resolvePlan([{ productPlan: 'premium', status: 'refunded', expiresAt: NOW + DAY }], NOW).plan).toBe('free');
    expect(resolvePlan([{ productPlan: 'premium', status: 'in_billing_retry', expiresAt: NOW - DAY }], NOW).plan).toBe('free');
    expect(resolvePlan([], NOW)).toEqual({ plan: 'free', status: 'none', expiresAt: null });
  });

  it('store snapshots never grant or replenish introductory credits (E2–E13)', () => {
    const before = ent({ introCreditsConsumed: 2 });
    const up = applyStoreSnapshot(before, [{ productPlan: 'premium', status: 'active', expiresAt: NOW + DAY }], NOW);
    const down = applyStoreSnapshot(up, [{ productPlan: 'premium', status: 'expired', expiresAt: NOW - 1 }], NOW + 2);
    expect(up.plan).toBe('premium');
    expect(down.plan).toBe('free');
    expect(introCreditsRemaining(down)).toBe(1);
    expect(down.introCreditsGranted).toBe(3);
  });
});

describe('AI usage accounting (credits and fair-use quotas)', () => {
  it('Free: 3 successful generations, failures are free, then TRIAL_EXHAUSTED', () => {
    let doc = newUsageDoc(NOW);
    for (let i = 0; i < 3; i += 1) {
      const fail = reserveGeneration(doc, { plan: 'free', emailVerified: true, now: NOW, reservationId: `f${i}` });
      if (!fail.ok) throw new Error('reserve failed');
      doc = releaseGeneration(fail.doc, `f${i}`, NOW); // provider failure → nothing consumed
      const r = reserveGeneration(doc, { plan: 'free', emailVerified: true, now: NOW, reservationId: `r${i}` });
      if (!r.ok) throw new Error('reserve failed');
      doc = commitGeneration(r.doc, `r${i}`, NOW).doc;
    }
    expect(doc.introCreditsConsumed).toBe(3);
    expect(reserveGeneration(doc, { plan: 'free', emailVerified: true, now: NOW, reservationId: 'x' })).toEqual({ ok: false, code: 'TRIAL_EXHAUSTED' });
  });

  it('blocks parallel requests (race-safe) until the reservation ends or goes stale', () => {
    const r = reserveGeneration(newUsageDoc(NOW), { plan: 'free', emailVerified: true, now: NOW, reservationId: 'a' });
    if (!r.ok) throw new Error();
    expect(reserveGeneration(r.doc, { plan: 'free', emailVerified: true, now: NOW + 1000, reservationId: 'b' })).toEqual({ ok: false, code: 'REQUEST_IN_PROGRESS' });
    const later = reserveGeneration(r.doc, { plan: 'free', emailVerified: true, now: NOW + RESERVATION_TTL_MS + 1, reservationId: 'c' });
    expect(later.ok).toBe(true);
    // The stale reservation cannot be committed any more.
    if (!later.ok) throw new Error();
    expect(commitGeneration(later.doc, 'a', NOW + RESERVATION_TTL_MS + 2).consumed).toBe(false);
  });

  it('requires a verified email for introductory credits', () => {
    expect(reserveGeneration(newUsageDoc(NOW), { plan: 'free', emailVerified: false, now: NOW, reservationId: 'a' })).toEqual({ ok: false, code: 'EMAIL_NOT_VERIFIED' });
  });

  it('Premium: hourly and monthly quotas with reset times; does not use introductory credits', () => {
    let doc = newUsageDoc(NOW);
    for (let i = 0; i < 10; i += 1) {
      const r = reserveGeneration(doc, { plan: 'premium', emailVerified: true, now: NOW + i, reservationId: `p${i}` });
      if (!r.ok) throw new Error(`reserve ${i}`);
      doc = commitGeneration(r.doc, `p${i}`, NOW + i).doc;
    }
    expect(doc.introCreditsConsumed).toBe(0);
    const blocked = reserveGeneration(doc, { plan: 'premium', emailVerified: true, now: NOW + 100, reservationId: 'h' });
    expect(blocked).toEqual({ ok: false, code: 'QUOTA_EXCEEDED', window: 'hour', resetAt: NOW + 3600000 });
    expect(reserveGeneration(doc, { plan: 'premium', emailVerified: true, now: NOW + 3600001, reservationId: 'h2' }).ok).toBe(true);

    const full = { ...newUsageDoc(NOW), premiumMonthCount: 100 };
    expect(reserveGeneration(full, { plan: 'premium', emailVerified: true, now: NOW, reservationId: 'm' })).toEqual({
      ok: false,
      code: 'QUOTA_EXCEEDED',
      window: 'month',
      resetAt: Date.UTC(2026, 10, 1),
    });
    // New month resets the monthly counter.
    expect(reserveGeneration(full, { plan: 'premium', emailVerified: true, now: Date.UTC(2026, 10, 1, 0, 0, 1), reservationId: 'n' }).ok).toBe(true);
  });
});
