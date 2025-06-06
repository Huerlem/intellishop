import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import ConfirmModal from '@/components/common/ConfirmModal';
import StockItem from '@/components/stock/StockItemCard';
import AddStockItemForm from '@/components/stock/AddStockItemForm';
import LowStockAlert from '@/components/stock/LowStockAlert';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';

import { StockContext } from '@/context/StockContext';

const SORT_OPTIONS = [
    { id: 'name', label: 'Name' },
    { id: 'quantity', label: 'Quantity' },
    { id: 'expiry', label: 'Expiry Date' },
    { id: 'category', label: 'Category' },
    { id: 'location', label: 'Location' },
];

const FILTER_OPTIONS = [
    { id: 'all', label: 'All' },
    { id: 'low', label: 'Low Quantity' },
    { id: 'expiring', label: 'Expiry Soon' },
];

const Stock = () => {
    const router = useRouter();
    const { 
        stockItems, 
        loading, 
        addStockItem, 
        updateStockItem, 
        removeStockItem,
        getLowStockItems,
        getExpiringItems,
        sortStockItems
    } = useContext(StockContext);
  
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSortModal, setShowSortModal] = useState(false);
    const [currentSort, setCurrentSort] = useState('name');
    const [currentFilter, setCurrentFilter] = useState('all');
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
     
    const prepareDeleteItem = (item) => {
        setItemToDelete(item);
        setDeleteConfirmVisible(true);
    };
      
    const confirmDeleteItem = () => {
        if (itemToDelete) {
          removeStockItem(itemToDelete.id);
          setDeleteConfirmVisible(false);
          setItemToDelete(null);
        }
    };
      
    const cancelDeleteItem = () => {
        setDeleteConfirmVisible(false);
        setItemToDelete(null);
    };
      
  
    const handleAddItem = async (name, quantity, category, expiryDate, location, minQuantity, notes, unit) => {
        console.log('Enviando:', { 
            name, quantity, category, expiryDate, location, minQuantity, notes, unit 
        });
        
        // Check required fields
        if (!category) {
            Alert.alert('Error', 'Please select a category');
            return;
        }
        
        if (!location) {
            Alert.alert('Error', 'Please select a location');
            return;
        }
        
        const { success, error } = await addStockItem(
            name, 
            quantity, 
            category, 
            expiryDate, 
            location, 
            minQuantity, 
            notes,
            unit
        );
        
        if (success) {
            setShowAddModal(false);
        } else {
            Alert.alert('Erro', error || 'Falha ao adicionar item');
        }
    };
  
  
  
    const handleDeleteItem = (id) => {
        Alert.alert(
            'Delete Confirmed',
            'Are you sure you want to remove this item from inventory?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    onPress: () => removeStockItem(id),
                    style: 'destructive',
                },
            ]
        );
    };
  
    const handleSort = (sortOption) => {
        setCurrentSort(sortOption);
        sortStockItems(sortOption);
        setShowSortModal(false);
    };
  
    const handleFilterChange = (filterOption) => {
        setCurrentFilter(filterOption);
    };
  
    // Filter items based on the selected filter
    const getFilteredItems = () => {
        switch (currentFilter) {
            case 'low':
                return getLowStockItems();
            case 'expiring':
                return getExpiringItems();
            case 'all':
            default:
                return stockItems;
        }
    };
  
    const filteredItems = getFilteredItems();
    
    const renderItem = ({ item }) => (
        <StockItem
            item={item}
            onDelete={() => prepareDeleteItem(item)}
            onEdit={(updates) => updateStockItem(item.id, updates)}
        />
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#4B0082" />
                </TouchableOpacity>
                <Text style={styles.title}>My Stock</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => setShowSortModal(true)}
                    >
                        <Ionicons name="funnel-outline" size={24} style={styles.actionIcon} color="#4B0082" />
                    </TouchableOpacity>
                </View>
            </View>
        
        <View style={styles.filterContainer}>
            {FILTER_OPTIONS.map((option) => (
                <TouchableOpacity
                    key={option.id}
                    style={[
                        styles.filterOption,
                        currentFilter === option.id && styles.filterOptionActive,
                    ]}
                    onPress={() => handleFilterChange(option.id)}
                >
                    <Text
                    style={[
                        styles.filterOptionText,
                        currentFilter === option.id && styles.filterOptionTextActive,
                    ]}
                    >
                        {option.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
        
        {currentFilter === 'low' && getLowStockItems().length > 0 && (
            <LowStockAlert
                count={getLowStockItems().length}
                style={styles.alertBanner}
            />
        )}
        
        {currentFilter === 'expiring' && getExpiringItems().length > 0 && (
            <View style={styles.expiringAlertBanner}>
            <Ionicons name="time-outline" size={20} style={styles.expiringAlertIcon} color="#E53E3E" />
            <Text style={styles.expiringAlertText}>
                {getExpiringItems().length} items close to their expiration date
            </Text>
            </View>
        )}
        
        {loading ? (
            <LoadingSpinner />
        ) : (
            <>
                {filteredItems.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="cube-outline" size={32} style={styles.emptyIcon} color="#A0AEC0" />
                    <Text style={styles.emptyText}>
                        {currentFilter === 'all'
                            ? 'Your stock is empty'
                            : currentFilter === 'low'
                            ? 'No items in low quantity'
                            : 'No items close to expiration'}
                    </Text>
                    <Text style={styles.emptySubtext}>
                        {currentFilter === 'all'
                            ? 'Add items to get started'
                            : 'All items are in proper quantities'}
                    </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredItems}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </>
        )}
        
        <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => setShowAddModal(true)}
        >
            <Text style={styles.floatingButtonText}>+</Text>
        </TouchableOpacity>
        
        <Modal
            visible={showAddModal}
            title="Add item to inventory"
            onClose={() => setShowAddModal(false)}
        >
            <AddStockItemForm onSubmit={handleAddItem} />
        </Modal>
        
        <Modal
            visible={showSortModal}
            title="Order by"
            onClose={() => setShowSortModal(false)}
        >
            <View style={styles.sortOptions}>
                {SORT_OPTIONS.map((option) => (
                    <TouchableOpacity
                        key={option.id}
                        style={[
                            styles.sortOption,
                            currentSort === option.id && styles.sortOptionActive,
                        ]}
                        onPress={() => handleSort(option.id)}
                    >
                        <Text
                            style={[
                                styles.sortOptionText,
                                currentSort === option.id && styles.sortOptionTextActive,
                            ]}
                        >
                            {option.label}
                    </Text>
                    {currentSort === option.id && (
                        <Ionicons name="checkmark" size={20} style={styles.sortCheckIcon} color="#4B0082" />

                    )}
                    </TouchableOpacity>
                ))}
            </View>
        </Modal>

        <ConfirmModal
            visible={deleteConfirmVisible}
            title="Delete Stock Item"
            message={
                itemToDelete
                ? `Are you sure you want to remove "${itemToDelete.name}" from inventory?`
                : 'Are you sure you want to delete this item?'
            }
            onConfirm={confirmDeleteItem}
            onCancel={cancelDeleteItem}
            confirmText="Delete"
            cancelText="Cancel"
            confirmStyle="destructive"
        />

        </SafeAreaView>
    );
};

    const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    backButton: {
        padding: 10,
    },
    backIcon: {
        width: 20,
        height: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    headerRight: {
        flexDirection: 'row',
    },
    actionButton: {
        padding: 10,
        marginLeft: 5,
    },
    actionIcon: {
        width: 20,
        height: 20,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1',
    },
    filterOption: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginHorizontal: 5,
        borderRadius: 20,
        backgroundColor: '#ecf0f1',
    },
    filterOptionActive: {
        backgroundColor: '#3498db',
    },
    filterOptionText: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    filterOptionTextActive: {
        color: 'white',
        fontWeight: 'bold',
    },
    alertBanner: {
        marginHorizontal: 20,
        marginTop: 10,
    },
    expiringAlertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f39c12',
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 5,
    },
    expiringAlertIcon: {
        width: 20,
        height: 20,
        tintColor: 'white',
        marginRight: 10,
    },
    expiringAlertText: {
        color: 'white',
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyIcon: {
        width: 100,
        height: 100,
        marginBottom: 20,
        opacity: 0.5,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#7f8c8d',
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#95a5a6',
        textAlign: 'center',
        marginTop: 10,
    },
    listContent: {
        padding: 20,
    },
    floatingButton: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#3498db',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',

        elevation: 5,
    },
    floatingButtonText: {
        fontSize: 24,
        color: 'white',
        fontWeight: 'bold',
    },
    sortOptions: {
        paddingHorizontal: 20,
    },
    sortOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1',
    },
    sortOptionActive: {
        borderBottomColor: '#3498db',
    },
    sortOptionText: {
        fontSize: 16,
        color: '#7f8c8d',
    },
    sortOptionTextActive: {
        color: '#3498db',
        fontWeight: 'bold',
    },
    sortCheckIcon: {
        width: 16,
        height: 16,
        tintColor: '#3498db',
    },
});

export default Stock;