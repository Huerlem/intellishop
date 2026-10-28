import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const [isLoading, setIsLoading] = useState(true);
    
    // Simulate initial loading (e.g., checking authentication, loading data, etc.)
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2000); // 2 seconds loading time

        return () => clearTimeout(timer);
    }, []);

    // Navigate to login screen
    const handleLogin = () => {
        router.push('/(public)/LoginScreen');
    };

    // Navigate to register screen
    const handleRegister = () => {
        router.push('/(public)/RegisterScreen');
    };

    const logoSize = width > 768 ? 200 : width * 0.4;

    // Show loading spinner while loading
    if (isLoading) {
        return (
            <LoadingSpinner
                message="Loading, please wait..."
                showGrandient={true}
            />
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style='light' />

            <LinearGradient
                colors={['#4338CA', '#616E7C']}
                style={styles.background} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false} >
                <TouchableOpacity style={styles.logoContainer} onPress={() => router.push('/(public)/WelcomeScreen')}>
                    <Image
                        source={require('../../assets/images/logo-100.png')}
                        style={{ 
                            width: logoSize, 
                            height: logoSize, 
                            marginBottom: 12, 
                            borderRadius: Platform.OS === 'web' ? 12 : 0 
                        }}
                        resizeMode="contain" // Moved resizeMode to props
                    />
                    <Text style={styles.appName}>Your Smart Friendly App</Text>
                </TouchableOpacity>

                {/** Features Section */}
                <View style={styles.featureContainer}>
                    <View style={styles.featureItem}>
                        <View style={styles.featureIconContainer}>
                            <Ionicons name="cart-outline" size={28} color="#4338CA" />
                        </View>
                        <View style={styles.featureTextContainer}>
                            <Text style={styles.featureTitle}>Smart Shopping List</Text>
                            <Text style={styles.featureDescription}>
                                Create and manage shopping lists with ease. Check off items as you shop.
                            </Text>
                        </View>
                    </View>
                
                    <View style={styles.featureItem}>
                        <View style={styles.featureIconContainer}>
                            <Ionicons name="cube-outline" size={28} color="#4338CA" />
                        </View>
                        <View style={styles.featureTextContainer}>
                            <Text style={styles.featureTitle}>Inventory Management</Text>
                            <Text style={styles.featureDescription}>
                                Keep track of what you have at home and get alerts when items run low.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureItem}>
                        <View style={styles.featureIconContainer}>
                            <Ionicons name="bulb-outline" size={28} color="#4338CA" />
                        </View>
                        <View style={styles.featureTextContainer}>
                            <Text style={styles.featureTitle}>AI Suggestions</Text>
                            <Text style={styles.featureDescription}>
                                Get personalized shopping lists and recipe ideas based on your preferences.
                            </Text>
                        </View>
                    </View>
                

                    <View style={styles.featureItem}>
                        <View style={styles.featureIconContainer}>
                        <Ionicons name="pricetag-outline" size={28} color="#4338CA" />
                        </View>
                        <View style={styles.featureTextContainer}>
                            <Text style={styles.featureTitle}>Price Comparison</Text>
                            <Text style={styles.featureDescription}>
                                Compare prices across different supermarkets to find the best deals.
                            </Text>
                        </View>
                    </View>
                </View>

                {/** Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                    accessible={true}
                    accessibilityLabel="Login"
                    style={styles.loginButton}
                    onPress={handleLogin}>
                        <Text style={styles.loginButtonText}>Login</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                    accessible={true}
                    accessibilityLabel="Register"
                    style={styles.registerButton}
                    onPress={handleRegister}>
                        <Text style={styles.registerButtonText}>Create Account</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: 40,
        paddingBottom: 40,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    
    appName: {
        fontFamily: 'Inter_700Bold',
        fontSize: 32,
        color: '#FFFFFF',
        textShadow: '1px 1px 4px rgba(0,0,0,0.75)', // Fixed textShadow syntax
    },
    featureContainer: {
        width: '100%',
        maxWidth: 600,
        alignItems: 'center',
        marginBottom: 40,
    },
    featureItem: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        width: '100%',
        maxWidth: 600,
        boxShadow: '0px 2px 4px rgba(0,0,0,0.1)', // Fixed boxShadow syntax
    },
    featureIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(75, 0, 130, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    featureTextContainer: {
        flex: 1,
    },
    featureTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#4338CA',
        marginBottom: 4,
    },
    featureDescription: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#4A5568',
        lineHeight: 20,
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    loginButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        marginBottom: 12,
        boxShadow: '0px 2px 4px rgba(0,0,0,0.1)', // Fixed boxShadow syntax
    },
    loginButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#4338CA',
    },
    registerButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    registerButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#FFFFFF',
    },
});