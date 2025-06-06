import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const NotFound = () => {
    const navigation = useNavigation();
    
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                
                <Ionicons name="alert-circle-outline" size={100} color="#95a5a6" style={styles.icon} />
                
                
                <Text style={styles.title}>Page not Found!</Text>
                <Text style={styles.message}>
                    Sorry, the page you are looking for does not exist or has been removed.
                </Text>
                <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('Home')}
                >
                    <Text style={styles.buttonText}>Go back</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    icon: {
        width: 100,
        height: 100,
        marginBottom: 20,
        opacity: 0.7,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 10,
    },
    message: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
    },
    button: {
        backgroundColor: '#3498db',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default NotFound;