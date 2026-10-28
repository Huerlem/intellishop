// components/recipes/RecipeFilters.jsx - FIXED VERSION FOR MULTIPLE SELECTION
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RecipeFilters = ({ preferences, onUpdatePreferences, style }) => {
  // Check if preferences exist to avoid errors
  const prefs = preferences || { difficulty: 'all', prepTime: 'all', category: 'all' };
  const { difficulty, prepTime, category } = prefs;
  
  // 🔧 FIX: Function to update only one filter while keeping the others
  const handleUpdatePreferences = (filterType, value) => {
    if (typeof onUpdatePreferences === 'function') {
      // Create a new object keeping existing preferences
      // and updating only the specific filter
      const updatedPreferences = {
        ...prefs, // keep all current values
        [filterType]: value // update only the clicked filter
      };
      
      console.log('🎯 Updating filter:', filterType, '→', value);
      console.log('📝 New preferences:', updatedPreferences);
      
      onUpdatePreferences(updatedPreferences);
    }
  };
  
  return (
    <View style={[styles.container, style]}>
      {/* Difficulty Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Difficulty:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterOptions}
        >
          <TouchableOpacity
            style={[
              styles.filterOption,
              difficulty === 'all' ? styles.filterOptionActive : null
            ]}
            onPress={() => handleUpdatePreferences('difficulty', 'all')}
          >
            <Text style={[
              styles.filterOptionText,
              difficulty === 'all' ? styles.filterOptionTextActive : null
            ]}>All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterOption,
              difficulty === 'Easy' ? styles.filterOptionActive : null
            ]}
            onPress={() => handleUpdatePreferences('difficulty', 'Easy')}
          >
            <Ionicons 
              name="sunny-outline" 
              size={16} 
              color={difficulty === 'Easy' ? '#fff' : '#7f8c8d'} 
              style={styles.filterIcon} 
            />
            <Text style={[
              styles.filterOptionText,
              difficulty === 'Easy' ? styles.filterOptionTextActive : null
            ]}>Easy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterOption,
              difficulty === 'Medium' ? styles.filterOptionActive : null
            ]}
            onPress={() => handleUpdatePreferences('difficulty', 'Medium')}
          >
            <Ionicons 
              name="partly-sunny-outline" 
              size={16} 
              color={difficulty === 'Medium' ? '#fff' : '#7f8c8d'} 
              style={styles.filterIcon} 
            />
            <Text style={[
              styles.filterOptionText,
              difficulty === 'Medium' ? styles.filterOptionTextActive : null
            ]}>Medium</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterOption,
              difficulty === 'Hard' ? styles.filterOptionActive : null
            ]}
            onPress={() => handleUpdatePreferences('difficulty', 'Hard')}
          >
            <Ionicons 
              name="thunderstorm-outline" 
              size={16} 
              color={difficulty === 'Hard' ? '#fff' : '#7f8c8d'} 
              style={styles.filterIcon} 
            />
            <Text style={[
              styles.filterOptionText,
              difficulty === 'Hard' ? styles.filterOptionTextActive : null
            ]}>Hard</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {/* Prep Time Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Preparation Time:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterOptions}
        >
          <TouchableOpacity
            style={[
              styles.filterOption,
              prepTime === 'all' ? styles.filterOptionActive : null
            ]}
            onPress={() => handleUpdatePreferences('prepTime', 'all')}
          >
            <Text style={[
              styles.filterOptionText,
              prepTime === 'all' ? styles.filterOptionTextActive : null
            ]}>All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterOption,
              prepTime === 'quick' ? styles.filterOptionActive : null
            ]}
            onPress={() => handleUpdatePreferences('prepTime', 'quick')}
          >
            <Ionicons 
              name="time-outline" 
              size={16} 
              color={prepTime === 'quick' ? '#fff' : '#7f8c8d'} 
              style={styles.filterIcon} 
            />
            <Text style={[
              styles.filterOptionText,
              prepTime === 'quick' ? styles.filterOptionTextActive : null
            ]}>Quick ({"<"} 30min)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterOption,
              prepTime === 'medium' ? styles.filterOptionActive : null
            ]}
            onPress={() => handleUpdatePreferences('prepTime', 'medium')}
          >
            <Ionicons 
              name="time-outline" 
              size={16} 
              color={prepTime === 'medium' ? '#fff' : '#7f8c8d'} 
              style={styles.filterIcon} 
            />
            <Text style={[
              styles.filterOptionText,
              prepTime === 'medium' ? styles.filterOptionTextActive : null
            ]}>Medium (30-60min)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterOption,
              prepTime === 'long' ? styles.filterOptionActive : null
            ]}
            onPress={() => handleUpdatePreferences('prepTime', 'long')}
          >
            <Ionicons 
              name="time-outline" 
              size={16} 
              color={prepTime === 'long' ? '#fff' : '#7f8c8d'} 
              style={styles.filterIcon} 
            />
            <Text style={[
              styles.filterOptionText,
              prepTime === 'long' ? styles.filterOptionTextActive : null
            ]}>Long ({">"}60min)</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {/* Category Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Category:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterOptions}
        >
          <TouchableOpacity
            style={[
              styles.filterOption,
              category === 'all' ? styles.filterOptionActive : null
            ]}
            onPress={() => handleUpdatePreferences('category', 'all')}
          >
            <Text style={[
              styles.filterOptionText,
              category === 'all' ? styles.filterOptionTextActive : null
            ]}>All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterOption,
              category === 'Breakfast' ? styles.filterOptionActive : null
            ]}
            onPress={() => handleUpdatePreferences('category', 'Breakfast')}
          >
            <Ionicons 
              name="cafe-outline" 
              size={16} 
              color={category === 'Breakfast' ? '#fff' : '#7f8c8d'} 
              style={styles.filterIcon} 
            />
            <Text style={[
              styles.filterOptionText,
              category === 'Breakfast' ? styles.filterOptionTextActive : null
            ]}>Breakfast</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterOption,
              category === 'Main Course' ? styles.filterOptionActive : null
            ]}
            onPress={() => handleUpdatePreferences('category', 'Main Course')}
          >
            <Ionicons 
              name="restaurant-outline" 
              size={16} 
              color={category === 'Main Course' ? '#fff' : '#7f8c8d'} 
              style={styles.filterIcon} 
            />
            <Text style={[
              styles.filterOptionText,
              category === 'Main Course' ? styles.filterOptionTextActive : null
            ]}>Main Course</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterOption,
              category === 'Side dish' ? styles.filterOptionActive : null
            ]}
            onPress={() => handleUpdatePreferences('category', 'Side dish')}
          >
            <Ionicons 
              name="leaf-outline" 
              size={16} 
              color={category === 'Side dish' ? '#fff' : '#7f8c8d'} 
              style={styles.filterIcon} 
            />
            <Text style={[
              styles.filterOptionText,
              category === 'Side dish' ? styles.filterOptionTextActive : null
            ]}>Side Dish</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterOption,
              category === 'Dessert' ? styles.filterOptionActive : null
            ]}
            onPress={() => handleUpdatePreferences('category', 'Dessert')}
          >
            <Ionicons 
              name="ice-cream-outline" 
              size={16} 
              color={category === 'Dessert' ? '#fff' : '#7f8c8d'} 
              style={styles.filterIcon} 
            />
            <Text style={[
              styles.filterOptionText,
              category === 'Dessert' ? styles.filterOptionTextActive : null
            ]}>Dessert</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterOption,
              category === 'Snack' ? styles.filterOptionActive : null
            ]}
            onPress={() => handleUpdatePreferences('category', 'Snack')}
          >
            <Ionicons 
              name="fast-food-outline" 
              size={16} 
              color={category === 'Snack' ? '#fff' : '#7f8c8d'} 
              style={styles.filterIcon} 
            />
            <Text style={[
              styles.filterOptionText,
              category === 'Snack' ? styles.filterOptionTextActive : null
            ]}>Snack</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterOption,
              category === 'Drink' ? styles.filterOptionActive : null
            ]}
            onPress={() => handleUpdatePreferences('category', 'Drink')}
          >
            <Ionicons 
              name="wine-outline" 
              size={16} 
              color={category === 'Drink' ? '#fff' : '#7f8c8d'} 
              style={styles.filterIcon} 
            />
            <Text style={[
              styles.filterOptionText,
              category === 'Drink' ? styles.filterOptionTextActive : null
            ]}>Drink</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterOption,
              category === 'Salad' ? styles.filterOptionActive : null
            ]}
            onPress={() => handleUpdatePreferences('category', 'Salad')}
          >
            <Ionicons 
              name="nutrition-outline" 
              size={16} 
              color={category === 'Salad' ? '#fff' : '#7f8c8d'} 
              style={styles.filterIcon} 
            />
            <Text style={[
              styles.filterOptionText,
              category === 'Salad' ? styles.filterOptionTextActive : null
            ]}>Salad</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterOption,
              category === 'Experimental' ? styles.filterOptionActive : null
            ]}
            onPress={() => handleUpdatePreferences('category', 'Experimental')}
          >
            <Ionicons 
              name="flask-outline" 
              size={16} 
              color={category === 'Experimental' ? '#fff' : '#7f8c8d'} 
              style={styles.filterIcon} 
            />
            <Text style={[
              styles.filterOptionText,
              category === 'Experimental' ? styles.filterOptionTextActive : null
            ]}>Creative</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Active Filters Summary - Shows which filters are active */}
      {(difficulty !== 'all' || prepTime !== 'all' || category !== 'all') && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersLabel}>Active filters:</Text>
          <View style={styles.activeFiltersList}>
            {difficulty !== 'all' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>Difficulty: {difficulty}</Text>
                <TouchableOpacity onPress={() => handleUpdatePreferences('difficulty', 'all')}>
                  <Ionicons name="close-circle" size={16} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            )}
            {prepTime !== 'all' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>Time: {prepTime}</Text>
                <TouchableOpacity onPress={() => handleUpdatePreferences('prepTime', 'all')}>
                  <Ionicons name="close-circle" size={16} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            )}
            {category !== 'all' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>Category: {category}</Text>
                <TouchableOpacity onPress={() => handleUpdatePreferences('category', 'all')}>
                  <Ionicons name="close-circle" size={16} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  filterOptions: {
    paddingBottom: 4,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  filterOptionActive: {
    backgroundColor: '#3498db',
  },
  filterIcon: {
    marginRight: 4,
  },
  filterOptionText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  filterOptionTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  // Styles for showing active filters
  activeFiltersContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  activeFiltersLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  activeFiltersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 12,
    color: '#991b1b',
  },
});

export default RecipeFilters;