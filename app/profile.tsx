import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

// Use the proto color scheme
const proto = Colors.proto;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

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
            } catch (error) {
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

      <View style={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <IconSymbol size={40} name={"person" as any} color={proto.buttonText} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.accountLabel}>Personal Account</Text>
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
                Alert.alert('Coming Soon', 'This feature will be available in a future update.');
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
                Alert.alert('Coming Soon', 'This feature will be available in a future update.');
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
                Alert.alert('Coming Soon', 'This feature will be available in a future update.');
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
                Alert.alert('Coming Soon', 'This feature will be available in a future update.');
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
                Alert.alert('Coming Soon', 'This feature will be available in a future update.');
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
      </View>
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
    width: 40, // To balance the back button
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: proto.accentDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
}); 