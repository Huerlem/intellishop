/** Pantry signals (pure; no Firebase imports so screens and tests can use them directly). */
import type { PantryItem } from './types';

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Pantry signals for Home and Pantry screens (Figma P01 "Today's Signals", P10 sections). */
export function pantrySignals(items: PantryItem[], now: number) {
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const t0 = startToday.getTime();
  const runningLow = items.filter((i) => i.minQuantity > 0 && i.quantity <= i.minQuantity);
  const expired = items.filter((i) => i.expiryDate != null && i.expiryDate < t0);
  const useSoon = items
    .filter((i) => i.expiryDate != null && i.expiryDate >= t0 && i.expiryDate < t0 + 4 * DAY_MS)
    .sort((a, b) => (a.expiryDate ?? 0) - (b.expiryDate ?? 0));
  const recentlyAdded = items
    .filter((i) => (i.lastPurchasedAt ?? i.createdAt ?? 0) >= now - 7 * DAY_MS)
    .sort((a, b) => (b.lastPurchasedAt ?? b.createdAt ?? 0) - (a.lastPurchasedAt ?? a.createdAt ?? 0));
  return { runningLow, useSoon, expired, recentlyAdded };
}

export function daysUntil(expiry: number, now: number): number {
  const a = new Date(now);
  a.setHours(0, 0, 0, 0);
  const b = new Date(expiry);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}
