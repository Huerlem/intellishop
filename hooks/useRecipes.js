// hooks/useRecipes.js
import { useState, useEffect } from 'react';
import { 
  generateRecipesWithAI, 
  fetchRecipeDetails, 
  toggleFavoriteRecipe, 
  isRecipeFavorite, 
  getFavoriteRecipes,
  getFavoriteRecipesWithDetails,
  addMissingIngredientsToShoppingList
} from '../services/recipeApiService.js';

export const useRecipes = () => {
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [error, setError] = useState(null);
  const [preferences, setPreferences] = useState({
    difficulty: 'all', // 'all', 'easy', 'medium', 'hard'
    prepTime: 'all',   // 'all', 'quick', 'medium', 'long'
    category: 'all'    // 'all', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack'
  });
  
  // Gerar receitas sugeridas com base no estoque
  const generateRecipes = async (stockItems) => {
    if (!stockItems || stockItems.length === 0) {
      setError('Nenhum item no estoque para sugerir receitas');
      return [];
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const suggestions = await generateRecipesWithAI(stockItems);
      
      // Verificar quais são favoritas
      const favIds = await getFavoriteRecipes();
      const recipesWithFavStatus = suggestions.map(recipe => ({
        ...recipe,
        isFavorite: favIds.includes(recipe.id)
      }));
      
      setRecipes(recipesWithFavStatus);
      return recipesWithFavStatus;
    } catch (err) {
      setError(`Falha ao gerar receitas: ${err.message}`);
      console.error('Erro ao gerar receitas:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Obter detalhes de uma receita
  const getRecipeDetails = async (recipeId) => {
    setLoading(true);
    setError(null);
    
    try {
      const details = await fetchRecipeDetails(recipeId);
      
      // Verificar se é favorita
      const isFav = await isRecipeFavorite(recipeId);
      const recipeWithFavStatus = { ...details, isFavorite: isFav };
      
      setSelectedRecipe(recipeWithFavStatus);
      return recipeWithFavStatus;
    } catch (err) {
      setError(`Falha ao carregar detalhes da receita: ${err.message}`);
      console.error('Erro ao carregar detalhes:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Marcar/desmarcar receita como favorita
  const toggleFavorite = async (recipeId) => {
    try {
      const result = await toggleFavoriteRecipe(recipeId);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Atualizar a lista de favoritos
      setFavoriteRecipes(result.favorites);
      
      // Atualizar o state da receita selecionada
      if (selectedRecipe && selectedRecipe.id === recipeId) {
        setSelectedRecipe(prev => ({ ...prev, isFavorite: result.isFavorite }));
      }
      
      // Atualizar o state das receitas na lista
      setRecipes(prev => prev.map(recipe => 
        recipe.id === recipeId 
          ? { ...recipe, isFavorite: result.isFavorite } 
          : recipe
      ));
      
      return result;
    } catch (err) {
      console.error('Erro ao atualizar favorito:', err);
      setError(`Falha ao atualizar favorito: ${err.message}`);
      return { error: err.message };
    }
  };
  
  // Carregar receitas favoritas
  const loadFavoriteRecipes = async () => {
    setLoading(true);
    
    try {
      const favIds = await getFavoriteRecipes();
      setFavoriteRecipes(favIds);
      
      // Carregar detalhes das receitas favoritas
      const favRecipes = await getFavoriteRecipesWithDetails();
      return favRecipes;
    } catch (err) {
      console.error('Erro ao carregar favoritos:', err);
      setError(`Falha ao carregar favoritos: ${err.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Adicionar ingredientes faltantes à lista de compras
  const addIngredientsToShoppingList = async (ingredients, addToList) => {
    setLoading(true);
    
    try {
      const result = await addMissingIngredientsToShoppingList(ingredients, addToList);
      return result;
    } catch (err) {
      console.error('Erro ao adicionar à lista de compras:', err);
      setError(`Falha ao adicionar à lista de compras: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Atualizar preferências de receitas
  const updatePreferences = (newPreferences) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  };
  
  // Filtrar receitas com base nas preferências
  const getFilteredRecipes = () => {
    if (!recipes.length) return [];
    
    return recipes.filter(recipe => {
      // Filtrar por dificuldade
      if (preferences.difficulty !== 'all' && recipe.difficulty !== preferences.difficulty) {
        return false;
      }
      
      // Filtrar por tempo de preparo
      if (preferences.prepTime === 'quick' && recipe.prepTime > 20) {
        return false;
      } else if (preferences.prepTime === 'medium' && (recipe.prepTime <= 20 || recipe.prepTime > 40)) {
        return false;
      } else if (preferences.prepTime === 'long' && recipe.prepTime <= 40) {
        return false;
      }
      
      // Filtrar por categoria
      if (preferences.category !== 'all' && recipe.category !== preferences.category) {
        return false;
      }
      
      return true;
    });
  };
  
  // Carregar favoritos ao inicializar
  useEffect(() => {
    const initFavorites = async () => {
      const favIds = await getFavoriteRecipes();
      setFavoriteRecipes(favIds);
    };
    
    initFavorites();
  }, []);
  
  return {
    loading,
    recipes: getFilteredRecipes(),
    allRecipes: recipes,
    selectedRecipe,
    favoriteRecipes,
    error,
    preferences,
    generateRecipes,
    getRecipeDetails,
    toggleFavorite,
    loadFavoriteRecipes,
    updatePreferences,
    setSelectedRecipe,
    addIngredientsToShoppingList
  };
};