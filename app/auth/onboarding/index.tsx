import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Step1Welcome from './steps/Step1Welcome';
import Step2Household from './steps/Step2Household';
import Step3Habits from './steps/Step3Habits';
import Step4Goals from './steps/Step4Goals';
import Step5Challenges from './steps/Step5Challenges';
import Step6Preferences from './steps/Step6Preferences';
import Step7Notifications from './steps/Step7Notifications';
import ProgressBar from './components/ProgressBar';

const proto = Colors.proto;

export interface OnboardingProfile {
  user_id: string;
  motivation: string[];
  household_size: string;
  shopping_frequency: string;
  meal_planning_style: string[];
  waste_awareness: string;
  success_definition: string[];
  estimated_waste_cost: string;
  biggest_challenge: string;
  waste_feelings: string;
  preferred_cuisines: string[];
  dietary_restrictions: string[];
  notification_preferences: string[];
  notifications_enabled: boolean;
  expiration_notifications_enabled: boolean;
  completed_at: string;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;
  const [isCompleting, setIsCompleting] = useState(false);
  
  const [profile, setProfile] = useState<Partial<OnboardingProfile>>({});

  const updateProfile = (data: Partial<OnboardingProfile>) => {
    setProfile(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
  try {
    setIsCompleting(true); // Set loading state
    if (__DEV__) console.log('🚀 ONBOARDING SUBMIT: Starting submission...');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    if (__DEV__) console.log('🚀 ONBOARDING SUBMIT: User found:', user.id, user.email);
    if (__DEV__) console.log('🚀 ONBOARDING SUBMIT: Profile data to save:', profile);

    const finalProfile = {
      ...profile,
      user_id: user.id,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(), // Add this field
    };

    if (__DEV__) console.log('🚀 ONBOARDING SUBMIT: Final profile object:', finalProfile);

    // First, try to check if profile already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (__DEV__) console.log('🚀 ONBOARDING SUBMIT: Existing profile check:', existingProfile);

    let result;
    if (existingProfile) {
      // Profile exists, update it
      if (__DEV__) console.log('🚀 ONBOARDING SUBMIT: Profile exists, updating...');
      result = await supabase
        .from('user_profiles')
        .update(finalProfile)
        .eq('user_id', user.id)
        .select();
    } else {
      // Profile doesn't exist, insert it
      if (__DEV__) console.log('🚀 ONBOARDING SUBMIT: Profile does not exist, inserting...');
      result = await supabase
        .from('user_profiles')
        .insert(finalProfile)
        .select();
    }

    if (result.error) {
      if (__DEV__) console.error('🚀 ONBOARDING SUBMIT: Supabase error details:', result.error);
      throw result.error;
    }

    if (__DEV__) console.log('🚀 ONBOARDING SUBMIT: Profile saved successfully:', result.data);

    // Add a small delay to ensure the database update is processed
    if (__DEV__) console.log('🚀 ONBOARDING SUBMIT: Waiting for database update...');
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Force refresh the page/app state by triggering a hard navigation
    if (__DEV__) console.log('🚀 ONBOARDING SUBMIT: Forcing app state refresh...');
    
    // Navigate to main app and let the auth context handle the rest
    router.replace('/(tabs)');
    
  } catch (error: any) {
    if (__DEV__) console.error('🚀 ONBOARDING SUBMIT: Error saving profile:', error);
    
    // Show user-friendly error message
    alert(`Failed to save your profile: ${error.message || 'Unknown error'}. Please try again.`);
    setIsCompleting(false); // Reset loading state on error
  }
};


  const renderStep = () => {
    const commonProps = {
      onNext: handleNext,
      onBack: handleBack,
      updateProfile,
      profile,
      isCompleting,
    };

    switch (currentStep) {
      case 1:
        return <Step1Welcome {...commonProps} />;
      case 2:
        return <Step2Household {...commonProps} />;
      case 3:
        return <Step3Habits {...commonProps} />;
      case 4:
        return <Step4Goals {...commonProps} />;
      case 5:
        return <Step5Challenges {...commonProps} />;
      case 6:
        return <Step6Preferences {...commonProps} />;
      case 7:
        return <Step7Notifications {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {isCompleting ? (
        <View style={styles.completingContainer}>
          <ActivityIndicator size="large" color={proto.accent} />
          <Text style={styles.completingTitle}>Setting up your profile...</Text>
          <Text style={styles.completingSubtitle}>This will just take a moment</Text>
        </View>
      ) : (
        <>
          <ProgressBar current={currentStep} total={totalSteps} />
          <View style={styles.content}>
            {renderStep()}
          </View>
        </>
      )}
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
  completingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  completingTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: proto.text,
    marginTop: 24,
    textAlign: 'center',
  },
  completingSubtitle: {
    fontSize: 16,
    color: proto.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
}); 