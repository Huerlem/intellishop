// app/(auth)/recipe/_layout.jsx
import React from 'react';
import { Stack } from 'expo-router';

export default function RecipeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Recipe Home',
          headerShown: false 
        }} 
      />
      {/* Add other recipe screens as needed */}
    </Stack>
  );
}