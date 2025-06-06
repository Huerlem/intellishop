// services/recipeApiService.js - HYBRID OPTIMIZED VERSION
import { GoogleGenerativeAI } from '@google/generative-ai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { handleError } from '@/errors/errorHandler';

// Get API key from environment variables
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Cache configuration - COMBINING YOUR TWO VERSIONS
const RECIPE_CACHE_KEY = 'recipe_cache';
const RECIPES_CACHE_KEY = '@recipes:suggestions'; // Keeping your original key
const FAVORITES_KEY = '@recipes:favorites'; // Keeping your favorites functionality
const CACHE_EXPIRY_HOURS = 24;
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting
let requestCount = 0;
const MAX_REQUESTS_PER_MINUTE = 15;
const RATE_LIMIT_RESET_TIME = 60000; // 1 minute

// Reset rate limit counter every minute
setInterval(() => {
  requestCount = 0;
}, RATE_LIMIT_RESET_TIME);

// Check rate limit
const checkRateLimit = () => {
  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    throw new Error('Rate limit exceeded. Please wait a moment before making another request.');
  }
  requestCount++;
};

// Cache helper functions - OPTIMIZED
const getCachedRecipes = async (cacheKey) => {
  try {
    const cached = await AsyncStorage.getItem(`${RECIPE_CACHE_KEY}_${cacheKey}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const now = new Date().getTime();
      const cacheAge = now - timestamp;
      
      if (cacheAge < CACHE_EXPIRY_HOURS * 60 * 60 * 1000) {
        return data;
      }
    }
    return null;
  } catch (error) {
    console.warn('Failed to get cached recipes:', error);
    return null;
  }
};

const setCachedRecipes = async (cacheKey, data) => {
  try {
    const cacheData = {
      data,
      timestamp: new Date().getTime()
    };
    await AsyncStorage.setItem(`${RECIPE_CACHE_KEY}_${cacheKey}`, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache recipes:', error);
  }
};

/**
 * Generate recipe suggestions using Gemini - MAIN HYBRID FUNCTION
 * Combines both your implementations
 */
export const generateRecipeSuggestions = async (ingredients = [], preferences = {}) => {
  try {
    checkRateLimit();

    // Check if there are ingredients
    if (!ingredients || ingredients.length === 0) {
      throw new Error('Please provide ingredients for recipe suggestions');
    }

    // Create cache key based on ingredients
    const cacheKey = ingredients.sort().join('_').toLowerCase();
    
    // Check cache first
    const cachedRecipes = await getCachedRecipes(cacheKey);
    if (cachedRecipes) {
      return cachedRecipes;
    }

    // Prepare ingredients list - COMPATIBLE WITH BOTH YOUR FORMATS
    const ingredientsList = ingredients.map(item => 
      typeof item === 'string' ? item : item.name || item.title || item
    ).filter(Boolean);

    // Create prompt for Gemini - ENHANCED WITH YOUR SPECIFICATIONS
    const prompt = `
Generate 5 creative and practical recipe suggestions using these available ingredients: ${ingredientsList.join(', ')}.

${preferences.dietary ? `Dietary preferences: ${preferences.dietary}` : ''}
${preferences.cuisine ? `Preferred cuisine: ${preferences.cuisine}` : ''}
${preferences.difficulty ? `Difficulty level: ${preferences.difficulty}` : ''}

For each recipe, provide:
1. Recipe name
2. Brief description (1-2 sentences)
3. Main ingredients needed (from the available list)
4. Estimated cooking time
5. Difficulty level (Easy/Medium/Hard)
6. Brief cooking instructions (3-4 steps)
7. Approximate nutritional information

Format the response as a JSON array with this structure:
[
  {
    "id": "unique_identifier",
    "title": "Recipe Name",
    "name": "Recipe Name", 
    "description": "Brief description",
    "ingredients": [
      {
        "name": "ingredient name",
        "quantity": required_quantity,
        "unit": "unit of measure",
        "inStock": true
      }
    ],
    "cookingTime": "30 minutes",
    "prepTime": 30,
    "difficulty": "Easy",
    "instructions": ["Step 1", "Step 2", "Step 3"],
    "steps": [
      {"number": 1, "instruction": "Detailed step 1"},
      {"number": 2, "instruction": "Detailed step 2"}
    ],
    "category": "Main Dish/Dessert/Appetizer/etc",
    "servings": 4,
    "nutritionalInfo": {
      "calories": approximate_kcal_value,
      "protein": value_in_g,
      "carbs": value_in_g,
      "fat": value_in_g
    }
  }
]

Return only valid JSON, no additional text.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let recipes;
    try {
      // Clean the response to ensure it's valid JSON
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      recipes = JSON.parse(cleanedText);
    } catch (parseError) {
      console.warn('Failed to parse JSON response, attempting to extract recipes:', parseError);
      
      // Fallback: create simple recipes if JSON parsing fails
      recipes = [
        {
          id: uuidv4(),
          title: "Quick Meal with Available Ingredients",
          name: "Quick Meal with Available Ingredients",
          description: `A simple dish using ${ingredientsList.slice(0, 3).join(', ')}`,
          ingredients: ingredientsList.slice(0, 5).map(ing => ({
            name: ing,
            quantity: 1,
            unit: "portion",
            inStock: true
          })),
          cookingTime: "25 minutes",
          prepTime: 25,
          difficulty: "Easy",
          instructions: [
            "Prepare all ingredients",
            "Cook according to your preferred method",
            "Season to taste",
            "Serve hot"
          ],
          steps: [
            {number: 1, instruction: "Prepare all ingredients"},
            {number: 2, instruction: "Cook according to your preferred method"},
            {number: 3, instruction: "Season to taste"},
            {number: 4, instruction: "Serve hot"}
          ],
          category: "Main Dish",
          servings: 2,
          nutritionalInfo: {
            calories: 300,
            protein: 15,
            carbs: 30,
            fat: 10
          }
        }
      ];
    }

    // Ensure all recipes have required fields - COMPATIBILITY WITH BOTH YOUR VERSIONS
    const processedRecipes = recipes.map(recipe => {
      // Ensure ingredients is an array of objects
      const processedIngredients = Array.isArray(recipe.ingredients) 
        ? recipe.ingredients.map(ing => {
            if (typeof ing === 'string') {
              return {
                name: ing,
                quantity: 1,
                unit: "portion",
                inStock: ingredientsList.includes(ing.toLowerCase())
              };
            }
            return {
              name: ing.name || ing,
              quantity: ing.quantity || 1,
              unit: ing.unit || "portion",
              inStock: ing.inStock !== undefined ? ing.inStock : ingredientsList.some(available => 
                available.toLowerCase().includes(ing.name?.toLowerCase() || ing.toLowerCase())
              )
            };
          })
        : ingredientsList.slice(0, 5).map(ing => ({
            name: ing,
            quantity: 1,
            unit: "portion",
            inStock: true
          }));

      return {
        id: recipe.id || uuidv4(),
        title: recipe.title || recipe.name || 'Untitled Recipe',
        name: recipe.name || recipe.title || 'Untitled Recipe',
        description: recipe.description || 'A delicious recipe using your ingredients',
        ingredients: processedIngredients,
        cookingTime: recipe.cookingTime || '30 minutes',
        prepTime: recipe.prepTime || 30,
        difficulty: recipe.difficulty || 'Easy',
        instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [
          'Prepare ingredients',
          'Cook as desired',
          'Season to taste',
          'Serve'
        ],
        steps: Array.isArray(recipe.steps) ? recipe.steps : (
          Array.isArray(recipe.instructions) ? recipe.instructions.map((inst, idx) => ({
            number: idx + 1,
            instruction: inst
          })) : [
            {number: 1, instruction: "Prepare ingredients"},
            {number: 2, instruction: "Cook as desired"},
            {number: 3, instruction: "Season to taste"},
            {number: 4, instruction: "Serve"}
          ]
        ),
        category: recipe.category || 'Main Dish',
        servings: recipe.servings || 2,
        nutritionalInfo: recipe.nutritionalInfo || {
          calories: 300,
          protein: 15,
          carbs: 30,
          fat: 10
        }
      };
    });

    // Cache the results
    await setCachedRecipes(cacheKey, processedRecipes);

    // Also save in your original cache format for compatibility
    await AsyncStorage.setItem(RECIPES_CACHE_KEY, JSON.stringify({
      data: processedRecipes,
      timestamp: Date.now()
    }));

    return processedRecipes;

  } catch (error) {
    handleError(error, {
      title: 'Failed to generate recipe suggestions',
      showAlert: false,
      logToAnalytics: true,
    });

    // Try to recover from cache in case of error
    try {
      const cached = await AsyncStorage.getItem(RECIPES_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY_TIME) {
          return data;
        }
      }
    } catch (cacheError) {
      console.error('Error recovering recipe cache:', cacheError);
    }

    // Return fallback recipes
    return [
      {
        id: uuidv4(),
        title: "Simple Meal",
        name: "Simple Meal",
        description: "A basic recipe using your available ingredients",
        ingredients: ingredients.slice(0, 5).map(ing => ({
          name: typeof ing === 'string' ? ing : ing.name,
          quantity: 1,
          unit: "portion",
          inStock: true
        })),
        cookingTime: "20 minutes",
        prepTime: 20,
        difficulty: "Easy",
        instructions: [
          "Gather your ingredients",
          "Cook using your preferred method",
          "Season to taste",
          "Enjoy your meal"
        ],
        steps: [
          {number: 1, instruction: "Gather your ingredients"},
          {number: 2, instruction: "Cook using your preferred method"},
          {number: 3, instruction: "Season to taste"},
          {number: 4, instruction: "Enjoy your meal"}
        ],
        category: "Main Dish",
        servings: 2,
        nutritionalInfo: {
          calories: 250,
          protein: 12,
          carbs: 25,
          fat: 8
        }
      }
    ];
  }
};

