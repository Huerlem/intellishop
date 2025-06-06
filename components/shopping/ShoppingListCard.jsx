import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ShoppingListCard = ({
    list,
    onPress,
    onEdit,
    onDelete,
    onShare,
    onExportToStock,
    onComparePrice
}) => {
    if (!list) return null;
    
    // Last Update Date Formatting
    const formatDate = (date) => {
        if (!date) return 'Never updated';
        
        try {
            const d = new Date(date);
            const today = new Date();
            
            // Se for hoje, mostrar hora
            if (d.toDateString() === today.toDateString()) {
                return `Today, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
            }
            
            // If it was yesterday
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            if (d.toDateString() === yesterday.toDateString()) {
                return 'Yesterday';
            }
            
            // Other cases
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        } catch (error) {
            return 'Date error';
        }
    };
  
    // Ensure values ​​are not null/undefined
    const itemsLength = list.items?.length || 0;
    const completedCount = list.completedCount || 0;
    const completedPercentage = list.completedPercentage || 0;
    const listId = list.id || 'unknown';
    const totalEstimatedPrice = list.totalEstimatedPrice || 0;
  
    return (
        <Pressable 
            style={styles.container}
            onPress={() => onPress && onPress(list)}
            testID={`shopping-list-${listId}`}
        >
            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>{list.name || 'Unnamed List'}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {itemsLength} {itemsLength === 1 ? 'item' : 'items'}
                        </Text>
                    </View>
                </View>
                
                <View style={styles.progressContainer}>
                    <View style={styles.progressBarContainer}>
                        <View 
                            style={[
                                styles.progressBar, 
                                { width: `${completedPercentage}%` }
                            ]} 
                        />
                    </View>
                    <Text style={styles.progressText}>
                        {completedCount}/{itemsLength} completed
                    </Text>
                </View>
                
                <View style={styles.infoRow}>
                    <Text style={styles.lastUpdated}>
                        Last updated: {formatDate(list.updatedAt)}
                    </Text>
                    {totalEstimatedPrice > 0 ? (
                        <Text style={styles.price}>
                            Est. £{totalEstimatedPrice.toFixed(2)}
                        </Text>
                    ) : null}
                </View>
            </View>
            
            <View style={styles.actions}>
                <Pressable 
                    style={[styles.actionButton, styles.compareButton]}
                    onPress={() => onComparePrice && onComparePrice(list)}
                    testID={`compare-prices-${listId}`}
                >
                    <Ionicons name="pricetag-outline" size={20} color="#FFF" />
                </Pressable>
                
                <Pressable 
                    style={[styles.actionButton, styles.stockButton]}
                    onPress={() => onExportToStock && onExportToStock(list)}
                    testID={`export-to-stock-${listId}`}
                >
                    <Ionicons name="cube-outline" size={20} color="#FFF" />
                </Pressable>
                
                <Pressable 
                    style={[styles.actionButton, styles.shareButton]}
                    onPress={() => onShare && onShare(list)}
                    testID={`share-list-${listId}`}
                >
                    <Ionicons name="share-outline" size={20} color="#FFF" />
                </Pressable>
                
                <Pressable 
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => onEdit && onEdit(list)}
                    testID={`edit-list-${listId}`}
                >
                    <Ionicons name="create-outline" size={20} color="#FFF" />
                </Pressable>
                
                <Pressable 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => onDelete && onDelete(list)}
                    testID={`delete-list-${listId}`}
                >
                    <Ionicons name="trash-outline" size={20} color="#FFF" />
                </Pressable>
            </View>
        </Pressable>
    );
};
  
const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        marginHorizontal: 16,
        marginBottom: 16,
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        elevation: 2,
        overflow: 'hidden',
    },
    content: {
        padding: 16,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4B0082',
        flex: 1,
    },
    badge: {
        backgroundColor: '#EBF4FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    badgeText: {
        fontSize: 12,
        color: '#3182CE',
        fontWeight: '500',
    },
    progressContainer: {
        marginBottom: 12,
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: '#EDF2F7',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#4B0082',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        color: '#718096',
        textAlign: 'right',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastUpdated: {
        fontSize: 12,
        color: '#A0AEC0',
    },
    price: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B0082',
    },
    actions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#EDF2F7',
    },
    actionButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    compareButton: {
        backgroundColor: '#3182CE',
    },
    stockButton: {
        backgroundColor: '#38A169', 
    },
    shareButton: {
        backgroundColor: '#805AD5',
    },
    editButton: {
        backgroundColor: '#DD6B20',
    },
    deleteButton: {
        backgroundColor: '#E53E3E',
    },
});
  
export default ShoppingListCard;