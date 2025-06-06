// app/index.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [navigationReady, setNavigationReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure router is ready
    const timer = setTimeout(() => {
      setNavigationReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && navigationReady) {
      try {
        if (user) {
          // User is authenticated, you can choose between (tabs) or (auth)
          // For now, let's use (tabs) as the main authenticated area
          console.log('User authenticated, navigating to tabs');
          router.replace('/(tabs)');
        } else {
          // User is not authenticated, redirect to welcome screen
          console.log('User not authenticated, navigating to welcome');
          router.replace('/(public)/WelcomeScreen');
        }
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback navigation
        setTimeout(() => {
          if (user) {
            router.push('/(tabs)');
          } else {
            router.push('/(public)/WelcomeScreen');
          }
        }, 500);
      }
    }
  }, [user, loading, router, navigationReady]);

  // Show loading spinner while checking authentication
  return (
    <LoadingSpinner 
      message="Checking authentication..." 
      showGrandient={true}
    />
  );
}