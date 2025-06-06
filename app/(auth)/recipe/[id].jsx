import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Components
import RecipeCard from '@/components/recipes/RecipeCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import SelectListModal from '@/components/recipes/SelectListModal';

// Hooks
import { useShoppingList } from '@/hooks/useShoppingList';

// Mock recipe data for development (remove in production)
const MOCK_RECIPES = [
  {
    id: '1',
    title: 'Pasta Carbonara',
    image: 'https://via.placeholder.com/400x300',
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    difficulty: 'easy',
    category: 'Italian',
    description: 'A creamy Italian pasta dish with eggs, cheese, and pancetta or bacon. This classic Roman dish is quick to prepare and perfect for a weeknight dinner.',
    ingredients: [
      { id: '1', name: 'Spaghetti', quantity: 400, unit: 'g', inStock: true },
      { id: '2', name: 'Eggs', quantity: 4, unit: '', inStock: true },
      { id: '3', name: 'Pancetta', quantity: 150, unit: 'g', inStock: false },
      { id: '4', name: 'Parmesan Cheese', quantity: 50, unit: 'g', inStock: true },
      { id: '5', name: 'Black Pepper', quantity: 1, unit: 'tsp', inStock: true },
      { id: '6', name: 'Salt', quantity: 1, unit: 'tsp', inStock: true },
    ],
    instructions: [
      'Bring a large pot of salted water to boil and cook spaghetti according to package directions.',
      'While pasta is cooking, heat a large skillet over medium heat. Add pancetta and cook until crispy.',
      'In a bowl, whisk together eggs, grated parmesan, and black pepper.',
      'Once pasta is cooked, reserve 1/2 cup of pasta water and drain the rest.',
      'Working quickly, add hot pasta to the skillet with pancetta, remove from heat.',
      'Pour egg mixture over pasta and toss quickly to coat the pasta and create a creamy sauce. Add pasta water as needed to thin the sauce.',
      'Serve immediately with extra grated cheese and black pepper.'
    ],
    nutrition: {
      calories: '650 kcal',
      protein: '24g',
      carbs: '65g',
      fat: '32g',
      fiber: '3g'
    },
    tips: [
      'The heat from the pasta cooks the eggs - work quickly to avoid scrambling them.',
      'Traditional carbonara does not include cream, but you can add 2 tablespoons if you prefer a creamier sauce.',
      'For a vegetarian version, replace pancetta with sautéed mushrooms.'
    ],
    isFavorite: false,
    rating: 4.8
  }
];

