/**
 * IntelliShop/V2/Badge (Figma 100:186): Success | Warning | Neutral | Info | Rationale (+ Error,
 * used by Pantry Item "Out" 102:251). Pill, 1 px #CBD5E1 border, padding 5/9, Caption text.
 * Badges always carry text, so status is never conveyed by colour alone.
 */
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { borderWidth, colors, radius } from '@/src/theme';
import { AppText } from './AppText';

export type BadgeTone = 'success' | 'warning' | 'neutral' | 'info' | 'rationale' | 'error';

const TONES: Record<BadgeTone, { bg: string; text: string }> = {
  success: { bg: colors.status.successSubtle, text: colors.status.success },
  warning: { bg: colors.status.warningSubtle, text: colors.status.warning },
  neutral: { bg: colors.content.subtle, text: colors.content.secondary },
  info: { bg: colors.status.informationSubtle, text: colors.status.information },
  rationale: { bg: colors.intelligence.subtle, text: colors.intelligence.base },
  error: { bg: colors.status.errorSubtle, text: colors.status.error },
};

export function Badge({ label, tone = 'neutral', style, testID }: { label: string; tone?: BadgeTone; style?: StyleProp<ViewStyle>; testID?: string }) {
  const t = TONES[tone];
  return (
    <View
      testID={testID}
      style={[
        {
          alignSelf: 'flex-start',
          backgroundColor: t.bg,
          borderWidth: borderWidth.default,
          borderColor: colors.border.default,
          borderRadius: radius.full,
          paddingVertical: 5,
          paddingHorizontal: 9,
        },
        style,
      ]}
    >
      <AppText variant="caption" style={{ color: t.text }} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}
