/**
 * P08 Finish Shopping (Figma 136:397): summary of purchased / substituted / unavailable,
 * the user's own estimate, the actual total entered at checkout (optional), items that need
 * attention, Finish Shopping → Pantry Update.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { formatPence, parsePriceToPence } from '@/shared/domain/items';
import { finishTrip } from '@/src/data/tripsRepository';
import { estimateLabel, listEstimate } from '@/src/features/presenters';
import { ROUTES, routeTo } from '@/src/navigation/routes';
import { useAppData } from '@/src/state/AppDataProvider';
import { errorMessage, useListItems, useTrip } from '@/src/state/hooks';
import { borderWidth, colors, spacing } from '@/src/theme';
import { Alert, AppText, Button, Card, Header, IconButton, InfoCard, LoadingState, Screen, TextField } from '@/src/ui';

function Row({ label, value, testID }: { label: string; value: string; testID?: string }) {
  return (
    <View testID={testID} accessible accessibilityLabel={`${label}: ${value}`} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing[12], borderBottomWidth: borderWidth.default, borderBottomColor: colors.border.default, gap: spacing[8] }}>
      <AppText variant="bodySmall" tone="secondary">
        {label}
      </AppText>
      <AppText variant="label">{value}</AppText>
    </View>
  );
}

export default function FinishShoppingScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();
  const data = useAppData();
  const { trip, status } = useTrip(tripId);
  const items = useListItems(trip?.listId);
  const [total, setTotal] = useState('');
  const [totalError, setTotalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const back = () => (router.canGoBack() ? router.back() : router.replace(ROUTES.home));

  if (status === 'loading' || !trip || items.status === 'loading') {
    return <Screen testID="finish-screen"><LoadingState /></Screen>;
  }

  const lines = Object.values(trip.lines);
  const count = (o: string) => lines.filter((l) => l.outcome === o).length;
  const unmarked = items.items.filter((i) => !trip.lines[i.id]);
  const estimate = estimateLabel(listEstimate(items.items));

  const finish = async () => {
    const pence = total.trim() ? parsePriceToPence(total) : null;
    if (total.trim() && pence == null) return setTotalError('Enter an amount like 23.50');
    setBusy(true);
    setError(null);
    try {
      if (trip.status === 'active') await finishTrip(data.uid!, trip, pence);
      router.replace(routeTo.pantryUpdate(trip.id));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      testID="finish-screen"
      header={<Header left={<IconButton kind="back" onPress={back} accessibilityLabel="Back to Shopping Mode" />} title="Shopping Summary" subtitle="Check what happened before updating your Pantry." />}
      footer={
        <>
          <Button title="Finish Shopping" onPress={finish} loading={busy} testID="confirm-finish" />
          <AppText variant="caption" tone="muted" style={{ textAlign: 'center' }}>
            Finishing prepares the Pantry update. Nothing in your Pantry changes without being shown to you.
          </AppText>
        </>
      }
    >
      {error ? <Alert tone="error" title="Could not finish" detail={error} /> : null}
      <Card padding={16}>
        <Row label="Purchased" value={String(count('collected'))} testID="summary-purchased" />
        <Row label="Substituted" value={String(count('substituted'))} testID="summary-substituted" />
        <Row label="Unavailable" value={String(count('unavailable'))} testID="summary-unavailable" />
        <Row label="Estimated total" value={estimate ? estimate.replace('Your prices: ', '') : 'No prices entered'} />
        {trip.actualTotalPence != null ? <Row label="Actual total" value={formatPence(trip.actualTotalPence)} /> : null}
      </Card>
      {trip.status === 'active' ? (
        <TextField
          label="Actual total paid (optional)"
          value={total}
          onChangeText={(t) => {
            setTotal(t);
            setTotalError(null);
          }}
          keyboardType="decimal-pad"
          placeholder="e.g. 23.50"
          hint="Entered at checkout. Only you can see it."
          error={totalError}
          testID="actual-total"
        />
      ) : null}
      {unmarked.length ? (
        <InfoCard
          withIcon
          title="Needs Your Attention"
          body={`${unmarked.length} ${unmarked.length === 1 ? 'item was' : 'items were'} not marked (${unmarked.slice(0, 3).map((i) => i.name).join(', ')}${unmarked.length > 3 ? '…' : ''}). ${unmarked.length === 1 ? 'It stays' : 'They stay'} on your list and won't be added to your Pantry.`}
          testID="needs-attention"
        />
      ) : null}
    </Screen>
  );
}
