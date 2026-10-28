/**
 * Bottom sheet for short forms and confirmations (temporary surface → Elevation/Overlay, the
 * only elevation token). Not a Figma component: used for C6/C7/C8 editors that the handoff
 * lists as "design needed"; built only from approved tokens and components.
 */
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, elevation, layout, radius, spacing } from '@/src/theme';
import { AppText } from './AppText';
import { IconButton } from './Screen';

type SheetProps = { visible: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; testID?: string };

export function Sheet({ visible, title, onClose, children, footer, testID }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} accessibilityViewIsModal>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.32)' }} onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss" />
        <View
          testID={testID}
          style={{
            backgroundColor: colors.surface.card,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            paddingBottom: Math.max(insets.bottom, spacing[16]),
            maxHeight: '88%',
            ...elevation.overlay,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: layout.screenHorizontalMargin, paddingRight: 8, paddingTop: spacing[8] }}>
            <AppText variant="h3" style={{ flex: 1 }}>
              {title}
            </AppText>
            <IconButton kind="close" onPress={onClose} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: layout.screenHorizontalMargin, paddingTop: spacing[8], gap: spacing[16] }}>
            {children}
          </ScrollView>
          {footer ? <View style={{ paddingHorizontal: layout.screenHorizontalMargin, paddingTop: spacing[16], gap: spacing[8] }}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
