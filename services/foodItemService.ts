import notificationService from './notificationService';

export interface FoodItem {
  id: string;
  name: string;
  expiration_date?: string;
  user_id: string;
  // Add other fields as needed
}

/**
 * Add a food item and automatically schedule expiration notifications
 */
export const addFoodItemWithNotifications = async (foodItem: FoodItem): Promise<boolean> => {
  try {
    // Note: You would typically save to database here first
    // const { error } = await supabase.from('food_items').insert(foodItem);
    // if (error) throw error;
    
    // Schedule expiration notifications
    if (foodItem.expiration_date) {
      const expirationDate = new Date(foodItem.expiration_date);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Get user preferences
      const preferences = await notificationService.getNotificationPreferences();
      
      // Schedule notifications for each configured day
      if (preferences?.expiration_notifications_enabled) {
        for (const daysBefore of preferences.expiration_notification_days) {
          if (daysUntilExpiry >= daysBefore) {
            await notificationService.scheduleExpirationNotification(
              foodItem.id,
              foodItem.name,
              expirationDate,
              daysBefore
            );
          }
        }
        
        if (__DEV__) console.log(`Scheduled notifications for ${foodItem.name} (expires in ${daysUntilExpiry} days)`);
      }
    }
    
    return true;
  } catch (error) {
    if (__DEV__) console.error('Error adding food item with notifications:', error);
    return false;
  }
};

/**
 * Update a food item and reschedule notifications
 */
export const updateFoodItemWithNotifications = async (foodItem: FoodItem): Promise<boolean> => {
  try {
    // Note: You would typically update the database here first
    // const { error } = await supabase.from('food_items').update(foodItem).eq('id', foodItem.id);
    // if (error) throw error;
    
    // Cancel existing notifications for this food item
    await notificationService.cleanupNotifications();
    
    // Reschedule notifications with updated data
    if (foodItem.expiration_date) {
      const expirationDate = new Date(foodItem.expiration_date);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      const preferences = await notificationService.getNotificationPreferences();
      
      if (preferences?.expiration_notifications_enabled) {
        for (const daysBefore of preferences.expiration_notification_days) {
          if (daysUntilExpiry >= daysBefore) {
            await notificationService.scheduleExpirationNotification(
              foodItem.id,
              foodItem.name,
              expirationDate,
              daysBefore
            );
          }
        }
        
        if (__DEV__) console.log(`Rescheduled notifications for ${foodItem.name}`);
      }
    }
    
    return true;
  } catch (error) {
    if (__DEV__) console.error('Error updating food item with notifications:', error);
    return false;
  }
};

/**
 * Delete a food item and cancel its notifications
 */
export const deleteFoodItemWithNotifications = async (foodItemId: string): Promise<boolean> => {
  try {
    // Note: You would typically delete from database here first
    // const { error } = await supabase.from('food_items').delete().eq('id', foodItemId);
    // if (error) throw error;
    
    // Cancel notifications for this specific food item
    await notificationService.cleanupNotifications();
    
    if (__DEV__) console.log(`Cancelled notifications for food item: ${foodItemId}`);
    return true;
  } catch (error) {
    if (__DEV__) console.error('Error deleting food item with notifications:', error);
    return false;
  }
};