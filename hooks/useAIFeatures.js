import { useContext } from 'react';
import { AIContext } from '@/context/AIContext';
import { AuthContext } from '@/context/AuthContext';
import { useStock } from '@/hooks/useStock';
import {
  makeGeminiRequest,
  parseGeminiJSON
} from '@/lib/gemini';

// 🔧 IMPORTAR SEU PRICE COMPARISON SERVICE COM APIs REAIS
import { 
  getItemPriceComparison,
  analyzeShoppingListPrices 
} from '@/services/priceComparison';

/**
 * Custom hook to access AI functionality using Gemini API + REAL UK PRICE APIs
 */
export const useAIFeatures = () => {
  const context = useContext(AIContext);
  const { user } = useContext(AuthContext);
  const { stockItems } = useStock();

  if (!context) throw new Error('useAIFeatures must be used within an AIProvider');

  const {
    greetingMessage,
    suggestions,
    recipes,
    loading,
    error,
    generateGreeting,
    generateShoppingList,
    acceptSuggestion,
    rejectSuggestion,
    regenerateSuggestion,
    generateRecipeSuggestions,
    fetchSuggestions,
    fetchRecipes,
    aiEnabled,
    setAiEnabled,
    toggleAI,
    setSuggestions,
    setRecipes,
  } = context;

  // ---------------------------
  // Utility helpers
  // ---------------------------
  const getLatestSuggestion = () => suggestions?.[0] || null;
  const getPendingSuggestions = () => suggestions?.filter(s => s.status === 'pending') || [];
  const getAcceptedSuggestions = () => suggestions?.filter(s => s.status === 'accepted') || [];
  const hasPendingSuggestions = () => getPendingSuggestions().length > 0;

  const getMissedIngredientsCount = (recipe) =>
    recipe?.ingredients?.filter(i => !i.inStock)?.length || 0;

  const getRecipesByDifficulty = (difficulty) =>
    recipes?.filter(r => r.difficulty?.toLowerCase() === difficulty.toLowerCase()) || [];

  const getQuickRecipes = (maxMinutes = 30) =>
    recipes?.filter(r => r.prepTime <= maxMinutes) || [];

  // ---------------------------
  // 🔧 FUNÇÃO COM APIs REAIS: getPriceComparison
  // ---------------------------

  const getPriceComparison = async (itemName) => {
    try {
      console.log('🔍 Getting price comparison for:', itemName);
      
      // 🔧 PRIORIDADE 1: USAR SUAS APIs REAIS
      if (user?.uid) {
        console.log('📡 Trying real APIs first...');
        
        try {
          const realPriceData = await getItemPriceComparison(itemName, user.uid);
          
          if (realPriceData.success && realPriceData.results?.results) {
            console.log('✅ Real price data obtained from APIs');
            
            // 🔧 CONVERTER FORMATO PARA COMPATIBILIDADE
            const convertedData = {
              stores: realPriceData.results.results.map(store => ({
                name: store.storeName,
                price: store.price.toFixed(2),
                url: store.url,
                inStock: store.inStock,
                lastUpdated: store.lastUpdated || new Date().toISOString()
              })),
              lastUpdated: realPriceData.results.createdAt || new Date().toISOString(),
              source: 'real_apis' // 🔧 INDICADOR DE FONTE REAL
            };
            
            return convertedData;
          } else {
            console.log('⚠️ Real APIs failed, trying AI fallback...');
          }
          
        } catch (apiError) {
          console.log('⚠️ Real APIs error:', apiError.message);
          console.log('🔄 Falling back to AI prices...');
        }
      }
      
      // 🔧 PRIORIDADE 2: AI FALLBACK (CLARAMENTE MARCADO COMO ESTIMATIVA)
      console.log('🤖 Using AI-generated price estimates...');
      
      const prompt = `Generate realistic UK supermarket price estimates for "${itemName}".

IMPORTANT: Return ONLY valid JSON, no explanations.

Required JSON format:
{
  "stores": [
    {"name": "Tesco", "price": "2.50"},
    {"name": "Sainsbury's", "price": "2.40"},
    {"name": "Asda", "price": "2.20"},
    {"name": "Morrisons", "price": "2.35"},
    {"name": "Aldi", "price": "1.85"},
    {"name": "Lidl", "price": "1.90"}
  ],
  "lastUpdated": "${new Date().toISOString()}"
}

Generate realistic UK prices for ${itemName}. Return ONLY the JSON object.`;

      const raw = await makeGeminiRequest(prompt);
      
      // 🔧 PARSING ROBUSTO
      let data = null;
      
      try {
        data = JSON.parse(raw);
        console.log('✅ AI JSON parsed successfully (direct)');
      } catch (directParseError) {
        // Tentar extrair JSON do texto
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            data = JSON.parse(jsonMatch[0]);
            console.log('✅ AI JSON parsed successfully (extracted)');
          } catch (extractParseError) {
            console.log('⚠️ AI JSON parsing failed, using fallback');
            data = generateLocalFallbackPrices(itemName);
          }
        } else {
          data = generateLocalFallbackPrices(itemName);
        }
      }
      
      // 🔧 VALIDAR E FORMATAR
      if (!data || !data.stores || !Array.isArray(data.stores)) {
        data = generateLocalFallbackPrices(itemName);
      }
      
      // Limpar preços e ordenar
      data.stores = data.stores.map(store => ({
        ...store,
        price: typeof store.price === 'string' 
          ? store.price.replace('£', '').trim()
          : store.price?.toString() || '2.50'
      }));
      
      data.stores.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      data.source = 'ai_estimates'; // 🔧 MARCAR COMO ESTIMATIVA
      
      console.log('🤖 AI price estimates generated');
      return data;
      
    } catch (err) {
      console.error('❌ All price methods failed:', err);
      const fallbackData = generateLocalFallbackPrices(itemName);
      fallbackData.source = 'local_fallback';
      return fallbackData;
    }
  };

  // 🔧 NOVA FUNÇÃO: Análise completa de lista (USANDO APIs REAIS)
  const getShoppingListAnalysis = async (items) => {
    try {
      if (!user?.uid || !items || items.length === 0) {
        throw new Error('User not authenticated or no items provided');
      }
      
      console.log('📊 Analyzing shopping list with real APIs...');
      
      const analysis = await analyzeShoppingListPrices(items, user.uid);
      
      if (analysis.success) {
        console.log('✅ Real shopping list analysis completed');
        return {
          ...analysis,
          source: 'real_apis'
        };
      } else {
        throw new Error(analysis.error || 'Analysis failed');
      }
      
    } catch (error) {
      console.error('❌ Shopping list analysis failed:', error);
      
      // Fallback para estimativas simples
      const fallbackAnalysis = {
        success: true,
        source: 'fallback_estimates',
        storeAnalysis: [
          { storeName: 'Aldi', total: 25.50, savings: 8.50 },
          { storeName: 'Lidl', total: 27.20, savings: 6.80 },
          { storeName: 'Asda', total: 29.80, savings: 4.20 },
          { storeName: 'Tesco', total: 32.40, savings: 1.60 },
          { storeName: 'Morrisons', total: 33.20, savings: 0.80 },
          { storeName: "Sainsbury's", total: 34.00, savings: 0.00 }
        ],
        bestValue: { storeName: 'Aldi', total: 25.50 },
        itemCount: items.length,
        timestamp: new Date()
      };
      
      return fallbackAnalysis;
    }
  };

  // 🔧 FUNÇÃO AUXILIAR: Gerar preços locais consistentes
  const generateLocalFallbackPrices = (itemName) => {
    const basePrice = 1.0 + (hashString(itemName) % 300) / 100;
    
    const stores = [
      { name: 'Tesco', multiplier: 1.0 },
      { name: "Sainsbury's", multiplier: 1.05 },
      { name: 'Asda', multiplier: 0.90 },
      { name: 'Morrisons', multiplier: 0.95 },
      { name: 'Aldi', multiplier: 0.75 },
      { name: 'Lidl', multiplier: 0.80 }
    ];
    
    return {
      stores: stores.map(store => ({
        name: store.name,
        price: (basePrice * store.multiplier * (0.9 + Math.random() * 0.2)).toFixed(2)
      })).sort((a, b) => parseFloat(a.price) - parseFloat(b.price)),
      lastUpdated: new Date().toISOString(),
      source: 'local_estimates'
    };
  };

  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  // ---------------------------
  // Funções AI existentes (mantidas)
  // ---------------------------

  const generateSmartShoppingList = async (budget, userFeedback = '') => {
    try {
      const prompt = `Create a smart grocery list based on:
- Pantry: ${JSON.stringify(stockItems)}
- Budget: £${budget}
- Notes: ${userFeedback}

Respond as JSON:
{
  "items": [
    { "name": "Item name", "quantity": "x", "estimatedCost": "£x.xx" }
  ]
}`;
      const raw = await makeGeminiRequest(prompt);
      const data = parseGeminiJSON(raw, { items: [] });
      setSuggestions(data.items);
      return data.items;
    } catch (err) {
      console.error('Smart shopping list generation failed:', err);
      return [];
    }
  };

  const getMealPlanSuggestions = async (days = 7, preferences = {}) => {
    try {
      const ingredients = stockItems.map(item => item.name || item.title).join(', ');
      const prompt = `Generate a ${days}-day meal plan using the following ingredients: ${ingredients}.
Preferences: ${JSON.stringify(preferences)}.

Respond with JSON:
{
  "recipes": [
    {
      "title": "Recipe name",
      "ingredients": ["item1", "item2"],
      "prepTime": 30,
      "difficulty": "easy"
    }
  ]
}`;
      const raw = await makeGeminiRequest(prompt);
      const result = parseGeminiJSON(raw, { recipes: [] });
      setRecipes(result.recipes);
      return result.recipes;
    } catch (err) {
      console.error('Failed to get meal plan suggestions:', err);
      return [];
    }
  };

  const refreshAllSuggestions = async () => {
    try {
      await Promise.all([
        fetchSuggestions(),
        fetchRecipes(),
        generateGreeting(),
      ]);
    } catch (err) {
      console.error('Failed to refresh all AI features:', err);
    }
  };

  const clearAllSuggestions = () => {
    setSuggestions([]);
    setRecipes([]);
  };

  // ---------------------------
  // Return hook API
  // ---------------------------

  return {
    greetingMessage,
    suggestions,
    recipes,
    loading,
    error,
    aiEnabled,
    setAiEnabled,
    toggleAI,

    // Gemini-based AI actions
    generateGreeting,
    generateSmartShoppingList,
    generateRecipeSuggestions,
    fetchSuggestions,
    fetchRecipes,

    // Suggestion control
    acceptSuggestion,
    rejectSuggestion,
    regenerateSuggestion,

    // Utility
    getLatestSuggestion,
    getPendingSuggestions,
    getAcceptedSuggestions,
    hasPendingSuggestions,
    getMissedIngredientsCount,
    getRecipesByDifficulty,
    getQuickRecipes,

    // 🔧 PRICE COMPARISON COM APIs REAIS + AI FALLBACK
    getPriceComparison,
    getShoppingListAnalysis, // 🔧 NOVA FUNÇÃO PARA ANÁLISE COMPLETA
    getMealPlanSuggestions,
    refreshAllSuggestions,
    clearAllSuggestions,
  };
};

export default useAIFeatures;