/**
 * ALIAS: generateRecipesWithAI - FOR COMPATIBILITY WITH YOUR EXISTING CODE
 */
export const generateRecipesWithAI = async (stockItems) => {
  try {
    // Verify if there are stock items
    if (!stockItems || stockItems.length === 0) {
      throw new Error('No stock items provided for recipe suggestions');
    }

    // Filter food items only
    const foodCategories = ['dairy', 'produce', 'meat', 'bakery', 'grains', 'canned', 'frozen', 'spices', 'condiments'];
    const foodItems = stockItems.filter(item => 
      foodCategories.includes(item.category?.toLowerCase()) || !item.category
    );

    // Use the main function
    const recipes = await generateRecipeSuggestions(foodItems);

    // Mark which ingredients are in stock (your original logic)
    const recipesWithStockInfo = recipes.map(recipe => {
      const ingredients = recipe.ingredients.map(ingredient => {
        const inStock = stockItems.some(item => 
          item.name.toLowerCase().includes(ingredient.name.toLowerCase()) ||
          ingredient.name.toLowerCase().includes(item.name.toLowerCase())
        );
        return { ...ingredient, inStock };
      });
      
      return { 
        ...recipe, 
        ingredients
      };
    });

    return recipesWithStockInfo;

  } catch (error) {
    console.error('Error generating recipes with AI:', error);
    throw error;
  }
};

