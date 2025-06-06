import React from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SocialLoginButtonsProps {
    onGooglePress?: () => void;
    onApplePress?: () => void;
}

const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
    onGooglePress,
    onApplePress
}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.orText}>Or continue with</Text>
            <View style={styles.buttonsContainer}>
                <TouchableOpacity 
                    style={styles.socialButton}
                    onPress={onGooglePress}
                    accessibilityRole="button"
                    accessible={true}
                >
                    <Ionicons name="logo-google" size={24} color="#DB4437" />
                    <Text style={styles.socialButtonText}>Google</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.socialButton}
                    onPress={onApplePress}
                    accessibilityRole="button"
                    accessible={true}
                >
                    <Ionicons name="logo-apple" size={24} color="#000000" />
                    <Text style={styles.socialButtonText}>Apple</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 20,
    },
    orText: {
        textAlign: 'center',
        color: '#718096',
        marginBottom: 16,
        
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginHorizontal: 8, 
    },
    socialButtonText: {
        marginLeft: 8,
        color: '#2D3748',
        
    },
});
  
export default SocialLoginButtons;