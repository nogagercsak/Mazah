import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const proto = Colors.proto;

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
  if (!email || !password || !confirmPassword) {
    Alert.alert('Missing Information', 'Please fill out all fields.');
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    Alert.alert('Invalid Email', 'Please enter a valid email address (e.g., user@example.com)');
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert('Password Mismatch', 'Passwords do not match.');
    return;
  }

  if (password.length < 6) {
    Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
    return;
  }

  setLoading(true);

  try {
    console.log('🔐 SIGNUP: Attempting to sign up with email:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log('🔐 SIGNUP: Response data:', data);
    console.log('🔐 SIGNUP: Response error:', error);

    if (error) {
      console.error('🔐 SIGNUP: Error details:', error);
      
      let errorMessage = 'An error occurred during sign up.';
      
      if (error.message.includes('Invalid email')) {
        errorMessage = 'This email address is not accepted. Please try a different email address.';
      } else if (error.message.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = 'Password must be at least 6 characters long.';
      } else if (error.message.includes('Unable to validate email address')) {
        errorMessage = 'Unable to validate this email address. Please try a different email.';
      } else if (error.message.includes('Email not allowed')) {
        errorMessage = 'This email domain is not allowed. Please use a different email address.';
      } else {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }

    console.log('🔐 SIGNUP: Signup successful!');
    console.log('🔐 SIGNUP: User data:', data.user);
    console.log('🔐 SIGNUP: Email confirmed at:', data.user?.email_confirmed_at);

    if (data.user && !data.user.email_confirmed_at) {
      console.log('🔐 SIGNUP: Email confirmation required');
      Alert.alert(
        'Check Your Email', 
        'We\'ve sent you a confirmation email. Please check your email and click the confirmation link to complete your account setup.',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('🔐 SIGNUP: Email confirmation alert dismissed, going to login');
              router.replace('/auth/login');
            },
          },
        ]
      );
    } else {
      // Email confirmation not required OR already confirmed
      console.log('🔐 SIGNUP: No email confirmation required, account created successfully');
      
      // Don't navigate immediately - let the useProtectedRoute handle it
      console.log('🔐 SIGNUP: Account created, auth context will handle navigation to onboarding');
    }

  } catch (error) {
    console.error('🔐 SIGNUP: Sign up error:', error);
    Alert.alert('Sign Up Failed', error instanceof Error ? error.message : 'An error occurred during sign up.');
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
          <TouchableOpacity onPress={handleBackToLogin} style={styles.backButton}>
            <IconSymbol name={"chevron.left" as any} size={24} color={proto.accentDark} />
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Mazah to reduce food waste</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={proto.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password (min. 6 characters)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={proto.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholderTextColor={proto.textSecondary}
            />
          </View>

          <TouchableOpacity 
            style={styles.signUpButton} 
            onPress={handleSignUp} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={proto.buttonText} />
            ) : (
              <Text style={styles.signUpButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={handleBackToLogin}>
            <Text style={styles.loginLinkText}>Already have an account? Sign In</Text>
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
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 48,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: proto.accentDark,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: proto.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
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
  signUpButton: {
    backgroundColor: proto.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  signUpButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: proto.buttonText,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  loginLinkText: {
    fontSize: 16,
    color: proto.accent,
    fontWeight: '500',
  },
});