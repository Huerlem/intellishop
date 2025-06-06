// services/smartShoppingService.js - HYBRID VERSION (ALL ENGLISH)
import { GoogleGenerativeAI } from '@google/generative-ai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleError } from '@/errors/errorHandler';

// Get API key from environment variables
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Cache keys - COMBINING BOTH YOUR VERSIONS
const SMART_SHOPPING_CACHE_KEY = 'smart_shopping_cache';
const SMART_SHOPPING_LISTS_KEY = '@shopping:smartLists'; // Your original key
const CACHE_EXPIRY_HOURS = 6; // Smart suggestions expire faster
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting
let requestCount = 0;
const MAX_REQUESTS_PER_MINUTE = 15;
const RATE_LIMIT_RESET_TIME = 60000;

setInterval(() => {
  requestCount = 0;
}, RATE_LIMIT_RESET_TIME);

const checkRateLimit = () => {
  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    throw new Error('Rate limit exceeded. Please wait a moment.');
  }
  requestCount++;
};

// Cache helpers
const getCachedSuggestions = async (cacheKey) => {
  try {
    const cached = await AsyncStorage.getItem(`${SMART_SHOPPING_CACHE_KEY}_${cacheKey}`);
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
    console.warn('Failed to get cached suggestions:', error);
    return null;
  }
};

