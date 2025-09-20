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
  FlatList,
  Dimensions,
} from 'react-native';
import { format } from 'date-fns';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const proto = Colors.proto;
const { width } = Dimensions.get('window');

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface Ingredient {
  id: string;
  name: string;
  standard_unit: string;
  category?: string;
  co2_per_kg?: number;
}

interface SelectedIngredient {
  ingredient: Ingredient;
  quantity: number;
  unit: string;
}

interface FoodItem {
  id: string;
  ingredient_id: string;
  remaining_quantity: number;
  expiration_date: string;
  ingredient: Ingredient;
}

interface MealSuggestion {
  name: string;
  ingredients: Array<{ name: string; quantity: number; unit: string }>;
  type: MealType;
  co2Impact: string;
}

interface AddMealModalEnhancedProps {
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
  { value: 'breakfast', label: 'Breakfast', icon: 'lightbulb' },
  { value: 'lunch', label: 'Lunch', icon: 'star' },
  { value: 'dinner', label: 'Dinner', icon: 'clock' },
  { value: 'snack', label: 'Snack', icon: 'plus' },
];

const ingredientCategories = [
  { id: 'all', name: 'All', icon: 'square.grid.2x2' },
  { id: 'vegetables', name: 'Vegetables', icon: 'leaf.fill' },
  { id: 'fruits', name: 'Fruits', icon: 'star' },
  { id: 'proteins', name: 'Proteins', icon: 'fork.knife' },
  { id: 'grains', name: 'Grains', icon: 'plus' },
  { id: 'dairy', name: 'Dairy', icon: 'drop' },
];

const mealSuggestions: MealSuggestion[] = [
  {
    name: "Mediterranean Bowl",
    type: "lunch",
    ingredients: [
      { name: "quinoa", quantity: 1, unit: "cup" },
      { name: "cucumber", quantity: 1, unit: "piece" },
      { name: "tomato", quantity: 2, unit: "pieces" },
      { name: "olive oil", quantity: 2, unit: "tbsp" }
    ],
    co2Impact: "Low"
  },
  {
    name: "Green Smoothie",
    type: "breakfast", 
    ingredients: [
      { name: "spinach", quantity: 2, unit: "cups" },
      { name: "banana", quantity: 1, unit: "piece" },
      { name: "apple", quantity: 1, unit: "piece" },
      { name: "water", quantity: 1, unit: "cup" }
    ],
    co2Impact: "Very Low"
  },
  {
    name: "Veggie Stir-fry",
    type: "dinner",
    ingredients: [
      { name: "broccoli", quantity: 2, unit: "cups" },
      { name: "bell pepper", quantity: 1, unit: "piece" },
      { name: "carrot", quantity: 2, unit: "pieces" },
      { name: "rice", quantity: 1, unit: "cup" }
    ],
    co2Impact: "Low"
  }
];

