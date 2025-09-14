import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import notificationService from '../services/notificationService';
import backgroundTaskService from '../services/backgroundTaskService';

export interface NotificationStatus {
  isEnabled: boolean;
  permissionsGranted: boolean;
  backgroundFetchEnabled: boolean;
  pushToken: string | null;
}

export function useNotifications() {
  const [status, setStatus] = useState<NotificationStatus>({
    isEnabled: false,
    permissionsGranted: false,
    backgroundFetchEnabled: false,
    pushToken: null,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      setLoading(true);

      // Check permissions
      const { status: permissionStatus } = await Notifications.getPermissionsAsync();
      const permissionsGranted = permissionStatus === 'granted';

      // Check background fetch status
      const backgroundFetchStatus = await backgroundTaskService.getBackgroundFetchStatus();
      const backgroundFetchEnabled = backgroundFetchStatus === 'granted';

      // Get push token
      const pushToken = notificationService.getPushToken();

      // Check if notifications are enabled in user preferences
      const preferences = await notificationService.getNotificationPreferences();
      const isEnabled = preferences?.expiration_notifications_enabled ?? false;

      setStatus({
        isEnabled,
        permissionsGranted,
        backgroundFetchEnabled,
        pushToken,
      });
    } catch (error) {
      if (__DEV__) console.error('Error checking notification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      const result = await notificationService.initialize();
      if (result) {
        await checkNotificationStatus();
        return true;
      }
      return false;
    } catch (error) {
      if (__DEV__) console.error('Error requesting notification permissions:', error);
      return false;
    }
  };

  const updatePreferences = async (preferences: any) => {
    try {
      const success = await notificationService.updateNotificationPreferences(preferences);
      if (success) {
        await checkNotificationStatus();
      }
      return success;
    } catch (error) {
      if (__DEV__) console.error('Error updating notification preferences:', error);
      return false;
    }
  };

  const testNotification = async () => {
    try {
      // Check permissions first
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        return false;
      }
      
      // Schedule the notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification 🎉',
          body: 'Your notifications are working properly!',
          data: { type: 'test' },
          sound: 'default',
        },
        trigger: {
          type: 'timeInterval' as any,
          seconds: 2, // 2 second delay so user can background app if needed
        },
      });
      
      return true;
    } catch (error) {
      return false;
    }
  };

  const refreshStatus = () => {
    checkNotificationStatus();
  };

  return {
    status,
    loading,
    requestPermissions,
    updatePreferences,
    testNotification,
    refreshStatus,
  };
}
