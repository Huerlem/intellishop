// services/notificationService.js - AI-ENHANCED WITH GEMINI
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Permissions from 'expo-permissions';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { db } from '@/firebase/config';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { handleError } from '@/errors/errorHandler';

// Initialize Gemini for AI-powered notifications
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Rate limiting for Gemini
let requestCount = 0;
const MAX_REQUESTS_PER_MINUTE = 15;
const RATE_LIMIT_RESET_TIME = 60000;

setInterval(() => {
    requestCount = 0;
}, RATE_LIMIT_RESET_TIME);

const checkRateLimit = () => {
    if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
        console.warn('Gemini rate limit exceeded for notifications');
        return false;
    }
    requestCount++;
    return true;
};

// Notification configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Notification types
export const NOTIFICATION_TYPES = {
  LOW_STOCK: 'LOW_STOCK',
  EXPIRING_ITEMS: 'EXPIRING_ITEMS',
  PRICE_ALERT: 'PRICE_ALERT',
  SHOPPING_REMINDER: 'SHOPPING_REMINDER',
  RECIPE_SUGGESTION: 'RECIPE_SUGGESTION',
  APP_UPDATE: 'APP_UPDATE',
  GENERAL: 'GENERAL',
  AI_INSIGHT: 'AI_INSIGHT',
  SMART_SUGGESTION: 'SMART_SUGGESTION',
};

// Notification channels for Android
const NOTIFICATION_CHANNELS = [
  {
    id: 'stock-alerts',
    name: 'Stock Alerts',
    description: 'Notifications about low stock and expiring items',
    importance: Notifications.AndroidImportance.HIGH,
    sound: true,
    vibrate: true,
  },
  {
    id: 'price-alerts',
    name: 'Price Alerts',
    description: 'Notifications about price changes and deals',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: true,
    vibrate: true,
  },
  {
    id: 'recipes',
    name: 'Recipe Suggestions',
    description: 'AI-based recipe suggestions',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: true,
    vibrate: false,
  },
  {
    id: 'ai-insights',
    name: 'AI Insights',
    description: 'Smart insights and personalized recommendations',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: true,
    vibrate: false,
  },
  {
    id: 'general',
    name: 'General Notifications',
    description: 'General app notifications',
    importance: Notifications.AndroidImportance.LOW,
    sound: false,
    vibrate: false,
  },
];

/**
 * Initialize the AI-enhanced notification service
 * @returns {Promise<boolean>} Whether initialization was successful
 */
export const initializeNotifications = async () => {
  if (!Device.isDevice) {
    console.log('Push notifications are not available in the emulator');
    return false;
  }

  try {
    // Set up notification channels for Android
    if (Platform.OS === 'android') {
      await setupNotificationChannels();
    }

    // Check and request permissions
    const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
    let finalStatus = existingStatus;

    // If we don't have permission yet, request it
    if (existingStatus !== 'granted') {
      const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
      finalStatus = status;
    }

    // If we still don't have permission, we can't continue
    if (finalStatus !== 'granted') {
      console.log('Permission to receive notifications was denied');
      await AsyncStorage.setItem('notificationsPermission', 'denied');
      return false;
    }

    // Get push token for the device
    const token = await Notifications.getExpoPushTokenAsync({
      experienceId: Constants.manifest?.id || undefined,
    });

    // Store token locally
    await AsyncStorage.setItem('pushToken', token.data);
    await AsyncStorage.setItem('notificationsPermission', 'granted');

    // Register token in Firestore
    await registerDeviceToken(token.data);

    // Initialize AI personalization
    await initializeAIPersonalization();

    return true;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return false;
  }
};

/**
 * Initialize AI personalization for notifications
 */
const initializeAIPersonalization = async () => {
  try {
    // Get user preferences and patterns
    const userPreferences = await getUserNotificationPreferences();
    const notificationHistory = await getNotificationHistory(20);
    
    // Analyze patterns to optimize timing
    await analyzeNotificationPatterns(userPreferences, notificationHistory);
    
  } catch (error) {
    console.warn('AI personalization initialization failed:', error);
  }
};

/**
 * Set up notification channels for Android
 */
const setupNotificationChannels = async () => {
  for (const channel of NOTIFICATION_CHANNELS) {
    await Notifications.setNotificationChannelAsync(channel.id, {
      name: channel.name,
      description: channel.description,
      importance: channel.importance,
      sound: channel.sound,
      vibrationPattern: channel.vibrate ? [0, 250, 250, 250] : undefined,
      enableVibrate: channel.vibrate,
    });
  }
};

