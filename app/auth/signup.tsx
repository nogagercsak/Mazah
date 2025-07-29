import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, Modal, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrivacyPolicyScreen from './privacy';
import TermsScreen from './terms';

const proto = Colors.proto;

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleSignUp = async () => {
  if (!email || !password || !confirmPassword) {
    Alert.alert('Missing Information', 'Please fill out all fields.');
    return;
  }
    // Check if user agreed to terms and privacy policy
  if (!agreeToTerms || !agreeToPrivacy) {
      Alert.alert('Agreement Required', 'Please agree to both the Terms of Service and Privacy Policy to continue.');
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

  const CheckBox = ({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) => (
    <TouchableOpacity style={styles.checkboxContainer} onPress={onPress}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <IconSymbol name="checkmark" size={16} color={proto.buttonText} />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const DocumentModal = ({ visible, onClose, title, children }: { 
    visible: boolean; 
    onClose: () => void; 
    title: string; 
    children: React.ReactNode;
  }) => (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="chevron.right" size={24} color={proto.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.modalContent}>
          {children}
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
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

          <View style={styles.agreementSection}>
            <TouchableOpacity 
              style={styles.agreementRow} 
              onPress={() => setAgreeToTerms(!agreeToTerms)}
            >
              <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                {agreeToTerms && <IconSymbol name="checkmark" size={16} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>
                I agree to the{' '}
                <Text 
                  style={styles.linkText}
                  onPress={(e) => {
                    e.stopPropagation();
                    setShowTermsModal(true);
                  }}
                >
                  Terms of Service
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.agreementRow} 
              onPress={() => setAgreeToPrivacy(!agreeToPrivacy)}
            >
              <View style={[styles.checkbox, agreeToPrivacy && styles.checkboxChecked]}>
                {agreeToPrivacy && <IconSymbol name="checkmark" size={16} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>
                I agree to the{' '}
                <Text 
                  style={styles.linkText}
                  onPress={(e) => {
                    e.stopPropagation();
                    setShowPrivacyModal(true);
                  }}
                >
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[
              styles.signUpButton, 
              (!agreeToTerms || !agreeToPrivacy) && styles.signUpButtonDisabled
            ]}
            onPress={handleSignUp} 
            disabled={loading || !agreeToTerms || !agreeToPrivacy}
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
    </ScrollView>

      {/* Privacy Policy Modal */}
      <DocumentModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Policy"
      >
        <PrivacyPolicyScreen />
      </DocumentModal>

      {/* Terms of Service Modal */}
      <DocumentModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms of Service"
      >
        <TermsScreen />
      </DocumentModal>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  agreementSection: {
    marginVertical: 24,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  checkbox: {
  width: 24,
  height: 24,
  borderRadius: 6,
  borderWidth: 2,
  borderColor: '#94C3A4', 
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 12,
  marginTop: 1,
  backgroundColor: 'transparent',
},
checkboxChecked: {
  backgroundColor: '#94C3A4', 
  borderColor: '#94C3A4',
},
checkboxLabel: {
  fontSize: 14,
  color: '#333333', 
  flex: 1,
  lineHeight: 20,
},
linkText: {
  fontSize: 14,
  color: '#94C3A4', 
  fontWeight: '600',
  textDecorationLine: 'underline',
},
  signUpButton: {
    backgroundColor: proto.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  signUpButtonDisabled: {
    backgroundColor: '#cccccc',
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
  modalContainer: {
    flex: 1,
    backgroundColor: proto.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: proto.text,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
  },
});