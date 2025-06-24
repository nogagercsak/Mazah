import { Colors } from '@/constants/Colors';
import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Platform } from 'react-native';
import QuestionCard from '../components/QuestionCard';
import OnboardingButton from '../components/OnboardingButton';
import { OnboardingProfile } from '..';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const proto = Colors.proto;

interface Step3HabitsProps {
  onNext: () => void;
  onBack: () => void;
  updateProfile: (data: Partial<OnboardingProfile>) => void;
  profile: Partial<OnboardingProfile>;
}

export default function Step3Habits({
  onNext,
  onBack,
  updateProfile,
  profile,
}: Step3HabitsProps) {
  const insets = useSafeAreaInsets();
  const [planningStyle, setPlanningStyle] = useState<string[]>(
    profile.meal_planning_style || []
  );
  const [wasteAwareness, setWasteAwareness] = useState<string>(
    profile.waste_awareness || ''
  );

  const handlePlanningSelect = (value: string) => {
    const newSelection = planningStyle.includes(value)
      ? planningStyle.filter(v => v !== value)
      : [...planningStyle, value];
    
    setPlanningStyle(newSelection);
    updateProfile({ meal_planning_style: newSelection });
  };

  const handleAwarenessSelect = (value: string) => {
    setWasteAwareness(value);
    updateProfile({ waste_awareness: value });
  };

  const planningOptions = [
    {
      label: 'I plan meals for the week',
      value: 'weekly_planning',
    },
    {
      label: 'I decide day by day',
      value: 'daily_planning',
    },
    {
      label: 'I cook what I feel like',
      value: 'spontaneous',
    },
    {
      label: 'I often order takeout',
      value: 'takeout',
    },
  ];

  const awarenessOptions = [
    {
      label: 'Very aware - I track everything',
      value: 'very_aware',
    },
    {
      label: 'Somewhat aware - I notice when things go bad',
      value: 'somewhat_aware',
    },
    {
      label: 'Not very aware - I often find spoiled food',
      value: 'not_aware',
    },
    {
      label: "I don't think about it",
      value: 'unaware',
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
            title="How do you usually plan meals?"
            subtitle="Select all that apply"
            options={planningOptions}
            selectedValues={planningStyle}
            onSelect={handlePlanningSelect}
            multiSelect={true}
          />

          <QuestionCard
            title="When do you typically realize food is going bad?"
            options={awarenessOptions}
            selectedValues={wasteAwareness ? [wasteAwareness] : []}
            onSelect={handleAwarenessSelect}
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
          disabled={planningStyle.length === 0 || !wasteAwareness}
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