/**
 * Register device token in Firestore
 * @param {string} token - Device token
 */
const registerDeviceToken = async (token) => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) return;

    const deviceInfo = {
      token,
      platform: Platform.OS,
      model: Device.modelName || 'Unknown',
      lastActive: serverTimestamp(),
    };

    // Check if device is already registered
    const userDevicesRef = doc(db, 'users', userId, 'devices', token);
    const deviceDoc = await getDoc(userDevicesRef);

    if (deviceDoc.exists()) {
      // Update device data
      await updateDoc(userDevicesRef, {
        ...deviceInfo,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Add new device
      await setDoc(userDevicesRef, {
        ...deviceInfo,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        notificationSettings: {
          enabled: true,
          aiEnhanced: true,
          channels: NOTIFICATION_CHANNELS.reduce((acc, channel) => {
            acc[channel.id] = true;
            return acc;
          }, {}),
        },
      });

      // Add token to user's token list
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        pushTokens: arrayUnion(token),
      });
    }
  } catch (error) {
    console.error('Error registering device token:', error);
  }
};

/**
 * Generate AI-enhanced notification content
 * @param {Object} options - Notification options
 * @param {Object} context - Additional context for AI
 * @returns {Promise<Object>} Enhanced notification content
 */
const generateAINotificationContent = async (options, context = {}) => {
  try {
    if (!checkRateLimit()) {
      // Return original content if rate limited
      return {
        title: options.title,
        body: options.body,
        enhanced: false
      };
    }

    const userPreferences = await getUserNotificationPreferences();
    const timeOfDay = getTimeOfDay();
    const userName = await getUserName();

    const prompt = `
Create a personalized notification message for a shopping app user.

Context:
- User name: ${userName || 'User'}
- Time of day: ${timeOfDay}
- Notification type: ${options.type}
- Original message: ${options.body}
- User preferences: ${JSON.stringify(userPreferences)}
- Additional context: ${JSON.stringify(context)}

Requirements:
1. Keep it friendly and personal
2. Make it actionable and helpful
3. Consider the time of day
4. Maximum 60 characters for title, 120 for body
5. Use appropriate tone for the situation

Create variations:
- Title: Short, attention-grabbing
- Body: Clear, actionable message
- Alternative: Different approach if needed

Format as JSON:
{
  "title": "personalized title",
  "body": "personalized message",
  "alternative": {
    "title": "alternative title",
    "body": "alternative message"
  },
  "reasoning": "why this approach was chosen"
}

Return only valid JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let aiContent;
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      aiContent = JSON.parse(cleanedText);
    } catch (parseError) {
      console.warn('Failed to parse AI notification content');
      return {
        title: options.title,
        body: options.body,
        enhanced: false
      };
    }

    return {
      title: aiContent.title || options.title,
      body: aiContent.body || options.body,
      alternative: aiContent.alternative,
      reasoning: aiContent.reasoning,
      enhanced: true
    };

  } catch (error) {
    console.error('Error generating AI notification content:', error);
    return {
      title: options.title,
      body: options.body,
      enhanced: false
    };
  }
};

/**
 * Send an AI-enhanced local notification
 * @param {Object} options - Notification options
 * @returns {Promise<string>} Notification ID
 */
export const sendLocalNotification = async (options) => {
  const {
    title,
    body,
    data = {},
    type = NOTIFICATION_TYPES.GENERAL,
    channelId,
    badge = 1,
    context = {},
    useAI = true
  } = options;

  // Check if notifications are enabled
  const notificationsEnabled = await areNotificationsEnabled();
  if (!notificationsEnabled) {
    console.log('Notifications are disabled');
    return null;
  }

  // Get AI-enhanced content if enabled
  let enhancedContent = { title, body, enhanced: false };
  if (useAI) {
    enhancedContent = await generateAINotificationContent({ title, body, type }, context);
  }

  // Select the correct channel for notification type
  const channel = getChannelForNotificationType(type);

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: enhancedContent.title,
        body: enhancedContent.body,
        data: { 
          ...data, 
          type,
          aiEnhanced: enhancedContent.enhanced,
          reasoning: enhancedContent.reasoning
        },
        badge,
        sound: channel.sound,
        vibrate: channel.vibrate ? [0, 250, 250, 250] : undefined,
        ...(Platform.OS === 'android' && { channelId: channelId || channel.id }),
      },
      trigger: null, // Send immediately
    });

    // Store the notification for future reference and AI learning
    await storeNotification({
      id: notificationId,
      title: enhancedContent.title,
      body: enhancedContent.body,
      originalTitle: title,
      originalBody: body,
      data,
      type,
      context,
      aiEnhanced: enhancedContent.enhanced,
      reasoning: enhancedContent.reasoning,
      timestamp: new Date().toISOString(),
    });

    return notificationId;
  } catch (error) {
    console.error('Error sending local notification:', error);
    return null;
  }
};

/**
 * Schedule an AI-enhanced notification for future delivery
 * @param {Object} options - Notification options
 * @param {Date|Object} triggerOptions - When to send the notification
 * @returns {Promise<string>} Notification ID
 */
export const scheduleNotification = async (options, triggerOptions) => {
  const {
    title,
    body,
    data = {},
    type = NOTIFICATION_TYPES.GENERAL,
    channelId,
    badge = 1,
    context = {},
    useAI = true
  } = options;

  // Check if notifications are enabled
  const notificationsEnabled = await areNotificationsEnabled();
  if (!notificationsEnabled) {
    console.log('Notifications are disabled');
    return null;
  }

  // Get optimal timing using AI
  const optimizedTrigger = useAI ? 
    await optimizeNotificationTiming(triggerOptions, type, context) : 
    triggerOptions;

  // Get AI-enhanced content if enabled
  let enhancedContent = { title, body, enhanced: false };
  if (useAI) {
    enhancedContent = await generateAINotificationContent({ title, body, type }, context);
  }

  // Select the correct channel for notification type
  const channel = getChannelForNotificationType(type);

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: enhancedContent.title,
        body: enhancedContent.body,
        data: { 
          ...data, 
          type,
          aiEnhanced: enhancedContent.enhanced,
          reasoning: enhancedContent.reasoning
        },
        badge,
        sound: channel.sound,
        vibrate: channel.vibrate ? [0, 250, 250, 250] : undefined,
        ...(Platform.OS === 'android' && { channelId: channelId || channel.id }),
      },
      trigger: optimizedTrigger,
    });

    // Store the notification for future reference
    await storeNotification({
      id: notificationId,
      title: enhancedContent.title,
      body: enhancedContent.body,
      originalTitle: title,
      originalBody: body,
      data,
      type,
      context,
      scheduled: true,
      triggerOptions: optimizedTrigger,
      aiEnhanced: enhancedContent.enhanced,
      reasoning: enhancedContent.reasoning,
      timestamp: new Date().toISOString(),
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

/**
 * Optimize notification timing using AI
 * @param {Object} originalTrigger - Original trigger timing
 * @param {string} type - Notification type
 * @param {Object} context - Additional context
 * @returns {Promise<Object>} Optimized trigger timing
 */
const optimizeNotificationTiming = async (originalTrigger, type, context) => {
  try {
    if (!checkRateLimit()) {
      return originalTrigger;
    }

    const userPatterns = await getUserNotificationPatterns();
    const currentTime = new Date();

    const prompt = `
Optimize notification timing based on user patterns and context.

Current time: ${currentTime.toISOString()}
Original trigger: ${JSON.stringify(originalTrigger)}
Notification type: ${type}
User patterns: ${JSON.stringify(userPatterns)}
Context: ${JSON.stringify(context)}

Consider:
1. User's active hours
2. Notification type importance
3. Optimal engagement times
4. Avoid disturbing sleep/work hours

Suggest the best time to send this notification.

Format as JSON:
{
  "recommendedTime": "ISO timestamp",
  "reasoning": "why this time is optimal",
  "confidence": "high/medium/low",
  "alternatives": [
    {
      "time": "ISO timestamp",
      "reason": "alternative option"
    }
  ]
}

Return only valid JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let optimization;
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      optimization = JSON.parse(cleanedText);
    } catch (parseError) {
      console.warn('Failed to parse timing optimization');
      return originalTrigger;
    }

    // Convert to trigger format if we got a valid recommendation
    if (optimization.recommendedTime && optimization.confidence !== 'low') {
      return {
        date: new Date(optimization.recommendedTime),
        reasoning: optimization.reasoning
      };
    }

    return originalTrigger;

  } catch (error) {
    console.error('Error optimizing notification timing:', error);
    return originalTrigger;
  }
};

