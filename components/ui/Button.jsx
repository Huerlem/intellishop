import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Button reusable component
 * @param {string} title - Button Text
 * @param {function} onPress - Function to be called when pressing the button
 * @param {boolean} loading - Indicates whether the button is in charging state
 * @param {object} style - Additional styles for the button
 * @param {object} textStyle - Additional styles for button text
 * @param {string} variant - Button variant (primary, secondary, outline, ghost)
 * @param {boolean} disabled - Indicates whether the button is disabled
 * @param {string} iconName - Icon Name (Ionicons)
 * @param {string} iconPosition - Icon position (left, right)
 * @param {number} iconSize - Icon size
 * @param {string} iconColor - Icon color
 */
const Button = ({
    title, onPress,
    loading = false,
    style, textStyle,
    variant = 'primary',
    disabled = false,
    iconName,
    iconPosition = 'left',
    iconSize = 20,
    iconColor,
}) => {
    //Determines button styles based on variant
    const getButtonStyle = () => {
        switch (variant) {
            case 'secondary':
                return styles.secondaryButton;
            case 'outline':
                return styles.outlineButton;
            case 'ghost':
                return styles.ghostButton;
            case 'danger':
                return styles.dangerButton;
            case 'success':
                return styles.successButton;
            default:
                return styles.primaryButton;
        }
    };

    //Determines style text based on variant
    const getTextStyle = () => {
        switch (variant) {
            case 'secondary':
                return styles.secondaryText;
            case 'outline':
                return styles.outlineText;
            case 'ghost':
                return styles.ghostText;
            case 'danger':
                return styles.dangerText;
            case 'success':
                return styles.successText;
            default:
                return styles.primaryText;
        }

    };

    //Determines the color of the icon based on the variant if not specified
    const getIconColor = () => {
        if (iconColor) return iconColor;

        switch (variant) {
            case 'secondary':
                return '#4b0082';
            case 'outline':
                return '#4B0082';
            case 'ghost':
                return '#4B0082';
            case 'danger':
                return '#FFFFFF';
            case 'success':
                return '#FFFFFF';
            default:
                return '#FFFFFF';
        }
    };
    
    //Render for specify icon
    const renderIcon = () => {
        if (!iconName) return null;

        return (
            <Ionicons
                name={iconName}
                size={iconSize}
                color={getIconColor()}
                style={[
                    iconPosition === 'left' ? styles.iconLeft : styles.iconRight,
                    disabled && styles.disabledIcon,
                ]}
            />
        );
    };

    //Renders the loading indicator or button content
    const renderContent = () => {
        if (loading) {
            return (
                <ActivityIndicator
                    size="small"
                    color={variant === 'primary' || variant === 'danger' || variant === 'success' ? '#FFFFFF' : '#4B0082'}
                />
            );
        }

        return (
            <View style={styles.contentContainer}>
                {iconPosition === 'left' && renderIcon()}
                <Text
                    style={[
                        getTextStyle(),
                        textStyle,
                        disabled && styles.disabledText,
                    ]}
                >
                    {title}
                </Text>
                {iconPosition === 'right' && renderIcon()}
            </View>
        );
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                getButtonStyle(),
                disabled && styles.disabledButton,
                loading && styles.loadingButton,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {renderContent()}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
      borderRadius: 8,
      paddingVertical: 14,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButton: {
      backgroundColor: '#4B0082',
    },
    secondaryButton: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    outlineButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: '#4B0082',
    },
    ghostButton: {
      backgroundColor: 'transparent',
    },
    dangerButton: {
      backgroundColor: '#E53E3E',
    },
    successButton: {
      backgroundColor: '#38A169',
    },
    disabledButton: {
      backgroundColor: '#E2E8F0',
      borderColor: '#E2E8F0',
    },
    loadingButton: {
      opacity: 0.8,
    },
    contentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryText: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 16,
      color: '#FFFFFF',
    },
    secondaryText: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 16,
      color: '#4B0082',
    },
    outlineText: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 16,
      color: '#4B0082',
    },
    ghostText: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 16,
      color: '#4B0082',
    },
    dangerText: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 16,
      color: '#FFFFFF',
    },
    successText: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 16,
      color: '#FFFFFF',
    },
    disabledText: {
      color: '#A0AEC0',
    },
    disabledIcon: {
      opacity: 0.5,
    },
    iconLeft: {
      marginRight: 8,
    },
    iconRight: {
      marginLeft: 8,
    },
  });
  
  export default Button;