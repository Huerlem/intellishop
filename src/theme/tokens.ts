/**
 * IntelliShop V2 design tokens.
 *
 * Source of truth: Figma file VZj2AU8kOJqYvyjp8AvWQa, page "12 — Final Tokens V2",
 * variable collection "IntelliShop V2 — Foundations" (single mode), read on 2026-10-27.
 * Values are copied exactly; do not edit here without a matching Figma change.
 * See docs/FIGMA_IMPLEMENTATION_MATRIX.md §2.
 */

export const colors = {
  action: {
    primary: '#4338CA',
    pressed: '#3730A3',
    subtle: '#EEF2FF',
  },
  intelligence: {
    base: '#0891B2',
    subtle: '#ECFEFF',
  },
  brand: {
    accent: '#7C3AED',
    subtle: '#F5F3FF',
  },
  content: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#64748B',
    subtle: '#F1F5F9',
  },
  border: {
    default: '#CBD5E1',
  },
  surface: {
    canvas: '#F8FAFC',
    card: '#FFFFFF',
  },
  status: {
    success: '#15803D',
    successSubtle: '#ECFDF5',
    warning: '#B45309',
    warningSubtle: '#FFFBEB',
    error: '#B91C1C',
    errorSubtle: '#FEF2F2',
    errorPressed: '#991B1B',
    information: '#2563EB',
    informationSubtle: '#EFF6FF',
  },
} as const;

/** spacing/4 … spacing/48 */
export const spacing = {
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  48: 48,
} as const;

/** radius/xs, md, lg, full */
export const radius = {
  xs: 4,
  md: 8,
  lg: 12,
  full: 999,
} as const;

/** border/width/default, border/width/focus */
export const borderWidth = {
  default: 1,
  focus: 2,
} as const;

/** icon/size/default, icon/size/large */
export const iconSize = {
  default: 20,
  large: 24,
} as const;

/** touch/min, touch/shopping-row */
export const touch = {
  min: 44,
  shoppingRow: 56,
} as const;

/**
 * Elevation/Overlay — the only elevation style. Reserved for temporary/overlay surfaces.
 * Figma: drop shadow, x 0, y 4, blur 16, spread 0, #0F172A at 12% opacity.
 */
export const elevation = {
  overlay: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8, // React Native shadowRadius ≈ Figma blur / 2
    elevation: 6,
  },
} as const;

/** Horizontal content margin used on every V2 screen (Figma page 23: "20pt horizontal content margin"). */
export const layout = {
  screenHorizontalMargin: spacing[20],
} as const;
