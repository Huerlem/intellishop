import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PasswordStrengthIndicatorProps {
    password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
    password
}) => {
    const getStrength = () => {
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);
        const length = password.length;

        if (length >= 10 && hasUpper && hasLower && hasNumber && hasSpecial) return 'Strong';
        if (length >= 6 && (hasUpper || hasNumber || hasSpecial)) return 'Medium';
        return 'Weak';
    };

    const getColor = () => {
        if (password.length < 6) return '#FF0000';
        if (password.length < 10) return '#FFA500';
        return '#4CAF50';
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Password Strength:</Text>
            <View style={styles.barContainer}>
                <View style={[
                    styles.barSegment, 
                    password.length >= 1 ? { backgroundColor: getColor() } : null
                ]} />
                <View style={[
                    styles.barSegment, 
                    password.length >= 6 ? { backgroundColor: getColor() } : null
                ]} />
                <View style={[
                    styles.barSegment, 
                    password.length >= 10 ? { backgroundColor: getColor() } : null
                ]} />
            </View>
            <Text style={[styles.strengthText, { color: getColor() }]}>
                {getStrength()}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    label: {
        fontSize: 12,
        color: '#718096',
        marginRight: 8,
        // Removido fontFamily para evitar problemas se a fonte não estiver carregada
    },
    indicator: {
        width: 50,
        height: 4,
        borderRadius: 2,
        marginRight: 8,
    },
    strengthText: {
        fontSize: 12,
        
    },
    barContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    barSegment: {
        width: 16,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E2E8F0', 
        marginHorizontal: 2, 
    },
});
  
export default PasswordStrengthIndicator;