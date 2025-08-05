import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, Switch, Modal, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// Use the proto color scheme
const proto = Colors.proto;

// Storage keys for preferences
const STORAGE_KEYS = {
  NOTIFICATIONS: '@notifications_enabled',
  EXPIRY_ALERTS: '@expiry_alerts_days',
  DARK_MODE: '@dark_mode_enabled',
  PROFILE_EMOJI: '@profile_emoji',
  PROFILE_HINT_SHOWN: '@profile_hint_shown',
};

// Food emoji options
const FOOD_EMOJIS = [
  '🍎', '🍌', '🍇', '🍓', '🫐', '🍊', '🍑', '🥭',
  '🍍', '🥥', '🥝', '🍅', '🥑', '🥕', '🌽', '🥒',
  '🥬', '🥦', '🍄', '🥜', '🌰', '🍞', '🥖', '🥨',
  '🧀', '🥚', '🍳', '🥓', '🥩', '🍗', '🍖', '🌭',
  '🍔', '🍟', '🍕', '🌮', '🌯', '🥙', '🥪', '🫔',
  '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤',
  '🍙', '🍘', '🍥', '🥮', '🧁', '🍰', '🎂', '🍮',
  '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🥛', '☕'
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  
  // State for modals
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [preferencesModalVisible, setPreferencesModalVisible] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [emojiModalVisible, setEmojiModalVisible] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Notification settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [expiryAlertDays, setExpiryAlertDays] = useState('3');
  
  // Preferences state
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  
  // Profile emoji state
  const [profileEmoji, setProfileEmoji] = useState('🍎');
  
  // Profile hint state
  const [showProfileHint, setShowProfileHint] = useState(true);
  
  // Feedback state
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('general');

  // Load saved preferences on mount
  React.useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const notifications = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const expiryDays = await AsyncStorage.getItem(STORAGE_KEYS.EXPIRY_ALERTS);
      const darkMode = await AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE);
      const emoji = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_EMOJI);
      const hintShown = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_HINT_SHOWN);
      
      if (notifications !== null) setNotificationsEnabled(JSON.parse(notifications));
      if (expiryDays !== null) setExpiryAlertDays(expiryDays);
      if (darkMode !== null) setDarkModeEnabled(JSON.parse(darkMode));
      if (emoji !== null) setProfileEmoji(emoji);
      if (hintShown !== null) setShowProfileHint(!JSON.parse(hintShown));
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleEmojiSelect = async (emoji: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_EMOJI, emoji);
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_HINT_SHOWN, JSON.stringify(true));
      setProfileEmoji(emoji);
      setShowProfileHint(false);
      setEmojiModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile picture');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleOpenEmojiModal = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_HINT_SHOWN, JSON.stringify(true));
      setShowProfileHint(false);
      setEmojiModalVisible(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error saving hint shown state:', error);
      setEmojiModalVisible(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      // First, verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        Alert.alert('Error', 'Current password is incorrect');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // If current password is correct, update to new password
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (updateError) throw updateError;
      
      Alert.alert('Success', 'Password updated successfully');
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const saveNotificationSettings = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notificationsEnabled));
      await AsyncStorage.setItem(STORAGE_KEYS.EXPIRY_ALERTS, expiryAlertDays);
      
      Alert.alert('Success', 'Notification settings saved');
      setNotificationsModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Failed to save notification settings');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const savePreferences = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(darkModeEnabled));
      
      Alert.alert('Success', 'Preferences saved');
      setPreferencesModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // In a real app, you would trigger a theme change here
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const sendFeedback = async () => {
    if (!feedbackText.trim()) {
      Alert.alert('Error', 'Please enter your feedback');
      return;
    }

    try {
      // In a real app, you would send this to your backend
      // For now, we'll just store it in Supabase
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user?.id,
          type: feedbackType,
          message: feedbackText,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      Alert.alert('Thank You!', 'Your feedback has been sent successfully');
      setFeedbackModalVisible(false);
      setFeedbackText('');
      setFeedbackType('general');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Failed to send feedback. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth/login');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Sign Out Error', 'Failed to sign out. Please try again.');
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <IconSymbol size={24} name={"chevron.left" as any} color={proto.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleOpenEmojiModal}
            activeOpacity={0.7}
          >
            <Text style={styles.emojiAvatar}>{profileEmoji}</Text>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.accountLabel}>Personal Account</Text>
            {showProfileHint && (
              <TouchableOpacity 
                style={styles.changePhotoButton}
                onPress={handleOpenEmojiModal}
                activeOpacity={0.7}
              >
                <Text style={styles.changePhotoText}>✨ Tap to change profile picture</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <View style={styles.settingsCard}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPasswordModalVisible(true);
              }}
            >
              <View style={styles.settingIconContainer}>
                <IconSymbol size={22} name={"star" as any} color={proto.buttonText} />
              </View>
              <Text style={styles.settingText}>Change Password</Text>
              <IconSymbol size={20} name={"chevron.right" as any} color={proto.textSecondary} />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setNotificationsModalVisible(true);
              }}
            >
              <View style={styles.settingIconContainer}>
                <IconSymbol size={22} name={"lightbulb" as any} color={proto.buttonText} />
              </View>
              <Text style={styles.settingText}>Notifications</Text>
              <IconSymbol size={20} name={"chevron.right" as any} color={proto.textSecondary} />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPreferencesModalVisible(true);
              }}
            >
              <View style={styles.settingIconContainer}>
                <IconSymbol size={22} name={"wand.and.stars" as any} color={proto.buttonText} />
              </View>
              <Text style={styles.settingText}>Preferences</Text>
              <IconSymbol size={20} name={"chevron.right" as any} color={proto.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <View style={styles.settingsCard}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/help-center');
              }}
            >
              <View style={styles.settingIconContainer}>
                <IconSymbol size={22} name={"message" as any} color={proto.buttonText} />
              </View>
              <Text style={styles.settingText}>Help Center</Text>
              <IconSymbol size={20} name={"chevron.right" as any} color={proto.textSecondary} />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFeedbackModalVisible(true);
              }}
            >
              <View style={styles.settingIconContainer}>
                <IconSymbol size={22} name={"paperplane.fill" as any} color={proto.buttonText} />
              </View>
              <Text style={styles.settingText}>Send Feedback</Text>
              <IconSymbol size={20} name={"chevron.right" as any} color={proto.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={styles.signOutButton} 
          onPress={handleSignOut}
        >
          <IconSymbol size={22} name={"trash" as any} color="#E57373" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>

      {/* Emoji Selection Modal */}
      <Modal
        visible={emojiModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEmojiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.emojiModalContent}>
            <TouchableOpacity
              style={styles.cornerCloseButton}
              onPress={() => setEmojiModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            
            <Text style={styles.emojiModalTitleCentered}>Choose Your Profile Picture</Text>
            
            <ScrollView 
              style={styles.emojiGrid}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.emojiContainer}>
                {FOOD_EMOJIS.map((emoji, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.emojiButton,
                      profileEmoji === emoji && styles.selectedEmojiButton
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleEmojiSelect(emoji);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Password Modal */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholderTextColor={proto.textSecondary}
            />
            
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholderTextColor={proto.textSecondary}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholderTextColor={proto.textSecondary}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleChangePassword}
              >
                <Text style={styles.saveButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={notificationsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNotificationsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Notification Settings</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Enable Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: proto.textSecondary, true: proto.accent }}
                thumbColor={proto.buttonText}
              />
            </View>
            
            <View style={styles.settingGroup}>
              <Text style={styles.settingLabel}>Expiry Alert Days</Text>
              <Text style={styles.settingDescription}>
                Get notified when items expire within this many days
              </Text>
              <TextInput
                style={styles.input}
                placeholder="3"
                keyboardType="numeric"
                value={expiryAlertDays}
                onChangeText={setExpiryAlertDays}
                placeholderTextColor={proto.textSecondary}
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setNotificationsModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveNotificationSettings}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Preferences Modal */}
      <Modal
        visible={preferencesModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPreferencesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Preferences</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: proto.textSecondary, true: proto.accent }}
                thumbColor={proto.buttonText}
              />
            </View>
            
            <Text style={styles.comingSoonText}>
              More preferences coming soon!
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setPreferencesModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={savePreferences}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        visible={feedbackModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFeedbackModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Feedback</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setFeedbackModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.feedbackTypes}>
              <TouchableOpacity
                style={[
                  styles.feedbackType,
                  feedbackType === 'bug' && styles.feedbackTypeActive
                ]}
                onPress={() => setFeedbackType('bug')}
              >
                <Text style={[
                  styles.feedbackTypeText,
                  feedbackType === 'bug' && styles.feedbackTypeTextActive
                ]}>Bug Report</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.feedbackType,
                  feedbackType === 'feature' && styles.feedbackTypeActive
                ]}
                onPress={() => setFeedbackType('feature')}
              >
                <Text style={[
                  styles.feedbackTypeText,
                  feedbackType === 'feature' && styles.feedbackTypeTextActive
                ]}>Feature Request</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.feedbackType,
                  feedbackType === 'general' && styles.feedbackTypeActive
                ]}
                onPress={() => setFeedbackType('general')}
              >
                <Text style={[
                  styles.feedbackTypeText,
                  feedbackType === 'general' && styles.feedbackTypeTextActive
                ]}>General</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.input, styles.feedbackInput]}
              placeholder="Tell us what you think..."
              multiline
              numberOfLines={4}
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholderTextColor={proto.textSecondary}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, styles.fullWidthButton]}
                onPress={sendFeedback}
              >
                <Text style={styles.saveButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: proto.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: proto.accentDark,
    opacity: 0.85,
    letterSpacing: 0.5,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: proto.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: proto.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
    borderWidth: 3,
    borderColor: proto.accentDark,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  emojiAvatar: {
    fontSize: 36,
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: proto.accentDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: proto.background,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  editBadgeText: {
    fontSize: 14,
    color: proto.buttonText,
  },
  profileInfo: {
    flex: 1,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 4,
  },
  accountLabel: {
    fontSize: 14,
    color: proto.textSecondary,
    marginBottom: 8,
  },
  changePhotoButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: proto.accentDark + '25',
    borderWidth: 1,
    borderColor: proto.accentDark + '40',
  },
  changePhotoText: {
    fontSize: 12,
    color: proto.accentDark,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: proto.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: proto.card,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: proto.accentDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: proto.text,
    fontWeight: '500',
  },
  settingDivider: {
    height: 1,
    backgroundColor: proto.textSecondary,
    opacity: 0.1,
    marginHorizontal: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: proto.card,
    padding: 16,
    borderRadius: 20,
    marginTop: 'auto',
    marginBottom: 12,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E57373',
    marginLeft: 8,
  },
  version: {
    textAlign: 'center',
    fontSize: 14,
    color: proto.textSecondary,
    marginBottom: 24,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: proto.background,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emojiModalContent: {
    backgroundColor: proto.background,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: proto.text,
    textAlign: 'center',
  },
  emojiModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: proto.text,
    flex: 1,
  },
  emojiModalTitleCentered: {
    fontSize: 20,
    fontWeight: '700',
    color: proto.text,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  cornerCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: proto.textSecondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: proto.textSecondary,
    lineHeight: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: proto.textSecondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  emojiGrid: {
    maxHeight: 400,
  },
  emojiScrollContent: {
    paddingHorizontal: 4,
  },
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  emojiButton: {
    width: 50,
    height: 50,
    backgroundColor: proto.card,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    marginVertical: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedEmojiButton: {
    borderColor: proto.accentDark,
    backgroundColor: proto.accentDark + '20',
    transform: [{ scale: 1.05 }],
  },
  emojiText: {
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 28,
  },
  input: {
    backgroundColor: proto.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: proto.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: proto.textSecondary + '20',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: proto.card,
    borderWidth: 1,
    borderColor: proto.textSecondary + '20',
  },
  cancelButtonText: {
    color: proto.text,
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: proto.accent,
  },
  saveButtonText: {
    color: proto.buttonText,
    fontWeight: '600',
    fontSize: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
  },
  settingGroup: {
    marginBottom: 20,
  },
  settingDescription: {
    fontSize: 14,
    color: proto.textSecondary,
    marginTop: 4,
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 14,
    color: proto.textSecondary,
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  feedbackTypes: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  feedbackType: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: proto.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: proto.textSecondary + '20',
  },
  feedbackTypeActive: {
    backgroundColor: proto.accentDark,
    borderColor: proto.accentDark,
  },
  feedbackTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: proto.text,
  },
  feedbackTypeTextActive: {
    color: proto.buttonText,
  },
  feedbackInput: {
    height: 100,
  },
  fullWidthButton: {
    flex: 0,
    width: '100%',
  },
});