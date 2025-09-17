import { Colors } from '@/constants/Colors';
import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Platform } from 'react-native';
import QuestionCard from '../components/QuestionCard';
import OnboardingButton from '../components/OnboardingButton';
import { OnboardingProfile } from '..';
import { ThemedText } from '@/components/ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const proto = Colors.proto;

interface Step1WelcomeProps {
  onNext: () => void;
  onBack: () => void;
  updateProfile: (data: Partial<OnboardingProfile>) => void;
  profile: Partial<OnboardingProfile>;
}

export default function Step1Welcome({
  onNext,
  onBack,
  updateProfile,
  profile,
}: Step1WelcomeProps) {
  const insets = useSafeAreaInsets();
  const [selectedMotivations, setSelectedMotivations] = useState<string[]>(
    profile.motivation || []
  );

  const handleSelect = (value: string) => {
    const newSelection = selectedMotivations.includes(value)
      ? selectedMotivations.filter(v => v !== value)
      : [...selectedMotivations, value];
    
    setSelectedMotivations(newSelection);
    updateProfile({ motivation: newSelection });
  };

  const options = [
    {
      label: 'I want to save money on groceries',
      value: 'save_money',
    },
    {
      label: "I'm concerned about food waste's environmental impact",
      value: 'environmental_impact',
    },
    {
      label: 'I want to get more organized in the kitchen',
      value: 'organization',
    },
    {
      label: 'I hate throwing away good food',
      value: 'waste_reduction',
    },
    {
      label: 'Other',
      value: 'other',
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
          <View style={styles.welcomeSection}>
            <ThemedText style={styles.welcomeTitle}>Welcome to Mazah!</ThemedText>
            <ThemedText style={styles.welcomeText}>
              Let's get to know you better so we can help you reduce food waste and save money.
            </ThemedText>
          </View>

          <QuestionCard
            title="What brought you to Mazah today?"
            subtitle="Select all that apply"
            options={options}
            selectedValues={selectedMotivations}
            onSelect={handleSelect}
            multiSelect={true}
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
          disabled={selectedMotivations.length === 0}
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
  welcomeSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  welcomeText: {
    fontSize: 18,
    lineHeight: 24,
    color: proto.textSecondary,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    paddingBottom: 0,
    paddingHorizontal: 24,
    backgroundColor: proto.background,
    borderTopWidth: 1,
    borderTopColor: proto.border,
  },
  backButton: {
    flex: 0.4,
  },
}); 