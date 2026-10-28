/**
 * Loading, empty, error and offline states (Figma handoff C9: built from Alert and Info Card).
 */
import { ActivityIndicator, View } from 'react-native';

import { colors, spacing } from '@/src/theme';
import { Alert } from './Alert';
import { AppText } from './AppText';
import { Button } from './Button';

export function LoadingState({ label = 'Loading…', testID = 'loading-state' }: { label?: string; testID?: string }) {
  return (
    <View testID={testID} style={{ paddingVertical: spacing[48], alignItems: 'center', gap: spacing[12] }} accessible accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={colors.action.primary} />
      <AppText variant="caption" tone="secondary">
        {label}
      </AppText>
    </View>
  );
}

type EmptyProps = { title: string; body?: string; actionTitle?: string; onAction?: () => void; testID?: string };

export function EmptyState({ title, body, actionTitle, onAction, testID = 'empty-state' }: EmptyProps) {
  return (
    <View testID={testID} style={{ paddingVertical: spacing[32], gap: spacing[8], alignItems: 'flex-start' }}>
      <AppText variant="h3">{title}</AppText>
      {body ? (
        <AppText variant="bodySmall" tone="secondary">
          {body}
        </AppText>
      ) : null}
      {actionTitle && onAction ? <Button title={actionTitle} onPress={onAction} variant="secondary" style={{ marginTop: spacing[8] }} /> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry, testID = 'error-state' }: { message: string; onRetry?: () => void; testID?: string }) {
  return <Alert testID={testID} tone="error" title="Could not load" detail={message} actionTitle={onRetry ? 'Retry' : undefined} onAction={onRetry} />;
}

/**
 * Shown while live data comes from the device cache. Firestore in this app uses the JS SDK's
 * in-memory cache, so queued changes survive only while the app stays open — the copy says so.
 */
export function OfflineBanner({ pendingWrites }: { pendingWrites: boolean }) {
  return (
    <Alert
      testID="offline-banner"
      tone="warning"
      title="You're offline"
      detail={pendingWrites ? 'Your latest changes will sync when you reconnect. Keep IntelliShop open until they do.' : 'Showing the latest data on this device.'}
    />
  );
}