/**
 * Send AI-enhanced low stock notification
 * @param {Object} item - Item with low stock
 * @param {Object} userContext - User context for personalization
 */
export const sendLowStockNotification = async (item, userContext = {}) => {
  const context = {
    ...userContext,
    itemCategory: item.category,
    stockLevel: item.quantity,
    isEssential: item.category === 'dairy' || item.category === 'bread' || item.category === 'eggs'
  };

  const options = {
    title: 'Low Stock Alert',
    body: `${item.name} is running low! Only ${item.quantity} ${item.quantity === 1 ? 'unit' : 'units'} left.`,
    data: { itemId: item.id, screen: 'Stock' },
    type: NOTIFICATION_TYPES.LOW_STOCK,
    context,
    useAI: true
  };

  await sendLocalNotification(options);
};

/**
 * Send AI-enhanced expiring item notification
 * @param {Object} item - Item close to expiration
 * @param {number} daysUntilExpiry - Days until expiration
 * @param {Object} recipeSuggestions - Suggested recipes using this item
 */
export const sendExpiringItemNotification = async (item, daysUntilExpiry, recipeSuggestions = []) => {
  const context = {
    daysUntilExpiry,
    itemCategory: item.category,
    hasRecipeSuggestions: recipeSuggestions.length > 0,
    recipes: recipeSuggestions.slice(0, 2) // Include top 2 recipes
  };

  const options = {
    title: 'Item Expiring Soon',
    body: `${item.name} expires in ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'day' : 'days'}!`,
    data: { 
      itemId: item.id, 
      screen: 'Stock',
      recipes: recipeSuggestions
    },
    type: NOTIFICATION_TYPES.EXPIRING_ITEMS,
    context,
    useAI: true
  };

  await sendLocalNotification(options);
};

