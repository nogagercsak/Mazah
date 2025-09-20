import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { format } from 'date-fns';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const proto = Colors.proto;

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface Ingredient {
  id: string;
  name: string;
    standard_unit: string;
}

interface SelectedIngredient {
  ingredient: Ingredient;
  quantity: number;
  unit: string;
}

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

const mealTypes: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
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
  const [saving, setSaving] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchIngredients();
    }
  }, [visible]);

  const fetchIngredients = async () => {
    try {
      setLoadingIngredients(true);
      const { data, error } = await supabase
        .from('ingredients')
        .select('id, name, standard_unit')
        .limit(20); // Get first 20 ingredients for simplicity

      if (error) throw error;
      setIngredients(data || []);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      Alert.alert('Error', 'Failed to load ingredients');
    } finally {
      setLoadingIngredients(false);
    }
  };

  const addIngredient = (ingredient: Ingredient) => {
    const exists = selectedIngredients.find(si => si.ingredient.id === ingredient.id);
    if (exists) {
      Alert.alert('Already Added', 'This ingredient is already in your meal');
      return;
    }

    setSelectedIngredients([
      ...selectedIngredients,
      {
        ingredient,
        quantity: 1,
        unit: ingredient.standard_unit,
      }
    ]);
  };

  const updateIngredientQuantity = (ingredientId: string, quantity: number) => {
    setSelectedIngredients(prev =>
      prev.map(si =>
        si.ingredient.id === ingredientId
          ? { ...si, quantity }
          : si
      )
    );
  };

  const removeIngredient = (ingredientId: string) => {
    setSelectedIngredients(prev =>
      prev.filter(si => si.ingredient.id !== ingredientId)
    );
  };

  const handleSave = async () => {
    if (!mealName.trim()) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }

    if (selectedIngredients.length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient');
      return;
    }

    try {
      setSaving(true);
      const ingredientData = selectedIngredients.map(si => ({
        id: si.ingredient.id,
        quantity: si.quantity,
        unit: si.unit,
      }));

      await onSave(mealName, mealType, ingredientData);
      
      // Reset form
      setMealName('');
      setMealType('lunch');
      setSelectedIngredients([]);
    } catch (error) {
      console.error('Error saving meal:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setMealName('');
    setMealType('lunch');
    setSelectedIngredients([]);
    setSaving(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={handleClose}
      animationType="slide"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Meal for {format(selectedDate, 'MMM d')}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <IconSymbol size={20} name="xmark" color={proto.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.label}>Meal Name</Text>
              <TextInput
                style={styles.input}
                value={mealName}
                onChangeText={setMealName}
                placeholder="Enter meal name..."
                placeholderTextColor={proto.textSecondary}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Meal Type</Text>
              <View style={styles.mealTypeContainer}>
                {mealTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.mealTypeButton,
                      mealType === type.value && styles.mealTypeButtonActive,
                    ]}
                    onPress={() => setMealType(type.value)}
                  >
                    <Text
                      style={[
                        styles.mealTypeText,
                        mealType === type.value && styles.mealTypeTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Ingredients</Text>
              
              {loadingIngredients ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={proto.accent} />
                  <Text style={styles.loadingText}>Loading ingredients...</Text>
                </View>
              ) : (
                <>
                  {/* Available Ingredients */}
                  <Text style={styles.subLabel}>Available Ingredients (tap to add):</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ingredientScrollView}>
                    <View style={styles.ingredientChips}>
                      {ingredients.map((ingredient) => (
                        <TouchableOpacity
                          key={ingredient.id}
                          style={styles.ingredientChip}
                          onPress={() => addIngredient(ingredient)}
                        >
                          <Text style={styles.ingredientChipText}>{ingredient.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  {/* Selected Ingredients */}
                  {selectedIngredients.length > 0 && (
                    <>
                      <Text style={[styles.subLabel, styles.selectedIngredientsLabel]}>Selected Ingredients:</Text>
                      {selectedIngredients.map((si) => (
                        <View key={si.ingredient.id} style={styles.selectedIngredient}>
                          <View style={styles.ingredientInfo}>
                            <Text style={styles.ingredientName}>{si.ingredient.name}</Text>
                            <View style={styles.quantityContainer}>
                              <TextInput
                                style={styles.quantityInput}
                                value={si.quantity.toString()}
                                onChangeText={(text) => {
                                  const qty = parseFloat(text) || 0;
                                  updateIngredientQuantity(si.ingredient.id, qty);
                                }}
                                keyboardType="numeric"
                                placeholder="Qty"
                              />
                              <Text style={styles.unitText}>{si.unit}</Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => removeIngredient(si.ingredient.id)}
                          >
                            <IconSymbol size={16} name="xmark" color={proto.error} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </>
                  )}

                  {selectedIngredients.length === 0 && (
                    <Text style={styles.placeholder}>
                      No ingredients selected. Tap ingredients above to add them.
                    </Text>
                  )}
                </>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.savingButton]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save Meal'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: proto.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: proto.text,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: proto.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: proto.text,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  mealTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  mealTypeButton: {
    flex: 1,
    backgroundColor: proto.card,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  mealTypeButtonActive: {
    backgroundColor: proto.accent,
    borderColor: proto.accent,
  },
  mealTypeText: {
    fontSize: 14,
    color: proto.textSecondary,
    fontWeight: '600',
  },
  mealTypeTextActive: {
    color: proto.buttonText,
  },
  placeholder: {
    color: proto.textSecondary,
    fontStyle: 'italic',
    padding: 16,
    backgroundColor: proto.card,
    borderRadius: 12,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  saveButton: {
    backgroundColor: proto.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  savingButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: proto.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  // Loading styles
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: proto.text,
  },
  // Ingredient styles
  subLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: proto.text,
    marginBottom: 8,
  },
  selectedIngredientsLabel: {
    marginTop: 16,
  },
  ingredientScrollView: {
    marginBottom: 16,
  },
  ingredientChips: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  ingredientChip: {
    backgroundColor: proto.accent + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: proto.accent + '40',
  },
  ingredientChipText: {
    fontSize: 12,
    color: proto.accent,
    fontWeight: '500',
  },
  selectedIngredient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: proto.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  ingredientInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ingredientName: {
    fontSize: 14,
    color: proto.text,
    fontWeight: '500',
    flex: 1,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: proto.border,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    color: proto.text,
    width: 60,
    textAlign: 'center',
  },
  unitText: {
    fontSize: 12,
    color: proto.textSecondary,
    marginLeft: 4,
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
  },
});