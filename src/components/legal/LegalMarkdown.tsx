/**
 * Renders a legal document in the app from the same Markdown and parser as the website
 * (shared/legal/markdownLite.ts), so both always show the same text.
 * Links: internal paths open the in-app document, web links open in the browser, mailto opens Mail.
 */
import type { ReactNode } from 'react';
import { Linking, Text, View } from 'react-native';

import { inlineToPlainText, parseDocument, safeHref, type Block, type Inline } from '@/shared/legal/markdownLite';
import { borderWidth, colors, radius, spacing, typography } from '@/src/theme';
import { AppText } from '@/src/ui';

const SLUGS = ['privacy', 'terms', 'ai', 'food-safety', 'subscriptions', 'pricing-data', 'account-deletion', 'acceptable-use', 'support', 'legal/changes'];

function inline(nodes: Inline[], onInternal: (slug: string) => void, key = ''): ReactNode[] {
  return nodes.map((n, i) => {
    const k = `${key}${i}`;
    switch (n.type) {
      case 'text':
        return n.text;
      case 'code':
        return <Text key={k} style={{ fontFamily: typography.label.fontFamily }}>{n.text}</Text>;
      case 'strong':
        return <Text key={k} style={{ fontFamily: typography.label.fontFamily }}>{inline(n.children, onInternal, k)}</Text>;
      case 'em':
        return <Text key={k} style={{ fontStyle: 'italic' }}>{inline(n.children, onInternal, k)}</Text>;
      case 'link': {
        const href = safeHref(n.href);
        const internal = href?.startsWith('/') ? href.replace(/^\/|\/$/g, '') : null;
        const onPress = () => {
          if (!href) return;
          if (internal != null && SLUGS.includes(internal)) onInternal(internal);
          else if (/^(https:|mailto:)/.test(href)) Linking.openURL(href).catch(() => {});
        };
        return (
          <Text key={k} onPress={onPress} accessibilityRole="link" style={{ color: colors.action.primary, textDecorationLine: 'underline' }}>
            {inline(n.children, onInternal, k)}
          </Text>
        );
      }
      default:
        return null;
    }
  });
}

function BlockView({ block, onInternal }: { block: Block; onInternal: (slug: string) => void }) {
  switch (block.type) {
    case 'heading': {
      const variant = block.level === 1 ? 'h1' : block.level === 2 ? 'h2' : 'h3';
      return <AppText variant={variant} style={{ marginTop: block.level === 1 ? 0 : spacing[8] }}>{inline(block.content, onInternal)}</AppText>;
    }
    case 'paragraph':
      return <AppText variant="bodySmall">{inline(block.content, onInternal)}</AppText>;
    case 'list':
      return (
        <View style={{ gap: spacing[4] }}>
          {block.items.map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: spacing[8] }}>
              <AppText variant="bodySmall" accessible={false}>{block.ordered ? `${block.start + i}.` : '•'}</AppText>
              <View style={{ flex: 1, gap: spacing[4] }}>
                <AppText variant="bodySmall">{inline(item.content, onInternal)}</AppText>
                {item.children.map((c, j) => <BlockView key={j} block={c} onInternal={onInternal} />)}
              </View>
            </View>
          ))}
        </View>
      );
    case 'table':
      // Tables are shown as stacked cards (readable at large Dynamic Type sizes and with VoiceOver).
      return (
        <View style={{ gap: spacing[8] }}>
          {block.rows.map((row, r) => (
            <View key={r} style={{ borderWidth: borderWidth.default, borderColor: colors.border.default, borderRadius: radius.md, padding: spacing[12], gap: spacing[4], backgroundColor: colors.surface.card }}>
              {row.map((cell, c) => (
                <View key={c}>
                  <AppText variant="caption" tone="muted">{inlineToPlainText(block.header[c] ?? [])}</AppText>
                  <AppText variant="bodySmall">{inline(cell, onInternal)}</AppText>
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    case 'blockquote':
      return (
        <View style={{ borderLeftWidth: 4, borderLeftColor: colors.status.warning, backgroundColor: colors.status.warningSubtle, padding: spacing[12], gap: spacing[8], borderRadius: radius.xs }}>
          {block.children.map((c, i) => <BlockView key={i} block={c} onInternal={onInternal} />)}
        </View>
      );
    case 'hr':
      return <View style={{ height: 1, backgroundColor: colors.border.default }} />;
    default:
      return null;
  }
}

export function LegalMarkdown({ markdown, onInternalLink }: { markdown: string; onInternalLink: (slug: string) => void }) {
  const { blocks } = parseDocument(markdown);
  return (
    <View style={{ gap: spacing[12] }}>
      {blocks.map((b, i) => <BlockView key={i} block={b} onInternal={onInternalLink} />)}
    </View>
  );
}
