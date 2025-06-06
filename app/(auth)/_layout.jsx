// app/(auth)/_layout.jsx
import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="HomeScreen" 
        options={{ 
          title: 'Home',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="ProfileScreen" 
        options={{ 
          title: 'Profile',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="StockScreen" 
        options={{ 
          title: 'Stock Management',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="Shopping_list" 
        options={{ 
          title: 'Shopping List',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="SmartShoppingListScreen" 
        options={{ 
          title: 'Smart Shopping',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="Price-Comparison" 
        options={{ 
          title: 'Price Comparison',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="FavoriteRecipes" 
        options={{ 
          title: 'Favorite Recipes',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="RecipeSuggestionScreen" 
        options={{ 
          title: 'Recipe Suggestions',
          headerShown: false 
        }} 
      />
      {/* Changed from "recipe" to "recipe/_layout" for nested routes */}
      <Stack.Screen 
        name="recipe" 
        options={{ 
          title: 'Recipes',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Dashboard',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}