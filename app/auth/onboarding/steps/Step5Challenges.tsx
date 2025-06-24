import { Colors } from '@/constants/Colors';
import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Platform } from 'react-native';
import QuestionCard from '../components/QuestionCard';
import OnboardingButton from '../components/OnboardingButton';
import { OnboardingProfile } from '..';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const proto = Colors.proto;

interface Step5ChallengesProps {
  onNext: () => void;
  onBack: () => void;
  updateProfile: (data: Partial<OnboardingProfile>) => void;
  profile: Partial<OnboardingProfile>;
}

export default function Step5Challenges({
  onNext,
  onBack,
  updateProfile,
  profile,
}: Step5ChallengesProps) {
  const insets = useSafeAreaInsets();
  const [biggestChallenge, setBiggestChallenge] = useState<string>(
    profile.biggest_challenge || ''
  );
  const [wasteFeelings, setWasteFeelings] = useState<string>(
    profile.waste_feelings || ''
  );

  const handleChallengeSelect = (value: string) => {
    setBiggestChallenge(value);
    updateProfile({ biggest_challenge: value });
  };

  const handleFeelingsSelect = (value: string) => {
    setWasteFeelings(value);
    updateProfile({ waste_feelings: value });
  };

  const challengeOptions = [
    {
      label: 'Food goes bad before I can use it',
      value: 'spoilage',
    },
    {
      label: 'Buying too much food',
      value: 'overbuying',
    },
    {
      label: 'Lack of meal planning',
      value: 'no_planning',
    },
    {
      label: 'Unpredictable schedule',
      value: 'schedule',
    },
    {
      label: 'Picky eaters at home',
      value: 'picky_eaters',
    },
  ];

  const feelingOptions = [
    {
      label: 'Guilty about wasting money',
      value: 'money_guilt',
    },
    {
      label: 'Bad about environmental impact',
      value: 'environmental_guilt',
    },
    {
      label: 'Frustrated with myself',
      value: 'frustration',
    },
    {
      label: 'Overwhelmed by planning',
      value: 'overwhelmed',
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
            title="What's your biggest kitchen challenge?"
            options={challengeOptions}
            selectedValues={biggestChallenge ? [biggestChallenge] : []}
            onSelect={handleChallengeSelect}
          />

          <QuestionCard
            title="How do you feel when you throw away food?"
            options={feelingOptions}
            selectedValues={wasteFeelings ? [wasteFeelings] : []}
            onSelect={handleFeelingsSelect}
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
          disabled={!biggestChallenge || !wasteFeelings}
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