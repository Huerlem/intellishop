import React, { createContext, useState, useContext } from 'react';
import { generateRecipesWithAI } from '../services/recipeApiService';

const RecipeContext = createContext();

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipes must be used within RecipeProvider');
  }
  return context;
};

export const RecipeProvider = ({ children }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateRecipes = async (stockItems) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await generateRecipesWithAI(stockItems);
      setRecipes(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <RecipeContext.Provider value={{
      recipes,
      loading,
      error,
      generateRecipes,
      setRecipes
    }}>
      {children}
    </RecipeContext.Provider>
  );
};