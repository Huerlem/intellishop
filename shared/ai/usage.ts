/**
 * AI usage accounting: introductory credits and Premium fair-use quotas.
 *
 * Pure state transitions applied by the server inside a Firestore transaction on
 * `usage/{uid}` (server-only document). Model of SUBSCRIPTION_ARCHITECTURE.md §5:
 *   reserve → (provider call) → commit on success | release on failure.
 * Only a COMMITTED (successful) generation consumes an introductory credit or quota.
 * A single in-flight reservation per user prevents parallel requests from overspending
 * credits; a stale reservation (crashed function) expires after RESERVATION_TTL_MS.
 */
import { INTRODUCTORY_AI_CREDITS, PREMIUM_AI_QUOTA, type PlanId } from '../entitlements/plans';

export const RESERVATION_TTL_MS = 2 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

export type UsageDoc = {
  introCreditsGranted: number;
  introCreditsConsumed: number;
  inFlight: { id: string; startedAt: number; kind: 'intro' | 'premium' } | null;
  premiumMonth: string; // 'YYYY-MM' (UTC) of the counters below
  premiumMonthCount: number;
  premiumRecent: number[]; // commit times within the last hour
  updatedAt: number;
};

export const newUsageDoc = (now: number): UsageDoc => ({
  introCreditsGranted: INTRODUCTORY_AI_CREDITS,
  introCreditsConsumed: 0,
  inFlight: null,
  premiumMonth: monthKey(now),
  premiumMonthCount: 0,
  premiumRecent: [],
  updatedAt: now,
});

export function monthKey(now: number): string {
  const d = new Date(now);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function nextMonthStart(now: number): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
}

export type ReserveError =
  | { code: 'REQUEST_IN_PROGRESS' }
  | { code: 'EMAIL_NOT_VERIFIED' }
  | { code: 'TRIAL_EXHAUSTED' }
  | { code: 'QUOTA_EXCEEDED'; resetAt: number; window: 'hour' | 'month' };

export type ReserveResult = { ok: true; doc: UsageDoc; reservationId: string; kind: 'intro' | 'premium' } | ({ ok: false } & ReserveError);

function rolled(doc: UsageDoc, now: number): UsageDoc {
  const month = monthKey(now);
  const recent = doc.premiumRecent.filter((t) => now - t < HOUR);
  const staleInFlight = doc.inFlight && now - doc.inFlight.startedAt > RESERVATION_TTL_MS ? null : doc.inFlight;
  return {
    ...doc,
    inFlight: staleInFlight,
    premiumMonth: month,
    premiumMonthCount: doc.premiumMonth === month ? doc.premiumMonthCount : 0,
    premiumRecent: recent,
  };
}

export function reserveGeneration(
  current: UsageDoc,
  ctx: { plan: PlanId; emailVerified: boolean; now: number; reservationId: string }
): ReserveResult {
  const doc = rolled(current, ctx.now);
  if (doc.inFlight) return { ok: false, code: 'REQUEST_IN_PROGRESS' };

  if (ctx.plan === 'premium') {
    if (doc.premiumMonthCount >= PREMIUM_AI_QUOTA.perMonth) {
      return { ok: false, code: 'QUOTA_EXCEEDED', window: 'month', resetAt: nextMonthStart(ctx.now) };
    }
    if (doc.premiumRecent.length >= PREMIUM_AI_QUOTA.perHour) {
      const oldest = Math.min(...doc.premiumRecent);
      return { ok: false, code: 'QUOTA_EXCEEDED', window: 'hour', resetAt: oldest + HOUR };
    }
    return {
      ok: true,
      kind: 'premium',
      reservationId: ctx.reservationId,
      doc: { ...doc, inFlight: { id: ctx.reservationId, startedAt: ctx.now, kind: 'premium' }, updatedAt: ctx.now },
    };
  }

  if (!ctx.emailVerified) return { ok: false, code: 'EMAIL_NOT_VERIFIED' };
  if (doc.introCreditsConsumed >= doc.introCreditsGranted) return { ok: false, code: 'TRIAL_EXHAUSTED' };
  return {
    ok: true,
    kind: 'intro',
    reservationId: ctx.reservationId,
    doc: { ...doc, inFlight: { id: ctx.reservationId, startedAt: ctx.now, kind: 'intro' }, updatedAt: ctx.now },
  };
}

/** Success: consume exactly one unit. A mismatched or expired reservation consumes nothing. */
export function commitGeneration(current: UsageDoc, reservationId: string, now: number): { doc: UsageDoc; consumed: boolean } {
  const doc = rolled(current, now);
  if (!doc.inFlight || doc.inFlight.id !== reservationId) return { doc, consumed: false };
  if (doc.inFlight.kind === 'intro') {
    return {
      consumed: true,
      doc: { ...doc, inFlight: null, introCreditsConsumed: Math.min(doc.introCreditsGranted, doc.introCreditsConsumed + 1), updatedAt: now },
    };
  }
  return {
    consumed: true,
    doc: { ...doc, inFlight: null, premiumMonthCount: doc.premiumMonthCount + 1, premiumRecent: [...doc.premiumRecent, now], updatedAt: now },
  };
}

/** Failure (provider error, timeout, invalid output, all recipes discarded): nothing consumed. */
export function releaseGeneration(current: UsageDoc, reservationId: string, now: number): UsageDoc {
  if (!current.inFlight || current.inFlight.id !== reservationId) return current;
  return { ...current, inFlight: null, updatedAt: now };
}

export function usageSummary(doc: UsageDoc, plan: PlanId, now: number) {
  const d = rolled(doc, now);
  return {
    introRemaining: Math.max(0, d.introCreditsGranted - d.introCreditsConsumed),
    premiumUsedThisMonth: d.premiumMonthCount,
    premiumMonthlyLimit: PREMIUM_AI_QUOTA.perMonth,
    premiumResetsAt: nextMonthStart(now),
    plan,
  };
}
