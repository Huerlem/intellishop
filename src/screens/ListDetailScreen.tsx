/**
 * P02 List Detail (Figma 136:55): summary card (items, the user's own price estimate, items
 * already in the Pantry, estimate caveat), Optimise List, Start Shopping, Current Items.
 * Prices are only those the user typed in (decision D8); there is no budget field in the
 * data model yet, so the Figma "Budget · left" line is not shown (see matrix P02 notes).
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ITEM_CATEGORIES } from '@/shared/domain/items';
import { startTrip } from '@/src/data/tripsRepository';
import type { ListItem } from '@/src/data/types';
import { estimateLabel, itemsInPantry, listEstimate, priceBadge, quantityText, spokenQuantity } from '@/src/features/presenters';
import { ListActionsSheet, ListItemEditor } from '@/src/features/lists/ListSheets';
import { DataStatusBanner } from '@/src/features/DataStatusBanner';
import { ROUTES, routeTo } from '@/src/navigation/routes';
import { useAppData } from '@/src/state/AppDataProvider';
import { errorMessage, useListItems, useLists, usePantry } from '@/src/state/hooks';
import { Alert, AppText, Button, Card, EmptyState, ErrorState, Header, IconButton, ListItemRow, LoadingState, RowGroup, Screen, SectionHeader } from '@/src/ui';

const CATEGORY_ORDER = new Map(ITEM_CATEGORIES.map((c, i) => [c, i]));

export function sortListItems(items: ListItem[]): ListItem[] {
  return [...items].sort((a, b) => Number(a.checked) - Number(b.checked) || (CATEGORY_ORDER.get(a.category) ?? 99) - (CATEGORY_ORDER.get(b.category) ?? 99) || a.name.localeCompare(b.name));
}

export default function ListDetailScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const router = useRouter();
  const data = useAppData();
  const lists = useLists();
  const pantry = usePantry();
  const items = useListItems(listId);
  const [editing, setEditing] = useState<ListItem | null>(null);
  const [actions, setActions] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = lists.all.find((l) => l.id === listId);
  const sorted = useMemo(() => sortListItems(items.items), [items.items]);
  const estimate = listEstimate(items.items);
  const inPantry = itemsInPantry(items.items.filter((i) => !i.checked), pantry.items);
  const activeTrip = data.trips.data.find((t) => t.listId === listId);
  const checked = items.items.filter((i) => i.checked);

  const back = () => (router.canGoBack() ? router.back() : router.replace(ROUTES.lists));

  if (lists.status === 'ready' && !list) {
    return (
      <Screen testID="list-detail-screen" header={<Header left={<IconButton kind="back" onPress={back} />} title="List not found" />}>
        <EmptyState title="This list no longer exists" body="It may have been deleted on another device." actionTitle="Go to Lists" onAction={() => router.replace(ROUTES.lists)} />
      </Screen>
    );
  }

  const start = async () => {
    if (!list) return;
    if (activeTrip) return router.push(routeTo.shopping(activeTrip.id));
    setStarting(true);
    setError(null);
    try {
      const id = await startTrip(data.uid!, { id: list.id, name: list.name });
      router.push(routeTo.shopping(id));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setStarting(false);
    }
  };

  const label = estimateLabel(estimate);
  const remaining = items.items.length - checked.length;

  return (
    <Screen
      testID="list-detail-screen"
      header={<Header left={<IconButton kind="back" onPress={back} />} title={list?.name ?? ''} right={list ? <IconButton kind="more" onPress={() => setActions(true)} accessibilityLabel="List options" testID="list-more" /> : null} />}
    >
      <DataStatusBanner />
      {error ? <Alert tone="error" title="Could not start shopping" detail={error} /> : null}
      {list?.archived ? <Alert tone="info" title="This list is archived" detail="Restore it from the options menu to keep using it." /> : null}

      <Card accent="intelligence" testID="list-summary">
        <AppText variant="h3">
          {items.items.length} {items.items.length === 1 ? 'item' : 'items'}
          {checked.length ? ` · ${remaining} to get` : ''}
        </AppText>
        {label ? (
          <AppText variant="bodySmall" tone="secondary" testID="list-estimate">
            {label}
          </AppText>
        ) : null}
        {inPantry.length ? (
          <AppText variant="caption" tone="intelligence" testID="list-in-pantry">
            {inPantry.length} {inPantry.length === 1 ? 'item is' : 'items are'} already in your Pantry
          </AppText>
        ) : null}
        <AppText variant="caption" tone="muted">
          {label ? 'Uses only the prices you entered. Updates as items change.' : 'Add your own prices to items to see an estimate. IntelliShop does not look up store prices.'}
        </AppText>
      </Card>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button title="Optimise List" variant="secondary" style={{ flex: 1 }} onPress={() => router.push(routeTo.optimise(listId!))} disabled={!items.items.length} testID="optimise-list" />
        <Button
          title={activeTrip ? 'Resume Shopping' : 'Start Shopping'}
          style={{ flex: 1 }}
          onPress={start}
          loading={starting}
          disabled={!items.items.length || !!list?.archived}
          testID="start-shopping"
        />
      </View>

      <SectionHeader
        title="Current Items"
        count={Number.isFinite(items.limit) ? `${items.items.length} of ${items.limit}` : undefined}
        action={<Button title="+ Add Items" variant="tertiary" compact onPress={() => router.push(routeTo.addItems(listId!))} disabled={!!list?.archived} testID="add-items" />}
      />
      {items.status === 'loading' ? (
        <LoadingState label="Loading items…" />
      ) : items.status === 'error' ? (
        <ErrorState message={items.error?.message ?? 'Items could not be loaded.'} onRetry={items.retry} />
      ) : sorted.length === 0 ? (
        <EmptyState title="No items yet" body="Add what you need for this shop." actionTitle="Add items" onAction={() => router.push(routeTo.addItems(listId!))} />
      ) : (
        <RowGroup testID="list-items">
          {sorted.map((item) => (
            <ListItemRow
              key={item.id}
              testID={`item-${item.id}`}
              name={item.name}
              meta={quantityText(item.quantity, item.unit)}
              accessibilityMeta={spokenQuantity(item.quantity, item.unit)}
              checked={item.checked}
              badge={priceBadge(item)}
              onToggle={() => items.toggle(item).catch((e) => setError(errorMessage(e)))}
              onPress={() => setEditing(item)}
            />
          ))}
        </RowGroup>
      )}

      {editing ? (
        <ListItemEditor key={editing.id} item={editing} onClose={() => setEditing(null)} onSave={(p) => items.update(editing.id, { ...p })} onDelete={() => items.remove(editing.id)} />
      ) : null}
      {actions && list ? (
        <ListActionsSheet
          list={list}
          onClose={() => setActions(false)}
          onDeleted={() => router.replace(ROUTES.lists)}
          checkedCount={checked.length}
          onRemoveChecked={async () => {
            for (const i of checked) await items.remove(i.id);
          }}
        />
      ) : null}
    </Screen>
  );
}
