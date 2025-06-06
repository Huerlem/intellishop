import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TermsCheckboxProps {
    checked: boolean;
    onToggle: () => void;
    onPrivacyPress?: () => void;
    onTermsPress?: () => void;
}

const TermsCheckbox: React.FC<TermsCheckboxProps> = ({
    checked,
    onToggle,
    onTermsPress,
    onPrivacyPress,
}) => {
    // Safe function to handle pressings
    const handleTermsPress = (event: any) => {
        if (onTermsPress) {
            onTermsPress();
        }
        // Prevent spread to the parent
        event.stopPropagation();
    };

    const handlePrivacyPress = (event: any) => {
        if (onPrivacyPress) {
            onPrivacyPress();
        }
        // Prevent spread to the parent
        event.stopPropagation();
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity 
                onPress={onToggle} 
                style={styles.checkboxContainer}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                accessibilityLabel="Accept terms and privacy policy"
            >
                <View style={[
                    styles.checkbox,
                    checked ? styles.checkedCheckbox : null
                ]}>
                    {checked ? (
                        <Ionicons
                            name="checkmark"
                            size={16}
                            color="#FFFFFF"
                        />
                    ) : null}
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.text}>
                        I agree to the{' '}
                    </Text>
                    <TouchableOpacity onPress={handleTermsPress}>
                        <Text style={styles.linkText}>Terms of service</Text>
                    </TouchableOpacity>
                    <Text style={styles.text}>
                        {' '}and{' '}
                    </Text>
                    <TouchableOpacity onPress={handlePrivacyPress}>
                        <Text style={styles.linkText}>Privacy Policy</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#4B0082',
        borderRadius: 4,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkedCheckbox: {
        backgroundColor: '#4B0082',
    },
    textContainer: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    text: {
        fontSize: 12,
        color: '#718096',
        
    },
    linkText: {
        fontSize: 12,
        color: '#4B0082',
        textDecorationLine: 'underline',
        
    },
});
  
export default TermsCheckbox;