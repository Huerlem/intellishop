import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import * as SplashScreen from 'expo-splash-screen';
import {
    useFonts, Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold
} from '@expo-google-fonts/poppins';

// Providers (context)
import { AuthProvider } from '@/context/AuthContext';
import { ShoppingListProvider } from '@/context/ShoppingListContext';
import { StockProvider } from '@/context/StockContext';
import { AIProvider } from '@/context/AIContext';
import { RecipeProvider } from '@/context/RecipeContext';

// Error Components
import ErrorBoundary from '@/errors/ErrorBoundary';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { handleError } from '@/errors/errorHandler';

// Keep Splash Screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [appIsReady, setAppIsReady] = useState(false);

    // Load fonts
    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
        Poppins_600SemiBold,
        Poppins_700Bold,
    });

    useEffect(() => {
        async function prepare() {
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                handleError(error, { title: 'Error loading app resources', silent: true });
            } finally {
                setAppIsReady(true);
            }
        }
        prepare();
    }, []);

    useEffect(() => {
        if (appIsReady && fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [appIsReady, fontsLoaded]);

    if (!appIsReady || !fontsLoaded) {
        return <LoadingSpinner message="Initializing IntelliShop..." showGrandient={true} />;
    }
    
    return (
        <ErrorBoundary>
            <SafeAreaProvider>
                <StatusBar style="auto" />
                <AuthProvider>
                    <ShoppingListProvider>
                        <StockProvider>
                            <AIProvider>
                                <RecipeProvider>
                                <Stack 
                                    screenOptions={{ 
                                        headerShown: false
                                    }}
                                >
                                    <Stack.Screen name="index" options={{ headerShown: false }} />
                                    <Stack.Screen name="(public)" options={{ headerShown: false }} />
                                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                                    
                                </Stack>
                                </RecipeProvider>
                            </AIProvider>
                        </StockProvider>
                    </ShoppingListProvider>
                </AuthProvider>
            </SafeAreaProvider>
        </ErrorBoundary>
    );
}