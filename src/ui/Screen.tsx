/**
 * Screen scaffolding shared by every V2 screen: canvas background, 20 pt horizontal margin
 * (Figma page 23), safe areas, header row with 44 pt touch targets (Back / Close / More),
 * optional sticky footer for the screen's primary action.
 */
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { borderWidth, colors, layout, spacing, touch } from '@/src/theme';
import { AppText } from './AppText';
import { BackIcon } from './icons';

type ScreenProps = {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  /** Tab screens sit above the tab bar, so they do not pad the bottom safe area. */
  inTabs?: boolean;
  scroll?: boolean;
  testID?: string;
  contentStyle?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function Screen({ children, header, footer, inTabs = false, scroll = true, testID, contentStyle, refreshing, onRefresh }: ScreenProps) {
  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[{ paddingHorizontal: layout.screenHorizontalMargin, paddingTop: spacing[8], paddingBottom: spacing[32], gap: spacing[16] }, contentStyle]}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, paddingHorizontal: layout.screenHorizontalMargin, gap: spacing[16] }, contentStyle]}>{children}</View>
  );
  return (
    <SafeAreaView testID={testID} edges={inTabs ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: colors.surface.canvas }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {header}
        <View style={{ flex: 1 }}>{body}</View>
        {footer ? (
          <View
            style={{
              paddingHorizontal: layout.screenHorizontalMargin,
              paddingTop: spacing[12],
              paddingBottom: spacing[12],
              gap: spacing[8],
              borderTopWidth: borderWidth.default,
              borderTopColor: colors.border.default,
              backgroundColor: colors.surface.card,
            }}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type IconButtonProps = { kind: 'back' | 'close' | 'more'; onPress: () => void; accessibilityLabel?: string; testID?: string };

/** 44 × 44 touch target — Figma "Touch Target — Back / Close / More". */
export function IconButton({ kind, onPress, accessibilityLabel, testID }: IconButtonProps) {
  const label = accessibilityLabel ?? (kind === 'back' ? 'Back' : kind === 'close' ? 'Close' : 'More options');
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => ({ width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: pressed ? colors.content.subtle : 'transparent' })}
    >
      {kind === 'back' ? (
        <BackIcon />
      ) : (
        <AppText variant={kind === 'close' ? 'h2' : 'label'} accessibilityRole="none" style={kind === 'close' ? { fontSize: 22 } : undefined} accessible={false}>
          {kind === 'close' ? '×' : '•••'}
        </AppText>
      )}
    </Pressable>
  );
}

type HeaderProps = {
  title?: string;
  titleVariant?: 'h1' | 'h2' | 'h3';
  left?: ReactNode;
  right?: ReactNode;
  subtitle?: string;
};

export function Header({ title, titleVariant = 'h2', left, right, subtitle }: HeaderProps) {
  return (
    <View style={{ paddingHorizontal: layout.screenHorizontalMargin - (left ? 12 : 0), paddingTop: spacing[8], paddingBottom: spacing[8] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: touch.min, gap: spacing[4] }}>
        {left}
        <View style={{ flex: 1 }}>
          {title ? (
            <AppText variant={titleVariant} numberOfLines={2}>
              {title}
            </AppText>
          ) : null}
        </View>
        {right}
      </View>
      {subtitle ? (
        <AppText variant="bodySmall" tone="secondary" style={{ paddingLeft: left ? 12 : 0 }}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

/** Section title (H3) with an optional trailing count caption or action. */
export function SectionHeader({ title, count, action }: { title: string; count?: number | string; action?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: touch.min, marginBottom: -spacing[8] }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing[8], flexShrink: 1 }}>
        <AppText variant="h3">{title}</AppText>
        {count !== undefined ? (
          <AppText variant="caption" tone="muted">
            {String(count)}
          </AppText>
        ) : null}
      </View>
      {action}
    </View>
  );
}
