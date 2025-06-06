// components/shopping/SmartShoppingSummary.jsx - FINAL COM PRICE COMPARISON
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../ui/Card';
import LoadingSpinner from '../common/LoadingSpinner';

const SmartShoppingSummary = ({ 
  smartList, 
  onAddAllToList, 
  onCompareAllPrices, // 🔧 PROP PARA PRICE COMPARISON
  priceLoading = false, // 🔧 LOADING STATE PARA PRICE COMPARISON
  style 
}) => {
  // Checking if the list exists
  if (!smartList) return null;
  
  // Check if functions are valid
  const handleAddAllToList = typeof onAddAllToList === 'function'
    ? onAddAllToList
    : () => console.warn('onAddAllToList is not a function');

  // 🔧 NOVA FUNÇÃO PARA PRICE COMPARISON
  const handleCompareAllPrices = typeof onCompareAllPrices === 'function'
    ? onCompareAllPrices
    : () => console.warn('onCompareAllPrices is not a function');
  
  // Check if items exist
  const items = Array.isArray(smartList.items) ? smartList.items : [];
  
  // Calculate list statistics
  const totalItems = items.length;
  const criticalItems = items.filter(item => item.priority === 'critical').length;
  const lowItems = items.filter(item => item.priority === 'low').length;
  const regularItems = totalItems - criticalItems - lowItems;
  
  // Ensure that the budget and total cost are numbers
  const budget = typeof smartList.budget === 'number' ? smartList.budget : 0;
  const totalEstimatedCost = typeof smartList.totalEstimatedCost === 'number' 
    ? smartList.totalEstimatedCost : 0;
  
  // Calculate percentage of budget used
  const budgetPercentage = budget > 0 ? (totalEstimatedCost / budget) * 100 : 0;
  
  // Get colors based on budget usage
  const getBudgetColor = (percentage) => {
    if (percentage > 95) return '#e74c3c';  // Red when almost at the limit
    if (percentage > 85) return '#f39c12';  // Orange when close to the limit
    return '#2ecc71';  // Green for normal use
  };
  
  const budgetColor = getBudgetColor(budgetPercentage);
  
  return (
    <Card style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Smart List Summary</Text>
        <Text style={styles.subtitle}>Based on your budget and needs</Text>
      </View>
      
      <View style={styles.budgetContainer}>
        <View style={styles.budgetInfo}>
          <Text style={styles.budgetLabel}>Budget:</Text>
          <Text style={styles.budgetValue}>£{budget.toFixed(2)}</Text>
        </View>
        
        <View style={styles.budgetInfo}>
          <Text style={styles.budgetLabel}>Estimated:</Text>
          <Text style={[styles.budgetValue, { color: budgetColor }]}>
            £{totalEstimatedCost.toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.budgetInfo}>
          <Text style={styles.budgetLabel}>Savings:</Text>
          <Text style={[styles.budgetValue, { color: '#2ecc71' }]}>
            £{(budget - totalEstimatedCost).toFixed(2)}
          </Text>
        </View>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${Math.min(budgetPercentage, 100)}%`,
                backgroundColor: budgetColor
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{budgetPercentage.toFixed(0)}% used</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#e74c3c' }]}>
            <Ionicons name="alert-circle-outline" size={20} color="#fff" />
          </View>
          <Text style={styles.statValue}>{criticalItems}</Text>
          <Text style={styles.statLabel}>Critical</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#f39c12' }]}>
            <Ionicons name="warning-outline" size={20} color="#fff" />
          </View>
          <Text style={styles.statValue}>{lowItems}</Text>
          <Text style={styles.statLabel}>Low</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#3498db' }]}>
            <Ionicons name="cart-outline" size={20} color="#fff" />
          </View>
          <Text style={styles.statValue}>{regularItems}</Text>
          <Text style={styles.statLabel}>Regular</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#2ecc71' }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          </View>
          <Text style={styles.statValue}>{totalItems}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>
      
      {/* 🔧 BOTÕES DE AÇÃO INTEGRADOS COM PRICE COMPARISON */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={styles.addAllButton}
          onPress={handleAddAllToList}
          disabled={priceLoading}
        >
          <Ionicons name="cart" size={18} color="#fff" />
          <Text style={styles.addAllButtonText}>Add all to list</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.compareAllButton, priceLoading && styles.buttonDisabled]}
          onPress={handleCompareAllPrices}
          disabled={priceLoading}
        >
          {priceLoading ? (
            <LoadingSpinner size="small" color="#fff" />
          ) : (
            <Ionicons name="analytics" size={18} color="#fff" />
          )}
          <Text style={styles.compareAllButtonText}>
            {priceLoading ? 'Analyzing...' : 'Compare Prices'}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  budgetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  budgetInfo: {
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2ecc71',
  },
  progressText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  addAllButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 8,
  },
  addAllButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  compareAllButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9b59b6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  compareAllButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  }
});

export default SmartShoppingSummary;