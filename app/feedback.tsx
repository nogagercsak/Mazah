import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// Use the proto color scheme
const proto = Colors.proto;

export default function FeedbackScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Feedback state
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendFeedback = async () => {
    if (!feedbackText.trim()) {
      Alert.alert('Error', 'Please enter your feedback');
      return;
    }

    setIsSubmitting(true);

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

      Alert.alert(
        'Thank You!', 
        'Your feedback has been sent successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Failed to send feedback. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
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
        <Text style={styles.headerTitle}>Send Feedback</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Feedback Type Selection */}
        <Text style={styles.sectionTitle}>What type of feedback is this?</Text>
        <View style={styles.feedbackTypes}>
          <TouchableOpacity
            style={[
              styles.feedbackType,
              feedbackType === 'bug' && styles.feedbackTypeActive
            ]}
            onPress={() => {
              setFeedbackType('bug');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[
              styles.feedbackTypeText,
              feedbackType === 'bug' && styles.feedbackTypeTextActive
            ]}>🐛 Bug Report</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.feedbackType,
              feedbackType === 'feature' && styles.feedbackTypeActive
            ]}
            onPress={() => {
              setFeedbackType('feature');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[
              styles.feedbackTypeText,
              feedbackType === 'feature' && styles.feedbackTypeTextActive
            ]}>💡 Feature Request</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.feedbackType,
              feedbackType === 'general' && styles.feedbackTypeActive
            ]}
            onPress={() => {
              setFeedbackType('general');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[
              styles.feedbackTypeText,
              feedbackType === 'general' && styles.feedbackTypeTextActive
            ]}>💬 General</Text>
          </TouchableOpacity>
        </View>

        {/* Feedback Text Input */}
        <Text style={styles.sectionTitle}>Tell us what you think</Text>
        <TextInput
          style={styles.feedbackInput}
          placeholder="Share your thoughts, report bugs, or suggest new features..."
          multiline
          numberOfLines={8}
          value={feedbackText}
          onChangeText={setFeedbackText}
          placeholderTextColor={proto.textSecondary}
          textAlignVertical="top"
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, (!feedbackText.trim() || isSubmitting) && styles.submitButtonDisabled]}
          onPress={sendFeedback}
          disabled={!feedbackText.trim() || isSubmitting}
        >
          <Text style={[styles.submitButtonText, (!feedbackText.trim() || isSubmitting) && styles.submitButtonTextDisabled]}>
            {isSubmitting ? 'Sending...' : 'Send Feedback'}
          </Text>
        </TouchableOpacity>
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
    fontSize: 18,
    fontWeight: '600',
    color: proto.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 12,
    marginTop: 8,
  },
  feedbackTypes: {
    marginBottom: 24,
  },
  feedbackType: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: proto.card,
    borderWidth: 1,
    borderColor: proto.textSecondary + '20',
  },
  feedbackTypeActive: {
    backgroundColor: proto.accent + '15',
    borderColor: proto.accent,
  },
  feedbackTypeText: {
    fontSize: 16,
    color: proto.text,
    fontWeight: '500',
  },
  feedbackTypeTextActive: {
    color: proto.accent,
    fontWeight: '600',
  },
  feedbackInput: {
    backgroundColor: proto.inputBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: proto.text,
    height: 160,
    borderWidth: 1,
    borderColor: proto.textSecondary + '20',
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: proto.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: proto.textSecondary + '30',
  },
  submitButtonText: {
    color: proto.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: proto.textSecondary,
  },
});