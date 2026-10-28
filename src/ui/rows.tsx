/**
 * Row components from Figma page 13:
 * - ListItemRow — IntelliShop/V2/List Item (100:167): Default | Checked | Quantity | Disabled | Badge
 * - PantryItemRow — IntelliShop/V2/Pantry Item (102:257): RunningLow | UseSoon | RecentlyAdded | Full | Out
 * - ShoppingModeItem — IntelliShop/V2/Shopping Mode Item (102:29): Pending | Collected | Exception
 * - SignalRow — P01 "Today's Signals" (56 pt card with 8 pt dot + text)
 * - SettingsRow — Profile/Settings rows (C2, design needed) built from List Item geometry
 */
import type { ReactNode } from 'react';
import { Pressable, Switch, View, type StyleProp, type ViewStyle } from 'react-native';

import { borderWidth, colors, radius, spacing, touch } from '@/src/theme';
import { AppText } from './AppText';
import { Badge, type BadgeTone } from './Badge';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { Dot } from './icons';

type ListItemRowProps = {
  name: string;
  meta?: string;
  checked: boolean;
  disabled?: boolean;
  badge?: { label: string; tone: BadgeTone };
  onToggle?: () => void;
  onPress?: () => void;
  testID?: string;
  /** Spoken in place of `meta` (e.g. "2 litres" instead of "2 l"). */
  accessibilityMeta?: string;
};

export function ListItemRow({ name, meta, checked, disabled, badge, onToggle, onPress, testID, accessibilityMeta }: ListItemRowProps) {
  const spokenMeta = accessibilityMeta ?? meta;
  return (
    <View
      testID={testID}
      style={{
        minHeight: touch.shoppingRow,
        backgroundColor: colors.surface.card,
        borderBottomWidth: borderWidth.default,
        borderBottomColor: colors.border.default,
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: spacing[16],
      }}
    >
      <Pressable
        onPress={disabled ? undefined : onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled: !!disabled }}
        accessibilityLabel={`${name}${spokenMeta ? `, ${spokenMeta}` : ''}`}
        style={{ width: touch.min + spacing[8], minHeight: touch.shoppingRow, alignItems: 'center', justifyContent: 'center', paddingLeft: spacing[4] }}
      >
        <Checkbox checked={checked} />
      </Pressable>
      <Pressable
        onPress={disabled ? undefined : onPress}
        disabled={!onPress || disabled}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${name}`}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing[8], minHeight: touch.shoppingRow, paddingVertical: spacing[8] }}
      >
        <View style={{ flex: 1, gap: 1 }}>
          <AppText variant="bodySmall" tone={disabled ? 'muted' : 'primary'} numberOfLines={2}>
            {name}
          </AppText>
          {checked ? (
            <AppText variant="caption" tone="success">
              Done
            </AppText>
          ) : meta ? (
            <AppText variant="caption" tone="muted">
              {meta}
            </AppText>
          ) : null}
        </View>
        {badge ? <Badge label={badge.label} tone={badge.tone} /> : null}
      </Pressable>
    </View>
  );
}

type PantryItemRowProps = { name: string; meta: string; badge?: { label: string; tone: BadgeTone }; onPress?: () => void; testID?: string };

export function PantryItemRow({ name, meta, badge, onPress, testID }: PantryItemRowProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${meta}${badge ? `, ${badge.label}` : ''}`}
      accessibilityHint={onPress ? 'Opens the item to edit quantity or dates' : undefined}
      style={({ pressed }) => ({
        minHeight: 76,
        backgroundColor: pressed ? colors.content.subtle : colors.surface.card,
        borderWidth: borderWidth.default,
        borderColor: colors.border.default,
        borderRadius: radius.md,
        paddingVertical: spacing[12],
        paddingHorizontal: spacing[16],
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[8],
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodySmall" numberOfLines={2}>
          {name}
        </AppText>
        <AppText variant="caption" tone="muted">
          {meta}
        </AppText>
      </View>
      {badge ? <Badge label={badge.label} tone={badge.tone} /> : null}
    </Pressable>
  );
}

export type ShoppingItemState = 'pending' | 'collected' | 'substituted' | 'unavailable';

type ShoppingModeItemProps = {
  name: string;
  meta: string;
  state: ShoppingItemState;
  substituteName?: string;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  onSubstitute: () => void;
  onUnavailable: () => void;
  onQuantity: () => void;
  testID?: string;
};

const SHOP_BADGE: Record<Exclude<ShoppingItemState, 'pending'>, { label: string; tone: BadgeTone }> = {
  collected: { label: 'Collected', tone: 'success' },
  substituted: { label: 'Substituted', tone: 'info' },
  unavailable: { label: 'Unavailable', tone: 'warning' },
};

export function ShoppingModeItem(props: ShoppingModeItemProps) {
  const { name, meta, state, substituteName, expanded, onToggle, onExpand, onSubstitute, onUnavailable, onQuantity, testID } = props;
  const done = state !== 'pending';
  const badge = done ? SHOP_BADGE[state] : null;
  const caption = state === 'substituted' && substituteName ? `Bought ${substituteName} instead` : meta;
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: colors.surface.card,
        borderWidth: borderWidth.default,
        borderColor: colors.border.default,
        borderRadius: radius.md,
        paddingVertical: 10,
        paddingHorizontal: expanded ? spacing[12] : spacing[16],
        gap: spacing[8],
      }}
    >
      <Pressable
        onPress={onToggle}
        onLongPress={onExpand}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done, expanded }}
        accessibilityLabel={`${name}, ${caption}${badge ? `, ${badge.label}` : ''}`}
        accessibilityHint="Double-tap to mark as collected. Use the actions menu for substitutes, unavailable items or quantity."
        accessibilityActions={[{ name: 'longpress', label: 'Show options' }]}
        onAccessibilityAction={(e) => e.nativeEvent.actionName === 'longpress' && onExpand()}
        style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing[8] }}
      >
        <Checkbox checked={state === 'collected' || state === 'substituted'} size={24} tone="success" />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="bodySmall" tone={done ? 'muted' : 'primary'}>
            {name}
          </AppText>
          <AppText variant="caption" tone={expanded && !done ? 'warning' : 'muted'}>
            {expanded && !done ? 'Choose an action' : caption}
          </AppText>
        </View>
        {badge ? <Badge label={badge.label} tone={badge.tone} /> : null}
      </Pressable>
      {expanded ? (
        <View style={{ flexDirection: 'row', gap: spacing[4] }}>
          <Button title="Substitute" variant="secondary" compact onPress={onSubstitute} style={{ flex: 1, paddingHorizontal: 8 }} accessibilityLabel={`Substitute ${name}`} />
          <Button title="Unavailable" variant="tertiary" compact onPress={onUnavailable} style={{ flex: 1, paddingHorizontal: 8 }} accessibilityLabel={`Mark ${name} unavailable`} />
          <Button title="Qty" variant="tertiary" compact onPress={onQuantity} style={{ flex: 1, paddingHorizontal: 8 }} accessibilityLabel={`Change quantity of ${name}`} />
        </View>
      ) : null}
    </View>
  );
}