const setCachedSuggestions = async (cacheKey, data) => {
  try {
    const cacheData = {
      data,
      timestamp: new Date().getTime()
    };
    await AsyncStorage.setItem(`${SMART_SHOPPING_CACHE_KEY}_${cacheKey}`, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache suggestions:', error);
  }
};

/**
 * MAIN FUNCTION: Generate smart shopping list - COMBINING YOUR TWO IMPLEMENTATIONS
 * @param {number} budget - Available budget
 * @param {Array} currentStock - Items currently in stock
 * @param {Array} shoppingHistory - Shopping history (optional)
 * @param {Object} preferences - User preferences (optional)
 * @returns {Promise<Object>} - Smart shopping list result
 */
export const generateSmartShoppingList = async (budget, currentStock, shoppingHistory = [], preferences = {}) => {
  try {
    checkRateLimit();

    // Organize input data - YOUR ORIGINAL LOGIC
    const stockItems = currentStock.map(item => ({
      name: item.name || item.title || item,
      quantity: item.quantity || 0,
      unit: item.unit || 'piece',
      category: item.category || 'general',
      lowStockThreshold: item.lowStockThreshold || item.minQuantity || 5,
      criticalStockThreshold: item.criticalStockThreshold || item.criticalMinQuantity || 1,
      expiryDate: item.expiryDate || null
    }));

    // Identify low and critical stock items - YOUR ORIGINAL LOGIC
    const lowStockItems = stockItems.filter(
      item => item.quantity <= item.lowStockThreshold && item.quantity > item.criticalStockThreshold
    );
    const criticalStockItems = stockItems.filter(
      item => item.quantity <= item.criticalStockThreshold
    );

    // Create comprehensive prompt for Gemini
    const prompt = `
Generate a smart shopping list based on the following information:

Available budget: £${budget}

Critical stock items (maximum priority for restocking):
${criticalStockItems.map(item => `- ${item.name} (${item.quantity} ${item.unit}, Category: ${item.category})`).join('\n')}

Low stock items (medium priority for restocking):
${lowStockItems.map(item => `- ${item.name} (${item.quantity} ${item.unit}, Category: ${item.category})`).join('\n')}

${shoppingHistory.length > 0 ? `
Recent shopping history (purchase frequency):
${shoppingHistory.slice(0, 10).map(item => `- ${item.name || item}`).join('\n')}
` : ''}

${preferences.dietaryRestrictions ? `
Dietary restrictions to consider:
${preferences.dietaryRestrictions}
` : ''}

${preferences.dietary ? `Dietary preferences: ${preferences.dietary}` : ''}
${preferences.budget ? `Budget considerations: ${preferences.budget}` : ''}
${preferences.cuisine ? `Cuisine preferences: ${preferences.cuisine}` : ''}

For each item in the shopping list, provide:
- name: item name
- quantity: recommended quantity to purchase
- unit: unit of measurement
- category: product category
- priority: priority level ("critical", "low", "regular")
- estimatedPrice: estimated item price in GBP
- reason: brief reason for including the item in the list

The generated shopping list should:
1. Prioritize restocking critical stock items
2. Include low stock items
3. Suggest complementary products based on history and consumption patterns
4. Respect the budget of £${budget}
5. Properly categorize items
6. Include essential everyday items

Return only a valid JSON array with the shopping list, without additional text.

Format:
[
  {
    "name": "item name",
    "quantity": number,
    "unit": "unit of measure",
    "category": "category",
    "priority": "critical/low/regular",
    "estimatedPrice": price_in_gbp,
    "reason": "brief reason"
  }
]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();
    
    // Clean up response (remove code blocks if present)
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '');
    
    // Parse JSON
    let shoppingList;
    try {
      shoppingList = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing Gemini JSON response:', parseError);
      
      // Fallback: create basic shopping list
      shoppingList = [
        ...criticalStockItems.map(item => ({
          name: item.name,
          quantity: Math.max(1, item.lowStockThreshold - item.quantity),
          unit: item.unit,
          category: item.category,
          priority: "critical",
          estimatedPrice: 2.50,
          reason: "Critical stock replenishment"
        })),
        ...lowStockItems.map(item => ({
          name: item.name,
          quantity: Math.max(1, item.lowStockThreshold - item.quantity),
          unit: item.unit,
          category: item.category,
          priority: "low",
          estimatedPrice: 2.00,
          reason: "Low stock replenishment"
        }))
      ];
    }

    // Check if we have an array
    if (!Array.isArray(shoppingList)) {
      throw new Error('API response is not an array of items');
    }

    // Calculate total budget used
    const totalEstimatedCost = shoppingList.reduce((total, item) => 
      total + (parseFloat(item.estimatedPrice) || 0), 0
    );

    // Add metadata to list - YOUR ORIGINAL FORMAT
    const smartShoppingResult = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      budget: budget,
      totalEstimatedCost: totalEstimatedCost,
      remainingBudget: budget - totalEstimatedCost,
      items: shoppingList
    };

    // Save to cache - BOTH FORMATS
    try {
      const cachedLists = await AsyncStorage.getItem(SMART_SHOPPING_LISTS_KEY);
      let lists = cachedLists ? JSON.parse(cachedLists) : [];
      lists = [smartShoppingResult, ...lists].slice(0, 10); // Keep only the 10 most recent lists
      await AsyncStorage.setItem(SMART_SHOPPING_LISTS_KEY, JSON.stringify(lists));
    } catch (cacheError) {
      console.warn('Error saving list to cache:', cacheError);
    }

    return smartShoppingResult;

  } catch (error) {
    console.error('Error generating smart shopping list:', error);
    handleError(error, {
      title: 'Failed to generate smart shopping list',
      showAlert: false,
      logToAnalytics: true,
    });
    throw error;
  }
};

/**
 * Generate smart shopping suggestions - ENHANCED VERSION
 */
export const generateSmartShoppingSuggestions = async (
  currentStock = [], 
  shoppingList = [], 
  userPreferences = {}
) => {
  try {
    checkRateLimit();

    // Create cache key
    const cacheKey = `smart_${currentStock.length}_${shoppingList.length}`;
    const cachedSuggestions = await getCachedSuggestions(cacheKey);
    if (cachedSuggestions) {
      return cachedSuggestions;
    }

    // Prepare data for analysis
    const stockItems = currentStock.map(item => ({
      name: item.name || item.title || item,
      quantity: item.quantity || 0,
      category: item.category || 'general',
      expiryDate: item.expiryDate || null
    }));

    const shoppingItems = shoppingList.map(item => ({
      name: item.name || item.title || item,
      quantity: item.quantity || 1,
      category: item.category || 'general',
      priority: item.priority || 'medium'
    }));

    const prompt = `
Analyze the current stock and shopping list to provide smart shopping suggestions.

CURRENT STOCK:
${stockItems.map(item => `- ${item.name} (Qty: ${item.quantity}, Category: ${item.category})`).join('\n')}

SHOPPING LIST:
${shoppingItems.map(item => `- ${item.name} (Qty: ${item.quantity}, Priority: ${item.priority})`).join('\n')}

USER PREFERENCES:
${userPreferences.dietary ? `Dietary: ${userPreferences.dietary}` : ''}
${userPreferences.budget ? `Budget: ${userPreferences.budget}` : ''}
${userPreferences.cuisine ? `Cuisine: ${userPreferences.cuisine}` : ''}

Provide smart suggestions in these categories:
1. URGENT ITEMS - Items that are running low or expired
2. COMPLEMENTARY ITEMS - Items that would go well with current stock/shopping list
3. SEASONAL SUGGESTIONS - Seasonal items or offers
4. MEAL PLANNING - Complete meal suggestions based on available items
5. BUDGET OPTIMIZATION - Ways to save money or get better value

Format as JSON:
{
  "urgent": [
    {"item": "item name", "reason": "why urgent", "priority": "high/medium/low"}
  ],
  "complementary": [
    {"item": "item name", "reason": "why suggested", "pairsWith": ["existing item"]}
  ],
  "seasonal": [
    {"item": "item name", "reason": "seasonal benefit", "season": "current season"}
  ],
  "mealPlanning": [
    {"meal": "meal name", "missingIngredients": ["ingredient1"], "description": "brief description"}
  ],
  "budgetTips": [
    {"tip": "money saving tip", "category": "category", "savings": "potential savings"}
  ]
}

Return only valid JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let suggestions;
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      suggestions = JSON.parse(cleanedText);
    } catch (parseError) {
      console.warn('Failed to parse smart suggestions, using fallback');
      suggestions = {
        urgent: [
          { item: "Basic essentials", reason: "Regular restocking needed", priority: "medium" }
        ],
        complementary: [
          { item: "Seasonal vegetables", reason: "Healthy additions", pairsWith: ["current meals"] }
        ],
        seasonal: [
          { item: "Fresh produce", reason: "Seasonal availability", season: "current" }
        ],
        mealPlanning: [
          { meal: "Quick meal", missingIngredients: ["versatile ingredients"], description: "Easy to prepare" }
        ],
        budgetTips: [
          { tip: "Buy in bulk for frequently used items", category: "general", savings: "10-20%" }
        ]
      };
    }

    // Ensure all categories exist
    const processedSuggestions = {
      urgent: suggestions.urgent || [],
      complementary: suggestions.complementary || [],
      seasonal: suggestions.seasonal || [],
      mealPlanning: suggestions.mealPlanning || [],
      budgetTips: suggestions.budgetTips || []
    };

    await setCachedSuggestions(cacheKey, processedSuggestions);
    return processedSuggestions;

  } catch (error) {
    handleError(error, {
      title: 'Failed to generate smart shopping suggestions',
      showAlert: false,
      logToAnalytics: true,
    });

    // Return basic fallback suggestions
    return {
      urgent: [],
      complementary: [],
      seasonal: [],
      mealPlanning: [],
      budgetTips: [
        { tip: "Make a shopping list to avoid impulse purchases", category: "general", savings: "15%" }
      ]
    };
  }
};

