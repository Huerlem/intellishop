/**
 * P10 Pantry (Figma 136:470): search, Running Low, Use Soon, Recently Added, Use What I Have →
 * Browse Recipes, All Items. Items past their date are shown first in their own section so
 * they are never hidden (design clarification C7-a).
 */
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { PLAN_LIMITS } from '@/shared/entitlements/plans';
import type { PantryItem } from '@/src/data/types';
import { DataStatusBanner } from '@/src/features/DataStatusBanner';
import { PantryItemEditor } from '@/src/features/pantry/PantryItemEditor';
import { pantryMeta, pantryStatus } from '@/src/features/presenters';
import { ROUTES } from '@/src/navigation/routes';
import { useAppData } from '@/src/state/AppDataProvider';
import { useNow } from '@/src/state/clock';
import { usePantry, usePlan } from '@/src/state/hooks';
import { AppText, Button, EmptyState, ErrorState, Header, InfoCard, LoadingState, PantryItemRow, Screen, SearchField, SectionHeader } from '@/src/ui';

export function PantryRows({ items, onOpen, max }: { items: PantryItem[]; onOpen: (i: PantryItem) => void; max?: number }) {
  const now = useNow();
  return (
    <View style={{ gap: 8 }}>
      {(max ? items.slice(0, max) : items).map((i) => (
        <PantryItemRow key={i.id} testID={`pantry-item-${i.id}`} name={i.name} meta={pantryMeta(i)} badge={pantryStatus(i, now)} onPress={() => onOpen(i)} />
      ))}
    </View>
  );
}

export default function PantryScreen() {
  const router = useRouter();
  const data = useAppData();
  const pantry = usePantry();
  const { plan } = usePlan();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<PantryItem | null>(null);
  const [adding, setAdding] = useState(false);
  const q = query.trim().toLowerCase();
  const results = useMemo(() => (q ? pantry.items.filter((i) => i.name.toLowerCase().includes(q)) : []), [q, pantry.items]);
  const { runningLow, useSoon, expired, recentlyAdded } = pantry.signals;
  const limit = PLAN_LIMITS[plan].pantryItems;

  return (
    <Screen inTabs testID="pantry-screen" header={<Header title="Pantry" titleVariant="h1" right={<Button title="Add" variant="tertiary" onPress={() => setAdding(true)} testID="pantry-add" />} />} onRefresh={data.retry}>
      <DataStatusBanner />
      {pantry.status === 'loading' ? (
        <LoadingState label="Loading your Pantry…" />
      ) : pantry.status === 'error' ? (
        <ErrorState message={pantry.error?.message ?? 'Your Pantry could not be loaded.'} onRetry={data.retry} />
      ) : pantry.items.length === 0 ? (
        <EmptyState title="Your Pantry is empty" body="Add what you have at home, or finish a shopping trip to add what you bought." actionTitle="Add an item" onAction={() => setAdding(true)} testID="pantry-empty" />
      ) : (
        <>
          <SearchField accessibilityLabel="Search pantry items" placeholder="Search pantry items" value={query} onChangeText={setQuery} testID="pantry-search" />
          {q ? (
            <>
              <SectionHeader title="Results" count={results.length} />
              {results.length ? <PantryRows items={results} onOpen={setEditing} /> : <AppText variant="bodySmall" tone="secondary">No items match “{query.trim()}”.</AppText>}
            </>
          ) : (
            <>
              {expired.length ? (
                <>
                  <SectionHeader title="Past Their Date" count={expired.length} />
                  <PantryRows items={expired} onOpen={setEditing} />
                </>
              ) : null}
              <SectionHeader title="Running Low" count={runningLow.length} />
              {runningLow.length ? <PantryRows items={runningLow} onOpen={setEditing} max={3} /> : <AppText variant="bodySmall" tone="secondary">Nothing is running low.</AppText>}
              <SectionHeader title="Use Soon" count={useSoon.length} />
              {useSoon.length ? <PantryRows items={useSoon} onOpen={setEditing} max={3} /> : <AppText variant="bodySmall" tone="secondary">Nothing needs using in the next few days.</AppText>}
              <SectionHeader title="Recently Added" count={recentlyAdded.length} />
              {recentlyAdded.length ? <PantryRows items={recentlyAdded} onOpen={setEditing} max={3} /> : <AppText variant="bodySmall" tone="secondary">Nothing added in the last 7 days.</AppText>}

              <InfoCard withIcon title="Use What I Have" body="See recipe ideas built from what is already in your Pantry." testID="use-what-i-have" />
              <Button title="Browse Recipes" variant="secondary" onPress={() => router.push(ROUTES.recipes)} testID="browse-recipes" />

              <SectionHeader title="All Items" action={<Button title={`View all (${pantry.items.length})`} variant="tertiary" compact onPress={() => router.push(ROUTES.pantryAll)} testID="pantry-view-all" />} />
              {Number.isFinite(limit) ? (
                <AppText variant="caption" tone="muted">
                  {pantry.items.length} of {limit} items on the Free plan
                </AppText>
              ) : null}
            </>
          )}
        </>
      )}
      {adding || editing ? (
        <PantryItemEditor key={editing?.id ?? 'new'} item={editing} initialName={adding ? query.trim() : undefined} onClose={() => { setAdding(false); setEditing(null); }} onSeePlans={() => { setAdding(false); router.push(ROUTES.plans); }} />
      ) : null}
    </Screen>
  );
}