/**
 * Send AI-enhanced price alert notification
 * @param {Object} item - Item with price change
 * @param {number} oldPrice - Old price
 * @param {number} newPrice - New price
 * @param {string} storeName - Store name
 * @param {Object} priceContext - Additional price context
 */
export const sendPriceAlertNotification = async (item, oldPrice, newPrice, storeName, priceContext = {}) => {
  const priceDiff = ((newPrice - oldPrice) / oldPrice) * 100;
  const isDiscount = newPrice < oldPrice;

  const context = {
    ...priceContext,
    priceChange: priceDiff,
    isDiscount,
    storeName,
    itemCategory: item.category,
    significantSavings: Math.abs(priceDiff) > 20
  };

  const options = {
    title: isDiscount ? 'Great Deal Found!' : 'Price Alert',
    body: isDiscount
      ? `${item.name} is ${Math.abs(priceDiff).toFixed(0)}% cheaper at ${storeName}!`
      : `Alert: ${item.name} increased ${priceDiff.toFixed(0)}% in price at ${storeName}.`,
    data: { 
      itemId: item.id, 
      screen: 'PriceComparison',
      storeId: storeName.toLowerCase().replace(/\s+/g, '')
    },
    type: NOTIFICATION_TYPES.PRICE_ALERT,
    context,
    useAI: true
  };

  await sendLocalNotification(options);
};

/**
 * Send AI-enhanced shopping reminder notification
 * @param {number} itemCount - Number of items in list
 * @param {Array} urgentItems - Items that are urgent
 * @param {Object} shoppingContext - Additional shopping context
 */
export const sendShoppingReminderNotification = async (itemCount, urgentItems = [], shoppingContext = {}) => {
  const context = {
    ...shoppingContext,
    itemCount,
    urgentCount: urgentItems.length,
    hasUrgentItems: urgentItems.length > 0,
    categories: [...new Set(urgentItems.map(item => item.category))],
    estimatedTime: Math.max(15, Math.min(60, itemCount * 2)) // Estimate shopping time
  };

  const options = {
    title: 'Shopping Reminder',
    body: `You have ${itemCount} ${itemCount === 1 ? 'item' : 'items'} pending in your shopping list.`,
    data: { 
      screen: 'ShoppingList',
      urgentItems: urgentItems.map(item => item.id)
    },
    type: NOTIFICATION_TYPES.SHOPPING_REMINDER,
    context,
    useAI: true
  };

  await sendLocalNotification(options);
};

/**
 * Schedule AI-optimized shopping reminder
 * @param {Date} reminderTime - Date and time for reminder
 * @param {string} customMessage - Custom message (optional)
 * @param {Object} shoppingContext - Shopping context for AI
 */
