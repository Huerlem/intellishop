/** Pantry › All Items (Figma clarification C7): every item, grouped by category, searchable. */
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { CATEGORY_LABELS, ITEM_CATEGORIES } from '@/shared/domain/items';
import type { PantryItem } from '@/src/data/types';
import { DataStatusBanner } from '@/src/features/DataStatusBanner';
import { PantryItemEditor } from '@/src/features/pantry/PantryItemEditor';
import { groupByCategory } from '@/src/features/presenters';
import { ROUTES } from '@/src/navigation/routes';
import { usePantry } from '@/src/state/hooks';
import { AppText, Button, EmptyState, Header, IconButton, LoadingState, Screen, SearchField } from '@/src/ui';
import { PantryRows } from './PantryScreen';

export default function PantryAllScreen() {
  const router = useRouter();
  const pantry = usePantry();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<PantryItem | null>(null);
  const [adding, setAdding] = useState(false);
  const q = query.trim().toLowerCase();
  const groups = useMemo(() => groupByCategory(pantry.items.filter((i) => !q || i.name.toLowerCase().includes(q)), ITEM_CATEGORIES), [pantry.items, q]);
  const back = () => (router.canGoBack() ? router.back() : router.replace(ROUTES.pantry));

  return (
    <Screen testID="pantry-all-screen" header={<Header left={<IconButton kind="back" onPress={back} />} title={`All Items (${pantry.items.length})`} right={<Button title="Add" variant="tertiary" onPress={() => setAdding(true)} />} />}>
      <DataStatusBanner />
      <SearchField accessibilityLabel="Search pantry items" placeholder="Search pantry items" value={query} onChangeText={setQuery} />
      {pantry.status === 'loading' ? <LoadingState /> : null}
      {pantry.status === 'ready' && groups.length === 0 ? <EmptyState title={q ? 'No matching items' : 'Your Pantry is empty'} /> : null}
      {groups.map((g) => (
        <View key={g.category} style={{ gap: 8 }}>
          <AppText variant="label" tone="secondary" accessibilityRole="header">
            {CATEGORY_LABELS[g.category as keyof typeof CATEGORY_LABELS]} ({g.items.length})
          </AppText>
          <PantryRows items={g.items} onOpen={setEditing} />
        </View>
      ))}
      {adding || editing ? (
        <PantryItemEditor key={editing?.id ?? 'new'} item={editing} onClose={() => { setAdding(false); setEditing(null); }} onSeePlans={() => { setAdding(false); router.push(ROUTES.plans); }} />
      ) : null}
    </Screen>
  );
}
