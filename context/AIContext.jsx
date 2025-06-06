// context/AIContext.jsx - VERSÃO SEM INTERFERÊNCIA
import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { StockContext } from '@/context/StockContext';
import { ShoppingListContext } from '@/context/ShoppingListContext';
import { collection, addDoc, getDocs, getDoc, updateDoc, doc, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { handleError } from '@/errors/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

// USANDO SEU GEMINI SERVICE EXISTENTE
import { 
  generateGreeting as geminiGreeting,
  generateSmartShoppingList,
  generateRecipesWithAI,
  generateFriendlyErrorMessage 
} from '@/services/geminiService';

//Create the AI Context
export const AIContext = createContext();

export function AIProvider({ children }) {
    //get authentication state and other contexts
    const { user, userData, isAuthenticated } = useContext(AuthContext);
    const { stockItems } = useContext(StockContext);
    const { createShoppingList } = useContext(ShoppingListContext);

    //State to manage AI Functionality - MANTENDO TODOS OS SEUS ESTADOS
    const [suggestions, setSuggestions] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [greetingMessage, setGreetingMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [apiQuotaExceeded, setApiQuotaExceeded] = useState(false);
    const [aiEnabled, setAiEnabled] = useState(true); // 🔧 SEMPRE ATIVADO POR PADRÃO
    
    //Generate greeting when the user login
    useEffect(() => {
        if (isAuthenticated && userData) {
            generateGreeting();
        }
    }, [isAuthenticated, userData]);

    // 🔧 REMOVER VERIFICAÇÃO QUE DESATIVA A IA
    useEffect(() => {
        const loadAIState = async () => {
            try {
                const saved = await AsyncStorage.getItem('aiEnabled');
                if (saved !== null) {
                    const savedState = JSON.parse(saved);
                    setAiEnabled(savedState);
                    console.log('✅ AI state loaded:', savedState);
                } else {
                    // Se não há configuração salva, definir como ativado
                    setAiEnabled(true);
                    await AsyncStorage.setItem('aiEnabled', JSON.stringify(true));
                    console.log('🔧 AI enabled by default');
                }
            } catch (err) {
                console.warn('⚠️ Erro ao carregar aiEnabled do AsyncStorage:', err);
                // Em caso de erro, manter ativado
                setAiEnabled(true);
            }
        };
      
        loadAIState();
    }, []);

    const toggleAI = async () => {
        try {
            const newState = !aiEnabled;
            setAiEnabled(newState);
            await AsyncStorage.setItem('aiEnabled', JSON.stringify(newState));
            console.log("🔄 Novo estado de IA:", newState);
        } catch (err) {
            console.warn('⚠️ Erro ao salvar aiEnabled no AsyncStorage:', err);
        }
    };

    // Function to track requests made in the last hour
    const getRequestsMadeInLastHour = () => {
        return 0; // By default we return 0 to allow requests.
    };
    
    // 🔧 FUNÇÃO SEMPRE RETORNA TRUE (SEM VERIFICAÇÕES RESTRITIVAS)
    const canMakeRequest = () => {
        // Verificações básicas apenas
        if (!isAuthenticated) {
            console.log('⚠️ User not authenticated');
            return false;
        }
        
        // Remover verificação de rede que pode falhar no web
        // if (typeof navigator !== 'undefined' && !navigator.onLine) {
        //     return false;
        // }

        if (apiQuotaExceeded) {
            console.log('⚠️ API quota exceeded');
            return false;
        }

        // Não verificar limite de requests por enquanto
        // const maxRequestsPerHour = 100;
        // const requestsMade = getRequestsMadeInLastHour();
        // if (requestsMade >= maxRequestsPerHour) {
        //     return false;
        // }
        
        console.log('✅ Request allowed');
        return true;
    };
    
    /**
     * Generate a personalised greeting to user - USANDO SEU GEMINI SERVICE
     */
    const generateGreeting = async () => {
        try {
            const userName = userData?.displayName || 'There';

            if (!canMakeRequest()) {
                const defaultGreeting = generateDefaultGreeting(userName, getTimeOfDay());
                setGreetingMessage(defaultGreeting);
                return defaultGreeting;
            }

            // USANDO SEU GEMINI SERVICE
            try {
                const lowStockCount = stockItems.filter(item => item.quantity <= item.minQuantity).length;
                
                const greeting = await geminiGreeting(user.uid, userName, lowStockCount);
                setGreetingMessage(greeting);

                // Log action
                if (user) {
                    try {
                        await addDoc(collection(db, 'userActions'), {
                            userId: user.uid,
                            action: 'greeting_generated',
                            timestamp: serverTimestamp(),
                            details: { greeting, timeOfDay: getTimeOfDay() }
                        });
                    } catch (e) {
                        console.warn("⚠️ Error saving greeting action:", e);
                    }
                }

                return greeting;
            } catch (apiError) {
                if (apiError.message && apiError.message.includes('rate limit')) {
                    setApiQuotaExceeded(true);
                    console.log("⚠️ Gemini rate limit exceeded, using default greetings");
                }
                
                const defaultGreeting = generateDefaultGreeting(userName, getTimeOfDay());
                setGreetingMessage(defaultGreeting);
                return defaultGreeting;
            }
        } catch (error) {
            const handled = handleError(error, { title: 'Greeting Error' });
            const defaultGreeting = `Hello ${userData?.displayName || 'there'}!`;
            setGreetingMessage(defaultGreeting);
            setError(handled.message);
            return defaultGreeting;
        }
    };

    const generateDefaultGreeting = (userName, timeOfDay) => {
        const greetings = [
            `Good ${timeOfDay}, ${userName}! Welcome to IntelliShop.`,
            `Hello ${userName}! Ready to organize your shopping?`,
            `Welcome back, ${userName}! Your shopping lists are waiting.`,
            `Hi ${userName}! Let's make shopping easier today.`
        ];
        
        const randomIndex = Math.floor(Math.random() * greetings.length);
        return greetings[randomIndex];
    };

    const getTimeOfDay = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        return 'evening';
    };

    /**
     * Generate a Shopping List suggestion based user's budget - USANDO SEU GEMINI SERVICE
     */
    const generateShoppingList = async (budget, feedback = '') => {
        setLoading(true);
        setError(null);
        
        console.log('🚀 AI Context - generateShoppingList called');
        console.log('📊 AI Enabled:', aiEnabled);
        console.log('💰 Budget:', budget);
        
        try {
            // 🔧 REMOVER VERIFICAÇÃO QUE BLOQUEIA A IA
            // if (!canMakeRequest()) {
            //     throw new Error('Cannot make AI request at this time');
            // }

            const currentStock = stockItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                category: item.category,
                lowStockThreshold: item.minQuantity || 5,
                criticalStockThreshold: item.criticalMinQuantity || 1
            }));

            console.log('📋 Current stock items:', currentStock.length);

            // USANDO SEU GEMINI SERVICE
            const smartShoppingResult = await generateSmartShoppingList(
                budget, 
                currentStock, 
                [], // shopping history - você pode passar se tiver
                { feedback } // preferences com feedback
            );

            console.log('✅ Smart shopping result:', smartShoppingResult);

            // Salvar sugestão no Firebase
            const suggestionDoc = await addDoc(collection(db, 'aiSuggestions'), {
                userId: user.uid,
                createdAt: serverTimestamp(),
                budget,
                items: smartShoppingResult.items,
                totalEstimatedCost: smartShoppingResult.totalEstimatedCost,
                status: 'pending',
                convertedToShoppingList: false
            });

            const suggestion = {
                id: suggestionDoc.id,
                budget,
                items: smartShoppingResult.items,
                totalEstimatedCost: smartShoppingResult.totalEstimatedCost,
                status: 'pending',
                createdAt: new Date()
            };

            setSuggestions(prev => [suggestion, ...prev]);
            console.log('✅ Suggestion saved successfully');
            return { success: true, suggestion };

        } catch (error) {
            console.error('❌ Error in generateShoppingList:', error);
            const handled = handleError(error, { title: 'AI Suggestion Error' });
            setError(handled.message);
            
            // Tentar gerar mensagem de erro amigável
            try {
                const friendlyError = await generateFriendlyErrorMessage(error.message);
                setError(friendlyError);
            } catch (e) {
                console.warn('⚠️ Failed to generate friendly error message');
                // Se falhar, usar mensagem padrão
            }
            
            return { success: false, error: handled.message };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Accept suggestion - MANTENDO EXATAMENTE IGUAL
     */
    const acceptSuggestion = async (suggestionId) => {
        setLoading(true);
        setError(null);
        try {
            const suggestionDoc = await getDoc(doc(db, 'aiSuggestions', suggestionId));

            if (!suggestionDoc.exists()) {
                throw new Error('Suggestion not found!');
            }

            const suggestionData = suggestionDoc.data();

            const result = await createShoppingList(
                `AI Shopping List -£${suggestionData.budget}`,
                true,
                true,
                suggestionData.budget
            );

            if (!result.success) {
                throw new Error('Failed creating Shopping List');
            }

            for (const item of suggestionData.items) {
                await result.list.addItem(
                    item.name,
                    item.quantity,
                    item.unit,
                    item.estimatedPrice,
                    item.category
                );
            }

            await updateDoc(doc(db, 'aiSuggestions', suggestionId), {
                status: 'accepted',
                convertedToShoppingList: true,
                shoppingListId: result.list.id,
                updatedAt: serverTimestamp()
            });

            setSuggestions(prev => prev.map(suggestion =>
                suggestion.id === suggestionId
                ? {
                    ...suggestion,
                    status: 'accepted',
                    convertedToShoppingList: true,
                    shoppingListId: result.list.id
                }
                : suggestion
            ));

            return { success: true, listId: result.list.id };
        } catch (error) {
            const handled = handleError(error, { title: 'AI Suggestion Error' });
            setError(handled.message);
            return { success: false, error: handled.message };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Reject suggestion - MANTENDO EXATAMENTE IGUAL
     */
    const rejectSuggestion = async (suggestionId) => {
        setLoading(true);
        setError(null);
        try {
            await updateDoc(doc(db, 'aiSuggestions', suggestionId), {
                status: 'rejected',
                updatedAt: serverTimestamp()
            });

            setSuggestions(prev => prev.map(suggestion =>
                suggestion.id === suggestionId
                ? { ...suggestion, status: 'rejected' }
                : suggestion
            ));

            return { success: true };
        } catch (error) {
            const handled = handleError(error, { title: 'Reject AI Suggestion Error' });
            setError(handled.message);
            return { success: false, error: handled.message };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Regenerate suggestion - USANDO SEU GEMINI SERVICE
     */
    const regenerateSuggestion = async (suggestionId, feedback ='') => {
        setLoading(true);
        setError(null);
        try {
            const suggestionDoc = await getDoc(doc(db, 'aiSuggestions', suggestionId));

            if (!suggestionDoc.exists()) {
                throw new Error('Suggestion not found!');
            }

            const originalSuggestion = suggestionDoc.data();

            await updateDoc(doc(db, 'aiSuggestions', suggestionId), {
                status: 'modified',
                updatedAt: serverTimestamp()
            });

            const result = await generateShoppingList(originalSuggestion.budget, feedback);

            if(result.success) {
                await updateDoc(doc(db, 'aiSuggestions', result.suggestion.id), {
                    basedOn: suggestionId,
                    userFeedback: feedback
                });
            }

            return result;
        } catch (error) {
            const handled = handleError(error, { title: 'AI Generate Suggestion Error' });
            setError(handled.message);
            return { success: false, error: handled.message };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Generate Recipe suggestions - USANDO SEU GEMINI SERVICE
     */
    const generateRecipeSuggestions = async (userId, stockItems, setRecipes, setLoading, setError) => {
        const cacheKey = `recipe_suggestions_${userId}`;
        const cacheExpiryKey = `${cacheKey}_expiry`;
      
        try {
          setLoading(true);
          setError(null);
      
          const cached = await AsyncStorage.getItem(cacheKey);
          const expiry = await AsyncStorage.getItem(cacheExpiryKey);
      
          if (cached && expiry && Date.now() < parseInt(expiry)) {
            const cachedRecipes = JSON.parse(cached);
            setRecipes(prev => [...cachedRecipes, ...prev]);
            return { success: true, recipes: cachedRecipes };
          }
      
          // 🔧 REMOVER VERIFICAÇÃO RESTRITIVA
          // if (!canMakeRequest()) {
          //     throw new Error('Cannot make AI request at this time');
          // }
      
          // USANDO SEU GEMINI SERVICE
          const aiRecipes = await generateRecipesWithAI(stockItems);
          
          const savedRecipes = [];
      
          for (const recipe of aiRecipes) {
            const recipeDoc = await addDoc(collection(db, 'recipes'), {
              userId,
              title: recipe.title,
              description: recipe.description,
              difficulty: recipe.difficulty,
              prepTime: recipe.prepTime,
              servings: recipe.servings,
              ingredients: recipe.ingredients,
              instructions: recipe.instructions || ['Follow standard cooking instructions'],
              tags: recipe.tags || [],
              createdAt: serverTimestamp(),
              image: ''
            });
      
            savedRecipes.push({
              id: recipeDoc.id,
              ...recipe,
              createdAt: new Date()
            });
          }
      
          await AsyncStorage.setItem(cacheKey, JSON.stringify(savedRecipes));
          await AsyncStorage.setItem(cacheExpiryKey, (Date.now() + 1000 * 60 * 60 * 6).toString());
      
          setRecipes(prev => [...savedRecipes, ...prev]);
      
          return { success: true, recipes: savedRecipes };
        } catch (error) {
          const handled = handleError(error, { title: 'AI Recipe Suggestion Error' });
          setError(handled.message);
          return { success: false, error: handled.message };
        } finally {
          setLoading(false);
        }
    };

    /**
     * Fetch suggestions - MANTENDO EXATAMENTE IGUAL
     */
    const fetchSuggestions = async () => {
        setLoading(true);
        setError(null);

        try {
            const q = query(
                collection(db, 'aiSuggestions'),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc'),
                limit(10)
            );

            const querySnapshot = await getDocs(q);
            const suggestionsData = [];

            querySnapshot.forEach((doc) => {
                suggestionsData.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(),
                    updatedAt: doc.data().updatedAt?.toDate()
                });
            });

            setSuggestions(suggestionsData);
            return { success: true, suggestions: suggestionsData };
        } catch (error) {
            const handled = handleError(error, { title: 'Fetch AI Suggestion Error' });
            setError(handled.message);
            return { success: false, error: handled.message };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch recipes - MANTENDO EXATAMENTE IGUAL
     */
    const fetchRecipes = async () => {
        setLoading(true);
        setError(null);
        try {
            const q = query(
                collection(db, 'recipes'),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc'),
                limit(10)
            );

            const querySnapshot = await getDocs(q);
            const recipesData = [];

            querySnapshot.forEach((doc) => {
                recipesData.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate()
                });
            });

            setRecipes(recipesData);
            return { success: true, recipes: recipesData };
        } catch (error) {
            const handled = handleError(error, { title: 'Fetch Recipe AI Suggestion Error' });
            setError(handled.message);
            return { success: false, error: handled.message };
        } finally {
            setLoading(false);
        }
    };

    // MANTENDO EXATAMENTE TODOS OS SEUS VALORES DE CONTEXTO
    return (
        <AIContext.Provider value={{
            greetingMessage,
            suggestions,
            recipes,
            loading,
            error,
            apiQuotaExceeded,
            generateGreeting,
            generateShoppingList: generateShoppingList,
            acceptSuggestion,
            rejectSuggestion,
            regenerateSuggestion,
            generateRecipeSuggestions,
            fetchSuggestions,
            fetchRecipes,
            aiEnabled,
            setAiEnabled,
            toggleAI
        }}>
            {children}
        </AIContext.Provider>
    );
}