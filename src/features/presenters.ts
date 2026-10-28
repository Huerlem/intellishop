/**
 * Pure display logic for V2 screens (unit-tested in __tests__/ui/presenters.test.ts).
 * Nothing here invents data: prices are only ever user-entered (decision D8), signals come
 * from the user's own Pantry, and anything unknown is shown as unknown.
 */
import { formatPence, normaliseItemName } from '@/shared/domain/items';
import { formatQuantity, UNITS, type CanonicalUnit } from '@/shared/domain/units';
import { namesMatch } from '@/shared/ai/reclassify';
import { daysUntil, pantrySignals } from '@/src/data/pantrySignals';
import type { ListItem, PantryItem } from '@/src/data/types';
import type { PlanId } from '@/shared/entitlements/plans';
import type { BadgeTone } from '@/src/ui/Badge';

export const PLAN_NAMES: Record<PlanId, string> = { free: 'Free', standard: 'Standard', premium: 'Premium' };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function shortDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function greeting(now: number, name: string): string {
  const h = new Date(now).getHours();
  const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const first = name.trim().split(/\s+/)[0];
  return first ? `${part}, ${first}` : part;
}

export function quantityText(amount: number, unit: CanonicalUnit): string {
  return formatQuantity({ amount, unit });
}

/** Spoken form, e.g. "2 litres" rather than "2 l". */
export function spokenQuantity(amount: number, unit: CanonicalUnit): string {
  const spoken: Partial<Record<CanonicalUnit, [string, string]>> = {
    g: ['gram', 'grams'],
    kg: ['kilogram', 'kilograms'],
    ml: ['millilitre', 'millilitres'],
    l: ['litre', 'litres'],
    tsp: ['teaspoon', 'teaspoons'],
    tbsp: ['tablespoon', 'tablespoons'],
  };
  const pair = spoken[unit];
  if (pair) return `${amount} ${amount === 1 ? pair[0] : pair[1]}`;
  return `${amount} ${amount === 1 ? UNITS[unit].label : UNITS[unit].plural}`;
}

/**
 * List estimate from the user's own prices only. Nothing is estimated for unpriced items,
 * so the total is labelled as partial unless every item has a price.
 */
export function listEstimate(items: ListItem[]) {
  const priced = items.filter((i) => i.pricePence != null);
  // `pricePence` is the user's expected price for the whole line (as entered in the item editor).
  const totalPence = priced.reduce((sum, i) => sum + (i.pricePence ?? 0), 0);
  return { pricedCount: priced.length, itemCount: items.length, totalPence, complete: items.length > 0 && priced.length === items.length };
}

export function estimateLabel(e: ReturnType<typeof listEstimate>): string | null {
  if (e.pricedCount === 0) return null;
  return e.complete ? `Your prices: ${formatPence(e.totalPence)}` : `Your prices: ${formatPence(e.totalPence)} for ${e.pricedCount} of ${e.itemCount} items`;
}

/** Same product by name ("Basmati rice" ↔ "rice", "Eggs" ↔ "egg"), using the shared normaliser. */
export function sameItem(a: string, b: string): boolean {
  return namesMatch(normaliseItemName(a), normaliseItemName(b));
}

/** List items whose name matches something already in the Pantry with quantity above zero. */
export function itemsInPantry(items: ListItem[], pantry: PantryItem[]): ListItem[] {
  const stocked = pantry.filter((p) => p.quantity > 0);
  return items.filter((i) => stocked.some((p) => sameItem(i.name, p.name)));
}

export type PantryStatus = { label: string; tone: BadgeTone };

/** One status badge per Pantry item, most urgent first. Text always states the status. */
export function pantryStatus(item: PantryItem, now: number): PantryStatus {
  if (item.expiryDate != null) {
    const d = daysUntil(item.expiryDate, now);
    if (d < 0) return item.expiryKind === 'use_by' ? { label: 'Past use-by', tone: 'error' } : { label: 'Past best before', tone: 'warning' };
    if (d < 4) {
      const when = d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`;
      return { label: item.expiryKind === 'use_by' ? `Use by ${when}` : `Best before ${when}`, tone: 'warning' };
    }
  }
  if (item.quantity <= 0) return { label: 'Out', tone: 'error' };
  if (item.minQuantity > 0 && item.quantity <= item.minQuantity) return { label: 'Running low', tone: 'warning' };
  const added = item.lastPurchasedAt ?? item.createdAt;
  if (added != null && added >= now - 7 * 86400000) return { label: 'Recently added', tone: 'info' };
  return { label: 'In stock', tone: 'success' };
}

export function pantryMeta(item: PantryItem): string {
  const qty = item.quantity <= 0 ? 'None left' : `${quantityText(item.quantity, item.unit)} remaining`;
  if (item.expiryDate == null) return qty;
  return `${qty} · ${item.expiryKind === 'use_by' ? 'Use by' : 'Best before'} ${shortDate(item.expiryDate)}`;
}

export type Signal = { key: string; text: string; tone: 'warning' | 'intelligence' | 'error' };

/** Home "Today's Signals": derived only from the user's Pantry. At most `max` signals. */
export function homeSignals(pantry: PantryItem[], now: number, max = 3): Signal[] {
  const s = pantrySignals(pantry, now);
  const out: Signal[] = [];
  const useBy = s.expired.filter((i) => i.expiryKind === 'use_by');
  if (useBy.length) out.push({ key: 'expired', text: useBy.length === 1 ? `${useBy[0].name} is past its use-by date` : `${useBy.length} items are past their use-by date`, tone: 'error' });
  for (const i of s.useSoon) {
    const d = daysUntil(i.expiryDate!, now);
    out.push({ key: `soon-${i.id}`, text: `Use ${i.name} ${d === 0 ? 'today' : d === 1 ? 'by tomorrow' : `within ${d} days`}`, tone: 'warning' });
  }
  for (const i of s.runningLow) out.push({ key: `low-${i.id}`, text: `${i.name} is running low`, tone: 'intelligence' });
  return out.slice(0, max);
}

/** Shopping Mode grouping: by category (no aisle data exists — Figma clarification C4). */
export function groupByCategory<T extends { category: string }>(items: T[], order: readonly string[]): { category: string; items: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const i of items) groups.set(i.category, [...(groups.get(i.category) ?? []), i]);
  return order.filter((c) => groups.has(c)).map((c) => ({ category: c, items: groups.get(c)! }));
}

export function priceBadge(item: ListItem): { label: string; tone: BadgeTone } | undefined {
  return item.pricePence != null ? { label: `Your price ${formatPence(item.pricePence)}`, tone: 'neutral' } : undefined;
}
