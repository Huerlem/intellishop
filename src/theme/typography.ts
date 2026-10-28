import type { TextStyle } from 'react-native';

/**
 * IntelliShop V2 text styles — Figma page "12 — Final Tokens V2", text styles
 * "IntelliShop/V2/Type/*" (10 styles, Inter, letter spacing 0), read on 2026-10-27.
 *
 * Font family names refer to the faces loaded from @expo-google-fonts/inter in app/_layout.tsx.
 * Dynamic Type: these are base sizes. Text components must not set allowFontScaling={false};
 * use maxFontSizeMultiplier only where a layout would otherwise break.
 */

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export type TextStyleName =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodySmall'
  | 'label'
  | 'caption'
  | 'button'
  | 'dataLarge';

export const typography: Record<TextStyleName, TextStyle> = {
  display: { fontFamily: fontFamily.bold, fontSize: 32, lineHeight: 40, letterSpacing: 0 },
  h1: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 34, letterSpacing: 0 },
  h2: { fontFamily: fontFamily.bold, fontSize: 22, lineHeight: 28, letterSpacing: 0 },
  h3: { fontFamily: fontFamily.semiBold, fontSize: 18, lineHeight: 24, letterSpacing: 0 },
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  bodySmall: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  label: { fontFamily: fontFamily.semiBold, fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  caption: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0 },
  button: { fontFamily: fontFamily.semiBold, fontSize: 15, lineHeight: 20, letterSpacing: 0 },
  dataLarge: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 30, letterSpacing: 0 },
};
