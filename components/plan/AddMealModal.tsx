import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import IngredientSelector, { 
  type Ingredient, 
  type SelectedIngredient 
} from './IngredientSelector';

const proto = Colors.proto;

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface AddMealModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (
    name: string,
    type: MealType,
    ingredients: Array<{ id: string; quantity: number; unit: string; foodItemId?: string }>
  ) => Promise<void>;
  selectedDate: Date;
}

const mealTypes: { value: MealType; label: string; icon: string }[] = [
  { value: 'breakfast', label: 'Breakfast', icon: 'sunrise' },
  { value: 'lunch', label: 'Lunch', icon: 'sun.max' },
  { value: 'dinner', label: 'Dinner', icon: 'moon' },
  { value: 'snack', label: 'Snack', icon: 'heart' },
];

export default function AddMealModal({
  visible,
  onClose,
  onSave,
  selectedDate,
}: AddMealModalProps) {
  const { user } = useAuth();
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Animation refs
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const backdropAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      fetchIngredients();
      resetForm();
      animateIn();
    }
  }, [visible]);

  const resetForm = () => {
    setMealName('');
    setMealType('lunch');
    setSelectedIngredients([]);
    setSaving(false);
  };

  const animateIn = () => {
    modalAnimation.setValue(0);
    backdropAnimation.setValue(0);
    
    Animated.parallel([
      Animated.timing(backdropAnimation, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(modalAnimation, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(backdropAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback?.();
    });
  };

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('ingredients')
        .select('id, name, standard_unit')
        .order('name');
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      const processedData = (data || []).map(ingredient => ({
        ...ingredient,
        standard_unit: ingredient.standard_unit || 'g'
      }));
      
      setAvailableIngredients(processedData);
      
      // If no ingredients are available, show a helpful message
      if (processedData.length === 0) {
        console.log('No ingredients available. This might be due to database setup or permissions.');
      }
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      Alert.alert(
        'Unable to Load Ingredients',
        'There was a problem loading your ingredients. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: fetchIngredients },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleIngredientAdd = (ingredient: SelectedIngredient) => {
    setSelectedIngredients(prev => [...prev, ingredient]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleIngredientUpdate = (index: number, field: 'quantity' | 'unit', value: string | number) => {
    setSelectedIngredients(prev => {
      const updated = [...prev];
      if (field === 'quantity') {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        const validatedValue = isNaN(numValue) || numValue < 0 ? 0 : numValue;
        updated[index] = { ...updated[index], quantity: validatedValue };
      } else {
        updated[index] = { ...updated[index], unit: value as string };
      }
      return updated;
    });
  };

  const handleIngredientRemove = (index: number) => {
    setSelectedIngredients(prev => prev.filter((_, i) => i !== index));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const validateForm = (): string | null => {
    if (!mealName.trim()) {
      return 'Please enter a meal name';
    }
    
    if (selectedIngredients.length === 0) {
      return 'Please add at least one ingredient';
    }
    
    const invalidIngredient = selectedIngredients.find(ing => 
      ing.quantity <= 0 || isNaN(ing.quantity)
    );
    if (invalidIngredient) {
      return 'Please enter valid quantities for all ingredients';
    }
    
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Invalid Form', validationError);
      return;
    }
    
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await onSave(mealName.trim(), mealType, selectedIngredients);
      // Modal will be closed by parent component on success
    } catch (error) {
      console.error('Error saving meal:', error);
      setSaving(false);
      // Error is handled by parent component
    }
  };

  const handleClose = () => {
    if (saving) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateOut(() => {
      resetForm();
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={handleClose}
      animationType="none"
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.modalOverlay}
      >
        <Animated.View 
          style={[
            styles.modalBackdrop, 
            { opacity: backdropAnimation }
          ]} 
        />
        
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                {
                  translateY: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                },
                {
                  scale: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
              opacity: modalAnimation,
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.modalTitle}>
                  Add Meal for {format(selectedDate, 'MMM d')}
                </Text>
                <TouchableOpacity 
                  onPress={handleClose}
                  style={styles.closeButton}
                  disabled={saving}
                >
                  <IconSymbol 
                    size={20} 
                    name="xmark" 
                    color={saving ? proto.textSecondary : proto.text} 
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.headerDivider} />
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={proto.accent} />
                <Text style={styles.loadingText}>Loading ingredients...</Text>
              </View>
            ) : (
              <>
                <ScrollView 
                  style={styles.content}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Meal Name Input */}
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Meal Name</Text>
                    <TextInput
                      style={styles.mealNameInput}
                      value={mealName}
                      onChangeText={setMealName}
                      placeholder="e.g., Chicken Stir Fry"
                      placeholderTextColor={proto.textSecondary}
                      returnKeyType="done"
                      editable={!saving}
                    />
                  </View>

                  {/* Meal Type Selection */}
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Meal Type</Text>
                    <View style={styles.mealTypeContainer}>
                      {mealTypes.map((type) => (
                        <TouchableOpacity
                          key={type.value}
                          style={[
                            styles.mealTypeButton,
                            mealType === type.value && styles.mealTypeButtonActive,
                          ]}
                          onPress={() => {
                            setMealType(type.value);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }}
                          disabled={saving}
                        >
                          <IconSymbol 
                            size={16} 
                            name={type.icon as any} 
                            color={mealType === type.value ? proto.buttonText : proto.textSecondary} 
                          />
                          <Text style={[
                            styles.mealTypeText,
                            mealType === type.value && styles.mealTypeTextActive,
                          ]}>
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Ingredient Selection */}
                  <View style={styles.section}>
                    <IngredientSelector
                      availableIngredients={availableIngredients}
                      selectedIngredients={selectedIngredients}
                      onIngredientAdd={handleIngredientAdd}
                      onIngredientUpdate={handleIngredientUpdate}
                      onIngredientRemove={handleIngredientRemove}
                      loading={loading}
                    />
                  </View>
                </ScrollView>

                {/* Save Button */}
                <View style={styles.footer}>
                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      saving && styles.savingButton,
                    ]}
                    onPress={handleSave}
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
                </View>
              </>
            )}
          </SafeAreaView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: proto.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingTop: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: proto.text,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: proto.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 12,
  },
  mealNameInput: {
    backgroundColor: proto.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: proto.text,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  mealTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  mealTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: proto.card,
    padding: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  mealTypeButtonActive: {
    backgroundColor: proto.accent,
    borderColor: proto.accent,
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
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  saveButton: {
    backgroundColor: proto.accent,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  savingButton: {
    opacity: 0.8,
  },
  saveButtonText: {
    color: proto.buttonText,
    fontSize: 17,
    fontWeight: '600',
  },
  savingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: proto.textSecondary,
  },
});