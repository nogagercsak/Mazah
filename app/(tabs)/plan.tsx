import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  GestureResponderEvent,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDays, format, startOfWeek } from 'date-fns';
import { Picker } from '@react-native-picker/picker';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { DayPlan, Meal, MealType } from '@/lib/supabase';

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

interface AddMealModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (
    name: string,
    type: MealType,
    ingredients: Array<{ id: string; quantity: number; unit: string; foodItemId?: string }>
  ) => Promise<void> | void;
  selectedDate: Date;
}

const AddMealModal: React.FC<AddMealModalProps> = ({ visible, onClose, onSave, selectedDate }) => {
  const { user } = useAuth();
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [ingredients, setIngredients] = useState<Array<{ id: string; quantity: number; unit: string }>>([]);
  const [availableIngredients, setAvailableIngredients] = useState<Array<{ id: string; name: string; standard_unit: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [editingIngredientIndex, setEditingIngredientIndex] = useState<number | null>(null);
  const [noIngredientsAvailable, setNoIngredientsAvailable] = useState(false);
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const backdropAnimation = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const commonUnits = ['g', 'kg', 'ml', 'L', 'cup', 'tbsp', 'tsp', 'oz', 'lb', 'piece', 'pinch', 'handful'];

  useEffect(() => {
    if (visible) {
      fetchIngredients();
      setMealName('');
      setMealType('lunch');
      setIngredients([]);
      setSaving(false);
      modalAnimation.setValue(0);
      backdropAnimation.setValue(0);
      Animated.timing(backdropAnimation, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      Animated.spring(modalAnimation, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }).start();
    }
  }, [visible]);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('ingredients').select('id, name, standard_unit').order('name');
      if (error) throw error;
      if (!data || data.length === 0) setNoIngredientsAvailable(true);
      else {
        setNoIngredientsAvailable(false);
        setAvailableIngredients(data);
      }
    } catch (err) {
      if (__DEV__) console.error('Error fetching ingredients:', err);
      Alert.alert('Error', 'Failed to load ingredients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    if (noIngredientsAvailable) {
      Alert.alert('No Ingredients Available', 'You need to add ingredients to your inventory first. Go to the Inventory tab to add ingredients.', [{ text: 'OK', style: 'default' }]);
      return;
    }
    if (availableIngredients.length > 0) {
      const newIngredient = { id: availableIngredients[0].id, quantity: 1, unit: availableIngredients[0].standard_unit };
      setIngredients(prev => [...prev, newIngredient]);
      setEditingIngredientIndex(ingredients.length);
      setShowIngredientPicker(true);
    }
  };

  const updateIngredient = (index: number, field: 'id' | 'quantity' | 'unit', value: string | number) => {
    const updated = [...ingredients];
    if (field === 'id') {
      const selected = availableIngredients.find(ing => ing.id === value);
      if (selected) updated[index] = { ...updated[index], id: value as string, unit: selected.standard_unit };
    } else if (field === 'quantity') {
      updated[index] = { ...updated[index], quantity: value as number };
    } else {
      updated[index] = { ...updated[index], unit: value as string };
    }
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
    if (editingIngredientIndex === index) {
      setEditingIngredientIndex(null);
      setShowIngredientPicker(false);
    } else if (editingIngredientIndex !== null && editingIngredientIndex > index) {
      setEditingIngredientIndex(editingIngredientIndex - 1);
    }
  };

  const handleSave = async () => {
    if (!mealName.trim()) {
      Alert.alert('Missing Information', 'Please enter a meal name');
      return;
    }
    if (ingredients.length === 0) {
      Alert.alert('Missing Information', 'Please add at least one ingredient to your meal');
      return;
    }
    const invalid = ingredients.find(ing => ing.quantity <= 0 || isNaN(ing.quantity));
    if (invalid) {
      Alert.alert('Invalid Quantity', 'Please enter valid quantities for all ingredients');
      return;
    }
    setSaving(true);
    try {
      await onSave(mealName, mealType, ingredients);
      setMealName('');
      setMealType('lunch');
      setIngredients([]);
      setSaving(false);
    } catch (e) {
      setSaving(false);
      Alert.alert('Error', 'Failed to save meal. Please try again.');
    }
  };

  const animatePress = (cb?: () => void) => {
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => cb?.());
  };

  const renderIngredientPicker = () => (
    <Modal transparent visible={showIngredientPicker} animationType="slide" onRequestClose={() => setShowIngredientPicker(false)}>
      <TouchableOpacity style={styles.pickerModalOverlay} activeOpacity={1} onPress={() => setShowIngredientPicker(false)}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Ingredient</Text>
            <TouchableOpacity onPress={() => setShowIngredientPicker(false)} style={styles.pickerDoneButton}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
          <Picker
            selectedValue={editingIngredientIndex !== null && ingredients[editingIngredientIndex] ? ingredients[editingIngredientIndex].id : availableIngredients[0]?.id}
            onValueChange={value => {
              if (editingIngredientIndex !== null && ingredients[editingIngredientIndex]) {
                updateIngredient(editingIngredientIndex, 'id', value);
              }
            }}
            style={styles.picker}
          >
            {availableIngredients.map(ing => (
              <Picker.Item key={ing.id} label={ing.name} value={ing.id} color={proto.text} />
            ))}
          </Picker>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderUnitPicker = () => (
    <Modal transparent visible={showUnitPicker} animationType="slide" onRequestClose={() => setShowUnitPicker(false)}>
      <TouchableOpacity style={styles.pickerModalOverlay} activeOpacity={1} onPress={() => setShowUnitPicker(false)}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Unit</Text>
            <TouchableOpacity onPress={() => setShowUnitPicker(false)} style={styles.pickerDoneButton}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
          <Picker
            selectedValue={editingIngredientIndex !== null && ingredients[editingIngredientIndex] ? ingredients[editingIngredientIndex].unit : commonUnits[0]}
            onValueChange={value => {
              if (editingIngredientIndex !== null && ingredients[editingIngredientIndex]) {
                updateIngredient(editingIngredientIndex, 'unit', value);
                setShowUnitPicker(false);
              }
            }}
            style={styles.picker}
          >
            {commonUnits.map(unit => (
              <Picker.Item key={unit} label={unit} value={unit} color={proto.text} />
            ))}
          </Picker>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const handleClose = () => {
    if (saving) return;
    Animated.parallel([
      Animated.timing(backdropAnimation, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(modalAnimation, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={handleClose} animationType="none">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <Animated.View style={[styles.modalBackdrop, { opacity: backdropAnimation }]} />
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [
                { translateY: modalAnimation.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) },
                { scale: modalAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
              ],
              opacity: modalAnimation,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <Text style={styles.modalTitle}>Add Meal for {format(selectedDate, 'MMM d')}</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} disabled={saving}>
                <View style={[styles.closeButtonInner, saving && styles.disabledButton]}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.headerDivider} />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={proto.accent} />
              <Text style={styles.loadingText}>Loading ingredients...</Text>
            </View>
          ) : noIngredientsAvailable ? (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIcon}>
                <IconSymbol size={48} name={"exclamationmark.triangle" as any} color={proto.textSecondary} />
              </View>
              <Text style={styles.emptyStateTitle}>No Ingredients Available</Text>
              <Text style={styles.emptyStateMessage}>You need to add ingredients to your inventory first before creating meals.</Text>
              <TouchableOpacity style={styles.emptyStateButton} onPress={handleClose}>
                <Text style={styles.emptyStateButtonText}>Go to Inventory</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView style={styles.modalScrollView}>
                <View style={styles.modalContent}>
                  <View style={styles.inputSection}>
                    <Text style={styles.sectionLabel}>Meal Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={mealName}
                      onChangeText={setMealName}
                      placeholder="e.g., Chicken Stir Fry"
                      placeholderTextColor={proto.textSecondary}
                      returnKeyType="done"
                      editable={!saving}
                    />
                  </View>

                  <View style={styles.mealTypeSection}>
                    <Text style={styles.sectionLabel}>Meal Type</Text>
                    <View style={styles.mealTypeContainer}>
                      {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(type => (
                        <TouchableOpacity
                          key={type}
                          style={[styles.mealTypeButton, mealType === type && styles.mealTypeButtonActive]}
                          onPress={() => setMealType(type)}
                          activeOpacity={0.8}
                          disabled={saving}
                        >
                          <Text style={[styles.mealTypeText, mealType === type && styles.mealTypeTextActive]}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.ingredientsSection}>
                    <Text style={styles.sectionLabel}>Ingredients *</Text>
                    {ingredients.length === 0 && (
                      <View style={styles.noIngredientsCard}>
                        <IconSymbol size={20} name={"info.circle" as any} color={proto.textSecondary} />
                        <Text style={styles.noIngredientsText}>Add at least one ingredient to your meal</Text>
                      </View>
                    )}
                    {ingredients.map((ingredient, index) => (
                      <View key={index} style={styles.ingredientCard}>
                        <TouchableOpacity
                          style={styles.ingredientSelector}
                          onPress={() => {
                            Keyboard.dismiss();
                            setEditingIngredientIndex(index);
                            setShowIngredientPicker(true);
                          }}
                          disabled={saving}
                        >
                          <Text style={styles.ingredientName}>
                            {availableIngredients.find(ing => ing.id === ingredient.id)?.name || 'Select ingredient'}
                          </Text>
                          <IconSymbol size={16} name={"chevron.right" as any} color={proto.textSecondary} />
                        </TouchableOpacity>

                        <View style={styles.quantityContainer}>
                          <View style={styles.quantityInputWrapper}>
                            <TextInput
                              style={styles.quantityInput}
                              value={ingredient.quantity.toString()}
                              onChangeText={value => updateIngredient(index, 'quantity', parseFloat(value) || 0)}
                              keyboardType="decimal-pad"
                              placeholder="Qty"
                              placeholderTextColor={proto.textSecondary}
                              editable={!saving}
                            />
                          </View>

                          <TouchableOpacity
                            style={styles.unitSelector}
                            onPress={() => {
                              Keyboard.dismiss();
                              setEditingIngredientIndex(index);
                              setShowUnitPicker(true);
                            }}
                            disabled={saving}
                          >
                            <Text style={styles.unitText}>{ingredient.unit}</Text>
                            <IconSymbol size={12} name={"chevron.right" as any} color={proto.textSecondary} />
                          </TouchableOpacity>

                          <TouchableOpacity style={styles.removeButton} onPress={() => removeIngredient(index)} disabled={saving}>
                            <IconSymbol size={16} name={"trash" as any} color={proto.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}

                    <TouchableOpacity style={[styles.addIngredientButton, saving && styles.disabledButton]} onPress={addIngredient} activeOpacity={0.8} disabled={saving}>
                      <IconSymbol size={18} name={"plus" as any} color={proto.accent} />
                      <Text style={styles.addIngredientText}>Add Ingredient</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>

              <Animated.View style={[styles.saveButtonContainer, { transform: [{ scale: buttonScale }] }]}>
                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.savingButton]}
                  onPress={() => {
                    if (!saving) {
                      animatePress(() => {
                        Keyboard.dismiss();
                        handleSave();
                      });
                    }
                  }}
                  activeOpacity={0.9}
                  disabled={saving}
                >
                  {saving ? (
                    <View style={styles.savingContent}>
                      <ActivityIndicator size="small" color={proto.buttonText} />
                      <Text style={styles.saveButtonText}>Saving...</Text>
                    </View>
                  ) : (
                    <Text style={styles.saveButtonText}>Save Meal</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
      {renderIngredientPicker()}
      {renderUnitPicker()}
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
  const [isImpactCollapsed, setIsImpactCollapsed] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const impactAnimatedHeight = useRef(new Animated.Value(1)).current;
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
      Alert.alert('Error', 'You must be logged in to add meals');
      return;
    }

    try {
      // Start a transaction
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert({
          name,
          user_id: user.id,
        })
        .select()
        .single();

      if (mealError) throw mealError;

      const { error: planError } = await supabase
        .from('meal_plans')
        .insert({
          date: selectedDate.toISOString().split('T')[0],
          meal_id: meal.id,
          user_id: user.id,
          meal_type: mealType,
        });

      if (planError) throw planError;

      // Add ingredients and update inventory
      for (const ingredient of ingredients) {
        // Add meal ingredient
        const { error: ingredientError } = await supabase
          .from('meal_ingredients')
          .insert({
            meal_id: meal.id,
            ingredient_id: ingredient.id,
            food_item_id: ingredient.foodItemId,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
          });

        if (ingredientError) throw ingredientError;

        // Update inventory if a food item was selected
        if (ingredient.foodItemId) {
          const { data: foodItem, error: foodItemError } = await supabase
            .from('food_items')
            .select('remaining_quantity')
            .eq('id', ingredient.foodItemId)
            .single();

          if (foodItemError) throw foodItemError;

          const newQuantity = foodItem.remaining_quantity - ingredient.quantity;
          
          if (newQuantity < 0) {
            throw new Error(`Not enough quantity available for ${ingredient.id}`);
          }

          const { error: updateError } = await supabase
            .from('food_items')
            .update({ remaining_quantity: newQuantity })
            .eq('id', ingredient.foodItemId);

          if (updateError) throw updateError;
        }
      }

      setIsModalVisible(false);
      fetchWeekPlans();
      Alert.alert('Success', 'Meal added successfully!');
    } catch (err) {
      if (__DEV__) console.error('Error adding meal:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add meal');
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
        <TouchableOpacity style={styles.collapsibleHeader} onPress={() => setIsImpactCollapsed(!isImpactCollapsed)} activeOpacity={0.8}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.iconWrapper}>
              <IconSymbol size={24} name={'leaf.fill' as any} color={proto.accent} />
            </View>
            <Text style={styles.sectionTitleText}>Environmental Impact</Text>
          </View>
          <View style={styles.collapseButtonContainer}>
            <Pressable style={styles.collapseButton}>
              <Text style={styles.collapseButtonText}>{isImpactCollapsed ? 'Show details' : 'Hide details'}</Text>
              <IconSymbol size={20} name={(isImpactCollapsed ? 'chevron.right' : 'chevron.left') as any} color={proto.accent} style={styles.collapseIcon} />
            </Pressable>
          </View>
        </TouchableOpacity>

        <Animated.View style={[styles.collapsibleContent, { opacity: impactAnimatedHeight }]}>
          <View style={styles.impactMessage}>
            <Text style={styles.impactText}>Your meal planning helps fight climate change by reducing food waste</Text>
          </View>

          <View style={styles.wasteMetrics}>
            <View style={[styles.metricCard, styles.environmentCard]}>
              <View style={styles.metricIconContainer}>
                <IconSymbol size={20} name={'calendar' as any} color="#4CAF50" />
              </View>
              <Text style={styles.metricValue}>{co2_saved.toFixed(1)}kg</Text>
              <Text style={styles.metricLabel}>{`CO₂ Emissions\nPrevented`}</Text>
            </View>
            <View style={[styles.metricCard, styles.environmentCard]}>
              <View style={styles.metricIconContainer}>
                <IconSymbol size={20} name={'drop' as any} color="#2196F3" />
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
  headerTitle: { fontSize: 34, fontWeight: '700', color: proto.accentDark, opacity: 0.9, letterSpacing: -0.5 },
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
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  bottomSheet: {
    backgroundColor: proto.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ translateY: 0 }],
  },
  modalHeader: { paddingTop: 12 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  headerDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)' },
  modalTitle: { fontSize: 20, fontWeight: '600', color: proto.text, letterSpacing: -0.5 },
  closeButton: { position: 'relative', width: 32, height: 32, justifyContent: 'center', alignItems: 'center', borderRadius: 16, marginRight: -8 },
  closeButtonInner: { backgroundColor: proto.accent, width: '100%', height: '100%', borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: proto.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  closeButtonText: { color: proto.buttonText, fontSize: 18, fontWeight: '600', lineHeight: 20, textAlign: 'center' },
  modalScrollView: { maxHeight: '100%' },
  modalContent: { padding: 20 },
  inputSection: { marginBottom: 24 },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: proto.text, marginBottom: 12 },
  input: { backgroundColor: proto.card, borderRadius: 12, padding: 16, fontSize: 16, color: proto.text, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  mealTypeSection: { marginBottom: 32 },
  mealTypeContainer: { flexDirection: 'row', gap: 8 },
  mealTypeButton: { flex: 1, backgroundColor: proto.card, padding: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  mealTypeButtonActive: { backgroundColor: proto.accent, borderColor: 'transparent' },
  mealTypeText: { fontSize: 15, color: proto.textSecondary, fontWeight: '600' },
  mealTypeTextActive: { color: proto.buttonText },
  ingredientsSection: { marginBottom: 24 },
  ingredientCard: { backgroundColor: proto.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', shadowColor: proto.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  ingredientSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  ingredientName: { fontSize: 16, color: proto.text, fontWeight: '500' },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quantityInputWrapper: { flex: 1, backgroundColor: proto.background, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  quantityInput: { padding: 12, fontSize: 16, color: proto.text },
  unitSelector: { backgroundColor: proto.background, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 100, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  unitText: { fontSize: 16, color: proto.text },
  removeButton: { padding: 12, backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,59,48,0.2)', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  addIngredientButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(143, 190, 157, 0.1)', borderRadius: 16, padding: 16, gap: 8, borderWidth: 1, borderColor: 'rgba(143, 190, 157, 0.2)' },
  addIngredientText: { fontSize: 16, color: proto.accent, fontWeight: '500' },
  saveButtonContainer: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', backgroundColor: proto.background },
  saveButton: { backgroundColor: proto.accent, padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: proto.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveButtonText: { color: proto.buttonText, fontSize: 17, fontWeight: '600' },
  savingButton: { opacity: 0.8 },
  savingContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  disabledButton: { opacity: 0.5 },
  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyStateIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 193, 7, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyStateTitle: { fontSize: 20, fontWeight: '600', color: proto.text, marginBottom: 12, textAlign: 'center' },
  emptyStateMessage: { fontSize: 16, color: proto.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  emptyStateButton: { backgroundColor: proto.accent, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 16 },
  emptyStateButtonText: { color: proto.buttonText, fontSize: 16, fontWeight: '600' },
  noIngredientsCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 193, 7, 0.1)', borderRadius: 12, padding: 12, marginBottom: 12, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 193, 7, 0.2)' },
  noIngredientsText: { flex: 1, fontSize: 14, color: proto.textSecondary, lineHeight: 20 },
  loadingText: { marginTop: 12, fontSize: 16, color: proto.textSecondary },
  // Picker modal styles
  pickerModalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  pickerContainer: {
    backgroundColor: proto.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  pickerTitle: { fontSize: 16, fontWeight: '600', color: proto.text },
  pickerDoneButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: proto.accent },
  pickerDoneText: { color: proto.buttonText, fontWeight: '600' },
  picker: { height: 220, color: proto.text },
  // Environmental impact section styles
  wasteReductionSection: {
    backgroundColor: proto.card,
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  collapsibleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrapper: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(143, 190, 157, 0.12)', alignItems: 'center', justifyContent: 'center' },
  sectionTitleText: { fontSize: 18, fontWeight: '700', color: proto.text },
  collapseButtonContainer: { flexDirection: 'row', alignItems: 'center' },
  collapseButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  collapseButtonText: { color: proto.accent, fontWeight: '600' },
  collapseIcon: { opacity: 0.9 },
  collapsibleContent: { marginTop: 12 },
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