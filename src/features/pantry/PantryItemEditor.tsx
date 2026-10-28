/**
 * Pantry item editor (Figma clarification C7 — manual corrections and expiry management).
 * Create or edit; quantity may be 0 ("run out"); date kind is explicit (use-by vs best before),
 * because the two mean different things for food safety (FOOD_SAFETY_TECHNICAL_SPEC.md).
 */
import { useState } from 'react';
import { View } from 'react-native';

import { MAX_ITEM_NAME_LENGTH, validateItemName, type ItemCategory } from '@/shared/domain/items';
import type { CanonicalUnit } from '@/shared/domain/units';
import { PLAN_LIMITS } from '@/shared/entitlements/plans';
import type { ExpiryKind, PantryItem } from '@/src/data/types';
import { errorMessage, usePantry, usePlan } from '@/src/state/hooks';
import { Alert, AppText, Button, ChoiceChips, Sheet, TextField } from '@/src/ui';
import { daysFromNow, formatUkDate, parseQuantity, parseUkDate } from '../forms';
import { CATEGORY_OPTIONS, UNIT_OPTIONS } from '../lists/ListSheets';

type DateMode = 'none' | ExpiryKind;
const DATE_MODES: { value: DateMode; label: string }[] = [
  { value: 'none', label: 'No date' },
  { value: 'use_by', label: 'Use by' },
  { value: 'best_before', label: 'Best before' },
];
const QUICK_DATES = [
  { value: '0', label: 'Today' },
  { value: '1', label: 'Tomorrow' },
  { value: '3', label: 'In 3 days' },
  { value: '7', label: 'In a week' },
] as const;

type Props = { item: PantryItem | null; initialName?: string; onClose: () => void; onSeePlans?: () => void };

/** Render only while open, keyed by item ID (or "new"), so the form starts from the item. */
export function PantryItemEditor({ item, initialName, onClose, onSeePlans }: Props) {
  const pantry = usePantry();
  const { plan } = usePlan();
  const [name, setName] = useState(item?.name ?? initialName ?? '');
  const [qty, setQty] = useState(String(item?.quantity ?? 1));
  const [unit, setUnit] = useState<CanonicalUnit>(item?.unit ?? 'unit');
  const [minQty, setMinQty] = useState(String(item?.minQuantity ?? 0));
  const [category, setCategory] = useState<ItemCategory>(item?.category ?? 'other');
  const [dateMode, setDateMode] = useState<DateMode>(item?.expiryDate != null ? (item.expiryKind ?? 'best_before') : 'none');
  const [date, setDate] = useState(item?.expiryDate != null ? formatUkDate(item.expiryDate) : '');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const creating = !item;
  const blocked = creating && !pantry.canAdd;

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    try {
      await fn();
      onClose();
    } catch (e) {
      setErrors({ form: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const save = () => {
    const quantity = parseQuantity(qty, true);
    const minQuantity = parseQuantity(minQty, true);
    const expiry = dateMode === 'none' ? null : parseUkDate(date);
    const e = {
      name: validateItemName(name),
      qty: quantity == null ? 'Enter 0 or more.' : null,
      min: minQuantity == null ? 'Enter 0 or more.' : null,
      date: dateMode !== 'none' && expiry == null ? 'Enter a date as DD/MM/YYYY.' : null,
    };
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    const input = { name, quantity: quantity!, unit, minQuantity: minQuantity!, category, expiryDate: expiry, expiryKind: dateMode === 'none' ? null : dateMode };
    return run('save', () => (item ? pantry.update(item.id, input) : pantry.add(input)));
  };

  return (
    <Sheet
      visible
      title={creating ? 'Add to Pantry' : 'Edit Pantry item'}
      onClose={onClose}
      testID="pantry-editor"
      footer={
        blocked ? (
          onSeePlans ? <Button title="See plans" variant="secondary" onPress={onSeePlans} /> : null
        ) : confirmDelete && item ? (
          <>
            <Button title="Remove item" variant="destructive" loading={busy === 'delete'} onPress={() => run('delete', () => pantry.remove(item.id))} testID="pantry-editor-confirm-remove" />
            <Button title="Keep item" variant="tertiary" onPress={() => setConfirmDelete(false)} />
          </>
        ) : (
          <>
            <Button title={creating ? 'Add item' : 'Save'} onPress={save} loading={busy === 'save'} testID="pantry-editor-save" />
            {item ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button title="Mark as run out" variant="tertiary" style={{ flex: 1 }} disabled={item.quantity === 0} loading={busy === 'out'} onPress={() => run('out', () => pantry.update(item.id, { quantity: 0 }))} />
                <Button title="Remove" variant="tertiary" style={{ flex: 1 }} onPress={() => setConfirmDelete(true)} testID="pantry-editor-remove" />
              </View>
            ) : null}
          </>
        )
      }
    >
      {blocked ? (
        <Alert tone="warning" title={`The Free plan includes up to ${PLAN_LIMITS[plan].pantryItems} Pantry items`} detail="Remove items you no longer keep to add new ones." />
      ) : confirmDelete && item ? (
        <Alert tone="error" title={`Remove ${item.name} from your Pantry?`} detail="This cannot be undone." />
      ) : (
        <>
          {errors.form ? <Alert tone="error" title="Could not save" detail={errors.form} /> : null}
          <TextField label="Item" value={name} onChangeText={setName} maxLength={MAX_ITEM_NAME_LENGTH} error={errors.name} autoFocus={creating} testID="pantry-editor-name" />
          <TextField label="Quantity you have" value={qty} onChangeText={setQty} keyboardType="decimal-pad" error={errors.qty} testID="pantry-editor-qty" />
          <ChoiceChips label="Unit" options={UNIT_OPTIONS} value={unit} onChange={setUnit} />
          <TextField label="Running low at" value={minQty} onChangeText={setMinQty} keyboardType="decimal-pad" error={errors.min} hint="Shown as Running Low when the quantity reaches this amount. 0 turns it off." />
          <ChoiceChips label="Date on pack" options={DATE_MODES} value={dateMode} onChange={setDateMode} />
          {dateMode !== 'none' ? (
            <>
              <AppText variant="caption" tone="muted">
                {dateMode === 'use_by' ? 'Use-by dates are about safety: do not eat food after this date.' : 'Best-before dates are about quality: food may still be fine after this date.'}
              </AppText>
              <ChoiceChips label="Quick dates" options={QUICK_DATES} value={null} onChange={(v) => setDate(formatUkDate(daysFromNow(Number(v))))} />
              <TextField label="Date (DD/MM/YYYY)" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" placeholder="31/10/2026" error={errors.date} testID="pantry-editor-date" />
            </>
          ) : null}
          <ChoiceChips label="Category" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
        </>
      )}
    </Sheet>
  );
}
