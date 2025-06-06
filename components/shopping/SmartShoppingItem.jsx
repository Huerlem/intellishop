// components/shopping/SmartShoppingItem.jsx - COM BOTÃO COMPARE
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../ui/Card';

const SmartShoppingItem = ({ item, onAddToList, onComparePrice, style }) => {
  // Checking if item exists
  if (!item) return null;
  
  // Checking if functions are valid
  const handleAddToList = typeof onAddToList === 'function' 
    ? () => onAddToList(item)
    : () => console.warn('onAddToList is not a function');

  const handleComparePrice = typeof onComparePrice === 'function'
    ? () => onComparePrice(item)
    : () => console.warn('onComparePrice is not a function');
  
  // Set color based on priority
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return '#e74c3c';
      case 'low': return '#f39c12';
      default: return '#3498db';
    }
  };

  // Get icon based on category
  const getCategoryIcon = (category) => {
    const categoryMap = {
      'fruits': 'nutrition',
      'vegetables': 'leaf',
      'dairy': 'water',
      'meat': 'restaurant',
      'bakery': 'pizza',
      'frozen': 'snow',
      'canned': 'archive',
      'drinks': 'beer',
      'snacks': 'fast-food',
      'cleaning': 'sparkles',
      'personal': 'person',
      'other': 'ellipsis-horizontal'
    };
    
    return categoryMap[category?.toLowerCase()] || 'basket';
  };
  
  const priorityColor = getPriorityColor(item.priority);
  const categoryIcon = getCategoryIcon(item.category);
  
  // Check and format price
  const formattedPrice = item.estimatedPrice && typeof item.estimatedPrice === 'number'
    ? `£${item.estimatedPrice.toFixed(2)}`
    : '£0.00';
  
  // Priority text
  const priorityText = item.priority === 'critical' ? 'Critical' : 
                       item.priority === 'low' ? 'Low' : 'Regular';
  
  return (
    <Card style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.categoryContainer}>
          <View style={[styles.categoryIcon, { backgroundColor: priorityColor }]}>
            <Ionicons name={`${categoryIcon}-outline`} size={18} color="#fff" />
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.category}>{item.category || 'General'}</Text>
          </View>
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formattedPrice}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
            <Text style={styles.priorityText}>
              {priorityText}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.details}>
        <Text style={styles.reason}>{item.reason || ''}</Text>
        
        <View style={styles.quantityContainer}>
          <Text style={styles.quantity}>
            {item.quantity || 0} {item.unit || ''}
          </Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddToList}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.addButtonText}>Add to List</Text>
          </TouchableOpacity>

          {/* 🔧 NOVO BOTÃO: Compare Prices */}
          <TouchableOpacity 
            style={styles.compareButton}
            onPress={handleComparePrice}
          >
            <Ionicons name="analytics-outline" size={18} color="#fff" />
            <Text style={styles.compareButtonText}>Compare</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  category: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#3498db',
  },
  priorityText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  reason: {
    flex: 1,
    fontSize: 14,
    color: '#7f8c8d',
    marginRight: 8,
  },
  quantityContainer: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quantity: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'flex-start',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '500',
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9b59b6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  compareButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '500',
    fontSize: 14,
  }
});

export default SmartShoppingItem;