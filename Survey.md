# Mazah Onboarding Survey Feature - Development Brief

## Overview
Create a personalized onboarding survey for Mazah (food waste reduction app) that feels conversational and insightful rather than like a typical form. The survey should gather key user data to enable personalized AI-driven experiences while maintaining an emotional connection to the app's mission.

## Technical Requirements

### Stack Integration
- **Framework**: React Native with Expo Router
- **Database**: Supabase for user profile storage
- **Navigation**: Multi-step wizard with progress indication
- **Styling**: Consistent with existing app theme (Colors.proto)
- **State Management**: Local state with final submission to Supabase

### Component Structure
```
/auth/onboarding/
├── index.tsx (main survey container)
├── steps/
│   ├── Step1Welcome.tsx
│   ├── Step2Household.tsx
│   ├── Step3Goals.tsx
│   ├── Step4Habits.tsx
│   ├── Step5Challenges.tsx
│   └── Step6Preferences.tsx
└── components/
    ├── ProgressBar.tsx
    ├── QuestionCard.tsx
    └── AnswerButton.tsx
```

## Survey Flow & Questions

### Step 1: Welcome & Motivation
**Tone**: Warm, mission-focused
**Questions**:
- "What brought you to Mazah today?" (Multiple choice with custom option)
  - [ ] I want to save money on groceries
  - [ ] I'm concerned about food waste's environmental impact
  - [ ] I want to get more organized in the kitchen
  - [ ] I hate throwing away good food
  - [ ] Other: ___________

### Step 2: Household Context
**Tone**: Practical, helpful
**Questions**:
- "Who are you cooking for?" (Single select)
  - [ ] Just me
  - [ ] Me and my partner
  - [ ] Small family (2-3 people)
  - [ ] Large family (4+ people)
  - [ ] Roommates/shared kitchen

- "How often do you grocery shop?" (Single select)
  - [ ] Multiple times per week
  - [ ] Once a week
  - [ ] Every 2 weeks
  - [ ] Monthly or less

### Step 3: Current Habits
**Tone**: Non-judgmental, curious
**Questions**:
- "How do you usually plan meals?" (Multiple select)
  - [ ] I plan a full week ahead
  - [ ] I decide day-of based on what I have
  - [ ] I follow a loose routine
  - [ ] I mostly order takeout/delivery
  - [ ] I rarely plan - just wing it

- "When do you typically realize food is going bad?" (Single select)
  - [ ] I check expiration dates regularly
  - [ ] When I smell something off
  - [ ] When I'm looking for something to cook
  - [ ] When I'm cleaning the fridge
  - [ ] Unfortunately, often too late

### Step 4: Goals & Motivations
**Tone**: Aspirational, supportive
**Questions**:
- "What would success look like for you?" (Multiple select)
  - [ ] Throwing away significantly less food
  - [ ] Saving money on groceries
  - [ ] Feeling more organized and in control
  - [ ] Reducing my environmental impact
  - [ ] Discovering new recipes and flavors
  - [ ] Eating healthier, more planned meals

- "How much do you estimate you spend on food that gets thrown away monthly?" (Single select)
  - [ ] Less than $20
  - [ ] $20-50
  - [ ] $50-100
  - [ ] $100-200
  - [ ] More than $200
  - [ ] I honestly have no idea

### Step 5: Challenges & Pain Points
**Tone**: Empathetic, problem-solving
**Questions**:
- "What's your biggest kitchen challenge?" (Single select)
  - [ ] Forgetting what I have and buying duplicates
  - [ ] Not knowing what to cook with random ingredients
  - [ ] Buying too much fresh produce that goes bad
  - [ ] Leftovers that never get eaten
  - [ ] Lack of time for meal planning
  - [ ] Family members with different preferences

- "How do you feel when you throw away food?" (Single select)
  - [ ] Guilty about the waste
  - [ ] Frustrated about the money lost
  - [ ] Worried about environmental impact
  - [ ] Annoyed at myself for poor planning
  - [ ] It doesn't really bother me
  - [ ] It's just part of life

### Step 6: Preferences & Personalization
**Tone**: Excited, customizing
**Questions**:
- "What types of cuisine do you enjoy?" (Multiple select with visual icons)
  - [ ] American comfort food
  - [ ] Italian
  - [ ] Mexican/Latin
  - [ ] Asian (Chinese, Thai, Japanese, etc.)
  - [ ] Mediterranean
  - [ ] Indian
  - [ ] Fresh/Light (salads, smoothies)
  - [ ] I'm adventurous - suggest anything!

- "Any dietary considerations?" (Multiple select)
  - [ ] Vegetarian
  - [ ] Vegan
  - [ ] Gluten-free
  - [ ] Low-carb/Keto
  - [ ] Dairy-free
  - [ ] No restrictions
  - [ ] Other: ___________

- "How would you like Mazah to communicate with you?" (Multiple select)
  - [ ] Gentle daily reminders
  - [ ] Weekly meal planning prompts
  - [ ] Urgent alerts for expiring food
  - [ ] Celebration messages for goals met
  - [ ] Tips and educational content
  - [ ] Keep notifications minimal

## UX/UI Requirements

### Design Principles
- **Conversational**: Questions feel like a helpful friend asking, not a form
- **Visual**: Use icons, illustrations, and progress indicators
- **Forgiving**: Easy to go back and change answers
- **Encouraging**: Positive reinforcement throughout

### Visual Elements
- Progress bar showing X of 6 steps completed
- Consistent card-based layout for questions
- Large, tappable answer buttons with icons where appropriate
- Smooth transitions between steps
- Success animations for completing sections

### Interactions
- Swipe or button navigation between steps
- Haptic feedback on selections
- Auto-advance after selection (with brief pause for confirmation)
- "Skip" option for sensitive questions
- Final review step before submission

## Data Storage Schema

```typescript
interface OnboardingProfile {
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
  completed_at: timestamp;
}
```

## Success Metrics
- Survey completion rate (target: >85%)
- Time to completion (target: <3 minutes)
- User engagement in first week post-onboarding
- Personalization accuracy based on survey data

## Technical Considerations
- Offline capability - save progress locally, sync when connected
- Analytics tracking for drop-off points
- A/B testing capability for question variations
- Accessibility compliance (screen readers, font scaling)
- Smooth animations without performance impact

## Post-Survey Experience
- Personalized welcome message summarizing their goals
- Immediate value - show first meal suggestions based on their preferences
- Gentle introduction to core features based on their biggest challenges
- Set up their first week's meal plan as a starting point

## Notes for AI Personalization
The survey data should inform:
- Recipe recommendation algorithms
- Notification timing and tone
- Goal tracking and celebration moments
- Educational content prioritization
- Shopping list suggestions
- Waste prediction models

Focus on making this feel like Mazah is learning about them as a person, not just collecting data points.