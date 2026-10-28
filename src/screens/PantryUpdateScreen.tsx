/**
 * P09 Pantry Update (Figma 136:425): high-confidence purchases update the Pantry automatically;
 * everything ambiguous goes to "Needs Review". Changes are additive only, recorded on the trip
 * (so they are never applied twice) and can be undone. Nothing is discarded silently: review
 * items stay pending (also shown on Home) until the user decides.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { addQuantities, areComparable } from '@/shared/domain/units';
import { planPantryUpdate, type PantryProposal } from '@/shared/shopping/pantryUpdate';
import { applyTripPantryChange, dismissTripPantryLine, undoTripPantryChange, type TripPantryChange } from '@/src/data/pantryRepository';
import { tripLinesForPantry, type PantryAppliedEntry } from '@/src/data/tripsRepository';
import type { PantryItem } from '@/src/data/types';
import { quantityText, sameItem } from '@/src/features/presenters';
import { ROUTES } from '@/src/navigation/routes';
import { useAppData } from '@/src/state/AppDataProvider';
import { errorMessage, useListItems, usePantry, usePlan, useTrip } from '@/src/state/hooks';
import { borderWidth, colors, radius, spacing } from '@/src/theme';
import { Alert, AppText, Badge, Button, EmptyState, Header, LoadingState, RowGroup, Screen, SectionHeader, SettingsRow, Sheet } from '@/src/ui';

function describe(p: PantryProposal): string {
  return p.kind === 'increase' ? `${quantityText(p.from.amount, p.from.unit)} → ${quantityText(p.to.amount, p.to.unit)}` : `Add ${quantityText(p.quantity.amount, p.quantity.unit)} as a new item`;
}

export default function PantryUpdateScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();
  const data = useAppData();
  const { plan } = usePlan();
  const { trip, status } = useTrip(tripId);
  const items = useListItems(trip?.listId);
  const pantry = usePantry();
  const [reviewing, setReviewing] = useState<PantryProposal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const inFlight = useRef(new Set<string>());

  const lines = useMemo(() => (trip ? tripLinesForPantry(trip, items.items) : []), [trip, items.items]);
  const pending = useMemo(() => lines.filter((l) => !trip?.pantryApplied[l.listItemId]), [lines, trip]);
  const proposals = useMemo(() => planPantryUpdate(pending, pantry.items.map((p) => ({ id: p.id, name: p.name, quantity: p.quantity, unit: p.unit }))), [pending, pantry.items]);
  const ready = status === 'ready' && trip?.status === 'finished' && pantry.status === 'ready' && items.status !== 'loading';

  const changeFor = (p: PantryProposal, target?: PantryItem): TripPantryChange | null => {
    if (p.kind === 'increase' || target) {
      const item = target ?? pantry.items.find((i) => i.id === (p as Extract<PantryProposal, { kind: 'increase' }>).pantryItemId);
      if (!item) return null;
      const qty = p.kind === 'increase' ? { amount: p.to.amount - p.from.amount, unit: p.to.unit } : p.quantity;
      const to = addQuantities({ amount: item.quantity, unit: item.unit }, qty);
      return to ? { kind: 'increase', item, to } : null;
    }
    const line = lines.find((l) => l.listItemId === p.sourceLineId);
    const listItem = items.items.find((i) => i.id === p.sourceLineId);
    return { kind: 'add', input: { name: p.name, quantity: p.quantity.amount, unit: p.quantity.unit, category: line?.outcome === 'substituted' ? 'other' : (listItem?.category ?? 'other') } };
  };

  const apply = async (p: PantryProposal, via: 'auto' | 'review', target?: PantryItem) => {
    const change = changeFor(p, target);
    if (!change || !trip) return;
    inFlight.current.add(p.sourceLineId);
    try {
      await applyTripPantryChange(data.uid!, trip.id, p.sourceLineId, change, { plan, pantryItems: pantry.items.length, now: Date.now(), via });
    } finally {
      inFlight.current.delete(p.sourceLineId);
    }
  };

  // Apply high-confidence updates once, in order (each add is a separate counted write).
  // `apply` reads the latest data through a ref so the effect runs only when proposals change.
  const applyRef = useRef(apply);
  useEffect(() => {
    applyRef.current = apply;
  });
  useEffect(() => {
    if (!ready) return;
    const next = proposals.automatic.find((p) => !inFlight.current.has(p.sourceLineId));
    if (!next) return;
    applyRef.current(next, 'auto').catch((e: unknown) => setError(errorMessage(e)));
  }, [ready, proposals]);

  if (status === 'loading' || items.status === 'loading' || pantry.status === 'loading') return <Screen testID="pantry-update-screen"><LoadingState label="Preparing your Pantry update…" /></Screen>;
  if (!trip) {
    return (
      <Screen testID="pantry-update-screen" header={<Header title="Update Pantry" />}>
        <EmptyState title="This trip is not available" actionTitle="Go to Pantry" onAction={() => router.replace(ROUTES.pantry)} />
      </Screen>
    );
  }

  const applied = Object.entries(trip.pantryApplied).filter((e): e is [string, Extract<PantryAppliedEntry, { status: 'applied' }>] => e[1].status === 'applied');
  const auto = applied.filter(([, e]) => e.via === 'auto');
  const reviewedApplied = applied.filter(([, e]) => e.via === 'review');
  const skipped = Object.values(trip.pantryApplied).filter((e) => e.status !== 'applied').length;
  const unavailable = Object.values(trip.lines).filter((l) => l.outcome === 'unavailable').length;
  const nameOf = (lineId: string) => {
    const l = trip.lines[lineId];
    return l?.substituteName ?? l?.name ?? items.items.find((i) => i.id === lineId)?.name ?? 'Item';
  };
  const pantryItem = (id: string) => pantry.items.find((p) => p.id === id);

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
      setReviewing(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const candidates = (p: PantryProposal) =>
    p.kind === 'increase'
      ? pantry.items.filter((i) => i.id === p.pantryItemId)
      : pantry.items.filter((i) => sameItem(i.name, p.name) && areComparable(i.unit, p.quantity.unit));

  const renderApplied = ([lineId, e]: [string, Extract<PantryAppliedEntry, { status: 'applied' }>]) => {
    const item = pantryItem(e.pantryItemId);
    return (
      <SettingsRow
        key={lineId}
        title={nameOf(lineId)}
        detail={item ? `${e.kind === 'add' ? 'Added' : 'Now'} ${quantityText(item.quantity, item.unit)} in your Pantry` : 'Updated'}
        trailing={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Badge label={e.via === 'auto' ? 'Auto' : 'Reviewed'} tone="neutral" />
            <Button title="Undo" variant="tertiary" compact loading={busy === `undo-${lineId}`} onPress={() => run(`undo-${lineId}`, () => undoTripPantryChange(data.uid!, trip.id, lineId, e))} accessibilityLabel={`Undo Pantry update for ${nameOf(lineId)}`} />
          </View>
        }
      />
    );
  };

  return (
    <Screen
      testID="pantry-update-screen"
      header={<Header title="Update Pantry" subtitle="High-confidence items update automatically." />}
      footer={
        <>
          <Button title="Done" onPress={() => router.replace(ROUTES.pantry)} testID="pantry-update-done" />
          <AppText variant="caption" tone="muted" style={{ textAlign: 'center' }}>
            Review items can be handled now or later from Home — nothing is discarded.
          </AppText>
        </>
      }
    >
      {error ? <Alert tone="error" title="Could not update your Pantry" detail={error} /> : null}

      <SectionHeader title="Updated Automatically" count={auto.length} />
      {auto.length ? <RowGroup testID="auto-updated">{auto.map(renderApplied)}</RowGroup> : <AppText variant="bodySmall" tone="secondary">{proposals.automatic.length ? 'Updating…' : 'No automatic updates.'}</AppText>}

      <SectionHeader title="Needs Review" count={proposals.review.length} />
      {proposals.review.length ? (
        <View style={{ gap: 8 }} testID="needs-review">
          {proposals.review.map((p) => (
            <View key={p.sourceLineId} style={{ backgroundColor: colors.status.warningSubtle, borderWidth: borderWidth.default, borderColor: colors.status.warning, borderRadius: radius.md, minHeight: 92, padding: spacing[16], flexDirection: 'row', alignItems: 'center', gap: spacing[8] }}>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="label">{p.name}</AppText>
                <AppText variant="caption" tone="secondary">
                  {p.reason}
                </AppText>
              </View>
              <Button title="Review" variant="secondary" compact onPress={() => setReviewing(p)} accessibilityLabel={`Review ${p.name}`} testID={`review-${p.sourceLineId}`} />
            </View>
          ))}
        </View>
      ) : (
        <AppText variant="bodySmall" tone="secondary">
          Nothing to review.
        </AppText>
      )}

      {reviewedApplied.length ? (
        <>
          <SectionHeader title="Reviewed" count={reviewedApplied.length} />
          <RowGroup>{reviewedApplied.map(renderApplied)}</RowGroup>
        </>
      ) : null}
      {skipped || unavailable ? (
        <AppText variant="caption" tone="muted">
          {[skipped ? `${skipped} not added by you` : '', unavailable ? `${unavailable} unavailable in store (not added)` : ''].filter(Boolean).join(' · ')}
        </AppText>
      ) : null}

      <Sheet visible={!!reviewing} title={reviewing ? `Review ${reviewing.name}` : ''} onClose={() => setReviewing(null)} testID="review-sheet">
        {reviewing ? (
          <>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Badge label="Needs review" tone="warning" />
              <AppText variant="caption" tone="secondary" style={{ flex: 1 }}>
                {reviewing.reason}
              </AppText>
            </View>
            <AppText variant="bodySmall">{describe(reviewing)}</AppText>
            {candidates(reviewing).map((c) => (
              <Button
                key={c.id}
                title={`Add to ${c.name} (${quantityText(c.quantity, c.unit)})`}
                variant="secondary"
                loading={busy === `to-${c.id}`}
                onPress={() => run(`to-${c.id}`, () => apply(reviewing, 'review', c))}
              />
            ))}
            {reviewing.kind === 'add' ? (
              <Button title="Add as a new Pantry item" loading={busy === 'new'} onPress={() => run('new', () => apply(reviewing, 'review'))} testID="review-add-new" />
            ) : null}
            <Button title="Don't add to Pantry" variant="tertiary" loading={busy === 'dismiss'} onPress={() => run('dismiss', () => dismissTripPantryLine(data.uid!, trip.id, reviewing.sourceLineId))} testID="review-dismiss" />
          </>
        ) : null}
      </Sheet>
    </Screen>
  );
}
