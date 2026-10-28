/**
 * IntelliShop/V2/Button (Figma 100:56): Primary | Secondary | Tertiary | Destructive ×
 * Default | Pressed | Focused | Disabled | Loading. Height 48 (compact 44 — Shopping Mode
 * exception actions), radius 8, horizontal padding 16, Button text style.
 */
import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { borderWidth, colors, radius, spacing, touch } from '@/src/theme';
import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';

type Palette = { bg: string; pressedBg: string; text: string; border?: string };

const PALETTE: Record<ButtonVariant, Palette> = {
  primary: { bg: colors.action.primary, pressedBg: colors.action.pressed, text: colors.surface.card },
  secondary: { bg: colors.surface.card, pressedBg: colors.action.subtle, text: colors.action.primary, border: colors.action.primary },
  tertiary: { bg: 'transparent', pressedBg: colors.action.subtle, text: colors.action.primary },
  destructive: { bg: colors.status.error, pressedBg: colors.status.errorPressed, text: colors.surface.card },
};

export type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  compact?: boolean;
  disabled?: boolean;
  loading?: boolean;
  /** Shown instead of the title while loading (Figma: "Loading…"). */
  loadingTitle?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  align?: 'center' | 'start';
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  compact = false,
  disabled = false,
  loading = false,
  loadingTitle = 'Loading…',
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
  align = 'center',
}: ButtonProps) {
  const p = PALETTE[variant];
  const inactive = disabled || loading;
  const disabledLook = disabled && !loading;
  const textColor = disabledLook ? colors.content.muted : p.text;

  return (
    <Pressable
      testID={testID}
      onPress={inactive ? undefined : onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      hitSlop={compact ? 0 : undefined}
      style={({ pressed }) => [
        {
          minHeight: compact ? touch.min : 48,
          borderRadius: radius.md,
          paddingHorizontal: spacing[16],
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: align === 'center' ? 'center' : 'flex-start',
          gap: spacing[8],
          backgroundColor: disabledLook && variant !== 'tertiary' ? colors.border.default : pressed && !inactive ? p.pressedBg : p.bg,
          borderWidth: p.border && !disabledLook ? borderWidth.default : 0,
          borderColor: p.border,
        },
        style,
      ]}
    >
      {loading ? (
        <View accessible={false}>
          <ActivityIndicator size="small" color={textColor} />
        </View>
      ) : null}
      <AppText variant="button" style={{ color: textColor, textAlign: 'center' }}>
        {loading ? loadingTitle : title}
      </AppText>
    </Pressable>
  );
}
