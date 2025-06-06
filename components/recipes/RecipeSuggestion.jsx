// components/recipes/RecipeSuggestion.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';

const RecipeSuggestion = ({ 
  recipe, 
  showAllIngredients = true, 
  onViewDetails,
  onToggleFavorite,
  onAddIngredientsToList,
  style 
}) => {
  // Initial check to ensure recipe exists
  if (!recipe) return null;

  const [expanded, setExpanded] = useState(false);

  // Check if ingredients exist and are an array
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  
  // Filters ingredients based on the showAllIngredients property
  const displayIngredients = showAllIngredients
    ? ingredients
    : ingredients.filter(ingredient => ingredient && ingredient.inStock);

  // Calculates the percentage of available ingredients safely
  const availablePercentage = ingredients.length > 0
    ? Math.round(
        (ingredients.filter(ingredient => ingredient && ingredient.inStock).length / ingredients.length) * 100
      )
    : 0;

  // Get missing ingredients for shopping list
  const missingIngredients = ingredients.filter(ingredient => !ingredient.inStock);

  return (
    <Card style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{recipe.title || 'Untitled Recipe'}</Text>
            {recipe.isGenerated && (
              <View style={styles.aiTag}>
                <Ionicons name="sparkles" size={12} color="#fff" />
                <Text style={styles.aiTagText}>AI</Text>
              </View>
            )}
          </View>
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#7f8c8d" />
              <Text style={styles.metaText}>{recipe.prepTime || recipe.time || 0} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={16} color="#7f8c8d" />
              <Text style={styles.metaText}>{recipe.servings || 1} serving{(recipe.servings || 1) > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons 
                name={recipe.difficulty === 'Easy' ? 'sunny-outline' : 
                      recipe.difficulty === 'Medium' ? 'partly-sunny-outline' : 'thunderstorm-outline'} 
                size={16} 
                color="#7f8c8d" 
              />
              <Text style={styles.metaText}>
                {recipe.difficulty === 'Easy' ? 'Easy' : 
                 recipe.difficulty === 'Medium' ? 'Medium' : 'Hard'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.readyContainer}>
          <Text style={styles.readyPercentage}>{availablePercentage}%</Text>
          <Text style={styles.readyText}>available</Text>
        </View>
      </View>

      <Text style={styles.description}>{recipe.description || 'No description available'}</Text>

      {/* Category and Rating */}
      {(recipe.category || recipe.rating) && (
        <View style={styles.categoryRatingRow}>
          {recipe.category && (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{recipe.category}</Text>
            </View>
          )}
          {recipe.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#F6E05E" />
              <Text style={styles.ratingText}>{recipe.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity 
        style={[
          styles.ingredientsToggle,
          expanded && styles.ingredientsToggleExpanded
        ]}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.ingredientsToggleText}>
          {expanded ? 'Hide ingredients' : 'Show ingredients'}
        </Text>
        <Ionicons 
          name={expanded ? 'chevron-up' : 'chevron-down'} 
          size={18} 
          color="#3498db" 
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.ingredientsContainer}>
          <Text style={styles.ingredientsTitle}>
            Ingredients ({ingredients.filter(i => i.inStock).length}/{ingredients.length} available):
          </Text>
          {displayIngredients.length > 0 ? (
            displayIngredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <View style={[
                  styles.ingredientStatusDot, 
                  { backgroundColor: ingredient.inStock ? '#2ecc71' : '#e74c3c' }
                ]} />
                <Text style={styles.ingredientText}>
                  {ingredient.quantity || ''} {ingredient.unit || ''} {ingredient.name || ''}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No ingredients available</Text>
          )}
          
          {missingIngredients.length > 0 && (
            <TouchableOpacity 
              style={styles.addMissingButton}
              onPress={() => onAddIngredientsToList && onAddIngredientsToList(recipe)}
            >
              <Ionicons name="add-circle-outline" size={16} color="#FF9800" />
              <Text style={styles.addMissingText}>
                Add {missingIngredients.length} missing ingredient{missingIngredients.length > 1 ? 's' : ''} to list
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => onViewDetails && onViewDetails(recipe)}
        >
          <Text style={styles.detailsButtonText}>View full recipe</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => onToggleFavorite && onToggleFavorite(recipe)}
        >
          <Ionicons 
            name={recipe.isFavorite ? "heart" : "heart-outline"} 
            size={22} 
            color={recipe.isFavorite ? "#E53E3E" : "#3498db"} 
          />
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
  },
  aiTag: {
    backgroundColor: '#9C27B0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  aiTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 4,
  },
  metaText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#7f8c8d',
  },
  readyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#3498db',
  },
  readyPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
  },
  readyText: {
    fontSize: 9,
    color: '#7f8c8d',
  },
  description: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 12,
    lineHeight: 20,
  },
  categoryRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryTag: {
    backgroundColor: '#E9D8FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#6B46C1',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  ingredientsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  ingredientsToggleExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  ingredientsToggleText: {
    fontSize: 14,
    color: '#3498db',
    marginRight: 5,
  },
  ingredientsContainer: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  ingredientsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ingredientStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  ingredientText: {
    flex: 1,
    fontSize: 13,
    color: '#2C3E50',
  },
  addMissingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3CD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  addMissingText: {
    fontSize: 12,
    color: '#FF9800',
    marginLeft: 4,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 15,
  },
  detailsButton: {
    flex: 1,
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  detailsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#ecf0f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
});

export default RecipeSuggestion;