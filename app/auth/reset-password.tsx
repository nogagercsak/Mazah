import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const proto = Colors.proto;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { access_token, refresh_token } = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    verifyResetToken();
  }, [access_token, refresh_token]);

  const verifyResetToken = async () => {
    if (!access_token || !refresh_token) {
      setCheckingToken(false);
      Alert.alert(
        'Invalid Reset Link',
        'This password reset link is invalid or has expired. Please request a new one.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
      return;
    }

    try {
      // Set the session using the tokens from the reset link
      const { error } = await supabase.auth.setSession({
        access_token: access_token as string,
        refresh_token: refresh_token as string,
      });

      if (error) {
        throw error;
      }

      setValidToken(true);
    } catch (error) {
      if (__DEV__) console.error('Token verification error:', error);
      Alert.alert(
        'Invalid Reset Link',
        'This password reset link is invalid or has expired. Please request a new one.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    } finally {
      setCheckingToken(false);
    }
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (password.length > 72) {
      return 'Password must be less than 72 characters';
    }
    return null;
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Missing Information', 'Please enter and confirm your new password.');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      Alert.alert('Invalid Password', passwordError);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords Don\'t Match', 'Please make sure both password fields match.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      Alert.alert(
        'Password Updated',
        'Your password has been successfully updated. You can now sign in with your new password.',
        [
          { 
            text: 'Continue to Login', 
            onPress: () => {
              // Sign out to clear the reset session
              supabase.auth.signOut();
              router.replace('/auth/login');
            }
          }
        ]
      );

    } catch (error) {
      if (__DEV__) console.error('Password update error:', error);
      
      let errorMessage = 'Unable to update password. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('New password should be different')) {
          errorMessage = 'Your new password must be different from your current password.';
        } else if (error.message.includes('Password is too weak')) {
          errorMessage = 'Please choose a stronger password.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Update Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/auth/login');
  };

  if (checkingToken) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={proto.accent} />
          <Text style={styles.loadingText}>Verifying reset link...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!validToken) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <IconSymbol name="exclamationmark.triangle" size={64} color="#E57373" />
            <Text style={styles.title}>Invalid Link</Text>
            <Text style={styles.subtitle}>
              This password reset link is invalid or has expired. Please request a new one.
            </Text>
          </View>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <IconSymbol name="key.fill" size={64} color={proto.accent} />
          <Text style={styles.title}>Set New Password</Text>
          <Text style={styles.subtitle}>
            Choose a strong password for your account
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your new password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={proto.textSecondary}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholderTextColor={proto.textSecondary}
              editable={!loading}
            />
          </View>

          <View style={styles.passwordHints}>
            <Text style={styles.hintText}>Password Requirements:</Text>
            <Text style={styles.hintBullet}>• At least 6 characters long</Text>
            <Text style={styles.hintBullet}>• Different from your current password</Text>
          </View>

          <TouchableOpacity 
            style={[styles.updateButton, loading && styles.disabledButton]} 
            onPress={handleResetPassword} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={proto.buttonText} />
            ) : (
              <Text style={styles.updateButtonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
            <IconSymbol name="arrow.left" size={20} color={proto.accent} />
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: proto.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: proto.textSecondary,
    marginTop: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: proto.accentDark,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: proto.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  form: {
    width: '100%',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    color: proto.text,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  passwordHints: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  hintText: {
    fontSize: 14,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 8,
  },
  hintBullet: {
    fontSize: 14,
    color: proto.textSecondary,
    marginBottom: 4,
  },
  updateButton: {
    backgroundColor: proto.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  updateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: proto.buttonText,
  },
  footer: {
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.accent,
    marginLeft: 8,
  },
});