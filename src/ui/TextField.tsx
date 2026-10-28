/**
 * IntelliShop/V2/Input (Figma 100:89): Default 100:65 | Focused 100:67 | Error 100:69 |
 * Disabled 100:71. Height 48, radius 8, padding 16, Body text, placeholder content/secondary;
 * focus 2 px primary border; error 2 px error border + Caption message below.
 */
import { forwardRef, useState, type ReactNode } from 'react';
import { TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { borderWidth, colors, radius, spacing, typography } from '@/src/theme';
import { AppText } from './AppText';
import { SearchIcon } from './icons';

export type TextFieldProps = Omit<TextInputProps, 'style' | 'editable'> & {
  label?: string;
  error?: string | null;
  hint?: string;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  leading?: ReactNode;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, disabled = false, containerStyle, leading, onFocus, onBlur, accessibilityLabel, ...input },
  ref
) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.status.error : focused ? colors.action.primary : colors.border.default;
  const width = error || focused ? borderWidth.focus : borderWidth.default;
  return (
    <View style={[{ gap: spacing[4] }, containerStyle]}>
      {label ? (
        <AppText variant="label" nativeID={input.nativeID ? `${input.nativeID}-label` : undefined}>
          {label}
        </AppText>
      ) : null}
      <View
        style={{
          minHeight: 48,
          borderRadius: radius.md,
          borderWidth: width,
          borderColor,
          backgroundColor: disabled ? colors.surface.canvas : colors.surface.card,
          paddingHorizontal: spacing[16] - (width - 1),
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {leading}
        <TextInput
          ref={ref}
          {...input}
          editable={!disabled}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={error ? `Error: ${error}` : hint}
          accessibilityState={{ disabled }}
          placeholderTextColor={colors.content.secondary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[typography.body, { flex: 1, paddingVertical: 12, color: disabled ? colors.content.muted : colors.content.primary }]}
        />
      </View>
      {error ? (
        <AppText variant="caption" tone="error" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});

/** Search input with the Figma search icon (P03 "Search items", P10 "Search pantry items"). */
export function SearchField(props: Omit<TextFieldProps, 'leading' | 'label'> & { accessibilityLabel: string }) {
  return <TextField {...props} leading={<SearchIcon />} returnKeyType="search" autoCorrect={false} clearButtonMode="while-editing" />;
}
