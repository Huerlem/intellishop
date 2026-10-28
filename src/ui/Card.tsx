/**
 * Cards.
 * - Card: screen-level card from P01/P02 (white, 1 px border, radius 12, optional 4 px left
 *   accent bar in primary / intelligence / warning).
 * - InfoCard: IntelliShop/V2/Info Card (Figma 102:155 Default, 102:159 WithIcon): radius 8,
 *   padding 12/16, title Body Small, body Caption muted.
 */
import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { borderWidth, colors, radius, spacing } from '@/src/theme';
import { AppText } from './AppText';
import { InfoDot } from './icons';

export type CardAccent = 'primary' | 'intelligence' | 'warning' | 'success' | 'error';

const ACCENT: Record<CardAccent, string> = {
  primary: colors.action.primary,
  intelligence: colors.intelligence.base,
  warning: colors.status.warning,
  success: colors.status.success,
  error: colors.status.error,
};

type CardProps = {
  children: ReactNode;
  accent?: CardAccent;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  padding?: number;
};

export function Card({ children, accent, onPress, accessibilityLabel, accessibilityHint, testID, style, padding = spacing[16] }: CardProps) {
  const base: ViewStyle = {
    backgroundColor: colors.surface.card,
    borderWidth: borderWidth.default,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding,
    paddingLeft: accent ? padding + 4 : padding,
    gap: spacing[4],
  };
  const bar = accent ? <View accessible={false} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: ACCENT[accent] }} /> : null;
  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [base, pressed && { backgroundColor: colors.content.subtle }, style]}
      >
        {bar}
        {children}
      </Pressable>
    );
  }
  return (
    <View testID={testID} style={[base, style]} accessibilityLabel={accessibilityLabel}>
      {bar}
      {children}
    </View>
  );
}

type InfoCardProps = { title: string; body?: string; withIcon?: boolean; children?: ReactNode; testID?: string; style?: StyleProp<ViewStyle> };

export function InfoCard({ title, body, withIcon = false, children, testID, style }: InfoCardProps) {
  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: colors.surface.card,
          borderWidth: borderWidth.default,
          borderColor: colors.border.default,
          borderRadius: radius.md,
          paddingVertical: spacing[12],
          paddingHorizontal: spacing[16],
          flexDirection: 'row',
          gap: spacing[8],
        },
        style,
      ]}
    >
      {withIcon ? <InfoDot /> : null}
      <View style={{ flex: 1, gap: 3 }}>
        <AppText variant="bodySmall">{title}</AppText>
        {body ? (
          <AppText variant="caption" tone="muted">
            {body}
          </AppText>
        ) : null}
        {children ? <View style={{ marginTop: spacing[8], gap: spacing[8] }}>{children}</View> : null}
      </View>
    </View>
  );
}