export const scheduleShoppingReminder = async (reminderTime, customMessage = null, shoppingContext = {}) => {
  const context = {
    ...shoppingContext,
    isCustomMessage: !!customMessage,
    scheduledFor: reminderTime.toISOString()
  };

  const options = {
    title: 'Time to Shop!',
    body: customMessage || 'Don\'t forget to check your shopping list today.',
    data: { screen: 'ShoppingList' },
    type: NOTIFICATION_TYPES.SHOPPING_REMINDER,
    context,
    useAI: !customMessage // Only use AI if no custom message
  };

  await scheduleNotification(options, {
    date: reminderTime,
  });
};

/**
 * Send AI-enhanced recipe suggestion notification
 * @param {Object} recipe - Suggested recipe
 * @param {Array} availableIngredients - Available ingredients for the recipe
 * @param {Object} userPreferences - User's cooking preferences
 */
export const sendRecipeSuggestionNotification = async (recipe, availableIngredients = [], userPreferences = {}) => {
  const context = {
    recipeDifficulty: recipe.difficulty,
    prepTime: recipe.prepTime || recipe.cookingTime,
    availableIngredientsCount: availableIngredients.length,
    totalIngredientsCount: recipe.ingredients?.length || 0,
    userPreferences,
    mealType: getMealTimeCategory(),
    isQuickMeal: (recipe.prepTime || 30) <= 20
  };

  const options = {
    title: 'Recipe Suggestion',
    body: `How about making ${recipe.name || recipe.title} today? You have most ingredients ready.`,
    data: { 
      recipeId: recipe.id, 
      screen: 'AISuggestion',
      availableIngredients: availableIngredients.map(ing => ing.id)
    },
    type: NOTIFICATION_TYPES.RECIPE_SUGGESTION,
    context,
    useAI: true
  };

  await sendLocalNotification(options);
};

/**
 * Send AI-powered smart insight notification
 * @param {Object} insight - AI-generated insight
 * @param {Object} context - Context for the insight
 */
export const sendSmartInsightNotification = async (insight, context = {}) => {
  const options = {
    title: 'Smart Shopping Insight',
    body: insight.message || 'We have a personalized insight for you!',
    data: { 
      screen: insight.screen || 'Home',
      insightType: insight.type,
      ...insight.data
    },
    type: NOTIFICATION_TYPES.AI_INSIGHT,
    context: {
      ...context,
      insightCategory: insight.category,
      priority: insight.priority || 'medium'
    },
    useAI: true
  };

  await sendLocalNotification(options);
};

/**
 * Check if notifications are enabled
 * @returns {Promise<boolean>} Whether notifications are enabled
 */
export const areNotificationsEnabled = async () => {
  try {
    // Check local settings
    const enabled = await AsyncStorage.getItem('notificationsEnabled');
    if (enabled === 'false') return false;

    // Check system permission
    const permission = await AsyncStorage.getItem('notificationsPermission');
    return permission === 'granted';
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
};

/**
 * Enable or disable notifications
 * @param {boolean} enabled - Whether notifications should be enabled
 */
export const setNotificationsEnabled = async (enabled) => {
  try {
    await AsyncStorage.setItem('notificationsEnabled', enabled ? 'true' : 'false');

    // Update in Firestore
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) return;

    const token = await AsyncStorage.getItem('pushToken');
    if (!token) return;

    const userDevicesRef = doc(db, 'users', userId, 'devices', token);
    await updateDoc(userDevicesRef, {
      'notificationSettings.enabled': enabled,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error setting notifications enabled:', error);
  }
};

/**
 * Store a notification in history with AI metadata
 * @param {Object} notification - Notification data
 */
const storeNotification = async (notification) => {
  try {
    // Store locally only the last 100 for reference
    const storedNotifications = await AsyncStorage.getItem('notificationHistory');
    let history = storedNotifications ? JSON.parse(storedNotifications) : [];

    // Add the new notification at the beginning
    history.unshift(notification);

    // Keep only the last 100
    if (history.length > 100) {
      history = history.slice(0, 100);
    }

    await AsyncStorage.setItem('notificationHistory', JSON.stringify(history));

  } catch (error) {
    console.error('Error storing notification:', error);
  }
};

/**
 * Get notification history
 * @param {number} limit - Maximum number of notifications to return
 * @returns {Promise<Array>} Notification history
 */
export const getNotificationHistory = async (limit = 50) => {
  try {
    const storedNotifications = await AsyncStorage.getItem('notificationHistory');
    const history = storedNotifications ? JSON.parse(storedNotifications) : [];
    return history.slice(0, limit);
  } catch (error) {
    console.error('Error getting notification history:', error);
    return [];
  }
};

/**
 * Clear notification history
 */
export const clearNotificationHistory = async () => {
  try {
    await AsyncStorage.setItem('notificationHistory', JSON.stringify([]));
  } catch (error) {
    console.error('Error clearing notification history:', error);
  }
};

/**
 * Set up a listener for received notifications
 * @param {Function} callback - Function to call when notification is received
 * @returns {Subscription} Subscription that can be removed to stop listening
 */
export const addNotificationReceivedListener = (callback) => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Set up a listener for notification responses from user
 * @param {Function} callback - Function to call when notification is responded to
 * @returns {Subscription} Subscription that can be removed to stop listening
 */
export const addNotificationResponseReceivedListener = (callback) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

/**
 * Get the most appropriate channel for the notification type
 * @param {string} type - Notification type
 * @returns {Object} Channel information
 */
const getChannelForNotificationType = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.LOW_STOCK:
    case NOTIFICATION_TYPES.EXPIRING_ITEMS:
      return NOTIFICATION_CHANNELS.find(channel => channel.id === 'stock-alerts');
    case NOTIFICATION_TYPES.PRICE_ALERT:
      return NOTIFICATION_CHANNELS.find(channel => channel.id === 'price-alerts');
    case NOTIFICATION_TYPES.RECIPE_SUGGESTION:
      return NOTIFICATION_CHANNELS.find(channel => channel.id === 'recipes');
    case NOTIFICATION_TYPES.AI_INSIGHT:
    case NOTIFICATION_TYPES.SMART_SUGGESTION:
      return NOTIFICATION_CHANNELS.find(channel => channel.id === 'ai-insights');
    default:
      return NOTIFICATION_CHANNELS.find(channel => channel.id === 'general');
  }
};