export function SignalRow({ text, tone, onPress, testID }: { text: string; tone: 'warning' | 'intelligence' | 'error'; onPress?: () => void; testID?: string }) {
  const color = tone === 'warning' ? colors.status.warning : tone === 'error' ? colors.status.error : colors.intelligence.base;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={text}
      style={({ pressed }) => ({
        minHeight: touch.shoppingRow,
        backgroundColor: pressed ? colors.content.subtle : colors.surface.card,
        borderWidth: borderWidth.default,
        borderColor: colors.border.default,
        borderRadius: radius.lg,
        paddingHorizontal: spacing[16],
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[12],
      })}
    >
      <Dot color={color} />
      <AppText variant="bodySmall" style={{ flex: 1 }}>
        {text}
      </AppText>
    </Pressable>
  );
}

type SettingsRowProps = {
  title: string;
  detail?: string;
  onPress?: () => void;
  value?: boolean;
  onValueChange?: (v: boolean) => void;
  trailing?: ReactNode;
  destructive?: boolean;
  testID?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function SettingsRow({ title, detail, onPress, value, onValueChange, trailing, destructive, testID, disabled, style, accessibilityHint }: SettingsRowProps) {
  const isSwitch = typeof value === 'boolean' && onValueChange;
  const content = (
    <>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodySmall" tone={destructive ? 'error' : disabled ? 'muted' : 'primary'}>
          {title}
        </AppText>
        {detail ? (
          <AppText variant="caption" tone="muted">
            {detail}
          </AppText>
        ) : null}
      </View>
      {isSwitch ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          accessibilityLabel={title}
          accessibilityHint={accessibilityHint}
          trackColor={{ true: colors.action.primary, false: colors.border.default }}
        />
      ) : (
        trailing
      )}
    </>
  );
  const rowStyle: ViewStyle = {
    minHeight: touch.shoppingRow,
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    backgroundColor: colors.surface.card,
    borderBottomWidth: borderWidth.default,
    borderBottomColor: colors.border.default,
  };
  if (onPress && !isSwitch) {
    return (
      <Pressable
        testID={testID}
        onPress={disabled ? undefined : onPress}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        accessibilityLabel={detail ? `${title}, ${detail}` : title}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [rowStyle, pressed && { backgroundColor: colors.content.subtle }, style]}
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View testID={testID} style={[rowStyle, style]}>
      {content}
    </View>
  );
}

/** White grouped container with 1 px border and radius 12 for SettingsRow / ListItemRow groups. */
export function RowGroup({ children, testID }: { children: ReactNode; testID?: string }) {
  return (
    <View testID={testID} style={{ borderWidth: borderWidth.default, borderColor: colors.border.default, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface.card, marginBottom: -1 }}>
      {children}
    </View>
  );
}
