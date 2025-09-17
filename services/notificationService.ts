import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { EXPO_PROJECT_ID } from '@env';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPreferences {
  expiration_notifications_enabled: boolean;
  expiration_notification_days: number[];
}

export class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notifications and request permissions
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if we're running in Expo Go (which has limited notification support)
      const isExpoGo = __DEV__ && !process.env.EXPO_PROJECT_ID;
      if (isExpoGo && __DEV__) {
        if (__DEV__) console.log('Running in Expo Go - notifications will have limited functionality');
        if (__DEV__) console.log('For full notification support, build a development build');
      }

      // Ensure user profile exists
      await this.ensureUserProfile();

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        if (__DEV__) console.log('Failed to get notification permissions!');
        return false;
      }

      // Get the token
      if (Device.isDevice) {
        try {
          // Check if we have a valid project ID
          const projectId = EXPO_PROJECT_ID;
          if (!projectId || projectId === 'your-project-id') {
            if (__DEV__) {
              if (__DEV__) console.log('Expo project ID not configured. Push notifications will not work.');
              if (__DEV__) console.log('Please set EXPO_PROJECT_ID in your environment variables.');
            }
            // Still return true so the app can continue, but push notifications won't work
            return true;
          }

          const token = await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
          });
          this.expoPushToken = token.data;
          
          // Save token to database
          await this.savePushToken(token.data);
          
          if (__DEV__) console.log('Expo push token:', token.data);
        } catch (error) {
          if (__DEV__) console.error('Error getting Expo push token:', error);
          // Don't fail the entire initialization, just log the error
          if (__DEV__) console.log('Push notifications will not work, but local notifications may still function.');
          return true;
        }
      } else {
        if (__DEV__) console.log('Must use physical device for Push Notifications');
        return false;
      }

      // Set up notification channels for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return true;
    } catch (error) {
      if (__DEV__) console.error('Error initializing notifications:', error);
      return false;
    }
  }

  /**
   * Save push token to database
   */
  private async savePushToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const deviceType = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

      // Check if token already exists
      const { data: existingToken } = await supabase
        .from('push_tokens')
        .select('id')
        .eq('token', token)
        .single();

      if (existingToken) {
        // Update existing token
        await supabase
          .from('push_tokens')
          .update({ 
            is_active: true, 
            updated_at: new Date().toISOString() 
          })
          .eq('token', token);
      } else {
        // Insert new token
        await supabase
          .from('push_tokens')
          .insert({
            user_id: user.id,
            token,
            device_type: deviceType,
            is_active: true
          });
      }
    } catch (error) {
      if (__DEV__) console.error('Error saving push token:', error);
    }
  }

  /**
   * Get user's notification preferences
   */
  async getNotificationPreferences(): Promise<NotificationPreferences | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile, error: selectError } = await supabase
        .from('user_profiles')
        .select('expiration_notifications_enabled, expiration_notification_days')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle to handle no rows gracefully

      if (selectError) {
        if (__DEV__) console.error('Error selecting profile:', selectError);
        return null;
      }

      if (profile) {
        return {
          expiration_notifications_enabled: profile.expiration_notifications_enabled ?? true,
          expiration_notification_days: profile.expiration_notification_days ?? [1, 3, 7]
        };
      } else {
        // Profile doesn't exist yet, return default preferences
        if (__DEV__) console.log('No profile found for user, returning default notification preferences');
        return {
          expiration_notifications_enabled: true,
          expiration_notification_days: [1, 3, 7]
        };
      }
    } catch (error) {
      if (__DEV__) console.error('Error getting notification preferences:', error);
      return null;
    }
  }

  /**
   * Ensure user profile exists, create if it doesn't
   */
  async ensureUserProfile(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        if (__DEV__) console.error('Error checking if profile exists:', checkError);
        return false;
      }

      if (!profile) {
        // Create a basic profile
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            expiration_notifications_enabled: true,
            expiration_notification_days: [1, 3, 7],
            notifications_enabled: null, // Not prompted yet
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          if (__DEV__) console.error('Error creating user profile:', insertError);
          return false;
        }

        if (__DEV__) console.log('Created user profile for notifications');
      }

      return true;
    } catch (error) {
      if (__DEV__) console.error('Error ensuring user profile:', error);
      return false;
    }
  }

  /**
   * Check if push notifications are properly configured
   */
  isPushNotificationsConfigured(): boolean {
    const projectId = EXPO_PROJECT_ID;
    return !!(projectId && projectId !== 'your-expo-project-id-here' && projectId !== 'your-project-id');
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // First, check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        if (__DEV__) console.error('Error checking if profile exists:', checkError);
        return false;
      }

      let result;
      if (existingProfile) {
        // Profile exists, update it
        const { error } = await supabase
          .from('user_profiles')
          .update({
            ...preferences,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        result = { error };
      } else {
        // Profile doesn't exist, create it
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            ...preferences,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        result = { error };
      }

      if (result.error) {
        if (__DEV__) console.error('Supabase error updating notification preferences:', result.error);
      }

      return !result.error;
    } catch (error) {
      if (__DEV__) console.error('Error updating notification preferences:', error);
      return false;
    }
  }

  /**
   * Schedule local notification for food expiration
   */
  async scheduleExpirationNotification(
    foodItemId: string, 
    foodName: string, 
    expirationDate: Date, 
    daysUntilExpiry: number
  ): Promise<void> {
    try {
      const preferences = await this.getNotificationPreferences();
      if (!preferences?.expiration_notifications_enabled) return;

      // Check if we should send notification for this number of days
      if (!preferences.expiration_notification_days.includes(daysUntilExpiry)) return;

      // Check if notification is already scheduled
      const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const notificationExists = existingNotifications.some(notification => 
        notification.content.data?.foodItemId === foodItemId && 
        notification.content.data?.daysUntilExpiry === daysUntilExpiry
      );

      if (notificationExists) {
        if (__DEV__) console.log(`Notification already scheduled for ${foodName} (${daysUntilExpiry} days)`);
        return;
      }

      // Calculate when to send the notification (e.g., 9 AM on the day)
      const notificationDate = new Date(expirationDate);
      notificationDate.setDate(notificationDate.getDate() - daysUntilExpiry);
      notificationDate.setHours(9, 0, 0, 0); // Set to 9 AM

      // Only schedule if the notification date is in the future
      if (notificationDate > new Date()) {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Food Expiration Alert ⚠️',
            body: `${foodName} expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}`,
            data: { 
              foodItemId, 
              foodName, 
              expirationDate: expirationDate.toISOString(),
              type: 'expiration_alert',
              daysUntilExpiry
            },
            sound: 'default',
            categoryIdentifier: 'expiration',
          },
          trigger: {
            type: 'date' as any,
            date: notificationDate,
          },
        });

        if (__DEV__) console.log(`Scheduled notification for ${foodName}: ${notificationId} at ${notificationDate}`);
      }
    } catch (error) {
      if (__DEV__) console.error('Error scheduling expiration notification:', error);
    }
  }

  /**
   * Schedule notifications for all food items when they're added/updated
   * This provides a fallback when background fetch isn't available
   */
  async scheduleNotificationsForAllFood(): Promise<void> {
    try {
      const preferences = await this.getNotificationPreferences();
      if (!preferences?.expiration_notifications_enabled) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all food items for the user
      const { data: foodItems } = await supabase
        .from('food_items')
        .select('id, name, expiration_date')
        .eq('user_id', user.id)
        .not('expiration_date', 'is', null);

      if (!foodItems) return;

      const today = new Date();
      
      for (const item of foodItems) {
        const expirationDate = new Date(item.expiration_date);
        const daysUntilExpiry = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Only schedule notifications for future dates
        if (daysUntilExpiry > 0 && preferences.expiration_notification_days.includes(daysUntilExpiry)) {
          await this.scheduleExpirationNotification(item.id, item.name, expirationDate, daysUntilExpiry);
        }
      }

      if (__DEV__) console.log(`Scheduled notifications for ${foodItems.length} food items`);
    } catch (error) {
      if (__DEV__) console.error('Error scheduling notifications for all food:', error);
    }
  }

  /**
   * Refresh notifications after food items are added/updated/deleted
   * This ensures notifications stay in sync with the current inventory
   */
  async refreshNotifications(): Promise<void> {
    try {
      // First clean up old notifications
      await this.cleanupNotifications();
      
      // Then schedule notifications for all current food items
      await this.scheduleNotificationsForAllFood();
      
      if (__DEV__) console.log('Notifications refreshed successfully');
    } catch (error) {
      if (__DEV__) console.error('Error refreshing notifications:', error);
    }
  }

  /**
   * Send push notification to user
   */
  async sendPushNotification(userId: string, title: string, body: string, data?: any): Promise<boolean> {
    try {
      // Check if we have a valid project ID for push notifications
      const projectId = EXPO_PROJECT_ID;
      if (!projectId || projectId === 'your-project-id') {
        if (__DEV__) console.log('Expo project ID not configured. Cannot send push notifications.');
        return false;
      }

      // Get user's push tokens
      const { data: tokens } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (!tokens || tokens.length === 0) {
        if (__DEV__) console.log('No active push tokens found for user');
        return false;
      }

      // Send to Expo Push Service
      const messages = tokens.map(({ token }) => ({
        to: token,
        sound: 'default',
        title,
        body,
        data: data || {},
      }));

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (response.ok) {
        if (__DEV__) console.log('Push notifications sent successfully');
        return true;
      } else {
        if (__DEV__) console.error('Failed to send push notifications:', response.statusText);
        return false;
      }
    } catch (error) {
      if (__DEV__) console.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Check for food items expiring soon and send notifications
   */
  async checkExpiringFoodItems(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const preferences = await this.getNotificationPreferences();
      if (!preferences?.expiration_notifications_enabled) return;

      const today = new Date();
      const maxDays = Math.max(...preferences.expiration_notification_days);

      // Get food items expiring within the notification window
      const { data: expiringItems } = await supabase
        .from('food_items')
        .select('id, name, expiration_date, notification_sent')
        .eq('user_id', user.id)
        .not('expiration_date', 'is', null)
        .lte('expiration_date', new Date(today.getTime() + maxDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .gte('expiration_date', today.toISOString().split('T')[0])
        .eq('notification_sent', false);

      if (!expiringItems) return;

      for (const item of expiringItems) {
        const expirationDate = new Date(item.expiration_date);
        const daysUntilExpiry = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (preferences.expiration_notification_days.includes(daysUntilExpiry)) {
          // Send push notification
          await this.sendPushNotification(
            user.id,
            'Food Expiration Alert',
            `${item.name} expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}`,
            {
              foodItemId: item.id,
              foodName: item.name,
              expirationDate: item.expiration_date,
              type: 'expiration_alert'
            }
          );

          // Mark notification as sent
          await supabase
            .from('food_items')
            .update({ notification_sent: true })
            .eq('id', item.id);
        }
      }
    } catch (error) {
      if (__DEV__) console.error('Error checking expiring food items:', error);
    }
  }

  /**
   * Get the current push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Clear expired notifications and clean up old scheduled notifications
   /**
   * Clear expired notifications and clean up old scheduled notifications
   */
  async cleanupNotifications(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      // Get current food items
      const { data: foodItems } = await supabase
        .from('food_items')
        .select('id, expiration_date')
        .eq('user_id', user.id)
        .not('expiration_date', 'is', null);

      if (!foodItems) return;

      const today = new Date();
      const validFoodIds = new Set(foodItems.map(item => item.id));

      // Cancel notifications for food items that no longer exist or have expired
      for (const notification of scheduledNotifications) {
        const foodItemId = notification.content.data?.foodItemId;
        const expirationDate = notification.content.data?.expirationDate;
        
        if (foodItemId && expirationDate && typeof expirationDate === 'string') {
          const isExpired = new Date(expirationDate) <= today;
          const foodStillExists = validFoodIds.has(foodItemId);
          
          if (isExpired || !foodStillExists) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            if (__DEV__) console.log(`Cancelled notification for expired/removed food item: ${foodItemId}`);
          }
        }
      }
    } catch (error) {
      if (__DEV__) console.error('Error cleaning up notifications:', error);
    }
  }

  /**
   * Add notification listener
   */
  addNotificationListener(callback: (notification: Notifications.Notification) => void): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export default NotificationService.getInstance();
