import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, radius, spacing, typography } from '@/src/theme';

type Props = {
  missingKeys: string[];
};

/**
 * Shown only when a build was produced without the public Firebase configuration for its
 * environment. It names the missing settings (never their values) so the build can be fixed.
 */
export function ConfigurationErrorScreen({ missingKeys }: Props) {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          IntelliShop isn’t configured
        </Text>
        <Text style={styles.body}>
          This build is missing its Firebase configuration, so it can’t connect to your account.
          Please install an official build. If you are a developer, set the public Firebase values
          for this environment as described in .env.example.
        </Text>
        <View style={styles.card} accessible accessibilityLabel={`Missing settings: ${missingKeys.join(', ')}`}>
          <Text style={styles.cardTitle}>Missing settings</Text>
          {missingKeys.map((key) => (
            <Text key={key} style={styles.cardItem}>
              • {key}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.canvas,
  },
  content: {
    paddingHorizontal: layout.screenHorizontalMargin,
    paddingVertical: spacing[32],
  },
  title: {
    ...typography.h1,
    color: colors.content.primary,
    marginBottom: spacing[12],
  },
  body: {
    ...typography.body,
    color: colors.content.secondary,
    marginBottom: spacing[24],
  },
  card: {
    backgroundColor: colors.status.warningSubtle,
    borderColor: colors.status.warning,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing[16],
  },
  cardTitle: {
    ...typography.label,
    color: colors.content.primary,
    marginBottom: spacing[8],
  },
  cardItem: {
    ...typography.bodySmall,
    color: colors.content.primary,
  },
});
