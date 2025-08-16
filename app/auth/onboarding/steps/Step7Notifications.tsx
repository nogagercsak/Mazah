import { Colors } from '@/constants/Colors';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import OnboardingButton from '../components/OnboardingButton';
import { OnboardingProfile } from '..';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';

const proto = Colors.proto;

interface Step7NotificationsProps {
  onNext: () => void;
  onBack: () => void;
  updateProfile: (data: Partial<OnboardingProfile>) => void;
  profile: Partial<OnboardingProfile>;
}

export default function Step7Notifications({
  onNext,
  onBack,
  updateProfile,
  profile,
}: Step7NotificationsProps) {
  const insets = useSafeAreaInsets();
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
      
      // If already granted, update profile
      if (status === 'granted') {
        updateProfile({ 
          notifications_enabled: true,
          expiration_notifications_enabled: true 
        });
      }
    } catch (error) {
      console.error('Error checking notification permissions:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      setIsRequesting(true);
      
      // Request permissions
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
        
        // Update both fields: permission status and notification preference
        updateProfile({ 
          notifications_enabled: true,
          expiration_notifications_enabled: true 
        });
        Alert.alert(
          'Notifications Enabled! 🎉',
          'You\'ll now receive helpful reminders about food expiration and other important updates.',
          [{ text: 'Great!' }]
        );
      } else {
        // Update both fields: permission status and notification preference
        updateProfile({ 
          notifications_enabled: false,
          expiration_notifications_enabled: false 
        });
        Alert.alert(
          'Notifications Disabled',
          'You can enable notifications later in your profile settings if you change your mind.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      Alert.alert('Error', 'Failed to request notification permissions. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  const getPermissionStatusText = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'Notifications are enabled! 🎉';
      case 'denied':
        return 'Notifications are currently disabled';
      case 'undetermined':
        return 'Notification permissions not yet requested';
      default:
        return 'Checking notification status...';
    }
  };

  const getPermissionStatusColor = () => {
    switch (permissionStatus) {
      case 'granted':
        return proto.accent;
      case 'denied':
        return '#E57373';
      case 'undetermined':
        return proto.textSecondary;
      default:
        return proto.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <IconSymbol size={48} name="bell.fill" color={proto.accent} />
          </View>
          <Text style={styles.title}>Stay Updated with Notifications</Text>
          <Text style={styles.subtitle}>
            Get timely reminders about food expiration, meal planning, and more to help reduce waste
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>What you'll get:</Text>
          
          <View style={styles.benefitItem}>
            <IconSymbol size={20} name="clock.fill" color={proto.accent} />
            <Text style={styles.benefitText}>Food expiration alerts before items go bad</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <IconSymbol size={20} name="calendar" color={proto.accent} />
            <Text style={styles.benefitText}>Weekly meal planning reminders</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <IconSymbol size={20} name="cart.fill" color={proto.accent} />
            <Text style={styles.benefitText}>Shopping list updates and reminders</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <IconSymbol size={20} name="fork.knife" color={proto.accent} />
            <Text style={styles.benefitText}>Recipe suggestions based on your preferences</Text>
          </View>
        </View>

        {/* Permission Status */}
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Current Status:</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusIndicator, { backgroundColor: getPermissionStatusColor() }]} />
            <Text style={[styles.statusText, { color: getPermissionStatusColor() }]}>
              {getPermissionStatusText()}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        {permissionStatus !== 'granted' && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.permissionButton, isRequesting && styles.permissionButtonDisabled]}
              onPress={requestPermissions}
              disabled={isRequesting}
              activeOpacity={0.8}
            >
              <IconSymbol 
                size={20} 
                name={permissionStatus === 'denied' ? "settings" : "bell.fill"} 
                color={proto.buttonText} 
              />
              <Text style={styles.permissionButtonText}>
                {permissionStatus === 'denied' 
                  ? 'Open Settings' 
                  : 'Enable Notifications'
                }
              </Text>
            </TouchableOpacity>
            
            {permissionStatus === 'denied' && (
              <Text style={styles.settingsNote}>
                You'll need to enable notifications in your device settings
              </Text>
            )}
          </View>
        )}

        {/* Privacy Note */}
        <View style={styles.privacyContainer}>
          <IconSymbol size={16} name="lock.fill" color={proto.textSecondary} />
          <Text style={styles.privacyText}>
            We respect your privacy. Notifications are only sent for app-related activities and can be disabled anytime in settings.
          </Text>
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={[
        styles.buttonContainer,
        { paddingBottom: Math.max(insets.bottom + 16, 24) }
      ]}>
        <OnboardingButton
          title="Back"
          variant="secondary"
          onPress={onBack}
          style={styles.backButton}
        />
        <OnboardingButton
          title="Complete Setup"
          onPress={onNext}
          disabled={isRequesting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: proto.background,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: proto.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: proto.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: proto.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsContainer: {
    backgroundColor: proto.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    color: proto.text,
    marginLeft: 12,
    flex: 1,
  },
  permissionContainer: {
    backgroundColor: proto.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: proto.accent,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  permissionButtonDisabled: {
    opacity: 0.6,
  },
  permissionButtonText: {
    color: proto.buttonText,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  settingsNote: {
    fontSize: 14,
    color: proto.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: proto.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  privacyText: {
    fontSize: 14,
    color: proto.textSecondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    paddingHorizontal: 24,
    backgroundColor: proto.background,
    borderTopWidth: 1,
    borderTopColor: proto.border,
  },
  backButton: {
    flex: 0.4,
  },
});