export default function RecipeDetailScreen() {
  const { id, recipeData, fromSuggestions } = useLocalSearchParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [showListModal, setShowListModal] = useState(false);
  const [pendingIngredients, setPendingIngredients] = useState(null);
  
  // Import shopping list hooks
  const { 
    lists, 
    addItem, 
    createShoppingList, 
    selectList,
    fetchShoppingLists 
  } = useShoppingList();
  
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load shopping lists
        await fetchShoppingLists();
        
        // ✅ PRIORITY 1: If coming from suggestions with data
        if (fromSuggestions && recipeData) {
          try {
            const parsedRecipe = JSON.parse(recipeData);
            console.log('📱 Loading generated recipe:', parsedRecipe.title);
            setRecipe(parsedRecipe);
            return;
          } catch (parseError) {
            console.warn('Failed to parse recipe data:', parseError);
          }
        }
        
        // ✅ PRIORITY 2: Mock recipes for development
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Find recipe in mock data
        const foundRecipe = MOCK_RECIPES.find(r => r.id === id);
        
        if (foundRecipe) {
          console.log('📱 Loading mock recipe:', foundRecipe.title);
          setRecipe(foundRecipe);
        } else {
          setError('Recipe not found');
        }
        
      } catch (err) {
        console.error('Error fetching recipe:', err);
        setError('Failed to load recipe details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecipe();
  }, [id, recipeData, fromSuggestions]);
  
  const handleAddToFavorites = async () => {
    try {
      const newFavorites = new Set(favorites);
      newFavorites.add(recipe.id);
      setFavorites(newFavorites);
      
      // Optimistically update UI
      setRecipe(prev => ({ ...prev, isFavorite: true }));
      Alert.alert('Success!', `"${recipe.title}" has been added to favourites!`);
    } catch (error) {
      console.error('Error adding to favorites:', error);
      Alert.alert('Error', 'Could not add to favourites. Please try again.');
    }
  };
  
  const handleRemoveFromFavorites = async () => {
    try {
      const newFavorites = new Set(favorites);
      newFavorites.delete(recipe.id);
      setFavorites(newFavorites);
      
      // Optimistically update UI
      setRecipe(prev => ({ ...prev, isFavorite: false }));
      Alert.alert('Success!', `"${recipe.title}" has been removed from favourites.`);
    } catch (error) {
      console.error('Error removing from favorites:', error);
      Alert.alert('Error', 'Could not remove from favourites. Please try again.');
    }
  };
  
  // Updated function to show list selection modal
  const handleAddIngredientsToList = async (recipe) => {
    const missingIngredients = recipe.ingredients.filter(ing => !ing.inStock);
    
    if (missingIngredients.length === 0) {
      Alert.alert('Information', 'All ingredients are already in your stock! 🎉');
      return;
    }
    
    console.log('📝 Missing ingredients:', missingIngredients);
    
    // Store ingredients temporarily and show modal
    setPendingIngredients(missingIngredients);
    setShowListModal(true);
  };
  
  // Handle list selection from modal
  const handleSelectList = async (list) => {
    setShowListModal(false);
    
    if (!pendingIngredients || pendingIngredients.length === 0) {
      console.log('❌ No pending ingredients to add');
      return;
    }
    
    try {
      console.log('📋 Selecting list:', list.id, list.name);
      console.log('📝 Current list before:', currentList?.name);
      
      // Select the list first and wait for it
      const selectResult = await selectList(list.id);
      console.log('✅ List selected:', selectResult);
      
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('🛒 Adding', pendingIngredients.length, 'ingredients to list:', list.name);
      
      // Add ingredients to the selected list
      const addedIngredients = [];
      for (const ingredient of pendingIngredients) {
        console.log('➕ Adding ingredient:', ingredient.name);
        
        // Normalize quantity to ensure it's a number
        let quantity = 1;
        if (ingredient.quantity) {
          quantity = typeof ingredient.quantity === 'string' 
            ? parseFloat(ingredient.quantity) || 1 
            : ingredient.quantity;
        }
        
        // Normalize unit
        const unit = ingredient.unit || 'unit';
        
        const result = await addItem(
          ingredient.name,
          quantity,
          unit,
          null, // estimatedPrice
          'food', // category
          `For recipe: ${recipe.title}` // note
        );
        
        console.log('✅ Add result:', result);
        
        if (result?.success) {
          addedIngredients.push(ingredient.name);
        } else {
          console.error('❌ Failed to add ingredient:', ingredient.name, result);
        }
      }
      
      console.log('📋 Items added successfully:', addedIngredients.length);
      
      Alert.alert(
        'Success! 🛒', 
        `${addedIngredients.length} ingredient${addedIngredients.length > 1 ? 's were' : ' was'} added to "${list.name}".`,
        [
          { text: 'OK' },
          { 
            text: 'View List', 
            onPress: () => {
              // Make sure we're viewing the correct list
              selectList(list.id).then(() => {
                router.push('/(auth)/Shopping_list');
              });
            }
          }
        ]
      );
      
      setPendingIngredients(null);
    } catch (error) {
      console.error('❌ Error adding ingredients to list:', error);
      Alert.alert('Error', 'Failed to add ingredients to shopping list. Please try again.');
    }
  };
  
  // Handle creating new list from modal
  const handleCreateNewList = async (listName) => {
    try {
      const result = await createShoppingList(listName, true); // setAsCurrent = true
      return result;
    } catch (error) {
      console.error('Error creating list:', error);
      return { success: false, error: error.message };
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <LoadingSpinner size="large" />
        <Text style={styles.loadingText}>
          {fromSuggestions ? 'Loading generated recipe...' : 'Loading recipe details...'}
        </Text>
      </SafeAreaView>
    );
  }
  
  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar style="dark" />
        <View style={styles.errorContent}>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity 
              style={styles.errorButton}
              onPress={() => router.back()}
            >
              <Text style={styles.errorButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  
  // No recipe found
  if (!recipe) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar style="dark" />
        <View style={styles.errorContent}>
          <Text style={styles.errorTitle}>Recipe Not Found</Text>
          <Text style={styles.errorMessage}>The recipe you're looking for doesn't exist or has been removed.</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity 
              style={styles.errorButton}
              onPress={() => router.back()}
            >
              <Text style={styles.errorButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  
  // ✅ SPECIAL INDICATOR FOR GENERATED RECIPES
  const isGeneratedRecipe = recipe.isGenerated || fromSuggestions;
  
  // Render recipe card with data
  return (
    <View style={styles.container}>
      {isGeneratedRecipe && (
        <View style={styles.generatedBanner}>
          <Ionicons name="sparkles" size={16} color="#fff" />
          <Text style={styles.generatedText}>AI-generated recipe based on your stock</Text>
        </View>
      )}
      <RecipeCard
        recipe={recipe}
        onAddToFavorites={handleAddToFavorites}
        onRemoveFromFavorites={handleRemoveFromFavorites}
        onAddIngredientsToList={handleAddIngredientsToList}
      />
      
      {/* List Selection Modal */}
      <SelectListModal
        visible={showListModal}
        onClose={() => {
          setShowListModal(false);
          setPendingIngredients(null);
        }}
        lists={lists}
        onSelectList={handleSelectList}
        onCreateNewList={handleCreateNewList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  generatedBanner: {
    backgroundColor: '#9C27B0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  generatedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f9fc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f7f9fc',
    padding: 16,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorActions: {
    flexDirection: 'row',
  },
  errorButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});