export default function AddMealModalEnhanced({
  visible,
  onClose,
  onSave,
  selectedDate,
}: AddMealModalEnhancedProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'method' | 'manual' | 'suggestion'>('method');
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [saving, setSaving] = useState(false);
  
  // Ingredient data
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const [userInventory, setUserInventory] = useState<FoodItem[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  
  // Search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (visible) {
      resetForm();
      fetchData();
    }
  }, [visible]);

  const resetForm = () => {
    setStep('method');
    setMealName('');
    setMealType('lunch');
    setSelectedIngredients([]);
    setSearchQuery('');
    setSelectedCategory('all');
  };

  const fetchData = async () => {
    try {
      setLoadingIngredients(true);
      
      // Fetch ingredients
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('id, name, standard_unit, category, co2_per_kg')
        .order('name');

      if (ingredientsError) throw ingredientsError;
      setIngredients(ingredientsData || []);

      // Fetch user's inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('food_items')
        .select(`
          id,
          ingredient_id,
          remaining_quantity,
          expiration_date,
          ingredient:ingredients (id, name, standard_unit)
        `)
        .eq('user_id', user?.id)
        .gt('remaining_quantity', 0)
        .order('expiration_date');

      if (inventoryError) throw inventoryError;
      
      // Transform the data to match our interface
      const transformedInventory = inventoryData?.map(item => ({
        ...item,
        ingredient: Array.isArray(item.ingredient) ? item.ingredient[0] : item.ingredient
      })) || [];
      
      setUserInventory(transformedInventory as FoodItem[]);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoadingIngredients(false);
    }
  };

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ingredient.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addIngredient = (ingredient: Ingredient, fromInventory?: FoodItem) => {
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

  const applySuggestion = (suggestion: MealSuggestion) => {
    setMealName(suggestion.name);
    setMealType(suggestion.type);
    
    // Find matching ingredients
    const suggestionIngredients: SelectedIngredient[] = [];
    for (const suggestionIng of suggestion.ingredients) {
      const ingredient = ingredients.find(ing => 
        ing.name.toLowerCase().includes(suggestionIng.name.toLowerCase())
      );
      if (ingredient) {
        suggestionIngredients.push({
          ingredient,
          quantity: suggestionIng.quantity,
          unit: suggestionIng.unit,
        });
      }
    }
    
    setSelectedIngredients(suggestionIngredients);
    setStep('manual');
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
      const ingredientData = selectedIngredients.map(si => {
        // Check if this ingredient has inventory
        const inventoryItem = userInventory.find(fi => fi.ingredient_id === si.ingredient.id);
        return {
          id: si.ingredient.id,
          quantity: si.quantity,
          unit: si.unit,
          foodItemId: inventoryItem?.id,
        };
      });

      await onSave(mealName, mealType, ingredientData);
      
      resetForm();
    } catch (error) {
      console.error('Error saving meal:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderMethodSelection = () => (
    <View style={styles.methodContainer}>
      <Text style={styles.methodTitle}>How would you like to add your meal?</Text>
      
      <TouchableOpacity 
        style={styles.methodOption}
        onPress={() => setStep('suggestion')}
      >
        <View style={styles.methodIconContainer}>
          <IconSymbol size={24} name="lightbulb" color={proto.accent} />
        </View>
        <View style={styles.methodTextContainer}>
          <Text style={styles.methodOptionTitle}>Get Suggestions</Text>
          <Text style={styles.methodOptionSubtitle}>
            Choose from eco-friendly meal ideas based on low-impact ingredients
          </Text>
        </View>
        <IconSymbol size={16} name="chevron.right" color={proto.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.methodOption}
        onPress={() => setStep('manual')}
      >
        <View style={styles.methodIconContainer}>
          <IconSymbol size={24} name="plus" color={proto.accent} />
        </View>
        <View style={styles.methodTextContainer}>
          <Text style={styles.methodOptionTitle}>Create Custom Meal</Text>
          <Text style={styles.methodOptionSubtitle}>
            Build your own meal from scratch with full ingredient control
          </Text>
        </View>
        <IconSymbol size={16} name="chevron.right" color={proto.textSecondary} />
      </TouchableOpacity>

      {userInventory.length > 0 && (
        <View style={styles.inventoryPreview}>
          <View style={styles.inventoryHeader}>
            <IconSymbol size={16} name="cabinet" color={proto.accent} />
            <Text style={styles.inventoryHeaderText}>Your Expiring Soon</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {userInventory.slice(0, 5).map(item => (
              <View key={item.id} style={styles.inventoryItem}>
                <Text style={styles.inventoryItemName}>{item.ingredient.name}</Text>
                <Text style={styles.inventoryItemQuantity}>
                  {item.remaining_quantity} {item.ingredient.standard_unit}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderSuggestions = () => (
    <View style={styles.suggestionsContainer}>
      <View style={styles.suggestionsHeader}>
        <TouchableOpacity onPress={() => setStep('method')} style={styles.backButton}>
          <IconSymbol size={20} name="chevron.left" color={proto.accent} />
        </TouchableOpacity>
        <Text style={styles.suggestionsTitle}>Meal Suggestions</Text>
      </View>
      
      <Text style={styles.suggestionsSubtitle}>
        Eco-friendly meals designed to minimize environmental impact
      </Text>
      
      <FlatList
        data={mealSuggestions}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.suggestionCard}
            onPress={() => applySuggestion(item)}
          >
            <View style={styles.suggestionHeader}>
              <Text style={styles.suggestionName}>{item.name}</Text>
              <View style={[styles.impactBadge, 
                item.co2Impact === 'Very Low' ? styles.veryLowImpact :
                item.co2Impact === 'Low' ? styles.lowImpact : styles.mediumImpact
              ]}>
                <Text style={styles.impactText}>{item.co2Impact} CO₂</Text>
              </View>
            </View>
            <View style={styles.suggestionIngredients}>
              {item.ingredients.map((ing, index) => (
                <Text key={index} style={styles.suggestionIngredient}>
                  {ing.quantity} {ing.unit} {ing.name}
                </Text>
              ))}
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => index.toString()}
        showsVerticalScrollIndicator={false}
      />
      
      <TouchableOpacity 
        style={styles.customButton}
        onPress={() => setStep('manual')}
      >
        <Text style={styles.customButtonText}>Or create your own meal</Text>
      </TouchableOpacity>
    </View>
  );

  const renderManualEntry = () => (
    <View style={styles.manualContainer}>
      <View style={styles.manualHeader}>
        <TouchableOpacity onPress={() => setStep('method')} style={styles.backButton}>
          <IconSymbol size={20} name="chevron.left" color={proto.accent} />
        </TouchableOpacity>
        <Text style={styles.manualTitle}>Create Meal</Text>
      </View>

      <ScrollView style={styles.formScrollView}>
        {/* Meal Name Input */}
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

        {/* Meal Type Selection */}
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
                <IconSymbol 
                  size={16} 
                  name={type.icon} 
                  color={mealType === type.value ? proto.buttonText : proto.textSecondary} 
                />
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

        {/* Search and Categories */}
        <View style={styles.section}>
          <Text style={styles.label}>Add Ingredients</Text>
          
          <View style={styles.searchContainer}>
            <IconSymbol size={16} name="magnifyingglass" color={proto.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search ingredients..."
              placeholderTextColor={proto.textSecondary}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
            {ingredientCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <IconSymbol 
                  size={14} 
                  name={category.icon} 
                  color={selectedCategory === category.id ? proto.buttonText : proto.accent} 
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.categoryTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Inventory Items */}
        {userInventory.length > 0 && (
          <View style={styles.inventorySection}>
            <Text style={styles.inventoryTitle}>From Your Pantry</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {userInventory.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.inventoryCard}
                  onPress={() => addIngredient(item.ingredient, item)}
                >
                  <Text style={styles.inventoryCardName}>{item.ingredient.name}</Text>
                  <Text style={styles.inventoryCardQuantity}>
                    {item.remaining_quantity} {item.ingredient.standard_unit}
                  </Text>
                  <Text style={styles.inventoryCardExpiry}>
                    Exp: {format(new Date(item.expiration_date), 'MMM d')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Ingredient List */}
        {loadingIngredients ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={proto.accent} />
            <Text style={styles.loadingText}>Loading ingredients...</Text>
          </View>
        ) : (
          <View style={styles.ingredientsGrid}>
            {filteredIngredients.slice(0, 20).map((ingredient) => (
              <TouchableOpacity
                key={ingredient.id}
                style={styles.ingredientCard}
                onPress={() => addIngredient(ingredient)}
              >
                <Text style={styles.ingredientCardName}>{ingredient.name}</Text>
                {ingredient.co2_per_kg && (
                  <Text style={styles.ingredientCardImpact}>
                    {ingredient.co2_per_kg < 1 ? 'Low' : ingredient.co2_per_kg < 3 ? 'Med' : 'High'} CO₂
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Selected Ingredients */}
        {selectedIngredients.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.selectedTitle}>Selected Ingredients ({selectedIngredients.length})</Text>
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
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 'method' ? 'Add Meal' : 
               step === 'suggestion' ? 'Meal Suggestions' : 
               'Create Meal'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {step === 'method' && renderMethodSelection()}
          {step === 'suggestion' && renderSuggestions()}
          {step === 'manual' && renderManualEntry()}

          {step === 'manual' && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.savingButton]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Meal</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: proto.background,
  },
  container: {
    flex: 1,
    backgroundColor: proto.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: proto.text,
  },
  closeButton: {
    padding: 8,
    backgroundColor: proto.card,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: proto.text,
    fontWeight: '600',
  },
  
  // Method Selection
  methodContainer: {
    flex: 1,
    padding: 20,
  },
  methodTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: proto.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  methodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: proto.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodTextContainer: {
    flex: 1,
  },
  methodOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 4,
  },
  methodOptionSubtitle: {
    fontSize: 14,
    color: proto.textSecondary,
    lineHeight: 20,
  },
  
  // Inventory Preview
  inventoryPreview: {
    marginTop: 24,
    padding: 16,
    backgroundColor: proto.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  inventoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inventoryHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: proto.text,
    marginLeft: 8,
  },
  inventoryItem: {
    backgroundColor: proto.background,
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 100,
  },
  inventoryItemName: {
    fontSize: 12,
    fontWeight: '500',
    color: proto.text,
  },
  inventoryItemQuantity: {
    fontSize: 11,
    color: proto.textSecondary,
    marginTop: 2,
  },
  
  // Suggestions
  suggestionsContainer: {
    flex: 1,
    padding: 20,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  suggestionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: proto.text,
  },
  suggestionsSubtitle: {
    fontSize: 14,
    color: proto.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  suggestionCard: {
    backgroundColor: proto.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
    flex: 1,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  veryLowImpact: {
    backgroundColor: '#4CAF50',
  },
  lowImpact: {
    backgroundColor: '#8BC34A',
  },
  mediumImpact: {
    backgroundColor: '#FFC107',
  },
  impactText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  suggestionIngredients: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionIngredient: {
    fontSize: 12,
    color: proto.textSecondary,
    backgroundColor: proto.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  customButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 20,
  },
  customButtonText: {
    fontSize: 14,
    color: proto.accent,
    fontWeight: '500',
  },
  
  // Manual Entry
  manualContainer: {
    flex: 1,
  },
  manualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  manualTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: proto.text,
    marginLeft: 12,
  },
  formScrollView: {
    flex: 1,
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
  
  // Meal Type
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
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    gap: 6,
  },
  mealTypeButtonActive: {
    backgroundColor: proto.accent,
    borderColor: proto.accent,
  },
  mealTypeText: {
    fontSize: 11,
    color: proto.textSecondary,
    fontWeight: '600',
  },
  mealTypeTextActive: {
    color: proto.buttonText,
  },
  
  // Search and Categories
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: proto.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: proto.text,
    marginLeft: 12,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: proto.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: proto.accent + '40',
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: proto.accent,
    borderColor: proto.accent,
  },
  categoryText: {
    fontSize: 12,
    color: proto.accent,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: proto.buttonText,
  },
  
  // Inventory Section
  inventorySection: {
    marginBottom: 20,
  },
  inventoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 12,
  },
  inventoryCard: {
    backgroundColor: proto.accent + '10',
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 120,
    borderWidth: 1,
    borderColor: proto.accent + '20',
  },
  inventoryCardName: {
    fontSize: 13,
    fontWeight: '600',
    color: proto.text,
  },
  inventoryCardQuantity: {
    fontSize: 11,
    color: proto.textSecondary,
    marginTop: 2,
  },
  inventoryCardExpiry: {
    fontSize: 10,
    color: proto.accent,
    marginTop: 4,
    fontWeight: '500',
  },
  
  // Ingredients Grid
  ingredientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  ingredientCard: {
    backgroundColor: proto.card,
    padding: 12,
    borderRadius: 12,
    width: (width - 56) / 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  ingredientCardName: {
    fontSize: 12,
    fontWeight: '500',
    color: proto.text,
    textAlign: 'center',
  },
  ingredientCardImpact: {
    fontSize: 10,
    color: proto.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  
  // Selected Ingredients
  selectedSection: {
    marginTop: 20,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 12,
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
    backgroundColor: proto.error + '20',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  removeButtonText: {
    fontSize: 18,
    color: proto.error,
    fontWeight: '600',
  },
  
  // Loading
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
  
  // Footer
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
});