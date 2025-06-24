import { Colors } from '@/constants/Colors';
import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Platform } from 'react-native';
import QuestionCard from '../components/QuestionCard';
import OnboardingButton from '../components/OnboardingButton';
import { OnboardingProfile } from '..';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const proto = Colors.proto;

interface Step4GoalsProps {
  onNext: () => void;
  onBack: () => void;
  updateProfile: (data: Partial<OnboardingProfile>) => void;
  profile: Partial<OnboardingProfile>;
}

export default function Step4Goals({
  onNext,
  onBack,
  updateProfile,
  profile,
}: Step4GoalsProps) {
  const insets = useSafeAreaInsets();
  const [successDefinition, setSuccessDefinition] = useState<string[]>(
    profile.success_definition || []
  );
  const [estimatedWasteCost, setEstimatedWasteCost] = useState<string>(
    profile.estimated_waste_cost || ''
  );

  const handleSuccessSelect = (value: string) => {
    const newSelection = successDefinition.includes(value)
      ? successDefinition.filter(v => v !== value)
      : [...successDefinition, value];
    
    setSuccessDefinition(newSelection);
    updateProfile({ success_definition: newSelection });
  };

  const handleCostSelect = (value: string) => {
    setEstimatedWasteCost(value);
    updateProfile({ estimated_waste_cost: value });
  };

  const successOptions = [
    {
      label: 'Saving money on groceries',
      value: 'save_money',
    },
    {
      label: 'Reducing food waste',
      value: 'reduce_waste',
    },
    {
      label: 'Better meal planning',
      value: 'meal_planning',
    },
    {
      label: 'More organized kitchen',
      value: 'organization',
    },
    {
      label: 'Healthier eating habits',
      value: 'healthy_eating',
    },
  ];

  const costOptions = [
    {
      label: 'Less than $50',
      value: 'under_50',
    },
    {
      label: '$50 - $100',
      value: '50_100',
    },
    {
      label: '$100 - $200',
      value: '100_200',
    },
    {
      label: 'More than $200',
      value: 'over_200',
    },
    {
      label: "I'm not sure",
      value: 'unsure',
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
            title="What would success look like for you?"
            subtitle="Select all that apply"
            options={successOptions}
            selectedValues={successDefinition}
            onSelect={handleSuccessSelect}
            multiSelect={true}
          />

          <QuestionCard
            title="How much do you estimate you spend on food that gets thrown away monthly?"
            options={costOptions}
            selectedValues={estimatedWasteCost ? [estimatedWasteCost] : []}
            onSelect={handleCostSelect}
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
          disabled={successDefinition.length === 0 || !estimatedWasteCost}
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