import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { handleError } from '@/errors/errorHandler';

/**
 * Show the greeting personalized by AI component
 * @param {string} message - greeting personalized message
 * @param {string} userName - User name
 * @param {boolean} loading - Indicate if the message is loading
 */
const AIGreeting = ({ message, userName, loading = false }) => {
    try {
        // Define a message standard if there is no specific one
        const defaultMessage = userName
            ? `Hello, ${userName}! How can I help with your shopping today?`
            : 'Hello! How can I help with your shopping today?';

        const displayMessage = message || defaultMessage;

        const renderContent = () => {
            if (loading) {
                return (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color="#4B0082" size="small" />
                        <Text style={styles.loadingText}>Thinking...</Text>
                    </View>
                );
            }

            return (
                <Text style={styles.message}>{displayMessage}</Text>
            );
        };

        return (
            <View style={styles.container}>
                <View style={styles.aiIconContainer}>
                    <Ionicons name="bulb" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.messageContainer}>
                    {renderContent()}
                </View>
            </View>
        );
    } catch (error) {
        handleError(error, {
            title: 'Failed to render AI Greeting',
            showAlert: false,
            logToAnalytics: true,
        });

        // Fallback para casos de erro
        return (
            <View style={styles.container}>
                <View style={styles.messageContainer}>
                    <Text style={styles.message}>Hello! How can I help?</Text>
                </View>
            </View>
        );
    }
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#F7F9FE',
        borderRadius: 19,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    aiIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4B0082',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    messageContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    message: {
        // Removido fontFamily para evitar problemas se a fonte não estiver carregada
        fontSize: 14,
        color: '#4A5568',
        lineHeight: 20,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loadingText: {
        // Removido fontFamily para evitar problemas se a fonte não estiver carregada
        fontSize: 14,
        color: '#4A5568',
        marginLeft: 8,
    },
});

export default AIGreeting;