/**
 * Cancel a scheduled notification
 * @param {string} notificationId - Notification ID
 */
export const cancelScheduledNotification = async (notificationId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllScheduledNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
};

/**
 * Dismiss all displayed notifications
 */
export const dismissAllNotifications = async () => {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Error dismissing all notifications:', error);
  }
};

/**
 * Get current badge count
 * @returns {Promise<number>} Badge count
 */
export const getBadgeCount = async () => {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
};

/**
 * Set badge count
 * @param {number} count - New badge count
 */
export const setBadgeCount = async (count) => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
};

/**
 * AI HELPER FUNCTIONS
 */

/**
 * Get user notification preferences
 * @returns {Promise<Object>} User preferences
 */
const getUserNotificationPreferences = async () => {
  try {
    const preferences = await AsyncStorage.getItem('userNotificationPreferences');
    return preferences ? JSON.parse(preferences) : {
      preferredTimes: ['09:00', '18:00'],
      quietHours: { start: '22:00', end: '07:00' },
      urgencyThreshold: 'medium',
      personalizedContent: true,
      language: 'en'
    };
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return {};
  }
};

/**
 * Get user notification patterns from history
 * @returns {Promise<Object>} User patterns analysis
 */
const getUserNotificationPatterns = async () => {
  try {
    const history = await getNotificationHistory(50);
    
    // Analyze patterns
    const patterns = {
      mostActiveHours: [],
      preferredDays: [],
      responseRate: 0,
      engagementTimes: []
    };

    if (history.length > 0) {
      // Analyze engagement times
      const engagementHours = history
        .filter(n => n.data?.clicked || n.data?.responded)
        .map(n => new Date(n.timestamp).getHours());
      
      patterns.mostActiveHours = [...new Set(engagementHours)].slice(0, 3);
      patterns.responseRate = (engagementHours.length / history.length) * 100;
    }

    return patterns;
  } catch (error) {
    console.error('Error analyzing user patterns:', error);
    return {};
  }
};

/**
 * Analyze notification patterns using AI
 * @param {Object} preferences - User preferences
 * @param {Array} history - Notification history
 * @returns {Promise<Object>} AI analysis results
 */
