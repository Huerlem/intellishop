import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LowStockAlert = ({ count, style }) => {
  // Ensure count is a valid number
  const itemCount = typeof count === 'number' ? count : 0;
  
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="warning" size={20} color="white" style={styles.icon} />
      <Text style={styles.text}>
        {itemCount} {itemCount === 1 ? 'item' : 'items'} with low stock
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default LowStockAlert;