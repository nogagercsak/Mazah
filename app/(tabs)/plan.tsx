import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  GestureResponderEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDays, format, startOfWeek } from 'date-fns';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { DayPlan, Meal, MealType } from '@/lib/supabase';
import AddMealModal from '@/components/plan/AddMealModal';

const proto = Colors.proto;

interface TooltipProps {
  visible: boolean;
  onClose: () => void;
  message: string;
  position: { top: number; left: number };
}

const Tooltip: React.FC<TooltipProps> = ({ visible, onClose, message, position }) => (
  <Modal transparent visible={visible} onRequestClose={onClose} animationType="fade">
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
  const [isImpactCollapsed, setIsImpactCollapsed] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const impactAnimatedHeight = useRef(new Animated.Value(0)).current;
  const selectedDate = addDays(weekStart, selectedDayIndex);

  const toggleImpactCollapse = () => {
    Animated.timing(impactAnimatedHeight, {
      toValue: isImpactCollapsed ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsImpactCollapsed(!isImpactCollapsed);
  };

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

      // Fetch all meal ingredients with their ingredient data
      const { data: mealIngredients, error: ingredientsError } = await supabase
        .from('meal_ingredients')
        .select(`
          *,
          ingredient:ingredients (*)
        `)
        .in('meal_id', mealIds);

      if (ingredientsError) throw ingredientsError;

      // Transform the data into our DayPlan structure
      const plans: DayPlan[] = weekDates.map(date => {
        const dayMealPlans = mealPlans?.filter(mp => mp.date === date) || [];
        
        const meals = {
          breakfast: dayMealPlans
            .filter(mp => mp.meal_type === 'breakfast')
            .map(mp => ({ ...mealMap.get(mp.meal_id), mealPlanId: mp.id }))
            .filter((meal): meal is (Meal & { mealPlanId: string }) => meal !== undefined),
          lunch: dayMealPlans
            .filter(mp => mp.meal_type === 'lunch')
            .map(mp => ({ ...mealMap.get(mp.meal_id), mealPlanId: mp.id }))
            .filter((meal): meal is (Meal & { mealPlanId: string }) => meal !== undefined),
          dinner: dayMealPlans
            .filter(mp => mp.meal_type === 'dinner')
            .map(mp => ({ ...mealMap.get(mp.meal_id), mealPlanId: mp.id }))
            .filter((meal): meal is (Meal & { mealPlanId: string }) => meal !== undefined),
          snack: dayMealPlans
            .filter(mp => mp.meal_type === 'snack')
            .map(mp => ({ ...mealMap.get(mp.meal_id), mealPlanId: mp.id }))
            .filter((meal): meal is (Meal & { mealPlanId: string }) => meal !== undefined),
        };

        // Calculate efficiency based on ingredient reuse
        const dayMealIds = dayMealPlans.map(mp => mp.meal_id);
        const dayIngredients = mealIngredients?.filter(mi => dayMealIds.includes(mi.meal_id)) || [];
        
        // Calculate environmental impact
        let total_co2 = 0;
        let total_water = 0;
        const ingredientUsage = new Map<string, { 
          count: number, 
          co2: number, 
          water: number,
          name: string
        }>();

        dayIngredients.forEach(mi => {
          if (!mi.ingredient) return;
          
          // Convert quantity to kg using the ingredient's conversion factor
          const quantityInKg = mi.quantity * mi.ingredient.conversion_to_kg;
          
          // Calculate environmental impact
          const co2Impact = quantityInKg * mi.ingredient.co2_per_kg;
          const waterImpact = quantityInKg * mi.ingredient.water_per_kg;
          
          total_co2 += co2Impact;
          total_water += waterImpact;

          const existing = ingredientUsage.get(mi.ingredient_id);
          if (existing) {
            existing.count++;
            existing.co2 += co2Impact;
            existing.water += waterImpact;
          } else {
            ingredientUsage.set(mi.ingredient_id, {
              count: 1,
              co2: co2Impact,
              water: waterImpact,
              name: mi.ingredient.name
            });
          }
        });

        // Calculate savings from ingredient reuse
        let co2_saved = 0;
        let water_saved = 0;
        ingredientUsage.forEach(usage => {
          if (usage.count > 1) {
            // We save the impact for each reuse
            co2_saved += (usage.co2 / usage.count) * (usage.count - 1);
            water_saved += (usage.water / usage.count) * (usage.count - 1);
          }
        });

        // Find ingredients used only once for suggestions
        const suggestedPairings = Array.from(ingredientUsage.values())
          .filter(usage => usage.count === 1)
          .sort((a, b) => (b.co2 + b.water) - (a.co2 + a.water)) // Sort by environmental impact
          .map(usage => usage.name)
          .slice(0, 3);

        const uniqueIngredients = new Set(dayIngredients.map(mi => mi.ingredient_id));
        const reusedIngredients = dayIngredients.length - uniqueIngredients.size;
        const totalIngredients = dayIngredients.length;
        const reusedPercentage = totalIngredients > 0 ? (reusedIngredients / totalIngredients) * 100 : 0;
        
        // Estimate potential savings (assuming average ingredient cost of $3)
        const potentialSavings = (uniqueIngredients.size - reusedIngredients) * 3;

        const efficiency = {
          reusedIngredients,
          totalIngredients,
          wasteReduction: {
            reusedPercentage,
            potentialSavings,
            suggestedPairings,
            environmentalImpact: {
              co2_saved,
              water_saved,
              total_co2,
              total_water
            }
          }
        };

        return {
          date,
          meals,
          efficiency,
        };
      });

      setWeekPlans(plans);
    } catch (err) {
      if (__DEV__) console.error('Error fetching meal plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to load meal plans');
    } finally {
      setLoading(false);
    }
  };

  const addMeal = async (
    name: string,
    mealType: MealType,
    ingredients: Array<{id: string, quantity: number, unit: string, foodItemId?: string}>
  ) => {
    if (!user) {
      Alert.alert('Authentication Error', 'You must be logged in to add meals. Please log in and try again.');
      return;
    }

    try {
      // Validate inputs
      if (!name.trim()) {
        Alert.alert('Missing Information', 'Please enter a meal name');
        return;
      }

      if (ingredients.length === 0) {
        Alert.alert('Missing Information', 'Please add at least one ingredient to your meal');
        return;
      }

      // Validate all ingredients have valid quantities
      const invalidIngredient = ingredients.find(ing => ing.quantity <= 0 || isNaN(ing.quantity));
      if (invalidIngredient) {
        Alert.alert('Invalid Quantity', 'Please enter valid quantities for all ingredients (must be greater than 0)');
        return;
      }

      // Create the meal
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert({
          name: name.trim(),
          user_id: user.id,
        })
        .select()
        .single();

      if (mealError) {
        if (__DEV__) console.error('Error creating meal:', mealError);
        throw new Error(`Failed to create meal: ${mealError.message}`);
      }

      // Create the meal plan
      const { error: planError } = await supabase
        .from('meal_plans')
        .insert({
          date: selectedDate.toISOString().split('T')[0],
          meal_id: meal.id,
          user_id: user.id,
          meal_type: mealType,
        });

      if (planError) {
        if (__DEV__) console.error('Error creating meal plan:', planError);
        throw new Error(`Failed to create meal plan: ${planError.message}`);
      }

      // Add ingredients
      for (const ingredient of ingredients) {
        const { error: ingredientError } = await supabase
          .from('meal_ingredients')
          .insert({
            meal_id: meal.id,
            ingredient_id: ingredient.id,
            food_item_id: ingredient.foodItemId || null,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
          });

        if (ingredientError) {
          if (__DEV__) console.error('Error adding meal ingredient:', ingredientError);
          throw new Error(`Failed to add ingredient with ID: ${ingredient.id}`);
        }

        // Update inventory if a food item was selected
        if (ingredient.foodItemId) {
          const { data: foodItem, error: foodItemError } = await supabase
            .from('food_items')
            .select('remaining_quantity')
            .eq('id', ingredient.foodItemId)
            .single();

          if (foodItemError) {
            if (__DEV__) console.error('Error fetching food item:', foodItemError);
            // Don't throw here - ingredient was added successfully
            continue;
          }

          const newQuantity = Math.max(0, foodItem.remaining_quantity - ingredient.quantity);
          
          const { error: updateError } = await supabase
            .from('food_items')
            .update({ remaining_quantity: newQuantity })
            .eq('id', ingredient.foodItemId);

          if (updateError) {
            if (__DEV__) console.error('Error updating food item quantity:', updateError);
            // Don't throw here - meal was created successfully
          }
        }
      }

      // Close modal and refresh data
      setIsModalVisible(false);
      await fetchWeekPlans();
      Alert.alert('Success', 'Meal added successfully!');
      
    } catch (err) {
      if (__DEV__) console.error('Error adding meal:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add meal due to an unexpected error';
      Alert.alert(
        'Error Adding Meal', 
        errorMessage,
        [
          { text: 'Try Again', style: 'default' },
          { text: 'Close', style: 'cancel' }
        ]
      );
      throw err; // Re-throw to handle in modal
    }
  };

  const deleteMeal = async (mealPlanId: string) => {
    try {
      setDeleting(mealPlanId);
      
      // First get the meal_id from the meal_plan
      const { data: mealPlan, error: fetchError } = await supabase
        .from('meal_plans')
        .select('meal_id')
        .eq('id', mealPlanId)
        .single();

      if (fetchError) throw fetchError;

      // Delete meal ingredients first (foreign key constraint)
      const { error: ingredientsError } = await supabase
        .from('meal_ingredients')
        .delete()
        .eq('meal_id', mealPlan.meal_id);

      if (ingredientsError) throw ingredientsError;

      // Delete the meal plan
      const { error: mealPlanError } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', mealPlanId);

      if (mealPlanError) throw mealPlanError;

      // Finally delete the meal itself
      const { error: mealError } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealPlan.meal_id);

      if (mealError) throw mealError;

      await fetchWeekPlans();
    } catch (err) {
      if (__DEV__) console.error('Error deleting meal:', err);
      Alert.alert('Error', 'Failed to delete meal. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const showTooltip = (message: string, event: GestureResponderEvent) => {
    const { pageY, pageX } = event.nativeEvent;
    setTooltipMessage(message);
    setTooltipPosition({ top: pageY - 70, left: pageX - 100 });
    setTooltipVisible(true);
  };

  const getEfficiencyMessage = (efficiency: DayPlan['efficiency']): string => {
    const { reusedIngredients, totalIngredients, wasteReduction } = efficiency;
    if (totalIngredients === 0) return 'No meals planned for this day';
    const { reusedPercentage, potentialSavings, suggestedPairings } = wasteReduction;
    if (reusedPercentage === 100) {
      return `Perfect! All ingredients are used efficiently across meals. You're saving money and reducing waste! 🌱`;
    } else if (reusedPercentage >= 70) {
      return `Good! ${reusedIngredients} ingredients reused (${reusedPercentage.toFixed(0)}%). Consider pairing meals with: ${suggestedPairings.join(', ')}`;
    }
    return `Potential for ${potentialSavings.toFixed(2)} savings! Try using these ingredients in multiple meals: ${suggestedPairings.join(', ')}`;
  };

  const renderDayCard = (dayPlan: DayPlan, index: number) => {
    const date = new Date(dayPlan.date);
    const totalMeals = Object.values(dayPlan.meals).flat().length;
    const efficiency = dayPlan.efficiency;
    const { reusedPercentage } = efficiency.wasteReduction;
    const isOptimal = reusedPercentage === 100;
    const isGood = reusedPercentage >= 70;

    return (
      <TouchableOpacity key={dayPlan.date} style={[styles.dayCard, selectedDayIndex === index && styles.dayCardSelected]} onPress={() => setSelectedDayIndex(index)}>
        <View style={styles.dayCardHeader}>
          <Text style={[styles.dayText, selectedDayIndex === index && styles.dayTextSelected]}>{format(date, 'EEE')}</Text>
          {totalMeals > 0 && (
            <TouchableOpacity
              style={[styles.efficiencyIndicator, isOptimal ? styles.optimalEfficiency : isGood ? styles.goodEfficiency : styles.improvableEfficiency]}
              onPress={event => showTooltip(getEfficiencyMessage(efficiency), event)}
            >
              <IconSymbol size={10} name={(isOptimal ? 'leaf.fill' : 'wand.and.stars') as any} color={proto.buttonText} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.dateText, selectedDayIndex === index && styles.dateTextSelected]}>{format(date, 'd')}</Text>
        <View style={styles.mealDots}>
          {Array.from({ length: totalMeals }).map((_, i) => (
            <View key={i} style={[styles.mealDot, selectedDayIndex === index && styles.mealDotSelected]} />
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  const renderMealSection = (title: string, meals: (Meal & { mealPlanId: string })[]) => (
    <View style={styles.mealSection}>
      <Text style={styles.mealSectionTitle}>{title}</Text>
      {meals.length > 0 ? (
        meals.map(meal => (
          <View key={meal.id} style={styles.mealItem}>
            <View style={styles.mealItemContent}>
              <IconSymbol size={16} name={'fork.knife' as any} color={proto.textSecondary} />
              <Text style={styles.mealText}>{meal.name}</Text>
            </View>
            <TouchableOpacity
              style={[styles.deleteMealButton, deleting === meal.mealPlanId && styles.deletingButton]}
              onPress={() =>
                Alert.alert('Delete Meal', `Are you sure you want to delete "${meal.name}"?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteMeal(meal.mealPlanId) },
                ])
              }
              disabled={deleting === meal.mealPlanId}
            >
              {deleting === meal.mealPlanId ? (
                <ActivityIndicator size="small" color={proto.error} />
              ) : (
                <IconSymbol size={16} name={'trash' as any} color={proto.error} />
              )}
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <Text style={styles.noMealsText}>No meals planned</Text>
      )}
    </View>
  );

  const renderWasteReductionSection = (efficiency: DayPlan['efficiency']) => {
    const { wasteReduction } = efficiency;
    const { reusedPercentage, potentialSavings, suggestedPairings, environmentalImpact } = wasteReduction;
    const { co2_saved, water_saved } = environmentalImpact;

    return (
      <View style={styles.wasteReductionSection}>
        <TouchableOpacity style={styles.collapsibleHeader} onPress={toggleImpactCollapse} activeOpacity={0.7}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.iconWrapper}>
              <IconSymbol size={20} name={'leaf.fill' as any} color={proto.accent} />
            </View>
            <Text style={styles.sectionTitleText}>Environmental Impact</Text>
          </View>
          <View style={styles.collapseButtonContainer}>
            <View style={styles.collapseButton}>
              <Text style={styles.collapseButtonText}>
                {isImpactCollapsed ? 'Show details' : 'Hide details'}
              </Text>
              <IconSymbol 
                size={16} 
                name={(isImpactCollapsed ? 'chevron.down' : 'chevron.up') as any} 
                color={proto.accent} 
                style={styles.collapseIcon} 
              />
            </View>
          </View>
        </TouchableOpacity>

        <Animated.View 
          style={[
            styles.collapsibleContent, 
            { 
              opacity: impactAnimatedHeight,
              maxHeight: impactAnimatedHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 500]
              })
            }
          ]}
        >
          <View style={styles.impactMessage}>
            <Text style={styles.impactText}>Your meal planning helps fight climate change by reducing food waste</Text>
          </View>

          <View style={styles.wasteMetrics}>
            <View style={[styles.metricCard, styles.environmentCard]}>
              <View style={styles.metricIconContainer}>
                <IconSymbol size={20} name='clouds' color="#4CAF50" />
              </View>
              <Text style={styles.metricValue}>{co2_saved.toFixed(1)}kg</Text>
              <Text style={styles.metricLabel}>{`CO₂ Emissions\nPrevented`}</Text>
            </View>
            <View style={[styles.metricCard, styles.environmentCard]}>
              <View style={styles.metricIconContainer}>
                <IconSymbol size={20} name="drop" color="#2196F3" />
              </View>
              <Text style={styles.metricValue}>{water_saved.toFixed(0)}L</Text>
              <Text style={styles.metricLabel}>{`Water\nSaved`}</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Ingredients Reused</Text>
              <Text style={styles.progressPercentage}>{reusedPercentage.toFixed(0)}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${reusedPercentage}%` }, reusedPercentage >= 70 ? styles.progressBarGood : styles.progressBarNeedsWork]} />
            </View>
            <Text style={styles.savingsText}>Potential savings: ${potentialSavings.toFixed(2)}</Text>
          </View>

          {suggestedPairings.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Reduce Your Carbon Footprint:</Text>
              <View style={styles.suggestionTags}>
                {suggestedPairings.map((ingredient, index) => (
                  <View key={index} style={styles.suggestionTag}>
                    <IconSymbol size={14} name={'plus' as any} color={proto.accent} />
                    <Text style={styles.suggestionText}>{ingredient}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.tipContainer}>
            <IconSymbol size={16} name={'lightbulb' as any} color={proto.accent} />
            <Text style={styles.tipText}>
              {reusedPercentage < 50
                ? "By reducing food waste, you're helping combat climate change! Try planning meals that share ingredients."
                : 'Amazing work! Your sustainable meal planning is making a real difference for our planet.'}
            </Text>
          </View>
        </Animated.View>
      </View>
    );
  };

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
        <TouchableOpacity style={styles.addButton} onPress={() => setIsModalVisible(true)}>
          <IconSymbol size={24} name={'plus' as any} color={proto.buttonText} />
        </TouchableOpacity>
      </View>

      {loading && weekPlans.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={proto.accent} />
        </View>
      ) : (
        <ScrollView style={styles.mainScrollView} showsVerticalScrollIndicator={false}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekContainer} contentContainerStyle={styles.weekContentContainer}>
            {weekPlans.map((plan, i) => (
              <TouchableOpacity key={plan.date} style={[styles.dayCard, selectedDayIndex === i && styles.dayCardSelected]} onPress={() => setSelectedDayIndex(i)}>
                <View style={styles.dayCardHeader}>
                  <Text style={[styles.dayText, selectedDayIndex === i && styles.dayTextSelected]}>{format(new Date(plan.date), 'EEE')}</Text>
                  {Object.values(plan.meals).flat().length > 0 && (
                    <View style={[styles.efficiencyIndicator, styles.optimalEfficiency]} />
                  )}
                </View>
                <Text style={[styles.dateText, selectedDayIndex === i && styles.dateTextSelected]}>{format(new Date(plan.date), 'd')}</Text>
                <View style={styles.mealDots}>
                  {Array.from({ length: Object.values(plan.meals).flat().length }).map((_, idx) => (
                    <View key={idx} style={[styles.mealDot, selectedDayIndex === i && styles.mealDotSelected]} />
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {weekPlans[selectedDayIndex] && (
            <View style={styles.contentContainer}>
              {renderWasteReductionSection(weekPlans[selectedDayIndex].efficiency)}
              <View style={styles.mealsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Meals for {format(addDays(weekStart, selectedDayIndex), 'MMM d')}</Text>
                </View>
                {renderMealSection('Breakfast', weekPlans[selectedDayIndex]?.meals.breakfast || [])}
                {renderMealSection('Lunch', weekPlans[selectedDayIndex]?.meals.lunch || [])}
                {renderMealSection('Dinner', weekPlans[selectedDayIndex]?.meals.dinner || [])}
                {renderMealSection('Snacks', weekPlans[selectedDayIndex]?.meals.snack || [])}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      <AddMealModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} onSave={addMeal} selectedDate={selectedDate} />

      <Tooltip visible={tooltipVisible} onClose={() => setTooltipVisible(false)} message={tooltipMessage} position={tooltipPosition} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: proto.background },
  mainScrollView: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: proto.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: { fontSize: 32, fontWeight: '700', color: proto.accentDark, opacity: 0.85, letterSpacing: 0.5 },
  addButton: {
    backgroundColor: proto.accent,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ rotate: '0deg' }],
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: proto.error, fontSize: 16, textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: proto.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryButtonText: { color: proto.buttonText, fontSize: 16, fontWeight: '600' },
  weekContainer: { backgroundColor: proto.background, maxHeight: 120, marginTop: 8, marginBottom: 16 },
  weekContentContainer: { alignItems: 'center', paddingVertical: 8, gap: 8, paddingHorizontal: 16 },
  dayCard: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: proto.card,
    minWidth: 80,
    minHeight: 90,
    justifyContent: 'center',
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 4,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  dayCardSelected: { backgroundColor: proto.accent, transform: [{ scale: 1.05 }], borderColor: 'rgba(255,255,255,0.2)' },
  dayCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 },
  dayText: { fontSize: 15, color: proto.textSecondary, fontWeight: '600', letterSpacing: 0.5 },
  dayTextSelected: { color: proto.buttonText },
  dateText: { fontSize: 24, color: proto.text, fontWeight: '700', marginTop: 4, letterSpacing: -0.5 },
  dateTextSelected: { color: proto.buttonText },
  mealDots: { flexDirection: 'row', marginTop: 8, gap: 3 },
  mealDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: proto.textSecondary, opacity: 0.6 },
  mealDotSelected: { backgroundColor: proto.buttonText, opacity: 0.8 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 32 },
  mealsSection: {
    backgroundColor: proto.card,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  sectionTitle: { fontSize: 24, fontWeight: '600', color: proto.text, marginBottom: 0 },
  mealSection: { marginBottom: 24 },
  mealSectionTitle: { fontSize: 20, fontWeight: '600', color: proto.text, marginBottom: 12, letterSpacing: -0.3 },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: proto.background,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  mealItemContent: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  mealText: { fontSize: 17, color: proto.text, fontWeight: '500' },
  deleteMealButton: { padding: 10, backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 12 },
  noMealsText: { color: proto.textSecondary, fontSize: 15, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12, opacity: 0.8 },
  efficiencyIndicator: { width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  optimalEfficiency: { backgroundColor: '#4CAF50' },
  goodEfficiency: { backgroundColor: '#FFA726' },
  improvableEfficiency: { backgroundColor: '#78909C' },
  tooltipOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.1)' },
  tooltipContainer: { position: 'absolute', width: 200, backgroundColor: 'transparent', alignItems: 'center' },
  tooltipContent: { backgroundColor: proto.text, padding: 12, borderRadius: 8, shadowColor: proto.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  tooltipText: { color: proto.buttonText, fontSize: 12, textAlign: 'center' },
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
  // Environmental impact section styles
  wasteReductionSection: {
    backgroundColor: proto.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  collapsibleHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  sectionTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconWrapper: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(143, 190, 157, 0.12)', alignItems: 'center', justifyContent: 'center' },
  sectionTitleText: { fontSize: 18, fontWeight: '700', color: proto.text, flex: 1 },
  collapseButtonContainer: { flexDirection: 'row', alignItems: 'center', paddingLeft: 12 },
  collapseButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(143, 190, 157, 0.08)',
  },
  collapseButtonText: { 
    color: proto.accent, 
    fontWeight: '600',
    fontSize: 14,
  },
  collapseIcon: { opacity: 0.9 },
  collapsibleContent: { 
    marginTop: 16,
    overflow: 'hidden',
  },
  impactMessage: { backgroundColor: 'rgba(143, 190, 157, 0.1)', padding: 12, borderRadius: 12, marginBottom: 12 },
  impactText: { color: proto.textSecondary, fontSize: 14 },
  wasteMetrics: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  metricCard: { flex: 1, alignItems: 'center', backgroundColor: proto.background, borderRadius: 16, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  environmentCard: {},
  metricIconContainer: { marginBottom: 6 },
  metricValue: { fontSize: 16, fontWeight: '700', color: proto.text },
  metricLabel: { fontSize: 12, color: proto.textSecondary, textAlign: 'center' },
  progressContainer: { backgroundColor: proto.background, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', marginTop: 4 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressTitle: { fontSize: 14, fontWeight: '600', color: proto.text },
  progressPercentage: { fontSize: 14, fontWeight: '700', color: proto.text },
  progressBarContainer: { height: 8, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 99, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 99 },
  progressBarGood: { backgroundColor: '#4CAF50' },
  progressBarNeedsWork: { backgroundColor: '#FFA726' },
  savingsText: { marginTop: 8, color: proto.textSecondary, fontSize: 12 },
  suggestionsContainer: { marginTop: 8 },
  suggestionsTitle: { fontSize: 14, fontWeight: '600', color: proto.text, marginBottom: 6 },
  suggestionTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: proto.background, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  suggestionText: { color: proto.text, fontSize: 12 },
  tipContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  tipText: { flex: 1, color: proto.textSecondary, fontSize: 13, lineHeight: 18 },
  deletingButton: { opacity: 0.5 },
});