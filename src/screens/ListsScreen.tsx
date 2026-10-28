/**
 * Lists tab root (Figma clarification C6/C11: the tab shows all lists; P02 is the detail).
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { PLAN_LIMITS } from '@/shared/entitlements/plans';
import type { ShoppingList } from '@/src/data/types';
import { CreateListSheet, ListActionsSheet } from '@/src/features/lists/ListSheets';
import { DataStatusBanner } from '@/src/features/DataStatusBanner';
import { ROUTES, routeTo } from '@/src/navigation/routes';
import { useAppData } from '@/src/state/AppDataProvider';
import { useLists, usePlan } from '@/src/state/hooks';
import { AppText, Button, Card, EmptyState, ErrorState, Header, IconButton, LoadingState, Screen, SectionHeader } from '@/src/ui';

function ListCard({ list, onOpen, onMore }: { list: ShoppingList; onOpen: () => void; onMore: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
      <Card accent={list.archived ? undefined : 'primary'} onPress={onOpen} style={{ flex: 1 }} accessibilityLabel={`${list.name}, ${list.itemCount} items${list.archived ? ', archived' : ''}`} testID={`list-card-${list.id}`}>
        <AppText variant="h3" tone={list.archived ? 'secondary' : 'primary'}>
          {list.name}
        </AppText>
        <AppText variant="bodySmall" tone="secondary">
          {list.itemCount} {list.itemCount === 1 ? 'item' : 'items'}
          {list.archived ? ' · Archived' : ''}
        </AppText>
      </Card>
      <View style={{ justifyContent: 'center' }}>
        <IconButton kind="more" onPress={onMore} accessibilityLabel={`Options for ${list.name}`} />
      </View>
    </View>
  );
}

export default function ListsScreen() {
  const router = useRouter();
  const data = useAppData();
  const lists = useLists();
  const { plan } = usePlan();
  const [creating, setCreating] = useState(false);
  const [actionsFor, setActionsFor] = useState<ShoppingList | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const limit = PLAN_LIMITS[plan].activeLists;

  return (
    <Screen inTabs testID="lists-screen" header={<Header title="Lists" titleVariant="h1" right={<Button title="New list" variant="tertiary" onPress={() => setCreating(true)} testID="lists-new" />} />} onRefresh={data.retry}>
      <DataStatusBanner />
      {lists.status === 'loading' ? (
        <LoadingState label="Loading your lists…" />
      ) : lists.status === 'error' ? (
        <ErrorState message={lists.error?.message ?? 'Your lists could not be loaded.'} onRetry={data.retry} />
      ) : lists.all.length === 0 ? (
        <EmptyState title="No lists yet" body="Create a list for your next shop. You can add items, tick them off in store and update your Pantry afterwards." actionTitle="Create a list" onAction={() => setCreating(true)} />
      ) : (
        <>
          {Number.isFinite(limit) ? (
            <AppText variant="caption" tone="muted" testID="lists-usage">
              {lists.active.length} of {limit} active lists on the Free plan
            </AppText>
          ) : null}
          <View style={{ gap: 12 }}>
            {lists.active.map((l) => (
              <ListCard key={l.id} list={l} onOpen={() => router.push(routeTo.list(l.id))} onMore={() => setActionsFor(l)} />
            ))}
            {lists.active.length === 0 ? <AppText variant="bodySmall" tone="secondary">No active lists. Restore an archived list or create a new one.</AppText> : null}
          </View>
          {lists.archived.length ? (
            <>
              <SectionHeader title="Archived" count={lists.archived.length} action={<Button title={showArchived ? 'Hide' : 'Show'} variant="tertiary" compact onPress={() => setShowArchived((s) => !s)} />} />
              {showArchived ? (
                <View style={{ gap: 12 }}>
                  {lists.archived.map((l) => (
                    <ListCard key={l.id} list={l} onOpen={() => router.push(routeTo.list(l.id))} onMore={() => setActionsFor(l)} />
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
        </>
      )}
      {creating ? <CreateListSheet onClose={() => setCreating(false)} onCreated={(id) => router.push(routeTo.list(id))} onSeePlans={() => { setCreating(false); router.push(ROUTES.plans); }} /> : null}
      {actionsFor ? <ListActionsSheet key={actionsFor.id} list={actionsFor} onClose={() => setActionsFor(null)} /> : null}
    </Screen>
  );
}
