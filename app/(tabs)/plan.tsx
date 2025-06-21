import React, { useState, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Modal, Pressable, GestureResponderEvent, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, addDays, startOfWeek } from 'date-fns';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Meal, MealPlan, MealIngredient, DayPlan, MealType } from '@/lib/supabase';

const proto = Colors.proto;

interface TooltipProps {
  visible: boolean;
  onClose: () => void;
  message: string;
  position: {
    top: number;
    left: number;
  };
}

interface AddMealModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, type: MealType) => void;
  selectedDate: Date;
}

const Tooltip: React.FC<TooltipProps> = ({ visible, onClose, message, position }) => (
  <Modal
    transparent
    visible={visible}
    onRequestClose={onClose}
    animationType="fade"
  >
    <Pressable style={styles.tooltipOverlay} onPress={onClose}>
      <View style={[styles.tooltipContainer, position]}>
        <View style={styles.tooltipContent}>
          <Text style={styles.tooltipText}>{message}</Text>
        </View>
        <View style={styles.tooltipArrow} />
      </View>
    </Pressable>
  </Modal>
);

const AddMealModal: React.FC<AddMealModalProps> = ({ visible, onClose, onSave, selectedDate }) => {
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');

  const handleSave = () => {
    if (!mealName.trim()) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }
    onSave(mealName, mealType);
    setMealName('');
    setMealType('lunch');
  };

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Meal for {format(selectedDate, 'MMM d')}</Text>
          
          <TextInput
            style={styles.input}
            value={mealName}
            onChangeText={setMealName}
            placeholder="Enter meal name"
            placeholderTextColor="#666"
          />

          <View style={styles.mealTypeContainer}>
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.mealTypeButton,
                  mealType === type && styles.mealTypeButtonActive
                ]}
                onPress={() => setMealType(type)}
              >
                <Text style={[
                  styles.mealTypeText,
                  mealType === type && styles.mealTypeTextActive
                ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function PlanScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weekPlans, setWeekPlans] = useState<DayPlan[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipMessage, setTooltipMessage] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (user) {
      fetchWeekPlans();
    }
  }, [user, weekStart]);

  const fetchWeekPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'));
      
      // First, fetch meal plans for the week
      const { data: mealPlans, error: mealPlansError } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user?.id)
        .in('date', weekDates);

      if (mealPlansError) throw mealPlansError;

      // Then fetch all meals referenced in the meal plans
      const mealIds = mealPlans?.map(mp => mp.meal_id) || [];
      const { data: meals, error: mealsError } = await supabase
        .from('meals')
        .select('*')
        .in('id', mealIds);

      if (mealsError) throw mealsError;

      // Create a map of meal ids to meals for easier lookup
      const mealMap = new Map(meals?.map(meal => [meal.id, meal]));

      // Fetch all meal ingredients
      const { data: mealIngredients, error: ingredientsError } = await supabase
        .from('meal_ingredients')
        .select('*')
        .in('meal_id', mealIds);

      if (ingredientsError) throw ingredientsError;

      // Transform the data into our DayPlan structure
      const plans: DayPlan[] = weekDates.map(date => {
        const dayMealPlans = mealPlans?.filter(mp => mp.date === date) || [];
        
        const meals = {
          breakfast: dayMealPlans
            .filter(mp => mp.meal_type === 'breakfast')
            .map(mp => mealMap.get(mp.meal_id))
            .filter((meal): meal is Meal => meal !== undefined),
          lunch: dayMealPlans
            .filter(mp => mp.meal_type === 'lunch')
            .map(mp => mealMap.get(mp.meal_id))
            .filter((meal): meal is Meal => meal !== undefined),
          dinner: dayMealPlans
            .filter(mp => mp.meal_type === 'dinner')
            .map(mp => mealMap.get(mp.meal_id))
            .filter((meal): meal is Meal => meal !== undefined),
          snack: dayMealPlans
            .filter(mp => mp.meal_type === 'snack')
            .map(mp => mealMap.get(mp.meal_id))
            .filter((meal): meal is Meal => meal !== undefined),
        };

        // Calculate efficiency based on ingredient reuse
        const dayMealIds = dayMealPlans.map(mp => mp.meal_id);
        const dayIngredients = mealIngredients?.filter(mi => dayMealIds.includes(mi.meal_id)) || [];
        const uniqueIngredients = new Set(dayIngredients.map(i => i.name));
        
        const efficiency = {
          reusedIngredients: dayIngredients.length - uniqueIngredients.size,
          totalIngredients: dayIngredients.length,
        };

        return {
          date,
          meals,
          efficiency,
        };
      });

      setWeekPlans(plans);
    } catch (err) {
      console.error('Error fetching meal plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to load meal plans');
    } finally {
      setLoading(false);
    }
  };

  const addMeal = async (name: string, mealType: MealType) => {
    if (!user) return;

    try {
      setLoading(true);

      // First create the meal
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert({
          name,
          user_id: user.id,
        })
        .select()
        .single();

      if (mealError) throw mealError;

      // Then create the meal plan
      const { error: planError } = await supabase
        .from('meal_plans')
        .insert({
          date: format(addDays(weekStart, selectedDayIndex), 'yyyy-MM-dd'),
          meal_id: meal.id,
          user_id: user.id,
          meal_type: mealType,
        });

      if (planError) throw planError;

      // Refresh the week's plans
      await fetchWeekPlans();
      setIsModalVisible(false);
    } catch (err) {
      console.error('Error adding meal:', err);
      Alert.alert('Error', 'Failed to add meal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteMeal = async (mealPlanId: string) => {
    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', mealPlanId);

      if (error) throw error;

      await fetchWeekPlans();
    } catch (err) {
      console.error('Error deleting meal:', err);
      Alert.alert('Error', 'Failed to delete meal. Please try again.');
    }
  };

  const showTooltip = (message: string, event: GestureResponderEvent) => {
    const { pageY, pageX } = event.nativeEvent;
    setTooltipMessage(message);
    setTooltipPosition({
      top: pageY - 70,
      left: pageX - 100,
    });
    setTooltipVisible(true);
  };

  const getEfficiencyMessage = (efficiency: DayPlan['efficiency']): string => {
    const { reusedIngredients, totalIngredients } = efficiency;
    if (totalIngredients === 0) return 'No meals planned for this day';
    
    const isOptimal = reusedIngredients === totalIngredients;
    const isGood = reusedIngredients >= totalIngredients * 0.7;

    if (isOptimal) {
      return `Perfect! All ${totalIngredients} ingredients are used efficiently across meals`;
    } else if (isGood) {
      return `Good! ${reusedIngredients} out of ${totalIngredients} ingredients are used in multiple meals`;
    }
    return `${reusedIngredients} out of ${totalIngredients} ingredients could be used more efficiently`;
  };

  const renderDayCard = (dayPlan: DayPlan, index: number) => {
    const date = new Date(dayPlan.date);
    const totalMeals = Object.values(dayPlan.meals).flat().length;
    const efficiency = dayPlan.efficiency;
    const isOptimal = efficiency.reusedIngredients === efficiency.totalIngredients;
    const isGood = efficiency.reusedIngredients >= efficiency.totalIngredients * 0.7;
    
    return (
      <TouchableOpacity
        key={dayPlan.date}
        style={[styles.dayCard, selectedDayIndex === index && styles.dayCardSelected]}
        onPress={() => setSelectedDayIndex(index)}
      >
        <View style={styles.dayCardHeader}>
          <Text style={[styles.dayText, selectedDayIndex === index && styles.dayTextSelected]}>
            {format(date, 'EEE')}
          </Text>
          {totalMeals > 0 && (
            <TouchableOpacity
              style={[
                styles.efficiencyIndicator,
                isOptimal ? styles.optimalEfficiency : isGood ? styles.goodEfficiency : styles.improvableEfficiency
              ]}
              onPress={(event) => showTooltip(getEfficiencyMessage(efficiency), event)}
            >
              <IconSymbol 
                size={10} 
                name={isOptimal ? "checkmark" as any : "arrow.triangle.2.circlepath" as any} 
                color={proto.buttonText} 
              />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.dateText, selectedDayIndex === index && styles.dateTextSelected]}>
          {format(date, 'd')}
        </Text>
        <View style={styles.mealDots}>
          {Array.from({ length: totalMeals }).map((_, i) => (
            <View 
              key={i} 
              style={[styles.mealDot, selectedDayIndex === index && styles.mealDotSelected]} 
            />
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  const renderMealSection = (title: string, meals: Meal[]) => (
    <View style={styles.mealSection}>
      <Text style={styles.mealSectionTitle}>{title}</Text>
      {meals.length > 0 ? (
        meals.map((meal) => (
          <View key={meal.id} style={styles.mealItem}>
            <View style={styles.mealItemContent}>
              <IconSymbol size={16} name={"fork.knife" as any} color={proto.textSecondary} />
              <Text style={styles.mealText}>{meal.name}</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteMealButton}
              onPress={() => Alert.alert(
                'Delete Meal',
                `Are you sure you want to delete "${meal.name}"?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: () => deleteMeal(meal.id)
                  }
                ]
              )}
            >
              <IconSymbol size={16} name={"trash" as any} color={proto.error} />
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <Text style={styles.noMealsText}>No meals planned</Text>
      )}
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchWeekPlans}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meal Planner</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setIsModalVisible(true)}
        >
          <IconSymbol size={24} name={"plus" as any} color={proto.buttonText} />
        </TouchableOpacity>
      </View>

      {loading && weekPlans.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={proto.accent} />
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.weekContainer}
            contentContainerStyle={styles.weekContentContainer}
          >
            {weekPlans.map(renderDayCard)}
          </ScrollView>

          <ScrollView style={styles.contentContainer}>
            <View style={styles.mealsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Meals for {format(addDays(weekStart, selectedDayIndex), 'MMM d')}
                </Text>
              </View>
              
              {renderMealSection('Breakfast', weekPlans[selectedDayIndex]?.meals.breakfast || [])}
              {renderMealSection('Lunch', weekPlans[selectedDayIndex]?.meals.lunch || [])}
              {renderMealSection('Dinner', weekPlans[selectedDayIndex]?.meals.dinner || [])}
              {renderMealSection('Snacks', weekPlans[selectedDayIndex]?.meals.snack || [])}
            </View>
          </ScrollView>
        </>
      )}

      <AddMealModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={addMeal}
        selectedDate={addDays(weekStart, selectedDayIndex)}
      />

      <Tooltip
        visible={tooltipVisible}
        onClose={() => setTooltipVisible(false)}
        message={tooltipMessage}
        position={tooltipPosition}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: proto.background,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: proto.background,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: proto.accentDark,
    opacity: 0.85,
    letterSpacing: 0.5,
  },
  addButton: {
    backgroundColor: proto.accent,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: proto.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: proto.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: proto.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  weekContainer: {
    paddingHorizontal: 20,
    backgroundColor: proto.background,
    maxHeight: 100,
    marginBottom: 16,
  },
  weekContentContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  dayCard: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: proto.card,
    minWidth: 70,
    minHeight: 70,
    justifyContent: 'center',
    shadowColor: proto.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  dayCardSelected: {
    backgroundColor: proto.accent,
    shadowColor: proto.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  dayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 4,
  },
  dayText: {
    fontSize: 14,
    color: proto.textSecondary,
    fontWeight: '500',
  },
  dayTextSelected: {
    color: proto.buttonText,
  },
  dateText: {
    fontSize: 20,
    color: proto.text,
    fontWeight: '600',
    marginTop: 4,
  },
  dateTextSelected: {
    color: proto.buttonText,
  },
  mealDots: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 2,
  },
  mealDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: proto.textSecondary,
    opacity: 0.5,
  },
  mealDotSelected: {
    backgroundColor: proto.buttonText,
    opacity: 0.8,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mealsSection: {
    backgroundColor: proto.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: proto.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: proto.text,
  },
  mealSection: {
    marginBottom: 16,
  },
  mealSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 8,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: proto.background,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  mealItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealText: {
    fontSize: 16,
    color: proto.text,
    marginLeft: 12,
  },
  deleteMealButton: {
    padding: 8,
  },
  noMealsText: {
    color: proto.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  efficiencyIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optimalEfficiency: {
    backgroundColor: '#4CAF50',
  },
  goodEfficiency: {
    backgroundColor: '#FFA726',
  },
  improvableEfficiency: {
    backgroundColor: '#78909C',
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  tooltipContainer: {
    position: 'absolute',
    width: 200,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  tooltipContent: {
    backgroundColor: proto.text,
    padding: 12,
    borderRadius: 8,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipText: {
    color: proto.buttonText,
    fontSize: 12,
    textAlign: 'center',
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: proto.text,
    alignSelf: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: proto.background,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: proto.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: proto.card,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: proto.text,
    marginBottom: 16,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  mealTypeButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: proto.card,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  mealTypeButtonActive: {
    backgroundColor: proto.accent,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  mealTypeText: {
    fontSize: 14,
    color: proto.textSecondary,
    fontWeight: '500',
  },
  mealTypeTextActive: {
    color: proto.buttonText,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cancelButtonText: {
    color: proto.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: proto.accent,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveButtonText: {
    color: proto.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
});