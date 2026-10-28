/**
 * Small form controls for editors (C6/C7/C8 — "design needed" in the Figma handoff), built from
 * approved tokens: Avatar (Figma 100:250), quantity stepper, single-choice chips, checkbox field.
 */
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { borderWidth, colors, radius, spacing, touch } from '@/src/theme';
import { AppText } from './AppText';
import { Checkbox } from './Checkbox';
import { MinusIcon, PlusIcon } from './icons';

/** IntelliShop/V2/Avatar: 44 pt circle, #CBD5E1, initial Semi Bold 14. Opens Profile. */
export function Avatar({ initial, onPress, testID = 'avatar-button' }: { initial: string; onPress: () => void; testID?: string }) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Profile and settings"
      style={({ pressed }) => ({
        width: touch.min,
        height: touch.min,
        borderRadius: touch.min / 2,
        backgroundColor: pressed ? colors.content.muted : colors.border.default,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <AppText variant="label" accessible={false}>
        {(initial || '?').slice(0, 1).toUpperCase()}
      </AppText>
    </Pressable>
  );
}

type StepperProps = { value: number; onChange: (n: number) => void; step?: number; min?: number; max?: number; label: string; unitLabel?: string; testID?: string };

export function Stepper({ value, onChange, step = 1, min = 0, max = 100000, label, unitLabel, testID }: StepperProps) {
  const round = (n: number) => Math.round(n * 1000) / 1000;
  const dec = () => onChange(Math.max(min, round(value - step)));
  const inc = () => onChange(Math.min(max, round(value + step)));
  const btn = (kind: 'dec' | 'inc') => (
    <Pressable
      onPress={kind === 'dec' ? dec : inc}
      disabled={kind === 'dec' ? value <= min : value >= max}
      accessibilityRole="button"
      accessibilityLabel={kind === 'dec' ? `Decrease ${label}` : `Increase ${label}`}
      style={({ pressed }) => ({
        width: touch.min,
        height: touch.min,
        borderRadius: radius.md,
        borderWidth: borderWidth.default,
        borderColor: colors.action.primary,
        backgroundColor: pressed ? colors.action.subtle : colors.surface.card,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: (kind === 'dec' ? value <= min : value >= max) ? 0.4 : 1,
      })}
    >
      {kind === 'dec' ? <MinusIcon /> : <PlusIcon />}
    </Pressable>
  );
  return (
    <View testID={testID} style={{ gap: spacing[4] }}>
      <AppText variant="label">{label}</AppText>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[12] }}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: `${value}${unitLabel ? ` ${unitLabel}` : ''}` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => (e.nativeEvent.actionName === 'increment' ? inc() : dec())}
      >
        {btn('dec')}
        <AppText variant="dataLarge" style={{ minWidth: 56, textAlign: 'center' }}>
          {String(value)}
        </AppText>
        {btn('inc')}
        {unitLabel ? (
          <AppText variant="bodySmall" tone="secondary">
            {unitLabel}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

type ChoiceProps<T extends string> = { label: string; options: readonly { value: T; label: string }[]; value: T | null; onChange: (v: T) => void; testID?: string };

/** Single choice as wrapping chips (radio semantics). */
export function ChoiceChips<T extends string>({ label, options, value, onChange, testID }: ChoiceProps<T>) {
  return (
    <View testID={testID} style={{ gap: spacing[8] }} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <AppText variant="label">{label}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8] }}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected, checked: selected }}
              accessibilityLabel={o.label}
              style={({ pressed }) => ({
                minHeight: touch.min,
                maxWidth: '100%',
                paddingHorizontal: spacing[12],
                paddingVertical: spacing[8],
                borderRadius: touch.min / 2,
                borderWidth: selected ? borderWidth.focus : borderWidth.default,
                borderColor: selected ? colors.action.primary : colors.border.default,
                backgroundColor: selected ? colors.action.subtle : pressed ? colors.content.subtle : colors.surface.card,
                justifyContent: 'center',
              })}
            >
              <AppText variant="caption" tone={selected ? 'action' : 'secondary'}>
                {selected ? `✓ ${o.label}` : o.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Multiple choice chips (checkbox semantics), e.g. allergens. */
export function MultiChips<T extends string>({ label, options, values, onChange, testID }: { label: string; options: readonly { value: T; label: string }[]; values: T[]; onChange: (v: T[]) => void; testID?: string }) {
  return (
    <View testID={testID} style={{ gap: spacing[8] }}>
      <AppText variant="label">{label}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8] }}>
        {options.map((o) => {
          const selected = values.includes(o.value);
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(selected ? values.filter((v) => v !== o.value) : [...values, o.value])}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={o.label}
              style={({ pressed }) => ({
                minHeight: touch.min,
                maxWidth: '100%',
                paddingHorizontal: spacing[12],
                paddingVertical: spacing[8],
                borderRadius: touch.min / 2,
                borderWidth: selected ? borderWidth.focus : borderWidth.default,
                borderColor: selected ? colors.action.primary : colors.border.default,
                backgroundColor: selected ? colors.action.subtle : pressed ? colors.content.subtle : colors.surface.card,
                justifyContent: 'center',
              })}
            >
              <AppText variant="caption" tone={selected ? 'action' : 'secondary'}>
                {selected ? `✓ ${o.label}` : o.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** A labelled checkbox control (e.g. Terms acceptance, consent confirmations). */
export function CheckboxField({ checked, onChange, label, children, testID, error }: { checked: boolean; onChange: (v: boolean) => void; label: string; children?: ReactNode; testID?: string; error?: string | null }) {
  return (
    <View style={{ gap: spacing[4] }}>
      <Pressable
        testID={testID}
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
        accessibilityHint={error ? `Error: ${error}` : undefined}
        style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[12], minHeight: touch.min, paddingVertical: spacing[8] }}
      >
        <Checkbox checked={checked} />
        <View style={{ flex: 1 }}>{children ?? <AppText variant="bodySmall">{label}</AppText>}</View>
      </Pressable>
      {error ? (
        <AppText variant="caption" tone="error" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