/**
 * Generate personalized deals and offers
 */
export const generatePersonalizedDeals = async (userPreferences = {}, purchaseHistory = []) => {
  try {
    checkRateLimit();

    const cacheKey = `deals_${Object.keys(userPreferences).length}`;
    const cachedDeals = await getCachedSuggestions(cacheKey);
    if (cachedDeals) {
      return cachedDeals;
    }

    const prompt = `
Generate personalized deal suggestions based on user preferences and history.

USER PREFERENCES:
${Object.entries(userPreferences).map(([key, value]) => `${key}: ${value}`).join('\n')}

RECENT PURCHASE CATEGORIES:
${purchaseHistory.map(item => item.category || 'general').join(', ')}

Suggest 5-8 potential deals/offers that would interest this user.

Format as JSON array:
[
  {
    "title": "Deal title",
    "description": "Deal description",
    "category": "category",
    "savings": "potential savings",
    "validUntil": "approximate validity",
    "relevanceReason": "why this is relevant to user"
  }
]

Return only valid JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let deals;
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      deals = JSON.parse(cleanedText);
    } catch (parseError) {
      deals = [
        {
          title: "Weekly Essentials Bundle",
          description: "Save on everyday essentials",
          category: "general",
          savings: "10%",
          validUntil: "End of week",
          relevanceReason: "Based on your regular shopping pattern"
        }
      ];
    }

    await setCachedSuggestions(cacheKey, deals);
    return deals;

  } catch (error) {
    handleError(error, {
      title: 'Failed to generate personalized deals',
      showAlert: false,
      logToAnalytics: true,
    });

    return [];
  }
};

/**
 * Optimize shopping route
 */
export const optimizeShoppingRoute = async (shoppingList = [], preferredStores = []) => {
  try {
    checkRateLimit();

    const prompt = `
Optimize shopping route for these items: ${shoppingList.map(item => item.name || item).join(', ')}

Preferred stores: ${preferredStores.join(', ') || 'Any local supermarket'}

Provide suggestions for:
1. Best stores for each category
2. Optimal shopping order
3. Time-saving tips

Format as JSON:
{
  "storeRecommendations": [
    {"store": "store name", "items": ["item1"], "reason": "why this store"}
  ],
  "shoppingOrder": [
    {"section": "store section", "items": ["item1"], "tip": "efficiency tip"}
  ],
  "timeSavingTips": ["tip1", "tip2"]
}

Return only valid JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let optimization;
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      optimization = JSON.parse(cleanedText);
    } catch (parseError) {
      optimization = {
        storeRecommendations: [
          { store: "Local supermarket", items: shoppingList.slice(0, 5), reason: "One-stop shopping" }
        ],
        shoppingOrder: [
          { section: "Produce", items: ["fruits", "vegetables"], tip: "Shop produce first for freshness" },
          { section: "Dairy", items: ["milk", "cheese"], tip: "Keep refrigerated items for last" }
        ],
        timeSavingTips: [
          "Make a list organized by store layout",
          "Shop during off-peak hours"
        ]
      };
    }

    return optimization;

  } catch (error) {
    handleError(error, {
      title: 'Failed to optimize shopping route',
      showAlert: false,
      logToAnalytics: true,
    });

    return {
      storeRecommendations: [],
      shoppingOrder: [],
      timeSavingTips: ["Make a shopping list before going to the store"]
    };
  }
};

