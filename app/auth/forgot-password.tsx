import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const proto = Colors.proto;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendResetEmail = async () => {
    if (!email) {
      Alert.alert('Missing Information', 'Please enter your email address.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'mazah://auth/reset-password',
      });

      if (error) {
        throw error;
      }

      setEmailSent(true);
      Alert.alert(
        'Reset Email Sent',
        'Check your email for a link to reset your password. If it doesn\'t appear within a few minutes, check your spam folder.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      if (__DEV__) console.error('Password reset error:', error);
      
      let errorMessage = 'Unable to send reset email. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('For security purposes')) {
          errorMessage = 'For security purposes, we cannot confirm if this email is registered. If an account exists, you will receive a reset email.';
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Too many requests. Please wait a moment before trying again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Reset Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <IconSymbol name="lock" size={64} color={proto.accent} />
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            {emailSent 
              ? 'We\'ve sent you a reset link!' 
              : 'Enter your email and we\'ll send you a link to reset your password'
            }
          </Text>
        </View>

        {!emailSent ? (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={proto.textSecondary}
                editable={!loading}
              />
            </View>

            <TouchableOpacity 
              style={[styles.resetButton, loading && styles.disabledButton]} 
              onPress={handleSendResetEmail} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={proto.buttonText} />
              ) : (
                <Text style={styles.resetButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <IconSymbol name="checkmark.circle.fill" size={48} color={proto.accent} />
            </View>
            <Text style={styles.successText}>
              Check your email for a reset link. Click the link in the email to set a new password.
            </Text>
            <Text style={styles.helpText}>
              Didn't receive the email? Check your spam folder or try again with a different email address.
            </Text>
          </View>
        )}

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
    marginBottom: 24,
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
  resetButton: {
    backgroundColor: proto.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  resetButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: proto.buttonText,
  },
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  successIcon: {
    marginBottom: 16,
  },
  successText: {
    fontSize: 16,
    color: proto.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  helpText: {
    fontSize: 14,
    color: proto.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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