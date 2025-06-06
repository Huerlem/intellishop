import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';

const StoreComparison = ({ products, stores }) => {
  const validProducts = Array.isArray(products) ? products : [];
  const validStores = Array.isArray(stores) ? stores : [];

  const [selectedStore, setSelectedStore] = useState(null);
  const [sortedStores, setSortedStores] = useState([]);

  useEffect(() => {
    setSortedStores(calculateTotalsByStore());
  }, [products, stores]);

  const calculateTotalsByStore = () => {
    if (validStores.length === 0 || validProducts.length === 0) {
      return [];
    }

    const storeTotals = {};

    validStores.forEach(store => {
      if (store && store.id) {
        storeTotals[store.id] = {
          ...store,
          totalPrice: 0,
          availableProducts: 0,
          unavailableProducts: 0
        };
      }
    });

    validProducts.forEach(product => {
      if (product && Array.isArray(product.stores)) {
        product.stores.forEach(store => {
          if (store && store.id && storeTotals[store.id]) {
            storeTotals[store.id].totalPrice += (store.price || 0);
            storeTotals[store.id].availableProducts += 1;
          }
        });

        validStores.forEach(store => {
          if (store && store.id && storeTotals[store.id] &&
              !product.stores.find(s => s && s.id === store.id)) {
            storeTotals[store.id].unavailableProducts += 1;
          }
        });
      }
    });

    return Object.values(storeTotals).sort((a, b) => a.totalPrice - b.totalPrice);
  };

  if (sortedStores.length === 0) {
    return (
      <Card style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Not enough data to compare stores
          </Text>
        </View>
      </Card>
    );
  }

  const bestStore = sortedStores[0];
  const worstStore = sortedStores[sortedStores.length - 1];
  const potentialSavings = (worstStore?.totalPrice || 0) - (bestStore?.totalPrice || 0);

  const storeDetails = selectedStore 
    ? sortedStores.find(s => s.id === selectedStore) || bestStore
    : bestStore;

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Supermarket Comparison</Text>
        <Text style={styles.subtitle}>
          Comparing prices of {validProducts.length} products across {validStores.length} stores
        </Text>
      </View>

      <View style={styles.savingsSection}>
        <Text style={styles.savingsTitle}>Potential Savings:</Text>
        <Text style={styles.savingsAmount}>£{potentialSavings.toFixed(2)}</Text>
        <Text style={styles.savingsSubtext}>
          by shopping at {bestStore?.name || 'the best store'} instead of {worstStore?.name || 'the most expensive store'}
        </Text>
      </View>

      <View style={styles.storeSelector}>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storeSelectorContent}
        >
          {sortedStores.map((store, index) => (
            <TouchableOpacity
              key={store.id || index}
              style={[
                styles.storeButton,
                store.id === (selectedStore || bestStore?.id) ? styles.storeButtonActive : null,
                index === 0 && !selectedStore ? styles.storeButtonActive : null
              ]}
              onPress={() => setSelectedStore(store.id)}
            >
              {store.logoUrl ? (
                <Image 
                  source={{ uri: store.logoUrl }} 
                  style={styles.storeLogo} 
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.storeLogo, {backgroundColor: '#ecf0f1', alignItems: 'center', justifyContent: 'center'}]}>
                  <Ionicons name="storefront-outline" size={20} color="#95a5a6" />
                </View>
              )}
              <Text 
                style={[
                  styles.storeButtonText,
                  store.id === (selectedStore || bestStore?.id) ? styles.storeButtonTextActive : null,
                  index === 0 && !selectedStore ? styles.storeButtonTextActive : null
                ]}
              >
                {store.name || 'Store'}
              </Text>
              <Text 
                style={[
                  styles.storePriceText,
                  store.id === (selectedStore || bestStore?.id) ? styles.storeButtonTextActive : null,
                  index === 0 && !selectedStore ? styles.storeButtonTextActive : null
                ]}
              >
                £{(store.totalPrice || 0).toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {storeDetails ? (
        <View style={styles.storeDetails}>
          <View style={styles.storeHeader}>
            {storeDetails.logoUrl ? (
              <Image 
                source={{ uri: storeDetails.logoUrl }} 
                style={styles.storeDetailLogo} 
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.storeDetailLogo, {backgroundColor: '#ecf0f1', alignItems: 'center', justifyContent: 'center'}]}>
                <Ionicons name="storefront-outline" size={24} color="#95a5a6" />
              </View>
            )}
            <View style={styles.storeInfo}>
              <Text style={styles.storeDetailName}>{storeDetails.name || 'Selected Store'}</Text>
              <Text style={styles.storeAddress}>{storeDetails.address || 'Address not available'}</Text>
              <Text style={styles.storeDistance}>{storeDetails.distance || 0}km away</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>£{(storeDetails.totalPrice || 0).toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{storeDetails.availableProducts || 0}</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{storeDetails.unavailableProducts || 0}</Text>
              <Text style={styles.statLabel}>Unavailable</Text>
            </View>
          </View>

          {bestStore?.id === storeDetails?.id ? (
            <View style={styles.bestStoreTag}>
              <Ionicons name="ribbon-outline" size={16} color="#fff" />
              <Text style={styles.bestStoreTagText}>Best Value</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>View Store Details</Text>
          </TouchableOpacity>
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
  savingsSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  savingsTitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  savingsAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 4,
  },
  savingsSubtext: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  storeSelector: {
    marginBottom: 16,
  },
  storeSelectorContent: {
    paddingVertical: 8,
  },
  storeButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginRight: 12,
    width: 100,
  },
  storeButtonActive: {
    backgroundColor: '#3498db',
  },
  storeLogo: {
    width: 40,
    height: 40,
    marginBottom: 8,
    borderRadius: 20,
  },
  storeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  storeButtonTextActive: {
    color: '#fff',
  },
  storePriceText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  storeDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  storeHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  storeDetailLogo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  storeInfo: {
    flex: 1,
  },
  storeDetailName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  storeAddress: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  storeDistance: {
    fontSize: 14,
    color: '#7f8c8d',
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
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#ecf0f1',
  },
  bestStoreTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#2ecc71',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  bestStoreTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  actionButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default StoreComparison;