/**
 * YOUR ORIGINAL FUNCTION: Gets the history of smart shopping lists
 */
export const getSmartShoppingHistory = async () => {
  try {
    const cachedLists = await AsyncStorage.getItem(SMART_SHOPPING_LISTS_KEY);
    return cachedLists ? JSON.parse(cachedLists) : [];
  } catch (error) {
    console.error('Error getting smart lists history:', error);
    return [];
  }
};

/**
 * YOUR ORIGINAL FUNCTION: Adds all items from a smart list to the current shopping list
 */
export const addSmartListToShoppingList = async (items, addToList) => {
  try {
    for (const item of items) {
      await addToList({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category || '',
        checked: false,
        note: item.reason || 'Added from smart list',
        estimatedPrice: item.estimatedPrice
      });
    }
    return true;
  } catch (error) {
    console.error('Error adding smart list to shopping list:', error);
    return false;
  }
};

/**
 * Clear smart shopping cache
 */
export const clearSmartShoppingCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const smartKeys = keys.filter(key => key.startsWith(SMART_SHOPPING_CACHE_KEY));
    await AsyncStorage.multiRemove(smartKeys);
    
    // Also clear your original cache
    await AsyncStorage.removeItem(SMART_SHOPPING_LISTS_KEY);
  } catch (error) {
    console.warn('Failed to clear smart shopping cache:', error);
  }
};