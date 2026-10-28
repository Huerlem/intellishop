/**
 * IntelliShop/V2/Progress (Figma 100:236): InProgress 100:228 | Complete 100:232.
 * Caption label (success colour when complete) above an 8 px track, radius 999.
 */
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/src/theme';
import { AppText } from './AppText';

type Props = { done: number; total: number; label: string; style?: StyleProp<ViewStyle>; testID?: string };

export function ProgressBar({ done, total, label, style, testID }: Props) {
  const ratio = total > 0 ? Math.min(1, Math.max(0, done / total)) : 0;
  const complete = total > 0 && done >= total;
  const fill = complete ? colors.status.success : colors.action.primary;
  return (
    <View
      testID={testID}
      style={[{ gap: spacing[8] }, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: Math.max(total, 1), now: Math.min(done, Math.max(total, 1)), text: label }}
    >
      <AppText variant="caption" tone={complete ? 'success' : 'secondary'}>
        {label}
      </AppText>
      <View style={{ height: 8, borderRadius: radius.full, backgroundColor: colors.border.default, overflow: 'hidden' }}>
        <View style={{ width: `${ratio * 100}%`, height: 8, borderRadius: radius.full, backgroundColor: fill }} />
      </View>
    </View>
  );
}
