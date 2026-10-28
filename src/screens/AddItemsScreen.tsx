/**
 * P03 Add Items (Figma 136:137): search, suggestions with rationale badges, results with
 * "Already in Pantry" / "Already on list", custom item. Scan is out of the approved V2.0 scope
 * (matrix C10) and is not shown. Suggestions come only from the user's own Pantry.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { cleanDisplayName, validateItemName } from '@/shared/domain/items';
import { UNITS } from '@/shared/domain/units';
import { pantrySignals } from '@/src/data/pantrySignals';
import type { PantryItem } from '@/src/data/types';
import { sameItem } from '@/src/features/presenters';
import { ROUTES } from '@/src/navigation/routes';
import { useNow } from '@/src/state/clock';
import { errorMessage, useListItems, useLists, usePantry } from '@/src/state/hooks';
import { Alert, AppText, Badge, Button, Header, IconButton, RowGroup, Screen, SearchField, SectionHeader } from '@/src/ui';
import { borderWidth, colors, spacing, touch } from '@/src/theme';

function SuggestionRow({ name, badges, onAdd, testID }: { name: string; badges: { label: string; tone: 'warning' | 'rationale' | 'info' | 'neutral' }[]; onAdd: () => void; testID?: string }) {
  return (
    <View
      testID={testID}
      style={{ minHeight: touch.shoppingRow, flexDirection: 'row', alignItems: 'center', gap: spacing[8], paddingHorizontal: spacing[16], paddingVertical: spacing[8], backgroundColor: colors.surface.card, borderBottomWidth: borderWidth.default, borderBottomColor: colors.border.default }}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <AppText variant="bodySmall">{name}</AppText>
        {badges.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {badges.map((b) => (
              <Badge key={b.label} label={b.label} tone={b.tone} />
            ))}
          </View>
        ) : null}
      </View>
      <Button title="Add" variant="secondary" compact onPress={onAdd} accessibilityLabel={`Add ${name}`} />
    </View>
  );
}

export default function AddItemsScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const router = useRouter();
  const lists = useLists();
  const pantry = usePantry();
  const items = useListItems(listId);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<{ tone: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const list = lists.all.find((l) => l.id === listId);
  const done = () => (router.canGoBack() ? router.back() : router.replace(ROUTES.lists));

  const listItems = items.items;
  const onList = (name: string) => listItems.find((i) => sameItem(i.name, name));
  const now = useNow();
  const suggestions = useMemo(() => {
    const signals = pantrySignals(pantry.items, now);
    const seen = new Set<string>();
    const out: { item: PantryItem; reason: string }[] = [];
    for (const i of pantry.items.filter((p) => p.quantity <= 0)) out.push({ item: i, reason: 'Run out' });
    for (const i of signals.runningLow) out.push({ item: i, reason: 'Running low' });
    return out
      .filter(({ item }) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return !listItems.some((l) => sameItem(l.name, item.name));
      })
      .slice(0, 8);
  }, [pantry.items, now, listItems]);

  const q = query.trim();
  const results = q ? pantry.items.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 10) : [];

  const add = async (name: string, from?: PantryItem) => {
    const clean = cleanDisplayName(name);
    const err = validateItemName(clean);
    if (err) return setStatus({ tone: 'error', text: err });
    try {
      const unit = from && (UNITS[from.unit].family === 'count' || UNITS[from.unit].family === 'pack') ? from.unit : 'unit';
      const r = await items.add({ name: clean, quantity: 1, unit, category: from?.category ?? 'other' });
      setStatus({ tone: 'success', text: r.merged ? `${clean} was already on the list — quantity increased` : `Added ${clean}` });
      if (!from) setQuery('');
    } catch (e) {
      setStatus({ tone: 'error', text: errorMessage(e) });
    }
  };

  return (
    <Screen
      testID="add-items-screen"
      header={<Header left={<IconButton kind="back" onPress={done} />} title={list ? `Add to ${list.name}` : 'Add items'} titleVariant="h3" right={<Button title="Done" variant="tertiary" compact onPress={done} testID="add-items-done" />} />}
    >
      <SearchField accessibilityLabel="Search or type an item" placeholder="Search or type an item" value={query} onChangeText={setQuery} onSubmitEditing={() => q && add(q)} testID="add-items-search" autoFocus />
      {status ? <Alert tone={status.tone} title={status.text} testID="add-items-status" /> : null}
      {!items.canAdd ? <Alert tone="warning" title={`The Free plan includes up to ${items.limit} items per list`} detail="Remove ticked items or see plans for unlimited items." actionTitle="See plans" onAction={() => router.push(ROUTES.plans)} /> : null}

      {q ? (
        <>
          <SectionHeader title="Search Results" />
          <RowGroup>
            {results.map((p) => {
              const existing = onList(p.name);
              const badges = [
                ...(p.quantity > 0 ? [{ label: 'Already in Pantry', tone: 'info' as const }] : []),
                ...(existing ? [{ label: 'Already on list', tone: 'neutral' as const }] : []),
              ];
              return <SuggestionRow key={p.id} name={p.name} badges={badges} onAdd={() => add(p.name, p)} />;
            })}
          </RowGroup>
          <Button title={`+ Add “${q}” as a custom item`} variant="tertiary" align="start" onPress={() => add(q)} testID="add-custom" />
        </>
      ) : (
        <>
          <SectionHeader title="From your Pantry" />
          {suggestions.length ? (
            <RowGroup>
              {suggestions.map(({ item, reason }) => (
                <SuggestionRow key={item.id} testID={`suggestion-${item.id}`} name={item.name} badges={[{ label: reason, tone: 'warning' }]} onAdd={() => add(item.name, item)} />
              ))}
            </RowGroup>
          ) : (
            <AppText variant="bodySmall" tone="secondary">
              Items that run out or run low in your Pantry will appear here. Type above to add anything else.
            </AppText>
          )}
        </>
      )}
    </Screen>
  );
}
