import { Colors } from '@/constants/Colors';
import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Platform } from 'react-native';
import QuestionCard from '../components/QuestionCard';
import OnboardingButton from '../components/OnboardingButton';
import { OnboardingProfile } from '..';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const proto = Colors.proto;

interface Step6PreferencesProps {
  onNext: () => void;
  onBack: () => void;
  updateProfile: (data: Partial<OnboardingProfile>) => void;
  profile: Partial<OnboardingProfile>;
}

export default function Step6Preferences({
  onNext,
  onBack,
  updateProfile,
  profile,
}: Step6PreferencesProps) {
  const insets = useSafeAreaInsets();
  const [preferredCuisines, setPreferredCuisines] = useState<string[]>(
    profile.preferred_cuisines || []
  );
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(
    profile.dietary_restrictions || []
  );


  const handleCuisineSelect = (value: string) => {
    const newSelection = preferredCuisines.includes(value)
      ? preferredCuisines.filter(v => v !== value)
      : [...preferredCuisines, value];
    
    setPreferredCuisines(newSelection);
    updateProfile({ preferred_cuisines: newSelection });
  };

  const handleDietarySelect = (value: string) => {
    const newSelection = dietaryRestrictions.includes(value)
      ? dietaryRestrictions.filter(v => v !== value)
      : [...dietaryRestrictions, value];
    
    setDietaryRestrictions(newSelection);
    updateProfile({ dietary_restrictions: newSelection });
  };



  const cuisineOptions = [
    {
      label: 'American',
      value: 'american',
    },
    {
      label: 'Italian',
      value: 'italian',
    },
    {
      label: 'Mexican',
      value: 'mexican',
    },
    {
      label: 'Asian',
      value: 'asian',
    },
    {
      label: 'Mediterranean',
      value: 'mediterranean',
    },
    {
      label: 'Indian',
      value: 'indian',
    },
  ];

  const dietaryOptions = [
    {
      label: 'Vegetarian',
      value: 'vegetarian',
    },
    {
      label: 'Vegan',
      value: 'vegan',
    },
    {
      label: 'Gluten-free',
      value: 'gluten_free',
    },
    {
      label: 'Dairy-free',
      value: 'dairy_free',
    },
    {
      label: 'No restrictions',
      value: 'none',
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
            title="What types of cuisine do you enjoy?"
            subtitle="Select all that apply"
            options={cuisineOptions}
            selectedValues={preferredCuisines}
            onSelect={handleCuisineSelect}
            multiSelect={true}
          />

          <QuestionCard
            title="Any dietary considerations?"
            subtitle="Select all that apply"
            options={dietaryOptions}
            selectedValues={dietaryRestrictions}
            onSelect={handleDietarySelect}
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
          title="Next"
          onPress={onNext}
          disabled={
            preferredCuisines.length === 0 ||
            dietaryRestrictions.length === 0
          }
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