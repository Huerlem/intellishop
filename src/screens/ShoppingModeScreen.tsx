/**
 * P07 Shopping Mode (Figma 136:346): one-handed, contextual (not a tab). Progress, items
 * grouped by category (no aisle data exists — clarification C4), tap to collect, tap and hold
 * (or the VoiceOver actions menu) for Substitute / Unavailable / Qty, Finish Shopping.
 * Every change is saved as it happens (Firestore latency compensation shows it immediately).
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { CATEGORY_LABELS, ITEM_CATEGORIES } from '@/shared/domain/items';
import { cancelTrip, setLine } from '@/src/data/tripsRepository';
import type { ListItem } from '@/src/data/types';
import { parseQuantity } from '@/src/features/forms';
import { groupByCategory, quantityText } from '@/src/features/presenters';
import { DataStatusBanner } from '@/src/features/DataStatusBanner';
import { ROUTES, routeTo } from '@/src/navigation/routes';
import { useAppData } from '@/src/state/AppDataProvider';
import { errorMessage, useListItems, useTrip } from '@/src/state/hooks';
import { Alert, AppText, Button, EmptyState, Header, IconButton, LoadingState, ProgressBar, Screen, Sheet, ShoppingModeItem, TextField, type ShoppingItemState } from '@/src/ui';

type Pending = { kind: 'substitute' | 'quantity'; item: ListItem } | null;

export default function ShoppingModeScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();
  const data = useAppData();
  const { status, trip, error } = useTrip(tripId);
  const items = useListItems(trip?.listId);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Pending>(null);
  const [value, setValue] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const groups = useMemo(() => groupByCategory(items.items, ITEM_CATEGORIES), [items.items]);
  const close = () => (router.canGoBack() ? router.back() : router.replace(ROUTES.home));

  if (status === 'loading' || (trip && items.status === 'loading')) {
    return <Screen testID="shopping-mode-screen"><LoadingState label="Opening Shopping Mode…" /></Screen>;
  }
  if (status === 'error' || !trip) {
    return (
      <Screen testID="shopping-mode-screen" header={<Header left={<IconButton kind="close" onPress={close} />} title="Shopping Mode" titleVariant="h3" />}>
        <EmptyState title="This shopping trip is not available" body={error?.message ?? 'It may have been finished or cancelled on another device.'} actionTitle="Go Home" onAction={() => router.replace(ROUTES.home)} />
      </Screen>
    );
  }
  if (trip.status === 'finished') {
    return (
      <Screen testID="shopping-mode-screen" header={<Header left={<IconButton kind="close" onPress={close} />} title={trip.listName} titleVariant="h3" />}>
        <EmptyState title="This trip is finished" body="You can still review the Pantry update for it." actionTitle="Update Pantry" onAction={() => router.replace(routeTo.pantryUpdate(trip.id))} />
      </Screen>
    );
  }

  const stateOf = (item: ListItem): ShoppingItemState => trip.lines[item.id]?.outcome ?? 'pending';
  const done = items.items.filter((i) => trip.lines[i.id]).length;
  const remaining = items.items.length - done;

  const save = (item: ListItem, line: Parameters<typeof setLine>[3]) => {
    setMessage(null);
    setLine(data.uid!, trip, item.id, line ? { ...line, name: item.name } : null).catch((e) => setMessage(errorMessage(e)));
  };
  const toggle = (item: ListItem) => {
    setExpanded(null);
    if (trip.lines[item.id]) save(item, null);
    else save(item, { outcome: 'collected', quantity: item.quantity, unit: item.unit });
  };
  const openSheet = (kind: 'substitute' | 'quantity', item: ListItem) => {
    setExpanded(null);
    setFieldError(null);
    setValue(kind === 'quantity' ? String(trip.lines[item.id]?.quantity ?? item.quantity) : '');
    setSheet({ kind, item });
  };
  const submitSheet = () => {
    if (!sheet) return;
    const { item } = sheet;
    if (sheet.kind === 'substitute') {
      if (!value.trim()) return setFieldError('Enter what you bought instead.');
      save(item, { outcome: 'substituted', quantity: item.quantity, unit: item.unit, substituteName: value.trim() });
    } else {
      const q = parseQuantity(value);
      if (q == null) return setFieldError('Enter a quantity greater than 0.');
      save(item, { outcome: 'collected', quantity: q, unit: item.unit });
    }
    setSheet(null);
  };

  return (
    <Screen
      testID="shopping-mode-screen"
      header={
        <Header
          left={<IconButton kind="close" onPress={close} accessibilityLabel="Close Shopping Mode. Your progress is saved." />}
          title={trip.listName}
          titleVariant="h3"
          right={<IconButton kind="more" onPress={() => setConfirmCancel(true)} accessibilityLabel="Shopping trip options" />}
        />
      }
      footer={<Button title="Finish Shopping" onPress={() => router.push(routeTo.finish(trip.id))} testID="finish-shopping" />}
    >
      <DataStatusBanner />
      <ProgressBar done={done} total={items.items.length} label={`${done} done · ${remaining} remaining`} testID="shopping-progress" />
      {message ? <Alert tone="error" title="Could not save" detail={message} /> : null}
      {items.items.length === 0 ? <EmptyState title="This list is empty" body="Add items to the list, then come back." /> : null}
      {groups.map((g) => (
        <View key={g.category} style={{ gap: 8 }}>
          <AppText variant="label" tone="secondary" accessibilityRole="header">
            {CATEGORY_LABELS[g.category as keyof typeof CATEGORY_LABELS]}
          </AppText>
          {g.items.map((item) => {
            const line = trip.lines[item.id];
            return (
              <ShoppingModeItem
                key={item.id}
                testID={`shop-item-${item.id}`}
                name={item.name}
                meta={quantityText(line?.quantity ?? item.quantity, item.unit)}
                state={stateOf(item)}
                substituteName={line?.substituteName}
                expanded={expanded === item.id}
                onToggle={() => toggle(item)}
                onExpand={() => setExpanded(expanded === item.id ? null : item.id)}
                onSubstitute={() => openSheet('substitute', item)}
                onUnavailable={() => {
                  setExpanded(null);
                  save(item, { outcome: 'unavailable', quantity: item.quantity, unit: item.unit });
                }}
                onQuantity={() => openSheet('quantity', item)}
              />
            );
          })}
        </View>
      ))}
      <AppText variant="caption" tone="muted">
        Tap an item to mark it found. Tap and hold for a substitute, an unavailable item or a different quantity.
      </AppText>

      <Sheet
        visible={!!sheet}
        title={sheet?.kind === 'substitute' ? `Substitute for ${sheet.item.name}` : `How many ${sheet?.item.name ?? ''}?`}
        onClose={() => setSheet(null)}
        footer={<Button title="Save" onPress={submitSheet} testID="shop-sheet-save" />}
      >
        {sheet?.kind === 'substitute' ? (
          <TextField label="What did you buy instead?" value={value} onChangeText={setValue} maxLength={60} error={fieldError} autoFocus testID="substitute-name" />
        ) : (
          <TextField label={`Quantity bought (${sheet ? quantityText(2, sheet.item.unit).replace(/^2 /, '') : ''})`} value={value} onChangeText={setValue} keyboardType="decimal-pad" error={fieldError} autoFocus testID="bought-quantity" />
        )}
      </Sheet>

      <Sheet visible={confirmCancel} title="Shopping trip" onClose={() => setConfirmCancel(false)}>
        <Alert tone="warning" title="Cancel this trip?" detail="Your progress in this trip is discarded. Items you ticked stay ticked on your list, and your Pantry is not changed." />
        <Button
          title="Cancel trip"
          variant="destructive"
          onPress={async () => {
            try {
              await cancelTrip(data.uid!, trip);
              setConfirmCancel(false);
              router.replace(routeTo.list(trip.listId));
            } catch (e) {
              setMessage(errorMessage(e));
              setConfirmCancel(false);
            }
          }}
          testID="cancel-trip"
        />
        <Button title="Keep shopping" variant="tertiary" onPress={() => setConfirmCancel(false)} />
      </Sheet>
    </Screen>
  );
}
