// app/index.tsx
import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        if (user) {
          // User is authenticated - go to main app in (auth)
          console.log('✅ User authenticated, going to HomeScreen');
          router.replace('/(auth)/HomeScreen');
        } else {
          // User not authenticated - go to welcome
          console.log('❌ No user, going to WelcomeScreen');
          router.replace('/(public)/WelcomeScreen');
        }
      }, 500);
    }
  }, [user, loading, router]);

  return (
    <LoadingSpinner 
      message="Loading IntelliShop..." 
      showGrandient={true}
    />
  );
}