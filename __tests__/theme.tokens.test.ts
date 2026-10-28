/**
 * Guards the design tokens against drift from the approved Figma V2 values.
 * Source values: docs/design-handoff/tokens_and_provenance.json (17 colours from the handoff)
 * plus the values read directly from Figma on 2026-10-27 (docs/FIGMA_IMPLEMENTATION_MATRIX.md §2).
 */
import handoff from '../docs/design-handoff/tokens_and_provenance.json';
import { borderWidth, colors, iconSize, radius, spacing, touch } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';

const handoffColours = handoff.figma_approved_colors as Record<string, string>;

const tokenByFigmaName: Record<string, string> = {
  'action/primary': colors.action.primary,
  'action/pressed': colors.action.pressed,
  'action/subtle': colors.action.subtle,
  'intelligence/base': colors.intelligence.base,
  'intelligence/subtle': colors.intelligence.subtle,
  'brand/accent': colors.brand.accent,
  'brand/subtle': colors.brand.subtle,
  'content/primary': colors.content.primary,
  'content/secondary': colors.content.secondary,
  'content/muted': colors.content.muted,
  'border/default': colors.border.default,
  'surface/canvas': colors.surface.canvas,
  'surface/card': colors.surface.card,
  'status/success': colors.status.success,
  'status/warning': colors.status.warning,
  'status/error': colors.status.error,
  'status/information': colors.status.information,
};

describe('colour tokens', () => {
  it.each(Object.entries(handoffColours))('%s matches the approved handoff value', (name, value) => {
    expect(tokenByFigmaName[name]).toBe(value);
  });

  it('covers every colour in the handoff file', () => {
    expect(Object.keys(handoffColours).sort()).toEqual(Object.keys(tokenByFigmaName).sort());
  });

  it('includes the six Figma colour tokens missing from the handoff file', () => {
    expect(colors.content.subtle).toBe('#F1F5F9');
    expect(colors.status.successSubtle).toBe('#ECFDF5');
    expect(colors.status.warningSubtle).toBe('#FFFBEB');
    expect(colors.status.errorSubtle).toBe('#FEF2F2');
    expect(colors.status.informationSubtle).toBe('#EFF6FF');
    expect(colors.status.errorPressed).toBe('#991B1B');
  });

  it('defines exactly 23 colour tokens, as in Figma', () => {
    const count = Object.values(colors).reduce((n, group) => n + Object.keys(group).length, 0);
    expect(count).toBe(23);
  });
});

describe('number tokens', () => {
  it('match Figma (18 values)', () => {
    expect(Object.values(spacing)).toEqual([4, 8, 12, 16, 20, 24, 32, 48]);
    expect(radius).toEqual({ xs: 4, md: 8, lg: 12, full: 999 });
    expect(borderWidth).toEqual({ default: 1, focus: 2 });
    expect(iconSize).toEqual({ default: 20, large: 24 });
    expect(touch).toEqual({ min: 44, shoppingRow: 56 });
  });
});

describe('typography', () => {
  it('defines the 10 approved Inter text styles', () => {
    expect(Object.keys(typography)).toHaveLength(10);
    for (const style of Object.values(typography)) {
      expect(style.fontFamily).toMatch(/^Inter_/);
      expect(style.letterSpacing).toBe(0);
    }
  });

  it.each([
    ['display', 'Inter_700Bold', 32, 40],
    ['h1', 'Inter_700Bold', 28, 34],
    ['h2', 'Inter_700Bold', 22, 28],
    ['h3', 'Inter_600SemiBold', 18, 24],
    ['body', 'Inter_400Regular', 16, 24],
    ['bodySmall', 'Inter_400Regular', 14, 20],
    ['label', 'Inter_600SemiBold', 14, 20],
    ['caption', 'Inter_500Medium', 12, 16],
    ['button', 'Inter_600SemiBold', 15, 20],
    ['dataLarge', 'Inter_700Bold', 24, 30],
  ] as const)('%s is %s %d/%d', (name, family, size, lineHeight) => {
    expect(typography[name]).toMatchObject({ fontFamily: family, fontSize: size, lineHeight });
  });
});
