import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { IconSymbol } from './ui/IconSymbol';
import { Colors } from '@/constants/Colors';

const proto = Colors.proto;

interface NotificationPermissionPromptProps {
  onDismiss: () => void;
}

export default function NotificationPermissionPrompt({ onDismiss }: NotificationPermissionPromptProps) {
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    } catch (error) {
      if (__DEV__) if (__DEV__) console.error('Error checking notification permissions:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      setIsRequesting(true);
      
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      
      if (status === 'granted') {
        // Set up notification channels for Android
        if (Device.isDevice && Device.osName === 'Android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }
        
        // Update the user profile to reflect notification permissions
        try {
          const { supabase } = await import('@/lib/supabase');
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('user_profiles')
              .upsert({
                user_id: user.id,
                notifications_enabled: true,
                expiration_notifications_enabled: true,
                updated_at: new Date().toISOString()
              });
          }
        } catch (error) {
          if (__DEV__) console.log('Failed to update user profile:', error);
        }

        Alert.alert(
          'Notifications Enabled! 🎉',
          'You\'ll now receive helpful reminders about food expiration and other important updates.',
          [{ text: 'Great!', onPress: onDismiss }]
        );
      } else {
        Alert.alert(
          'Notifications Disabled',
          'You can enable notifications later in your profile settings if you change your mind.',
          [{ text: 'OK', onPress: onDismiss }]
        );
      }
    } catch (error) {
      if (__DEV__) console.error('Error requesting notification permissions:', error);
      Alert.alert('Error', 'Failed to request notification permissions. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  // Don't show if permissions are already granted
  if (permissionStatus === 'granted') {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <IconSymbol size={32} name="bell.fill" color={proto.accent} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>Stay Updated!</Text>
          <Text style={styles.subtitle}>
            Enable notifications to get food expiration alerts and helpful reminders
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.enableButton, isRequesting && styles.enableButtonDisabled]}
            onPress={requestPermissions}
            disabled={isRequesting}
            activeOpacity={0.8}
          >
            <Text style={styles.enableButtonText}>
              {isRequesting ? 'Requesting...' : 'Enable'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  content: {
    backgroundColor: proto.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: proto.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  enableButton: {
    backgroundColor: proto.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  enableButtonDisabled: {
    opacity: 0.6,
  },
  enableButtonText: {
    color: proto.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: proto.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});
