import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import notificationService, { NotificationPreferences } from '../services/notificationService';
import { Colors } from '../constants/Colors';

interface NotificationSettingsProps {
  onClose?: () => void;
}

// Use the proto color scheme to match the app's design
const proto = Colors.proto;

export default function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    expiration_notifications_enabled: true,
    expiration_notification_days: [1, 3, 7],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await notificationService.getNotificationPreferences();
      if (prefs) {
        setPreferences(prefs);
      }
    } catch (error) {
      if (__DEV__) console.error('Error loading preferences:', error);
    }
  };

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      setLoading(true);
      const success = await notificationService.updateNotificationPreferences(newPreferences);
      
      if (success) {
        setPreferences(prev => ({ ...prev, ...newPreferences }));
      } else {
        Alert.alert('Error', 'Failed to update notification preferences');
      }
    } catch (error) {
      if (__DEV__) console.error('Error updating preferences:', error);
      Alert.alert('Error', 'Failed to update notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = (enabled: boolean) => {
    updatePreferences({ expiration_notifications_enabled: enabled });
  };

  const toggleNotificationDay = (day: number) => {
    const newDays = preferences.expiration_notification_days.includes(day)
      ? preferences.expiration_notification_days.filter(d => d !== day)
      : [...preferences.expiration_notification_days, day].sort((a, b) => a - b);
    
    updatePreferences({ expiration_notification_days: newDays });
  };

  const availableDays = [1, 2, 3, 5, 7, 10, 14];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Main Settings Card */}
        <View style={styles.settingsCard}>
          {/* Enable/Disable Notifications */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Food Expiration Alerts</Text>
              <Text style={styles.settingDescription}>
                Get notified when your food is about to expire
              </Text>
            </View>
            <Switch
              value={preferences.expiration_notifications_enabled}
              onValueChange={toggleNotifications}
              disabled={loading}
              trackColor={{ false: proto.border, true: proto.accent }}
              thumbColor={preferences.expiration_notifications_enabled ? proto.buttonText : '#f4f3f4'}
            />
          </View>

          {/* Notification Days */}
          {preferences.expiration_notifications_enabled && (
            <>
              <View style={styles.settingDivider} />
              <View style={styles.daysSection}>
                <Text style={styles.daysSectionTitle}>Notify me when food expires in:</Text>
                <View style={styles.daysContainer}>
                  {availableDays.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayButton,
                        preferences.expiration_notification_days.includes(day) && styles.dayButtonActive
                      ]}
                      onPress={() => toggleNotificationDay(day)}
                      disabled={loading}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayButtonText,
                          preferences.expiration_notification_days.includes(day) && styles.dayButtonTextActive
                        ]}
                      >
                        {day} {day === 1 ? 'day' : 'days'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>

        {/* Information Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Notifications are sent based on your selected timeframes
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                You&apos;ll receive alerts when food items are approaching their expiration date
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Notifications are sent once per food item to avoid spam
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                You can change these settings at any time
              </Text>
            </View>
          </View>
        </View>

        {/* Configuration Notice Card */}
        <View style={styles.configCard}>
          <Text style={styles.configTitle}>⚠️ Configuration Required</Text>
          <Text style={styles.configText}>
            To enable push notifications, you need to:{'\n'}
            1. Set up your Expo project ID in environment variables{'\n'}
            2. Build a development build (Expo Go doesn&apos;t support push notifications){'\n'}
            3. Configure your app for production deployment{'\n\n'}
            Local notifications will still work for testing purposes.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: proto.background,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  settingsCard: {
    backgroundColor: proto.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: proto.textSecondary,
    lineHeight: 20,
  },
  settingDivider: {
    height: 1,
    backgroundColor: proto.border,
    marginVertical: 16,
  },
  daysSection: {
    marginTop: 8,
  },
  daysSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 16,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: proto.border,
    backgroundColor: proto.inputBackground,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dayButtonActive: {
    backgroundColor: proto.accent,
    borderColor: proto.accent,
    shadowColor: proto.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: proto.textSecondary,
  },
  dayButtonTextActive: {
    color: proto.buttonText,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: proto.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 16,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoBullet: {
    fontSize: 16,
    color: proto.accent,
    fontWeight: '600',
    marginRight: 8,
    marginTop: 1,
  },
  infoText: {
    fontSize: 14,
    color: proto.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  configCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFEAA7',
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 12,
  },
  configText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});
