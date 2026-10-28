/**
 * Finish Shopping → Pantry Update proposals (Figma P08 → P09).
 *
 * Rules (project requirement: no silent destructive updates):
 *  - Only ADDITIVE changes are proposed: increase an existing pantry item, or add a new one.
 *  - Nothing is ever decreased or deleted here.
 *  - "Updated automatically" (high confidence) only when there is exactly one pantry match by
 *    normalised name and the units are comparable. Everything else goes to "Needs review".
 *  - Every applied change carries undo information.
 */
import { normaliseItemName } from '../domain/items';
import { addQuantities, areComparable, normaliseUnit, type CanonicalUnit } from '../domain/units';
import { namesMatch } from '../ai/reclassify';

export type TripLine = {
  listItemId: string;
  name: string;
  outcome: 'collected' | 'substituted' | 'unavailable' | 'skipped';
  quantity: number; // quantity actually bought
  unit: string;
  substituteName?: string; // when outcome = substituted
};

export type PantryItemLite = { id: string; name: string; quantity: number; unit: string };

export type PantryProposal =
  | {
      kind: 'increase';
      confidence: 'high' | 'review';
      reason: string;
      pantryItemId: string;
      name: string;
      from: { amount: number; unit: CanonicalUnit };
      to: { amount: number; unit: CanonicalUnit };
      sourceLineId: string;
    }
  | {
      kind: 'add';
      confidence: 'high' | 'review';
      reason: string;
      name: string;
      quantity: { amount: number; unit: CanonicalUnit };
      sourceLineId: string;
    };

export type PantryUpdatePlan = { automatic: PantryProposal[]; review: PantryProposal[]; ignored: { lineId: string; reason: string }[] };

export function planPantryUpdate(lines: TripLine[], pantry: PantryItemLite[]): PantryUpdatePlan {
  const automatic: PantryProposal[] = [];
  const review: PantryProposal[] = [];
  const ignored: { lineId: string; reason: string }[] = [];

  for (const line of lines) {
    if (line.outcome === 'unavailable' || line.outcome === 'skipped') {
      ignored.push({ lineId: line.listItemId, reason: line.outcome === 'unavailable' ? 'Not available in store' : 'Not bought' });
      continue;
    }
    const boughtName = line.outcome === 'substituted' && line.substituteName ? line.substituteName : line.name;
    const unit = normaliseUnit(line.unit);
    if (!unit || !(line.quantity > 0)) {
      review.push({ kind: 'add', confidence: 'review', reason: 'Quantity or unit not recognised', name: boughtName, quantity: { amount: Math.max(1, line.quantity || 1), unit: unit ?? 'unit' }, sourceLineId: line.listItemId });
      continue;
    }
    const bought = { amount: line.quantity, unit };
    const key = normaliseItemName(boughtName);
    const exact = pantry.filter((p) => normaliseItemName(p.name) === key);
    const fuzzy = exact.length ? [] : pantry.filter((p) => namesMatch(normaliseItemName(p.name), key));
    const substituted = line.outcome === 'substituted';

    if (exact.length === 1) {
      const target = exact[0];
      const tUnit = normaliseUnit(target.unit);
      if (tUnit && areComparable(tUnit, unit)) {
        const from = { amount: target.quantity, unit: tUnit };
        const to = addQuantities(from, bought)!;
        const proposal: PantryProposal = {
          kind: 'increase',
          confidence: substituted ? 'review' : 'high',
          reason: substituted ? `Substituted for ${line.name}` : 'Matched an item in your Pantry',
          pantryItemId: target.id,
          name: target.name,
          from,
          to,
          sourceLineId: line.listItemId,
        };
        (substituted ? review : automatic).push(proposal);
      } else {
        review.push({ kind: 'add', confidence: 'review', reason: `Units differ from your Pantry item (${target.unit})`, name: boughtName, quantity: bought, sourceLineId: line.listItemId });
      }
      continue;
    }
    if (exact.length > 1 || fuzzy.length > 0) {
      review.push({ kind: 'add', confidence: 'review', reason: 'Similar items already in your Pantry — choose one or add new', name: boughtName, quantity: bought, sourceLineId: line.listItemId });
      continue;
    }
    const proposal: PantryProposal = {
      kind: 'add',
      confidence: substituted ? 'review' : 'high',
      reason: substituted ? `Substituted for ${line.name}` : 'New to your Pantry',
      name: boughtName,
      quantity: bought,
      sourceLineId: line.listItemId,
    };
    (substituted ? review : automatic).push(proposal);
  }
  return { automatic, review, ignored };
}
