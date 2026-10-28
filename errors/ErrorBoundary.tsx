/**
 * Catches render errors anywhere below it and shows a recoverable V2 error state.
 * Error details are shown only in development builds; nothing is logged with user data.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { handleError } from '@/errors/errorHandler';
import { colors, layout, spacing } from '@/src/theme';
import { AppText } from '@/src/ui/AppText';
import { Button } from '@/src/ui/Button';

type State = { error: Error | null };

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    handleError(error, { title: 'Unexpected Error', showAlert: false, logToAnalytics: false });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface.canvas }}>
        <View testID="error-boundary" style={{ flex: 1, justifyContent: 'center', paddingHorizontal: layout.screenHorizontalMargin, gap: spacing[16] }}>
          <AppText variant="h2">Something went wrong</AppText>
          <AppText variant="body" tone="secondary">
            IntelliShop hit an unexpected problem on this screen. Your saved lists and Pantry are not affected.
          </AppText>
          <Button title="Try again" onPress={this.reset} />
          {__DEV__ ? (
            <AppText variant="caption" tone="muted">
              {String(this.state.error)}
            </AppText>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }
}
