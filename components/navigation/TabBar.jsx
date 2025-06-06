import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const TabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  // Safe wrapper to load AI feature hook
  const useAIFeatureWrapper = () => {
    try {
      const { useAIFeatures } = require('../../hooks/useAIFeatures');
      return useAIFeatures();
    } catch (error) {
      console.warn('Error loading useAIFeature:', error);
      return { aiEnabled: true }; // Default fallback value
    }
  };

  // Safe wrapper to load shopping list hook
  const useShoppingListWrapper = () => {
    try {
      const { useShoppingList } = require('../../hooks/useShoppingList');
      return useShoppingList();
    } catch (error) {
      console.warn('Error loading useShoppingList:', error);
      return { items: [] };
    }
  };

  // Safe wrapper to load stock hook
  const useStockWrapper = () => {
    try {
      const { useStock } = require('../../hooks/useStock');
      return useStock();
    } catch (error) {
      console.warn('Error loading useStock:', error);
      return { lowStockCount: 0 };
    }
  };

  const { aiEnabled } = useAIFeatureWrapper();
  const { items } = useShoppingListWrapper();
  const { lowStockCount } = useStockWrapper();

  const pendingItems = Array.isArray(items)
    ? items.filter(item => item && !item.completed).length
    : 0;

  const getIonIcon = (routeName, isFocused) => {
    const color = isFocused ? '#4B0082' : '#95a5a6';

    switch (routeName) {
      case 'Home':
        return <Ionicons name={isFocused ? 'home' : 'home-outline'} size={24} color={color} />;
      case 'ShoppingList':
        return <Ionicons name={isFocused ? 'cart' : 'cart-outline'} size={24} color={color} />;
      case 'Stock':
        return <Ionicons name={isFocused ? 'cube' : 'cube-outline'} size={24} color={color} />;
      case 'AISuggestion':
        return <Ionicons name={isFocused ? 'bulb' : 'bulb-outline'} size={24} color={color} />;
      case 'Profile':
        return <Ionicons name={isFocused ? 'person' : 'person-outline'} size={24} color={color} />;
      default:
        return <Ionicons name={isFocused ? 'home' : 'home-outline'} size={24} color={color} />;
    }
  };

  if (!state || !Array.isArray(state.routes)) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets?.bottom || 0, 10) }]}>
      {state.routes.map((route, index) => {
        if (!route) return null;

        const { options } = descriptors[route.key] || {};
        const label = options?.tabBarLabel || options?.title || route.name || '';
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options?.tabBarAccessibilityLabel}
            testID={options?.tabBarTestID}
            onPress={onPress}
            style={styles.tabButton}
          >
            <View style={styles.iconContainer}>
              {getIonIcon(route.name, isFocused)}

              {/* Badge for ShoppingList */}
              {route.name === 'ShoppingList' && pendingItems > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingItems}</Text>
                </View>
              ) : null}

              {/* Badge for Stock */}
              {route.name === 'Stock' && lowStockCount > 0 ? (
                <View style={[styles.badge, styles.pulsingBadge]}>
                  <Text style={styles.badgeText}>{lowStockCount}</Text>
                </View>
              ) : null}

              {/* Badge for AISuggestion */}
              {route.name === 'AISuggestion' && !aiEnabled ? (
                <View style={styles.disabledBadge}>
                  <Text style={styles.disabledBadgeText}>!</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.tabLabel, { color: isFocused ? '#4B0082' : '#95a5a6' }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 8,
    elevation: 8,
    boxShadow: '0px -2px 3px rgba(0, 0, 0, 0.1)',

  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulsingBadge: {
    backgroundColor: '#e74c3c',
    // Optionally add a pulsing animation here using reanimated or Animated API
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  disabledBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFC107',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default TabBar;