const analyzeNotificationPatterns = async (preferences, history) => {
  try {
    if (!checkRateLimit() || history.length < 5) {
      return null;
    }

    const prompt = `
Analyze user notification patterns and preferences to optimize future notifications.

User Preferences: ${JSON.stringify(preferences)}
Recent Notifications: ${JSON.stringify(history.slice(0, 10))}

Analyze:
1. Best times to send notifications
2. Most effective message styles
3. Engagement patterns
4. Optimization recommendations

Format as JSON:
{
  "optimalTimes": ["HH:MM", "HH:MM"],
  "avoidTimes": ["HH:MM", "HH:MM"],
  "preferredMessageStyle": "direct/casual/detailed",
  "engagementInsights": {
    "bestPerformingTypes": ["type1", "type2"],
    "responseRate": percentage,
    "recommendations": ["tip1", "tip2"]
  },
  "personalizationTips": [
    {
      "category": "category",
      "suggestion": "personalization suggestion"
    }
  ]
}

Return only valid JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let analysis;
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(cleanedText);
      
      // Store analysis for future use
      await AsyncStorage.setItem('notificationPatternAnalysis', JSON.stringify({
        analysis,
        lastUpdated: new Date().toISOString(),
        sampleSize: history.length
      }));
      
      return analysis;
    } catch (parseError) {
      console.warn('Failed to parse notification pattern analysis');
      return null;
    }

  } catch (error) {
    console.error('Error analyzing notification patterns:', error);
    return null;
  }
};

/**
 * Get user's name for personalization
 * @returns {Promise<string>} User name
 */
const getUserName = async () => {
  try {
    const userName = await AsyncStorage.getItem('userName');
    return userName || 'User';
  } catch (error) {
    return 'User';
  }
};

/**
 * Get current time of day category
 * @returns {string} Time category
 */
const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

/**
 * Get meal time category based on current time
 * @returns {string} Meal category
 */
const getMealTimeCategory = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 18) return 'snack';
  if (hour >= 18 && hour < 22) return 'dinner';
  return 'late_night';
};

/**
 * Generate intelligent notification insights
 * @param {Array} userStock - User's current stock
 * @param {Array} shoppingList - User's shopping list
 * @param {Object} userPatterns - User behavior patterns
 * @returns {Promise<Array>} AI-generated insights
 */
export const generateNotificationInsights = async (userStock = [], shoppingList = [], userPatterns = {}) => {
  try {
    if (!checkRateLimit()) {
      return [];
    }

    const lowStockItems = userStock.filter(item => item.quantity <= (item.minQuantity || 2));
    const expiringItems = userStock.filter(item => {
      if (!item.expiryDate) return false;
      const daysUntilExpiry = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 3 && daysUntilExpiry > 0;
    });

    const prompt = `
Generate smart notification insights for a shopping app user.

Current Stock (${userStock.length} items):
Low Stock: ${lowStockItems.map(item => `${item.name} (${item.quantity})`).join(', ')}
Expiring Soon: ${expiringItems.map(item => `${item.name} (${item.expiryDate})`).join(', ')}

Shopping List: ${shoppingList.map(item => item.name).join(', ')}

User Patterns: ${JSON.stringify(userPatterns)}

Generate 3-5 actionable insights that would be valuable as notifications:
1. Urgent actions needed
2. Money-saving opportunities
3. Meal planning suggestions
4. Shopping optimization tips
5. Inventory management advice

Format as JSON array:
[
  {
    "type": "urgent/savings/recipe/optimization/inventory",
    "priority": "high/medium/low",
    "title": "notification title",
    "message": "notification message",
    "action": "recommended action",
    "screen": "target screen",
    "data": {
      "relevant": "data"
    },
    "timing": "immediate/hourly/daily/weekly"
  }
]

Return only valid JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let insights;
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      insights = JSON.parse(cleanedText);
    } catch (parseError) {
      console.warn('Failed to parse notification insights');
      return [];
    }

    // Store insights for analytics
    await AsyncStorage.setItem('lastNotificationInsights', JSON.stringify({
      insights,
      generatedAt: new Date().toISOString(),
      context: {
        stockCount: userStock.length,
        lowStockCount: lowStockItems.length,
        expiringCount: expiringItems.length,
        shoppingListCount: shoppingList.length
      }
    }));

    return insights;

  } catch (error) {
    console.error('Error generating notification insights:', error);
    return [];
  }
};

/**
 * Process and send AI-generated insights as notifications
 * @param {Array} insights - AI-generated insights
 * @returns {Promise<Array>} Sent notification IDs
 */
