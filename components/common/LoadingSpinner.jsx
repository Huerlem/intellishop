import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function LoadingSpinner({ 
    message = "Loading...", 
    showGrandient = false,
    spinnerColor = "#4338CA",
    messageColor = "#FFFFFF",
    backgroundColor = "rgba(0,0,0,0.5)"
}) {
    const spinValue = useRef(new Animated.Value(0)).current;

    // Create continuous rotation animation
    useEffect(() => {
        const spin = () => {
            spinValue.setValue(0);
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: false, // Set to false for web compatibility
            }).start(() => spin());
        };
        spin();
    }, [spinValue]);

    // Interpolate rotation values
    const rotate = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    // Spinner content component
    const SpinnerContent = () => (
        <View style={styles.container}>
            <View style={styles.spinnerContainer}>
                <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]}>
                    <View style={[styles.spinnerRing, { borderTopColor: spinnerColor }]} />
                </Animated.View>
                {message && (
                    <Text style={[styles.message, { color: messageColor }]}>
                        {message}
                    </Text>
                )}
            </View>
        </View>
    );

    // Render with gradient background if requested
    if (showGrandient) {
        return (
            <SafeAreaView style={styles.fullScreen}>
                <StatusBar style='light' />
                <LinearGradient
                    colors={['#4338CA', '#616E7C']}
                    style={styles.gradientBackground}
                >
                    <SpinnerContent />
                </LinearGradient>
            </SafeAreaView>
        );
    }

    // Render with solid background
    return (
        <View style={[styles.fullScreen, { backgroundColor }]}>
            <SpinnerContent />
        </View>
    );
}

const styles = StyleSheet.create({
    fullScreen: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
    },
    gradientBackground: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinnerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    spinner: {
        width: 50,
        height: 50,
        marginBottom: 20,
    },
    spinnerRing: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 4,
        borderColor: 'transparent',
        borderTopColor: '#4338CA',
    },
    message: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
    },
});