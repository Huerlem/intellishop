import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Button from '@/components/ui/Button';
import { CATEGORIES_ICONS, LOCATIONS, UNITS } from '@/constants/stockConstants';

const AddStockItemForm = ({ 
  onSubmit,
  initialValues = null,
  categories = CATEGORIES_ICONS,
  locations = LOCATIONS,
  units = UNITS,
  isEditMode = false
}) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('unit');
  const [category, setCategory] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [location, setLocation] = useState('');
  const [minQuantity, setMinQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  // Load initial values ​​if provided (for editing)
  useEffect(() => {
    if (initialValues) {
      setName(initialValues.name || '');
      setQuantity(initialValues.quantity ? initialValues.quantity.toString() : '1');
      setUnit(initialValues.unit || 'unit');
      setCategory(initialValues.category || '');
      
      // Dealing with expiration date
      if (initialValues.expiryDate) {
        if (initialValues.expiryDate instanceof Date) {
          setExpiryDate(formatDateForInput(initialValues.expiryDate));
        } else if (typeof initialValues.expiryDate === 'string') {
          setExpiryDate(initialValues.expiryDate);
        }
      } else {
        setExpiryDate('');
      }
      
      setLocation(initialValues.location || '');
      setMinQuantity(initialValues.minQuantity ? initialValues.minQuantity.toString() : '1');
      setNotes(initialValues.notes || '');
    }
  }, [initialValues]);

  // Formats a date as DD-MM-YYYY for input
  const formatDateForInput = (date) => {
    if (!date) return '';
    
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      
      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Converts a DD-MM-YYYY string to a Date object
  const parseDate = (dateString) => {
    if (!dateString || dateString.trim() === '') return null;
    
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Months in JS are 0-indexed
    const year = parseInt(parts[2], 10);
    
    return new Date(year, month, day);
  };

  // Extract numeric value from string (removing units like "l", "ml", etc.)
  const extractNumericValue = (value) => {
    // Replace commas with dots for decimal numbers
    const normalizedValue = value.toString().replace(',', '.');
    // Extract only the numbers and decimal points
    const matches = normalizedValue.match(/^(\d*\.?\d+)/);
    return matches ? parseFloat(matches[0]) : NaN;
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Validate name
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Validate quantity - extract numeric value
    const qtyNum = extractNumericValue(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      newErrors.quantity = 'Quantity must be a positive number';
    }

    // Validar quantidade mínima - extract numeric value
    const minQtyNum = extractNumericValue(minQuantity);
    if (isNaN(minQtyNum) || minQtyNum < 0) {
      newErrors.minQuantity = 'Minimum quantity must be a non-negative number';
    }

    // Validate expiration date (if provided)
    if (expiryDate.trim()) {
      const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
      const match = expiryDate.match(dateRegex);
      
      if (!match) {
        newErrors.expiryDate = 'Use DD-MM-YYYY format';
      } else {
        const parsedDate = parseDate(expiryDate);
        
        if (!parsedDate || isNaN(parsedDate.getTime())) {
          newErrors.expiryDate = 'Invalid date';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      // Convert quantity and minimum quantity to numbers
      const parsedQuantity = extractNumericValue(quantity);
      const parsedMinQuantity = extractNumericValue(minQuantity) || Math.max(1, Math.floor(parsedQuantity * 0.2));
      
      // Convert expiration date to Date object
      const parsedExpiryDate = parseDate(expiryDate);
      
      // Call onSubmit with validated values
      if (typeof onSubmit === 'function') {
        onSubmit(
          name.trim(),
          parsedQuantity,
          category,
          parsedExpiryDate,
          location,
          parsedMinQuantity,
          notes.trim(),
          unit
        );
      }
    } else {
      console.log('Erros de validação:', errors);
    }
  };

  // Clear specific error when user corrects field
  const clearError = (field) => {
    if (errors[field]) {
      const newErrors = {...errors};
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* Item name */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Item Name</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={name}
          onChangeText={(text) => {
            setName(text);
            clearError('name');
          }}
          placeholder="Ex: Rice, Milk, etc."
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      {/* Line for quantity and unit */}
      <View style={styles.row}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={[styles.input, errors.quantity && styles.inputError]}
            value={quantity}
            onChangeText={(text) => {
              setQuantity(text);
              clearError('quantity');
            }}
            keyboardType="numeric"
            placeholder="Ex: 5"
          />
          {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
          {!errors.quantity && (
            <Text style={styles.helperText}>Just numbers (ex: 2 ou 2.5)</Text>
          )}
        </View>
        
        <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Unit</Text>
          <View style={styles.unitsContainer}>
            {UNITS.map((unitOption) => (
              <Pressable
                key={unitOption.id}
                style={[
                  styles.unitOption,
                  unit === unitOption.id && styles.unitOptionActive
                ]}
                onPress={() => setUnit(unitOption.id)}
              >
                <Text
                  style={[
                    styles.unitOptionText,
                    unit === unitOption.id && styles.unitOptionTextActive
                  ]}
                >
                  {unitOption.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Minimum quantity */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Minimum quantity</Text>
        <TextInput
          style={[styles.input, errors.minQuantity && styles.inputError]}
          value={minQuantity}
          onChangeText={(text) => {
            setMinQuantity(text);
            clearError('minQuantity');
          }}
          keyboardType="numeric"
          placeholder="Ex: 1"
        />
        {errors.minQuantity && <Text style={styles.errorText}>{errors.minQuantity}</Text>}
        {!errors.minQuantity && (
          <Text style={styles.helperText}>Just numbers (ex: 1 ou 0.5)</Text>
        )}
      </View>

      {/* Category */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.optionsContainer}>
          {CATEGORIES_ICONS.map((cat) => (
            <Pressable
              key={cat.id}
              style={[
                styles.option,
                category === cat.id && styles.optionActive
              ]}
              onPress={() => setCategory(cat.id)}
            >
              {cat.icon && <MaterialIcons name={cat.icon} size={18} style={[
                styles.optionIcon,
                category === cat.id && styles.optionIconActive
              ]} />}
              <Text 
                style={[
                  styles.optionText,
                  category === cat.id && styles.optionTextActive
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Expiration date */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Expiration date (Optional)</Text>
        <TextInput
          style={[styles.input, errors.expiryDate && styles.inputError]}
          value={expiryDate}
          onChangeText={(text) => {
            setExpiryDate(text);
            clearError('expiryDate');
          }}
          placeholder="DD-MM-YYYY"
        />
        {errors.expiryDate && <Text style={styles.errorText}>{errors.expiryDate}</Text>}
      </View>

      {/* Storage location */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Local</Text>
        <View style={styles.optionsContainer}>
          {LOCATIONS.map((loc) => (
            <Pressable
              key={loc.id}
              style={[
                styles.option,
                location === loc.id && styles.optionActive
              ]}
              onPress={() => setLocation(loc.id)}
            >
              <Text 
                style={[
                  styles.optionText,
                  location === loc.id && styles.optionTextActive
                ]}
              >
                {loc.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Notes (optional) */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional information about the item..."
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Submit button */}
      <Button
        title={isEditMode ? "Update Item" : "Add Item"}
        onPress={handleSubmit}
        style={styles.submitButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3748',
    marginBottom: 8,
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
  helperText: {
    color: '#718096',
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  unitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
    borderRadius: 16,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  optionText: {
    fontSize: 14,
    color: '#4A5568',
  },
  optionTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  optionIcon: {
    marginRight: 4,
    color: '#4A5568',
  },
  optionIconActive: {
    color: 'white',
  },
  unitOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    margin: 3,
    borderRadius: 12,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unitOptionActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  unitOptionText: {
    fontSize: 12,
    color: '#4A5568',
  },
  unitOptionTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 16,
    marginBottom: 32,
  },
});

export default AddStockItemForm;