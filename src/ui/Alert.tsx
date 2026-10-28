/**
 * IntelliShop/V2/Alert (Figma 100:219): Info 100:195 | Warning 100:201 | Success 100:207 |
 * Error 100:213. Tinted background, 1 px border, radius 8, padding 16, 14 px ring icon,
 * title Body Small, detail Caption secondary. Optional tertiary action (e.g. Retry).
 */
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { borderWidth, colors, radius, spacing } from '@/src/theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { RingIcon } from './icons';

export type AlertTone = 'info' | 'warning' | 'success' | 'error';

const TONES: Record<AlertTone, { bg: string; icon: string; label: string }> = {
  info: { bg: colors.status.informationSubtle, icon: colors.status.information, label: 'Information' },
  warning: { bg: colors.status.warningSubtle, icon: colors.status.warning, label: 'Warning' },
  success: { bg: colors.status.successSubtle, icon: colors.status.success, label: 'Success' },
  error: { bg: colors.status.errorSubtle, icon: colors.status.error, label: 'Error' },
};

type AlertProps = {
  tone?: AlertTone;
  title: string;
  detail?: string;
  actionTitle?: string;
  onAction?: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export function Alert({ tone = 'info', title, detail, actionTitle, onAction, testID, style }: AlertProps) {
  const t = TONES[tone];
  const urgent = tone === 'error' || tone === 'warning';
  return (
    <View
      testID={testID}
      accessibilityRole={urgent ? 'alert' : 'summary'}
      accessibilityLiveRegion={urgent ? 'assertive' : 'polite'}
      style={[
        {
          backgroundColor: t.bg,
          borderWidth: borderWidth.default,
          borderColor: colors.border.default,
          borderRadius: radius.md,
          paddingHorizontal: spacing[16],
          paddingVertical: spacing[12],
          minHeight: 72,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[8],
        },
        style,
      ]}
    >
      <RingIcon color={t.icon} />
      <View style={{ flex: 1, gap: 2 }} accessible accessibilityLabel={`${t.label}. ${title}${detail ? `. ${detail}` : ''}`}>
        <AppText variant="bodySmall">{title}</AppText>
        {detail ? (
          <AppText variant="caption" tone="secondary">
            {detail}
          </AppText>
        ) : null}
      </View>
      {actionTitle && onAction ? <Button title={actionTitle} onPress={onAction} variant="tertiary" compact /> : null}
    </View>
  );
}
