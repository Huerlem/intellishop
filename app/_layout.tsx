import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/context/AuthContext';
import ErrorBoundary from '@/errors/ErrorBoundary';
import { isFirebaseConfigured, missingFirebaseConfigKeys } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { RootStack } from '@/src/navigation/RootStack';
import { ConfigurationErrorScreen } from '@/src/screens/ConfigurationErrorScreen';
import { AppDataProvider } from '@/src/state/AppDataProvider';

// Keep the native splash screen up until fonts and the first auth state are known.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // If fonts fail to load, continue with the system font rather than blocking the app.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (!isFirebaseConfigured) {
    return (
      <SafeAreaProvider>
        <ConfigurationErrorScreen missingKeys={missingFirebaseConfigKeys} />
      </SafeAreaProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AuthProvider>
            <AppDataProvider>
              <StatusBar style="dark" />
              <AuthGate />
            </AppDataProvider>
          </AuthProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AuthGate() {
  const { initialising, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!initialising) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [initialising]);

  if (initialising) {
    return null;
  }

  return <RootStack isAuthenticated={isAuthenticated} />;
}