/**
 * Get detailed recipe information - ENHANCED VERSION
 */
export const getRecipeDetails = async (recipeId, recipeName) => {
  try {
    checkRateLimit();

    const cacheKey = `detail_${recipeId || recipeName}`;
    const cachedDetail = await getCachedRecipes(cacheKey);
    if (cachedDetail) {
      return cachedDetail;
    }

    const prompt = `
Provide detailed information for the recipe: "${recipeName}".

Include:
1. Detailed ingredient list with quantities
2. Step-by-step cooking instructions
3. Cooking tips and tricks
4. Nutritional information (if possible)
5. Variations or substitutions
6. Storage instructions

Format as JSON:
{
  "name": "Recipe Name",
  "detailedIngredients": [
    {"name": "ingredient", "amount": "quantity", "unit": "unit"}
  ],
  "detailedInstructions": [
    {"step": 1, "instruction": "detailed step", "duration": "time if applicable"}
  ],
  "tips": ["tip1", "tip2"],
  "nutrition": {
    "calories": "approximate calories",
    "servings": "number of servings"
  },
  "variations": ["variation1", "variation2"],
  "storage": "storage instructions"
}

Return only valid JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let recipeDetail;
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      recipeDetail = JSON.parse(cleanedText);
    } catch (parseError) {
      // Fallback detail
      recipeDetail = {
        name: recipeName,
        detailedIngredients: [
          { name: "Main ingredients", amount: "As needed", unit: "" }
        ],
        detailedInstructions: [
          { step: 1, instruction: "Follow basic cooking principles", duration: "Varies" }
        ],
        tips: ["Use fresh ingredients", "Season to taste"],
        nutrition: {
          calories: "Varies",
          servings: "2-4"
        },
        variations: ["Add your favorite spices"],
        storage: "Store in refrigerator for up to 3 days"
      };
    }

    await setCachedRecipes(cacheKey, recipeDetail);
    return recipeDetail;

  } catch (error) {
    handleError(error, {
      title: 'Failed to get recipe details',
      showAlert: false,
      logToAnalytics: true,
    });

    return {
      name: recipeName,
      detailedIngredients: [],
      detailedInstructions: [],
      tips: [],
      nutrition: {},
      variations: [],
      storage: ""
    };
  }
};

/**
 * COMPATIBILITY: fetchRecipeDetails - YOUR ORIGINAL FUNCTION NAME
 */
export const fetchRecipeDetails = async (recipeId) => {
  try {
    // Try to recover from cache first
    const cached = await AsyncStorage.getItem(RECIPES_CACHE_KEY);
    if (cached) {
      const { data } = JSON.parse(cached);
      const recipe = data.find(r => r.id === recipeId);
      
      if (recipe) {
        // If recipe already has detailed steps, return directly
        if (recipe.steps && recipe.steps.length > 0) {
          return recipe;
        }
        
        // Otherwise, enrich recipe with detailed steps using Gemini
        const detailedRecipe = await enrichRecipeWithSteps(recipe);
        
        // Update cache with detailed recipe
        const updatedData = data.map(r => r.id === recipeId ? detailedRecipe : r);
        await AsyncStorage.setItem(RECIPES_CACHE_KEY, JSON.stringify({
          data: updatedData,
          timestamp: Date.now()
        }));
        
        return detailedRecipe;
      }
    }
    
    throw new Error('Recipe not found');
  } catch (error) {
    console.error('Error fetching recipe details:', error);
    throw error;
  }
};

/**
 * Function to enrich recipe with detailed steps - USING GEMINI
 */
async function enrichRecipeWithSteps(recipe) {
  try {
    checkRateLimit();

    const ingredientsText = recipe.ingredients
      .map(i => `${i.quantity} ${i.unit} of ${i.name}`)
      .join(', ');
    
    const prompt = `
Based on the recipe "${recipe.title}" with ingredients: ${ingredientsText},
generate detailed steps to prepare this recipe.

Provide the steps in JSON format:
{
  "steps": [
    { "number": 1, "instruction": "First step text" },
    { "number": 2, "instruction": "Second step text" }
  ],
  "nutritionalInfo": {
    "calories": value_in_kcal,
    "protein": value_in_g,
    "carbs": value_in_g,
    "fat": value_in_g
  }
}

Return only valid JSON.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();
    
    // Remove code blocks if present
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '');
    
    // Parse JSON
    const enrichment = JSON.parse(responseText);
    
    // Add new data to recipe
    return {
      ...recipe,
      steps: enrichment.steps || [],
      nutritionalInfo: enrichment.nutritionalInfo || {}
    };
  } catch (error) {
    console.error('Error enriching recipe with steps:', error);
    // Return original recipe if fails
    return {
      ...recipe,
      steps: [{ number: 1, instruction: "Sorry, could not generate detailed steps." }],
      nutritionalInfo: { calories: 0, protein: 0, carbs: 0, fat: 0 }
    };
  }
}

