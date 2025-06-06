import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable} from 'react-native';
import { Icon } from '@/utils/WebCompatibleIcons';

import Modal from '@/components/ui/Modal';
import AddStockItemForm from '@/components/stock/AddStockItemForm';
import { CATEGORIES_ICONS, LOCATIONS } from '@/constants/stockConstants';


const StockItemCard = ({ item, onEdit, onDelete }) => {
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
  
    // Check if item is low in stock based on minQuantity
    const isLowStock = item.quantity <= (item.minQuantity || 3);
    
    // Check if the item is close to expiration (7 days)
    const isExpiring = item.expiryDate && new Date(item.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const formatDate = (dateString) => {
        if (!dateString) return 'Not defined';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };
    
    const getCategoryLabel = (categoryId) => {
        if (!categoryId) return 'Others';
        const category = CATEGORIES_ICONS.find(cat => cat.id === categoryId);
        return category ? category.label : 'Others';
    };
      
    const getLocationLabel = (locationId) => {
        if (!locationId) return 'Others';
        const location = LOCATIONS.find(loc => loc.id === locationId);
        return location ? location.label : 'Others';
    };
    
    const handleEdit = (updatedData) => {
        // Checks if onEdit function is provided
        if (typeof onEdit === 'function') {
          // Make sure minQuantity is present even if it has not been changed
          const updates = {
            ...updatedData,
            minQuantity: updatedData.minQuantity || item.minQuantity || Math.max(1, Math.floor(updatedData.quantity * 0.2))
          };
          
          onEdit(updates);
          setShowEditModal(false);
        }
    };
    
    

    return (
        <Pressable
          style={styles.container}
          onPress={() => setShowDetailsModal(true)}
        >
          {/* Main content */}
          <View style={styles.mainContent}>
            <View style={styles.nameContainer}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              
              {/* Status Badges */}
              <View style={styles.badgeContainer}>
                {isLowStock && (
                  <View style={styles.lowStockBadge}>
                    <Text style={styles.badgeText}>Low</Text>
                  </View>
                )}
                {isExpiring && (
                  <View style={styles.expiringBadge}>
                    <Text style={styles.badgeText}>Expiring</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.detailsRow}>
              <Text style={styles.quantity}>
                {item.quantity} {item.unit || 'unit'}
              </Text>
              {item.category && (
                <Text style={styles.category}>
                  {getCategoryLabel(item.category)}
                </Text>
              )}
              {item.location && (
                <Text style={styles.location}>
                  {getLocationLabel(item.location)}
                </Text>
              )}
            </View>
          </View>
          
          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={styles.actionButton}
              onPress={() => setShowEditModal(true)}
              hitSlop={10}
            >
              
              <Icon name="edit" size={24} color="#4A5568" />
            </Pressable>
            
            <Pressable
              style={styles.actionButton}
              onPress={() => typeof onDelete === 'function' && onDelete()}
              hitSlop={10}
            >
              
              <Icon name="delete" size={24} color="#E53E3E" />
            </Pressable>
          </View>
    
          {/* Details modal */}
          <Modal
            visible={showDetailsModal}
            title="Item Details"
            onClose={() => setShowDetailsModal(false)}
          >
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>{item.name}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quantity:</Text>
                <Text style={styles.detailValue}>
                  {item.quantity} {item.unit || 'unit'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category:</Text>
                <Text style={styles.detailValue}>
                  {getCategoryLabel(item.category)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>
                  {getLocationLabel(item.location)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Expiration date:</Text>
                <Text style={[
                  styles.detailValue,
                  isExpiring && styles.warningText
                ]}>
                  {formatDate(item.expiryDate)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Minimum Qty.:</Text>
                <Text style={styles.detailValue}>
                  {item.minQuantity || 1} {item.unit || 'unit'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={styles.statusContainer}>
                  {isLowStock && (
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>Low Stock</Text>
                    </View>
                  )}
                  {isExpiring && (
                    <View style={[styles.statusBadge, styles.statusBadgeExpiring]}>
                      <Text style={styles.statusBadgeText}>Near Expiration</Text>
                    </View>
                  )}
                  {!isLowStock && !isExpiring && (
                    <Text style={styles.normalStatus}>Normal</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Added:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Updated:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(item.updatedAt)}
                </Text>
              </View>
              
              {item.notes && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Notes:</Text>
                  <Text style={styles.detailValue}>{item.notes}</Text>
                </View>
              )}
              
              {item.lastPurchaseDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Last Purchase:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(item.lastPurchaseDate)}
                  </Text>
                </View>
              )}
              
              {item.lastPurchasePrice && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Last Price:</Text>
                  <Text style={styles.detailValue}>
                    £{item.lastPurchasePrice.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.detailsActions}>
              <Pressable
                style={[styles.detailsButton, styles.secondaryButton]}
                onPress={() => {
                  setShowDetailsModal(false);
                  setShowEditModal(true);
                }}
              >
                <Text style={styles.secondaryButtonText}>Edit</Text>
              </Pressable>
              
              <Pressable
                style={[styles.detailsButton, styles.primaryButton]}
                onPress={() => {
                  handleEdit({ quantity: item.quantity + 1 });
                  setShowDetailsModal(false);
                }}
              >
                <Text style={styles.primaryButtonText}>Add Unit</Text>
              </Pressable>
            </View>
          </Modal>
    
          {/* Editing modal */}
          <Modal
            visible={showEditModal}
            title="Edit Item"
            onClose={() => setShowEditModal(false)}
          >
            <AddStockItemForm
              initialValues={{
                name: item.name,
                quantity: item.quantity.toString(),
                category: item.category,
                expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
                location: item.location,
                minQuantity: item.minQuantity?.toString() || '1'
              }}
              onSubmit={(name, quantity, category, expiryDate, location, minQuantity) => {
                handleEdit({
                  name,
                  quantity: parseFloat(quantity),
                  category,
                  expiryDate,
                  location,
                  minQuantity: parseInt(minQuantity) || Math.max(1, Math.floor(quantity * 0.2))
                });
              }}
              categories={CATEGORIES_ICONS}
              locations={LOCATIONS}
              isEditMode={true}
            />
          </Modal>
        </Pressable>
      );
    };
    
    const styles = StyleSheet.create({
      container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
        elevation: 2,
      },
      mainContent: {
        flex: 1,
      },
      nameContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      },
      name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3748',
        flex: 1,
      },
      badgeContainer: {
        flexDirection: 'row',
      },
      lowStockBadge: {
        backgroundColor: '#E53E3E',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 4,
      },
      expiringBadge: {
        backgroundColor: '#ED8936',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 4,
      },
      badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
      },
      detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
      },
      quantity: {
        fontSize: 14,
        color: '#4A5568',
        marginRight: 8,
      },
      category: {
        fontSize: 12,
        color: '#718096',
        backgroundColor: '#EDF2F7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8,
      },
      location: {
        fontSize: 12,
        color: '#718096',
        backgroundColor: '#EDF2F7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
      },
      actions: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      actionButton: {
        padding: 8,
        marginLeft: 4,
      },
      detailsContainer: {
        marginBottom: 20,
      },
      detailRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
      },
      detailLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4A5568',
      },
      detailValue: {
        flex: 2,
        fontSize: 14,
        color: '#2D3748',
      },
      warningText: {
        color: '#ED8936',
      },
      statusContainer: {
        flex: 2,
        flexDirection: 'row',
        flexWrap: 'wrap',
      },
      statusBadge: {
        backgroundColor: '#E53E3E',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginRight: 4,
        marginBottom: 4,
      },
      statusBadgeExpiring: {
        backgroundColor: '#ED8936',
      },
      statusBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
      },
      normalStatus: {
        fontSize: 14,
        color: '#38A169',
      },
      detailsActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
      detailsButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
      },
      primaryButton: {
        backgroundColor: '#4B0082',
      },
      primaryButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
      },
      secondaryButton: {
        backgroundColor: '#E2E8F0',
      },
      secondaryButtonText: {
        color: '#4A5568',
        fontWeight: 'bold',
        fontSize: 14,
      },
    });
    
export default StockItemCard;