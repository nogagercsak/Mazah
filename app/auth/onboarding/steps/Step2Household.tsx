import { Colors } from '@/constants/Colors';
import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Platform } from 'react-native';
import QuestionCard from '../components/QuestionCard';
import OnboardingButton from '../components/OnboardingButton';
import { OnboardingProfile } from '..';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const proto = Colors.proto;

interface Step2HouseholdProps {
  onNext: () => void;
  onBack: () => void;
  updateProfile: (data: Partial<OnboardingProfile>) => void;
  profile: Partial<OnboardingProfile>;
  isSubmitting?: boolean;
}

export default function Step2Household({
  onNext,
  onBack,
  updateProfile,
  profile,
  isSubmitting = false,
}: Step2HouseholdProps) {
  const insets = useSafeAreaInsets();
  const [householdSize, setHouseholdSize] = useState<string>(
    profile.household_size || ''
  );
  const [shoppingFrequency, setShoppingFrequency] = useState<string>(
    profile.shopping_frequency || ''
  );

  const handleHouseholdSelect = (value: string) => {
    setHouseholdSize(value);
    updateProfile({ household_size: value });
  };

  const handleFrequencySelect = (value: string) => {
    setShoppingFrequency(value);
    updateProfile({ shopping_frequency: value });
  };

  const householdOptions = [
    {
      label: 'Just me',
      value: 'single',
    },
    {
      label: 'Me and my partner',
      value: 'couple',
    },
    {
      label: 'Small family (3-4)',
      value: 'small_family',
    },
    {
      label: 'Large family (5+)',
      value: 'large_family',
    },
  ];

  const shoppingOptions = [
    {
      label: 'Multiple times per week',
      value: 'multiple_weekly',
    },
    {
      label: 'Once a week',
      value: 'weekly',
    },
    {
      label: 'Every two weeks',
      value: 'biweekly',
    },
    {
      label: 'Once a month',
      value: 'monthly',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <ScrollView 
          style={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
        >
          <QuestionCard
            title="Who are you cooking for?"
            options={householdOptions}
            selectedValues={householdSize ? [householdSize] : []}
            onSelect={handleHouseholdSelect}
          />

          <QuestionCard
            title="How often do you grocery shop?"
            options={shoppingOptions}
            selectedValues={shoppingFrequency ? [shoppingFrequency] : []}
            onSelect={handleFrequencySelect}
          />
        </ScrollView>
      </View>

      <View style={[
        styles.buttonContainer,
        { paddingBottom: Math.max(insets.bottom + 16, 24) }
      ]}>
        <OnboardingButton
          title="Back"
          variant="secondary"
          onPress={onBack}
          style={styles.backButton}
        />
        <OnboardingButton
          title="Continue"
          onPress={onNext}
          disabled={!householdSize || !shoppingFrequency}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: proto.background,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    paddingHorizontal: 24,
    backgroundColor: proto.background,
    borderTopWidth: 1,
    borderTopColor: proto.border,
  },
  backButton: {
    flex: 0.4,
  },
}); 