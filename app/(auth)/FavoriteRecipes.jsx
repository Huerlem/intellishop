import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ConfirmModal from '@/components/common/ConfirmModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Filter options based on AI generated recipe categories
const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'Main course', label: 'Main Course' },
  { id: 'Side dish', label: 'Side Dish' },
  { id: 'Dessert', label: 'Dessert' },
  { id: 'Snack', label: 'Snack' },
  { id: 'Breakfast', label: 'Breakfast' },
  { id: 'Drink', label: 'Drink' },
  { id: 'Salad', label: 'Salad' },
  { id: 'Experimental', label: 'Creative' },
];

const FAVORITES_STORAGE_KEY = '@favorite_recipes';

export default function FavoriteRecipesScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [recipeToRemove, setRecipeToRemove] = useState(null);
  const [sortBy, setSortBy] = useState('rating'); // 'rating', 'title', 'prepTime'

  // Load favorite recipes from storage
  const loadFavoriteRecipes = async () => {
    try {
      setLoading(true);
      console.log('📖 Loading favorite recipes from storage...');
      
      const storedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      
      if (storedFavorites) {
        const favoriteRecipes = JSON.parse(storedFavorites);
        console.log('✅ Loaded favorite recipes:', favoriteRecipes.length);
        setRecipes(favoriteRecipes);
      } else {
        console.log('📭 No favorite recipes found');
        setRecipes([]);
      }
    } catch (error) {
      console.error('❌ Error loading favorite recipes:', error);
      Alert.alert('Error', 'Could not load favorite recipes');
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  // Save favorite recipes to storage
  const saveFavoriteRecipes = async (updatedRecipes) => {
    try {
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedRecipes));
      console.log('💾 Saved favorite recipes:', updatedRecipes.length);
    } catch (error) {
      console.error('❌ Error saving favorite recipes:', error);
    }
  };

  // Load favorites when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadFavoriteRecipes();
    }, [])
  );

  // Load recipes on mount
  useEffect(() => {
    loadFavoriteRecipes();
  }, []);

  // Filter recipes based on category
  const filteredRecipes = filter === 'all' 
    ? recipes 
    : recipes.filter(recipe => recipe.category === filter);

  // Sort recipes based on sortBy state
  const sortedRecipes = [...filteredRecipes].sort((a, b) => {
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
    if (sortBy === 'prepTime') {
      const aTime = parseInt((a.prepTime || a.time || '15').toString().match(/\d+/)?.[0] || '15');
      const bTime = parseInt((b.prepTime || b.time || '15').toString().match(/\d+/)?.[0] || '15');
      return aTime - bTime;
    }
    return 0;
  });

  const confirmRemoveFromFavorites = (recipe) => {
    setRecipeToRemove(recipe);
    setDeleteConfirmVisible(true);
  };

  const removeFromFavorites = async () => {
    if (recipeToRemove) {
      try {
        console.log('🗑️ Removing recipe from favorites:', recipeToRemove.title);
        
        const updatedRecipes = recipes.filter(recipe => recipe.id !== recipeToRemove.id);
        setRecipes(updatedRecipes);
        
        // Save updated list to storage
        await saveFavoriteRecipes(updatedRecipes);
        
        Alert.alert('Removed!', `"${recipeToRemove.title}" has been removed from your favorites.`);
        
        setDeleteConfirmVisible(false);
        setRecipeToRemove(null);
      } catch (error) {
        console.error('❌ Error removing from favorites:', error);
        Alert.alert('Error', 'Could not remove recipe from favorites');
      }
    }
  };

  const cancelRemove = () => {
    setDeleteConfirmVisible(false);
    setRecipeToRemove(null);
  };

  // ✅ Fixed back button handler
  const handleGoBack = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(auth)');
      }
    } catch (error) {
      console.log('Navigation error:', error);
      router.replace('/(auth)');
    }
  };

  const renderRecipeCard = ({ item }) => (
    <Pressable 
      style={styles.recipeCard}
      onPress={() => router.push({
        pathname: `/(auth)/recipe/${item.id}`,
        params: { 
          recipeData: JSON.stringify(item),
          fromSuggestions: true 
        }
      })}
    >
      <Image 
        source={{ uri: item.image || 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(item.title || 'Recipe') }} 
        style={styles.recipeImage} 
      />
      <View style={styles.favoriteButton}>
        <TouchableOpacity onPress={() => confirmRemoveFromFavorites(item)}>
          <Ionicons name="heart" size={24} color="#E53E3E" />
        </TouchableOpacity>
      </View>
      
      {/* AI Generated Badge */}
      {item.isGenerated && (
        <View style={styles.aiGeneratedBadge}>
          <Ionicons name="sparkles" size={14} color="#fff" />
          <Text style={styles.aiGeneratedText}>AI</Text>
        </View>
      )}
      
      <View style={styles.recipeDetails}>
        <Text style={styles.recipeTitle}>{item.title || 'Untitled Recipe'}</Text>
        <View style={styles.recipeInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={16} color="#718096" />
            <Text style={styles.infoText}>{item.prepTime || item.time || '15 min'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="flame-outline" size={16} color="#718096" />
            <Text style={styles.infoText}>{item.difficulty || 'Easy'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="star" size={16} color="#F6E05E" />
            <Text style={styles.infoText}>{item.rating ? item.rating.toFixed(1) : '4.0'}</Text>
          </View>
        </View>
        
        {/* Availability percentage for AI recipes */}
        {item.isGenerated && item.availabilityPercentage && (
          <View style={styles.availabilityInfo}>
            <Text style={styles.availabilityText}>
              {item.availabilityPercentage}% ingredients available
            </Text>
          </View>
        )}
        
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{item.category || 'Recipe'}</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={24} color="#4B0082" />
        </TouchableOpacity>
        <Text style={styles.title}>My Favorite Recipes</Text>
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => {
            // Cycle through sort options
            const options = ['rating', 'title', 'prepTime'];
            const currentIndex = options.indexOf(sortBy);
            const nextIndex = (currentIndex + 1) % options.length;
            setSortBy(options[nextIndex]);
          }}
        >
          <Ionicons name="funnel-outline" size={22} color="#4B0082" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.filterOption,
                filter === category.id && styles.filterOptionActive
              ]}
              onPress={() => setFilter(category.id)}
            >
              <Text 
                style={[
                  styles.filterText,
                  filter === category.id && styles.filterTextActive
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sortInfo}>
        <Text style={styles.sortText}>
          Sorted by: {sortBy === 'rating' ? 'Rating' : sortBy === 'title' ? 'Name' : 'Prep Time'}
        </Text>
        {recipes.length > 0 && (
          <Text style={styles.countText}>
            {recipes.length} favorite recipe{recipes.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text style={styles.loadingText}>Loading your favorite recipes...</Text>
        </View>
      ) : sortedRecipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#A0AEC0" />
          <Text style={styles.emptyText}>
            {recipes.length === 0 ? 'No favorite recipes yet' : 'No recipes found'}
          </Text>
          <Text style={styles.emptySubtext}>
            {recipes.length === 0 
              ? 'Mark recipes as favorites to see them here'
              : 'Try adjusting the filter to find recipes'
            }
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.push('/(auth)/RecipeSuggestions')}
          >
            <Text style={styles.browseButtonText}>Browse AI Recipes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sortedRecipes}
          renderItem={renderRecipeCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.recipeList}
        />
      )}

      <ConfirmModal
        visible={deleteConfirmVisible}
        title="Remove from Favorites"
        message={
          recipeToRemove
            ? `Are you sure you want to remove "${recipeToRemove.title}" from your favorites?`
            : 'Are you sure you want to remove this recipe?'
        }
        onConfirm={removeFromFavorites}
        onCancel={cancelRemove}
        confirmText="Remove"
        cancelText="Cancel"
        confirmStyle="destructive"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 6,
  },
  sortButton: {
    padding: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B0082',
  },
  filterContainer: {
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterScrollContent: {
    paddingHorizontal: 16,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#EDF2F7',
  },
  filterOptionActive: {
    backgroundColor: '#4B0082',
  },
  filterText: {
    fontSize: 14,
    color: '#4A5568',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  sortInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sortText: {
    fontSize: 12,
    color: '#718096',
  },
  countText: {
    fontSize: 12,
    color: '#4B0082',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  recipeList: {
    padding: 16,
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 8,
  },
  aiGeneratedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#9C27B0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiGeneratedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  recipeDetails: {
    padding: 16,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  recipeInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#718096',
    marginLeft: 4,
  },
  availabilityInfo: {
    marginBottom: 8,
  },
  availabilityText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#E9D8FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#6B46C1',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A5568',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#718096',
    marginTop: 8,
    textAlign: 'center',
  },
  browseButton: {
    marginTop: 24,
    backgroundColor: '#4B0082',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});