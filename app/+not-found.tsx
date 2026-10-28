import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ROUTES } from '@/src/navigation/routes';
import { colors, layout, radius, spacing, touch, typography } from '@/src/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.title} accessibilityRole="header">
          Page not found
        </Text>
        <Text style={styles.message}>This screen doesn’t exist or has moved.</Text>
        <Link href={ROUTES.home} style={styles.link} accessibilityRole="link">
          Go to Home
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenHorizontalMargin,
    backgroundColor: colors.surface.canvas,
  },
  title: {
    ...typography.h2,
    color: colors.content.primary,
    marginBottom: spacing[8],
  },
  message: {
    ...typography.body,
    color: colors.content.secondary,
    textAlign: 'center',
    marginBottom: spacing[24],
  },
  link: {
    ...typography.button,
    color: colors.action.primary,
    minHeight: touch.min,
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    borderRadius: radius.md,
  },
});
