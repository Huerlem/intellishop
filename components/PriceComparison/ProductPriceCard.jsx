import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';

const ProductPriceCard = ({ product, onAddToList, expanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  
  // Check if product exists
  if (!product) return null;
  
  // Ensure stores is an array
  const stores = Array.isArray(product.stores) ? product.stores : [];
  
  // Sort stores by lowest price
  const sortedStores = [...stores].sort((a, b) => 
    (typeof a.price === 'number' && typeof b.price === 'number') 
      ? a.price - b.price 
      : 0
  );
  
  // Safe price values
  const bestPrice = sortedStores.length > 0 ? (sortedStores[0]?.price || 0) : 0;
  const highestPrice = sortedStores.length > 0 ? (sortedStores[sortedStores.length - 1]?.price || 0) : 0;
  
  // Calculate savings compared to highest price
  const savings = highestPrice - bestPrice;
  const savingsPercentage = highestPrice > 0 ? Math.round((savings / highestPrice) * 100) : 0;
  
  // Safe function to add to list
  const handleAddToList = () => {
    if (typeof onAddToList === 'function') {
      onAddToList(product);
    }
  };
  
  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={styles.productInfo}>
          {product.imageUrl ? (
            <Image 
              source={{ uri: product.imageUrl }} 
              style={styles.productImage} 
              resizeMode="contain"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="basket-outline" size={24} color="#bdc3c7" />
            </View>
          )}
          
          <View style={styles.productDetails}>
            <Text style={styles.productName}>{product.name || 'Unnamed Product'}</Text>
            <Text style={styles.bestPriceLabel}>Best Price:</Text>
            <Text style={styles.bestPrice}>£{bestPrice.toFixed(2)}</Text>
          </View>
        </View>
        
        <View style={styles.savingsContainer}>
          <Text style={styles.savingsPercentage}>{savingsPercentage}%</Text>
          <Text style={styles.savingsLabel}>savings</Text>
          <Text style={styles.savingsAmount}>£{savings.toFixed(2)}</Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.addToListButton}
          onPress={handleAddToList}
        >
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.addToListText}>Add to List</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Text style={styles.expandText}>
            {isExpanded ? 'Hide stores' : 'View all stores'}
          </Text>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={18} 
            color="#3498db" 
          />
        </TouchableOpacity>
      </View>
      
      {isExpanded && sortedStores.length > 0 ? (
        <View style={styles.storesContainer}>
          {sortedStores.map((store, index) => (
            <View 
              key={`${store.id || ''}-${index}`}
              style={[
                styles.storeItem,
                index === 0 ? styles.bestStoreItem : null
              ]}
            >
              <View style={styles.storeInfo}>
                {index === 0 ? (
                  <View style={styles.bestPriceTag}>
                    <Text style={styles.bestPriceTagText}>Best</Text>
                  </View>
                ) : null}
                
                {store.logoUrl ? (
                  <Image 
                    source={{ uri: store.logoUrl }} 
                    style={styles.storeLogo} 
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[styles.storeLogo, {backgroundColor: '#ecf0f1', alignItems: 'center', justifyContent: 'center'}]}>
                    <Ionicons name="storefront-outline" size={16} color="#95a5a6" />
                  </View>
                )}
                
                <View style={styles.storeDetails}>
                  <Text style={styles.storeName}>{store.name || 'Unknown Store'}</Text>
                  <Text style={styles.storeDistance}>{store.distance || 0}km</Text>
                </View>
              </View>
              
              <Text style={[
                styles.storePrice,
                index === 0 ? styles.bestStorePrice : null
              ]}>
                £{(store.price || 0).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      ) : isExpanded ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No store data available</Text>
        </View>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  productImage: {
    width: 60,
    height: 60,
    marginRight: 12,
    borderRadius: 8,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  bestPriceLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  bestPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  savingsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#ecf0f1',
    paddingLeft: 16,
  },
  savingsPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  savingsLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  savingsAmount: {
    fontSize: 14,
    color: '#e74c3c',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 16,
    paddingBottom: 16,
  },
  addToListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  addToListText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: 'bold',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandText: {
    color: '#3498db',
    marginRight: 4,
  },
  storesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 16,
  },
  storeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  bestStoreItem: {
    backgroundColor: 'rgba(46, 204, 113, 0.05)',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bestPriceTag: {
    backgroundColor: '#2ecc71',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  bestPriceTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  storeLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  storeDetails: {
    flex: 1,
  },
  storeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  storeDistance: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  storePrice: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  bestStorePrice: {
    color: '#2ecc71',
    fontSize: 18,
  },
  emptyContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  emptyText: {
    fontSize: 14,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
});

export default ProductPriceCard;