/**
 * YOUR FAVORITES FUNCTIONALITY - KEEPING EXACTLY AS IS
 */

// Function to add/remove recipe from favorites
export const toggleFavoriteRecipe = async (recipeId) => {
  try {
    const favorites = await getFavoriteRecipes();
    
    if (favorites.includes(recipeId)) {
      // Remove from favorites
      const updated = favorites.filter(id => id !== recipeId);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return { isFavorite: false, favorites: updated };
    } else {
      // Add to favorites
      const updated = [...favorites, recipeId];
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return { isFavorite: true, favorites: updated };
    }
  } catch (error) {
    console.error('Error updating favorites:', error);
    return { error: 'Failed to update favorites' };
  }
};

// Function to check if a recipe is favorite
export const isRecipeFavorite = async (recipeId) => {
  try {
    const favorites = await getFavoriteRecipes();
    return favorites.includes(recipeId);
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
};

// Function to get all favorite recipes
export const getFavoriteRecipes = async () => {
  try {
    const favorites = await AsyncStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error getting favorite recipes:', error);
    return [];
  }
};

// Function to get favorite recipes with details
export const getFavoriteRecipesWithDetails = async () => {
  try {
    const favIds = await getFavoriteRecipes();
    
    if (favIds.length === 0) {
      return [];
    }
    
    // Get recipes from cache
    const cached = await AsyncStorage.getItem(RECIPES_CACHE_KEY);
    if (!cached) {
      return [];
    }
    
    const { data } = JSON.parse(cached);
    return data.filter(recipe => favIds.includes(recipe.id));
  } catch (error) {
    console.error('Error getting favorite details:', error);
    return [];
  }
};

// Function to add missing ingredients to shopping list
export const addMissingIngredientsToShoppingList = async (ingredients, addToList) => {
  try {
    const missingIngredients = ingredients.filter(ing => !ing.inStock);
    
    for (const ingredient of missingIngredients) {
      await addToList({
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        checked: false,
        note: 'Added from recipe'
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error adding ingredients to list:', error);
    return false;
  }
};

// Clear recipe cache
export const clearRecipeCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const recipeKeys = keys.filter(key => key.startsWith(RECIPE_CACHE_KEY));
    await AsyncStorage.multiRemove(recipeKeys);
    
    // Also clear your original cache
    await AsyncStorage.removeItem(RECIPES_CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear recipe cache:', error);
  }
};