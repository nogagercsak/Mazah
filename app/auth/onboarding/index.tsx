import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Step1Welcome from './steps/Step1Welcome';
import Step2Household from './steps/Step2Household';
import Step3Habits from './steps/Step3Habits';
import Step4Goals from './steps/Step4Goals';
import Step5Challenges from './steps/Step5Challenges';
import Step6Preferences from './steps/Step6Preferences';
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
  completed_at: string;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const finalProfile: OnboardingProfile = {
        ...profile as OnboardingProfile,
        user_id: user.id,
        completed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert([finalProfile]);

      if (error) throw error;

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving profile:', error);
      // Handle error appropriately
    }
  };

  const renderStep = () => {
    const commonProps = {
      onNext: handleNext,
      onBack: handleBack,
      updateProfile,
      profile,
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
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProgressBar current={currentStep} total={totalSteps} />
      <View style={styles.content}>
        {renderStep()}
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
}); 