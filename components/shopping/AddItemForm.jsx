import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import Button from '@/components/ui/Button';
import { CATEGORIES_ICONS, UNITS } from '@/constants/stockConstants';

const AddItemForm = ({ 
    onSubmit,
    initialValues = null,
    categories = CATEGORIES_ICONS,
    units = UNITS,
    isEditMode = false
}) => {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [unit, setUnit] = useState('un');
    const [estimatedPrice, setEstimatedPrice] = useState('');
    const [category, setCategory] = useState('others');
    const [note, setNote] = useState('');
    const [nameError, setNameError] = useState('');
    const [showUnitDropdown, setShowUnitDropdown] = useState(false);

    useEffect(() => {
        if (initialValues) {
            setName(initialValues.name || '');
            setQuantity(initialValues.quantity ? initialValues.quantity.toString() : '1');
            setUnit(initialValues.unit || 'un');
            setEstimatedPrice(initialValues.estimatedPrice ? initialValues.estimatedPrice.toString() : '');
            
            // Normalize category
            const normalizedCategory = 
                typeof initialValues.category === 'string' 
                    ? initialValues.category
                    : initialValues.category?.id || 'others';
            
            setCategory(normalizedCategory);
            setNote(initialValues.notes || '');
        }
    }, [initialValues]);

    const validateForm = () => {
        let isValid = true;
        if (!name.trim()) {
            setNameError('Item name is required');
            isValid = false;
        } else {
            setNameError('');
        }
        return isValid;
    };

    const handleSubmit = () => {
        if (!validateForm()) return;
    
        const parsedQuantity = parseInt(quantity) || 1;
        const parsedPrice = estimatedPrice ? parseFloat(estimatedPrice) : null;
    
        const normalizedCategory = 
            typeof category === 'string' 
                ? category 
                : category?.id || 'others';
    
        if (typeof onSubmit === 'function') {
            onSubmit(
                name.trim(),
                parsedQuantity,
                unit,
                parsedPrice,
                normalizedCategory,
                note.trim()
            );
        } else {
            console.warn('onSubmit is not a function');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/* Item name */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                    style={[styles.input, nameError ? styles.inputError : null]}
                    value={name}
                    onChangeText={(text) => {
                        setName(text);
                        if (text.trim()) setNameError('');
                    }}
                    placeholder="Ex: Milk, Bread, Rice"
                />
                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>

            {/* Quantity */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                    style={styles.input}
                    value={quantity}
                    onChangeText={(text) => setQuantity(text)}
                    placeholder="Ex: 2"
                    keyboardType="numeric"
                />
            </View>

            {/* Unit */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Unit</Text>
                <Pressable
                    style={styles.dropdownHeader}
                    onPress={() => setShowUnitDropdown(!showUnitDropdown)}
                >
                    <Text style={styles.dropdownText}>
                        {units.find(u => u.id === unit)?.label || 'Unit'}
                    </Text>
                </Pressable>
    
                {showUnitDropdown ? (
                    <View style={styles.dropdownList}>
                        {units.map((u) => (
                            <Pressable
                                key={u.id}
                                style={styles.dropdownItem}
                                onPress={() => {
                                    setUnit(u.id);
                                    setShowUnitDropdown(false);
                                }}
                            >
                                <Text style={styles.dropdownItemText}>{u.label}</Text>
                            </Pressable>
                        ))}
                    </View>
                ) : null}
            </View>

            {/* Estimated Price */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Estimated Price (£)</Text>
                <TextInput
                    style={styles.input}
                    value={estimatedPrice}
                    onChangeText={(text) => setEstimatedPrice(text)}
                    placeholder="Optional"
                    keyboardType="decimal-pad"
                />
            </View>

            {/* Category */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryContainer}>
                    {categories.filter(cat => 
                        ['food', 'drink', 'clean', 'hygiene', 'others'].includes(cat.id)
                    ).map((cat) => (
                        <Pressable
                            key={cat.id}
                            style={[
                                styles.categoryOption,
                                category === cat.id ? styles.categoryOptionActive : null,
                            ]}
                            onPress={() => setCategory(cat.id)}
                        >
                            <Text
                                style={[
                                    styles.categoryOptionText,
                                    category === cat.id ? styles.categoryOptionTextActive : null,
                                ]}
                            >
                                {cat.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* Notes */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={note}
                    onChangeText={(text) => setNote(text)}
                    placeholder="Optional notes about this item"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                />
            </View>

            <Button
                title={isEditMode ? "Save Changes" : "Add Item"}
                onPress={handleSubmit}
                style={styles.submitButton}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 20,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4A5568',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
    },
    inputError: {
        borderColor: '#E53E3E',
    },
    errorText: {
        color: '#E53E3E',
        fontSize: 12,
        marginTop: 4,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    categoryOption: {
        backgroundColor: '#EDF2F7',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
    },
    categoryOptionActive: {
        backgroundColor: '#4338CA',
    },
    categoryOptionText: {
        fontSize: 14,
        color: '#4A5568',
    },
    categoryOptionTextActive: {
        color: '#FFFFFF',
        fontWeight: '500',
    },
    submitButton: {
        marginTop: 16,
        alignSelf: 'center',
        width: '60%',
    },
    dropdownHeader: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 12,
    },
    dropdownList: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        marginTop: 4,
    },
    dropdownItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    dropdownText: {
        fontSize: 16,
        color: '#4A5568',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#4A5568',
    },
});

export default AddItemForm;