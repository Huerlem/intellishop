import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { handleError } from '@/errors/errorHandler';

/**
 * Card component reusable
 * @param {node} children - card content
 * @param {string} title - card title
 * @param {string} subtitle - card sub-title
 * @param {node} icon - custom icon
 * @param {string} iconName - icon name (Ionicons)
 * @param {number} iconSize - icon size
 * @param {string} iconColor - icon color
 * @param {function} onPress - Function when the card is pressed
 * @param {element} rightContent - render content by right of title
 * @param {object} style - Additional style to card
 * @param {string} variant - Card variant (default, outline, shadow)
 * @param {boolean} elevated - show if the card have to be lifted
 * @param {boolean} flat - show if the card does not have to borders around
*/
const Card = ({
    children, title, subtitle,
    icon, iconName, iconSize = 24,
    iconColor = '#4338CA',
    onPress, rightContent, style,
    variant = 'default',
    elevated = 'false',
    flat = 'false',
}) => {
    //Determines styles based on variant
    const getCardStyle = () => {
        switch (variant) {
            case 'outline':
                return styles.outlineCard;
            case 'shadow':
                return styles.shadowCard;
            default:
                return styles.defaultCard;
        }
    };

    //render header if there is title or icon
    const renderHeader = () => {
        try {
            if (!title && !icon && !iconName) return null;

            return (
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        {icon ? (
                            <View style={styles.iconContainer}>{icon}</View>
                        ) : iconName ? (
                            <View style={styles.iconContainer}>
                                <Ionicons name={iconName} size={iconSize} color={iconColor} />
                            </View>
                        ) : null}

                        <View style={styles.textContainer}>
                            {title && <Text style={styles.title}>{title}</Text>}
                            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                        </View>
                    </View>

                    {rightContent && <View style={styles.rightConten}>{rightContent}</View>}
                </View>
            );
        } catch (error) {
            handleError(error, { title: 'Erro rendering Card Header', silent: true });
        }
    };

    //Card based Component
    const cardContent = (
        <View style={[
            styles.card,
            getCardStyle(),
            elevated && styles.elevatedCard,
            flat && styles.flatCard,
            style,
        ]}>
            {renderHeader()}
            <View style={styles.content}>{children}</View>
        </View>
    );

    //Turn the card pressable if onPress is provided
    if (onPress) {
        return (
            <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
                {cardContent}
            </TouchableOpacity>
        );
    }

    return cardContent;
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    defaultCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    outlineCard: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    shadowCard: {
        backgroundColor: '#FFFFFF',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        elevation: 3,
    },
    elevatedCard: {
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',

        elevation: 5,
    },
    flatCard: {
        borderRadius: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0', 
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#4A5568',
    },
    subtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#718096',
        marginTop: 2,
    },
    rightConten: {
        marginLeft: 12,
    },
    content: {
        padding: 16,
    },

});

export default Card;