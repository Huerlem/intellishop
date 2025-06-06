// app/(public)/_layout.jsx
import React from 'react';
import { Stack } from 'expo-router';

export default function PublicLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="WelcomeScreen" 
        options={{ 
          title: 'Welcome to IntelliShop',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="LoginScreen" 
        options={{ 
          title: 'Login',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="RegisterScreen" 
        options={{ 
          title: 'Create Account',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="forgot-password" 
        options={{ 
          title: 'Reset Password',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}