# Push Notifications Setup Guide

This guide explains how to set up and use the push notification system for food expiration alerts in the Mazah app.

## Overview

The app uses Expo's push notification service to send alerts when food items are approaching their expiration date. Users can configure when they want to be notified (e.g., 1 day, 3 days, or 7 days before expiration).

## Features

- **Food Expiration Alerts**: Automatic notifications when food is about to expire
- **Customizable Timing**: Users can choose multiple notification timeframes
- **Background Processing**: Automatic checking for expiring items
- **Push Notifications**: Cross-platform notifications via Expo Push Service
- **Local Notifications**: Fallback notifications when push fails

## Setup Requirements

### 1. Expo Project Configuration

The app.json has been updated with the necessary notification configuration:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/sounds/notification.wav"]
        }
      ]
    ],
    "notification": {
      "icon": "./assets/images/notification-icon.png",
      "color": "#ffffff",
      "iosDisplayInForeground": true,
      "androidMode": "default",
      "androidCollapsedTitle": "Food Expiration Alert"
    }
  }
}
```

### 2. Environment Variables

Set the following environment variables:

```bash
# .env file
EXPO_PROJECT_ID=your-expo-project-id
```

### 3. Database Schema Updates

The following tables have been added to support notifications:

#### `push_tokens` Table
```sql
CREATE TABLE public.push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  device_type TEXT CHECK (device_type IN ('ios', 'android', 'web')) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(token)
);
```

#### Updated `user_profiles` Table
```sql
-- Added fields for notification preferences
expiration_notifications_enabled BOOLEAN DEFAULT true,
expiration_notification_days INTEGER[] DEFAULT '{1, 3, 7}',
```

#### Updated `food_items` Table
```sql
-- Added field to track notification status
notification_sent BOOLEAN DEFAULT false,
```

## Architecture

### 1. Notification Service (`services/notificationService.ts`)

The main service that handles:
- Permission requests
- Push token management
- Notification preferences
- Sending push notifications
- Checking expiring food items

### 2. Background Task Service (`services/backgroundTaskService.ts`)

Manages background processing to:
- Periodically check for expiring food items
- Send notifications automatically
- Handle background fetch registration

### 3. Notification Settings Component (`components/NotificationSettings.tsx`)

UI component for users to:
- Enable/disable notifications
- Choose notification timeframes
- Test notification functionality

### 4. Custom Hook (`hooks/useNotifications.ts`)

React hook for managing notification state and operations throughout the app.

## Usage

### 1. Initializing Notifications

Notifications are automatically initialized when a user logs in:

```typescript
// In app/_layout.tsx
useEffect(() => {
  if (user && !loading) {
    initializeNotifications();
  }
}, [user, loading]);

const initializeNotifications = async () => {
  const notificationSuccess = await notificationService.initialize();
  if (notificationSuccess) {
    await backgroundTaskService.registerBackgroundFetch();
  }
};
```

### 2. Sending Notifications

#### Manual Notification
```typescript
import notificationService from '../services/notificationService';

await notificationService.sendPushNotification(
  userId,
  'Food Expiration Alert',
  'Milk expires in 1 day',
  { foodItemId: '123', type: 'expiration_alert' }
);
```

#### Automatic Expiration Check
```typescript
// This runs automatically in the background
await notificationService.checkExpiringFoodItems();
```

### 3. Managing User Preferences

```typescript
import { useNotifications } from '../hooks/useNotifications';

const { updatePreferences } = useNotifications();

await updatePreferences({
  expiration_notifications_enabled: true,
  expiration_notification_days: [1, 3, 7]
});
```

## Testing

### 1. Test Notifications

Use the test button in the Notification Settings screen to verify your setup.

### 2. API Testing

Test the notification API endpoint:

```bash
curl -X POST http://localhost:3000/api/test-notification \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "title": "Test Notification",
    "body": "This is a test notification",
    "data": {"type": "test"}
  }'
```

### 3. Background Task Testing

Manually trigger the background task:

```typescript
import backgroundTaskService from '../services/backgroundTaskService';

await backgroundTaskService.triggerBackgroundTask();
```

## Troubleshooting

### Common Issues

1. **Notifications not working on iOS Simulator**
   - Push notifications require a physical device
   - Use Expo Go app for testing

2. **Background tasks not running**
   - Check device battery optimization settings
   - Verify background app refresh is enabled

3. **Push tokens not being saved**
   - Check database permissions
   - Verify user authentication

4. **Notifications not appearing**
   - Check notification permissions
   - Verify notification settings in device settings

### Debug Logs

Enable debug logging by checking the console for:
- "Initializing notifications..."
- "Notifications initialized successfully"
- "Background fetch task registered successfully"
- "Push notifications sent successfully"

## Security Considerations

1. **Push Token Storage**: Tokens are stored securely in the database with user isolation
2. **Permission Management**: Users must explicitly grant notification permissions
3. **Data Validation**: All notification data is validated before sending
4. **Rate Limiting**: Notifications are limited to prevent spam

## Performance Optimization

1. **Background Fetch**: Limited to minimum 15-minute intervals
2. **Batch Processing**: Multiple notifications are sent in batches
3. **Smart Filtering**: Only sends notifications for items that haven't been notified
4. **Efficient Queries**: Database queries are optimized with proper indexing

## Future Enhancements

1. **Scheduled Notifications**: Allow users to set custom notification times
2. **Notification Categories**: Different types of food alerts
3. **Smart Recommendations**: Suggest recipes for expiring items
4. **Push Analytics**: Track notification engagement and effectiveness

## Support

For issues or questions about the notification system:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure the database schema is up to date
4. Test on a physical device rather than simulator
