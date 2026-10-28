/**
 * List management sheets (Figma clarification C6 — "design needed"; built from approved
 * components): create, rename / archive / delete, and the list-item editor.
 */
import { useState } from 'react';
import { View } from 'react-native';

import { CATEGORY_LABELS, ITEM_CATEGORIES, MAX_ITEM_NAME_LENGTH, MAX_LIST_NAME_LENGTH, formatPence, parsePriceToPence, validateItemName, validateListName, type ItemCategory } from '@/shared/domain/items';
import { UNITS, type CanonicalUnit } from '@/shared/domain/units';
import { PLAN_LIMITS } from '@/shared/entitlements/plans';
import type { ListItem, ShoppingList } from '@/src/data/types';
import { errorMessage, useLists, usePlan } from '@/src/state/hooks';
import { Alert, Button, ChoiceChips, Sheet, TextField } from '@/src/ui';
import { parseQuantity } from '../forms';

export const UNIT_OPTIONS = (Object.keys(UNITS) as CanonicalUnit[]).map((u) => ({ value: u, label: UNITS[u].plural === UNITS[u].label ? UNITS[u].label : UNITS[u].plural }));
export const CATEGORY_OPTIONS = ITEM_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }));

type CreateProps = { onClose: () => void; onCreated: (id: string) => void; onSeePlans: () => void };

/** Render only while open (state starts fresh on every open). */
export function CreateListSheet({ onClose, onCreated, onSeePlans }: CreateProps) {
  const lists = useLists();
  const { plan } = usePlan();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const v = validateListName(name);
    if (v) return setError(v);
    setBusy(true);
    try {
      const id = await lists.create(name);
      onClose();
      onCreated(id);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible title="New list" onClose={onClose} testID="create-list-sheet" footer={lists.canCreate ? <Button title="Create list" onPress={submit} loading={busy} testID="create-list-submit" /> : <Button title="See plans" variant="secondary" onPress={onSeePlans} />}>
      {lists.canCreate ? (
        <TextField label="List name" value={name} onChangeText={setName} placeholder="e.g. Weekly shop" maxLength={MAX_LIST_NAME_LENGTH} autoFocus error={error} returnKeyType="done" onSubmitEditing={submit} testID="create-list-name" />
      ) : (
        <Alert tone="warning" title={`The Free plan includes ${PLAN_LIMITS[plan].activeLists} active lists`} detail="Archive or delete a list to create another one. Archived lists are kept and can be restored." />
      )}
    </Sheet>
  );
}

type ActionsProps = { list: ShoppingList; onClose: () => void; onDeleted?: () => void; checkedCount?: number; onRemoveChecked?: () => Promise<void> };

/** Render only while open, keyed by list ID. */
export function ListActionsSheet({ list, onClose, onDeleted, checkedCount = 0, onRemoveChecked }: ActionsProps) {
  const lists = useLists();
  const [name, setName] = useState(list.name);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<unknown>, close = true) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
      if (close) onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const rename = () => {
    const v = validateListName(name);
    if (v) return setError(v);
    return run('rename', () => lists.rename(list.id, name));
  };

  return (
    <Sheet visible title={list.name} onClose={onClose} testID="list-actions-sheet">
      {confirmDelete ? (
        <View style={{ gap: 12 }}>
          <Alert tone="error" title={`Delete “${list.name}”?`} detail={`This deletes the list and its ${list.itemCount} items. It cannot be undone.`} />
          <Button title="Delete list" variant="destructive" loading={busy === 'delete'} onPress={() => run('delete', async () => { await lists.remove(list); onDeleted?.(); })} testID="confirm-delete-list" />
          <Button title="Keep list" variant="tertiary" onPress={() => setConfirmDelete(false)} />
        </View>
      ) : (
        <>
          <TextField label="List name" value={name} onChangeText={setName} maxLength={MAX_LIST_NAME_LENGTH} error={error} testID="rename-list-name" />
          <Button title="Save name" variant="secondary" onPress={rename} loading={busy === 'rename'} disabled={name.trim() === list.name} />
          {onRemoveChecked && checkedCount > 0 ? (
            <Button title={`Remove ${checkedCount} ticked ${checkedCount === 1 ? 'item' : 'items'}`} variant="secondary" loading={busy === 'clear'} onPress={() => run('clear', onRemoveChecked)} />
          ) : null}
          <Button
            title={list.archived ? 'Restore list' : 'Archive list'}
            variant="secondary"
            loading={busy === 'archive'}
            onPress={() => run('archive', () => (list.archived ? lists.unarchive(list) : lists.archive(list)))}
            accessibilityHint={list.archived ? undefined : 'Archived lists do not count towards the Free plan limit'}
          />
          <Button title="Delete list" variant="tertiary" onPress={() => setConfirmDelete(true)} testID="delete-list" />
        </>
      )}
    </Sheet>
  );
}

type ItemEditorProps = {
  item: ListItem;
  onClose: () => void;
  onSave: (patch: { name: string; quantity: number; unit: CanonicalUnit; category: ItemCategory; pricePence: number | null; notes: string }) => Promise<void>;
  onDelete: () => Promise<void>;
};

/** Render only while open, keyed by item ID. */
export function ListItemEditor({ item, onClose, onSave, onDelete }: ItemEditorProps) {
  const [name, setName] = useState(item.name);
  const [qty, setQty] = useState(String(item.quantity));
  const [unit, setUnit] = useState<CanonicalUnit>(item.unit);
  const [category, setCategory] = useState<ItemCategory>(item.category);
  const [price, setPrice] = useState(item.pricePence != null ? formatPence(item.pricePence).slice(1) : '');
  const [notes, setNotes] = useState(item.notes);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const save = async () => {
    const e: Record<string, string | null> = {
      name: validateItemName(name),
      qty: parseQuantity(qty) == null ? 'Enter a quantity greater than 0.' : null,
      price: price.trim() && parsePriceToPence(price) == null ? 'Enter a price like 1.25' : null,
    };
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    setBusy('save');
    try {
      await onSave({ name, quantity: parseQuantity(qty)!, unit, category, pricePence: price.trim() ? parsePriceToPence(price) : null, notes: notes.trim() });
      onClose();
    } catch (err) {
      setErrors({ form: errorMessage(err) });
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy('delete');
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setErrors({ form: errorMessage(err) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Sheet
      visible
      title="Edit item"
      onClose={onClose}
      testID="item-editor"
      footer={
        <>
          <Button title="Save" onPress={save} loading={busy === 'save'} testID="item-editor-save" />
          <Button title="Remove from list" variant="tertiary" onPress={remove} loading={busy === 'delete'} testID="item-editor-remove" />
        </>
      }
    >
      {errors.form ? <Alert tone="error" title="Could not save" detail={errors.form} /> : null}
      <TextField label="Item" value={name} onChangeText={setName} maxLength={MAX_ITEM_NAME_LENGTH} error={errors.name} />
      <TextField label="Quantity" value={qty} onChangeText={setQty} keyboardType="decimal-pad" error={errors.qty} testID="item-editor-qty" />
      <ChoiceChips label="Unit" options={UNIT_OPTIONS} value={unit} onChange={setUnit} />
      <ChoiceChips label="Category" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
      <TextField
        label="Your expected price (optional)"
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
        placeholder="e.g. 1.25"
        error={errors.price}
        hint="For the whole line, in pounds. Only you enter prices — IntelliShop does not look them up."
        testID="item-editor-price"
      />
      <TextField label="Notes (optional)" value={notes} onChangeText={setNotes} maxLength={200} multiline />
    </Sheet>
  );
}
