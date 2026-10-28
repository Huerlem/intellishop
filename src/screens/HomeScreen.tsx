/**
 * P01 Home (Figma 136:3): greeting + avatar, Resume Shopping (active trip progress), active
 * list, Today's Signals (from the user's Pantry), Create new list.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { pendingPantryLines } from '@/src/data/tripsRepository';
import { greeting, homeSignals } from '@/src/features/presenters';
import { CreateListSheet } from '@/src/features/lists/ListSheets';
import { DataStatusBanner } from '@/src/features/DataStatusBanner';
import { ROUTES, routeTo } from '@/src/navigation/routes';
import { useAppData } from '@/src/state/AppDataProvider';
import { useNow } from '@/src/state/clock';
import { useLists, usePantry } from '@/src/state/hooks';
import { AppText, Avatar, Button, Card, EmptyState, ErrorState, Header, LoadingState, ProgressBar, Screen, SectionHeader, SignalRow } from '@/src/ui';

export default function HomeScreen() {
  const router = useRouter();
  const { getDisplayName, getInitials } = useAuth();
  const data = useAppData();
  const lists = useLists();
  const pantry = usePantry();
  const [creating, setCreating] = useState(false);
  const now = useNow();

  const trip = data.trips.data[0];
  const tripList = trip ? lists.all.find((l) => l.id === trip.listId) : undefined;
  const tripDone = trip ? Object.keys(trip.lines).length : 0;
  const tripTotal = tripList?.itemCount ?? tripDone;

  const activeList = [...lists.active].sort((a, b) => (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0))[0];
  const signals = homeSignals(pantry.items, now);
  const pendingReview = data.finishedTrips.data.find((t) => pendingPantryLines(t).length > 0);

  return (
    <Screen
      inTabs
      testID="home-screen"
      header={<Header title={greeting(now, getDisplayName())} right={<Avatar initial={getInitials()} onPress={() => router.push(ROUTES.profile)} />} />}
      onRefresh={data.retry}
    >
      <DataStatusBanner />

      {trip ? (
        <Card accent="primary" onPress={() => router.push(routeTo.shopping(trip.id))} accessibilityLabel={`Resume shopping, ${trip.listName}, ${tripDone} of ${tripTotal} items done`} testID="resume-shopping">
          <AppText variant="h3">Resume Shopping</AppText>
          <AppText variant="bodySmall" tone="secondary">
            {trip.listName} · {tripDone} of {tripTotal} items done
          </AppText>
          <ProgressBar done={tripDone} total={tripTotal} label={`${tripDone} of ${tripTotal} done`} style={{ marginTop: 8 }} />
        </Card>
      ) : null}

      {pendingReview ? (
        <Card accent="warning" onPress={() => router.push(routeTo.pantryUpdate(pendingReview.id))} accessibilityLabel="Pantry update waiting for your review" testID="pantry-review-pending">
          <AppText variant="h3">Pantry update waiting</AppText>
          <AppText variant="bodySmall" tone="secondary">
            {pendingPantryLines(pendingReview).length} items from {pendingReview.listName || 'your last shop'} still need a decision.
          </AppText>
        </Card>
      ) : null}

      <AppText variant="label" tone="secondary">
        Your active list
      </AppText>
      {lists.status === 'loading' ? (
        <LoadingState label="Loading your lists…" />
      ) : lists.status === 'error' ? (
        <ErrorState message={lists.error?.message ?? 'Your lists could not be loaded.'} onRetry={data.retry} />
      ) : activeList ? (
        <Card accent="primary" onPress={() => router.push(routeTo.list(activeList.id))} accessibilityLabel={`${activeList.name}, ${activeList.itemCount} items. Continue planning`} testID="active-list-card">
          <AppText variant="h3">{activeList.name}</AppText>
          <AppText variant="bodySmall" tone="secondary">
            {activeList.itemCount} {activeList.itemCount === 1 ? 'item' : 'items'}
          </AppText>
          <AppText variant="caption" tone="action">
            Continue planning
          </AppText>
        </Card>
      ) : (
        <EmptyState title="No lists yet" body="Create a shopping list to start planning." actionTitle="Create a list" onAction={() => setCreating(true)} testID="home-empty-lists" />
      )}

      <SectionHeader title="Today's Signals" />
      {pantry.status === 'loading' ? null : signals.length ? (
        <View style={{ gap: 8 }}>
          {signals.map((s) => (
            <SignalRow key={s.key} text={s.text} tone={s.tone} onPress={() => router.push(ROUTES.pantry)} />
          ))}
        </View>
      ) : (
        <AppText variant="bodySmall" tone="secondary" testID="no-signals">
          {pantry.items.length ? 'Nothing needs attention in your Pantry today.' : 'Add items to your Pantry to see what is running low or needs using soon.'}
        </AppText>
      )}

      {activeList ? <Button title="Create new list" variant="tertiary" align="start" onPress={() => setCreating(true)} testID="home-create-list" /> : null}

      {creating ? <CreateListSheet onClose={() => setCreating(false)} onCreated={(id) => router.push(routeTo.list(id))} onSeePlans={() => { setCreating(false); router.push(ROUTES.plans); }} /> : null}
    </Screen>
  );
}
