import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Input component with fixes to prevent rendering errors
 */
const Input = ({
    label, 
    value, 
    onChangeText,
    placeholder = '',
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
    onBlur,
    error = '', 
    style,
    inputStyle, 
    iconName,
    rightIcon, 
    onFocus,
    multiline = false,
    numberOfLines = 1,
    editable = true,
    containerStyle,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);

    // Ensure the value is always a valid string
    const safeValue = (value !== null && value !== undefined) ? String(value) : '';

    const handleFocus = (e) => {
        setIsFocused(true);
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        if (onBlur) onBlur(e);
    };

    return (
        <View style={[styles.container, style, containerStyle]}>
            {label ? (
                <Text style={styles.label}>{label}</Text>
            ) : null}

            <View 
                style={[
                    styles.inputContainer,
                    isFocused ? styles.focusedInput : null,
                    error ? styles.errorInput : null,
                    !editable ? styles.disabledInput : null,
                ]}
            >
                {iconName ? (
                    <Ionicons
                        name={iconName}
                        size={20}
                        color={error ? '#E53E3E' : (isFocused ? '#4338CA' : '#A0AEC0')}
                        style={styles.icon}
                    />
                ) : null}

                <TextInput
                    style={[
                        styles.input,
                        inputStyle,
                        multiline ? styles.multilineInput : null,
                        !editable ? styles.disabledText : null,
                    ]}
                    value={safeValue}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#A0AEC0"
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    multiline={multiline}
                    numberOfLines={multiline ? numberOfLines : undefined}
                    editable={editable}
                    {...props}
                />

                {rightIcon ? (
                    <View style={styles.rightIcon}>
                        {rightIcon}
                    </View>
                ) : null}
            </View>

            {error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4A5568',
        marginBottom: 6,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        backgroundColor: '#F7FAFC',
        paddingHorizontal: 12,
        height: 50,
    },
    focusedInput: {
        borderColor: '#4338CA',
        backgroundColor: '#FFFFFF',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        elevation: 2,
    },
    errorInput: {
        borderColor: '#E53E3E',
        backgroundColor: '#FFF5F5',
    },
    disabledInput: {
        backgroundColor: '#EDF2F7',
        borderColor: '#E2E8F0',
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#4A5568',
        height: '100%',
        paddingVertical: 10,
        ...Platform.select({
            web: {
                outlineStyle: 'none',
            },
        }),
    },
    multilineInput: {
        height: 'auto',
        paddingTop: 12,
        textAlignVertical: 'top',
    },
    disabledText: {
        color: '#A0AEC0',
    },
    rightIcon: {
        marginLeft: 10,
    },
    errorText: {
        fontSize: 12,
        color: '#E53E3E',
        marginTop: 4,
    },
});

export default Input;