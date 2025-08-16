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
  DARK_MODE: '@dark_mode_enabled',
  PROFILE_EMOJI: '@profile_emoji',
  PROFILE_HINT_SHOWN: '@profile_hint_shown',
};

// Food emoji options
const FOOD_EMOJIS = [
  '🍎', '🍌', '🍇', '🍓', '🫐', '🍊', '🍑', '🥭',
  '🍍', '🥥', '🥝', '🍅', '🥑', '🥕', '🌽', '🥒',
  '🥬', '🥦', '🍄', '🥜', '🍞', '🥖', '🥨',
  '🧀', '🍳', '🥓', '🥩', '🍗', '🍖', '🌭',
  '🍔', '🍟', '🍕', '🌮', '🌯', '🥙', '🥪', '🫔',
  '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤',
  '🍙', '🍘', '🍥', '🥮', '🧁', '🍰', '🎂', '🍮',
  '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', 
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  
  // State for modals
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [preferencesModalVisible, setPreferencesModalVisible] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [emojiModalVisible, setEmojiModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Account deletion state
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  

  
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
      const darkMode = await AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE);
      const emoji = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_EMOJI);
      const hintShown = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_HINT_SHOWN);
      
      if (darkMode !== null) setDarkModeEnabled(JSON.parse(darkMode));
      if (emoji !== null) setProfileEmoji(emoji);
      if (hintShown !== null) setShowProfileHint(!JSON.parse(hintShown));
    } catch (error) {
      // Error loading preferences - silently fail
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
      // Error saving hint state - continue with modal
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
    
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE' || !deletePassword) {
      Alert.alert('Error', 'Please complete all confirmation steps');
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Verify password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: deletePassword,
      });

      if (signInError) {
        Alert.alert('Error', 'Incorrect password');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setIsDeleting(false);
        return;
      }

      // Delete the user account (this will also delete all their data)
      const { error: deleteError } = await supabase.rpc('delete_user');

      if (deleteError) throw deleteError;

      // Clear local storage
      await AsyncStorage.clear();

      // The user will be automatically signed out since their account no longer exists
      
      // Show success message and navigate to login
      Alert.alert(
        'Account Deleted',
        'Your account has been successfully deleted.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login')
          }
        ],
        { cancelable: false }
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      // Handle delete account error
      Alert.alert('Error', error.message || 'Failed to delete account. Please contact support.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsDeleting(false);
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
              // Handle sign out error
              Alert.alert('Sign Out Error', 'Failed to sign out. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleOpenDeleteModal = () => {
    Alert.alert(
      '⚠️ Warning',
      'Deleting your account is permanent and cannot be undone. All your data will be lost forever.\n\nAre you sure you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          style: 'destructive',
          onPress: () => {
            setDeleteAccountModalVisible(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
                router.push('/notifications');
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
          <IconSymbol size={22} name={"rectangle.portrait.and.arrow.right" as any} color="#E57373" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Delete Account Button */}
        <TouchableOpacity 
          style={styles.deleteAccountButton} 
          onPress={handleOpenDeleteModal}
        >
          <IconSymbol size={22} name={"trash" as any} color="#FF5252" />
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>

      {/* Delete Account Modal */}
      <Modal
        visible={deleteAccountModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDeleteAccountModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalHeader}>
              <IconSymbol size={48} name={"exclamationmark.triangle.fill" as any} color="#FF5252" />
              <Text style={styles.deleteModalTitle}>Delete Account</Text>
            </View>
            
            <Text style={styles.deleteWarningText}>
              This action is <Text style={styles.boldText}>permanent and cannot be undone</Text>. 
              All your data, including pantry items, shopping lists, and preferences will be deleted forever.
            </Text>
            
            <View style={styles.deleteConfirmSection}>
              <Text style={styles.deleteInstructionText}>
                Type <Text style={styles.deleteCodeText}>DELETE</Text> to confirm:
              </Text>
              <TextInput
                style={[styles.input, styles.deleteConfirmInput]}
                placeholder="Type DELETE"
                value={deleteConfirmationText}
                onChangeText={setDeleteConfirmationText}
                placeholderTextColor={proto.textSecondary}
                autoCapitalize="characters"
              />
            </View>
            
            <View style={styles.deleteConfirmSection}>
              <Text style={styles.deleteInstructionText}>
                Enter your password to confirm:
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={deletePassword}
                onChangeText={setDeletePassword}
                placeholderTextColor={proto.textSecondary}
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setDeleteAccountModalVisible(false);
                  setDeleteConfirmationText('');
                  setDeletePassword('');
                }}
                disabled={isDeleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmationText !== 'DELETE' || !deletePassword}
              >
                <Text style={styles.deleteButtonText}>
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: proto.textSecondary + '10',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: proto.card,
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
    padding: 20,
  },
  profileCard: {
    backgroundColor: proto.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: proto.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  emojiAvatar: {
    fontSize: 32,
  },
  profileInfo: {
    flex: 1,
  },
  email: {
    fontSize: 16,
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
    marginTop: 4,
  },
  changePhotoText: {
    fontSize: 12,
    color: proto.accent,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 12,
  },
  settingsCard: {
    backgroundColor: proto.card,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: proto.accent,
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
    backgroundColor: proto.border,
    marginLeft: 60,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: proto.card,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E57373',
    marginLeft: 8,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: proto.card,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  deleteAccountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5252',
    marginLeft: 8,
  },
  version: {
    textAlign: 'center',
    fontSize: 14,
    color: proto.textSecondary,
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: proto.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  fullScreenModalContent: {
    backgroundColor: proto.card,
    borderRadius: 16,
    width: '100%',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: proto.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: proto.textSecondary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: proto.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: proto.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: proto.border,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: proto.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.textSecondary,
  },
  saveButton: {
    backgroundColor: proto.accent,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.buttonText,
  },
  fullWidthButton: {
    flex: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingGroup: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: proto.textSecondary,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: proto.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 16,
  },
  feedbackTypes: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  feedbackType: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: proto.background,
    borderWidth: 1,
    borderColor: proto.border,
    alignItems: 'center',
  },
  feedbackTypeActive: {
    backgroundColor: proto.accent,
    borderColor: proto.accent,
  },
  feedbackTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: proto.text,
  },
  feedbackTypeTextActive: {
    color: proto.buttonText,
  },
  feedbackInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  deleteModalContent: {
    backgroundColor: proto.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  deleteModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF5252',
    marginTop: 12,
  },
  deleteWarningText: {
    fontSize: 16,
    color: proto.text,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '700',
    color: '#FF5252',
  },
  deleteConfirmSection: {
    marginBottom: 16,
  },
  deleteInstructionText: {
    fontSize: 14,
    color: proto.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  deleteCodeText: {
    fontFamily: 'monospace',
    backgroundColor: proto.background,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteConfirmInput: {
    fontFamily: 'monospace',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  deleteButton: {
    backgroundColor: '#FF5252',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  emojiModalContent: {
    backgroundColor: proto.card,
    borderRadius: 20,
    padding: 24,
    paddingBottom: 0,
    width: '90%',
    maxWidth: 450,
    height: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  
  cornerCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  
  emojiModalTitleCentered: {
    fontSize: 20,
    fontWeight: '600',
    color: proto.text,
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  
  emojiGrid: {
    flex: 1,
    width: '100%',
  },
  
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 16,
    paddingTop: 4,
  },
  
  emojiButton: {
    width: '18%', // 5 items per row with proper spacing
    aspectRatio: 1, 
    borderRadius: 16,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  
  selectedEmojiButton: {
    backgroundColor: proto.accent + '20',
    borderColor: proto.accent,
    borderWidth: 2,
    transform: [{ scale: 1.1 }],
    shadowColor: proto.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  
  emojiText: {
    fontSize: 28,
    lineHeight: 32,
    textAlign: 'center',
  },
  
  emojiButtonPressed: {
    backgroundColor: '#e8f4ff',
    transform: [{ scale: 0.95 }],
  },
});