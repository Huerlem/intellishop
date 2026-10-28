/**
 * Visual checkbox used inside List Item (22 px, radius 6, primary when checked — Figma 100:150)
 * and Shopping Mode Item (24 px, radius 7, success when collected — Figma 102:15).
 * The surrounding row is the accessible control (role "checkbox").
 */
import { View } from 'react-native';

import { borderWidth, colors } from '@/src/theme';
import { Tick } from './icons';

export function Checkbox({ checked, size = 22, tone = 'primary' }: { checked: boolean; size?: 22 | 24; tone?: 'primary' | 'success' }) {
  const fill = tone === 'success' ? colors.status.success : colors.action.primary;
  return (
    <View
      accessible={false}
      style={{
        width: size,
        height: size,
        borderRadius: size === 24 ? 7 : 6,
        borderWidth: borderWidth.default,
        borderColor: checked ? fill : colors.border.default,
        backgroundColor: checked ? fill : colors.surface.card,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked ? <Tick size={size - 2} /> : null}
    </View>
  );
}
