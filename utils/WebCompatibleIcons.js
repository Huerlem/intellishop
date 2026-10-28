import React from 'react';
import { Platform } from 'react-native';

// Mapeamento de ícones para caracteres Unicode
const iconMap = {
  // Navegação
  'arrow-back': '←',
  'arrow-forward': '→',
  'menu': '☰',
  'more-horiz': '⋯',
  'more-vert': '⋮',
  'chevron-left': '←',
  'chevron-right': '→',
  'chevron-up': '↑',
  'chevron-down': '↓',
  'expand-less': '▲',
  'expand-more': '▼',
  'refresh': '🔄',
  'close': '✖',
  'cancel': '✖',
  'back': '←',
  'forward': '→',
  
  // Status e ações
  'check': '✓',
  'checkmark': '✓',
  'checkmark-circle': '✅',
  'warning': '⚠️',
  'error': '⛔',
  'info': 'ℹ️',
  'help': '❓',
  'help-outline': '❓',
  'add': '➕',
  'remove': '➖',
  'edit': '✏️',
  'create': '✏️',
  'create-outline': '✏️',
  'delete': '🗑️',
  'trash': '🗑️',
  'trash-outline': '🗑️',
  'clear': '❌',
  'search': '🔍',
  'save': '💾',
  'share': '📤',
  'share-outline': '📤',
  'favorite': '❤️',
  'favorite-outline': '♡',
  'heart': '❤️',
  'heart-outline': '♡',
  'star': '⭐',
  'star-outline': '☆',
  
  // Elementos e objetos
  'shopping-cart': '🛒',
  'cart': '🛒',
  'cart-outline': '🛒',
  'list': '📋',
  'list-outline': '📋',
  'playlist-add': '📋➕',
  'playlist-remove': '📋➖',
  'local-bar': '🥤',
  'cleaning-services': '🧹',
  'spa': '🧴',
  'apple': '🍎',
  'eco': '🥬',
  'opacity': '🥛',
  'restaurant': '🍖',
  'cake': '🍰',
  'ac-unit': '❄️',
  'inventory-2': '🥫',
  'fastfood': '🍟',
  'home': '🏠',
  'house': '🏠',
  'settings': '⚙️',
  'person': '👤',
  'account-circle': '👤',
  'access-time': '⏰',
  'time': '⏰',
  'time-outline': '⏱️',
  'timer': '⏲️',
  'calendar': '📅',
  'calendar-today': '📅',
  'today': '📅',
  'note': '📝',
  'description': '📄',
  'attachment': '📎',
  'location-on': '📍',
  'place': '📍',
  'category': '🏷️',
  'cube': '📦',
  'cube-outline': '📦',
  'receipt': '🧾',
  'receipt-long': '🧾',
  
  // Filtros e controles
  'funnel-outline': '⏳',
  'filter': '🔍',
  'filter-alt': '🔍',
  'filter-list': '🔍',
  'sort': '↕️',
  'sort-by-alpha': 'AZ',
  'pricetag': '🏷️',
  'pricetag-outline': '🏷️',
  'alert-circle': '⚠️',
  'alert-circle-outline': '⚠️',
  'notifications': '🔔',
  'notifications-outline': '🔔',
  'ellipse': '●',
  'ellipse-outline': '○',
  'radio-button-on': '●',
  'radio-button-off': '○',
  'cloud': '☁️',
  'cloud-upload': '☁️↑',
  'cloud-download': '☁️↓',
  'image': '🖼️',
  'camera': '📷',
  'book': '📕',
  'bookmark': '🔖',
  'mail': '✉️',
  'email': '✉️',
  'send': '📨',
  'phone': '📱',
  'call': '📞',
  'video': '🎥',
  'mic': '🎤',
  'volume-up': '🔊',
  'volume-down': '🔉',
  'volume-mute': '🔇',
  'lock': '🔒',
  'lock-open': '🔓',
  'visibility': '👁️',
  'visibility-off': '👁️‍🗨️',
  'wifi': '📶',
  'bluetooth': '📶',
  'print': '🖨️',
  'dashboard': '📊',
  'analytics': '📈',
  'trending-up': '📈',
  'trending-down': '📉',
  'public': '🌐',
  'language': '🌐',
  'translate': '🌐',
  'link': '🔗',
};

// Componente de ícone multi-plataforma
export function Icon({ name, size = 24, color = 'black', style = {}, ...props }) {
  const iconChar = iconMap[name] || '•';

  if (Platform.OS === 'web') {
    return React.createElement(
      'span',
      {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${size}px`,
          color,
          width: `${size}px`,
          height: `${size}px`,
          lineHeight: `${size}px`,
          userSelect: 'none',
          ...style,
        },
        ...props,
      },
      iconChar
    );
  }

  try {
    const { MaterialIcons } = require('@expo/vector-icons');
    return <MaterialIcons name={name} size={size} color={color} style={style} {...props} />;
  } catch (error) {
    try {
      const { Ionicons } = require('@expo/vector-icons');
      return <Ionicons name={name} size={size} color={color} style={style} {...props} />;
    } catch (e) {
      return React.createElement(
        'span',
        {
          style: {
            fontSize: `${size}px`,
            color,
            width: `${size}px`,
            height: `${size}px`,
            lineHeight: `${size}px`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...style,
          },
          ...props,
        },
        '•'
      );
    }
  }
}

export default Icon;