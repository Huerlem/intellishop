import React, { useContext, useEffect, useState } from 'react';
import  { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

//Contexts
import { AuthContext } from '@/context/AuthContext';
import { ShoppingListContext } from '@/context/ShoppingListContext';
import { StockContext } from '@/context/StockContext';

//Components
import ShoppingListItem from '@/components/shopping/ShoppingListItem';
import StockItemCard from '@/components/stock/StockItemCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ConfirmModal from '@/components/common/ConfirmModal';

import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/src/navigation/routes';
import { colors, typography } from '@/src/theme';

export default function HomeScreen() {
    //Context States
    const router = useRouter();
    const { userData } = useContext(AuthContext);
    const { currentList, fetchShoppingLists, loading: listLoading } = useContext(ShoppingListContext);
    const { lowStockItems, fetchStockItems, loading: stockLoading, removeStockItem } = useContext(StockContext);
    const { logout } = useAuth();
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [itemType, setItemType] = useState('');
    const [itemToDelete, setItemToDelete] = useState(null);
    const { removeItem, toggleItemChecked, updateItem } = useContext(ShoppingListContext);
    const { addListItemsToStock } = useContext(StockContext);
    

    //Local State
    const [refreshing, setRefreshing] = useState(false);

    const prepareDeleteItem = (item, type) => {
        setItemToDelete(item);
        setItemType(type);
        setDeleteConfirmVisible(true);
    };

    const confirmDeleteItem = async () => {
        if (itemToDelete) {
            if (itemType === 'stock') {
                await removeStockItem(itemToDelete.id);
            } else if (itemType === 'shopping') {
                await removeItem(itemToDelete.id);
            }
            setDeleteConfirmVisible(false);
            setItemToDelete(null);
            setItemType('');
        }
    };

    const cancelDeleteItem = () => {
        setDeleteConfirmVisible(false);
        setItemToDelete(null);
    };
    
    const handleAddToStock = async (item) => {
        await updateItem(item.id, { addedToStock: true });
        const result = await addListItemsToStock([item]);
    
        if (result.success) {
            Alert.alert('Success', `${item.name} added to stock`);
        } else {
            Alert.alert('Error', 'Failed to add item to stock');
        }
    };
      

    //Effect to load begin state
    useEffect(() => {
        fetchInitialData();
    }, []);

    //Function to fetch begin data
    const fetchInitialData = async () => {
        await Promise.all([
            fetchShoppingLists(),
            fetchStockItems()
        ]);
    };

    //Handles pull-to-refresh
    const onRefresh = async () => {
        setRefreshing(true);
        await fetchInitialData();
        setRefreshing(false);
    };

    //User name form
    const getFirstname = () => {
        if (!userData || !userData.displayName) return '';
        return userData.displayName?.split(' ')[0] || '';
    };

    // Plain greeting (Figma P01). The V1 AI-generated greeting was removed in M1:
    // it called Gemini from the device with an embedded key.
    const getGreeting = () => {
        const hour = new Date().getHours();
        const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
        const name = getFirstname();
        return name ? `${part}, ${name}` : part;
    };

    const renderGreetingSection = () => {
        return (
            <View style={styles.greetingSection}>
                <Text style={styles.greetingText} accessibilityRole="header">{getGreeting()}</Text>
            </View>
        );
    };

    //Render Current Shopping List section
    const renderCurrentListSection = () => {
        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Current List</Text>
                    <TouchableOpacity style={styles.sectionButtonText} onPress={() => router.push(ROUTES.lists)}>
                        <Text style={styles.sectionButtonText}>See All</Text>
                    </TouchableOpacity>
                </View>

                {currentList ? (
                    <>
                        <View style={styles.listHeader}>
                            <Text style={styles.listName}>{currentList.name}</Text>
                            <Text style={styles.listItemCount}>
                                {currentList.items?.length || 0} {currentList.items?.length === 1 ? 'item' : 'items'}
                            </Text>
                        </View>

                        {currentList.items && currentList.items.length > 0 ? (
                            <FlatList
                                data={currentList.items.slice(0, 3)} //show only 3 items
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <ShoppingListItem
                                        item={item}
                                        onToggleCheck={(id, checked) => toggleItemChecked(id, checked)}  //will be implement to navigate to Shopping List screen
                                        onDelete={() => prepareDeleteItem(item, 'shopping')}
                                        onAddToStock={() => handleAddToStock(item)}
                                        disabled={false} //disable interaction with home scree
                                    />
                                )}
                                scrollEnabled={false}
                            />
                        ) : (
                            <View style={styles.emptyList}>
                                <Ionicons name="list-outline" size={24} color="#A0AEC0" />
                                <Text style={styles.emptyText}>Empty List</Text>
                            </View>
                        )}

                        {currentList.items && currentList.items.length > 3 && (
                            <TouchableOpacity
                                style={styles.showMoreButton}
                                onPress={() => router.push(ROUTES.lists)}>
                                    <Text style={styles.showMoreText}>
                                        +{currentList.items.length - 3} Items, see all
                                    </Text>
                                </TouchableOpacity>
                        )}
                    </>
                ) : (
                    <View style={styles.emptyList}>
                        <Ionicons name="cart-outline" size={32} color="#A0AEC0" />
                        <Text style={styles.emptyText}>No list created</Text>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => router.push(ROUTES.lists)}>
                                <Text style={styles.createButtonText}>Create list</Text>
                            </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    //Render Items with low level stock section
    const renderLowStockSection = () => {
        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Low Stock</Text>
                    <TouchableOpacity
                        style={styles.sectionButtonText}
                        onPress={() => router.push(ROUTES.pantry)}>
                            <Text style={styles.sectionButtonText}>See Stock</Text>
                        </TouchableOpacity>
                </View>

                {lowStockItems && lowStockItems.length > 0 ? (
                    <FlatList
                        horizontal
                        data={lowStockItems.slice(0, 5)} //Show only the frist 5 items
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <StockItemCard
                            item={item}
                            onPress={() => router.push(ROUTES.pantry)}
                            onDelete={() => prepareDeleteItem(item, 'stock')}
                          />
                        )}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                    />
                ) : (
                    <View style={styles.emptyList}>
                        <Ionicons name="checkmark-circle-outline" size={32} color="#38A169" />
                        <Text style={styles.emptyText}>All items at appropriate levels</Text>
                    </View>
                )}
            </View>
        );
    };

    //Render Fast actions section
    const renderQuickActions = () => {
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>

                <View style={styles.quickActionsGrid}>
                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => router.push(ROUTES.lists)}
                    accessibilityRole="button"
                    accessibilityLabel="Add item to a list">
                            <View style={[styles.actionIcon, styles.purpleAction]}>
                                <Ionicons name="add-outline" size={24} color="#FFFFFF" />
                            </View>
                            <Text style={styles.actionText}>Add Item</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push(ROUTES.pantry)}
                            accessibilityRole="button"
                            accessibilityLabel="Open Pantry">
                                <View style={[styles.actionIcon, styles.blueAction]}>
                                    <Ionicons name="cube-outline" size={24} color="#FFFFFF" />
                                </View>
                                <Text style={styles.actionText}>Pantry</Text>
                            </TouchableOpacity>
                </View>
            </View>
        );
    };

    const isLoading = listLoading || stockLoading;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.header}>
                <Text style={styles.headerTitle} accessibilityRole="header">IntelliShop</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => router.push(ROUTES.profile)}
                        accessibilityRole="button"
                        accessibilityLabel="Profile and settings"
                        hitSlop={8}>
                        <Ionicons name="person-circle-outline" size={28} color="#4338CA" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={async () => {
                            // The auth guard redirects to the welcome screen once signed out.
                            await logout();
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Sign out"
                        hitSlop={8}
                        style={{ marginLeft: 12 }}
                    >
                        <Ionicons name="log-out-outline" size={26} color="#E53E3E" />
                    </TouchableOpacity>
                </View>
            </View>

            {isLoading && !refreshing ? (
                <LoadingSpinner />
            ) : (
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#4338CA']}
                            tintColor="#4338CA"
                        />
                    }
                >
                    {renderGreetingSection()}
                    {renderCurrentListSection()}
                    {renderLowStockSection()}
                    {renderQuickActions()}
                </ScrollView>
            )}
            {/* Adicione o ConfirmModal aqui */}
            <ConfirmModal
                visible={deleteConfirmVisible}
                title={itemType === 'stock' ? "Delete Stock Item" : "Delete Shopping Item"}
                message={
                    itemToDelete
                        ? itemType === 'stock'
                            ? `Are you sure you want to remove "${itemToDelete.name}" from inventory?`
                            : `Are you sure you want to remove "${itemToDelete.name}" from your shopping list?`
                        : 'Are you sure you want to delete this item?'
                }
                onConfirm={confirmDeleteItem}
                onCancel={() => {
                    setDeleteConfirmVisible(false);
                    setItemToDelete(null);
                    setItemType('');
                }}
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
        backgroundColor: '#F7FAFC',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 20,
        color: '#4338CA',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scrollContent: {
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    greetingSection: {
        marginBottom: 20,
    },
    greetingText: {
        ...typography.h1,
        color: colors.content.primary,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: '#4A5568',
    },
    sectionButtonText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#4338CA',
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    listName: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: '#4A5568',
    },
    listItemCount: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#718096',
    },
    emptyList: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
    },
    emptyText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#718096',
        marginTop: 8,
    },
    createButton: {
        backgroundColor: '#4338CA',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginTop: 12,
    },
    createButtonText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#FFFFFF',
    },
    showMoreButton: {
        alignItems: 'center',
        paddingVertical: 8,
        marginTop: 8,
    },
    showMoreText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#4338CA',
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    actionCard: {
        width: '48%',
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    purpleAction: {
        backgroundColor: '#4338CA',
    },
    blueAction: {
        backgroundColor: '#3182CE',
    },
    greenAction: {
        backgroundColor: '#38A169',
    },
    orangeAction: {
        backgroundColor: '#DD6B20',
    },
    actionText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#4A5568',
        textAlign: 'center',
    },
});


