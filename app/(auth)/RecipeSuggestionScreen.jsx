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
import { GoogleGenerativeAI } from '@google/generative-ai';

// Context imports
import { StockContext } from '@/context/StockContext';
import { ShoppingListContext } from '@/context/ShoppingListContext';
import { AuthContext } from '@/context/AuthContext';

// Component imports
import RecipeSuggestion from '@/components/recipes/RecipeSuggestion';
import RecipeFilters from '@/components/recipes/RecipeFilters';
import SelectListModal from '@/components/recipes/SelectListModal';

const RecipeSuggestionScreen = () => {
  const router = useRouter();
  
  // Context
  const { stockItems, loading: stockLoading, fetchStockItems } = useContext(StockContext);
  const { 
    lists,
    currentList,
    loading: listsLoading,
    isAddingItems, // ✅ NOVO estado do context
    addMultipleItems, // ✅ NOVA função do context
    createShoppingList, 
    selectList,
    fetchShoppingLists,
    debugState // ✅ NOVA função de debug
  } = useContext(ShoppingListContext);
  const { user } = useContext(AuthContext);

  // State
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preferences, setPreferences] = useState({
    difficulty: 'all',
    prepTime: 'all',
    category: 'all'
  });
  
  // State for list selection modal
  const [showListModal, setShowListModal] = useState(false);
  const [pendingRecipe, setPendingRecipe] = useState(null);

  // Load stock items and shopping lists
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('📦 Loading stock items and shopping lists...');
        await fetchStockItems();
        await fetchShoppingLists();
      } catch (error) {
        console.error('❌ Error loading data:', error);
      }
    };
    loadData();
  }, []);

  // ✅ Debug effect - remove in production
  useEffect(() => {
    if (lists.length > 0) {
      console.log('📋 Lists updated, debugging state...');
      debugState?.();
    }
  }, [lists, currentList]);

  // ✅ COMPLETELY OPEN: Generate ANY recipes from internet based on filters
  const generateOpenRecipes = useCallback(async (preferences) => {
    try {
      // Get API key
      const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
      }

      // Initialize Gemini
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const difficultyFilter = preferences.difficulty !== 'all' ? preferences.difficulty : '';
      const categoryFilter = preferences.category !== 'all' ? preferences.category : '';
      const timeFilter = preferences.prepTime !== 'all' ? preferences.prepTime : '';

      // ✅ OPEN PROMPT: Let AI generate ANY recipes from its knowledge
      let promptBase = `Generate 6 diverse and popular recipes from around the world`;
      
      // Add filters if selected
      if (categoryFilter) {
        promptBase += ` that are specifically ${categoryFilter} recipes`;
      }
      
      if (difficultyFilter) {
        promptBase += ` with ${difficultyFilter} difficulty level`;
      }
      
      if (timeFilter) {
        const timeDescription = timeFilter === 'quick' ? 'quick (under 30 minutes)' : 
                              timeFilter === 'medium' ? 'medium (30-60 minutes)' : 
                              'longer cooking time (over 60 minutes)';
        promptBase += ` that have ${timeDescription}`;
      }

      const prompt = `${promptBase}.

IMPORTANT INSTRUCTIONS:
- Generate REAL, popular recipes from different cuisines (Italian, Asian, Mexican, American, French, etc.)
- Each recipe should be completely different and unique
- Include famous dishes that people actually cook and love
- Make recipes creative but realistic and achievable
- Include proper ingredients with realistic quantities
- Provide detailed cooking instructions

${categoryFilter ? `
CATEGORY REQUIREMENT: ALL recipes MUST be ${categoryFilter} recipes.
${categoryFilter === 'Breakfast' ? 'Examples: pancakes, eggs benedict, avocado toast, smoothie bowls, oatmeal variations, etc.' : ''}
${categoryFilter === 'Main Course' ? 'Examples: pasta dishes, stir-fries, curries, steaks, casseroles, etc.' : ''}
${categoryFilter === 'Dessert' ? 'Examples: cakes, cookies, ice cream, puddings, pies, etc.' : ''}
${categoryFilter === 'Snack' ? 'Examples: chips, dips, crackers, nuts, finger foods, etc.' : ''}
` : ''}

Return ONLY a valid JSON array with this exact structure:
[
  {
    "id": "recipe_1",
    "title": "Real Recipe Name (e.g., Spaghetti Carbonara)",
    "description": "Delicious description of the dish",
    "difficulty": "${difficultyFilter || 'Easy'}",
    "prepTime": 30,
    "servings": 4,
    "ingredients": [
      {
        "name": "ingredient name",
        "quantity": "2",
        "unit": "cups",
        "inStock": false
      }
    ],
    "instructions": [
      "Step 1: Detailed cooking instruction",
      "Step 2: Another detailed step",
      "Step 3: Final preparation step"
    ],
    "category": "${categoryFilter || 'Main Course'}",
    "cuisine": "Italian/Asian/Mexican/etc",
    "tags": ["popular", "authentic", "delicious"]
  }
]

CRITICAL: Generate completely different recipes each time. Include various cuisines and cooking styles.
${categoryFilter ? `MANDATORY: Every recipe MUST be a ${categoryFilter} recipe with category field set to "${categoryFilter}".` : ''}`;

      console.log('🤖 Generating OPEN recipes with prompt:', prompt.substring(0, 200) + '...');
      console.log('🔍 Filters applied:', { difficulty: difficultyFilter, category: categoryFilter, time: timeFilter });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let responseText = response.text().trim();
      
      console.log('🤖 AI Response received:', responseText.substring(0, 500) + '...');
      
      // Clean response more thoroughly
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // ✅ FIXED: Better JSON cleaning and error handling
      try {
        // Remove any trailing commas before closing brackets/braces
        responseText = responseText.replace(/,(\s*[}\]])/g, '$1');
        
        // Parse JSON
        const recipes = JSON.parse(responseText);
        
        if (!Array.isArray(recipes)) {
          throw new Error('AI response is not an array');
        }
        
        return recipes;
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.log('📄 Raw response for debugging:', responseText);
        
        // ✅ FALLBACK: Try to extract recipes manually
        try {
          // Look for recipe objects in the text
          const recipeMatches = responseText.match(/"title":\s*"[^"]+"/g);
          if (recipeMatches && recipeMatches.length > 0) {
            console.log('🔧 Found recipe titles, creating fallback recipes...');
            
            // Create simple fallback recipes
            const fallbackRecipes = recipeMatches.slice(0, 5).map((match, index) => {
              const title = match.match(/"title":\s*"([^"]+)"/)?.[1] || `Recipe ${index + 1}`;
              return {
                id: `fallback_${index + 1}`,
                title: title,
                description: `A delicious ${categoryFilter || 'recipe'} that will satisfy your taste buds.`,
                difficulty: difficultyFilter || 'Easy',
                prepTime: 30,
                servings: 4,
                ingredients: [
                  { name: 'Main ingredient', quantity: '2', unit: 'cups', inStock: false },
                  { name: 'Secondary ingredient', quantity: '1', unit: 'piece', inStock: false },
                  { name: 'Seasoning', quantity: '1', unit: 'tsp', inStock: false }
                ],
                instructions: [
                  'Prepare all ingredients according to the recipe',
                  'Follow standard cooking methods for this dish',
                  'Cook until properly done and flavors are combined',
                  'Serve hot and enjoy!'
                ],
                category: categoryFilter || 'Main Course',
                cuisine: 'International',
                tags: ['popular', 'delicious']
              };
            });
            
            return fallbackRecipes;
          }
        } catch (fallbackError) {
          console.error('❌ Fallback creation failed:', fallbackError);
        }
        
        throw new Error('Could not parse AI response. Please try again.');
      }
      
      console.log('✅ Successfully parsed', recipes.length, 'recipes from AI');
      console.log('🔍 Recipe titles:', recipes.map(r => r.title));
      
      return recipes;
      
    } catch (error) {
      console.error('❌ Open AI generation failed:', error);
      throw error;
    }
  }, []);

  // ✅ MAIN: Generate recipes function
  const generateRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Generating OPEN recipes with REAL AI...');
      console.log('🎯 User selected filters:', preferences);

      // ✅ OPEN: Generate any recipes based on filters only
      const aiRecipes = await generateOpenRecipes(preferences);
      
      console.log('✅ AI Generated Recipes:', aiRecipes?.length || 0);
      console.log('🔍 First recipe structure:', aiRecipes?.[0]);

      if (!aiRecipes || aiRecipes.length === 0) {
        Alert.alert('No Recipes Generated', 'Could not generate recipes. Please try again.');
        return;
      }

      // ✅ PROCESS: Transform recipes for display
      const processedRecipes = aiRecipes.map((recipe, index) => {
        // Check which ingredients user has in stock
        const processedIngredients = (recipe.ingredients || []).map((ingredient, idx) => {
          const stockItem = stockItems?.find(item => 
            item.name.toLowerCase().includes(ingredient.name?.toLowerCase() || '') ||
            (ingredient.name?.toLowerCase() || '').includes(item.name?.toLowerCase())
          );

          return {
            id: idx.toString(),
            name: ingredient.name || `Ingredient ${idx + 1}`,
            quantity: ingredient.quantity || '1',
            unit: ingredient.unit || 'unit',
            inStock: !!stockItem,
            available: !!stockItem
          };
        });

        // Calculate availability percentage
        const availableCount = processedIngredients.filter(ing => ing.inStock).length;
        const availabilityPercentage = processedIngredients.length > 0 
          ? Math.round((availableCount / processedIngredients.length) * 100) 
          : 0;

        return {
          id: recipe.id || `open_recipe_${index}_${Date.now()}`,
          title: recipe.title || `Recipe ${index + 1}`,
          description: recipe.description || 'Delicious recipe from around the world',
          difficulty: recipe.difficulty || 'Easy',
          cookingTime: recipe.prepTime ? `${recipe.prepTime} minutes` : '30 minutes',
          servings: recipe.servings || 4,
          ingredients: processedIngredients,
          instructions: Array.isArray(recipe.instructions) 
            ? recipe.instructions 
            : [
                'Follow the cooking instructions',
                'Prepare ingredients as described',
                'Cook according to recipe requirements',
                'Serve and enjoy!'
              ],
          availabilityPercentage,
          availablePercentage: availabilityPercentage,
          nutritionalInfo: recipe.nutritionalInfo || {
            calories: Math.floor(Math.random() * 500) + 200,
            protein: Math.floor(Math.random() * 40) + 10,
            carbs: Math.floor(Math.random() * 60) + 20,
            fat: Math.floor(Math.random() * 30) + 5
          },
          tags: recipe.tags || ['ai-generated', 'popular'],
          source: 'AI Generated',
          isAIGenerated: true,
          isGenerated: true,
          prepTime: recipe.prepTime || 30,
          category: recipe.category || 'Main Course',
          cuisine: recipe.cuisine || 'International'
        };
      });

      console.log('✅ Final processed recipes:', processedRecipes.length);
      setRecipes(processedRecipes);

      Alert.alert(
        'Success! 🎉',
        `Generated ${processedRecipes.length} amazing recipes${preferences.category !== 'all' ? ` for ${preferences.category}` : ''}!`
      );

    } catch (error) {
      console.error('❌ Error generating recipes:', error);
      setError(error.message);
      
      Alert.alert(
        'Error',
        `Failed to generate recipes: ${error.message}`,
        [
          { text: 'Retry', onPress: generateRecipes },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  }, [preferences, stockItems, generateOpenRecipes]);

  // Filter recipes (should pass through since AI generates according to filters)
  const filteredRecipes = recipes.filter(recipe => {
    const difficulty = preferences?.difficulty || 'all';
    const prepTime = preferences?.prepTime || 'all';
    const category = preferences?.category || 'all';

    if (difficulty !== 'all' && recipe.difficulty !== difficulty) {
      return false;
    }
    
    if (prepTime !== 'all') {
      const time = recipe.prepTime || parseInt(recipe.cookingTime);
      if (prepTime === 'quick' && time > 30) return false;
      if (prepTime === 'medium' && (time <= 30 || time > 60)) return false;
      if (prepTime === 'long' && time <= 60) return false;
    }

    if (category !== 'all' && recipe.category !== category) {
      return false;
    }

    return true;
  });

  // ✅ CORRIGIDO: Função melhorada para adicionar ingredientes à lista
  const addMissingIngredientsToShoppingList = useCallback(async (recipe) => {
    try {
      const missingIngredients = recipe.ingredients.filter(ing => !ing.inStock);
      
      if (missingIngredients.length === 0) {
        Alert.alert('Perfect!', 'You already have all the ingredients! 🎉');
        return;
      }

      console.log('🛒 Found', missingIngredients.length, 'missing ingredients for:', recipe.title);
      console.log('📋 Available lists:', lists?.length || 0);

      // Check if there are any lists available
      if (!lists || lists.length === 0) {
        Alert.alert(
          'No Lists Found',
          'You need to create at least one shopping list first.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Create List',
              onPress: async () => {
                const result = await createShoppingList('My Shopping List', true);
                if (result.success) {
                  // Store recipe and try again after a brief delay
                  setTimeout(() => {
                    setPendingRecipe({ recipe, missingIngredients });
                    setShowListModal(true);
                  }, 500);
                }
              }
            }
          ]
        );
        return;
      }

      // Store recipe temporarily and show modal
      setPendingRecipe({ recipe, missingIngredients });
      setShowListModal(true);
      
    } catch (error) {
      console.error('❌ Error in addMissingIngredientsToShoppingList:', error);
      Alert.alert('Error', 'Could not process ingredients: ' + error.message);
    }
  }, [lists, createShoppingList]);

  // ✅ CORRIGIDO: Handle list selection from modal usando addMultipleItems
  const handleSelectList = async (selectedList) => {
    setShowListModal(false);
    
    if (!pendingRecipe || !pendingRecipe.missingIngredients) {
      console.log('❌ No pending recipe or ingredients');
      Alert.alert('Error', 'No ingredients to add');
      return;
    }
    
    try {
      console.log('🎯 User selected list:', selectedList.name, '(ID:', selectedList.id, ')');
      console.log('📝 Current list before operation:', currentList?.name);
      
      // Preparar ingredientes no formato esperado
      const ingredientsToAdd = pendingRecipe.missingIngredients.map(ingredient => ({
        name: ingredient.name,
        quantity: ingredient.quantity || 1,
        unit: ingredient.unit || 'unit',
        notes: `From recipe: ${pendingRecipe.recipe.title}`
      }));

      console.log('🛒 Calling addMultipleItems with', ingredientsToAdd.length, 'ingredients');
      console.log('📋 Target list ID:', selectedList.id);

      // ✅ USAR: Nova função addMultipleItems
      const result = await addMultipleItems(ingredientsToAdd, selectedList.id);
      
      console.log('📊 Addition result:', result);
      
      if (result.success) {
        const message = result.addedCount === result.totalCount
          ? `All ${result.addedCount} ingredients added to "${selectedList.name}"! 🎉`
          : `${result.addedCount} of ${result.totalCount} ingredients added to "${selectedList.name}".`;
        
        Alert.alert(
          'Added to List! 🛒',
          message,
          [
            { text: 'OK' },
            { 
              text: 'View List', 
              onPress: async () => {
                // Garantir que estamos visualizando a lista correta
                await selectList(selectedList.id);
                router.push('/(auth)/Shopping_list');
              }
            }
          ]
        );

        if (result.failedItems.length > 0) {
          console.log('⚠️ Some items failed to add:', result.failedItems);
        }
      } else {
        Alert.alert(
          'Error Adding Ingredients',
          result.error || `Could not add ingredients to "${selectedList.name}".`,
          [{ text: 'OK' }]
        );
      }
      
      setPendingRecipe(null);
      
    } catch (error) {
      console.error('❌ Error in handleSelectList:', error);
      Alert.alert('Error', 'Could not add to shopping list: ' + error.message);
      setPendingRecipe(null);
    }
  };

  // Handle creating new list from modal
  const handleCreateNewList = async (listName) => {
    try {
      console.log('📝 Creating new list:', listName);
      const result = await createShoppingList(listName, true); // setAsCurrent = true
      console.log('✅ List creation result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error creating list:', error);
      return { success: false, error: error.message };
    }
  };

  const handleViewDetails = useCallback((recipe) => {
    router.push({
      pathname: `/(auth)/recipe/${recipe.id}`,
      params: { 
        recipeData: JSON.stringify(recipe),
        fromSuggestions: 'true'
      }
    });
  }, [router]);

  const renderRecipeItem = useCallback(({ item }) => (
    <RecipeSuggestion
      recipe={item}
      onViewDetails={() => handleViewDetails(item)}
      onAddIngredientsToList={() => addMissingIngredientsToShoppingList(item)}
      showAllIngredients={true}
      style={styles.recipeCard}
      disabled={isAddingItems}
    />
  ), [handleViewDetails, addMissingIngredientsToShoppingList, isAddingItems]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="restaurant-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Recipes Generated</Text>
      <Text style={styles.emptyText}>
        Generate AI recipes from around the world based on your preferences
      </Text>
      <TouchableOpacity 
        style={styles.generateButton} 
        onPress={generateRecipes}
        disabled={loading || stockLoading || isAddingItems}
      >
        <Ionicons name="sparkles" size={20} color="#FFFFFF" />
        <Text style={styles.generateButtonText}>Generate Recipes</Text>
      </TouchableOpacity>
    </View>
  );

  // Simple loading state
  if (stockLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B0082" />
          <Text style={styles.loadingText}>Loading your ingredients...</Text>
        </View>
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
          onPress={() => router.push('/(auth)/HomeScreen')}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>AI Recipe Discovery</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={generateRecipes}
          disabled={loading || isAddingItems}
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
          <Text style={styles.loadingText}>Discovering amazing recipes...</Text>
          <Text style={styles.loadingSubtext}>
            {preferences.category !== 'all' && `Finding ${preferences.category} recipes`}
            {preferences.difficulty !== 'all' && ` with ${preferences.difficulty} difficulty`}
            {preferences.prepTime !== 'all' && ` for ${preferences.prepTime} preparation`}
          </Text>
        </View>
      ) : isAddingItems ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B0082" />
          <Text style={styles.loadingText}>Adding ingredients to shopping list...</Text>
          <Text style={styles.loadingSubtext}>Please wait while we add your items to the selected list</Text>
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

      {/* Floating Generate Button */}
      {!loading && !isAddingItems && filteredRecipes.length === 0 && (
        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity 
            style={styles.floatingButton}
            onPress={generateRecipes}
            disabled={loading || isAddingItems}
          >
            <Ionicons name="sparkles" size={24} color="#FFFFFF" />
            <Text style={styles.floatingButtonText}>Discover Recipes</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List Selection Modal */}
      <SelectListModal
        visible={showListModal}
        onClose={() => {
          setShowListModal(false);
          setPendingRecipe(null);
        }}
        lists={lists}
        onSelectList={handleSelectList}
        onCreateNewList={handleCreateNewList}
        disabled={isAddingItems}
      />
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