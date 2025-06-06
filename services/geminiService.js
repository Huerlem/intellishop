import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Context imports
import { StockContext } from '@/context/StockContext';
import { ShoppingListContext } from '@/context/ShoppingListContext';
import { AuthContext } from '@/context/AuthContext';

// Component imports
import RecipeSuggestion from '@/components/recipes/RecipeSuggestion';
import RecipeFilters from '@/components/recipes/RecipeFilters';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// ✅ FIXED: Use the correct function from your geminiService
import { generateRecipesWithAI } from '@/services/geminiService';

const RecipeSuggestionScreen = () => {
  const router = useRouter();
  
  // Context
  const { stockItems, loading: stockLoading, fetchStockItems } = useContext(StockContext);
  const { addItem } = useContext(ShoppingListContext);
  const { user } = useContext(AuthContext);

  // State
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preferences, setPreferences] = useState({
    difficulty: 'all',
    cookingTime: 'all',
    dietary: 'all'
  });

  // ✅ FIXED: Use useCallback to prevent infinite loop
  const loadStockItems = useCallback(async () => {
    try {
      console.log('📦 Loading stock items...');
      await fetchStockItems();
    } catch (error) {
      console.error('❌ Error loading stock items:', error);
    }
  }, [fetchStockItems]);

  // ✅ FIXED: Load stock items only once on mount
  useEffect(() => {
    loadStockItems();
  }, []); // Empty dependency array - runs only once

  // ✅ FIXED: Use the correct function that exists in your geminiService
  const generateRecipes = useCallback(async () => {
    if (!stockItems || stockItems.length === 0) {
      Alert.alert(
        'No Ingredients Found',
        'Please add some ingredients to your stock first.',
        [
          {
            text: 'Add Ingredients',
            onPress: () => router.push('/(auth)/StockScreen')
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Generating recipes with REAL AI...');
      console.log('📦 Available ingredients:', stockItems.map(item => item.name));

      // ✅ FIXED: Use your existing generateRecipesWithAI function correctly
      const aiRecipes = await generateRecipesWithAI(stockItems);
      
      console.log('✅ AI Generated Recipes:', aiRecipes.length);
      console.log('🔍 First recipe structure:', aiRecipes[0]);

      // ✅ FIXED: Process the recipes that come from your AI service
      const processedRecipes = aiRecipes.map((recipe, index) => {
        // Process ingredients to check availability
        const processedIngredients = (recipe.ingredients || []).map((ingredient, idx) => {
          const stockItem = stockItems.find(item => 
            item.name.toLowerCase().includes(ingredient.name?.toLowerCase() || '') ||
            (ingredient.name?.toLowerCase() || '').includes(item.name.toLowerCase())
          );

          return {
            id: idx.toString(),
            name: ingredient.name || `Ingredient ${idx + 1}`,
            quantity: ingredient.quantity || '1',
            unit: ingredient.unit || 'unit',
            inStock: ingredient.inStock || !!stockItem,
            available: ingredient.inStock || !!stockItem
          };
        });

        // Calculate availability percentage
        const availableCount = processedIngredients.filter(ing => ing.inStock).length;
        const availabilityPercentage = processedIngredients.length > 0 
          ? Math.round((availableCount / processedIngredients.length) * 100) 
          : 0;

        return {
          id: recipe.id || `ai_recipe_${index}_${Date.now()}`,
          title: recipe.title || `AI Recipe ${index + 1}`,
          description: recipe.description || 'Delicious AI-generated recipe based on your ingredients',
          difficulty: recipe.difficulty || 'medium',
          cookingTime: recipe.prepTime ? `${recipe.prepTime} minutes` : '30 minutes',
          servings: recipe.servings || 4,
          ingredients: processedIngredients,
          instructions: Array.isArray(recipe.instructions) 
            ? recipe.instructions 
            : recipe.steps || [
                'Prepare all ingredients according to the recipe',
                'Follow standard cooking methods for this type of dish',
                'Cook until properly done and flavors are well combined',
                'Serve hot and enjoy your AI-generated recipe!'
              ],
          availabilityPercentage,
          availablePercentage: availabilityPercentage, // For compatibility
          nutritionalInfo: recipe.nutritionalInfo || {
            calories: Math.floor(Math.random() * 400) + 200,
            protein: Math.floor(Math.random() * 30) + 5,
            carbs: Math.floor(Math.random() * 50) + 10,
            fat: Math.floor(Math.random() * 20) + 5
          },
          tags: recipe.tags || ['ai-generated'],
          source: 'Gemini AI',
          isAIGenerated: true,
          prepTime: recipe.prepTime || 30
        };
      });

      console.log('✅ Processed recipes:', processedRecipes.length);
      console.log('🔍 First processed recipe:', processedRecipes[0]);
      
      setRecipes(processedRecipes);

      if (processedRecipes.length === 0) {
        Alert.alert(
          'No Recipes Generated',
          'Could not generate recipes with your current ingredients. Please try again or add more ingredients.',
        );
      } else {
        Alert.alert(
          'Success! 🎉',
          `Generated ${processedRecipes.length} delicious recipes based on your ingredients!`,
        );
      }

    } catch (error) {
      console.error('❌ Error generating recipes with AI:', error);
      setError(error.message);
      
      Alert.alert(
        'Error Generating Recipes',
        'Failed to generate recipes with AI. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: generateRecipes },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  }, [stockItems, router]);

  // Filter recipes based on preferences
  const filteredRecipes = recipes.filter(recipe => {
    if (preferences.difficulty !== 'all' && recipe.difficulty !== preferences.difficulty) {
      return false;
    }
    
    if (preferences.cookingTime !== 'all') {
      const time = recipe.prepTime || parseInt(recipe.cookingTime);
      if (preferences.cookingTime === 'quick' && time > 30) return false;
      if (preferences.cookingTime === 'medium' && (time <= 30 || time > 60)) return false;
      if (preferences.cookingTime === 'long' && time <= 60) return false;
    }

    return true;
  });

  // Add missing ingredients to shopping list
  const addMissingIngredientsToShoppingList = useCallback(async (recipe) => {
    try {
      const missingIngredients = recipe.ingredients.filter(ing => !ing.inStock);
      
      if (missingIngredients.length === 0) {
        Alert.alert('Perfect!', 'You already have all the ingredients for this recipe! 🎉');
        return;
      }

      for (const ingredient of missingIngredients) {
        await addItem(
          ingredient.name,
          ingredient.quantity,
          ingredient.unit,
          null,
          'others',
          `For recipe: ${recipe.title}`
        );
      }

      Alert.alert(
        'Added! 🛒', 
        `${missingIngredients.length} ingredients have been added to your shopping list.`
      );
      
    } catch (error) {
      console.error('❌ Error adding to list:', error);
      Alert.alert('Error', 'Could not add to shopping list');
    }
  }, [addItem]);

  const handleViewDetails = useCallback((recipe) => {
    router.push({
      pathname: '/(auth)/RecipeDetailScreen',
      params: { recipeData: JSON.stringify(recipe) }
    });
  }, [router]);

  const renderRecipeItem = useCallback(({ item }) => (
    <RecipeSuggestion
      recipe={item}
      onViewDetails={() => handleViewDetails(item)}
      onAddMissing={() => addMissingIngredientsToShoppingList(item)}
      showAllIngredients={true}
      style={styles.recipeCard}
    />
  ), [handleViewDetails, addMissingIngredientsToShoppingList]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="restaurant-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Recipes Generated</Text>
      <Text style={styles.emptyText}>
        Generate personalized recipes based on your available ingredients using AI
      </Text>
      <TouchableOpacity 
        style={styles.generateButton} 
        onPress={generateRecipes}
        disabled={loading || stockLoading}
      >
        <Ionicons name="sparkles" size={20} color="#FFFFFF" />
        <Text style={styles.generateButtonText}>Generate with AI</Text>
      </TouchableOpacity>
    </View>
  );

  if (stockLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading your ingredients..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>AI Recipe Suggestions</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={generateRecipes}
          disabled={loading}
        >
          <Ionicons 
            name={loading ? "hourglass-outline" : "refresh-outline"} 
            size={24} 
            color="#4B0082" 
          />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <RecipeFilters
        preferences={preferences}
        onUpdatePreferences={setPreferences}
        style={styles.filters}
      />

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B0082" />
          <Text style={styles.loadingText}>Generating recipes with AI...</Text>
          <Text style={styles.loadingSubtext}>Creating personalized recipes based on your ingredients</Text>
        </View>
      ) : filteredRecipes.length > 0 ? (
        <FlatList
          data={filteredRecipes}
          renderItem={renderRecipeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.recipesList}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        renderEmptyState()
      )}

      {/* Generate Button - Fixed Position */}
      {!loading && filteredRecipes.length === 0 && (
        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity 
            style={styles.floatingButton}
            onPress={generateRecipes}
            disabled={loading}
          >
            <Ionicons name="sparkles" size={24} color="#FFFFFF" />
            <Text style={styles.floatingButtonText}>Generate AI Recipes</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  refreshButton: {
    padding: 8,
  },
  filters: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  recipesList: {
    padding: 20,
    paddingBottom: 100,
  },
  recipeCard: {
    marginBottom: 16,
  },
  separator: {
    height: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4B0082',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 24,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4B0082',
    paddingVertical: 16,
    borderRadius: 25,
    elevation: 5,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.25)',

  },
  floatingButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default RecipeSuggestionScreen;