export const processAndSendInsights = async (insights) => {
  const sentNotifications = [];

  for (const insight of insights) {
    try {
      // Determine if we should send this insight immediately
      const shouldSendNow = insight.timing === 'immediate' || insight.priority === 'high';
      
      if (shouldSendNow) {
        const notificationId = await sendSmartInsightNotification(insight, {
          generatedByAI: true,
          insightType: insight.type
        });
        
        if (notificationId) {
          sentNotifications.push(notificationId);
        }
      } else {
        // Schedule for later based on timing
        const triggerTime = calculateOptimalTriggerTime(insight.timing);
        
        const notificationId = await scheduleNotification({
          title: insight.title,
          body: insight.message,
          data: insight.data,
          type: NOTIFICATION_TYPES.AI_INSIGHT,
          context: {
            generatedByAI: true,
            insightType: insight.type,
            priority: insight.priority
          }
        }, { date: triggerTime });
        
        if (notificationId) {
          sentNotifications.push(notificationId);
        }
      }
      
      // Small delay between notifications
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('Error processing insight:', error);
    }
  }

  return sentNotifications;
};

/**
 * Calculate optimal trigger time based on timing preference
 * @param {string} timing - Timing preference
 * @returns {Date} Optimal trigger time
 */
const calculateOptimalTriggerTime = (timing) => {
  const now = new Date();
  
  switch (timing) {
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    case 'daily':
      // Next day at 9 AM
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow;
    case 'weekly':
      // Next week at the same time
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek;
    default:
      return new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
  }
};

/**
 * Update user notification preferences with AI learning
 * @param {Object} newPreferences - New preference data
 * @param {Object} interactionData - User interaction data
 */
export const updateNotificationPreferencesWithAI = async (newPreferences, interactionData = {}) => {
  try {
    const currentPreferences = await getUserNotificationPreferences();
    const updatedPreferences = { ...currentPreferences, ...newPreferences };
    
    // If we have enough interaction data, use AI to optimize preferences
    if (checkRateLimit() && Object.keys(interactionData).length > 0) {
      const optimizedPreferences = await optimizePreferencesWithAI(
        updatedPreferences,
        interactionData
      );
      
      if (optimizedPreferences) {
        await AsyncStorage.setItem('userNotificationPreferences', JSON.stringify(optimizedPreferences));
        return optimizedPreferences;
      }
    }
    
    // Fallback to manual update
    await AsyncStorage.setItem('userNotificationPreferences', JSON.stringify(updatedPreferences));
    return updatedPreferences;
    
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return null;
  }
};

/**
 * Optimize preferences using AI based on interaction data
 * @param {Object} preferences - Current preferences
 * @param {Object} interactionData - User interaction data
 * @returns {Promise<Object>} Optimized preferences
 */
const optimizePreferencesWithAI = async (preferences, interactionData) => {
  try {
    const prompt = `
Optimize notification preferences based on user interaction data.

Current Preferences: ${JSON.stringify(preferences)}
Interaction Data: ${JSON.stringify(interactionData)}

Suggest optimizations for:
1. Preferred notification times
2. Content personalization settings
3. Frequency adjustments
4. Priority thresholds

Format as JSON:
{
  "optimizedPreferences": {
    "preferredTimes": ["HH:MM", "HH:MM"],
    "quietHours": {"start": "HH:MM", "end": "HH:MM"},
    "urgencyThreshold": "high/medium/low",
    "personalizedContent": boolean,
    "frequency": "high/medium/low"
  },
  "reasoning": "explanation of optimizations",
  "confidence": "high/medium/low"
}

Return only valid JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let optimization;
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      optimization = JSON.parse(cleanedText);
      
      if (optimization.confidence !== 'low') {
        return {
          ...preferences,
          ...optimization.optimizedPreferences,
          aiOptimized: true,
          optimizationReasoning: optimization.reasoning,
          lastOptimized: new Date().toISOString()
        };
      }
    } catch (parseError) {
      console.warn('Failed to parse preference optimization');
    }

    return null;

  } catch (error) {
    console.error('Error optimizing preferences with AI:', error);
    return null;
  }
};

// Export all functions
export default {
  initializeNotifications,
  sendLocalNotification,
  scheduleNotification,
  areNotificationsEnabled,
  setNotificationsEnabled,
  getNotificationHistory,
  clearNotificationHistory,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  cancelScheduledNotification,
  cancelAllScheduledNotifications,
  dismissAllNotifications,
  getBadgeCount,
  setBadgeCount,
  sendLowStockNotification,
  sendExpiringItemNotification,
  sendPriceAlertNotification,
  sendShoppingReminderNotification,
  scheduleShoppingReminder,
  sendRecipeSuggestionNotification,
  sendSmartInsightNotification,
  generateNotificationInsights,
  processAndSendInsights,
  updateNotificationPreferencesWithAI,
  NOTIFICATION_TYPES,
};