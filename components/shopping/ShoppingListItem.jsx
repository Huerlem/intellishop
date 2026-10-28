import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { Icon } from '@/utils/WebCompatibleIcons';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { CATEGORIES_ICONS, UNITS } from '@/constants/stockConstants';

const ShoppingListItem = ({
    item,
    onToggleCheck,
    onDelete,
    onAddToStock,
    onComparePrice,
    onEdit,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const swipeableRef = useRef(null);

    if (!item) return null;

    const formatPrice = (price) => {
        if (!price && price !== 0) return '';
        return `£${price.toFixed(2)}`;
    };

    const ActionButtons = () => (
        <View style={styles.inlineActions}>
            {onComparePrice ? (
                <Pressable
                    style={[styles.actionButton, styles.compareButton]}
                    onPress={() => onComparePrice(item)}
                    accessibilityRole="button"
                    accessibilityLabel="Compare prices">
                    <Icon name="pricetag-outline" size={18} color="#FFF" />
                </Pressable>
            ) : null}
            <Pressable
                style={[styles.actionButton, styles.stockButton]}
                onPress={() => onAddToStock?.(item)}
                disabled={item.addedToStock}>
                <Icon name={item.addedToStock ? "cube" : "cube-outline"} size={18} color="#FFF" />
            </Pressable>
            <Pressable style={[styles.actionButton, styles.editButton]} onPress={() => onEdit?.(item)}>
                <Icon name="create-outline" size={18} color="#FFF" />
            </Pressable>
            <Pressable 
                style={[styles.actionButton, styles.deleteButton]} 
                onPress={() => onDelete?.()}
                testID="delete-button"
                accessibilityLabel="Delete item"
            >
                <Icon name="trash-outline" size={18} color="#FFF" />
            </Pressable>
        </View>
    );

    const getCategoryText = () => {
        // Check if it is a simple string first
        if (typeof item.category === 'string') return item.category;
        
        // If it is an object, try to extract label
        if (item.category && typeof item.category === 'object') {
            // First check if it has a label directly
            if (item.category.label) return item.category.label;
            
            // Check if it matches any known category
            const foundCategory = CATEGORIES_ICONS.find(cat => 
                cat.id === (item.category.id || item.category)
            );
            return foundCategory ? foundCategory.label : 'Others';
        }
        
        // Fallback to 'Others'
        return 'Others';
    };

    const ItemContent = () => (
        <View style={[
            styles.container,
            item.checked && styles.checkedContainer,
            isOpen && styles.swipeOpen
        ]}>
            <Pressable
                style={styles.checkbox}
                accessibilityLabel={`Toggle ${item.name}`}
                onPress={() => onToggleCheck?.(item.id, !item.checked)}
                disabled={disabled}>
                <Icon
                    name={item.checked ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={item.checked ? "#4338CA" : "#A0AEC0"}
                />
            </Pressable>

            <View style={styles.content}>
                <View style={styles.nameRow}>
                    <Text style={[styles.name, item.checked && styles.checkedText]} numberOfLines={1}>
                        {item.name || ''}
                    </Text>
                    {item.addedToStock && (
                        <View style={styles.stockBadge}>
                            <Icon name="cube" size={12} color="#FFFFFF" />
                            <Text style={styles.stockBadgeText}>In Stock</Text>
                        </View>
                    )}
                </View>

                <View style={styles.detailsRow}>
                    <Text style={styles.quantity}>
                        {item.quantity || 0} {item.unit || 'un'}
                    </Text>
                    {item.estimatedPrice > 0 && (
                        <Text style={styles.price}>{formatPrice(item.estimatedPrice)}</Text>
                    )}
                    {item.category && (
                        <Text style={styles.category}>
                            {getCategoryText()}
                        </Text>
                    )}
                </View>

                {Platform.OS === 'web' && <ActionButtons />}
            </View>
        </View>
    );

    if (Platform.OS === 'web') {
        return <ItemContent />;
    }

    return (
        <ReanimatedSwipeable
            ref={swipeableRef}
            renderRightActions={() => <ActionButtons />}
            onSwipeableOpen={() => setIsOpen(true)}
            onSwipeableClose={() => setIsOpen(false)}
            enabled={!disabled}>
            <ItemContent />
        </ReanimatedSwipeable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    checkedContainer: {
        backgroundColor: '#F7FAFC',
    },
    swipeOpen: {
        backgroundColor: '#F5F7FA',
    },
    checkbox: {
        marginRight: 10,
        marginTop: 4,
    },
    content: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    name: {
        fontSize: 16,
        color: '#4A5568',
        flex: 1,
    },
    checkedText: {
        textDecorationLine: 'line-through',
        color: '#A0AEC0',
    },
    stockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4338CA',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 8,
    },
    stockBadgeText: {
        fontSize: 10,
        color: '#FFFFFF',
        marginLeft: 2,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    quantity: {
        fontSize: 14,
        color: '#718096',
        marginRight: 12,
    },
    price: {
        fontSize: 14,
        color: '#4338CA',
        marginRight: 12,
    },
    category: {
        fontSize: 12,
        color: '#A0AEC0',
        backgroundColor: '#F7FAFC',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    inlineActions: {
        flexDirection: 'row',
        marginTop: 8,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    compareButton: {
        backgroundColor: '#3182CE',
    },
    stockButton: {
        backgroundColor: '#38A169',
    },
    deleteButton: {
        backgroundColor: '#E53E3E',
    },
    editButton: {
        backgroundColor: '#DD6B20',
    },
});

export default ShoppingListItem;