/**
 * IntelliShop V2 icons, drawn with views (the app does not bundle an SVG renderer).
 *
 * Geometry source: Figma exports in assets/figma/ (see assets/figma/README.md).
 * Three Figma glyphs export with disconnected strokes (Home roof, Back arrow, checkbox tick);
 * here they are drawn as the evident intent (closed roof, converging arrow, tick). This is
 * recorded as design clarification D-ICON-1 in docs/FIGMA_IMPLEMENTATION_MATRIX.md.
 *
 * Icons are decorative: the control that contains them carries the accessible label.
 */
import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { colors } from '@/src/theme';

type LineProps = { x1: number; y1: number; x2: number; y2: number; t: number; color: string; round?: boolean };

/** A straight stroke between two points (thickness t). */
export function Line({ x1, y1, x2, y2, t, color, round = true }: LineProps) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  return (
    <View
      style={{
        position: 'absolute',
        left: cx - len / 2,
        top: cy - t / 2,
        width: len,
        height: t,
        borderRadius: round ? t / 2 : 0,
        backgroundColor: color,
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

function Box({ x, y, w, h, r, color, stroke }: { x: number; y: number; w: number; h: number; r: number; color: string; stroke?: number }) {
  const style: ViewStyle = { position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: r };
  return <View style={stroke ? { ...style, borderWidth: stroke, borderColor: color } : { ...style, backgroundColor: color }} />;
}

function Frame({ size = 20, children, testID }: { size?: number; children: ReactNode; testID?: string }) {
  return (
    <View testID={testID} style={{ width: size, height: size }} accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none">
      {children}
    </View>
  );
}

type IconProps = { color?: string; testID?: string };

/** Bottom Nav › Home (Figma 100:100). Outline body 10.5 × 7.5 at (4.75, 9.75), 1.5 stroke; roof. */
export function HomeIcon({ color = colors.content.muted, testID }: IconProps) {
  return (
    <Frame testID={testID}>
      <Box x={4} y={9} w={12} h={9} r={2} color={color} stroke={1.5} />
      <Line x1={3} y1={9.2} x2={10} y2={2.6} t={1.5} color={color} />
      <Line x1={10} y1={2.6} x2={17} y2={9.2} t={1.5} color={color} />
    </Frame>
  );
}

/** Bottom Nav › Lists (Figma 100:104). */
export function ListsIcon({ color = colors.content.muted, testID }: IconProps) {
  return (
    <Frame testID={testID}>
      {[3, 9, 15].map((y) => (
        <View key={y}>
          <Box x={2} y={y} w={3} h={3} r={1} color={color} />
          <Box x={7} y={y + 1} w={11} h={1.5} r={0.75} color={color} />
        </View>
      ))}
    </Frame>
  );
}

/** Bottom Nav › Pantry (Figma 100:108). */
export function PantryIcon({ color = colors.content.muted, testID }: IconProps) {
  return (
    <Frame testID={testID}>
      <Box x={3} y={2} w={14} h={15} r={2} color={color} stroke={1.5} />
      <Box x={5} y={8} w={10} h={1.5} r={0.75} color={color} />
      <Box x={9.25} y={10} w={1.5} h={4} r={0.75} color={color} />
    </Frame>
  );
}

/** Search input icon (Figma P03/P10). */
export function SearchIcon({ color = colors.content.secondary, testID }: IconProps) {
  return (
    <Frame testID={testID}>
      <Box x={2} y={2} w={11} h={11} r={5.5} color={color} stroke={1.5} />
      <Line x1={11.5} y1={12.5} x2={16.5} y2={17.5} t={1.5} color={color} />
    </Frame>
  );
}

/** Back arrow inside a 44 × 44 touch target (Figma 136:73). */
export function BackIcon({ color = colors.content.primary }: IconProps) {
  return (
    <Frame size={44}>
      <Line x1={14} y1={22} x2={21} y2={15} t={1.8} color={color} />
      <Line x1={14} y1={22} x2={21} y2={29} t={1.8} color={color} />
      <Line x1={14.5} y1={22} x2={30} y2={22} t={1.8} color={color} />
    </Frame>
  );
}

/** Tick used inside checkboxes (white on filled box). `size` is the box size (22 or 24). */
export function Tick({ size = 22, color = colors.surface.card }: IconProps & { size?: number }) {
  const s = size / 22;
  return (
    <Frame size={size}>
      <Line x1={5.5 * s} y1={11.5 * s} x2={9 * s} y2={15 * s} t={2} color={color} />
      <Line x1={9 * s} y1={15 * s} x2={16.5 * s} y2={7.5 * s} t={2} color={color} />
    </Frame>
  );
}

/** 8 px status dot (Figma Today's Signals). Always paired with text — never colour alone. */
export function Dot({ color, size = 8 }: { color: string; size?: number }) {
  return <View accessible={false} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}

/** Alert icon slot: 14 px ring, 2 px stroke, centred in 20 × 20 (Figma Alert 100:195…213). */
export function RingIcon({ color }: { color: string }) {
  return (
    <Frame>
      <Box x={3} y={3} w={14} h={14} r={7} color={color} stroke={2} />
    </Frame>
  );
}

/** Info Card WithIcon: 20 px filled circle (Figma 102:159). */
export function InfoDot({ color = colors.status.information }: { color?: string }) {
  return (
    <Frame>
      <Box x={0} y={0} w={20} h={20} r={10} color={color} />
    </Frame>
  );
}

/** Plus sign for "+ Add" actions drawn in text by Figma; provided for icon-only buttons. */
export function PlusIcon({ color = colors.action.primary }: IconProps) {
  return (
    <Frame>
      <Box x={9.25} y={4} w={1.5} h={12} r={0.75} color={color} />
      <Box x={4} y={9.25} w={12} h={1.5} r={0.75} color={color} />
    </Frame>
  );
}

export function MinusIcon({ color = colors.action.primary }: IconProps) {
  return (
    <Frame>
      <Box x={4} y={9.25} w={12} h={1.5} r={0.75} color={color} />
    </Frame>
  );
}
