# Push Notification Setup Instructions

## Current Status
Your app is now set up with the notification infrastructure, but you need to complete a few more steps to enable push notifications.

## What's Already Working
✅ Notification permissions request  
✅ Local notification scheduling  
✅ Background task registration  
✅ Database schema for notifications  
✅ UI for notification preferences  

## What Needs to be Configured
❌ Expo Project ID  
❌ Development build (Expo Go doesn't support push notifications)  

## Step 1: Get Your Expo Project ID

1. Go to [https://expo.dev](https://expo.dev) and sign in
2. Find your project "mazah" in the dashboard
3. Click on the project to open it
4. Look for the **Project ID** in the project settings or URL
   - It will look like: `abc12345-def6-7890-ghij-klmnopqrstuv`

## Step 2: Set Environment Variable

Create a `.env` file in your project root (if it doesn't exist) and add:

```bash
EXPO_PROJECT_ID=your_actual_project_id_here
```

Replace `your_actual_project_id_here` with the ID you found in Step 1.

## Step 3: Build Development Build

Since Expo Go doesn't support push notifications, you need to build a development build:

```bash
# Install EAS CLI if you haven't already
npm install -g @expo/eas-cli

# Login to your Expo account
eas login

# Configure your project
eas build:configure

# Build for development
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

## Step 4: Test Notifications

1. Install your development build on a device
2. Open the app and go to Profile → Notifications
3. Enable notifications and set your preferences
4. Test with the "Send Test Notification" button

## Troubleshooting

### "projectId: Invalid uuid" Error
This means your `EXPO_PROJECT_ID` is not set correctly. Double-check Step 2.

### Notifications Not Appearing
- Make sure you're using a development build, not Expo Go
- Check that you granted notification permissions
- Verify your device's notification settings

### Background Tasks Not Running
- iOS: Check Settings → Battery → Background App Refresh
- Android: Check battery optimization settings

## Next Steps

Once push notifications are working:
1. Test with real food items and expiration dates
2. Configure your server to send push notifications
3. Set up notification analytics and monitoring

## Support

If you're still having issues:
1. Check the console logs for detailed error messages
2. Verify your Expo project configuration
3. Ensure you're using a development build, not Expo Go

## Note About Expo Go

**Expo Go does not support push notifications.** You must build a development build to test this functionality. This is a limitation of Expo Go, not your code.
