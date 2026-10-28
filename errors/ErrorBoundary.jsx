import React, { Component } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { handleError } from '@/errors/errorHandler';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * ErrorBoundary component to catch errors in children components
 * and show an interface of friendly fallback
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    //catch errors children components
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    //catch error details
    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo,
            hasError: true
        });

        handleError(error, {
            title: 'Unexpected Error',
            showAlert: false,
            logToAnalytics: true,
        });
    }
    

    // Clears the error so the tree renders again. (V1 called expo-updates' reloadAsync,
    // which needs an updates configuration the app does not have.)
    handleReload = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            //render UI fallback
            return (
                <SafeAreaView style={styles.container}>
                    <ScrollView 
                    KeyboardShouldPersisttabs="handled"
                    contentContainerStyle={styles.content}>
                        <Ionicons name="alert-circle-outline" size={80} color="#4338CA" />

                        <Text style={styles.title}>Ops! Something went wrong.</Text>

                        <Text style={styles.message}>
                        The app has encountered an unexpected problem. Don't worry, it hasn't affected your data.
                        </Text>

                        <TouchableOpacity style={styles.button} onPress={this.handleReload}>
                            <Text style={styles.buttonText}>Try again</Text>
                        </TouchableOpacity>

                        {__DEV__ && this.state.error && (
                            <View style={styles.errorDetails}>
                                <Text style={styles.errorTitle}>Error Details (development only):</Text>
                                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                            </View>
                        )}
                    </ScrollView>
                </SafeAreaView>
            );
        }

        //if there is not error, renders normally
        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 24,
        color: '#4338CA',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#4A5568',
        marginBottom: 30,
        textAlign: 'center',
        lineHeight: 24,
    },
    button: {
        backgroundColor: '#4338CA',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        marginBottom: 40,
    },
    buttonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    errorDetails: {
        width: '100%',
        padding: 15,
        backgroundColor:'#F7FAFC',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    errorTitle: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#4A5568',
        marginBottom: 5,
    },
    errorText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#E53E3E',
    },
});

/**
 * Function to handle global error not caught
 *can be used in other aplication
 */
 export const errorHandler = (error, isFatal) => {
    console.error('Global Error not catch:', error);

    try {
        // Usar o handleError corrigido
        handleError(error, {
            title: 'Global Error',
            showAlert: !isFatal, 
            logToAnalytics: true,
        });
    } catch (handlerError) {
        console.error('Error in global error handler:', handlerError);
    }

};