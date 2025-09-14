import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import notificationService from './notificationService';

const BACKGROUND_FETCH_TASK = 'background-fetch-food-expiration';

// Define the background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    if (__DEV__) console.log('Background task: Checking for expiring food items');
    
    // Check for expiring food items and send notifications
    await notificationService.checkExpiringFoodItems();
    
    // Return success
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    if (__DEV__) console.error('Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export class BackgroundTaskService {
  private static instance: BackgroundTaskService;

  private constructor() {}

  public static getInstance(): BackgroundTaskService {
    if (!BackgroundTaskService.instance) {
      BackgroundTaskService.instance = new BackgroundTaskService();
    }
    return BackgroundTaskService.instance;
  }

  /**
   * Register the background fetch task
   */
  async registerBackgroundFetch(): Promise<boolean> {
    try {
      // Check background fetch status
      const status = await BackgroundFetch.getStatusAsync();
      
      if (status === BackgroundFetch.BackgroundFetchStatus.Restricted) {
        if (__DEV__) console.log('Background fetch is restricted');
        return false;
      }

      if (status === BackgroundFetch.BackgroundFetchStatus.Denied) {
        if (__DEV__) console.log('Background fetch is denied');
        return false;
      }

      // Check if the task is already registered
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
      if (isRegistered) {
        if (__DEV__) console.log('Background fetch task already registered');
        return true;
      }

      // Register the task
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 15 * 60, // 15 minutes minimum
        stopOnTerminate: false,
        startOnBoot: true,
      });

      if (__DEV__) console.log('Background fetch task registered successfully');
      return true;
    } catch (error) {
      if (__DEV__) console.error('Error registering background fetch:', error);
      
      // Check if it's a configuration error
      if (error instanceof Error && error.message.includes('Background Fetch has not been configured')) {
        if (__DEV__) console.log('Background fetch not configured - this is expected in development');
        return false;
      }
      
      return false;
    }
  }

  /**
   * Unregister the background fetch task
   */
  async unregisterBackgroundFetch(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      if (__DEV__) console.log('Background fetch task unregistered');
    } catch (error) {
      if (__DEV__) console.error('Error unregistering background fetch:', error);
    }
  }

  /**
   * Get the current background fetch status
   */
  async getBackgroundFetchStatus(): Promise<string> {
    try {
      const status = await BackgroundFetch.getStatusAsync();
      if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
        return 'available';
      } else if (status === BackgroundFetch.BackgroundFetchStatus.Denied) {
        return 'denied';
      } else {
        return 'restricted';
      }
    } catch (error) {
      if (__DEV__) console.error('Error getting background fetch status:', error);
      return 'restricted';
    }
  }

  /**
   * Manually trigger the background task for testing
   */
  async triggerBackgroundTask(): Promise<void> {
    try {
      await notificationService.checkExpiringFoodItems();
      if (__DEV__) console.log('Background task triggered manually');
    } catch (error) {
      if (__DEV__) console.error('Error triggering background task:', error);
    }
  }
}

export default BackgroundTaskService.getInstance();
