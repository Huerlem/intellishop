import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Card from '../ui/Card';

const RecipeSuggestion = ({ recipe, showAllIngredients, style }) => {
    const [expanded, setExpanded] = useState(false);
    
    const toggleExpanded = () => {
        setExpanded(!expanded);
    };
  
    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'easy':
                return '#27ae60';
            case 'medium':
                return '#f39c12';
            case 'hard':
                return '#e74c3c';
            default:
                return '#7f8c8d';
        }
    };
  
    const getPrepTimeLabel = (minutes) => {
        if (minutes <= 15) {
            return 'Quick';
        } else if (minutes <= 30) {
            return 'Medium';
        } else {
            return 'Long Time';
        }
    };
  
    // Determine which ingredients to show based on the showAllIngredients prop
    const shownIngredients = showAllIngredients 
        ? recipe.ingredients 
        : recipe.availableIngredients;
    
    return (
        <Card style={[styles.container, style]}>
            <TouchableOpacity 
                style={styles.headerContainer}
                onPress={toggleExpanded}
            >
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{recipe.name}</Text>
                    <View style={styles.badgesContainer}>
                        <View style={[
                            styles.difficultyBadge, 
                            { backgroundColor: getDifficultyColor(recipe.difficulty) }
                        ]}>
                            <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
                        </View>
                         <View style={styles.timeBadge}>
                            <Text style={styles.timeText}>{getPrepTimeLabel(recipe.prepTime)}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.matchContainer}>
                    <Text style={styles.matchText}>{Math.round(recipe.score * 100)}%</Text>
                    <Text style={styles.matchLabel}>match</Text>
                </View>
            </TouchableOpacity>
      
            {expanded && (
                <View style={styles.expandedContent}>
                    <View style={styles.infoContainer}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>TTime to prepare:</Text>
                            <Text style={styles.infoValue}>{recipe.prepTime} min</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Difficulty:</Text>
                            <Text style={[
                                styles.infoValue,
                                { color: getDifficultyColor(recipe.difficulty) }
                            ]}>
                                {recipe.difficulty}
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Ingredients:</Text>
                            <Text style={styles.infoValue}>{recipe.ingredients.length}</Text>
                        </View>
                    </View>
          
                    <View style={styles.divider} />
          
                    <View style={styles.ingredientsContainer}>
                        <Text style={styles.sectionTitle}>
                            {showAllIngredients ? 'All Ingredients' : 'Available Ingredients'}
                        </Text>
                        <View style={styles.ingredientsList}>
                            {shownIngredients.map((ingredient, index) => (
                                <View key={index} style={styles.ingredientItem}>
                                    <View style={styles.ingredientDot} />
                                    <Text style={styles.ingredientText}>{ingredient}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
          
                    {showAllIngredients && recipe.missingIngredients.length > 0 && (
                        <View style={styles.missingContainer}>
                            <Text style={styles.sectionTitle}>Missing ingredients</Text>
                            <View style={styles.ingredientsList}>
                                {recipe.missingIngredients.map((ingredient, index) => (
                                    <View key={index} style={styles.ingredientItem}>
                                        <View style={[styles.ingredientDot, styles.missingDot]} />
                                        <Text style={[styles.ingredientText, styles.missingText]}>
                                            {ingredient}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 15,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 5,
    },
    badgesContainer: {
        flexDirection: 'row',
    },
    difficultyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginRight: 8,
    },
    difficultyText: {
        fontSize: 12,
        color: 'white',
        fontWeight: 'bold',
    },
    timeBadge: {
        backgroundColor: '#3498db',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    timeText: {
        fontSize: 12,
        color: 'white',
        fontWeight: 'bold',
    },
    matchContainer: {
        backgroundColor: '#ecf0f1',
        borderRadius: 25,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    matchText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3498db',
    },
    matchLabel: {
        fontSize: 10,
        color: '#7f8c8d',
    },
    expandedContent: {
        marginTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#ecf0f1',
        paddingTop: 15,
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoItem: {
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 12,
        color: '#7f8c8d',
        marginBottom: 5,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    divider: {
        height: 1,
        backgroundColor: '#ecf0f1',
        marginVertical: 15,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 10,
    },
    ingredientsContainer: {
        marginBottom: 15,
    },
    ingredientsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    ingredientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '50%',
        marginBottom: 8,
    },
    ingredientDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#27ae60',
        marginRight: 8,
    },
    ingredientText: {
        fontSize: 14,
        color: '#2C3E50',
    },
    missingContainer: {},
    missingDot: {
        backgroundColor: '#e74c3c',
    },
    missingText: {
        color: '#7f8c8d',
    },
});

export default RecipeSuggestion;