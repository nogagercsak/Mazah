import React from 'react';
import { Button, View, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function TestNotification() {
  const sendNotification = async () => {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission not granted!');
      return;
    }
    
    // Send notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test",
        body: "Simple test",
      },
      trigger: null, // Show immediately
    });
    
    Alert.alert('Notification sent! Check your notification center.');
  };
  
  return (
    <View style={{ marginTop: 100 }}>
      <Button title="Send Test" onPress={sendNotification} />
    </View>
  );
}