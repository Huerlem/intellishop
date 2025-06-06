import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { auth } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { notificationService } from '../services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Custom hook to manage notifications
 * @returns {Object} Functions and states related to notifications
 */
export default function useNotifications() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [scheduledNotifications, setScheduledNotifications] = useState([]);

  // Inicializa o serviço de notificações
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        
        // Initialize the service
        await notificationService.initialize();
        
        // Checks if notifications are enabled for the user
        if (auth.currentUser) {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            setNotificationsEnabled(
              userDoc.data().notificationsEnabled !== undefined 
                ? userDoc.data().notificationsEnabled
                : true // Enabled by default
            );
          }
        } else {
          // Check locally saved settings if not logged in
          const localSetting = await AsyncStorage.getItem('notifications_enabled');
          setNotificationsEnabled(localSetting === null || localSetting === 'true');
        }
        
        // Loads scheduled notifications
        await loadScheduledNotifications();
      } catch (err) {
        console.error('Error initializing notifications:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initialize();

    // Configure listeners for incoming and clicked notifications
    const receivedSubscription = Notifications.addNotificationReceivedListener(_handleNotificationReceived);
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(_handleNotificationResponse);

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  // Updates the state whenever the user changes
  useEffect(() => {
    if (auth.currentUser) {
      const checkUserSettings = async () => {
        try {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            setNotificationsEnabled(
              userDoc.data().notificationsEnabled !== undefined 
                ? userDoc.data().notificationsEnabled
                : true
            );
          }
        } catch (err) {
          console.error('Error checking user notification settings:', err);
        }
      };
      
      checkUserSettings();
    }
  }, [auth.currentUser]);

  /**
   * Loads scheduled notifications
   */
  const loadScheduledNotifications = async () => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      setScheduledNotifications(notifications);
    } catch (err) {
      console.error('Error loading scheduled notifications:', err);
    }
  };

  /**
   * Handles incoming notifications
   * @param {Object} notification - Object of notification
   */
  const _handleNotificationReceived = (notification) => {
    // Can implement additional logic when receiving notification
    console.log('Notification received:', notification);
  };

  /**
   * Handles response to notifications (when the user clicks)
  * @param {Object} response - Notification response
   */
  const _handleNotificationResponse = (response) => {
    const data = response.notification.request.content.data;
    
    // Logic based on notification type
    switch (data.type) {
      case 'stock':
        // Navigate to inventory and display item
        // Implementation depends on app navigation
        break;
      case 'aiSuggestion':
        // Navigate to view suggested list
        break;
      case 'discount':
        // Browse to see discount details
        break;
      case 'reminder':
        // Navigate to shopping list
        break;
      default:
        break;
    }
  };

  /**
   * Turn notifications on or off
   * @param {boolean} enabled - Whether notifications should be enabled
   */
  const toggleNotifications = useCallback(async (enabled) => {
    try {
      setLoading(true);
      
      // Updates in Firebase if logged in
      if (auth.currentUser) {
        await notificationService.toggleNotifications(enabled);
      }
      
      // Saves locally anyway
      await AsyncStorage.setItem('notifications_enabled', String(enabled));
      
      setNotificationsEnabled(enabled);
    } catch (err) {
      console.error('Error toggling notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Set a reminder to shop
   * @param {Date} date - Reminder date and time
   * @returns {Promise<string|null>} Notification ID or null on error
   */
  const scheduleShoppingReminder = useCallback(async (date) => {
    if (!notificationsEnabled) {
      setError('As notificações estão desativadas. Ative-as nas configurações.');
      return null;
    }
    
    try {
      const notificationId = await notificationService.scheduleShoppingReminder(date);
      
      // Updates the list of scheduled notifications
      await loadScheduledNotifications();
      
      return notificationId;
    } catch (err) {
      console.error('Error scheduling reminder:', err);
      setError(err.message);
      return null;
    }
  }, [notificationsEnabled]);

  /**
   * Cancela uma notificação agendada
   * @param {string} id - ID da notificação
   */
  const cancelNotification = useCallback(async (id) => {
    try {
      await notificationService.cancelNotification(id);
      await loadScheduledNotifications();
    } catch (err) {
      console.error('Error canceling notification:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Agenda uma notificação para estoque baixo
   * @param {string} itemName - Nome do item
   * @param {number} quantity - Quantidade atual
   */
  const notifyLowStock = useCallback(async (itemName, quantity) => {
    if (!notificationsEnabled) return;
    
    try {
      await notificationService.scheduleStockNotification(itemName, quantity);
    } catch (err) {
      console.error('Error sending low stock notification:', err);
      setError(err.message);
    }
  }, [notificationsEnabled]);

  /**
   * Reseta erros
   */
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    notificationsEnabled,
    toggleNotifications,
    scheduleShoppingReminder,
    cancelNotification,
    notifyLowStock,
    loading,
    error,
    resetError,
    scheduledNotifications,
    expoPushToken
  };
}