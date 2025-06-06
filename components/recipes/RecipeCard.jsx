import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Share,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Components
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const RecipeCard = ({ 
  recipe, 
  onAddToFavorites, 
  onRemoveFromFavorites, 
  onAddIngredientsToList 
}) => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [rating, setRating] = useState(recipe?.rating || 0);
  
  // Check if recipe exists
  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe Not Found</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={64} color="#e74c3c" />
          <Text style={styles.errorText}>Recipe not found or unavailable</Text>
          <Button 
            title="Go Back" 
            onPress={() => router.back()} 
            style={styles.goBackButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Check if ingredients exist and are an array
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  
  // Calculate the percentage of available ingredients
  const availablePercentage = ingredients.length > 0
    ? Math.round(
        (ingredients.filter(ingredient => ingredient && ingredient.inStock).length / ingredients.length) * 100
      )
    : 0;

  // Function to share recipe
  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out this recipe: ${recipe.title}\n\n${recipe.description}\n\nPrep time: ${recipe.prepTime} min`,
        title: recipe.title,
      });
    } catch (error) {
      Alert.alert('Error', 'An error occurred while sharing');
    }
  };

  // Function to handle rating
  const handleRating = (newRating) => {
    setRating(newRating);
    // Here you would typically update the rating in your backend
    Alert.alert('Thank You!', 'Your rating has been saved.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipe Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={recipe.isFavorite ? onRemoveFromFavorites : onAddToFavorites}
          >
            <Ionicons 
              name={recipe.isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={recipe.isFavorite ? "#e74c3c" : "#333"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Recipe Hero Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: recipe.image || 'https://via.placeholder.com/400x300' }} 
            style={styles.recipeImage} 
          />
          <View style={styles.imageOverlay}>
            <View style={styles.difficultyTag}>
              <Ionicons 
                name={
                  recipe.difficulty === 'easy' ? 'sunny-outline' : 
                  recipe.difficulty === 'medium' ? 'partly-sunny-outline' : 'thunderstorm-outline'
                } 
                size={16} 
                color="#fff" 
              />
              <Text style={styles.difficultyText}>
                {recipe.difficulty === 'easy' ? 'Easy' : 
                 recipe.difficulty === 'medium' ? 'Medium' : 'Hard'}
              </Text>
            </View>
            {recipe.category && (
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{recipe.category}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.contentContainer}>
          {/* Recipe Title and Rating */}
          <View style={styles.titleContainer}>
            <Text style={styles.recipeTitle}>{recipe.title}</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity 
                  key={star}
                  onPress={() => handleRating(star)}
                >
                  <Ionicons 
                    name={rating >= star ? "star" : "star-outline"} 
                    size={20} 
                    color="#f1c40f" 
                    style={styles.starIcon}
                  />
                </TouchableOpacity>
              ))}
              {rating > 0 && (
                <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              )}
            </View>
          </View>

          {/* Recipe Meta Information */}
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={20} color="#7f8c8d" />
              <View>
                <Text style={styles.metaLabel}>Prep Time</Text>
                <Text style={styles.metaValue}>{recipe.prepTime || 0} min</Text>
              </View>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ionicons name="flame-outline" size={20} color="#7f8c8d" />
              <View>
                <Text style={styles.metaLabel}>Cook Time</Text>
                <Text style={styles.metaValue}>{recipe.cookTime || 0} min</Text>
              </View>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={20} color="#7f8c8d" />
              <View>
                <Text style={styles.metaLabel}>Servings</Text>
                <Text style={styles.metaValue}>{recipe.servings || 1}</Text>
              </View>
            </View>
          </View>

          {/* Recipe Description */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{recipe.description}</Text>
          </Card>

          {/* Ingredients Section */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <View style={styles.availabilityContainer}>
                <Text style={styles.availabilityPercentage}>{availablePercentage}%</Text>
                <Text style={styles.availabilityText}>available</Text>
              </View>
            </View>

            {ingredients.length > 0 ? (
              <>
                <View style={styles.ingredientsList}>
                  {ingredients.map((ingredient, index) => (
                    <View key={index} style={styles.ingredientItem}>
                      <View style={[
                        styles.ingredientStatusDot, 
                        { backgroundColor: ingredient.inStock ? '#2ecc71' : '#e74c3c' }
                      ]} />
                      <Text style={styles.ingredientText}>
                        {ingredient.quantity || ''} {ingredient.unit || ''} {ingredient.name || ''}
                      </Text>
                    </View>
                  ))}
                </View>
                
                {ingredients.some(ingredient => !ingredient.inStock) && (
                  <Button
                    title="Add Missing Ingredients to Shopping List"
                    onPress={() => onAddIngredientsToList(recipe)}
                    style={styles.addToListButton}
                  />
                )}
              </>
            ) : (
              <Text style={styles.emptyText}>No ingredients listed for this recipe</Text>
            )}
          </Card>

          {/* Instructions Section */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            
            {Array.isArray(recipe.instructions) && recipe.instructions.length > 0 ? (
              <View style={styles.instructionsList}>
                {recipe.instructions.map((instruction, index) => (
                  <View key={index} style={styles.instructionItem}>
                    <View style={styles.instructionNumber}>
                      <Text style={styles.instructionNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.instructionText}>{instruction}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No instructions available for this recipe</Text>
            )}
          </Card>

          {/* Nutrition Information (if available) */}
          {recipe.nutrition && (
            <Card style={styles.section}>
              <TouchableOpacity 
                style={[
                  styles.collapsibleHeader,
                  expanded && { marginBottom: 12 }
                ]}
                onPress={() => setExpanded(!expanded)}
              >
                <Text style={styles.sectionTitle}>Nutrition Information</Text>
                <Ionicons 
                  name={expanded ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#3498db" 
                />
              </TouchableOpacity>
              
              {expanded && (
                <View style={styles.nutritionGrid}>
                  {Object.entries(recipe.nutrition).map(([key, value]) => (
                    <View key={key} style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>{key}</Text>
                      <Text style={styles.nutritionValue}>{value}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          )}

          {/* Tips or Notes (if available) */}
          {recipe.tips && recipe.tips.length > 0 && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Tips & Notes</Text>
              <View style={styles.tipsList}>
                {recipe.tips.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <Ionicons name="bulb-outline" size={20} color="#f39c12" style={styles.tipIcon} />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 250,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
  },
  difficultyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 152, 219, 0.8)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginRight: 8,
  },
  difficultyText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 12,
    marginLeft: 4,
  },
  categoryTag: {
    backgroundColor: 'rgba(155, 89, 182, 0.8)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  categoryText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 12,
  },
  contentContainer: {
    padding: 16,
  },
  titleContainer: {
    marginBottom: 16,
  },
  recipeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#7f8c8d',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#ecf0f1',
  },
  metaLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 8,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#34495e',
  },
  availabilityContainer: {
    alignItems: 'center',
  },
  availabilityPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
  },
  availabilityText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  ingredientsList: {
    marginBottom: 16,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ingredientStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  ingredientText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  addToListButton: {
    marginTop: 8,
  },
  instructionsList: {
    marginTop: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  instructionNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#34495e',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0, // Isso será ajustado dinamicamente no componente
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  nutritionItem: {
    width: '50%',
    paddingVertical: 8,
    paddingRight: 8,
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    textTransform: 'capitalize',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  tipsList: {
    marginTop: 8,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tipIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: '#34495e',
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
    marginVertical: 16,
  },
  goBackButton: {
    marginTop: 16,
    minWidth: 120,
  },
});

export default RecipeCard;