import { Text, type TextProps } from 'react-native';

import { colors, typography, type TextStyleName } from '@/src/theme';

export type TextTone =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'action'
  | 'intelligence'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'inverse';

export const TONE_COLOR: Record<TextTone, string> = {
  primary: colors.content.primary,
  secondary: colors.content.secondary,
  muted: colors.content.muted,
  action: colors.action.primary,
  intelligence: colors.intelligence.base,
  success: colors.status.success,
  warning: colors.status.warning,
  error: colors.status.error,
  info: colors.status.information,
  inverse: colors.surface.card,
};

export type AppTextProps = TextProps & { variant?: TextStyleName; tone?: TextTone };

/**
 * Text in a V2 text style. Font scaling (Dynamic Type) stays enabled; headings are capped at
 * 2× so layouts remain usable at the largest accessibility sizes.
 */
export function AppText({ variant = 'body', tone = 'primary', style, maxFontSizeMultiplier, ...rest }: AppTextProps) {
  const heading = variant === 'display' || variant === 'h1' || variant === 'h2';
  return (
    <Text
      {...rest}
      accessibilityRole={rest.accessibilityRole ?? (heading || variant === 'h3' ? 'header' : undefined)}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? (heading ? 2 : undefined)}
      style={[typography[variant], { color: TONE_COLOR[tone] }, style]}
    />
  );
}
