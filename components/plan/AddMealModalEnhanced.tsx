import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
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
  name: string;
  remaining_quantity: number;
  expiration_date: string;
  storage_location?: string;
}

interface MealSuggestion {
  name: string;
  ingredients: Array<{ name: string; quantity: number; unit: string }>;
  type: MealType;
  co2Impact: string;
  cookingTime: string;
  difficulty: string;
  description: string;
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

const mealTypes: { value: MealType; label: string;}[] = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch'},
    { value: 'dinner', label: 'Dinner'},
    { value: 'snack', label: 'Snack'},
];

const ingredientCategories = [
  { id: 'all', name: 'All', icon: 'square.grid.2x2' },
  { id: 'vegetables', name: 'Vegetables'},
  { id: 'fruits', name: 'Fruits'},
  { id: 'proteins', name: 'Proteins'},
  { id: 'grains', name: 'Grains'},
  { id: 'dairy', name: 'Dairy'},
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
    co2Impact: "Low",
    cookingTime: "15 min",
    difficulty: "Easy",
    description: "Fresh and nutritious bowl packed with Mediterranean flavors"
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
    co2Impact: "Very Low",
    cookingTime: "5 min",
    difficulty: "Easy",
    description: "Energizing green smoothie to start your day right"
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
    co2Impact: "Low",
    cookingTime: "20 min",
    difficulty: "Medium",
    description: "Colorful stir-fry with seasonal vegetables and aromatic spices"
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
  
  // UI state
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Animation values (persist across renders)
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      resetForm();
      fetchData();
      // Reset and fade in to avoid staying invisible
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const resetForm = () => {
    setStep('method');
    setMealName('');
    setMealType('lunch');
    setSelectedIngredients([]);
    setSearchQuery('');
    setSelectedCategory('all');
    setShowSuggestions(false);
  };

  const handleButtonPress = (callback: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    callback();
  };

  const fetchData = async () => {
    try {
      setLoadingIngredients(true);
      
      // Fetch ingredients
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('id, name, standard_unit, category, co2_per_kg')
        .order('name');

      if (ingredientsError) {
        console.error('Error fetching ingredients:', ingredientsError);
        throw ingredientsError;
      }
      setIngredients(ingredientsData || []);

      // Fetch user's inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('food_items')
        .select('id, name, remaining_quantity, expiration_date, storage_location')
        .eq('user_id', user?.id)
        .gt('remaining_quantity', 0)
        .order('expiration_date');

      if (inventoryError) {
        console.error('Error fetching inventory:', inventoryError);
        throw inventoryError;
      }
      
      setUserInventory(inventoryData || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data. Please check your connection and try again.');
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Already Added', 'This ingredient is already in your meal');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  // Simple toggle to add/remove ingredient without quantity editing
  const toggleIngredient = (ingredient: Ingredient) => {
    const exists = selectedIngredients.some(si => si.ingredient.id === ingredient.id);
    if (exists) {
      setSelectedIngredients(prev => prev.filter(si => si.ingredient.id !== ingredient.id));
    } else {
      setSelectedIngredients(prev => ([
        ...prev,
        { ingredient, quantity: 1, unit: ingredient.standard_unit },
      ]));
    }
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
      const ingredientData = selectedIngredients.map(si => ({
        id: si.ingredient.id,
        quantity: si.quantity,
        unit: si.unit,
      }));

      await onSave(mealName, mealType, ingredientData);
      
      resetForm();
    } catch (error) {
      console.error('Error saving meal:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderMethodSelection = () => (
    <Animated.View style={[styles.methodContainer, { opacity: fadeAnim }]}>
      <Text style={styles.methodTitle}>How would you like to add your meal?</Text>
      
      <TouchableOpacity 
        style={styles.methodOption}
        onPress={() => handleButtonPress(() => setStep('suggestion'))}
        activeOpacity={0.8}
      >
        <View style={styles.methodIconContainer}>
          <IconSymbol size={28} name="lightbulb" color={proto.accent} />
        </View>
        <View style={styles.methodTextContainer}>
          <Text style={styles.methodOptionTitle}>Get Suggestions</Text>
          <Text style={styles.methodOptionSubtitle}>
            Choose from eco-friendly meal ideas based on low-impact ingredients
          </Text>
        </View>
        <IconSymbol size={18} name="chevron.right" color={proto.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.methodOption}
        onPress={() => handleButtonPress(() => setStep('manual'))}
        activeOpacity={0.8}
      >
        <View style={styles.methodIconContainer}>
          <IconSymbol size={28} name="plus" color={proto.accent} />
        </View>
        <View style={styles.methodTextContainer}>
          <Text style={styles.methodOptionTitle}>Create Custom Meal</Text>
          <Text style={styles.methodOptionSubtitle}>
            Build your own meal from scratch with full ingredient control
          </Text>
        </View>
        <IconSymbol size={18} name="chevron.right" color={proto.textSecondary} />
      </TouchableOpacity>

      {userInventory.length > 0 && (
        <Animated.View style={[styles.inventoryPreview, { 
          opacity: fadeAnim,
          transform: [{ translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}]
        }]}>
          <View style={styles.inventoryHeader}>
            <IconSymbol size={18} name="cabinet" color={proto.accent} />
            <Text style={styles.inventoryHeaderText}>Your Expiring Soon</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {userInventory.slice(0, 5).map(item => (
              <View key={item.id} style={styles.inventoryItem}>
                <Text style={styles.inventoryItemName}>{item.name}</Text>
                <Text style={styles.inventoryItemQuantity}>
                  {item.remaining_quantity} units
                </Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </Animated.View>
  );

  const renderSuggestions = () => (
    <View style={styles.suggestionsContainer}>
      {/* Title handled by top header to avoid duplication */}
      <Text style={styles.suggestionsSubtitle}>
        Eco-friendly meals designed to minimize environmental impact
      </Text>
      
      <FlatList
        data={mealSuggestions}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.suggestionCard}
            onPress={() => handleButtonPress(() => applySuggestion(item))}
            activeOpacity={0.8}
          >
            <View style={styles.suggestionHeader}>
              <View style={styles.suggestionTitleContainer}>
                <Text style={styles.suggestionName}>{item.name}</Text>
                <Text style={styles.suggestionDescription}>{item.description}</Text>
              </View>
              <View style={[styles.impactBadge, 
                item.co2Impact === 'Very Low' ? styles.veryLowImpact :
                item.co2Impact === 'Low' ? styles.lowImpact : styles.mediumImpact
              ]}>
                <Text style={styles.impactText}>{item.co2Impact} CO₂</Text>
              </View>
            </View>
            
            <View style={styles.suggestionMeta}>
              <View style={styles.metaItem}>
                <IconSymbol size={14} name="clock" color={proto.textSecondary} />
                <Text style={styles.metaText}>{item.cookingTime}</Text>
              </View>
              <View style={styles.metaItem}>
                <IconSymbol size={14} name="star" color={proto.textSecondary} />
                <Text style={styles.metaText}>{item.difficulty}</Text>
              </View>
              <View style={styles.metaItem}>
                <IconSymbol size={14} name="list.bullet" color={proto.textSecondary} />
                <Text style={styles.metaText}>{item.ingredients.length} items</Text>
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
      {/* Title handled by top header to avoid duplication */}
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
            <IconSymbol size={18} name="magnifyingglass" color={proto.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search ingredients..."
              placeholderTextColor={proto.textSecondary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => handleButtonPress(() => setSearchQuery(''))}
                style={styles.clearButton}
              >
                <IconSymbol size={16} name="xmark.circle.fill" color={proto.textSecondary} />
              </TouchableOpacity>
            )}
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
                  size={16} 
                  name={category.icon as any} 
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
            <View style={styles.inventorySectionHeader}>
              <Text style={styles.inventoryTitle}>From Your Pantry</Text>
              <Text style={styles.inventorySubtitle}>Use these before they expire</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {userInventory.map((item) => {
                const daysToExpiry = Math.ceil((new Date(item.expiration_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const isExpiringSoon = daysToExpiry <= 3;
                // Check if an ingredient with similar name exists
                const matchingIngredient = ingredients.find(ing => 
                  ing.name.toLowerCase().includes(item.name.toLowerCase()) ||
                  item.name.toLowerCase().includes(ing.name.toLowerCase())
                );
                const isSelected = matchingIngredient && selectedIngredients.some(si => si.ingredient.id === matchingIngredient.id);
                
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.inventoryCard,
                      isExpiringSoon && styles.inventoryCardExpiring,
                      isSelected && styles.inventoryCardSelected
                    ]}
                    onPress={() => {
                      if (matchingIngredient) {
                        handleButtonPress(() => toggleIngredient(matchingIngredient));
                      }
                    }}
                    activeOpacity={0.8}
                    disabled={!matchingIngredient}
                  >
                    <View style={styles.inventoryCardHeader}>
                      <Text style={[
                        styles.inventoryCardName,
                        isSelected && styles.inventoryCardNameSelected
                      ]}>
                        {item.name}
                      </Text>
                      {isSelected && (
                        <View style={styles.inventorySelectedBadge}>
                          <IconSymbol size={10} name="checkmark" color="white" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.inventoryCardQuantity}>
                      {item.remaining_quantity} units
                    </Text>
                    <View style={styles.inventoryCardFooter}>
                      <Text style={[
                        styles.inventoryCardExpiry,
                        isExpiringSoon && styles.inventoryCardExpiryWarning
                      ]}>
                        {isExpiringSoon ? `${daysToExpiry}d left` : format(new Date(item.expiration_date), 'MMM d')}
                      </Text>
                      {isExpiringSoon && (
                        <IconSymbol size={12} name="exclamationmark.triangle.fill" color="#FF6B35" />
                      )}
                    </View>
                    {!matchingIngredient && (
                      <Text style={styles.noMatchText}>No ingredient match</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
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
            {filteredIngredients.slice(0, 20).map((ingredient) => {
              const isSelected = selectedIngredients.some(si => si.ingredient.id === ingredient.id);
              return (
                <TouchableOpacity
                  key={ingredient.id}
                  style={[
                    styles.ingredientCard,
                    isSelected && styles.ingredientCardSelected
                  ]}
                  onPress={() => handleButtonPress(() => toggleIngredient(ingredient))}
                  activeOpacity={0.7}
                >
                  <View style={styles.ingredientCardContent}>
                    <Text style={[
                      styles.ingredientCardName,
                      isSelected && styles.ingredientCardNameSelected
                    ]}>
                      {ingredient.name}
                    </Text>
                    {ingredient.co2_per_kg && (
                      <Text style={[
                        styles.ingredientCardImpact,
                        isSelected && styles.ingredientCardImpactSelected
                      ]}>
                        {ingredient.co2_per_kg < 1 ? 'Low' : ingredient.co2_per_kg < 3 ? 'Med' : 'High'} CO₂
                      </Text>
                    )}
                  </View>
                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <IconSymbol size={12} name="checkmark" color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Selected Ingredients removed to reduce complexity */}
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            {step !== 'method' ? (
              <TouchableOpacity onPress={() => setStep('method')} style={styles.headerBackButton}>
                <IconSymbol size={20} name="chevron.left" color={proto.accent} />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerBackButtonPlaceholder} />
            )}
            <Text style={styles.title}>
              {step === 'method' ? 'Add Meal' : 
               step === 'suggestion' ? 'Meal Suggestions' : 
               'Create Meal'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <IconSymbol size={24} name="xmark" color={proto.text} />
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
    padding: 24,
    paddingTop: 60,
    backgroundColor: proto.card,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    shadowColor: proto.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: proto.text,
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  headerBackButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  headerBackButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  
  // Method Selection
  methodContainer: {
    flex: 1,
    padding: 24,
  },
  methodTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 28,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: proto.card,
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: proto.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  methodIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: proto.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  methodTextContainer: {
    flex: 1,
  },
  methodOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  methodOptionSubtitle: {
    fontSize: 15,
    color: proto.textSecondary,
    lineHeight: 22,
  },
  
  // Inventory Preview
  inventoryPreview: {
    marginTop: 32,
    padding: 20,
    backgroundColor: proto.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: proto.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  inventoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inventoryHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
    marginLeft: 10,
    letterSpacing: -0.2,
  },
  inventoryItem: {
    backgroundColor: proto.background,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 110,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  inventoryItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 2,
  },
  inventoryItemQuantity: {
    fontSize: 12,
    color: proto.textSecondary,
  },
  
  // Suggestions
  suggestionsContainer: {
    flex: 1,
    padding: 24,
  },
  // suggestionsHeader/backButton/title removed to avoid duplicate titles (header now owns title)
  suggestionsSubtitle: {
    fontSize: 16,
    color: proto.textSecondary,
    marginBottom: 28,
    lineHeight: 24,
  },
  suggestionCard: {
    backgroundColor: proto.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: proto.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  suggestionTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  suggestionName: {
    fontSize: 18,
    fontWeight: '600',
    color: proto.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 13,
    color: proto.textSecondary,
    lineHeight: 18,
  },
  suggestionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: proto.textSecondary,
    fontWeight: '500',
  },
  impactBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: proto.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
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
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
  },
  suggestionIngredients: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestionIngredient: {
    fontSize: 13,
    color: proto.textSecondary,
    backgroundColor: proto.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontWeight: '500',
  },
  customButton: {
    alignItems: 'center',
    padding: 20,
    marginTop: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  customButtonText: {
    fontSize: 16,
    color: proto.accent,
    fontWeight: '600',
    letterSpacing: -0.2,
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
    gap: 8,
  },
  mealTypeButtonActive: {
    backgroundColor: proto.accent,
    borderColor: proto.accent,
  },
  mealTypeText: {
    fontSize: 12,
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
  clearButton: {
    padding: 4,
    marginLeft: 8,
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
  inventorySectionHeader: {
    marginBottom: 12,
  },
  inventoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 2,
  },
  inventorySubtitle: {
    fontSize: 13,
    color: proto.textSecondary,
  },
  inventoryCard: {
    backgroundColor: proto.accent + '10',
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    minWidth: 130,
    borderWidth: 1,
    borderColor: proto.accent + '20',
    position: 'relative',
  },
  inventoryCardExpiring: {
    borderColor: '#FF6B35',
    borderWidth: 2,
    backgroundColor: '#FF6B35' + '15',
  },
  inventoryCardSelected: {
    backgroundColor: proto.accent + '25',
    borderColor: proto.accent,
    borderWidth: 2,
  },
  inventoryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  inventoryCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: proto.text,
    flex: 1,
  },
  inventoryCardNameSelected: {
    color: proto.accent,
  },
  inventorySelectedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: proto.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  inventoryCardQuantity: {
    fontSize: 12,
    color: proto.textSecondary,
    marginBottom: 8,
  },
  inventoryCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inventoryCardExpiry: {
    fontSize: 11,
    color: proto.accent,
    fontWeight: '500',
  },
  inventoryCardExpiryWarning: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  noMatchText: {
    fontSize: 10,
    color: proto.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
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
    position: 'relative',
  },
  ingredientCardSelected: {
    backgroundColor: proto.accent + '20',
    borderColor: proto.accent,
    borderWidth: 2,
  },
  ingredientCardContent: {
    alignItems: 'center',
  },
  ingredientCardName: {
    fontSize: 12,
    fontWeight: '500',
    color: proto.text,
    textAlign: 'center',
  },
  ingredientCardNameSelected: {
    color: proto.accent,
    fontWeight: '600',
  },
  ingredientCardImpact: {
    fontSize: 10,
    color: proto.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  ingredientCardImpactSelected: {
    color: proto.accent,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: proto.accent,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: proto.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: proto.border,
  },
  quantityButton: {
    padding: 8,
    backgroundColor: proto.card,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  quantityInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: proto.text,
    width: 60,
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  unitText: {
    fontSize: 12,
    color: proto.textSecondary,
    marginLeft: 8,
    marginRight: 4,
    fontWeight: '500',
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
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
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    backgroundColor: proto.card,
  },
  saveButton: {
    backgroundColor: proto.accent,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: proto.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  savingButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: proto.buttonText,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
});